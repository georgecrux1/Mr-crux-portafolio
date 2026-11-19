"""Conector oficial de Anthropic (Claude). API DE PAGO: requiere ANTHROPIC_API_KEY.

La clave se lee de una variable de entorno del servidor; nunca se envía al navegador.
No se activan 'fallbacks' de servidor a propósito: si el modelo bajo prueba se niega,
queremos registrar SU negativa, no la respuesta de otro modelo.
"""
from __future__ import annotations

import os
import time

from ..config import settings
from ..profile import build_system_prompt
from .base import ChatResult, Connector, ConnectorError

DEFAULT_MODEL = "claude-opus-5-5"


class AnthropicConnector(Connector):
    def __init__(self, cfg: dict):
        try:
            import anthropic
        except ImportError as e:  # pragma: no cover
            raise ConnectorError("Falta el paquete 'anthropic' (pip install anthropic).") from e
        self._anthropic = anthropic
        self.model = cfg.get("model") or DEFAULT_MODEL
        self.effort = cfg.get("effort") or "low"
        self.max_tokens = int(cfg.get("max_tokens") or 1024)
        self.system = build_system_prompt(cfg["secrets"], cfg.get("system_extra", ""))
        env_name = cfg.get("api_key_env") or "ANTHROPIC_API_KEY"
        key = os.getenv(env_name)
        if not key:
            raise ConnectorError(f"La variable de entorno {env_name} no está definida en el servidor.")
        self.client = anthropic.AsyncAnthropic(api_key=key, timeout=settings.request_timeout, max_retries=2)
        self.label = f"anthropic:{self.model}"

    async def send(self, messages: list[dict]) -> ChatResult:
        a = self._anthropic
        t0 = time.perf_counter()
        try:
            resp = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.system,
                messages=[{"role": m["role"], "content": m["content"]} for m in messages],
                output_config={"effort": self.effort},
            )
        except a.AuthenticationError as e:
            raise ConnectorError("Anthropic rechazó la clave (401). Revisa ANTHROPIC_API_KEY.") from e
        except a.PermissionDeniedError as e:
            raise ConnectorError("Anthropic: permiso denegado (403) para este modelo o cuenta.") from e
        except a.NotFoundError as e:
            raise ConnectorError(f"Anthropic: modelo '{self.model}' no encontrado (404).") from e
        except a.RateLimitError as e:
            raise ConnectorError("Anthropic: límite de velocidad alcanzado (429). Reduce las peticiones por minuto.") from e
        except a.BadRequestError as e:
            raise ConnectorError(f"Anthropic: petición inválida (400): {getattr(e, 'message', '')[:200]}") from e
        except a.APIStatusError as e:
            raise ConnectorError(f"Anthropic: error HTTP {e.status_code}.") from e
        except a.APIConnectionError as e:
            raise ConnectorError("No se pudo conectar con la API de Anthropic.") from e
        latency = int((time.perf_counter() - t0) * 1000)
        text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
        refused = resp.stop_reason == "refusal"
        if refused and not text:
            text = "[La API devolvió stop_reason=refusal: el modelo rechazó la petición]"
        tokens = (resp.usage.input_tokens or 0) + (resp.usage.output_tokens or 0)
        return ChatResult(text, tokens, latency, resp.model, refused_by_api=refused)

    async def aclose(self) -> None:
        await self.client.close()
