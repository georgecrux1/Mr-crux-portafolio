"""Interfaz común de conectores y validación de URLs (anti-SSRF)."""
from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urlparse

from ..config import settings


class ConnectorError(Exception):
    """Error mostrable al usuario. Nunca debe contener secretos."""


@dataclass
class ChatResult:
    text: str
    tokens: int
    latency_ms: int
    model: str
    refused_by_api: bool = False


class Connector:
    label = "base"

    async def send(self, messages: list[dict]) -> ChatResult:  # pragma: no cover
        raise NotImplementedError

    async def aclose(self) -> None:
        return None


def estimate_tokens(*texts: str) -> int:
    return max(1, sum(len(t or "") for t in texts) // 4)


def validate_target_url(url: str) -> None:
    p = urlparse(url)
    if p.scheme not in {"http", "https"} or not p.hostname:
        raise ConnectorError("La URL debe empezar por http:// o https:// e incluir un host.")
    host = p.hostname.lower()
    if settings.allowed_hosts and host not in settings.allowed_hosts:
        raise ConnectorError(f"El host '{host}' no está en ALLOWED_TARGET_HOSTS.")
    if not settings.allow_private_targets:
        try:
            infos = socket.getaddrinfo(host, p.port or (443 if p.scheme == "https" else 80))
        except socket.gaierror as e:
            raise ConnectorError(f"No se pudo resolver el host '{host}'.") from e
        for info in infos:
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                raise ConnectorError("Destino en red privada/local bloqueado (ALLOW_PRIVATE_TARGETS=false).")


def build_connector(target: dict) -> Connector:
    kind = target["kind"]
    cfg = target["config"]
    if kind == "mock":
        from .mock import MockChatbot
        return MockChatbot(cfg)
    if kind == "anthropic":
        from .anthropic_connector import AnthropicConnector
        return AnthropicConnector(cfg)
    if kind == "openai_compatible":
        from .openai_compat import OpenAICompatConnector
        return OpenAICompatConnector(cfg)
    if kind == "http_endpoint":
        from .http_endpoint import HttpEndpointConnector
        return HttpEndpointConnector(cfg)
    raise ConnectorError(f"Tipo de conector desconocido: {kind}")
