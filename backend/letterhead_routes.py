"""Blank letterhead tool — reuses certificates_collection (type="letterhead")
so the upcoming universal document search (and the public verification
system, which already queries this collection by certificate_number
regardless of type) cover letterheads for free, with no extra plumbing.
"""
import uuid
from datetime import date, datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from auth_utils import require_admin
from database import certificates_collection
from storage_r2 import r2_enabled, upload_bytes, presigned_url
from letterhead_pdf import build_letterhead_pdf
from activity_service import log_activity

router = APIRouter(prefix="/api/letterheads", tags=["letterheads"])


async def _next_letterhead_number(year: int) -> str:
    prefix = f"TFD/LH/{year}/"
    count = await certificates_collection.count_documents({
        "type": "letterhead",
        "certificate_number": {"$regex": f"^{prefix.replace('/', chr(92) + '/')}"},
    })
    return f"{prefix}{count + 1:04d}"


class LetterheadCreate(BaseModel):
    title: Optional[str] = None
    content: str
    signature_type: Literal["ceo", "authorized"] = "ceo"
    include_disclaimer: bool = False


def _to_out(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    if doc.get("r2_key"):
        doc["pdf_url"] = presigned_url(doc["r2_key"])
    return doc


@router.post("")
async def create_letterhead(data: LetterheadCreate, admin: dict = Depends(require_admin)):
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    year = date.today().year
    letterhead_number = await _next_letterhead_number(year)
    pdf_bytes = build_letterhead_pdf(letterhead_number, data.content, data.signature_type, data.title or "", data.include_disclaimer)

    doc_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"letterheads/{doc_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    doc = {
        "id": doc_id,
        "certificate_number": letterhead_number,  # shared field name across certificates/letterheads for universal search
        "person_name": data.title or "Letterhead",
        "type": "letterhead",
        "department": None, "issue_date": date.today().isoformat(), "duration_label": None,
        "college": None, "linked_employee_id": None, "intern_id": None,
        "content_preview": data.content[:200], "signature_type": data.signature_type,
        "r2_key": r2_key, "created_by": admin["sub"], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await certificates_collection.insert_one(doc)
    await log_activity(admin["sub"], "letterhead_generated", f"Generated letterhead {letterhead_number}" + (f" — {data.title}" if data.title else ""), link="/portal/admin/letterheads")

    return _to_out(doc)


@router.get("")
async def list_letterheads(admin: dict = Depends(require_admin)):
    docs = []
    async for doc in certificates_collection.find({"type": "letterhead"}).sort("created_at", -1):
        docs.append(_to_out(doc))
    return docs


@router.get("/{letterhead_id}/download")
async def download_letterhead(letterhead_id: str, admin: dict = Depends(require_admin)):
    doc = await certificates_collection.find_one({"id": letterhead_id, "type": "letterhead"})
    if not doc:
        raise HTTPException(status_code=404, detail="Letterhead not found")
    if not doc.get("r2_key"):
        raise HTTPException(status_code=400, detail="No PDF stored for this letterhead")
    from storage_r2 import get_client, R2_BUCKET_NAME
    obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
    filename = f"Letterhead_{doc['certificate_number'].replace('/', '_')}.pdf"
    return StreamingResponse(io.BytesIO(obj["Body"].read()), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
