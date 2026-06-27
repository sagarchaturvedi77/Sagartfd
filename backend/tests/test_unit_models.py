"""Unit tests for Pydantic model validation in server.py."""
import pytest
from pydantic import BaseModel, Field, ConfigDict, ValidationError
from typing import Optional
from datetime import datetime, timezone
import uuid


# Re-define models here to test validation without importing server.py
# (which requires MongoDB at import time).

class ReviewCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    location: Optional[str] = Field(default="Sehore", max_length=80)
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=10, max_length=600)


class ContactCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=8, max_length=15)
    email: Optional[str] = None
    service: Optional[str] = None
    message: Optional[str] = None


class AIChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=2000)
    assistant_profile: Optional[str] = None


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: Optional[str] = "Sehore"
    rating: int = Field(ge=1, le=5)
    message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    approved: bool = True


# --------------- ReviewCreate tests ---------------

class TestReviewCreate:
    def test_valid_review(self):
        r = ReviewCreate(name="Amit", rating=5, message="Great advisor for mutual funds!")
        assert r.name == "Amit"
        assert r.rating == 5
        assert r.location == "Sehore"

    def test_custom_location(self):
        r = ReviewCreate(name="Priya", rating=4, message="Very helpful service", location="Indore")
        assert r.location == "Indore"

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="A", rating=5, message="Valid message here")

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="A" * 81, rating=5, message="Valid message here")

    def test_rating_below_min(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="Test", rating=0, message="Valid message here")

    def test_rating_above_max(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="Test", rating=6, message="Valid message here")

    def test_message_too_short(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="Test", rating=3, message="too short")

    def test_message_too_long(self):
        with pytest.raises(ValidationError):
            ReviewCreate(name="Test", rating=3, message="x" * 601)

    def test_message_exactly_min_length(self):
        r = ReviewCreate(name="Test", rating=3, message="x" * 10)
        assert len(r.message) == 10

    def test_all_valid_ratings(self):
        for rating in [1, 2, 3, 4, 5]:
            r = ReviewCreate(name="Test", rating=rating, message="Valid message here")
            assert r.rating == rating


# --------------- ContactCreate tests ---------------

class TestContactCreate:
    def test_required_fields_only(self):
        c = ContactCreate(full_name="Sagar", phone="9876543210")
        assert c.full_name == "Sagar"
        assert c.phone == "9876543210"
        assert c.email is None
        assert c.service is None
        assert c.message is None

    def test_all_fields(self):
        c = ContactCreate(
            full_name="Sagar",
            phone="9876543210",
            email="test@example.com",
            service="SIP",
            message="I want to start investing",
        )
        assert c.email == "test@example.com"
        assert c.service == "SIP"

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            ContactCreate(full_name="S", phone="9876543210")

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            ContactCreate(full_name="A" * 81, phone="9876543210")

    def test_phone_too_short(self):
        with pytest.raises(ValidationError):
            ContactCreate(full_name="Test", phone="12345")

    def test_phone_too_long(self):
        with pytest.raises(ValidationError):
            ContactCreate(full_name="Test", phone="1" * 16)

    def test_missing_full_name(self):
        with pytest.raises(ValidationError):
            ContactCreate(phone="9876543210")

    def test_missing_phone(self):
        with pytest.raises(ValidationError):
            ContactCreate(full_name="Test")


# --------------- AIChatRequest tests ---------------

class TestAIChatRequest:
    def test_valid_request(self):
        r = AIChatRequest(session_id="abc-123", message="Hello")
        assert r.session_id == "abc-123"
        assert r.message == "Hello"
        assert r.assistant_profile is None

    def test_with_assistant_profile(self):
        r = AIChatRequest(session_id="abc", message="Hi", assistant_profile="expert")
        assert r.assistant_profile == "expert"

    def test_empty_message_rejected(self):
        with pytest.raises(ValidationError):
            AIChatRequest(session_id="abc", message="")

    def test_message_too_long(self):
        with pytest.raises(ValidationError):
            AIChatRequest(session_id="abc", message="x" * 2001)

    def test_missing_session_id(self):
        with pytest.raises(ValidationError):
            AIChatRequest(message="Hello")

    def test_missing_message(self):
        with pytest.raises(ValidationError):
            AIChatRequest(session_id="abc")


# --------------- Review model tests ---------------

class TestReviewModel:
    def test_defaults(self):
        r = Review(name="Test", rating=5, message="Great service!")
        assert r.location == "Sehore"
        assert r.approved is True
        assert r.id is not None
        assert len(r.id) == 36  # UUID format
        assert r.created_at is not None

    def test_auto_generated_id_is_unique(self):
        r1 = Review(name="A", rating=5, message="msg1")
        r2 = Review(name="B", rating=4, message="msg2")
        assert r1.id != r2.id

    def test_extra_fields_ignored(self):
        r = Review(name="Test", rating=5, message="msg", extra_field="ignored")
        assert not hasattr(r, "extra_field")

    def test_from_review_create(self):
        rc = ReviewCreate(name="Amit", rating=5, message="Excellent advisor!")
        r = Review(**rc.model_dump())
        assert r.name == "Amit"
        assert r.rating == 5


# --------------- TOP_FUNDS data validation ---------------

TOP_FUNDS = {
    "Large Cap": [
        {"code": "106235", "name": "Nippon India Large Cap Fund - Regular Growth"},
        {"code": "108466", "name": "ICICI Prudential Large Cap (Bluechip) Fund - Regular Growth"},
        {"code": "112277", "name": "Axis Large Cap Fund - Regular Growth"},
    ],
    "Mid Cap": [
        {"code": "127039", "name": "Motilal Oswal Midcap Fund - Regular Growth"},
        {"code": "105758", "name": "HDFC Mid Cap Fund - Regular Growth"},
        {"code": "101161", "name": "Nippon India Multi Cap Fund - Regular Growth"},
    ],
    "Small Cap": [
        {"code": "113177", "name": "Nippon India Small Cap Fund - Regular Growth"},
        {"code": "100177", "name": "Quant Small Cap Fund - Regular Growth"},
        {"code": "125350", "name": "Axis Small Cap Fund - Regular Growth"},
    ],
    "Flexi Cap": [
        {"code": "122640", "name": "Parag Parikh Flexi Cap Fund - Regular Growth"},
        {"code": "101762", "name": "HDFC Flexi Cap Fund - Regular Growth"},
        {"code": "109830", "name": "Quant Flexi Cap Fund - Regular Growth"},
    ],
    "ELSS (Tax Saver)": [
        {"code": "135784", "name": "Mirae Asset ELSS Tax Saver Fund - Regular Growth"},
        {"code": "100175", "name": "Quant ELSS Tax Saver Fund - Regular Growth"},
        {"code": "112323", "name": "Axis ELSS Tax Saver Fund - Regular Growth"},
    ],
}


class TestTopFundsData:
    def test_has_5_categories(self):
        assert len(TOP_FUNDS) == 5

    def test_each_category_has_3_funds(self):
        for cat, funds in TOP_FUNDS.items():
            assert len(funds) == 3, f"{cat} has {len(funds)} funds"

    def test_total_15_funds(self):
        total = sum(len(funds) for funds in TOP_FUNDS.values())
        assert total == 15

    def test_all_codes_unique(self):
        codes = [f["code"] for funds in TOP_FUNDS.values() for f in funds]
        assert len(codes) == len(set(codes))

    def test_no_direct_plan_in_names(self):
        for cat, funds in TOP_FUNDS.items():
            for f in funds:
                assert "direct" not in f["name"].lower(), f"Direct plan found: {f['name']}"

    def test_all_regular_plan_names(self):
        for cat, funds in TOP_FUNDS.items():
            for f in funds:
                assert "regular" in f["name"].lower() or "growth" in f["name"].lower(), (
                    f"Fund name missing Regular/Growth: {f['name']}"
                )

    def test_expected_categories(self):
        expected = {"Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "ELSS (Tax Saver)"}
        assert set(TOP_FUNDS.keys()) == expected

    def test_fund_entries_have_required_keys(self):
        for cat, funds in TOP_FUNDS.items():
            for f in funds:
                assert "code" in f, f"Missing 'code' in {cat}"
                assert "name" in f, f"Missing 'name' in {cat}"
                assert isinstance(f["code"], str)
                assert isinstance(f["name"], str)
                assert len(f["code"]) > 0
                assert len(f["name"]) > 0
