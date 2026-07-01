import os
import json
from fastapi.testclient import TestClient

from backend.server import app

client = TestClient(app)


def test_vapid_key_endpoint():
    # vapid endpoint may exist even if no key configured
    res = client.get("/api/notifications/vapid-public-key")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)

