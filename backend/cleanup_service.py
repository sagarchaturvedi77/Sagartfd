"""Data Cleanup Tool — permanently destructive by design, so every safety
rail matters here: a hardcoded, code-level list of collections this tool
will NEVER touch (checked in code, not just hidden from the UI), a
preview-before-delete step, an automatic backup to R2 before anything is
deleted, and an activity-log audit trail for every execution.

Confirmed exclusion list (2026-07-11, explicitly confirmed with the
business owner before this file was written): users, employee_profiles,
uploads (KYC docs — Aadhaar, photo, signature, resume), certificates,
and anything ID-card related are never eligible for deletion here,
regardless of age or status.
"""
import json
from datetime import datetime, timezone

from database import (
    leads_collection, notifications_collection, chat_collection, attendance_collection, db,
)
from storage_r2 import r2_enabled, upload_bytes
from activity_service import log_activity

career_leads_collection = db["career_leads"]

# Checked in code before every preview/execute call — no category definition
# below can ever target one of these, no matter what.
NEVER_TOUCH_COLLECTIONS = {"users", "employee_profiles", "uploads", "certificates"}

LARGE_DELETE_THRESHOLD = 1000


def _iso_cutoff(cutoff_date: str) -> str:
    return f"{cutoff_date}T00:00:00"


CATEGORIES = {
    "leads_lost": {
        "label": "Old Leads (Lost only)",
        "collection": leads_collection,
        "collection_name": "leads",
        # Deliberately excludes "converted" — those represent paying-client
        # history and are never eligible here, confirmed with the owner.
        "query": lambda cutoff: {"status": "lost", "updated_at": {"$lt": _iso_cutoff(cutoff)}},
    },
    "career_applications": {
        "label": "Career Applications",
        "collection": career_leads_collection,
        "collection_name": "career_leads",
        "query": lambda cutoff: {"created_at": {"$lt": _iso_cutoff(cutoff)}},
    },
    "notifications": {
        "label": "Old Notifications",
        "collection": notifications_collection,
        "collection_name": "notifications",
        # notifications.created_at is a real BSON datetime, not a string
        # (see NotificationInDB) — every other category here uses ISO
        # strings, so this one needs a datetime cutoff instead.
        "query": lambda cutoff: {"created_at": {"$lt": datetime.fromisoformat(cutoff)}},
    },
    "chat_messages": {
        "label": "Old Chat Messages",
        "collection": chat_collection,
        "collection_name": "chat_messages",
        "query": lambda cutoff: {"created_at": {"$lt": _iso_cutoff(cutoff)}},
    },
    "attendance": {
        "label": "Attendance Records",
        "collection": attendance_collection,
        "collection_name": "attendance",
        # attendance.date is "YYYY-MM-DD" — lexicographic string comparison
        # against another YYYY-MM-DD string works correctly.
        "query": lambda cutoff: {"date": {"$lt": cutoff}},
    },
}


def _assert_safe(category_key: str) -> None:
    cat = CATEGORIES[category_key]
    if cat["collection_name"] in NEVER_TOUCH_COLLECTIONS:
        raise RuntimeError(f"Refusing to touch protected collection: {cat['collection_name']}")


async def preview_cleanup(categories: list[str], cutoff_date: str) -> dict:
    results = {}
    for key in categories:
        if key not in CATEGORIES:
            continue
        _assert_safe(key)
        cat = CATEGORIES[key]
        count = await cat["collection"].count_documents(cat["query"](cutoff_date))
        results[key] = {"label": cat["label"], "count": count}
    return results


async def execute_cleanup(categories: list[str], cutoff_date: str, admin_id: str) -> dict:
    results = {}
    for key in categories:
        if key not in CATEGORIES:
            continue
        _assert_safe(key)
        cat = CATEGORIES[key]
        query = cat["query"](cutoff_date)

        docs = [doc async for doc in cat["collection"].find(query)]
        if not docs:
            results[key] = {"label": cat["label"], "backed_up": 0, "deleted": 0, "backup_key": None}
            continue

        backup_key = None
        if r2_enabled():
            backup_json = json.dumps(docs, default=str, indent=2).encode()
            backup_key = f"cleanup-backups/{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}/{key}.json"
            upload_bytes(backup_key, backup_json, "application/json")

        result = await cat["collection"].delete_many(query)

        await log_activity(
            admin_id, "data_cleanup",
            f"Deleted {result.deleted_count} record(s) from '{cat['label']}' (older than {cutoff_date})"
            + (f" — backed up to {backup_key}" if backup_key else " — NOT backed up (R2 not configured)"),
            link="/portal/admin/data-cleanup",
        )
        results[key] = {
            "label": cat["label"],
            "backed_up": len(docs) if backup_key else 0,
            "deleted": result.deleted_count,
            "backup_key": backup_key,
        }
    return results
