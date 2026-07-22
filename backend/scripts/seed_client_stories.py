"""One-off script: seeds 50 client-success-story blog posts (composite,
illustrative problem -> TFD advisory -> solution narrative arc) directly
into internship_content_collection as status="published", bypassing the
student-submission/review pipeline entirely -- same pattern as
seed_blog_posts.py, but for this second, story-format batch (see
seed_client_stories_data.py for the compliance note on composite personas).

Timestamps are interleaved across the same ~90-day window as
seed_blog_posts.py's existing 50 posts, offset to a fixed :17-past-the-hour
mark (existing posts land on other minutes) so no two posts ever share an
exact instant, while both batches mix naturally in a single newest-first
feed (the public list view has no pagination -- it just shows the most
recent N posts -- so stacking this whole batch strictly older than the
other 50 would make it invisible on the default /blog page).

Run from repo root or backend/ -- sys.path is patched below so `import
database` resolves either way:
    python backend/scripts/seed_client_stories.py
"""
import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import internship_content_collection  # noqa: E402
from internship_content_models import TOPIC_PRODUCT_LINKS  # noqa: E402

from seed_client_stories_data import STORIES  # noqa: E402


async def main():
    now = datetime.now(timezone.utc)
    n = len(STORIES)
    docs = []
    for i, p in enumerate(STORIES):
        # i=0 is the newest, spread evenly back across ~90 days so this
        # batch interleaves with the existing 50 general-topic posts
        # (which span roughly the same ~90-day window) in one combined
        # newest-first feed. Minute is pinned to :17 and second to :43 so
        # this batch's timestamps never land on the exact same instant as
        # the other batch's (whose scripts use a different offset pattern).
        days_back = i * (90 / max(n - 1, 1))
        base = now - timedelta(days=days_back)
        published_at = base.replace(minute=17, second=43, microsecond=0)
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
        }
        docs.append(doc)

    result = await internship_content_collection.insert_many(docs)
    print(f"Inserted {len(result.inserted_ids)} client-story blog posts into internship_content_collection.")


if __name__ == "__main__":
    asyncio.run(main())
