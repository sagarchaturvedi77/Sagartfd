"""Admin Documents section — company documents storage (upload/list/delete)."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth_utils import require_admin, get_current_user_payload
from database import db

router = APIRouter(prefix="/api/documents", tags=["documents"])

documents_collection = db["company_documents"]


class DocumentCreate(BaseModel):
    title: str
    category: str = "general"
    description: str = ""
    file_url: str = ""
    file_name: str = ""
    file_type: str = ""


@router.get("")
async def list_documents(payload: dict = Depends(get_current_user_payload)):
    """List all company documents (accessible to admin and employees)."""
    docs = []
    cursor = documents_collection.find({}).sort("created_at", -1)
    async for doc in cursor:
        doc.pop("_id", None)
        docs.append(doc)
    return docs


@router.post("")
async def create_document(data: DocumentCreate, admin: dict = Depends(require_admin)):
    """Admin uploads a company document."""
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
    doc.pop("_id", None)
    return doc


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, admin: dict = Depends(require_admin)):
    """Admin deletes a company document."""
    result = await documents_collection.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
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
