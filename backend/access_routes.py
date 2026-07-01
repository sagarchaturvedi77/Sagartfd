"""Access Control — admin can enable/disable specific portal sections per employee."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from datetime import datetime, timezone

from auth_utils import get_current_user_payload, require_admin
from database import users_collection

router = APIRouter(prefix="/api/access", tags=["access"])

# All portal sections that admin can toggle per-employee
ALL_SECTIONS = [
    "attendance", "leads", "salary", "tasks", "targets",
    "profile", "calculators", "id_card", "leaves", "chat",
    "onboarding", "documents", "settings",
]

# Default: all sections enabled
DEFAULT_ACCESS = {s: True for s in ALL_SECTIONS}


class AccessUpdate(BaseModel):
    access: Dict[str, bool]  # e.g. {"salary": False, "leads": True}


@router.get("/{employee_id}")
async def get_employee_access(employee_id: str, user=Depends(get_current_user_payload)):
    """Employee can read their own access; admin can read anyone's."""
    if user["role"] != "admin" and user["sub"] != employee_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    emp = await users_collection.find_one({"id": employee_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    # Merge stored access with defaults so new sections appear as enabled
    stored = emp.get("portal_access") or {}
    return {**DEFAULT_ACCESS, **stored}


@router.put("/{employee_id}")
async def update_employee_access(employee_id: str, data: AccessUpdate, admin=Depends(require_admin)):
    """Admin updates which sections an employee can access."""
    # Only allow known section keys
    sanitized = {k: bool(v) for k, v in data.access.items() if k in ALL_SECTIONS}
    result = await users_collection.find_one_and_update(
        {"id": employee_id},
        {"$set": {
            "portal_access": sanitized,
            "access_updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    stored = result.get("portal_access") or {}
    return {**DEFAULT_ACCESS, **stored}


@router.get("/")
async def list_employee_access(admin=Depends(require_admin)):
    """Admin sees access summary for all employees."""
    cursor = users_collection.find({"role": "employee"}, {"_id": 0, "id": 1, "name": 1, "portal_access": 1})
    employees = await cursor.to_list(200)
    return [
        {
            "id": e["id"],
            "name": e.get("name", ""),
            "access": {**DEFAULT_ACCESS, **(e.get("portal_access") or {})}
        }
        for e in employees
    ]
