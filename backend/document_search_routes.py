"""Universal admin document search — one search box across every document
type this system generates (invoices, certificates, offer/completion
letters, letterheads), since they all now share enough structure
(certificates_collection with a `type` discriminator, or invoices_collection)
to be queried and normalized into one result shape.
"""
import re
from typing import Optional

from fastapi import APIRouter, Depends, Query

from auth_utils import require_admin
from database import certificates_collection, invoices_collection, users_collection
from storage_r2 import presigned_url

router = APIRouter(prefix="/api/documents", tags=["documents"])

_CERT_TYPE_BUCKETS = {
    "certificate": ["internship", "employee", "achievement"],
    "offer_letter": ["offer_letter"],
    "completion_letter": ["completion_letter"],
    "letterhead": ["letterhead"],
}


def _regex(q: str):
    return {"$regex": re.escape(q), "$options": "i"}


async def _creator_name_map() -> dict:
    names = {}
    async for u in users_collection.find({"role": "admin"}, {"id": 1, "name": 1}):
        names[u["id"]] = u["name"]
    return names


def _cert_out(doc: dict, names: dict) -> dict:
    return {
        "id": doc["id"],
        "document_type": doc.get("type"),
        "document_number": doc.get("certificate_number"),
        "person_name": doc.get("person_name"),
        "issue_date": doc.get("issue_date"),
        "created_by": doc.get("created_by"),
        "created_by_name": names.get(doc.get("created_by"), doc.get("created_by")),
        "created_at": doc.get("created_at"),
        "pdf_url": presigned_url(doc["r2_key"]) if doc.get("r2_key") else None,
        "extra": {"department": doc.get("department"), "duration_label": doc.get("duration_label")},
    }


def _invoice_out(doc: dict, names: dict) -> dict:
    return {
        "id": doc["id"],
        "document_type": "invoice",
        "document_number": doc.get("invoice_number"),
        "person_name": doc.get("bill_to_name"),
        "issue_date": doc.get("invoice_date"),
        "created_by": doc.get("created_by"),
        "created_by_name": names.get(doc.get("created_by"), doc.get("created_by")),
        "created_at": doc.get("created_at"),
        "pdf_url": presigned_url(doc["r2_key"]) if doc.get("r2_key") else None,
        "extra": {"total": doc.get("total"), "payment_method": doc.get("payment_method")},
    }


@router.get("/search")
async def search_documents(
    q: str = "",
    type: str = Query("", alias="type"),
    admin: dict = Depends(require_admin),
):
    names = await _creator_name_map()
    results = []
    q = q.strip()

    if type in ("", "all", *_CERT_TYPE_BUCKETS.keys()):
        cert_query = {}
        if type in _CERT_TYPE_BUCKETS:
            cert_query["type"] = {"$in": _CERT_TYPE_BUCKETS[type]}
        if q:
            cert_query["$or"] = [{"person_name": _regex(q)}, {"certificate_number": _regex(q)}]
        async for doc in certificates_collection.find(cert_query).sort("created_at", -1).limit(200):
            results.append(_cert_out(doc, names))

    if type in ("", "all", "invoice"):
        inv_query = {}
        if q:
            inv_query["$or"] = [{"bill_to_name": _regex(q)}, {"invoice_number": _regex(q)}]
        async for doc in invoices_collection.find(inv_query).sort("created_at", -1).limit(200):
            results.append(_invoice_out(doc, names))

    results.sort(key=lambda r: r["created_at"] or "", reverse=True)
    return results[:200]
