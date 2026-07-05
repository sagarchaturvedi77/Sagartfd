"""Services CRUD — Admin defines services offered by the company.
Employees see these services during call flows and lead updates."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth_utils import get_current_user_payload, require_admin
from database import db

router = APIRouter(prefix="/api/services", tags=["services"])

services_collection = db["services"]


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None  # e.g. Insurance, Investment, Tax, etc.
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_services(user=Depends(get_current_user_payload)):
    """Both admin and employees can see all active services."""
    cursor = services_collection.find({"is_active": {"$ne": False}}).sort("name", 1)
    results = []
    async for doc in cursor:
        doc.pop("_id", None)
        results.append(doc)
    return results


@router.get("/all")
async def list_all_services(admin=Depends(require_admin)):
    """Admin sees all services including inactive ones."""
    cursor = services_collection.find().sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc.pop("_id", None)
        results.append(doc)
    return results


@router.post("/")
async def create_service(data: ServiceCreate, admin=Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "is_active": data.is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await services_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/{service_id}")
async def update_service(service_id: str, data: ServiceUpdate, admin=Depends(require_admin)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await services_collection.find_one_and_update(
        {"id": service_id}, {"$set": updates}, return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    result.pop("_id", None)
    return result


@router.delete("/{service_id}")
async def delete_service(service_id: str, admin=Depends(require_admin)):
    result = await services_collection.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"status": "deleted"}
