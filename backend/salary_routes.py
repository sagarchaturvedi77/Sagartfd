"""Salary management routes.

Admin:
  POST  /api/salary/config/{employee_id}  — set/update salary config
  GET   /api/salary/config/{employee_id}  — get salary config
  POST  /api/salary/generate              — generate slips for a month
  GET   /api/salary/slips                 — list all slips (filter by month/year)
  POST  /api/salary/slips/{slip_id}/finalize — finalize a slip

Employee:
  GET   /api/salary/my-slips              — employee's own slips
  GET   /api/salary/slips/{slip_id}       — single slip detail
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from salary_models import SalaryConfig, SalarySlip, SalaryConfigIn, GenerateSlipIn
from auth_utils import get_current_user_payload, require_admin
from database import salary_collection, users_collection, attendance_collection, targets_collection

router = APIRouter(prefix="/api/salary", tags=["salary"])


# ── Admin: salary config ─────────────────────────────────────────

@router.post("/config/{employee_id}")
async def set_salary_config(employee_id: str, data: SalaryConfigIn, _admin: dict = Depends(require_admin)):
    emp = await users_collection.find_one({"id": employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    config = {**data.model_dump(), "employee_id": employee_id}
    await salary_collection.update_one(
        {"_type": "config", "employee_id": employee_id},
        {"$set": {**config, "_type": "config"}},
        upsert=True,
    )
    return {"status": "saved"}


@router.get("/config/{employee_id}")
async def get_salary_config(employee_id: str, _admin: dict = Depends(require_admin)):
    doc = await salary_collection.find_one({"_type": "config", "employee_id": employee_id})
    if not doc:
        return SalaryConfigIn().model_dump()
    return {k: doc.get(k, 0) for k in SalaryConfigIn.model_fields}


# ── Admin: generate slips ────────────────────────────────────────

@router.post("/generate")
async def generate_slips(data: GenerateSlipIn, _admin: dict = Depends(require_admin)):
    if data.employee_ids:
        employees = []
        for eid in data.employee_ids:
            emp = await users_collection.find_one({"id": eid})
            if emp:
                employees.append(emp)
    else:
        employees = [doc async for doc in users_collection.find({"role": "employee", "is_active": {"$ne": False}})]

    generated = 0
    for emp in employees:
        eid = emp["id"]

        # check if slip already exists
        existing = await salary_collection.find_one({
            "_type": "slip", "employee_id": eid, "month": data.month, "year": data.year
        })
        if existing:
            continue

        # get config
        config_doc = await salary_collection.find_one({"_type": "config", "employee_id": eid})
        cfg = config_doc or {}

        base = cfg.get("base_salary", 0)
        hra = cfg.get("hra", 0)
        da = cfg.get("da", 0)
        other_allow = cfg.get("other_allowances", 0)
        pf = cfg.get("pf_deduction", 0)
        tax = cfg.get("tax_deduction", 0)
        other_ded = cfg.get("other_deductions", 0)
        incentive_rate = cfg.get("incentive_per_target_pct", 0)

        # attendance for the month
        month_str = f"{data.year}-{data.month:02d}"
        att_cursor = attendance_collection.find({
            "employee_id": eid,
            "date": {"$regex": f"^{month_str}"},
        })
        present = 0
        half = 0
        total_hours = 0
        async for att in att_cursor:
            h = att.get("total_hours", 0) or 0
            if h >= 6:
                present += 1
            elif h > 0:
                half += 1
            total_hours += h

        # determine working days (rough: 26)
        working_days = 26
        absent = max(0, working_days - present - half)

        # attendance-based salary proration
        effective_days = present + (half * 0.5)
        proration = min(1.0, effective_days / working_days) if working_days > 0 else 1.0

        prorated_base = round(base * proration, 2)
        prorated_hra = round(hra * proration, 2)
        prorated_da = round(da * proration, 2)
        prorated_other = round(other_allow * proration, 2)

        # target for the month
        target_doc = await targets_collection.find_one({
            "employee_id": eid, "month": data.month, "year": data.year
        })
        target_amount = target_doc.get("target_amount", 0) if target_doc else 0
        achieved = target_doc.get("achieved_amount", 0) if target_doc else 0
        target_pct = round((achieved / target_amount * 100) if target_amount > 0 else 0, 1)

        # incentive
        incentive = 0
        if incentive_rate > 0 and target_pct > 0:
            incentive = round(incentive_rate * target_pct, 2)

        gross = prorated_base + prorated_hra + prorated_da + prorated_other + incentive
        total_ded = pf + tax + other_ded
        net = round(gross - total_ded, 2)

        slip = SalarySlip(
            employee_id=eid,
            employee_name=emp.get("name", ""),
            designation=emp.get("designation", ""),
            month=data.month,
            year=data.year,
            base_salary=prorated_base,
            hra=prorated_hra,
            da=prorated_da,
            other_allowances=prorated_other,
            incentive=incentive,
            gross_salary=round(gross, 2),
            pf_deduction=pf,
            tax_deduction=tax,
            other_deductions=other_ded,
            total_deductions=total_ded,
            net_salary=net,
            working_days=working_days,
            present_days=present,
            half_days=half,
            absent_days=absent,
            target_amount=target_amount,
            achieved_amount=achieved,
            target_pct=target_pct,
        )
        await salary_collection.insert_one({**slip.model_dump(), "_type": "slip"})
        generated += 1

    return {"status": "generated", "count": generated, "month": data.month, "year": data.year}


@router.get("/slips")
async def list_slips(
    month: int = Query(default=None),
    year: int = Query(default=None),
    admin: dict = Depends(require_admin),
):
    query = {"_type": "slip"}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    cursor = salary_collection.find(query).sort([("year", -1), ("month", -1)])
    slips = []
    async for doc in cursor:
        slips.append({k: doc.get(k) for k in SalarySlip.model_fields})
    return slips


@router.post("/slips/{slip_id}/finalize")
async def finalize_slip(slip_id: str, _admin: dict = Depends(require_admin)):
    result = await salary_collection.update_one(
        {"_type": "slip", "id": slip_id},
        {"$set": {"status": "finalized"}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Slip not found")
    return {"status": "finalized"}


# ── Employee: my slips ────────────────────────────────────────────

@router.get("/my-slips")
async def my_slips(payload: dict = Depends(get_current_user_payload)):
    cursor = salary_collection.find({
        "_type": "slip", "employee_id": payload["sub"]
    }).sort([("year", -1), ("month", -1)])
    slips = []
    async for doc in cursor:
        slips.append({k: doc.get(k) for k in SalarySlip.model_fields})
    return slips


@router.get("/slips/{slip_id}")
async def get_slip(slip_id: str, payload: dict = Depends(get_current_user_payload)):
    doc = await salary_collection.find_one({"_type": "slip", "id": slip_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Slip not found")
    if payload["role"] != "admin" and doc.get("employee_id") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Not your slip")
    return {k: doc.get(k) for k in SalarySlip.model_fields}
