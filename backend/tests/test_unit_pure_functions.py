"""Unit tests for pure functions in server.py: _annualised_return and _sse."""
import pytest
from datetime import datetime, timedelta


# Extract the functions under test without importing the full server module
# (which requires MongoDB). Re-implement the same logic here for isolated testing.

def _annualised_return(navs, years):
    """Exact copy from server.py for unit testing without MongoDB dependency."""
    if not navs:
        return None
    try:
        current_nav = float(navs[0]["nav"])
        current_date = datetime.strptime(navs[0]["date"], "%d-%m-%Y")
        best = None
        for entry in navs:
            d = datetime.strptime(entry["date"], "%d-%m-%Y")
            delta_years = (current_date - d).days / 365.25
            if delta_years >= years:
                best = entry
                break
        if not best:
            return None
        old_nav = float(best["nav"])
        if old_nav <= 0:
            return None
        if years >= 1:
            cagr = ((current_nav / old_nav) ** (1 / years) - 1) * 100
        else:
            cagr = ((current_nav / old_nav) - 1) * 100
        return round(cagr, 2)
    except Exception:
        return None


def _sse(text):
    """Exact copy from server.py."""
    lines = str(text).replace("\r", "").split("\n")
    return "".join(f"data: {line}\n" for line in lines) + "\n"


# --------------- _annualised_return tests ---------------

class TestAnnualisedReturn:
    def _make_navs(self, prices_by_days_ago):
        """Build a NAV list (newest-first) from {days_ago: nav_value} dict."""
        today = datetime(2025, 6, 1)
        navs = []
        for days_ago in sorted(prices_by_days_ago.keys()):
            d = today - timedelta(days=days_ago)
            navs.append({"date": d.strftime("%d-%m-%Y"), "nav": str(prices_by_days_ago[days_ago])})
        return navs

    def test_returns_none_for_empty_list(self):
        assert _annualised_return([], 1) is None

    def test_returns_none_when_history_too_short(self):
        navs = self._make_navs({0: 100, 30: 95})
        assert _annualised_return(navs, 1) is None

    def test_1_year_positive_return(self):
        navs = self._make_navs({0: 120, 366: 100})
        result = _annualised_return(navs, 1)
        assert result is not None
        assert result == pytest.approx(20.0, abs=0.5)

    def test_1_year_negative_return(self):
        navs = self._make_navs({0: 90, 366: 100})
        result = _annualised_return(navs, 1)
        assert result is not None
        assert result < 0

    def test_3_year_cagr(self):
        navs = self._make_navs({0: 200, 1100: 100})
        result = _annualised_return(navs, 3)
        assert result is not None
        assert result > 0

    def test_5_year_cagr(self):
        navs = self._make_navs({0: 250, 1830: 100})
        result = _annualised_return(navs, 5)
        assert result is not None
        expected_cagr = ((250 / 100) ** (1 / 5) - 1) * 100
        assert result == pytest.approx(expected_cagr, abs=1.0)

    def test_sub_year_return(self):
        navs = self._make_navs({0: 110, 200: 100})
        result = _annualised_return(navs, 0.5)
        assert result is not None
        assert result == pytest.approx(10.0, abs=0.5)

    def test_zero_old_nav_returns_none(self):
        navs = self._make_navs({0: 100, 400: 0})
        assert _annualised_return(navs, 1) is None

    def test_negative_old_nav_returns_none(self):
        navs = self._make_navs({0: 100, 400: -10})
        assert _annualised_return(navs, 1) is None

    def test_non_numeric_nav_returns_none(self):
        navs = [
            {"date": "01-06-2025", "nav": "abc"},
            {"date": "01-06-2024", "nav": "100"},
        ]
        assert _annualised_return(navs, 1) is None

    def test_flat_return(self):
        navs = self._make_navs({0: 100, 400: 100})
        result = _annualised_return(navs, 1)
        assert result is not None
        assert result == pytest.approx(0.0, abs=0.1)

    def test_picks_first_matching_historical_entry(self):
        navs = self._make_navs({0: 150, 366: 100, 400: 90, 500: 80})
        result = _annualised_return(navs, 1)
        assert result is not None
        assert result == pytest.approx(50.0, abs=0.5)


# --------------- _sse tests ---------------

class TestSSE:
    def test_single_line(self):
        result = _sse("hello")
        assert result == "data: hello\n\n"

    def test_multiline(self):
        result = _sse("line1\nline2\nline3")
        assert result == "data: line1\ndata: line2\ndata: line3\n\n"

    def test_empty_string(self):
        result = _sse("")
        assert result == "data: \n\n"

    def test_carriage_return_stripped(self):
        result = _sse("hello\r\nworld")
        assert result == "data: hello\ndata: world\n\n"

    def test_numeric_input(self):
        result = _sse(42)
        assert result == "data: 42\n\n"

    def test_special_characters(self):
        result = _sse("₹1,000 — test & <html>")
        assert "data: ₹1,000 — test & <html>\n" in result

    def test_trailing_newline_in_input(self):
        result = _sse("hello\n")
        assert result == "data: hello\ndata: \n\n"
