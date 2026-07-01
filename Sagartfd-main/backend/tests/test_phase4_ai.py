"""Phase 4 AI chat backend tests - streaming SSE and history persistence."""
import os
import uuid
import time
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session_id():
    return f"TEST-{uuid.uuid4().hex[:10]}"


class TestAIChat:
    def test_ai_chat_stream_returns_finance_content(self, session_id):
        """POST /api/ai/chat must stream Claude tokens and end with event: done."""
        payload = {"session_id": session_id, "message": "Namaste, mujhe SIP shuru karna hai."}
        with requests.post(f"{API}/ai/chat", json=payload, stream=True, timeout=60) as r:
            assert r.status_code == 200, r.text
            assert "text/event-stream" in r.headers.get("content-type", "")

            raw = b""
            done_seen = False
            t0 = time.time()
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    raw += chunk
                    if b"event: done" in raw:
                        done_seen = True
                        break
                if time.time() - t0 > 45:
                    break

            assert done_seen, f"No 'event: done' marker. Got: {raw[:500]!r}"

            text = raw.decode("utf-8", errors="ignore")
            # Strip out data: lines content
            data_lines = []
            for block in text.split("\n\n"):
                for line in block.split("\n"):
                    if line.startswith("data: "):
                        data_lines.append(line[6:])
            content = "\n".join(data_lines)
            assert len(content) > 50, f"Content too short: {content!r}"
            # Expect finance-related words (Hindi/Eng)
            lc = content.lower()
            keywords = ["sip", "mutual", "fund", "invest", "risk", "market", "month",
                        "nivesh", "saving", "₹", "rupee", "amount", "goal"]
            assert any(k in lc for k in keywords), f"No finance content. Got: {content[:400]!r}"

    def test_ai_history_persisted(self, session_id):
        """After /ai/chat, /ai/history/{sid} should return user + assistant messages."""
        # Wait briefly for DB write to settle (StreamingResponse finally block)
        time.sleep(2)
        r = requests.get(f"{API}/ai/history/{session_id}", timeout=15)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["session_id"] == session_id
        msgs = doc.get("messages", [])
        assert len(msgs) >= 2, f"Expected >=2 messages, got {len(msgs)}: {msgs}"
        # First should be user, second assistant
        roles = [m["role"] for m in msgs[:2]]
        assert roles == ["user", "assistant"], f"Bad role order: {roles}"
        assert "SIP" in msgs[0]["content"] or "sip" in msgs[0]["content"].lower()
        assert len(msgs[1]["content"]) > 20

    def test_ai_history_empty_for_unknown(self):
        r = requests.get(f"{API}/ai/history/UNKNOWN-{uuid.uuid4().hex}", timeout=15)
        assert r.status_code == 200
        assert r.json()["messages"] == []

    def test_ai_chat_validation_short_message(self):
        r = requests.post(f"{API}/ai/chat", json={"session_id": "x", "message": ""}, timeout=15)
        assert r.status_code == 422
