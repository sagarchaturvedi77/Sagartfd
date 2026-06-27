from fastapi import APIRouter, HTTPException, Depends

from target_models import TargetCreate, TargetUpdate, TargetInDB, TargetOut
from auth_utils import get_current_user_payload, require_admin
from database import targets_collection, users_collection

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
        target_type=doc.get("target_type", "SIP"),
        progress_pct=pct,
    )


@router.post("/set", response_model=TargetOut)
async def set_target(data: TargetCreate, admin: dict = Depends(require_admin)):
    """ADMIN ONLY — set or update monthly target for an employee."""
    user = await users_collection.find_one({"id": data.employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = await targets_collection.find_one({
        "employee_id": data.employee_id,
        "month": data.month,
        "year": data.year,
    })
    if existing:
        await targets_collection.update_one(
            {"id": existing["id"]},
            {"$set": {
                "target_amount": data.target_amount,
                "target_type": data.target_type,
            }},
        )
        existing["target_amount"] = data.target_amount
        existing["target_type"] = data.target_type
        return to_target_out(existing)

    target = TargetInDB(
        employee_id=data.employee_id,
        employee_name=user["name"],
        month=data.month,
        year=data.year,
        target_amount=data.target_amount,
        target_type=data.target_type,
    )
    await targets_collection.insert_one(target.dict())
    return to_target_out(target.dict())


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
