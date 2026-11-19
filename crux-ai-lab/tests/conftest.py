import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db  # noqa: E402
from app.config import settings  # noqa: E402


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db.reset_for_tests(str(tmp_path / "test.db"))
    monkeypatch.setattr(settings, "access_token", "")
    monkeypatch.setattr(settings, "max_requests_per_minute", 6000)
    from fastapi.testclient import TestClient

    from app.main import app
    with TestClient(app) as c:
        yield c
    db.reset_for_tests(str(tmp_path / "unused.db"))
