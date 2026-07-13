"""Employee onboarding, profile, file uploads, ID card, agreement PDF, and
admin website content management routes."""

import io
import uuid
import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from auth_utils import get_current_user_payload, require_admin
from database import db, users_collection
from storage_r2 import r2_enabled, upload_bytes, presigned_url
from activity_service import log_activity

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


@router.get("/uploads/{user_id}/{field}/raw")
async def get_upload_raw(user_id: str, field: str, payload: dict = Depends(get_current_user_payload)):
    """Same file as GET /uploads/{user_id}, but served as actual image bytes
    through our own domain instead of a presigned R2 URL. The R2 bucket has
    no CORS policy configured (and the backend's R2 credentials aren't
    permissioned to set one), so <img crossOrigin="anonymous"> against a
    presigned URL fails CORS entirely — which silently breaks html2canvas
    captures (ID card / visiting card PDF downloads) that need to read the
    image's pixel data, not just display it. Proxying through here uses the
    backend's own CORS policy instead, which the frontend origin already
    trusts for every other API call."""
    if payload["role"] != "admin" and payload["sub"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if field not in UPLOAD_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid field: {field}")
    doc = await db.uploads.find_one({"user_id": user_id, "field": field})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    data = _upload_bytes_sync(doc)
    if data is None:
        raise HTTPException(status_code=404, detail="File not available")
    return StreamingResponse(io.BytesIO(data), media_type=doc.get("content_type") or "application/octet-stream")


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


# ── Employment Agreement — server-generated PDF on the letterhead ─────────

def _upload_bytes_sync(doc: dict):
    """Raw bytes for a stored upload, whichever backend it lives in (R2 vs.
    the base64-in-Mongo fallback for local dev without R2 credentials) —
    _upload_doc_to_out returns a URL/data-URI for the browser, but PDF
    generation needs the actual bytes to embed."""
    if not doc:
        return None
    if doc.get("r2_key"):
        try:
            from storage_r2 import get_client, R2_BUCKET_NAME
            obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
            return obj["Body"].read()
        except Exception:
            return None
    if doc.get("data"):
        try:
            return base64.b64decode(doc["data"].split(",", 1)[1])
        except Exception:
            return None
    return None


class AgreementSignIn(BaseModel):
    lat: float
    lng: float


@router.get("/employees/{employee_id}/agreement/status")
async def employee_agreement_status(employee_id: str, payload: dict = Depends(get_current_user_payload)):
    if payload["role"] != "admin" and payload["sub"] != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await users_collection.find_one({"id": employee_id}, {"agreement_signed_at": 1, "agreement_signed_location": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "signed": bool(user.get("agreement_signed_at")),
        "signed_at": user.get("agreement_signed_at"),
        "location": user.get("agreement_signed_location"),
    }


@router.post("/employees/{employee_id}/agreement/sign")
async def sign_employee_agreement(employee_id: str, data: AgreementSignIn, payload: dict = Depends(get_current_user_payload)):
    """Only the employee themselves can sign their own agreement — this is a
    one-time, immutable act (a signature, not an editable field), so an
    already-signed record is returned as-is rather than overwritten, and an
    admin can never trigger this on someone else's behalf. Location is
    mandatory here (no "N/A" fallback like the old client-only page had) —
    a denied/failed geolocation request simply means signing didn't happen."""
    if payload["sub"] != employee_id:
        raise HTTPException(status_code=403, detail="You can only sign your own agreement")
    user = await users_collection.find_one({"id": employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if user.get("agreement_signed_at"):
        return {"status": "already_signed", "signed_at": user["agreement_signed_at"], "location": user.get("agreement_signed_location")}

    now = datetime.now(timezone.utc)
    location_str = f"{data.lat:.6f}, {data.lng:.6f}"
    await users_collection.update_one(
        {"id": employee_id},
        {"$set": {"agreement_signed_at": now.isoformat(), "agreement_signed_location": location_str}},
    )
    return {"status": "signed", "signed_at": now.isoformat(), "location": location_str}


@router.get("/employees/{employee_id}/agreement/download")
async def download_employee_agreement(employee_id: str, payload: dict = Depends(get_current_user_payload)):
    if payload["role"] != "admin" and payload["sub"] != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    user = await users_collection.find_one({"id": employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    profile = await profiles_collection.find_one({"user_id": employee_id}, {"_id": 0}) or {}

    uploads = {}
    async for doc in db.uploads.find({"user_id": employee_id}):
        uploads[doc["field"]] = doc
    photo_bytes = _upload_bytes_sync(uploads.get("photo"))
    signature_bytes = _upload_bytes_sync(uploads.get("signature"))
    aadhar_front_bytes = _upload_bytes_sync(uploads.get("aadhar_front"))
    aadhar_back_bytes = _upload_bytes_sync(uploads.get("aadhar_back"))

    aadhar_number = profile.get("aadhar_number")
    aadhar_masked = f"XXXX-XXXX-{aadhar_number[-4:]}" if aadhar_number else None

    signed_at_iso = user.get("agreement_signed_at")
    signed_date = signed_time = None
    if signed_at_iso:
        signed_dt = datetime.fromisoformat(signed_at_iso)
        signed_date = signed_dt.strftime("%d %B %Y")
        signed_time = signed_dt.strftime("%I:%M %p UTC")

    from certificate_pdf import generate_employee_agreement_pdf
    agreement_data = {
        "name": profile.get("full_name") or user.get("name"),
        "father_name": profile.get("father_name"),
        "designation": user.get("designation") or "Employee",
        "dob": profile.get("dob"),
        "contact_no": profile.get("contact_no") or user.get("phone"),
        "address": profile.get("address"),
        "aadhar_masked": aadhar_masked,
        "pan_number": profile.get("pan_number"),
        "employee_id": employee_id,
        "join_date": user.get("join_date"),
        "signed_at": user.get("agreement_signed_location"),
        "signed_date": signed_date,
        "signed_time": signed_time,
    }
    pdf_bytes = generate_employee_agreement_pdf(
        agreement_data, photo_bytes=photo_bytes, signature_bytes=signature_bytes,
        aadhar_front_bytes=aadhar_front_bytes, aadhar_back_bytes=aadhar_back_bytes,
    )

    safe_name = (agreement_data["name"] or employee_id).replace(" ", "_")
    filename = f"Employment_Agreement_{safe_name}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


# ── Admin: edit an employee's core + profile details ───────────────────────
# Name (users.name / profile.full_name) and the employee ID (users.id, the
# primary key every other collection references — leads, salary,
# attendance, targets, certificates, notifications) are deliberately never
# accepted here, so they can never be touched via this endpoint regardless
# of what a caller sends.

USER_EDITABLE_FIELDS = {
    "phone", "email", "designation", "join_date", "base_salary",
    "training_days", "training_salary", "training_start_date",
}
_USER_NUMERIC_FIELDS = {"base_salary": float, "training_days": int}
PROFILE_EDITABLE_FIELDS = [f for f in PROFILE_FIELDS if f != "full_name"]


@router.put("/employees/{employee_id}")
async def admin_update_employee(employee_id: str, request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    if not data:
        raise HTTPException(status_code=400, detail="No data provided")
    user = await users_collection.find_one({"id": employee_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_updates = {}
    for key in USER_EDITABLE_FIELDS:
        if key not in data:
            continue
        value = data[key]
        if key in _USER_NUMERIC_FIELDS:
            user_updates[key] = _USER_NUMERIC_FIELDS[key](value) if value not in (None, "") else None
        elif key == "training_salary":
            user_updates[key] = bool(value)
        else:
            user_updates[key] = value
    if user_updates:
        await users_collection.update_one({"id": employee_id}, {"$set": user_updates})

    profile_updates = {k: v for k, v in data.items() if k in PROFILE_EDITABLE_FIELDS}
    if profile_updates:
        profile_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        await profiles_collection.update_one(
            {"user_id": employee_id},
            {"$set": profile_updates, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )

    if user_updates or profile_updates:
        await log_activity(admin["sub"], "employee_updated", f"Updated employee details: {user['name']}", link="/portal/admin/employees")

    updated_user = await users_collection.find_one({"id": employee_id}, {"_id": 0, "password_hash": 0})
    updated_profile = await profiles_collection.find_one({"user_id": employee_id}, {"_id": 0})
    return {"user": updated_user, "profile": updated_profile or {}}


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
