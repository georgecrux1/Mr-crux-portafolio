"""Conector genérico para el endpoint HTTP de TU chatbot (propio o autorizado).

Envía: POST <url>  {<message_field>: "...", <history_field>: [...], ...extra_body}
Lee:   el texto en <response_path> (ruta con puntos, p. ej. "reply" o "data.0.text").
Autenticación opcional: cabecera <auth_header> = <auth_prefix> + valor de la variable <auth_env>.
"""
from __future__ import annotations

import os
import time

import httpx

from ..config import settings
from .base import ChatResult, Connector, ConnectorError, estimate_tokens, validate_target_url


def dig(data, path: str):
    cur = data
    for part in [p for p in path.split(".") if p]:
        if isinstance(cur, list):
            cur = cur[int(part)]
        else:
            cur = cur[part]
    return cur


class HttpEndpointConnector(Connector):
    def __init__(self, cfg: dict):
        self.url = cfg["url"]
        validate_target_url(self.url)
        self.message_field = cfg.get("message_field") or "message"
        self.history_field = cfg.get("history_field", "history")
        self.response_path = cfg.get("response_path") or "reply"
        self.extra_body = cfg.get("extra_body") or {}
        headers = {"Content-Type": "application/json"}
        env_name = cfg.get("auth_env") or ""
        if env_name:
            val = os.getenv(env_name)
            if not val:
                raise ConnectorError(f"La variable de entorno {env_name} no está definida en el servidor.")
            headers[cfg.get("auth_header") or "Authorization"] = (cfg.get("auth_prefix", "Bearer ") or "") + val
        self.client = httpx.AsyncClient(timeout=settings.request_timeout, headers=headers, follow_redirects=False)
        self.label = f"http:{httpx.URL(self.url).host}"

    async def send(self, messages: list[dict]) -> ChatResult:
        body = dict(self.extra_body)
        body[self.message_field] = messages[-1]["content"]
        if self.history_field:
            body[self.history_field] = messages[:-1]
        t0 = time.perf_counter()
        try:
            r = await self.client.post(self.url, json=body)
        except httpx.HTTPError as e:
            raise ConnectorError(f"No se pudo conectar con {self.url}: {type(e).__name__}") from e
        latency = int((time.perf_counter() - t0) * 1000)
        if r.status_code >= 400:
            raise ConnectorError(f"El endpoint respondió HTTP {r.status_code}: {r.text[:200]}")
        try:
            text = dig(r.json(), self.response_path)
        except (ValueError, KeyError, IndexError, TypeError) as e:
            raise ConnectorError(f"No se encontró el texto en la ruta '{self.response_path}' de la respuesta JSON.") from e
        text = text if isinstance(text, str) else str(text)
        return ChatResult(text, estimate_tokens(*(m["content"] for m in messages), text), latency, self.label)

    async def aclose(self) -> None:
        await self.client.aclose()
