from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from attendance_models import AttendanceRecord, AttendanceOut
from auth_utils import get_current_user_payload, require_admin
from database import attendance_collection, users_collection

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def to_attendance_out(doc: dict) -> AttendanceOut:
    return AttendanceOut(**{k: doc.get(k) for k in AttendanceOut.model_fields})


@router.post("/clock-in", response_model=AttendanceOut)
async def clock_in(payload: dict = Depends(get_current_user_payload)):
    """Employee clocks in for the day."""
    employee_id = payload["sub"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    existing = await attendance_collection.find_one(
        {"employee_id": employee_id, "date": today}
    )
    if existing and existing.get("clock_in"):
        raise HTTPException(status_code=400, detail="Already clocked in today")

    user = await users_collection.find_one({"id": employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    if existing:
        await attendance_collection.update_one(
            {"id": existing["id"]},
            {"$set": {"clock_in": now, "status": "present"}},
        )
        existing["clock_in"] = now
        existing["status"] = "present"
        return to_attendance_out(existing)

    record = AttendanceRecord(
        employee_id=employee_id,
        employee_name=user["name"],
        date=today,
        clock_in=now,
        status="present",
    )
    await attendance_collection.insert_one(record.dict())
    return to_attendance_out(record.dict())


@router.post("/clock-out", response_model=AttendanceOut)
async def clock_out(payload: dict = Depends(get_current_user_payload)):
    """Employee clocks out for the day."""
    employee_id = payload["sub"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = await attendance_collection.find_one(
        {"employee_id": employee_id, "date": today}
    )
    if not record or not record.get("clock_in"):
        raise HTTPException(status_code=400, detail="You haven't clocked in today")
    if record.get("clock_out"):
        raise HTTPException(status_code=400, detail="Already clocked out today")

    now = datetime.now(timezone.utc)
    clock_in_time = record["clock_in"]
    if isinstance(clock_in_time, str):
        clock_in_time = datetime.fromisoformat(clock_in_time)
    if clock_in_time.tzinfo is None:
        clock_in_time = clock_in_time.replace(tzinfo=timezone.utc)
    total_hours = round((now - clock_in_time).total_seconds() / 3600, 2)
    status = "present" if total_hours >= 4 else "half-day"

    await attendance_collection.update_one(
        {"id": record["id"]},
        {"$set": {"clock_out": now, "total_hours": total_hours, "status": status}},
    )
    record["clock_out"] = now
    record["total_hours"] = total_hours
    record["status"] = status
    return to_attendance_out(record)


@router.get("/today", response_model=AttendanceOut | None)
async def get_today(payload: dict = Depends(get_current_user_payload)):
    """Get current employee's attendance for today."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = await attendance_collection.find_one(
        {"employee_id": payload["sub"], "date": today}
    )
    if not record:
        return None
    return to_attendance_out(record)


@router.get("/my-history", response_model=list[AttendanceOut])
async def my_history(
    month: int | None = None,
    year: int | None = None,
    payload: dict = Depends(get_current_user_payload),
):
    """Employee views their own attendance history (optionally filtered by month/year)."""
    query = {"employee_id": payload["sub"]}
    if month and year:
        prefix = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{prefix}"}
    cursor = attendance_collection.find(query).sort("date", -1)
    return [to_attendance_out(doc) async for doc in cursor]


@router.get("/all", response_model=list[AttendanceOut])
async def all_attendance(
    month: int | None = None,
    year: int | None = None,
    employee_id: str | None = None,
    admin: dict = Depends(require_admin),
):
    """ADMIN ONLY — view attendance records across all employees."""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if month and year:
        prefix = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{prefix}"}
    cursor = attendance_collection.find(query).sort("date", -1)
    return [to_attendance_out(doc) async for doc in cursor]


@router.get("/summary")
async def attendance_summary(
    month: int,
    year: int,
    admin: dict = Depends(require_admin),
):
    """ADMIN ONLY — monthly summary: per-employee present days, total hours."""
    prefix = f"{year}-{month:02d}"
    cursor = attendance_collection.find({"date": {"$regex": f"^{prefix}"}})
    emp_data = {}
    async for doc in cursor:
        eid = doc["employee_id"]
        if eid not in emp_data:
            emp_data[eid] = {
                "employee_id": eid,
                "employee_name": doc.get("employee_name", ""),
                "present_days": 0,
                "half_days": 0,
                "total_hours": 0,
            }
        if doc.get("status") == "present":
            emp_data[eid]["present_days"] += 1
        elif doc.get("status") == "half-day":
            emp_data[eid]["half_days"] += 1
        emp_data[eid]["total_hours"] += doc.get("total_hours") or 0

    for v in emp_data.values():
        v["total_hours"] = round(v["total_hours"], 2)

    return list(emp_data.values())
