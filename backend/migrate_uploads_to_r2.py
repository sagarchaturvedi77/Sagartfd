"""One-time migration: move existing base64-in-Mongo files (employee
uploads + company documents) to Cloudflare R2, replacing the base64 blob
with an r2_key reference. Safe to re-run — skips anything that's already
migrated (has r2_key / no longer has base64 data).

Usage: python migrate_uploads_to_r2.py
"""
import asyncio
import base64
import re

from database import db
from storage_r2 import r2_enabled, upload_bytes


async def migrate_employee_uploads():
    migrated, skipped = 0, 0
    cursor = db.uploads.find({"data": {"$exists": True}})
    async for doc in cursor:
        data_uri = doc.get("data", "")
        m = re.match(r"^data:([^;]+);base64,(.+)$", data_uri, re.DOTALL)
        if not m:
            skipped += 1
            continue
        content_type, b64 = m.group(1), m.group(2)
        raw = base64.b64decode(b64)

        r2_key = f"employee-uploads/{doc['user_id']}/{doc['field']}"
        upload_bytes(r2_key, raw, content_type)

        # Only drop the base64 blob after the R2 upload has succeeded.
        await db.uploads.update_one(
            {"_id": doc["_id"]},
            {"$set": {"r2_key": r2_key, "content_type": content_type}, "$unset": {"data": ""}},
        )
        migrated += 1
        print(f"  uploads: migrated {doc['user_id']}/{doc['field']}")
    print(f"Employee uploads: {migrated} migrated, {skipped} skipped (unrecognized format)")


async def migrate_company_documents():
    migrated, skipped = 0, 0
    cursor = db.company_documents.find({"file_url": {"$regex": "^data:"}})
    async for doc in cursor:
        data_uri = doc.get("file_url", "")
        m = re.match(r"^data:([^;]+);base64,(.+)$", data_uri, re.DOTALL)
        if not m:
            skipped += 1
            continue
        content_type, b64 = m.group(1), m.group(2)
        raw = base64.b64decode(b64)

        filename = doc.get("file_name") or doc["id"]
        r2_key = f"company-documents/{doc['id']}/{filename}"
        upload_bytes(r2_key, raw, content_type)

        await db.company_documents.update_one(
            {"_id": doc["_id"]},
            {"$set": {"r2_key": r2_key, "file_type": content_type}, "$unset": {"file_url": ""}},
        )
        migrated += 1
        print(f"  company_documents: migrated {doc['title']}")
    print(f"Company documents: {migrated} migrated, {skipped} skipped (unrecognized format)")


async def main():
    if not r2_enabled():
        print("R2 is not configured (check R2_* env vars) — aborting.")
        return
    await migrate_employee_uploads()
    await migrate_company_documents()


if __name__ == "__main__":
    asyncio.run(main())
