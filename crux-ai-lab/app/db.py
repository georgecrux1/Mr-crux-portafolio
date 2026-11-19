"""Persistencia SQLite (stdlib, sin ORM)."""
from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import settings

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,              -- mock | anthropic | openai_compatible | http_endpoint
    config TEXT NOT NULL,            -- JSON sin secretos (solo NOMBRES de variables de entorno)
    authorized INTEGER NOT NULL,     -- confirmación expresa de autorización
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER NOT NULL REFERENCES targets(id),
    target_name TEXT NOT NULL,
    model_label TEXT NOT NULL,
    status TEXT NOT NULL,            -- queued | running | stopped | completed | failed | budget_exceeded
    requested INTEGER NOT NULL,
    executed INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    review INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    token_budget INTEGER NOT NULL,
    rpm INTEGER NOT NULL,
    seed INTEGER NOT NULL,
    message TEXT,
    started_at TEXT NOT NULL,
    finished_at TEXT
);
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    category TEXT NOT NULL,
    technique TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    verdict TEXT NOT NULL,           -- PASS | FAIL | REVIEW | ERROR
    vulnerability TEXT,
    evidence TEXT,
    risk TEXT NOT NULL,              -- ninguno | bajo | medio | alto | critico
    recommendation TEXT,
    latency_ms INTEGER,
    tokens INTEGER,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_run ON results(run_id);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(settings.db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _conn.execute("PRAGMA foreign_keys = ON")
        _conn.execute("PRAGMA journal_mode = WAL")
        _conn.executescript(SCHEMA)
    return _conn


def reset_for_tests(path: str) -> None:
    global _conn
    if _conn is not None:
        _conn.close()
    _conn = None
    settings.db_path = path


def execute(sql: str, params: tuple = ()) -> int:
    with _lock:
        cur = get_conn().execute(sql, params)
        get_conn().commit()
        return cur.lastrowid or 0


def query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with _lock:
        rows = get_conn().execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def query_one(sql: str, params: tuple = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


# ---- targets -------------------------------------------------------------

def create_target(name: str, kind: str, config: dict, authorized: bool) -> int:
    return execute(
        "INSERT INTO targets(name, kind, config, authorized, created_at) VALUES (?,?,?,?,?)",
        (name, kind, json.dumps(config), int(authorized), now()),
    )


def get_target(target_id: int) -> dict | None:
    t = query_one("SELECT * FROM targets WHERE id=?", (target_id,))
    if t:
        t["config"] = json.loads(t["config"])
        t["authorized"] = bool(t["authorized"])
    return t


def list_targets() -> list[dict]:
    out = query("SELECT * FROM targets ORDER BY id DESC")
    for t in out:
        t["config"] = json.loads(t["config"])
        t["authorized"] = bool(t["authorized"])
    return out


def delete_target(target_id: int) -> None:
    execute("DELETE FROM results WHERE run_id IN (SELECT id FROM runs WHERE target_id=?)", (target_id,))
    execute("DELETE FROM runs WHERE target_id=?", (target_id,))
    execute("DELETE FROM targets WHERE id=?", (target_id,))
