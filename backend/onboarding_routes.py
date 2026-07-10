"""Employee onboarding, profile, file uploads, ID card, agreement PDF, and
admin website content management routes."""

import uuid
import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse

from auth_utils import get_current_user_payload, require_admin
from database import db, users_collection
from storage_r2 import r2_enabled, upload_bytes, presigned_url

router = APIRouter(prefix="/api", tags=["onboarding"])

profiles_collection = db["employee_profiles"]
website_content_collection = db["website_content"]
call_logs_collection = db["call_logs"]

UPLOAD_FIELDS = {"photo", "aadhar_front", "aadhar_back", "resume", "signature"}


# ── File Upload — Cloudflare R2 (bucket is private; served via presigned
# URLs, see storage_r2.py). Falls back to base64-in-Mongo only if R2 isn't
# configured, so local dev without R2 credentials still works. ────────────

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    field: str = Form(...),
    payload: dict = Depends(get_current_user_payload),
):
    if field not in UPLOAD_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid field: {field}")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    content_type = file.content_type or "application/octet-stream"
    file_doc = {
        "id": str(uuid.uuid4()),
        "user_id": payload["sub"],
        "field": field,
        "filename": file.filename,
        "content_type": content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    if r2_enabled():
        r2_key = f"employee-uploads/{payload['sub']}/{field}"
        upload_bytes(r2_key, data, content_type)
        file_doc["r2_key"] = r2_key
    else:
        b64 = base64.b64encode(data).decode()
        file_doc["data"] = f"data:{content_type};base64,{b64}"

    await db.uploads.update_one(
        {"user_id": payload["sub"], "field": field},
        {"$set": file_doc},
        upsert=True,
    )
    return {"id": file_doc["id"], "field": field}


def _upload_doc_to_out(doc: dict) -> dict:
    url = presigned_url(doc["r2_key"]) if doc.get("r2_key") else doc.get("data")
    return {"data": url, "filename": doc.get("filename"), "content_type": doc.get("content_type")}


@router.get("/uploads/{user_id}")
async def get_uploads(user_id: str, payload: dict = Depends(get_current_user_payload)):
    if payload["role"] != "admin" and payload["sub"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    cursor = db.uploads.find({"user_id": user_id})
    result = {}
    async for doc in cursor:
        result[doc["field"]] = _upload_doc_to_out(doc)
    return result


# ── Employee Profile (onboarding data) ────────────────────────────────────

PROFILE_FIELDS = [
    "full_name", "dob", "gender", "marital_status", "contact_no", "email",
    "address", "father_name", "mother_name", "aadhar_number", "pan_number",
    "bank_name", "bank_account_number", "bank_ifsc", "bank_branch",
    "emergency_contact_name", "emergency_contact_number",
]


@router.put("/profile")
async def update_profile(
    request: Request,
    payload: dict = Depends(get_current_user_payload),
):
    data = await request.json()
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")
    user_id = payload["sub"]
    safe = {k: v for k, v in data.items() if k in PROFILE_FIELDS and v is not None}
    safe["user_id"] = user_id
    safe["updated_at"] = datetime.now(timezone.utc).isoformat()
    safe["profile_completed"] = True

    await profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": safe, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    user_updates = {"profile_completed": True}
    if "full_name" in safe:
        user_updates["profile_name"] = safe["full_name"]
    await users_collection.update_one({"id": user_id}, {"$set": user_updates})
    return {"status": "saved"}


@router.get("/profile/{user_id}")
async def get_profile(user_id: str, payload: dict = Depends(get_current_user_payload)):
    if payload["role"] != "admin" and payload["sub"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    doc = await profiles_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not doc:
        return {}
    return doc


@router.get("/profile-status")
async def profile_status(payload: dict = Depends(get_current_user_payload)):
    doc = await profiles_collection.find_one({"user_id": payload["sub"]})
    user = await users_collection.find_one({"id": payload["sub"]})
    return {
        "profile_completed": bool(doc and doc.get("profile_completed")),
        "training_days": user.get("training_days", 0) if user else 0,
        "training_salary": user.get("training_salary", False) if user else False,
        "training_start_date": user.get("training_start_date") if user else None,
        "join_date": user.get("join_date") if user else None,
    }


# ── Admin: update employee creation with training + salary ────────────────

@router.patch("/employees/{employee_id}/training")
async def set_training(employee_id: str, request: Request, _admin: dict = Depends(require_admin)):
    data = await request.json()
    if not data:
        raise HTTPException(status_code=400, detail="No data")
    updates = {}
    if "training_days" in data:
        updates["training_days"] = int(data["training_days"])
    if "training_salary" in data:
        updates["training_salary"] = bool(data["training_salary"])
    if "training_start_date" in data:
        updates["training_start_date"] = data["training_start_date"]
    if "join_date" in data:
        updates["join_date"] = data["join_date"]
    if "base_salary" in data:
        updates["base_salary"] = float(data["base_salary"])
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields")
    await users_collection.update_one({"id": employee_id}, {"$set": updates})
    return {"status": "updated"}


@router.get("/employees/{employee_id}/full")
async def get_employee_full(employee_id: str, _admin: dict = Depends(require_admin)):
    user = await users_collection.find_one({"id": employee_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    profile = await profiles_collection.find_one({"user_id": employee_id}, {"_id": 0})
    uploads = {}
    async for doc in db.uploads.find({"user_id": employee_id}):
        uploads[doc["field"]] = _upload_doc_to_out(doc)
    return {"user": user, "profile": profile or {}, "uploads": uploads}


# ── Call Logs (Lead call tracking) ────────────────────────────────────────

@router.post("/leads/{lead_id}/call-log")
async def add_call_log(lead_id: str, request: Request, payload: dict = Depends(get_current_user_payload)):
    data = await request.json()
    if not data:
        raise HTTPException(status_code=400, detail="No data")
    log_entry = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "user_id": payload["sub"],
        "call_status": data.get("call_status", "unknown"),
        "interested": data.get("interested"),
        "discussed": data.get("discussed", ""),
        "follow_up_date": data.get("follow_up_date"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_collection.insert_one(log_entry)
    return log_entry


@router.get("/leads/{lead_id}/call-logs")
async def get_call_logs(lead_id: str, payload: dict = Depends(get_current_user_payload)):
    cursor = call_logs_collection.find({"lead_id": lead_id}).sort("created_at", -1)
    return [
        {k: doc.get(k) for k in ["id", "lead_id", "user_id", "call_status", "interested", "discussed", "follow_up_date", "created_at"]}
        async for doc in cursor
    ]


# ── Website Content Management ────────────────────────────────────────────

@router.get("/website-content")
async def get_website_content():
    doc = await website_content_collection.find_one({"_id": "active"})
    if not doc:
        return {"top_banner": None, "popup": None}
    return {
        "top_banner": doc.get("top_banner"),
        "popup": doc.get("popup"),
    }


@router.put("/website-content")
async def update_website_content(request: Request, _admin: dict = Depends(require_admin)):
    data = await request.json()
    if not data:
        raise HTTPException(status_code=400, detail="No data")
    allowed = {}
    if "top_banner" in data:
        allowed["top_banner"] = data["top_banner"]
    if "popup" in data:
        allowed["popup"] = data["popup"]
    allowed["updated_at"] = datetime.now(timezone.utc).isoformat()
    await website_content_collection.update_one(
        {"_id": "active"},
        {"$set": allowed},
        upsert=True,
    )
    return {"status": "updated"}


# ── Lead Pipeline Config ──────────────────────────────────────────────────

@router.get("/lead-pipeline")
async def get_pipeline(_admin: dict = Depends(require_admin)):
    doc = await db.config.find_one({"_id": "lead_pipeline"})
    if not doc:
        return {"statuses": ["new", "contacted", "follow_up", "interested", "converted", "lost"]}
    return {"statuses": doc.get("statuses", [])}


@router.put("/lead-pipeline")
async def update_pipeline(request: Request, _admin: dict = Depends(require_admin)):
    data = await request.json()
    if not data or "statuses" not in data:
        raise HTTPException(status_code=400, detail="Provide statuses list")
    await db.config.update_one(
        {"_id": "lead_pipeline"},
        {"$set": {"statuses": data["statuses"]}},
        upsert=True,
    )
    return {"status": "updated"}
