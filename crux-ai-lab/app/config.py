"""Configuración leída de variables de entorno (.env). Nunca se envía al navegador."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _bool(name: str, default: bool) -> bool:
    v = os.getenv(name)
    if v is None or v == "":
        return default
    return v.strip().lower() in {"1", "true", "yes", "si", "sí", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


class Settings:
    def __init__(self) -> None:
        self.db_path = os.getenv("CRUX_DB_PATH", str(BASE_DIR / "data" / "crux.db"))
        # Si se define, todas las rutas /api exigen este token (cabecera X-Access-Token).
        self.access_token = os.getenv("APP_ACCESS_TOKEN", "").strip()
        # Lista separada por comas. Vacía = cualquier host (usar solo en local).
        self.allowed_hosts = [
            h.strip().lower() for h in os.getenv("ALLOWED_TARGET_HOSTS", "").split(",") if h.strip()
        ]
        # Permite endpoints en localhost / red privada (p. ej. Ollama). Desactivar si se publica.
        self.allow_private_targets = _bool("ALLOW_PRIVATE_TARGETS", True)
        # Límites globales de seguridad
        self.max_tests_per_run = _int("MAX_TESTS_PER_RUN", 500)
        self.max_requests_per_minute = _int("MAX_REQUESTS_PER_MINUTE", 120)
        self.max_concurrency = _int("MAX_CONCURRENCY", 4)
        self.default_token_budget = _int("DEFAULT_TOKEN_BUDGET", 200_000)
        self.request_timeout = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "60"))


settings = Settings()
