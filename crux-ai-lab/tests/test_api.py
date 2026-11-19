import socket
import threading
import time

import pytest
import uvicorn

from app.config import settings


def wait_run(client, run_id, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        r = client.get(f"/api/runs/{run_id}").json()
        if r["status"] not in ("queued", "running"):
            return r
        time.sleep(0.1)
    raise AssertionError("la ejecución no terminó")


def mk_mock(client, level="vulnerable"):
    r = client.post("/api/targets", json={"name": f"bot {level}", "kind": "mock", "level": level, "authorized": True})
    assert r.status_code == 201, r.text
    return r.json()


def test_health_meta_and_seed_target(client):
    assert client.get("/api/health").json()["status"] == "ok"
    m = client.get("/api/meta").json()
    assert m["sizes"] == [10, 50, 100, 500] and len(m["categories"]) == 8
    assert len(client.get("/api/targets").json()) == 1  # demo sembrado
    assert "CRUX AI LAB" in client.get("/").text


def test_authorization_required_and_no_secrets_exposed(client):
    r = client.post("/api/targets", json={"name": "x", "kind": "mock", "authorized": False})
    assert r.status_code == 400
    t = mk_mock(client)
    assert "secrets" not in t["config"]
    body = client.get("/api/targets").text
    assert "sk-crux-fake" not in body and "fake_api_key" not in body


def test_env_name_validation_rejects_raw_keys(client):
    r = client.post("/api/targets", json={"name": "a", "kind": "anthropic", "authorized": True, "api_key_env": "sk-ant-123"})
    assert r.status_code == 422


def test_full_run_reports_stats_compare(client):
    t = mk_mock(client, "vulnerable")
    r = client.post("/api/runs", json={"target_id": t["id"], "size": 50, "rpm": 6000, "concurrency": 4})
    assert r.status_code == 201, r.text
    run = wait_run(client, r.json()["id"])
    assert run["status"] == "completed" and run["executed"] == 50
    assert run["failed"] > 0 and run["passed"] + run["failed"] + run["review"] + run["errors"] == 50
    res = client.get(f"/api/runs/{run['id']}/results?verdict=FAIL").json()
    for x in res:
        assert x["evidence"] and x["prompt"] and x["response"] and x["risk"] != "ninguno" and x["recommendation"]
    csv = client.get(f"/api/runs/{run['id']}/report.csv")
    assert csv.status_code == 200 and "verdict" in csv.text
    pdf = client.get(f"/api/runs/{run['id']}/report.pdf")
    assert pdf.content[:4] == b"%PDF"
    s = client.get("/api/stats").json()
    assert s["total"] == 50 and s["vulnerability_types"]
    t2 = mk_mock(client, "robusto")
    wait_run(client, client.post("/api/runs", json={"target_id": t2["id"], "size": 10, "rpm": 6000}).json()["id"])
    cmp = client.get("/api/compare").json()
    assert len(cmp) == 2 and cmp[0]["pass_rate"] >= cmp[1]["pass_rate"]


def test_invalid_size_and_stop(client):
    t = mk_mock(client)
    assert client.post("/api/runs", json={"target_id": t["id"], "size": 7}).status_code == 400
    r = client.post("/api/runs", json={"target_id": t["id"], "size": 500, "rpm": 30, "concurrency": 1}).json()
    assert client.post("/api/runs", json={"target_id": t["id"], "size": 10}).status_code == 409
    time.sleep(0.2)
    assert client.post(f"/api/runs/{r['id']}/stop").status_code == 200
    run = wait_run(client, r["id"])
    assert run["status"] == "stopped" and run["executed"] < 500


def test_token_budget_stops_run(client):
    t = mk_mock(client)
    r = client.post("/api/runs", json={"target_id": t["id"], "size": 100, "rpm": 6000, "concurrency": 1, "token_budget": 3000}).json()
    run = wait_run(client, r["id"])
    assert run["status"] == "budget_exceeded" and run["executed"] < 100


def test_access_token(client, monkeypatch):
    monkeypatch.setattr(settings, "access_token", "s3cret")
    assert client.get("/api/targets").status_code == 401
    assert client.get("/api/targets", headers={"X-Access-Token": "s3cret"}).status_code == 200
    assert client.get("/api/health").status_code == 200


def test_private_targets_blocked_when_disabled(client, monkeypatch):
    monkeypatch.setattr(settings, "allow_private_targets", False)
    r = client.post("/api/targets", json={"name": "x", "kind": "http_endpoint", "authorized": True, "url": "http://127.0.0.1:9/chat"})
    assert r.status_code == 400
    monkeypatch.setattr(settings, "allow_private_targets", True)
    monkeypatch.setattr(settings, "allowed_hosts", ["bot.example.com"])
    r = client.post("/api/targets", json={"name": "x", "kind": "http_endpoint", "authorized": True, "url": "http://evil.example.net/chat"})
    assert r.status_code == 400


@pytest.fixture()
def sample_bot(monkeypatch):
    monkeypatch.setenv("SAMPLE_BOT_TOKEN", "tok-123")
    from examples.sample_bot import app
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error"))
    th = threading.Thread(target=server.run, daemon=True); th.start()
    while not server.started:
        time.sleep(0.05)
    yield f"http://127.0.0.1:{port}/chat"
    server.should_exit = True; th.join(5)


def test_http_endpoint_connector_end_to_end(client, sample_bot):
    r = client.post("/api/targets", json={"name": "Sample", "kind": "http_endpoint", "authorized": True, "url": sample_bot,
                                          "auth_env": "SAMPLE_BOT_TOKEN", "canaries": ["CANARIO-SAMPLE-7F3A"]})
    assert r.status_code == 201, r.text
    tid = r.json()["id"]
    chk = client.post(f"/api/targets/{tid}/check").json()
    assert chk["ok"] and "Hotel Demo" in chk["reply"]
    run = wait_run(client, client.post("/api/runs", json={"target_id": tid, "size": 50, "rpm": 6000,
                                                           "categories": ["system_prompt_protection", "jailbreak"]}).json()["id"])
    assert run["status"] == "completed" and run["errors"] == 0
    fails = client.get(f"/api/runs/{run['id']}/results?verdict=FAIL").json()
    assert fails and all("CANARIO-SAMPLE-7F3A" in f["evidence"] for f in fails)


def test_http_endpoint_bad_token_reports_error(client, sample_bot, monkeypatch):
    monkeypatch.setenv("WRONG_TOKEN", "nope")
    tid = client.post("/api/targets", json={"name": "S", "kind": "http_endpoint", "authorized": True, "url": sample_bot,
                                            "auth_env": "WRONG_TOKEN"}).json()["id"]
    chk = client.post(f"/api/targets/{tid}/check").json()
    assert not chk["ok"] and "401" in chk["error"]
    run = wait_run(client, client.post("/api/runs", json={"target_id": tid, "size": 10, "rpm": 6000, "concurrency": 1}).json()["id"])
    assert run["status"] == "stopped" and run["errors"] == 5  # corte por errores consecutivos
