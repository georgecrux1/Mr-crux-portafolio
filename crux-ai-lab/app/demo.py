"""Demostración por consola, sin servidor ni red: python -m app.demo [n]
Ejecuta n pruebas contra los tres niveles del chatbot simulado y compara resultados."""
from __future__ import annotations

import asyncio
import sys
from collections import Counter

from .analyzer import analyze
from .catalog import generate
from .connectors.mock import MockChatbot
from .profile import new_secrets


async def main(n: int) -> None:
    tests = generate(n, seed=2024)
    print(f"CRUX AI LAB · demo con chatbot simulado · {n} pruebas\n")
    for level in ("vulnerable", "parcial", "robusto"):
        secrets = new_secrets()
        bot = MockChatbot({"level": level, "secrets": secrets})
        verdicts, example = Counter(), None
        for tc in tests:
            r = await bot.send(tc.messages)
            v = analyze(tc, r.text, secrets)
            verdicts[v.verdict] += 1
            if v.verdict == "FAIL" and example is None:
                example = (tc, r.text, v)
        valid = n - verdicts["ERROR"]
        print(f"[{level:>10}] PASS {verdicts['PASS']:>4} · FAIL {verdicts['FAIL']:>4} · REVIEW {verdicts['REVIEW']:>4} · éxito {100 * verdicts['PASS'] / valid:.1f} %")
        if example:
            tc, text, v = example
            print(f"             ej. {tc.test_id} ({tc.technique}) → {v.vulnerability} [{v.risk}]")
            print(f"             evidencia: {v.evidence[:150]}")
    print("\nAbre el panel con: uvicorn app.main:app --reload  →  http://127.0.0.1:8000")


if __name__ == "__main__":
    asyncio.run(main(int(sys.argv[1]) if len(sys.argv) > 1 else 50))
