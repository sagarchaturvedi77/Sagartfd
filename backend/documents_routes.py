"""Admin Documents section — company documents storage (upload/list/delete)."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel

from auth_utils import require_admin, get_current_user_payload
from database import db
from storage_r2 import r2_enabled, upload_bytes, presigned_url

router = APIRouter(prefix="/api/documents", tags=["documents"])

documents_collection = db["company_documents"]


class DocumentCreate(BaseModel):
    title: str
    category: str = "general"
    description: str = ""
    file_url: str = ""
    file_name: str = ""
    file_type: str = ""


def _doc_to_out(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    if doc.get("r2_key"):
        doc["file_url"] = presigned_url(doc["r2_key"])
    return doc


@router.get("")
async def list_documents(payload: dict = Depends(get_current_user_payload)):
    """List all company documents (accessible to admin and employees)."""
    docs = []
    cursor = documents_collection.find({}).sort("created_at", -1)
    async for doc in cursor:
        docs.append(_doc_to_out(doc))
    return docs


@router.post("")
async def create_document(data: DocumentCreate, admin: dict = Depends(require_admin)):
    """Admin registers a document that's just an external link (no file to upload)."""
    doc = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "category": data.category,
        "description": data.description,
        "file_url": data.file_url,
        "file_name": data.file_name,
        "file_type": data.file_type,
        "uploaded_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await documents_collection.insert_one(doc)
    return _doc_to_out(doc)


@router.post("/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("general"),
    description: str = Form(""),
    admin: dict = Depends(require_admin),
):
    """Admin uploads an actual file — goes to R2 (or falls back to
    base64-in-Mongo if R2 isn't configured), only the reference is stored."""
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 15MB)")

    content_type = file.content_type or "application/octet-stream"
    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "title": title,
        "category": category,
        "description": description,
        "file_name": file.filename,
        "file_type": content_type,
        "uploaded_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if r2_enabled():
        r2_key = f"company-documents/{doc_id}/{file.filename}"
        upload_bytes(r2_key, data, content_type)
        doc["r2_key"] = r2_key
    else:
        import base64
        b64 = base64.b64encode(data).decode()
        doc["file_url"] = f"data:{content_type};base64,{b64}"

    await documents_collection.insert_one(doc)
    return _doc_to_out(doc)


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, admin: dict = Depends(require_admin)):
    """Admin deletes a company document (and its file in R2, if any)."""
    doc = await documents_collection.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("r2_key"):
        from storage_r2 import delete_object
        delete_object(doc["r2_key"])
    await documents_collection.delete_one({"id": doc_id})
    return {"status": "deleted"}


@router.put("/{doc_id}")
async def update_document(doc_id: str, request: Request, admin: dict = Depends(require_admin)):
    """Admin updates a company document."""
    data = await request.json()
    allowed = {"title", "category", "description", "file_url", "file_name", "file_type"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await documents_collection.find_one_and_update(
        {"id": doc_id}, {"$set": updates}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
    result.pop("_id", None)
    return result
