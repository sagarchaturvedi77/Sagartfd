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
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request

from lead_models import LeadCreate, LeadUpdate, LeadStatusUpdate, LeadInDB, LeadOut
from auth_utils import get_current_user_payload, require_admin
from database import leads_collection, users_collection, db
from notification_service import create_notification

router = APIRouter(prefix="/api/leads", tags=["leads"])

web_leads_collection = db["web_leads"]

VALID_STATUSES = {"new", "contacted", "follow_up", "interested", "converted", "lost"}


def to_lead_out(doc: dict) -> LeadOut:
    return LeadOut(**{k: doc.get(k) for k in LeadOut.model_fields})


# ── Admin: CRUD ──────────────────────────────────────────────────

@router.post("/", response_model=LeadOut)
async def create_lead(data: LeadCreate, admin: dict = Depends(require_admin)):
    lead = LeadInDB(**data.model_dump())
    if data.assigned_to:
        emp = await users_collection.find_one({"id": data.assigned_to})
        if emp:
            lead.assigned_to_name = emp.get("name")
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
    cursor = leads_collection.find({"assigned_to": payload["sub"]}).sort("updated_at", -1)
    return [to_lead_out(doc) async for doc in cursor]


@router.get("/", response_model=list[LeadOut])
async def list_leads(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=200, le=500),
    admin: dict = Depends(require_admin),
):
    query = {}
    if status and status in VALID_STATUSES:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = leads_collection.find(query).sort("updated_at", -1).limit(limit)
    return [to_lead_out(doc) async for doc in cursor]


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

    result = await leads_collection.find_one_and_update(
        {"id": lead_id},
        {"$set": {
            "assigned_to": assigned_to,
            "assigned_to_name": emp.get("name"),
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
    wb.close()
    return {"status": "imported", "count": imported}


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
    for eid in employee_ids:
        emp = await users_collection.find_one({"id": eid})
        if emp:
            emp_names[eid] = emp.get("name", "")
    assignments = []
    for i, lid in enumerate(lead_ids):
        eid = employee_ids[i % len(employee_ids)]
        await leads_collection.update_one(
            {"id": lid},
            {"$set": {"assigned_to": eid, "assigned_to_name": emp_names.get(eid, ""), "updated_at": datetime.now(timezone.utc).isoformat()}},
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

@router.get("/website")
async def get_website_leads(admin: dict = Depends(require_admin)):
    cursor = web_leads_collection.find().sort("created_at", -1)
    leads = []
    async for doc in cursor:
        doc.pop("_id", None)
        leads.append(doc)
    return leads


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
