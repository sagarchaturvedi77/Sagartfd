"""One-off script: fixes the blog's published_at spacing.

The three seed batches (general, client-stories, market-history) were each
dated independently, and their ranges overlapped -- resulting in ~29 dates
with 2-3 posts published on the same day, which reads as an obviously
batch-generated blog rather than someone posting regularly. Site owner
asked for a realistic cadence instead: mostly a 1-2 day gap between posts,
occasionally up to 5 days, and never two posts on the same date.

This re-dates ALL published blog posts (not just one batch), preserving
each post's relative chronological order (the post that was published
earliest before this script runs is still the earliest after), anchored so
the most recent post lands on "today" (2026-07-23, never later) and earlier
posts step backward from there. date_modified is set for every post (100 of
the existing 150 didn't have one yet) to a few hours-to-a-few-days after its
own published_at, never later than today.

Run from repo root or backend/:
    python backend/scripts/respace_blog_dates.py
"""
import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import internship_content_collection  # noqa: E402

TODAY = datetime(2026, 7, 23, 9, 0, 0, tzinfo=timezone.utc)

# Weighted so most gaps are 1-2 days, a few are 3-4, and a 5-day gap is the
# rare/occasional one -- matches "har 1-2 din ka gap, kabhi 5 din ka gap".
GAP_CHOICES = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 5]


def _parse(dt_str):
    if not dt_str:
        return TODAY
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except ValueError:
        return TODAY


async def main():
    random.seed(20260723)
    cursor = internship_content_collection.find(
        {"status": "published", "content_type": "blog"},
        {"_id": 0, "id": 1, "published_at": 1, "title": 1},
    )
    docs = await cursor.to_list(length=1000)
    docs.sort(key=lambda d: _parse(d.get("published_at")))
    n = len(docs)
    if n == 0:
        print("No published blog posts found.")
        return

    # Walk backward from TODAY so the newest post is anchored at "today"
    # and every earlier post steps back by a randomized realistic gap.
    new_dates = [None] * n
    new_dates[n - 1] = TODAY
    for i in range(n - 2, -1, -1):
        gap_days = random.choice(GAP_CHOICES)
        hour = random.uniform(7, 21)
        minute = random.uniform(0, 59)
        prev_date = new_dates[i + 1] - timedelta(days=gap_days)
        new_dates[i] = prev_date.replace(hour=int(hour), minute=int(minute), second=0, microsecond=0)

    updates = 0
    for doc, new_pub in zip(docs, new_dates):
        modified_offset = timedelta(hours=random.uniform(1, 48))
        new_modified = min(new_pub + modified_offset, TODAY)
        await internship_content_collection.update_one(
            {"id": doc["id"]},
            {"$set": {
                "published_at": new_pub.isoformat(),
                "date_modified": new_modified.date().isoformat(),
            }},
        )
        updates += 1

    print(f"Re-dated {updates} blog posts.")
    print(f"Range: {new_dates[0].date().isoformat()} .. {new_dates[-1].date().isoformat()}")
    all_dates = [d.date().isoformat() for d in new_dates]
    dupes = {d for d in all_dates if all_dates.count(d) > 1}
    print(f"Duplicate dates remaining: {len(dupes)}")


if __name__ == "__main__":
    asyncio.run(main())
