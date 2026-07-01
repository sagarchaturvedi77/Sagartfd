from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
from typing import Optional
from pydantic import BaseModel

from attendance_models import AttendanceRecord, AttendanceOut, PunchLocation
from auth_utils import get_current_user_payload, require_admin
from database import attendance_collection, users_collection, settings_collection

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


# ── Haversine distance (meters) ──────────────────────────────────
def haversine_m(lat1, lon1, lat2, lon2):
    R = 6_371_000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlam = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlam / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


async def get_office_settings():
    doc = await settings_collection.find_one({"_id": "office"})
    if not doc:
        return {"lat": None, "lng": None, "radius_m": 500, "enforce": False}
    return {
        "lat": doc.get("lat"),
        "lng": doc.get("lng"),
        "radius_m": doc.get("radius_m", 500),
        "enforce": doc.get("enforce", False),
    }


# ── Office Settings Endpoints ─────────────────────────────────────
class OfficeSettings(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: int = 500
    enforce: bool = False


@router.get("/office-settings")
async def read_office_settings(user=Depends(get_current_user_payload)):
    return await get_office_settings()


@router.put("/office-settings")
async def update_office_settings(data: OfficeSettings, admin=Depends(require_admin)):
    await settings_collection.update_one(
        {"_id": "office"},
        {"$set": {"lat": data.lat, "lng": data.lng, "radius_m": data.radius_m, "enforce": data.enforce}},
        upsert=True,
    )
    return await get_office_settings()


def to_attendance_out(doc: dict) -> AttendanceOut:
    return AttendanceOut(**{k: doc.get(k) for k in AttendanceOut.model_fields})


def _loc_label(loc: PunchLocation | None) -> str | None:
    if not loc:
        return None
    if loc.address:
        return loc.address
    if loc.lat is not None and loc.lng is not None:
        return f"{loc.lat:.5f}, {loc.lng:.5f}"
    return None


@router.post("/clock-in", response_model=AttendanceOut)
async def clock_in(
    loc: PunchLocation = PunchLocation(),
    payload: dict = Depends(get_current_user_payload),
):
    """Employee clocks in for the day. Geofence is enforced if configured."""
    employee_id = payload["sub"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    existing = await attendance_collection.find_one(
        {"employee_id": employee_id, "date": today}
    )
    if existing and existing.get("clock_in"):
        raise HTTPException(status_code=400, detail="Already clocked in today")

    # Geofence check ─────────────────────────────────────────────
    office = await get_office_settings()
    if office["enforce"] and office["lat"] and office["lng"]:
        if loc.lat is None or loc.lng is None:
            raise HTTPException(
                status_code=400,
                detail="LOCATION_REQUIRED: Please allow location access to clock in."
            )
        dist = haversine_m(loc.lat, loc.lng, office["lat"], office["lng"])
        if dist > office["radius_m"]:
            raise HTTPException(
                status_code=403,
                detail=f"WRONG_LOCATION: You are {int(dist)}m from the office. Allowed range: {office['radius_m']}m."
            )
    # ────────────────────────────────────────────────────────────

    user = await users_collection.find_one({"id": employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    loc_fields = {
        "clock_in_location": _loc_label(loc),
        "clock_in_lat": loc.lat,
        "clock_in_lng": loc.lng,
    }
    if existing:
        await attendance_collection.update_one(
            {"id": existing["id"]},
            {"$set": {"clock_in": now, "status": "present", **loc_fields}},
        )
        existing.update({"clock_in": now, "status": "present", **loc_fields})
        return to_attendance_out(existing)

    record = AttendanceRecord(
        employee_id=employee_id,
        employee_name=user["name"],
        date=today,
        clock_in=now,
        status="present",
        clock_in_location=loc_fields["clock_in_location"],
        clock_in_lat=loc.lat,
        clock_in_lng=loc.lng,
    )
    await attendance_collection.insert_one(record.dict())
    return to_attendance_out(record.dict())


@router.post("/clock-out", response_model=AttendanceOut)
async def clock_out(
    loc: PunchLocation = PunchLocation(),
    payload: dict = Depends(get_current_user_payload),
):
    """Employee clocks out for the day (optionally with geolocation)."""
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

    loc_fields = {
        "clock_out_location": _loc_label(loc),
        "clock_out_lat": loc.lat,
        "clock_out_lng": loc.lng,
    }
    await attendance_collection.update_one(
        {"id": record["id"]},
        {"$set": {"clock_out": now, "total_hours": total_hours, "status": status, **loc_fields}},
    )
    record.update({"clock_out": now, "total_hours": total_hours, "status": status, **loc_fields})
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
