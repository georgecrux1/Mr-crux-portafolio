"""Conector para cualquier API compatible con /v1/chat/completions.

Funciona con OpenAI (de pago), y GRATIS en local con Ollama (http://localhost:11434/v1)
o LM Studio (http://localhost:1234/v1). La clave, si hace falta, se lee de una variable
de entorno cuyo NOMBRE se guarda en la configuración (nunca el valor).
"""
from __future__ import annotations

import os
import time

import httpx

from ..config import settings
from ..profile import build_system_prompt
from .base import ChatResult, Connector, ConnectorError, estimate_tokens, validate_target_url


class OpenAICompatConnector(Connector):
    def __init__(self, cfg: dict):
        self.base_url = cfg["base_url"].rstrip("/")
        validate_target_url(self.base_url)
        self.model = cfg["model"]
        self.max_tokens = int(cfg.get("max_tokens") or 512)
        self.system = build_system_prompt(cfg["secrets"], cfg.get("system_extra", "")) if cfg.get("use_lab_prompt", True) else None
        headers = {"Content-Type": "application/json"}
        env_name = cfg.get("api_key_env") or ""
        if env_name:
            key = os.getenv(env_name)
            if not key:
                raise ConnectorError(f"La variable de entorno {env_name} no está definida en el servidor.")
            headers["Authorization"] = f"Bearer {key}"
        self.client = httpx.AsyncClient(timeout=settings.request_timeout, headers=headers, follow_redirects=False)
        self.label = f"openai_compatible:{self.model}"

    async def send(self, messages: list[dict]) -> ChatResult:
        msgs = ([{"role": "system", "content": self.system}] if self.system else []) + messages
        t0 = time.perf_counter()
        try:
            r = await self.client.post(f"{self.base_url}/chat/completions",
                                       json={"model": self.model, "messages": msgs, "max_tokens": self.max_tokens})
        except httpx.HTTPError as e:
            raise ConnectorError(f"No se pudo conectar con {self.base_url}: {type(e).__name__}") from e
        latency = int((time.perf_counter() - t0) * 1000)
        if r.status_code >= 400:
            raise ConnectorError(f"El endpoint respondió HTTP {r.status_code}: {r.text[:200]}")
        try:
            data = r.json()
            text = data["choices"][0]["message"].get("content") or ""
        except (ValueError, KeyError, IndexError, TypeError) as e:
            raise ConnectorError("Respuesta no compatible con chat/completions.") from e
        usage = data.get("usage") or {}
        tokens = usage.get("total_tokens") or estimate_tokens(*(m["content"] for m in msgs), text)
        return ChatResult(text, int(tokens), latency, data.get("model", self.model))

    async def aclose(self) -> None:
        await self.client.aclose()
