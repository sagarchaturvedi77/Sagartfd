"""Phase 4 iteration 3 - new tests for Regular plan validation and AI prompt enforcement."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

EXPECTED_CODES = {
    "106235", "108466", "112277", "127039", "105758",
    "101161", "113177", "100177", "125350", "122640",
    "101762", "109830", "135784", "100175", "112323",
}


class TestTopFundsRegularPlans:
    """All 15 curated top funds must be Regular plans (NOT Direct)."""

    @pytest.fixture(scope="class")
    def top_funds_data(self):
        r = requests.get(f"{API}/mf/top-funds", timeout=90)
        assert r.status_code == 200, r.text
        return r.json()

    def test_15_funds_returned(self, top_funds_data):
        funds = top_funds_data["funds"]
        assert len(funds) == 15, f"Expected 15 funds, got {len(funds)}"

    def test_expected_codes_present(self, top_funds_data):
        codes = {str(f["code"]) for f in top_funds_data["funds"]}
        missing = EXPECTED_CODES - codes
        unexpected = codes - EXPECTED_CODES
        assert not missing, f"Missing codes: {missing}"
        assert not unexpected, f"Unexpected codes: {unexpected}"

    def test_no_direct_plan_in_names(self, top_funds_data):
        """CRITICAL: scheme names must NOT contain 'Direct'."""
        offenders = []
        for f in top_funds_data["funds"]:
            name = (f.get("name") or "")
            if "direct" in name.lower():
                offenders.append({"code": f["code"], "name": name})
        assert not offenders, f"Funds with 'Direct' in name: {offenders}"

    def test_nav_and_returns_populated(self, top_funds_data):
        funds = top_funds_data["funds"]
        with_nav = [f for f in funds if f.get("nav")]
        assert len(with_nav) >= 13, f"NAV missing on too many funds: {len(funds) - len(with_nav)}"
        with_1y = [f for f in funds if f.get("return_1y") is not None]
        assert len(with_1y) >= 10
        with_3y = [f for f in funds if f.get("return_3y") is not None]
        assert len(with_3y) >= 8


class TestAIRegularPlanEnforcement:
    """AI system prompt must always recommend Regular plans, never Direct."""

    def test_ai_redirects_direct_plan_request_to_regular(self):
        sid = f"TEST-{uuid.uuid4().hex[:10]}"
        payload = {
            "session_id": sid,
            "message": "Mujhe direct plan me invest karna hai, kya batayein?",
        }
        with requests.post(f"{API}/ai/chat", json=payload, stream=True, timeout=90) as r:
            assert r.status_code == 200, r.text
            raw = b""
            t0 = time.time()
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    raw += chunk
                    if b"event: done" in raw:
                        break
                if time.time() - t0 > 75:
                    break

        text = raw.decode("utf-8", errors="ignore")
        data_lines = []
        for block in text.split("\n\n"):
            for line in block.split("\n"):
                if line.startswith("data: "):
                    data_lines.append(line[6:])
        content = "\n".join(data_lines).lower()
        assert len(content) > 50, f"AI response too short: {content!r}"

        # Must mention 'regular' (the assistant should pivot to regular plan)
        assert "regular" in content, f"AI did not mention 'regular' plan. Got: {content[:600]!r}"
        # ARN code mention preferred
        assert ("arn-290298" in content or "290298" in content or "sagar" in content), (
            f"AI did not mention ARN/Sagar: {content[:600]!r}"
        )
