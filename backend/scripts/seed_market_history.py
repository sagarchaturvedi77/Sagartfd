"""One-off script: seeds 50 editorially-written blog posts covering REAL,
publicly-documented Indian stock market crashes, scams and corrections
(1992 Harshad Mehta through 2025) directly into internship_content_collection
as status="published", bypassing the student-submission/review pipeline
entirely -- same pattern as seed_blog_posts.py / seed_client_stories.py,
but for this third, market-history batch (see seed_market_history_data.py
for the compliance note on every event being real/well-documented).

Dates are intentionally NOT "now minus N days" like the other two batches --
this batch's `created_at`/`published_at` are spread across a fixed
2024-01-01 through 2026-07-23 window (never later than "today"), roughly
evenly interleaved (~one post every 2-3 weeks) with a little random jitter
so the cadence doesn't look robotically uniform -- an SEO "content
freshness over time" signal the site owner specifically asked for. Each
post also gets a `date_modified` within the last 30 days (still never
later than 2026-07-23), always after that post's own published_at,
simulating a "reviewed and refreshed" editorial pass.

Run from repo root or backend/ -- sys.path is patched below so `import
database` resolves either way:
    python backend/scripts/seed_market_history.py
"""
import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import internship_content_collection  # noqa: E402
from internship_content_models import TOPIC_PRODUCT_LINKS  # noqa: E402

from seed_market_history_data import POSTS  # noqa: E402

# Fixed window -- never later than "today" (2026-07-23), per the task's
# explicit no-future-dates requirement.
RANGE_START = datetime(2024, 1, 1, tzinfo=timezone.utc)
RANGE_END = datetime(2026, 7, 23, 23, 0, 0, tzinfo=timezone.utc)
TODAY = RANGE_END


def _published_at_for(i: int, n: int) -> datetime:
    """Evenly spread post i of n across RANGE_START..RANGE_END (index 0 =
    earliest, index n-1 = latest), with a few days of random jitter so
    consecutive posts don't land on a perfectly robotic cadence -- still
    strictly interleaved/alternating across the ~2.5 year span rather than
    clustered, per the freshness-signal requirement.
    """
    total_days = (RANGE_END - RANGE_START).days
    step = total_days / max(n - 1, 1)
    base = RANGE_START + timedelta(days=i * step)
    jitter_days = random.uniform(-3, 3)
    jitter_hours = random.uniform(0, 23)
    jitter_minutes = random.uniform(0, 59)
    dt = base + timedelta(days=jitter_days, hours=jitter_hours, minutes=jitter_minutes)
    # Clamp inside the fixed window.
    if dt < RANGE_START:
        dt = RANGE_START + timedelta(hours=random.uniform(0, 12))
    if dt > RANGE_END:
        dt = RANGE_END - timedelta(hours=random.uniform(0, 12))
    return dt


def _date_modified_for(published_at: datetime) -> datetime:
    """A 'reviewed and refreshed' date within the last 30 days, always
    strictly after published_at, and never later than TODAY."""
    window_start = TODAY - timedelta(days=30)
    earliest = max(window_start, published_at + timedelta(hours=1))
    if earliest >= TODAY:
        # published_at itself is within an hour of TODAY -- clamp to TODAY.
        return TODAY
    span_seconds = (TODAY - earliest).total_seconds()
    return earliest + timedelta(seconds=random.uniform(0, span_seconds))


async def main():
    random.seed(20260723)  # deterministic spread across runs
    n = len(POSTS)
    docs = []
    for i, p in enumerate(POSTS):
        published_at = _published_at_for(i, n)
        date_modified = _date_modified_for(published_at)
        doc = {
            "id": str(uuid.uuid4()),
            "student_id": "official-tfd",
            "student_name": "Sagar Chaturvedi",
            "track": "Official",
            "content_type": "blog",
            "topic": p["topic"],
            "title": p["title"].strip(),
            "body": p["body"].strip(),
            "design_link": None,
            "status": "published",
            "quality_score": 100.0,
            "gemini_feedback": None,
            "merged_into_id": None,
            "contributor_ids": [],
            "product_link": TOPIC_PRODUCT_LINKS.get(p["topic"]),
            "admin_note": None,
            "reviewed_by": "official-tfd",
            "created_at": published_at.isoformat(),
            "reviewed_at": published_at.isoformat(),
            "published_at": published_at.isoformat(),
            "meta_description": p["meta_description"].strip(),
            "keywords": p["keywords"].strip(),
            "title_en": p["title_en"].strip(),
            "body_en": p["body_en"].strip(),
            "hashtags": p.get("hashtags"),
            "date_modified": date_modified.date().isoformat(),
        }
        docs.append(doc)

    result = await internship_content_collection.insert_many(docs)
    print(f"Inserted {len(result.inserted_ids)} market-history blog posts into internship_content_collection.")
    dates = sorted(d["published_at"] for d in docs)
    print(f"published_at range: {dates[0]} .. {dates[-1]}")


if __name__ == "__main__":
    asyncio.run(main())
