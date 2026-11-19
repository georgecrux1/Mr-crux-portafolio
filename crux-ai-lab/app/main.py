"""CRUX AI LAB — API FastAPI + frontend estático."""
from __future__ import annotations

import hmac
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from . import db, runner
from .catalog import CATEGORIES, generate, unique_combinations
from .config import settings
from .connectors import ConnectorError, build_connector, validate_target_url
from .profile import new_secrets
from .reports import category_breakdown, to_csv, to_pdf

STATIC = Path(__file__).parent / "static"
SIZES = [10, 50, 100, 500]
ENV_NAME_RE = r"^[A-Z_][A-Z0-9_]{0,63}$"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.get_conn()
    runner.recover_interrupted()
    if not db.list_targets():
        db.create_target("Demo · chatbot simulado (parcial)", "mock", {"level": "parcial", "secrets": new_secrets()}, True)
    yield


app = FastAPI(title="CRUX AI LAB", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def security(request: Request, call_next):
    path = request.url.path
    if settings.access_token and path.startswith("/api") and path != "/api/health":
        sent = request.headers.get("x-access-token", "")
        if not hmac.compare_digest(sent, settings.access_token):
            return JSONResponse({"detail": "Token de acceso requerido"}, status_code=401)
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'")
    return resp


# ---------------------------------------------------------------- esquemas

class TargetIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    kind: Literal["mock", "anthropic", "openai_compatible", "http_endpoint"]
    authorized: bool
    # comunes
    system_extra: str = Field(default="", max_length=4000)
    canaries: list[str] = Field(default_factory=list, max_length=20)
    # mock
    level: Literal["vulnerable", "parcial", "robusto"] = "parcial"
    # anthropic / openai
    model: str = Field(default="", max_length=100)
    effort: Literal["low", "medium", "high"] = "low"
    max_tokens: int = Field(default=1024, ge=64, le=8192)
    api_key_env: str = Field(default="", max_length=64)
    base_url: str = Field(default="", max_length=500)
    use_lab_prompt: bool = True
    # http_endpoint
    url: str = Field(default="", max_length=500)
    message_field: str = Field(default="message", max_length=64)
    history_field: str = Field(default="history", max_length=64)
    response_path: str = Field(default="reply", max_length=128)
    auth_env: str = Field(default="", max_length=64)
    auth_header: str = Field(default="Authorization", max_length=64)
    auth_prefix: str = Field(default="Bearer ", max_length=20)
    extra_body: dict = Field(default_factory=dict)

    @field_validator("api_key_env", "auth_env")
    @classmethod
    def env_name(cls, v: str) -> str:
        import re
        v = v.strip()
        if v and not re.match(ENV_NAME_RE, v):
            raise ValueError("Indica el NOMBRE de la variable de entorno (p. ej. MI_BOT_TOKEN), no la clave.")
        return v


class RunIn(BaseModel):
    target_id: int
    size: int
    rpm: int = Field(default=60, ge=1, le=6000)
    token_budget: int = Field(default=0, ge=0, le=50_000_000)
    concurrency: int = Field(default=2, ge=1, le=16)
    categories: list[str] | None = None
    seed: int | None = None


def _public_target(t: dict) -> dict:
    """Vista para el navegador: sin secretos sembrados completos."""
    cfg = {k: v for k, v in t["config"].items() if k != "secrets"}
    for k in ("api_key_env", "auth_env"):
        if cfg.get(k):
            cfg[k + "_set"] = bool(os.getenv(cfg[k]))
    if t["config"].get("secrets"):
        cfg["canary_hint"] = t["config"]["secrets"]["canary"][:10] + "…"
    return {**t, "config": cfg}


# ---------------------------------------------------------------- rutas

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "CRUX AI LAB"}


@app.get("/api/meta")
def meta():
    return {
        "categories": [{"key": k, "label": v["label"], "risk": v["risk"]} for k, v in CATEGORIES.items()],
        "sizes": SIZES,
        "unique_tests": unique_combinations(),
        "limits": {"max_tests_per_run": settings.max_tests_per_run, "max_rpm": settings.max_requests_per_minute,
                   "max_concurrency": settings.max_concurrency, "default_token_budget": settings.default_token_budget},
        "env": {"ANTHROPIC_API_KEY": bool(os.getenv("ANTHROPIC_API_KEY")), "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY"))},
        "auth_required": bool(settings.access_token),
    }


@app.get("/api/targets")
def list_targets():
    return [_public_target(t) for t in db.list_targets()]


@app.post("/api/targets", status_code=201)
def create_target(t: TargetIn):
    if not t.authorized:
        raise HTTPException(400, "Debes confirmar que el chatbot es tuyo o que tienes autorización expresa para probarlo.")
    cfg: dict = {"system_extra": t.system_extra, "canaries": [c for c in t.canaries if c.strip()]}
    if t.kind == "mock":
        cfg.update(level=t.level, secrets=new_secrets())
    elif t.kind == "anthropic":
        cfg.update(model=t.model or "claude-opus-5-5", effort=t.effort, max_tokens=t.max_tokens,
                   api_key_env=t.api_key_env or "ANTHROPIC_API_KEY", secrets=new_secrets())
    elif t.kind == "openai_compatible":
        if not t.base_url or not t.model:
            raise HTTPException(400, "base_url y model son obligatorios.")
        cfg.update(base_url=t.base_url, model=t.model, max_tokens=min(t.max_tokens, 4096), api_key_env=t.api_key_env,
                   use_lab_prompt=t.use_lab_prompt, secrets=new_secrets() if t.use_lab_prompt else {})
    else:
        if not t.url:
            raise HTTPException(400, "La URL del endpoint es obligatoria.")
        cfg.update(url=t.url, message_field=t.message_field, history_field=t.history_field, response_path=t.response_path,
                   auth_env=t.auth_env, auth_header=t.auth_header, auth_prefix=t.auth_prefix, extra_body=t.extra_body, secrets={})
    for key in ("base_url", "url"):
        if cfg.get(key):
            try:
                validate_target_url(cfg[key])
            except ConnectorError as e:
                raise HTTPException(400, str(e)) from e
    tid = db.create_target(t.name, t.kind, cfg, True)
    return _public_target(db.get_target(tid))


@app.delete("/api/targets/{target_id}")
def delete_target(target_id: int):
    if any(r["target_id"] == target_id for r in db.query("SELECT target_id FROM runs WHERE status IN ('queued','running')")):
        raise HTTPException(409, "Hay una ejecución en curso para este objetivo.")
    db.delete_target(target_id)
    return {"ok": True}


@app.post("/api/targets/{target_id}/check")
async def check_target(target_id: int):
    """Verificación REAL de conexión: envía un saludo inocuo y devuelve la respuesta."""
    t = db.get_target(target_id)
    if not t:
        raise HTTPException(404, "Objetivo no encontrado")
    try:
        c = build_connector(t)
        try:
            r = await c.send([{"role": "user", "content": "Hola, ¿qué puedes hacer por mí? Responde en una frase."}])
        finally:
            await c.aclose()
    except ConnectorError as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "model": r.model, "latency_ms": r.latency_ms, "reply": r.text[:500]}


@app.get("/api/catalog/preview")
def catalog_preview(n: int = 16, seed: int = 7):
    n = max(1, min(n, 100))
    return [{"test_id": tc.test_id, "category": tc.category, "technique": tc.technique, "marker": tc.marker,
             "messages": tc.messages} for tc in generate(n, seed=seed)]


@app.post("/api/runs", status_code=201)
async def start_run(body: RunIn):
    if body.size not in SIZES or body.size > settings.max_tests_per_run:
        raise HTTPException(400, f"Tamaño no permitido. Opciones: {[s for s in SIZES if s <= settings.max_tests_per_run]}")
    t = db.get_target(body.target_id)
    if not t:
        raise HTTPException(404, "Objetivo no encontrado")
    if not t["authorized"]:
        raise HTTPException(403, "Objetivo sin autorización registrada")
    if body.categories:
        bad = [c for c in body.categories if c not in CATEGORIES]
        if bad:
            raise HTTPException(400, f"Categorías desconocidas: {bad}")
    if db.query_one("SELECT id FROM runs WHERE target_id=? AND status IN ('queued','running')", (t["id"],)):
        raise HTTPException(409, "Ya hay una ejecución en curso para este objetivo.")
    budget = body.token_budget or settings.default_token_budget
    run_id = runner.create_run(t, body.size, body.rpm, budget, body.concurrency, body.categories, body.seed)
    return db.query_one("SELECT * FROM runs WHERE id=?", (run_id,))


@app.get("/api/runs")
def list_runs(limit: int = 100):
    return db.query("SELECT * FROM runs ORDER BY id DESC LIMIT ?", (max(1, min(limit, 1000)),))


@app.get("/api/runs/{run_id}")
def get_run(run_id: int):
    r = db.query_one("SELECT * FROM runs WHERE id=?", (run_id,))
    if not r:
        raise HTTPException(404, "Ejecución no encontrada")
    results = db.query("SELECT category, verdict FROM results WHERE run_id=?", (run_id,))
    r["breakdown"] = category_breakdown(results)
    return r


@app.post("/api/runs/{run_id}/stop")
def stop(run_id: int):
    if not runner.stop_run(run_id):
        raise HTTPException(404, "La ejecución no está en curso")
    return {"ok": True}


@app.delete("/api/runs/{run_id}")
def delete_run(run_id: int):
    if run_id in runner.RUNS:
        raise HTTPException(409, "Detén la ejecución antes de borrarla")
    db.execute("DELETE FROM results WHERE run_id=?", (run_id,))
    db.execute("DELETE FROM runs WHERE id=?", (run_id,))
    return {"ok": True}


@app.get("/api/runs/{run_id}/results")
def results(run_id: int, verdict: str | None = None, category: str | None = None, limit: int = 500, offset: int = 0):
    sql, params = "SELECT * FROM results WHERE run_id=?", [run_id]
    if verdict:
        sql += " AND verdict=?"
        params.append(verdict)
    if category:
        sql += " AND category=?"
        params.append(category)
    sql += " ORDER BY id LIMIT ? OFFSET ?"
    params += [max(1, min(limit, 1000)), max(0, offset)]
    return db.query(sql, tuple(params))


def _run_and_results(run_id: int):
    run = db.query_one("SELECT * FROM runs WHERE id=?", (run_id,))
    if not run:
        raise HTTPException(404, "Ejecución no encontrada")
    return run, db.query("SELECT * FROM results WHERE run_id=? ORDER BY id", (run_id,))


@app.get("/api/runs/{run_id}/report.csv")
def report_csv(run_id: int):
    _, res = _run_and_results(run_id)
    return Response(to_csv(res), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="crux-run-{run_id}.csv"'})


@app.get("/api/runs/{run_id}/report.pdf")
def report_pdf(run_id: int):
    run, res = _run_and_results(run_id)
    return Response(to_pdf(run, res), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="crux-run-{run_id}.pdf"'})


@app.get("/api/stats")
def stats():
    s = db.query_one("""SELECT COUNT(*) runs, COALESCE(SUM(executed),0) total, COALESCE(SUM(passed),0) passed,
                        COALESCE(SUM(failed),0) failed, COALESCE(SUM(review),0) review, COALESCE(SUM(errors),0) errors,
                        COALESCE(SUM(tokens_used),0) tokens FROM runs""")
    s["vulnerability_types"] = db.query(
        """SELECT category, vulnerability, risk, COUNT(*) n FROM results WHERE verdict='FAIL'
           GROUP BY category, vulnerability, risk ORDER BY n DESC LIMIT 20""")
    s["by_risk"] = db.query("SELECT risk, COUNT(*) n FROM results WHERE verdict='FAIL' GROUP BY risk")
    return s


@app.get("/api/compare")
def compare():
    """Comparación entre modelos/objetivos (todas sus ejecuciones agregadas)."""
    rows = db.query("""SELECT ru.model_label, ru.target_name, re.category, re.verdict, COUNT(*) n
                       FROM results re JOIN runs ru ON ru.id = re.run_id
                       GROUP BY ru.model_label, ru.target_name, re.category, re.verdict""")
    out: dict[str, dict] = {}
    for r in rows:
        key = f"{r['target_name']} ({r['model_label']})"
        m = out.setdefault(key, {"label": key, "PASS": 0, "FAIL": 0, "REVIEW": 0, "ERROR": 0, "categories": {}})
        m[r["verdict"]] += r["n"]
        c = m["categories"].setdefault(r["category"], {"PASS": 0, "FAIL": 0, "REVIEW": 0, "ERROR": 0})
        c[r["verdict"]] += r["n"]
    res = []
    for m in out.values():
        valid = m["PASS"] + m["FAIL"] + m["REVIEW"]
        m["pass_rate"] = round(100 * m["PASS"] / valid, 1) if valid else None
        for c in m["categories"].values():
            v = c["PASS"] + c["FAIL"] + c["REVIEW"]
            c["pass_rate"] = round(100 * c["PASS"] / v, 1) if v else None
        res.append(m)
    return sorted(res, key=lambda m: -(m["pass_rate"] or 0))


app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/favicon.ico")
def favicon():
    return FileResponse(STATIC / "favicon.svg", media_type="image/svg+xml")
