"""Phase 4 backend tests: Reviews, Contact, MF data endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://advisor-phase4-build.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Meta ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Reviews ----------
class TestReviews:
    created_id = None

    def test_create_review_valid(self, session):
        payload = {
            "name": "TEST_Anchal",
            "location": "Indore",
            "rating": 5,
            "message": "Excellent advisor with deep knowledge of mutual funds."
        }
        r = session.post(f"{API}/reviews", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["rating"] == 5
        assert data["approved"] is True
        assert "id" in data
        TestReviews.created_id = data["id"]

    def test_create_review_short_message(self, session):
        # message < 10 chars must fail
        r = session.post(f"{API}/reviews", json={
            "name": "TEST_Short", "rating": 4, "message": "too"
        })
        assert r.status_code == 422

    def test_create_review_bad_rating(self, session):
        r = session.post(f"{API}/reviews", json={
            "name": "TEST_Bad", "rating": 6, "message": "Valid length message here"
        })
        assert r.status_code == 422

    def test_list_reviews_contains_created(self, session):
        r = session.get(f"{API}/reviews")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        # newest first ordering check
        ids = [x["id"] for x in arr]
        assert TestReviews.created_id in ids
        # newest-first: created should be at index 0 (very recent)
        assert arr[0]["id"] == TestReviews.created_id

    def test_review_stats(self, session):
        r = session.get(f"{API}/reviews/stats")
        assert r.status_code == 200
        data = r.json()
        assert "average" in data and "count" in data
        assert data["count"] >= 1
        assert 1 <= float(data["average"]) <= 5


# ---------- Contact ----------
class TestContact:
    def test_contact_required_only(self, session):
        r = session.post(f"{API}/contact", json={
            "full_name": "TEST_Contact",
            "phone": "9876543210"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["full_name"] == "TEST_Contact"
        assert data["phone"] == "9876543210"
        assert "id" in data

    def test_contact_full(self, session):
        r = session.post(f"{API}/contact", json={
            "full_name": "TEST_Contact2",
            "phone": "9876543211",
            "email": "test@example.com",
            "service": "SIP",
            "message": "Want to start SIP"
        })
        assert r.status_code == 200

    def test_contact_missing_phone(self, session):
        r = session.post(f"{API}/contact", json={"full_name": "TEST_Missing"})
        assert r.status_code == 422


# ---------- MF Endpoints ----------
class TestMFData:
    def test_top_funds(self, session):
        r = session.get(f"{API}/mf/top-funds", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        cats = data["categories"]
        assert set(["Large Cap", "Mid Cap", "Small Cap", "Flexi Cap"]).issubset(set(cats))
        funds = data["funds"]
        # Should be near 15 funds (some can fail individually but most must succeed)
        assert len(funds) >= 12, f"Got only {len(funds)} funds"
        # Categories present
        cat_set = {f["category"] for f in funds}
        for c in ["Large Cap", "Mid Cap", "Small Cap", "Flexi Cap"]:
            assert c in cat_set
        # NAV populated for at least most
        with_nav = [f for f in funds if f.get("nav")]
        assert len(with_nav) >= len(funds) - 2
        # Returns populated for at least some (5Y may be null for newer)
        with_1y = [f for f in funds if f.get("return_1y") is not None]
        assert len(with_1y) >= 5

    def test_search_parag(self, session):
        r = session.get(f"{API}/mf/search", params={"q": "parag"}, timeout=30)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 1
        assert any("parag" in (x.get("schemeName", "").lower()) for x in arr)

    def test_fund_detail_parag_flexi(self, session):
        r = session.get(f"{API}/mf/122639", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["code"] == "122639"
        assert data["nav"] is not None
        assert "parag" in (data.get("name") or "").lower()
        assert isinstance(data.get("history"), list)

    def test_fund_detail_invalid(self, session):
        r = session.get(f"{API}/mf/00000000", timeout=30)
        # MFAPI might return 200 with empty data — endpoint should still respond
        assert r.status_code in (200, 404)


# ---------- Cleanup ----------
@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    # Best-effort cleanup via mongo not exposed; tests leave TEST_ prefixed rows.
