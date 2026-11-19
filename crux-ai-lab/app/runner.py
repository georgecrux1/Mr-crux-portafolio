"""Ejecución de lotes: límite de peticiones/minuto, concurrencia, presupuesto de tokens,
corte por errores consecutivos y parada manual."""
from __future__ import annotations

import asyncio
import random
import time
from dataclasses import dataclass, field

from . import db
from .analyzer import analyze
from .catalog import generate
from .config import settings
from .connectors import ConnectorError, build_connector

MAX_CONSECUTIVE_ERRORS = 5


class RateLimiter:
    def __init__(self, rpm: int):
        self.interval = 60.0 / max(1, rpm)
        self._next = 0.0
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        async with self._lock:
            now = time.monotonic()
            delay = self._next - now
            self._next = max(now, self._next) + self.interval
        if delay > 0:
            await asyncio.sleep(delay)


@dataclass
class RunState:
    stop: asyncio.Event = field(default_factory=asyncio.Event)
    task: asyncio.Task | None = None
    reason: str = ""


RUNS: dict[int, RunState] = {}


def create_run(target: dict, size: int, rpm: int, token_budget: int, concurrency: int,
               categories: list[str] | None, seed: int | None) -> int:
    seed = seed if seed is not None else random.randrange(1, 2**31)
    label = target["config"].get("model") or target["config"].get("level") or target["kind"]
    run_id = db.execute(
        """INSERT INTO runs(target_id, target_name, model_label, status, requested, token_budget, rpm, seed, started_at, message)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (target["id"], target["name"], f"{target['kind']}:{label}", "queued", size, token_budget, rpm, seed, db.now(),
         ",".join(categories) if categories else None),
    )
    state = RunState()
    RUNS[run_id] = state
    state.task = asyncio.create_task(_execute(run_id, target, size, rpm, token_budget, concurrency, categories, seed, state))
    return run_id


def stop_run(run_id: int) -> bool:
    st = RUNS.get(run_id)
    if not st:
        return False
    st.reason = "Detenido por el usuario"
    st.stop.set()
    return True


async def _execute(run_id, target, size, rpm, token_budget, concurrency, categories, seed, state: RunState):
    try:
        connector = build_connector(target)
    except ConnectorError as e:
        db.execute("UPDATE runs SET status='failed', message=?, finished_at=? WHERE id=?", (str(e), db.now(), run_id))
        RUNS.pop(run_id, None)
        return
    tests = generate(size, seed=seed, categories=categories)
    secrets = dict(target["config"].get("secrets") or {})
    secrets["custom_canaries"] = target["config"].get("canaries") or []
    lab_prompt = target["kind"] in ("mock", "anthropic") or (
        target["kind"] == "openai_compatible" and target["config"].get("use_lab_prompt", True))
    limiter = RateLimiter(min(rpm, settings.max_requests_per_minute))
    sem = asyncio.Semaphore(max(1, min(concurrency, settings.max_concurrency)))
    counters = {"tokens": 0, "consecutive_errors": 0}
    db.execute("UPDATE runs SET status='running' WHERE id=?", (run_id,))

    async def one(tc):
        async with sem:
            if state.stop.is_set():
                return
            await limiter.wait()
            if state.stop.is_set():
                return
            error, text, latency, tokens = None, None, None, 0
            try:
                res = await connector.send(tc.messages)
                text, latency, tokens = res.text, res.latency_ms, res.tokens
                counters["consecutive_errors"] = 0
            except ConnectorError as e:
                error = str(e)
            except Exception as e:  # noqa: BLE001 - registrar y seguir
                error = f"{type(e).__name__}"
            if error:
                counters["consecutive_errors"] += 1
                if counters["consecutive_errors"] >= MAX_CONSECUTIVE_ERRORS and not state.stop.is_set():
                    state.reason = f"Detenido tras {MAX_CONSECUTIVE_ERRORS} errores consecutivos: {error}"
                    state.stop.set()
            v = analyze(tc, text, secrets, error=error, lab_prompt=lab_prompt)
            counters["tokens"] += tokens
            db.execute(
                """INSERT INTO results(run_id, test_id, category, technique, prompt, response, verdict, vulnerability,
                   evidence, risk, recommendation, latency_ms, tokens, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (run_id, tc.test_id, tc.category, tc.technique, tc.transcript(), text, v.verdict, v.vulnerability,
                 v.evidence, v.risk, v.recommendation, latency, tokens, db.now()),
            )
            col = {"PASS": "passed", "FAIL": "failed", "REVIEW": "review", "ERROR": "errors"}[v.verdict]
            db.execute(f"UPDATE runs SET executed=executed+1, {col}={col}+1, tokens_used=? WHERE id=?",
                       (counters["tokens"], run_id))
            if counters["tokens"] >= token_budget and not state.stop.is_set():
                state.reason = f"Presupuesto de tokens agotado ({counters['tokens']}/{token_budget})"
                state.stop.set()

    try:
        await asyncio.gather(*(one(tc) for tc in tests))
        if state.reason.startswith("Presupuesto"):
            status = "budget_exceeded"
        elif state.stop.is_set():
            status = "stopped"
        else:
            status = "completed"
        db.execute("UPDATE runs SET status=?, message=COALESCE(?, message), finished_at=? WHERE id=?",
                   (status, state.reason or None, db.now(), run_id))
    except Exception as e:  # noqa: BLE001
        db.execute("UPDATE runs SET status='failed', message=?, finished_at=? WHERE id=?", (f"Error interno: {type(e).__name__}", db.now(), run_id))
    finally:
        await connector.aclose()
        RUNS.pop(run_id, None)


def recover_interrupted() -> None:
    """Al arrancar, marca como detenidas las ejecuciones que quedaron a medias."""
    db.execute("UPDATE runs SET status='stopped', message='Interrumpida por reinicio del servidor', finished_at=? "
               "WHERE status IN ('queued','running')", (db.now(),))
