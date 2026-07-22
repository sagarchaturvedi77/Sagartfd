"""One-off script: seeds 50 editorially-written blog posts (topic sip/lumpsum/
swp/financial_planning/term_insurance/health_insurance/elss_tax_saving/
retirement_planning/general_investing/awareness/brand_comparison) directly
into internship_content_collection as status="published", bypassing the
student-submission/review pipeline entirely (student_id="official-tfd",
student_name="Sagar Chaturvedi" -> surfaces as author_name on the public
site). Not wired into any route; run manually once.

Run from repo root or backend/ — sys.path is patched below so `import
database` resolves either way:
    python backend/scripts/seed_blog_posts.py
"""
import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import internship_content_collection  # noqa: E402
from internship_content_models import TOPIC_PRODUCT_LINKS  # noqa: E402

from seed_blog_posts_data import POSTS  # noqa: E402


async def main():
    now = datetime.now(timezone.utc)
    n = len(POSTS)
    docs = []
    for i, p in enumerate(POSTS):
        # Most recent first (i=0 newest), staggered across ~60 days so posts
        # don't all show an identical publish date.
        published_at = now - timedelta(hours=i * (60 * 24 / max(n, 1)) + (i % 5))
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
        }
        docs.append(doc)

    result = await internship_content_collection.insert_many(docs)
    print(f"Inserted {len(result.inserted_ids)} blog posts into internship_content_collection.")


if __name__ == "__main__":
    asyncio.run(main())
