"""Leave Management — employees apply, admin approves/rejects."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth_utils import get_current_user_payload, require_admin
from database import leaves_collection, users_collection

router = APIRouter(prefix="/api/leaves", tags=["leaves"])

LEAVE_TYPES = {"casual", "sick", "earned", "half_day", "wfh", "other"}
STATUS_OPTS = {"pending", "approved", "rejected"}


class LeaveCreate(BaseModel):
    leave_type: str = "casual"      # casual | sick | earned | half_day | wfh | other
    from_date: str                  # YYYY-MM-DD
    to_date: str                    # YYYY-MM-DD
    reason: Optional[str] = None
    half_day_session: Optional[str] = None  # "morning" | "afternoon" (for half_day type)


class LeaveStatusUpdate(BaseModel):
    status: str  # approved | rejected
    admin_note: Optional[str] = None


# ── Employee: Apply ───────────────────────────────────────────────
@router.post("/")
async def apply_leave(data: LeaveCreate, user=Depends(get_current_user_payload)):
    if data.leave_type not in LEAVE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid leave_type. Use: {', '.join(LEAVE_TYPES)}")

    user_doc = await users_collection.find_one({"id": user["sub"]})
    leave = {
        "id": str(uuid.uuid4()),
        "employee_id": user["sub"],
        "employee_name": user_doc.get("name", "Unknown") if user_doc else "Unknown",
        "leave_type": data.leave_type,
        "from_date": data.from_date,
        "to_date": data.to_date,
        "reason": data.reason or "",
        "half_day_session": data.half_day_session,
        "status": "pending",
        "admin_note": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await leaves_collection.insert_one(leave)
    leave.pop("_id", None)
    return leave


# ── Employee: View own leaves ─────────────────────────────────────
@router.get("/my")
async def my_leaves(user=Depends(get_current_user_payload)):
    cursor = leaves_collection.find({"employee_id": user["sub"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(100)


# ── Admin: View all leaves ────────────────────────────────────────
@router.get("/")
async def all_leaves(
    status: Optional[str] = Query(None),
    admin=Depends(require_admin)
):
    query = {}
    if status and status in STATUS_OPTS:
        query["status"] = status
    cursor = leaves_collection.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


# ── Admin: Approve / Reject ───────────────────────────────────────
@router.put("/{leave_id}")
async def update_leave_status(leave_id: str, data: LeaveStatusUpdate, admin=Depends(require_admin)):
    if data.status not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
    result = await leaves_collection.find_one_and_update(
        {"id": leave_id},
        {"$set": {
            "status": data.status,
            "admin_note": data.admin_note,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Leave not found")
    result.pop("_id", None)
    return result


# ── Admin: Delete a leave record ──────────────────────────────────
@router.delete("/{leave_id}")
async def delete_leave(leave_id: str, admin=Depends(require_admin)):
    res = await leaves_collection.delete_one({"id": leave_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}
