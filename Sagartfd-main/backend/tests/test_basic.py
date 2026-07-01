from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)


def test_root():
    res = client.get("/api/")
    assert res.status_code == 200
    assert res.json().get("status") == "ok"
