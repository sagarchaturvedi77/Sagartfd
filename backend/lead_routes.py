"""Lead Management CRM routes.

Admin:
  POST   /api/leads/          — create a lead
  GET    /api/leads/          — list all leads (filter by status, assigned_to)
  GET    /api/leads/{id}      — single lead detail
  PUT    /api/leads/{id}      — update lead fields
  DELETE /api/leads/{id}      — delete a lead
  POST   /api/leads/{id}/assign  — assign lead to an employee
  GET    /api/leads/stats     — lead pipeline stats

Employee:
  GET    /api/leads/my        — leads assigned to current employee
  POST   /api/leads/{id}/status — update lead status + follow-up note
"""

import io
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from pydantic import BaseModel, Field

from lead_models import LeadCreate, LeadUpdate, LeadStatusUpdate, LeadInDB, LeadOut, CallOutcomeIn, TransferIn
from auth_utils import get_current_user_payload, require_admin
from database import leads_collection, users_collection, db, reminders_collection, pipelines_collection
from notification_service import create_notification

router = APIRouter(prefix="/api/leads", tags=["leads"])

web_leads_collection = db["web_leads"]
career_leads_collection = db["career_leads"]

VALID_STATUSES = {"new", "contacted", "follow_up", "interested", "converted", "lost"}


def to_lead_out(doc: dict) -> LeadOut:
    return LeadOut(**{k: doc.get(k) for k in LeadOut.model_fields})


async def find_pipeline_for_employee(employee_id: str) -> Optional[str]:
    """Returns the id of the (first) active pipeline assigned to this
    employee, or None if they have no pipeline. Used to auto-attach a
    pipeline to a lead the moment it's assigned to someone."""
    if not employee_id:
        return None
    pipeline = await pipelines_collection.find_one(
        {"assigned_to": employee_id, "is_active": {"$ne": False}}
    )
    return pipeline["id"] if pipeline else None


# ── Admin: CRUD ──────────────────────────────────────────────────

@router.post("/", response_model=LeadOut)
async def create_lead(data: LeadCreate, admin: dict = Depends(require_admin)):
    lead = LeadInDB(**data.model_dump())
    if data.assigned_to:
        emp = await users_collection.find_one({"id": data.assigned_to})
        if emp:
            lead.assigned_to_name = emp.get("name")
            if not lead.pipeline_id:
                lead.pipeline_id = await find_pipeline_for_employee(data.assigned_to)
            await create_notification(
                user_id=data.assigned_to,
                title="New Lead Assigned",
                body=f"{lead.name} ({lead.phone}) — {lead.service_interest or 'General'}",
                n_type="lead",
                link="/portal/employee/leads",
            )
    await leads_collection.insert_one(lead.model_dump())
    return to_lead_out(lead.model_dump())


@router.get("/stats")
async def lead_stats(admin: dict = Depends(require_admin)):
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_counts = {}
    async for doc in leads_collection.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]

    total = sum(status_counts.values())

    source_pipeline = [
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    source_counts = []
    async for doc in leads_collection.aggregate(source_pipeline):
        source_counts.append({"source": doc["_id"] or "unknown", "count": doc["count"]})

    return {
        "total": total,
        "by_status": status_counts,
        "by_source": source_counts,
    }


@router.get("/my", response_model=list[LeadOut])
async def my_leads(payload: dict = Depends(get_current_user_payload)):
    """Leads assigned to the current employee. Leads that have already been
    called at least once (call_touched) always show. Brand-new, never-called
    leads are capped to 10 at a time — the 11th only appears once one of the
    current 10 has been called, so no one can see the whole pile up front."""
    touched_cursor = leads_collection.find(
        {"assigned_to": payload["sub"], "call_touched": True}
    ).sort("updated_at", -1)
    touched = [doc async for doc in touched_cursor]

    fresh_cursor = leads_collection.find(
        {"assigned_to": payload["sub"], "call_touched": {"$ne": True}}
    ).sort("created_at", 1).limit(10)
    fresh = [doc async for doc in fresh_cursor]

    return [to_lead_out(doc) for doc in touched + fresh]


@router.get("/", response_model=list[LeadOut])
async def list_leads(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    pipeline_id: Optional[str] = None,
    limit: int = Query(default=200, le=500),
    admin: dict = Depends(require_admin),
):
    query = {}
    if status and status in VALID_STATUSES:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    if pipeline_id:
        query["pipeline_id"] = pipeline_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = leads_collection.find(query).sort("updated_at", -1).limit(limit)
    return [to_lead_out(doc) async for doc in cursor]


@router.get("/website")
async def get_website_leads(admin: dict = Depends(require_admin)):
    cursor = web_leads_collection.find().sort("created_at", -1)
    leads = []
    async for doc in cursor:
        doc.pop("_id", None)
        leads.append(doc)
    return leads


@router.get("/career")
async def get_career_leads(admin: dict = Depends(require_admin)):
    cursor = career_leads_collection.find().sort("created_at", -1)
    leads = []
    async for doc in cursor:
        doc.pop("_id", None)
        leads.append(doc)
    return leads


@router.get("/search")
async def search_all_leads(phone: str = Query(..., min_length=3), payload: dict = Depends(get_current_user_payload)):
    """Global search by (partial) phone number — any employee can check if a
    number is already a client before calling, so no one duplicates outreach."""
    cursor = leads_collection.find({"phone": {"$regex": phone, "$options": "i"}}).limit(20)
    results = [to_lead_out(doc) async for doc in cursor]
    return results


# NOTE: This catch-all MUST stay below /stats, /my, /website, /career —
# FastAPI matches routes in registration order, and "/{lead_id}" would
# otherwise swallow those literal paths (e.g. GET /website would be
# treated as GET /{lead_id} with lead_id="website").
@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: str, payload: dict = Depends(get_current_user_payload)):
    doc = await leads_collection.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    return to_lead_out(doc)


@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: str, data: LeadUpdate, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    if "assigned_to" in updates:
        emp = await users_collection.find_one({"id": updates["assigned_to"]})
        updates["assigned_to_name"] = emp.get("name") if emp else None
        if "pipeline_id" not in updates:
            updates["pipeline_id"] = await find_pipeline_for_employee(updates["assigned_to"])
        if emp:
            lead_doc = await leads_collection.find_one({"id": lead_id})
            lead_name = lead_doc.get("name", "Unknown") if lead_doc else "Unknown"
            await create_notification(
                user_id=updates["assigned_to"],
                title="Lead Assigned to You",
                body=f"{lead_name} — check your leads dashboard",
                n_type="lead",
                link="/portal/employee/leads",
            )

    result = await leads_collection.find_one_and_update(
        {"id": lead_id},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lead not found")
    return to_lead_out(result)


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, admin: dict = Depends(require_admin)):
    result = await leads_collection.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "deleted"}


@router.post("/{lead_id}/assign")
async def assign_lead(lead_id: str, assigned_to: str = Query(...), admin: dict = Depends(require_admin)):
    emp = await users_collection.find_one({"id": assigned_to})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    pipeline_id = await find_pipeline_for_employee(assigned_to)
    result = await leads_collection.find_one_and_update(
        {"id": lead_id},
        {"$set": {
            "assigned_to": assigned_to,
            "assigned_to_name": emp.get("name"),
            "pipeline_id": pipeline_id,
            "pipeline_stage_id": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Lead not found")

    await create_notification(
        user_id=assigned_to,
        title="New Lead Assigned",
        body=f"{result['name']} ({result['phone']}) — {result.get('service_interest') or 'General'}",
        n_type="lead",
        link="/portal/employee/leads",
    )
    return {"status": "assigned", "assigned_to_name": emp.get("name")}


# ── Employee: status update ──────────────────────────────────────

@router.post("/{lead_id}/status")
async def update_lead_status(
    lead_id: str, data: LeadStatusUpdate, payload: dict = Depends(get_current_user_payload)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {', '.join(VALID_STATUSES)}")

    doc = await leads_collection.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")

    if payload["role"] != "admin" and doc.get("assigned_to") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Lead not assigned to you")

    now = datetime.now(timezone.utc).isoformat()
    history_entry = {
        "status": data.status,
        "note": data.follow_up_note,
        "date": now,
        "by": payload["sub"],
    }

    updates = {
        "status": data.status,
        "updated_at": now,
    }
    if data.follow_up_note is not None:
        updates["follow_up_note"] = data.follow_up_note
    if data.follow_up_date is not None:
        updates["follow_up_date"] = data.follow_up_date

    await leads_collection.update_one(
        {"id": lead_id},
        {"$set": updates, "$push": {"status_history": history_entry}},
    )

    # Notify admin when employee updates lead status
    if payload["role"] != "admin":
        user = await users_collection.find_one({"id": payload["sub"]})
        emp_name = user.get("name", "Employee") if user else "Employee"
        admins = users_collection.find({"role": "admin"})
        async for adm in admins:
            await create_notification(
                user_id=adm["id"],
                title=f"Lead Updated: {doc['name']}",
                body=f"{emp_name} changed status to '{data.status}'",
                n_type="lead",
                link="/portal/admin/leads",
            )

    return {"status": "updated", "new_status": data.status}


class QuickNoteIn(BaseModel):
    note: str


@router.post("/{lead_id}/note")
async def add_quick_note(
    lead_id: str, data: QuickNoteIn, payload: dict = Depends(get_current_user_payload)
):
    """Add a manual update/note to a lead any time — not tied to a call.
    Used by the 'Add Update' button on both the employee and admin lead views."""
    doc = await leads_collection.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    if payload["role"] != "admin" and doc.get("assigned_to") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Lead not assigned to you")

    now = datetime.now(timezone.utc).isoformat()
    who = await users_collection.find_one({"id": payload["sub"]})
    history_entry = {
        "note": data.note,
        "date": now,
        "by": payload["sub"],
        "by_name": who.get("name") if who else "Unknown",
    }
    await leads_collection.update_one(
        {"id": lead_id},
        {"$set": {"notes": data.note, "updated_at": now}, "$push": {"status_history": history_entry}},
    )
    return {"status": "noted"}


# ── Employee: full call-flow outcome (the popup after every call) ──

CONNECTED_TERMINAL = {"converted", "lost"}
NOT_CONNECTED_DIRECT_LOST = {"invalid"}  # invalid number -> lost immediately, no retries
MAX_ATTEMPTS = 3


@router.post("/{lead_id}/call-outcome")
async def submit_call_outcome(
    lead_id: str, data: CallOutcomeIn, payload: dict = Depends(get_current_user_payload)
):
    """Saves the result of the Connected/Not-Connected decision tree shown
    right after an employee finishes a call, and drives what happens next:
    reminders, 3-attempt auto-lost, and service-expiry reminders."""
    doc = await leads_collection.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    if payload["role"] != "admin" and doc.get("assigned_to") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Lead not assigned to you")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    updates = {
        "connection_status": data.connection_status,
        "last_call_at": now_iso,
        "updated_at": now_iso,
        "call_touched": True,
    }
    if data.pipeline_stage_id:
        updates["pipeline_stage_id"] = data.pipeline_stage_id
    history_entry = {"connection_status": data.connection_status, "sub_stage": data.sub_stage, "date": now_iso, "by": payload["sub"]}
    if data.notes:
        history_entry["note"] = data.notes

    reminder_to_create = None  # (type, due_at, title, body)

    if data.connection_status == "connected":
        if data.sub_stage == "interested":
            updates["status"] = "interested"
            updates["call_attempts"] = 0
            if data.service_interest:
                updates["service_interest"] = data.service_interest
            if data.notes:
                updates["notes"] = data.notes
            if data.follow_up_date:
                updates["follow_up_date"] = data.follow_up_date
                due_dt = _combine_date_time(data.follow_up_date, data.follow_up_time)
                reminder_to_create = ("lead_follow_up", due_dt, "Follow-up Due", f"Time to follow up with {doc['name']} ({doc['phone']})")

        elif data.sub_stage == "not_interested":
            new_attempts = int(doc.get("call_attempts", 0)) + 1
            updates["call_attempts"] = new_attempts
            if new_attempts >= MAX_ATTEMPTS:
                updates["status"] = "lost"
            else:
                updates["status"] = "follow_up"
                due_dt = now + timedelta(days=1)
                reminder_to_create = ("lead_retry", due_dt, "Retry Call", f"{doc['name']} wasn't interested last time — try again today")

        elif data.sub_stage == "converted":
            updates["status"] = "converted"
            updates["call_attempts"] = 0
            if data.service_interest:
                updates["service_interest"] = data.service_interest
            if data.code_name:
                updates["code_name"] = data.code_name
            if data.service_duration_months:
                updates["service_duration_months"] = data.service_duration_months
                expiry = now + timedelta(days=30 * data.service_duration_months)
                updates["service_expires_at"] = expiry.date().isoformat()
                reminder_due = expiry - timedelta(days=3)
                reminder_to_create = ("service_expiry", reminder_due, "Service Expiring Soon", f"{doc['name']}'s service ends in 3 days — reach out to renew")

        elif data.sub_stage == "lost":
            updates["status"] = "lost"

    else:  # not_connected
        new_attempts = int(doc.get("call_attempts", 0)) + 1
        updates["call_attempts"] = new_attempts
        if data.sub_stage in NOT_CONNECTED_DIRECT_LOST:
            updates["status"] = "lost"
        elif new_attempts >= MAX_ATTEMPTS:
            updates["status"] = "lost"
        else:
            updates["status"] = "follow_up"
            due_dt = now + timedelta(days=1)
            reminder_to_create = ("lead_retry", due_dt, "Retry Call", f"Couldn't reach {doc['name']} — try again today")

    await leads_collection.update_one(
        {"id": lead_id},
        {"$set": updates, "$push": {"status_history": history_entry}},
    )

    if reminder_to_create:
        rtype, due_dt, title, body = reminder_to_create
        await reminders_collection.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": doc.get("assigned_to") or payload["sub"],
            "lead_id": lead_id,
            "type": rtype,
            "title": title,
            "body": body,
            "next_send_at": due_dt if isinstance(due_dt, datetime) else due_dt,
            "active": True,
            "created_at": now_iso,
        })

    # If the lead just hit auto-lost after 3 attempts, flag admin so they can reassign
    if updates.get("status") == "lost" and int(doc.get("call_attempts", 0)) + 1 >= MAX_ATTEMPTS:
        admins = users_collection.find({"role": "admin"})
        async for adm in admins:
            await create_notification(
                user_id=adm["id"],
                title=f"Lead needs attention: {doc['name']}",
                body="3 attempts with no result — consider reassigning this lead.",
                n_type="lead",
                link="/portal/admin/leads",
            )

    return {"status": "saved", "new_status": updates.get("status"), "call_attempts": updates.get("call_attempts", doc.get("call_attempts", 0))}


def _combine_date_time(date_str: str, time_str: Optional[str]) -> datetime:
    t = time_str or "09:00"
    try:
        return datetime.fromisoformat(f"{date_str}T{t}:00")
    except Exception:
        return datetime.now(timezone.utc) + timedelta(days=1)


# ── Transfer a lead to another employee ─────────────────────────

@router.post("/{lead_id}/transfer")
async def transfer_lead(
    lead_id: str, data: TransferIn, payload: dict = Depends(get_current_user_payload)
):
    doc = await leads_collection.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    if payload["role"] != "admin" and doc.get("assigned_to") != payload["sub"]:
        raise HTTPException(status_code=403, detail="Lead not assigned to you")

    new_emp = await users_collection.find_one({"id": data.to_employee_id})
    if not new_emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    transfer_entry = {
        "from": doc.get("assigned_to"),
        "from_name": doc.get("assigned_to_name"),
        "to": data.to_employee_id,
        "to_name": new_emp.get("name"),
        "note": data.reference_note,
        "at": now_iso,
    }

    await leads_collection.update_one(
        {"id": lead_id},
        {
            "$set": {
                "assigned_to": data.to_employee_id,
                "assigned_to_name": new_emp.get("name"),
                "call_attempts": 0,
                "updated_at": now_iso,
            },
            "$push": {"transfer_history": transfer_entry},
        },
    )

    await create_notification(
        user_id=data.to_employee_id,
        title="Lead Transferred to You",
        body=f"{doc['name']} ({doc['phone']}) — {data.reference_note or 'no note'}",
        n_type="lead",
        link="/portal/employee/leads",
    )
    return {"status": "transferred", "to_name": new_emp.get("name")}


# ── Employee: add a lead themselves ─────────────────────────────

@router.post("/my", response_model=LeadOut)
async def create_my_lead(data: LeadCreate, payload: dict = Depends(get_current_user_payload)):
    """Any employee can add a lead directly (referrals, walk-ins, etc.) — it's
    auto-assigned to them."""
    user = await users_collection.find_one({"id": payload["sub"]})
    lead = LeadInDB(**data.model_dump())
    lead.assigned_to = payload["sub"]
    lead.assigned_to_name = user.get("name") if user else None
    lead.source = data.source or "employee_added"
    lead.pipeline_id = await find_pipeline_for_employee(payload["sub"])
    await leads_collection.insert_one(lead.model_dump())
    return to_lead_out(lead.model_dump())


# ── Excel Import ─────────────────────────────────────────────────

@router.post("/import-excel")
async def import_leads_excel(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    import openpyxl
    data = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    headers_row = list(ws.iter_rows(min_row=1, max_row=1, values_only=True))[0]
    headers_lower = [str(h).strip().lower() if h else "" for h in headers_row]
    col_map = {}
    for i, h in enumerate(headers_lower):
        if "name" in h and "name" not in col_map:
            col_map["name"] = i
        elif "phone" in h or "contact" in h or "mobile" in h:
            col_map["phone"] = i
        elif "mail" in h or "email" in h:
            col_map["email"] = i
        elif "from" in h or "source" in h:
            col_map["source"] = i
        elif "for" in h or "service" in h or "interest" in h:
            col_map["service_interest"] = i
        elif "city" in h:
            col_map["city"] = i
    if "name" not in col_map or "phone" not in col_map:
        raise HTTPException(status_code=400, detail="Excel must have Name and Phone/Contact columns")
    imported = 0
    imported_ids = []
    for row in rows:
        name = str(row[col_map["name"]]).strip() if row[col_map["name"]] else ""
        phone = str(row[col_map["phone"]]).strip() if row[col_map["phone"]] else ""
        if not name or not phone:
            continue
        lead = LeadInDB(
            name=name,
            phone=phone,
            email=str(row[col_map["email"]]).strip() if "email" in col_map and row[col_map["email"]] else None,
            source=str(row[col_map["source"]]).strip() if "source" in col_map and row[col_map["source"]] else "excel",
            service_interest=str(row[col_map["service_interest"]]).strip() if "service_interest" in col_map and row[col_map["service_interest"]] else None,
            city=str(row[col_map["city"]]).strip() if "city" in col_map and row[col_map["city"]] else None,
        )
        await leads_collection.insert_one(lead.model_dump())
        imported += 1
        imported_ids.append(lead.id)
    wb.close()
    return {"status": "imported", "count": imported, "lead_ids": imported_ids}


# ── Shuffle & Assign leads to employees ──────────────────────────

@router.post("/shuffle-assign")
async def shuffle_assign_leads(request: Request, admin: dict = Depends(require_admin)):
    body = await request.json()
    lead_ids = body.get("lead_ids", [])
    employee_ids = body.get("employee_ids", [])
    if not lead_ids or not employee_ids:
        raise HTTPException(status_code=400, detail="Provide lead_ids and employee_ids")
    random.shuffle(lead_ids)
    emp_names = {}
    emp_pipelines = {}
    for eid in employee_ids:
        emp = await users_collection.find_one({"id": eid})
        if emp:
            emp_names[eid] = emp.get("name", "")
        emp_pipelines[eid] = await find_pipeline_for_employee(eid)
    assignments = []
    for i, lid in enumerate(lead_ids):
        eid = employee_ids[i % len(employee_ids)]
        await leads_collection.update_one(
            {"id": lid},
            {"$set": {
                "assigned_to": eid,
                "assigned_to_name": emp_names.get(eid, ""),
                "pipeline_id": emp_pipelines.get(eid),
                "pipeline_stage_id": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        assignments.append({"lead_id": lid, "employee_id": eid, "employee_name": emp_names.get(eid, "")})
    for eid in employee_ids:
        count = sum(1 for a in assignments if a["employee_id"] == eid)
        if count > 0:
            await create_notification(
                user_id=eid,
                title=f"{count} Leads Assigned",
                body=f"{count} new leads have been assigned to you",
                n_type="lead",
                link="/portal/employee/leads",
            )
    return {"status": "assigned", "total": len(assignments), "assignments": assignments}


# ── Website Leads (from contact form/popup) ──────────────────────


@router.post("/website/{web_lead_id}/convert")
async def convert_web_lead(web_lead_id: str, admin: dict = Depends(require_admin)):
    wl = await web_leads_collection.find_one({"id": web_lead_id})
    if not wl:
        raise HTTPException(status_code=404, detail="Website lead not found")
    lead = LeadInDB(
        name=wl.get("full_name") or wl.get("name", "Unknown"),
        phone=wl.get("phone", ""),
        email=wl.get("email"),
        city=wl.get("city"),
        source="website",
        service_interest=wl.get("service"),
        notes=wl.get("message"),
    )
    await leads_collection.insert_one(lead.model_dump())
    await web_leads_collection.update_one({"id": web_lead_id}, {"$set": {"converted": True}})
    return {"status": "converted", "lead_id": lead.id}


@router.delete("/website/{web_lead_id}")
async def delete_web_lead(web_lead_id: str, admin: dict = Depends(require_admin)):
    result = await web_leads_collection.delete_one({"id": web_lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}


# ── Public capture endpoints (NO auth) — called directly from the public website ──
# Used by Contact form / popups (website leads) and the Career page (career leads).

class PublicWebsiteLeadCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=15)
    email: Optional[str] = None
    city: Optional[str] = None
    service: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "website"  # website, popup, calculator, whatsapp_popup, etc.


class PublicCareerLeadCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=15)
    email: Optional[str] = None
    position: Optional[str] = None
    experience: Optional[str] = None
    message: Optional[str] = None
    resume_url: Optional[str] = None


@router.post("/public/website")
async def capture_website_lead(data: PublicWebsiteLeadCreate):
    """Public, unauthenticated endpoint. Any website contact form / popup should
    POST here so the lead shows up under Admin Portal -> Leads -> Web Leads."""
    doc = {
        "id": str(uuid.uuid4()),
        "full_name": data.full_name,
        "phone": data.phone,
        "email": data.email,
        "city": data.city,
        "service": data.service,
        "message": data.message,
        "source": data.source or "website",
        "converted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await web_leads_collection.insert_one(doc)
    doc.pop("_id", None)

    admins = users_collection.find({"role": "admin"})
    async for adm in admins:
        await create_notification(
            user_id=adm["id"],
            title="New Website Lead",
            body=f"{data.full_name} ({data.phone}) — {data.service or 'General enquiry'}",
            n_type="lead",
            link="/portal/admin/leads",
        )
    return {"status": "received", "id": doc["id"]}


@router.post("/public/career")
async def capture_career_lead(data: PublicCareerLeadCreate):
    """Public, unauthenticated endpoint. The Career page should POST here
    (in addition to the resume upload) so applications show up under
    Admin Portal -> Leads -> Career Leads."""
    doc = {
        "id": str(uuid.uuid4()),
        "full_name": data.full_name,
        "phone": data.phone,
        "email": data.email,
        "position": data.position,
        "experience": data.experience,
        "message": data.message,
        "resume_url": data.resume_url,
        "status": "new",  # new, shortlisted, interview, hired, rejected
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await career_leads_collection.insert_one(doc)
    doc.pop("_id", None)

    admins = users_collection.find({"role": "admin"})
    async for adm in admins:
        await create_notification(
            user_id=adm["id"],
            title="New Career Application",
            body=f"{data.full_name} applied for {data.position or 'a role'}",
            n_type="lead",
            link="/portal/admin/leads",
        )
    return {"status": "received", "id": doc["id"]}


@router.put("/career/{career_lead_id}/status")
async def update_career_lead_status(career_lead_id: str, status: str = Query(...), admin: dict = Depends(require_admin)):
    valid = {"new", "shortlisted", "interview", "hired", "rejected"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {', '.join(valid)}")
    result = await career_leads_collection.find_one_and_update(
        {"id": career_lead_id}, {"$set": {"status": status}}, return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    result.pop("_id", None)
    return result


@router.delete("/career/{career_lead_id}")
async def delete_career_lead(career_lead_id: str, admin: dict = Depends(require_admin)):
    result = await career_leads_collection.delete_one({"id": career_lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}
