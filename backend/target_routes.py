from fastapi import APIRouter, HTTPException, Depends

from datetime import datetime

from target_models import TargetCreate, TargetEditIn, TargetUpdate, EmployeeTargetUpdate, TargetInDB, TargetOut
from auth_utils import get_current_user_payload, require_admin
from database import targets_collection, users_collection
from notification_service import create_notification

router = APIRouter(prefix="/api/targets", tags=["targets"])


def to_target_out(doc: dict) -> TargetOut:
    target_amt = doc.get("target_amount", 1)
    achieved = doc.get("achieved_amount", 0)
    pct = round((achieved / target_amt) * 100, 1) if target_amt > 0 else 0
    return TargetOut(
        id=doc["id"],
        employee_id=doc["employee_id"],
        employee_name=doc.get("employee_name", ""),
        month=doc["month"],
        year=doc["year"],
        target_amount=target_amt,
        achieved_amount=achieved,
        unit=doc.get("unit", "amount"),
        target_type=doc.get("target_type", "SIP"),
        target_description=doc.get("target_description"),
        progress_pct=pct,
        note=doc.get("note"),
        details=doc.get("details"),
        updated_at=doc.get("updated_at"),
    )


@router.post("/set", response_model=TargetOut)
async def set_target(data: TargetCreate, admin: dict = Depends(require_admin)):
    """ADMIN ONLY — add a new target line item for an employee's month.
    Employees can carry several distinct targets in the same month (e.g.
    "5 SIPs" + "₹15,000 revenue" + "3 courses") — this always creates a new
    line item rather than overwriting whatever was set before; use PUT
    /{target_id} to edit an existing one instead."""
    user = await users_collection.find_one({"id": data.employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    target = TargetInDB(
        employee_id=data.employee_id,
        employee_name=user["name"],
        month=data.month,
        year=data.year,
        target_amount=data.target_amount,
        unit=data.unit,
        target_type=data.target_type,
        target_description=data.target_description,
    )
    await targets_collection.insert_one(target.dict())
    return to_target_out(target.dict())


@router.put("/{target_id}", response_model=TargetOut)
async def edit_target(target_id: str, data: TargetEditIn, admin: dict = Depends(require_admin)):
    """ADMIN ONLY — edit an existing target line item's definition (amount,
    unit, type, description) without touching its progress."""
    target = await targets_collection.find_one({"id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await targets_collection.update_one({"id": target_id}, {"$set": updates})
        target.update(updates)
    return to_target_out(target)


@router.delete("/{target_id}")
async def delete_target(target_id: str, admin: dict = Depends(require_admin)):
    """ADMIN ONLY — remove a target line item entirely."""
    result = await targets_collection.delete_one({"id": target_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    return {"status": "deleted"}


@router.patch("/{target_id}/progress", response_model=TargetOut)
async def update_progress(
    target_id: str,
    data: TargetUpdate,
    admin: dict = Depends(require_admin),
):
    """ADMIN ONLY — update achieved amount for a target."""
    target = await targets_collection.find_one({"id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    await targets_collection.update_one(
        {"id": target_id},
        {"$set": {"achieved_amount": data.achieved_amount}},
    )
    target["achieved_amount"] = data.achieved_amount
    return to_target_out(target)


@router.patch("/my/{target_id}/progress", response_model=TargetOut)
async def employee_update_progress(
    target_id: str,
    data: EmployeeTargetUpdate,
    payload: dict = Depends(get_current_user_payload),
):
    """Employee self-reports achieved amount + work details for their own target.
    Progress auto-updates and admins get notified."""
    target = await targets_collection.find_one({"id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    if target["employee_id"] != payload["sub"]:
        raise HTTPException(status_code=403, detail="This is not your target")
    if data.achieved_amount < 0:
        raise HTTPException(status_code=400, detail="Achieved amount cannot be negative")

    updates = {
        "achieved_amount": data.achieved_amount,
        "note": data.note,
        "updated_at": datetime.utcnow(),
    }
    if data.details is not None:
        updates["details"] = data.details
    await targets_collection.update_one(
        {"id": target_id},
        {"$set": updates},
    )
    target["achieved_amount"] = data.achieved_amount
    target["note"] = data.note
    if data.details is not None:
        target["details"] = data.details
    target["updated_at"] = datetime.utcnow()

    # Notify all admins about the self-reported progress
    emp_name = target.get("employee_name", "An employee")
    async for admin in users_collection.find({"role": "admin"}):
        await create_notification(
            user_id=admin["id"],
            title=f"Target update: {emp_name}",
            body=f"{emp_name} reported {data.achieved_amount:,.0f} achieved"
                 + (f" — {data.note}" if data.note else ""),
            n_type="target",
            link="/portal/admin/targets",
        )
    return to_target_out(target)


@router.get("/my", response_model=list[TargetOut])
async def my_targets(
    month: int | None = None,
    year: int | None = None,
    payload: dict = Depends(get_current_user_payload),
):
    """Employee views their own targets."""
    query = {"employee_id": payload["sub"]}
    if month and year:
        query["month"] = month
        query["year"] = year
    cursor = targets_collection.find(query).sort([("year", -1), ("month", -1)])
    return [to_target_out(doc) async for doc in cursor]


@router.get("/all", response_model=list[TargetOut])
async def all_targets(
    month: int | None = None,
    year: int | None = None,
    admin: dict = Depends(require_admin),
):
    """ADMIN ONLY — view all employee targets."""
    query = {}
    if month and year:
        query["month"] = month
        query["year"] = year
    cursor = targets_collection.find(query).sort([("year", -1), ("month", -1)])
    return [to_target_out(doc) async for doc in cursor]
