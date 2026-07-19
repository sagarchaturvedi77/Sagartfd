"""TFD Internship — gamified 90-day program.

Deliberately separate from the existing interns_collection (KYC-application
-> offer-letter pipeline in certificate_routes.py). Only graduation (a later
phase) reaches into the existing certificate/QR-verification system;
nothing here touches interns_collection or certificates_collection.

Auth is ALSO fully separate from TFD Workspace (staff CRM) login: students
are not stored in users_collection and have no Role — this program is
headed for its own standalone app/APK, independent of the staff portal.
Only the admin-facing roster/payment endpoints below use the shared
require_admin staff-auth dependency, because admins manage this data from
inside the existing staff portal; the student-facing endpoints use their
own get_current_student_payload dependency defined in this file.
"""
import asyncio
import io
import json
import logging
import os
import random
import re
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from math import ceil
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer

from activity_service import log_activity
from auth_utils import create_access_token, decode_token, hash_password, require_admin, verify_password
from cashfree_client import CashfreeError, cashfree_configured, create_order as cf_create_order, new_order_id, verify_webhook_signature
from certificate_pdf import (
    generate_certificate_pdf,
    generate_internship_agreement_pdf,
    generate_internship_program_letter_pdf,
    generate_internship_report_pdf,
)
from certificate_routes import _next_sequence
from email_service import (
    document_email_html,
    email_configured,
    send_email_with_pdfs,
    send_internship_password_reset_email,
    send_internship_signup_received_email,
    send_internship_welcome_email,
    INTERNSHIP_RESET_PASSWORD_URL,
)
from qr_routes import _mask_email, _mask_phone
from database import (
    certificates_collection,
    internship_quiz_attempts_collection,
    internship_quiz_questions_collection,
    internship_reports_collection,
    internship_students_collection,
    internship_submissions_collection,
    internship_task_pool_collection,
    password_resets_collection,
    payment_orders_collection,
)
from internship_models import (
    DURATION_PRICING,
    GRADUATION_THRESHOLD,
    QUIZ_PASS_THRESHOLD,
    RADAR_CATEGORY_LABELS,
    TRACK_LABELS,
    AgreementSignIn,
    DobUpdateIn,
    ForgotPasswordIn,
    GraduateIn,
    GraduationCheckOut,
    InternshipStudentInDB,
    KycSubmitIn,
    PaymentOverrideIn,
    QuizAttemptOut,
    QuizQuestionAdminOut,
    QuizQuestionIn,
    QuizQuestionOut,
    QuizSubmitIn,
    ReportEntryIn,
    ReportEntryOut,
    PaymentOrderOut,
    PaymentStatusOut,
    RegenerateSearchIn,
    RegenerateSearchOut,
    ResetPasswordIn,
    ResumePaymentOut,
    ResumePaymentUpdateIn,
    StudentLoginIn,
    StudentOut,
    StudentSignupIn,
    SubmissionDraftIn,
    SubmissionOut,
    SubmissionReviewIn,
    SupportQueryIn,
    TaskPoolAdminOut,
    TaskPoolIn,
    TaskPoolOut,
    TrackSelectIn,
    VideoReviewIn,
    WarnBanIn,
)
from rate_limit import limiter
from storage_r2 import get_client as r2_client, presigned_url, r2_enabled, upload_bytes, R2_BUCKET_NAME

SITE_URL = "https://www.thefinancialdoctor.in"

logger = logging.getLogger(__name__)

TASKS_PER_WEEK = 4

router = APIRouter(prefix="/api/internship", tags=["internship"])

# Its own token scheme (separate tokenUrl from the staff portal's
# /api/auth/login) — auto_error=False so a missing header raises our own
# 401 message rather than FastAPI's generic one.
_student_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/internship/login", auto_error=False)


async def get_current_student_payload(token: str = Depends(_student_oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    if payload.get("role") != "internship_student":
        raise HTTPException(status_code=403, detail="Student access required")
    doc = await internship_students_collection.find_one({"id": payload["sub"]}, {"status": 1})
    if not doc:
        raise HTTPException(status_code=401, detail="Session invalid")
    if doc.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Your account has been suspended")
    return payload


def _compute_progress(doc: dict) -> tuple[int, int]:
    """(current_day, current_week), both 0 until payment unlocks Day 1."""
    start = doc.get("program_start_date")
    duration = doc.get("duration_days", 90)
    if not start:
        return 0, 0
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - start).days + 1
    current_day = max(1, min(elapsed, duration))
    current_week = ceil(current_day / 7)
    return current_day, current_week


def _phase_for_week(week_number: int) -> tuple[int, bool]:
    """(phase, is_blindfold_week). 1 = guided (Day 1-30), 2 = independent
    (Day 31-60), 3 = capstone (Day 61-90+) — mirrors a real career
    progression. Phase 3 splits into two halves by day: 61-75 is capstone
    work (hints/sample-solution/Hinglish still on), 76-90+ is "Grand
    Finale / Blindfold" — independent, no hints, no sample, English-only,
    moderately (not perfectionist-ly) stricter grading — see
    _auto_verify_spreadsheet/_auto_verify_text. Based on the calendar day
    the week starts on, so it works for any week_number/duration; a week
    that starts past day 90 (shouldn't normally happen for a 90-day
    program) still safely falls into phase 3/blindfold rather than erroring."""
    start_day = (week_number - 1) * 7 + 1
    if start_day <= 30:
        return 1, False
    if start_day <= 60:
        return 2, False
    return 3, start_day > 75


async def _gen_intern_id() -> str:
    """TFDI + a random 6-digit number — mirrors gen_random_employee_id()'s
    TFD###### scheme (utils/employee.py) but with a distinct 'I' prefix so
    an intern ID can never collide with or be mistaken for a staff employee
    ID, since the two live in entirely separate collections/auth systems."""
    while True:
        candidate = f"TFDI{random.randint(100000, 999999)}"
        if not await internship_students_collection.find_one({"intern_id": candidate}):
            return candidate


def _to_student_out(doc: dict) -> StudentOut:
    current_day, current_week = _compute_progress(doc)
    program_end_date = None
    start = doc.get("program_start_date")
    if start:
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        program_end_date = start + timedelta(days=doc.get("duration_days", 90) - 1)
    photo_url = presigned_url(doc["photo_r2_key"]) if doc.get("photo_r2_key") else None
    return StudentOut(
        id=doc["id"], intern_id=doc.get("intern_id", ""), name=doc["name"], phone=doc["phone"], email=doc["email"],
        college=doc.get("college"), course_year=doc.get("course_year"), dob=doc.get("dob"), photo_url=photo_url,
        gender=doc.get("gender"), aadhar_number=doc.get("aadhar_number"), pan_number=doc.get("pan_number"),
        no_pan=doc.get("no_pan", False), college_id_number=doc.get("college_id_number"),
        agreement_signed_at=doc.get("agreement_signed_at"), agreement_signed_location=doc.get("agreement_signed_location"),
        profile_completed=doc.get("profile_completed", False),
        duration_days=doc.get("duration_days", 90),
        track=doc.get("track"), track_label=TRACK_LABELS.get(doc.get("track")) if doc.get("track") else None,
        payment_status=doc.get("payment_status", "pending"), payment_amount=doc.get("payment_amount", 2000),
        program_start_date=doc.get("program_start_date"), program_end_date=program_end_date,
        current_day=current_day, current_week=current_week,
        status=doc.get("status", "pending_payment"), warning_count=doc.get("warning_count", 0),
        quiz_pass_count=doc.get("quiz_pass_count", 0),
        radar_scores=doc.get("radar_scores", {}), certificate_id=doc.get("certificate_id"),
        letter_id=doc.get("letter_id"), report_id=doc.get("report_id"),
        video_consent=doc.get("video_consent", False), video_review_url=doc.get("video_review_url"),
        video_review_submitted_at=doc.get("video_review_submitted_at"),
        is_demo=doc.get("is_demo", False),
        created_at=doc["created_at"],
    )


@router.get("/tracks")
async def list_tracks():
    return [{"value": k, "label": v} for k, v in TRACK_LABELS.items()]


@router.get("/durations")
async def list_durations():
    return [{"days": days, "price": price} for days, price in sorted(DURATION_PRICING.items())]


@router.post("/signup")
@limiter.limit("10/minute")
async def signup(request: Request, data: StudentSignupIn):
    """Public — creates a standalone internship-program login (no
    users_collection involvement at all) and logs the student straight in."""
    existing = await internship_students_collection.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists")
    existing_email = await internship_students_collection.find_one({"email": data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    student = InternshipStudentInDB(
        intern_id=await _gen_intern_id(),
        name=data.name, phone=data.phone, email=data.email, password_hash=hash_password(data.password),
        college=data.college, course_year=data.course_year, duration_days=data.duration_days,
        payment_amount=DURATION_PRICING.get(data.duration_days, 5000),
        video_consent=data.video_consent,
        payment_resume_token=secrets.token_urlsafe(32),
    )
    doc = student.dict()
    await internship_students_collection.insert_one(doc)
    doc.pop("_id", None)

    try:
        # Track isn't chosen until the immediately-following PUT /track call
        # in the real signup flow, so this is deliberately generic here. This
        # email deliberately has no login link — the account isn't active
        # until payment clears (see login()'s payment_status gate below and
        # _mark_student_paid's own welcome email, sent once that's true).
        send_internship_signup_received_email(
            student.email, student.name, student.intern_id,
            TRACK_LABELS.get(student.track, "your chosen"), student.duration_days, student.payment_amount,
            f"{SITE_URL}/internship/resume-payment/{student.payment_resume_token}",
        )
    except Exception:
        logger.exception("Internship signup-received email failed for %s", student.email)  # never block signup on email failure

    # This token is intentionally scoped to a single job: letting the
    # frontend immediately call POST /payment/create-order and redirect to
    # Cashfree checkout right after signup. It is NOT a substitute for
    # logging in — login() below rejects unpaid accounts outright, and the
    # student portal's own client-side payment gate (StudentDashboard.jsx)
    # keeps this same token from exposing real program content either way.
    token = create_access_token(student.id, "internship_student")
    return {"access_token": token, "token_type": "bearer", "student": _to_student_out(doc)}


async def _reset_demo_student(student_id: str) -> dict:
    """The demo account is a fixed, always-available walkthrough login (see
    seed_demo_student.py) — it must always start from a clean Day-1 state so
    repeated demos never show leftover data from a previous session, while
    still behaving exactly like a real account (real submissions, real AI
    verification) for the duration of that session."""
    await internship_submissions_collection.delete_many({"student_id": student_id})
    await internship_quiz_attempts_collection.delete_many({"student_id": student_id})
    await internship_reports_collection.delete_many({"student_id": student_id})
    now = datetime.now(timezone.utc)
    await internship_students_collection.update_one(
        {"id": student_id},
        {
            "$set": {
                "status": "active", "program_start_date": now, "assigned_tasks": {},
                "warning_count": 0, "quiz_pass_count": 0, "last_quiz_score": None, "radar_scores": {},
                "video_consent": False, "video_review_url": None, "video_review_submitted_at": None,
                "no_pan": False, "profile_completed": False,
                "updated_at": now,
            },
            "$unset": {
                "ban_reason": "", "banned_at": "", "certificate_id": "", "letter_id": "", "report_id": "", "graduated_at": "",
                "dob": "", "photo_r2_key": "", "gender": "", "aadhar_number": "", "pan_number": "", "college_id_number": "",
                "agreement_signature_r2_key": "", "agreement_signed_at": "", "agreement_signed_location": "",
            },
        },
    )
    return await internship_students_collection.find_one({"id": student_id})


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, data: StudentLoginIn):
    doc = await internship_students_collection.find_one({"phone": data.phone})
    if not doc or not verify_password(data.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    if doc.get("status") == "banned" and not doc.get("is_demo"):
        raise HTTPException(status_code=403, detail="Your account has been suspended")
    if not doc.get("is_demo") and doc.get("payment_status") not in ("paid", "waived"):
        # Account exists but was never activated — no dashboard/task access
        # until payment clears. resume_token lets them finish paying without
        # re-filling the signup form.
        detail = "Your payment hasn't been completed yet, so your account isn't active. Check your email for a payment link to finish signing up."
        resume_token = doc.get("payment_resume_token")
        if resume_token:
            detail += f" Or use this link: {SITE_URL}/internship/resume-payment/{resume_token}"
        raise HTTPException(status_code=403, detail=detail)
    if doc.get("is_demo"):
        doc = await _reset_demo_student(doc["id"])
    token = create_access_token(doc["id"], "internship_student")
    return {"access_token": token, "token_type": "bearer", "student": _to_student_out(doc)}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, data: ForgotPasswordIn):
    """Public, unauthenticated. Mirrors auth_routes.py's employee/admin
    forgot-password flow exactly, but scoped to internship_students_collection
    with account_type tagged on the reset record — a token minted here can
    never be replayed against the staff-portal reset-password endpoint or
    vice versa, even though user_id collision is practically impossible
    with UUIDs anyway."""
    email = data.email.strip()
    if not email:
        raise HTTPException(status_code=400, detail="Please enter your registered email ID.")
    student = await internship_students_collection.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
    not_registered = HTTPException(
        status_code=404,
        detail="Please check your email ID. This email is not registered with us. Enter your registered email ID to reset your password.",
    )
    if not student or not student.get("email"):
        raise not_registered
    if not email_configured():
        raise HTTPException(status_code=503, detail="Email sending is not configured. Please contact your administrator.")

    await password_resets_collection.delete_many({"user_id": student["id"], "account_type": "internship_student", "used": False})

    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    await password_resets_collection.insert_one({
        "token": token,
        "user_id": student["id"],
        "account_type": "internship_student",
        "created_at": now,
        "expires_at": now + timedelta(minutes=20),
        "used": False,
    })

    reset_url = f"{INTERNSHIP_RESET_PASSWORD_URL}?token={token}"
    send_internship_password_reset_email(student["email"], student.get("name", "there"), reset_url)
    return {"status": "sent"}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordIn):
    """Public, unauthenticated — the link from the internship forgot-password
    email lands here. One-time use, 20-minute expiry, whichever comes first."""
    record = await password_resets_collection.find_one({"token": data.token, "account_type": "internship_student"})
    if not record or record.get("used"):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used. Please request a new one.")

    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    student = await internship_students_collection.find_one({"id": record["user_id"]})
    if not student:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used. Please request a new one.")

    await internship_students_collection.update_one({"id": record["user_id"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    await password_resets_collection.update_one({"token": data.token}, {"$set": {"used": True}})
    return {"status": "password_reset"}


@router.put("/track")
async def select_track(data: TrackSelectIn, payload: dict = Depends(get_current_student_payload)):
    doc = await internship_students_collection.find_one({"id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    # The demo account can switch freely between all 4 tracks any time, to
    # show off each one — every real account still locks in on first pick.
    if doc.get("track_locked_at") and not doc.get("is_demo"):
        raise HTTPException(status_code=409, detail="Track already selected and locked")
    if doc.get("is_demo"):
        # Clear out the previous track's submissions/quiz attempts too, so
        # switching tracks in a demo is a genuinely clean slate, not just a
        # relabeled one.
        await internship_submissions_collection.delete_many({"student_id": payload["sub"]})
        await internship_quiz_attempts_collection.delete_many({"student_id": payload["sub"]})
    await internship_students_collection.update_one(
        {"id": payload["sub"]},
        {"$set": {
            "track": data.track, "track_locked_at": datetime.now(timezone.utc), "assigned_tasks": {},
            "quiz_pass_count": 0, "last_quiz_score": None, "radar_scores": {}, "updated_at": datetime.now(timezone.utc),
        }},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


@router.get("/me", response_model=StudentOut)
async def get_me(payload: dict = Depends(get_current_student_payload)):
    doc = await internship_students_collection.find_one({"id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _to_student_out(doc)


@router.put("/me/dob", response_model=StudentOut)
async def update_dob(data: DobUpdateIn, payload: dict = Depends(get_current_student_payload)):
    """DOB is needed for the ID card — captured after signup rather than
    during it, so the signup form stays short."""
    await internship_students_collection.update_one(
        {"id": payload["sub"]}, {"$set": {"dob": data.dob, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


@router.post("/me/photo")
async def upload_profile_photo(photo: UploadFile = File(...), payload: dict = Depends(get_current_student_payload)):
    content = await photo.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Photo must be under 5MB")
    ext = (photo.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"
    r2_key = f"internship-profile/{payload['sub']}.{ext}"
    upload_bytes(r2_key, content, photo.content_type or "image/jpeg")
    await internship_students_collection.update_one(
        {"id": payload["sub"]}, {"$set": {"photo_r2_key": r2_key, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


@router.get("/me/photo/raw")
async def get_profile_photo_raw(payload: dict = Depends(get_current_student_payload)):
    """Same-origin raw bytes for the logged-in student's own photo — the ID
    Card page's PDF export (html2canvas) can't read pixels from a direct R2
    presigned-URL <img> because the bucket has no CORS policy; proxying the
    bytes through our own backend into a blob: URL sidesteps that (same
    fix already applied to the employee ID card, see EmployeeIDCardPage.jsx)."""
    doc = await internship_students_collection.find_one({"id": payload["sub"]}, {"photo_r2_key": 1})
    if not doc or not doc.get("photo_r2_key"):
        raise HTTPException(status_code=404, detail="No photo uploaded")
    obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["photo_r2_key"])
    return StreamingResponse(obj["Body"], media_type=obj.get("ContentType", "image/jpeg"))


# ── Mandatory KYC + agreement onboarding ────────────────────────────────
# A one-time gate between payment and actually using the portal: KYC
# details, a photo (same one the ID card uses — no separate upload), and a
# GPS-gated agreement signature. profile_completed flips to True only once
# the agreement is signed — see StudentProtectedRoute.jsx for the gate.

@router.post("/me/kyc", response_model=StudentOut)
async def submit_kyc(data: KycSubmitIn, payload: dict = Depends(get_current_student_payload)):
    if not data.no_pan and not (data.pan_number or "").strip():
        raise HTTPException(status_code=400, detail="Enter your PAN number, or check 'I don't have a PAN card'")
    await internship_students_collection.update_one(
        {"id": payload["sub"]},
        {"$set": {
            "dob": data.dob, "gender": data.gender, "aadhar_number": data.aadhar_number.strip(),
            "pan_number": None if data.no_pan else data.pan_number.strip().upper(),
            "no_pan": data.no_pan, "college_id_number": data.college_id_number.strip(),
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


@router.post("/me/agreement/signature")
async def upload_agreement_signature(signature: UploadFile = File(...), payload: dict = Depends(get_current_student_payload)):
    content = await signature.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Signature image must be under 5MB")
    ext = (signature.filename or "signature.png").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "png"
    r2_key = f"internship-uploads/{payload['sub']}/signature.{ext}"
    upload_bytes(r2_key, content, signature.content_type or "image/png")
    await internship_students_collection.update_one(
        {"id": payload["sub"]}, {"$set": {"agreement_signature_r2_key": r2_key, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"status": "uploaded"}


@router.get("/me/agreement/status")
async def get_agreement_status(payload: dict = Depends(get_current_student_payload)):
    doc = await internship_students_collection.find_one(
        {"id": payload["sub"]}, {"agreement_signed_at": 1, "agreement_signed_location": 1, "agreement_signature_r2_key": 1},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return {
        "signed": bool(doc.get("agreement_signed_at")),
        "signed_at": doc.get("agreement_signed_at"),
        "location": doc.get("agreement_signed_location"),
        "has_signature_uploaded": bool(doc.get("agreement_signature_r2_key")),
    }


@router.post("/me/agreement/sign")
async def sign_agreement(data: AgreementSignIn, payload: dict = Depends(get_current_student_payload)):
    doc = await internship_students_collection.find_one({"id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if doc.get("agreement_signed_at"):
        return {"status": "already_signed", "signed_at": doc["agreement_signed_at"], "location": doc.get("agreement_signed_location")}

    missing = [
        label for field, label in [
            ("dob", "date of birth"), ("gender", "gender"), ("aadhar_number", "Aadhaar number"),
            ("college_id_number", "college ID number"), ("photo_r2_key", "photo"), ("agreement_signature_r2_key", "signature"),
        ] if not doc.get(field)
    ]
    if missing:
        raise HTTPException(status_code=400, detail=f"Please complete these steps first: {', '.join(missing)}")

    now = datetime.now(timezone.utc)
    location_str = f"{data.lat:.6f}, {data.lng:.6f}"
    await internship_students_collection.update_one(
        {"id": payload["sub"]},
        {"$set": {
            "agreement_signed_at": now, "agreement_signed_location": location_str,
            "profile_completed": True, "updated_at": now,
        }},
    )
    return {"status": "signed", "signed_at": now, "location": location_str}


def _internship_agreement_pdf_data(doc: dict) -> dict:
    duration_days = doc.get("duration_days", 90)
    start = doc.get("program_start_date")
    start_label = start.date().isoformat() if start else None
    return {
        "name": doc["name"], "intern_id": doc.get("intern_id", ""), "college": doc.get("college"),
        "course_year": doc.get("course_year"), "dob": doc.get("dob"), "gender": doc.get("gender"),
        "contact_no": doc.get("phone"), "email": doc.get("email"),
        "aadhar_number": doc.get("aadhar_number"), "pan_number": doc.get("pan_number") or "Not Provided",
        "college_id_number": doc.get("college_id_number"), "track_label": TRACK_LABELS.get(doc.get("track"), doc.get("track")),
        "duration_days": duration_days, "payment_amount": doc.get("payment_amount"),
        "program_start_date": start_label,
        "signed_at": doc.get("agreement_signed_at"), "signed_location": doc.get("agreement_signed_location"),
    }


@router.get("/me/agreement/download")
async def download_agreement(payload: dict = Depends(get_current_student_payload)):
    doc = await internship_students_collection.find_one({"id": payload["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not doc.get("agreement_signed_at"):
        raise HTTPException(status_code=400, detail="Agreement hasn't been signed yet")

    photo_bytes = None
    if doc.get("photo_r2_key"):
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["photo_r2_key"])
            photo_bytes = obj["Body"].read()
        except Exception:
            photo_bytes = None
    signature_bytes = None
    if doc.get("agreement_signature_r2_key"):
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["agreement_signature_r2_key"])
            signature_bytes = obj["Body"].read()
        except Exception:
            signature_bytes = None

    pdf_bytes = generate_internship_agreement_pdf(_internship_agreement_pdf_data(doc), photo_bytes=photo_bytes, signature_bytes=signature_bytes)
    filename = f"TFD_Internship_Agreement_{doc['name'].replace(' ', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


@router.put("/me/video-review", response_model=StudentOut)
async def submit_video_review(data: VideoReviewIn, payload: dict = Depends(get_current_student_payload)):
    """Requested (encouraged from signup onward), not required for the
    certificate — a link to wherever the student has already uploaded their
    internship-experience review video (YouTube/Instagram/Drive), not a raw
    file upload. Re-submittable/editable any time. `consent` re-confirms
    (and can revise) the social-media-use answer given at signup, now that
    the student has an actual video in hand."""
    url = data.video_url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Please paste a valid video link (starting with http:// or https://)")
    await internship_students_collection.update_one(
        {"id": payload["sub"]},
        {"$set": {
            "video_review_url": url, "video_consent": data.consent,
            "video_review_submitted_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
        }},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


_VERIFY_PUBLIC_FIELDS = {"intern_id", "name", "track_label", "duration_days", "program_start_date", "program_end_date", "status", "photo_url"}


@router.get("/verify/{intern_id}")
@limiter.limit("20/minute")
async def verify_intern(request: Request, intern_id: str):
    """Public, unauthenticated — what the ID card's QR code resolves to.
    Deliberately excludes phone/email/dob/college — only what's needed to
    confirm 'this person is a real TFD intern' to someone scanning the card."""
    doc = await internship_students_collection.find_one({"intern_id": intern_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No intern found with this ID")
    full = _to_student_out(doc).dict()
    return {k: v for k, v in full.items() if k in _VERIFY_PUBLIC_FIELDS}


_SUPPORT_SYSTEM_PROMPT = """You are the automatic support assistant for TFD Internship, The Financial
Doctor's internship program. A student has a question or problem. Answer clearly and helpfully in
2-4 short sentences, in simple English (Hinglish is fine if the student wrote in Hinglish).

What you know about the program:
- A 90-day program, in Finance, Marketing, Sales, or HR, chosen at signup.
- A seat is reserved at signup; an admin confirms payment manually right now (a payment gateway is
  coming soon) — Day 1 starts automatically the moment payment is confirmed.
- Each week, 4 tasks are automatically assigned based on the student's track — no admin action needed.
- Submissions (text and/or a live camera photo, sometimes with location) are auto-verified
  immediately by AI — approved tasks are simply marked complete, rejected ones can be resubmitted
  from the Active Missions page.
- There is no payment or wallet paid out to students — this is a learning program, not a paid gig.
- A certificate is issued after successfully completing the full program duration.

If the question is something you can't resolve from the above (e.g. a account-specific dispute,
technical bug, or anything requiring a human), say so plainly and tell them to contact the TFD team
via the program coordinator — don't make up an answer."""


@router.post("/support")
@limiter.limit("15/minute")
async def support_query(request: Request, data: SupportQueryIn, payload: dict = Depends(get_current_student_payload)):
    """Auto-resolves common student questions immediately via Gemini — no
    admin/ticket queue. Falls back to a plain contact-us message if Gemini
    is unavailable, so the student never gets stuck with no response."""
    answer = await _call_gemini(_SUPPORT_SYSTEM_PROMPT, data.message.strip(), temperature=0.3)
    if not answer:
        answer = (
            "Sorry, our automatic support assistant isn't available right now. "
            "Please reach out to your TFD program coordinator directly and they'll help you out."
        )
    return {"answer": answer}


@router.get("/admin/students", response_model=list[StudentOut])
async def list_students(_admin: dict = Depends(require_admin)):
    """Staff-portal-only — the TFD Internship admin section reads this
    program's data using the existing admin login; it has no bearing on how
    students themselves authenticate (see module docstring)."""
    cursor = internship_students_collection.find().sort("created_at", -1)
    return [_to_student_out(doc) async for doc in cursor]


async def _mark_student_paid(student_id: str, marked_by: str) -> dict:
    """Shared by the admin's manual override and the Cashfree webhook —
    same effect either way: Day 1 starts the moment a seat is confirmed
    paid, however that confirmation arrived."""
    doc = await internship_students_collection.find_one({"id": student_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    now = datetime.now(timezone.utc)
    await internship_students_collection.update_one(
        {"id": student_id},
        {"$set": {
            "payment_status": "paid", "payment_marked_by": marked_by, "payment_marked_at": now,
            "program_start_date": doc.get("program_start_date") or now,
            "status": "active", "updated_at": now,
        },
        "$unset": {"payment_resume_token": ""}},  # no longer needed — login works normally now
    )
    updated = await internship_students_collection.find_one({"id": student_id})

    if not doc.get("is_demo"):
        try:
            # The real welcome/login email — signup's own email deliberately
            # never included a login link, since the account wasn't active.
            send_internship_welcome_email(
                updated["email"], updated["name"], updated["intern_id"],
                TRACK_LABELS.get(updated.get("track"), "your chosen"), updated["duration_days"], updated["payment_amount"],
            )
        except Exception:
            logger.exception("Internship post-payment welcome email failed for %s", updated.get("email"))

    return updated


@router.patch("/admin/students/{student_id}/payment")
async def mark_paid(student_id: str, data: PaymentOverrideIn, admin: dict = Depends(require_admin)):
    """Manual admin override — a fallback for edge cases (a webhook that
    never arrives, a customer who paid by other means, etc.) now that
    Cashfree handles the normal path; kept intentionally, not removed."""
    updated = await _mark_student_paid(student_id, admin["sub"])
    return _to_student_out(updated)


# ── Cashfree payment — signup fee (₹2000/3000/5000 by duration) ─────────

async def _create_or_reuse_signup_order(student: dict, return_url: str) -> PaymentOrderOut:
    """Shared by the logged-in-flow (POST /payment/create-order, right after
    signup) and the token-authenticated resume-payment flow below — same
    order-dedup logic either way, so a student re-opening either path within
    15 minutes doesn't spam Cashfree with fresh orders. return_url differs
    per caller (the resume-payment flow has no active session to land back
    into, so it can't reuse /portal/student like the normal flow does)."""
    if not cashfree_configured():
        raise HTTPException(status_code=503, detail="Payments aren't configured yet — please contact support.")
    if student.get("payment_status") == "paid":
        raise HTTPException(status_code=409, detail="Your payment is already confirmed.")

    recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    existing = await payment_orders_collection.find_one(
        {"linked_id": student["id"], "payment_type": "internship_signup", "status": "created", "created_at": {"$gte": recent_cutoff}},
        sort=[("created_at", -1)],
    )
    if existing:
        return PaymentOrderOut(
            order_id=existing["order_id"], payment_session_id=existing["payment_session_id"],
            amount=existing["amount"], cashfree_env=os.environ.get("CASHFREE_ENV", "sandbox"),
        )

    order_id = new_order_id(f"INT{student.get('intern_id', '')}")
    amount = student.get("payment_amount", 2000)
    notify_url = f"{os.environ.get('BACKEND_PUBLIC_URL', '').rstrip('/')}/api/internship/payment/webhook"

    try:
        cf_resp = await cf_create_order(
            order_id=order_id, amount=amount, customer_id=student["id"],
            customer_phone=student["phone"], customer_email=student.get("email"),
            return_url=return_url, notify_url=notify_url,
            order_note=f"TFD Internship signup — {student.get('duration_days')} days — {student['name']}",
        )
    except CashfreeError:
        logger.exception("Cashfree create_order failed for internship signup")
        raise HTTPException(status_code=502, detail="Could not start payment right now — please try again in a moment.")

    now = datetime.now(timezone.utc)
    await payment_orders_collection.insert_one({
        "id": str(uuid.uuid4()), "order_id": order_id, "cf_order_id": cf_resp.get("cf_order_id"),
        "payment_session_id": cf_resp.get("payment_session_id"), "payment_type": "internship_signup",
        "amount": amount, "currency": "INR", "status": "created",
        "linked_id": student["id"], "customer_email": student.get("email"), "customer_phone": student["phone"],
        "cf_payment_id": None, "created_at": now, "paid_at": None,
    })
    return PaymentOrderOut(
        order_id=order_id, payment_session_id=cf_resp.get("payment_session_id"),
        amount=amount, cashfree_env=os.environ.get("CASHFREE_ENV", "sandbox"),
    )


@router.post("/payment/create-order", response_model=PaymentOrderOut)
@limiter.limit("10/minute")
async def create_payment_order(request: Request, payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return await _create_or_reuse_signup_order(student, return_url=f"{SITE_URL}/portal/student?order_id={{order_id}}")


# ── Resume payment — public, token-authenticated (no login/JWT) ─────────
# Reached from the signup-confirmation and 30-min reminder emails. Lets an
# unpaid signup review/edit their basic details and pay, without needing an
# active login (which is intentionally blocked pre-payment — see login()).

async def _get_student_by_resume_token(token: str) -> dict:
    student = await internship_students_collection.find_one({"payment_resume_token": token})
    if not student:
        raise HTTPException(status_code=404, detail="This payment link is invalid or has expired.")
    if student.get("payment_status") == "paid":
        raise HTTPException(status_code=409, detail="This payment is already confirmed — you can log in now.")
    return student


@router.get("/resume-payment/{token}", response_model=ResumePaymentOut)
@limiter.limit("20/minute")
async def get_resume_payment(request: Request, token: str):
    student = await _get_student_by_resume_token(token)
    return ResumePaymentOut(
        name=student["name"], college=student.get("college"), course_year=student.get("course_year"),
        track=student.get("track"), duration_days=student["duration_days"],
        payment_amount=student["payment_amount"], intern_id=student["intern_id"],
    )


@router.put("/resume-payment/{token}", response_model=ResumePaymentOut)
@limiter.limit("20/minute")
async def update_resume_payment(request: Request, token: str, data: ResumePaymentUpdateIn):
    student = await _get_student_by_resume_token(token)
    updates = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await internship_students_collection.update_one({"id": student["id"]}, {"$set": updates})
        student = await internship_students_collection.find_one({"id": student["id"]})
    return ResumePaymentOut(
        name=student["name"], college=student.get("college"), course_year=student.get("course_year"),
        track=student.get("track"), duration_days=student["duration_days"],
        payment_amount=student["payment_amount"], intern_id=student["intern_id"],
    )


@router.post("/resume-payment/{token}/pay", response_model=PaymentOrderOut)
@limiter.limit("10/minute")
async def pay_resume_payment(request: Request, token: str):
    student = await _get_student_by_resume_token(token)
    return_url = f"{SITE_URL}/internship/login?paid=1&order_id={{order_id}}"
    return await _create_or_reuse_signup_order(student, return_url=return_url)


@router.get("/payment/status/{order_id}", response_model=PaymentStatusOut)
async def get_payment_status(order_id: str, payload: dict = Depends(get_current_student_payload)):
    order = await payment_orders_collection.find_one({"order_id": order_id, "linked_id": payload["sub"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    return PaymentStatusOut(order_id=order_id, order_status=order["status"], payment_status=student.get("payment_status", "pending"))


@router.post("/payment/webhook")
async def cashfree_webhook(request: Request):
    """Public — called server-to-server by Cashfree, never by a browser.
    The signature check below is the ONLY thing standing between this
    endpoint and anyone on the internet claiming a payment succeeded, so it
    is mandatory and never skipped, regardless of what the payload claims."""
    raw_body = await request.body()
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")

    if not verify_webhook_signature(raw_body, timestamp, signature):
        logger.warning("Cashfree webhook signature verification failed")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = payload.get("type", "")
    order_data = (payload.get("data") or {}).get("order") or {}
    payment_data = (payload.get("data") or {}).get("payment") or {}
    order_id = order_data.get("order_id")
    if not order_id:
        return {"status": "ignored", "reason": "no order_id in payload"}

    order = await payment_orders_collection.find_one({"order_id": order_id})
    if not order:
        logger.warning("Cashfree webhook for unknown order_id: %s", order_id)
        return {"status": "ignored", "reason": "unknown order"}

    if order["status"] == "paid":
        return {"status": "already_processed"}

    is_success = event_type == "PAYMENT_SUCCESS_WEBHOOK" or payment_data.get("payment_status") == "SUCCESS"
    now = datetime.now(timezone.utc)

    if is_success:
        await payment_orders_collection.update_one(
            {"order_id": order_id},
            {"$set": {"status": "paid", "paid_at": now, "cf_payment_id": payment_data.get("cf_payment_id")}},
        )
        if order["payment_type"] == "internship_signup":
            await _mark_student_paid(order["linked_id"], "cashfree_webhook")
        elif order["payment_type"] == "certificate_regeneration":
            await _email_regenerated_documents(order["linked_id"])
    else:
        await payment_orders_collection.update_one({"order_id": order_id}, {"$set": {"status": "failed"}})

    return {"status": "processed"}


# ── Certificate regeneration (public, no login — ₹499 via Cashfree) ─────

async def _find_regeneration_target(data: RegenerateSearchIn) -> dict | None:
    """Returns the matched, graduated student doc (with a real certificate),
    or None. By certificate number alone, OR by at least 2 of their own KYC
    details together — a single field (e.g. just a phone number) is never
    enough, to keep this hard to enumerate."""
    if data.certificate_number and data.certificate_number.strip():
        normalized = data.certificate_number.strip().replace("-", "/")
        cert = await certificates_collection.find_one({"certificate_number": normalized, "type": "internship_program"})
        if not cert or not cert.get("internship_student_id"):
            return None
        return await internship_students_collection.find_one({"id": cert["internship_student_id"]})

    query = {}
    if data.college_id_number and data.college_id_number.strip():
        query["college_id_number"] = data.college_id_number.strip()
    if data.email and data.email.strip():
        query["email"] = data.email.strip().lower()
    if data.phone and data.phone.strip():
        query["phone"] = data.phone.strip()
    if data.aadhar_number and data.aadhar_number.strip():
        query["aadhar_number"] = data.aadhar_number.strip()
    if len(query) < 2:
        return None
    return await internship_students_collection.find_one(query)


@router.post("/certificate/regenerate/search", response_model=RegenerateSearchOut)
@limiter.limit("10/minute")
async def regenerate_search(request: Request, data: RegenerateSearchIn):
    student = await _find_regeneration_target(data)
    if not student or student.get("status") != "graduated" or not student.get("certificate_id"):
        return RegenerateSearchOut(found=False)
    cert = await certificates_collection.find_one({"id": student["certificate_id"]})
    if not cert:
        return RegenerateSearchOut(found=False)
    return RegenerateSearchOut(found=True, certificate_number=cert["certificate_number"], name=student["name"], masked_email=_mask_email(student.get("email")))


@router.post("/certificate/regenerate/create-order", response_model=PaymentOrderOut)
@limiter.limit("5/minute")
async def regenerate_create_order(request: Request, data: RegenerateSearchIn):
    if not cashfree_configured():
        raise HTTPException(status_code=503, detail="Payments aren't configured yet — please contact support.")
    student = await _find_regeneration_target(data)
    if not student or student.get("status") != "graduated" or not student.get("certificate_id"):
        raise HTTPException(status_code=404, detail="No matching certificate found — please double-check your details.")
    cert = await certificates_collection.find_one({"id": student["certificate_id"]})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate record not found")

    # Duplicate-payment prevention — reuse a still-fresh order for this
    # exact certificate instead of letting someone spam-create new ones.
    recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    existing = await payment_orders_collection.find_one(
        {"linked_id": student["id"], "payment_type": "certificate_regeneration", "status": "created", "created_at": {"$gte": recent_cutoff}},
        sort=[("created_at", -1)],
    )
    if existing:
        return PaymentOrderOut(order_id=existing["order_id"], payment_session_id=existing["payment_session_id"], amount=existing["amount"], cashfree_env=os.environ.get("CASHFREE_ENV", "sandbox"))

    order_id = new_order_id(f"REGEN{student.get('intern_id', '')}")
    amount = 499
    return_url = f"{SITE_URL}/verify?certificate={cert['certificate_number'].replace('/', '-')}&regen_order_id={{order_id}}"
    notify_url = f"{os.environ.get('BACKEND_PUBLIC_URL', '').rstrip('/')}/api/internship/payment/webhook"

    try:
        cf_resp = await cf_create_order(
            order_id=order_id, amount=amount, customer_id=student["id"],
            customer_phone=student["phone"], customer_email=student.get("email"),
            return_url=return_url, notify_url=notify_url,
            order_note=f"Certificate regeneration — {cert['certificate_number']} — {student['name']}",
        )
    except CashfreeError:
        logger.exception("Cashfree create_order failed for certificate regeneration")
        raise HTTPException(status_code=502, detail="Could not start payment right now — please try again in a moment.")

    now = datetime.now(timezone.utc)
    await payment_orders_collection.insert_one({
        "id": str(uuid.uuid4()), "order_id": order_id, "cf_order_id": cf_resp.get("cf_order_id"),
        "payment_session_id": cf_resp.get("payment_session_id"), "payment_type": "certificate_regeneration",
        "amount": amount, "currency": "INR", "status": "created",
        "linked_id": student["id"], "certificate_number": cert["certificate_number"],
        "customer_email": student.get("email"), "customer_phone": student["phone"],
        "cf_payment_id": None, "created_at": now, "paid_at": None,
    })
    return PaymentOrderOut(order_id=order_id, payment_session_id=cf_resp.get("payment_session_id"), amount=amount, cashfree_env=os.environ.get("CASHFREE_ENV", "sandbox"))


async def _email_regenerated_documents(student_id: str) -> None:
    """Called from the webhook on a confirmed ₹499 payment — fetches the
    student's ALREADY-issued certificate + internship letter PDFs from R2
    (not regenerated from scratch, so the emailed copy always matches what
    was actually issued) and emails both instantly to their registered
    email."""
    student = await internship_students_collection.find_one({"id": student_id})
    if not student or not student.get("email") or not email_configured():
        return

    attachments = []
    labels = []
    for doc_id, prefix, label in [
        (student.get("certificate_id"), "Certificate", "Internship Certificate"),
        (student.get("letter_id"), "Internship_Letter", "Internship Letter"),
    ]:
        if not doc_id:
            continue
        cert_doc = await certificates_collection.find_one({"id": doc_id})
        if not cert_doc or not cert_doc.get("r2_key"):
            continue
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=cert_doc["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            continue
        attachments.append((f"{prefix}_{student['name'].replace(' ', '_')}.pdf", pdf_bytes))
        labels.append(f"{label} ({cert_doc['certificate_number']})")

    if not attachments:
        logger.warning("Certificate regeneration: no documents found to email for student %s", student_id)
        return

    subject = "Your TFD Internship Certificate & Letter — Re-sent"
    body_html = document_email_html(student["name"], labels, include_arn=False)
    ok, message = send_email_with_pdfs(student["email"], subject, body_html, attachments)
    if not ok:
        logger.error("Certificate regeneration email failed for student %s: %s", student_id, message)


@router.get("/admin/certificate-regenerations")
async def admin_list_regenerations(_admin: dict = Depends(require_admin)):
    docs = []
    async for doc in payment_orders_collection.find({"payment_type": "certificate_regeneration"}).sort("created_at", -1):
        doc.pop("_id", None)
        docs.append(doc)
    return docs


# ── Per-student spreadsheet task randomization ───────────────────────────
# Finance-track tasks whose title appears in _SPREADSHEET_VARIANT_GENERATORS
# get their spreadsheet_template/spreadsheet_answer_key regenerated with
# randomized numbers for every student, instead of the one shared template
# every student assigned that pool task would otherwise see identically.
# No DB writes/schema change needed: each generator is a pure function of a
# random.Random seeded from (student_id, task_id), so calling it again at
# grading time reproduces the exact same numbers the student was shown —
# same trick already used for weekly task selection (_assign_week_tasks).

def _jitter(rng: random.Random, base: int, pct: float = 0.25, step: int = 1000) -> int:
    """Randomize `base` by up to +/-pct, rounded to the nearest `step` so
    the numbers still look like realistic round figures on the sheet."""
    lo, hi = base * (1 - pct), base * (1 + pct)
    return int(round(rng.uniform(lo, hi) / step)) * step


def _generate_balance_sheet_variant(rng: random.Random) -> tuple[dict, dict]:
    """Trial Balance -> Balance Sheet, randomized. Owner's Capital is
    SOLVED FOR rather than randomized independently, so Total Assets always
    equals Total Liabilities + Equity for whatever the rest of the draw
    produces — the books balance by construction, not by luck."""
    cash = _jitter(rng, 85000)
    ar = _jitter(rng, 45000)
    inventory = _jitter(rng, 120000)
    furniture = _jitter(rng, 60000, pct=0.15)
    ap = _jitter(rng, 38000)
    bank_loan = _jitter(rng, 100000)
    sales = _jitter(rng, 340000)
    cogs = _jitter(rng, 210000, pct=0.2)
    rent = _jitter(rng, 36000, pct=0.1, step=500)
    salaries = _jitter(rng, 60000, pct=0.15, step=500)
    drawings = _jitter(rng, 12000, pct=0.3, step=500)

    net_profit = sales - cogs - rent - salaries
    total_assets = cash + ar + inventory + furniture
    total_liabilities = ap + bank_loan
    closing_capital = total_assets - total_liabilities  # forces balance
    capital = closing_capital - net_profit + drawings

    rows = [
        ("Cash", cash, None), ("Accounts Receivable", ar, None), ("Inventory", inventory, None),
        ("Furniture & Fixtures", furniture, None), ("Accounts Payable", None, ap), ("Bank Loan", None, bank_loan),
        ("Owner's Capital", None, capital), ("Sales Revenue", None, sales), ("Cost of Goods Sold", cogs, None),
        ("Rent Expense", rent, None), ("Salaries Expense", salaries, None), ("Owner's Drawings", drawings, None),
    ]
    prefilled = {"A1": "Item", "B1": "Debit", "C1": "Credit"}
    locked = ["A1", "B1", "C1"]
    for i, (label, debit, credit) in enumerate(rows):
        r = i + 2
        prefilled[f"A{r}"] = label
        locked.append(f"A{r}")
        if debit is not None:
            prefilled[f"B{r}"] = debit
            locked.append(f"B{r}")
        if credit is not None:
            prefilled[f"C{r}"] = credit
            locked.append(f"C{r}")
    prefilled.update({
        "A15": "Net Profit (Revenue - COGS - Rent - Salaries)",
        "A17": "BALANCE SHEET", "A18": "Total Assets (Cash+AR+Inventory+Furniture)",
        "A19": "Total Liabilities (AP+Bank Loan)", "A20": "Closing Capital (Capital+Net Profit-Drawings)",
        "A21": "Total Liabilities + Equity",
    })
    locked += ["A15", "A17", "A18", "A19", "A20", "A21"]

    template = {"rows": 22, "cols": 3, "headers": ["Item", "Debit", "Credit"], "prefilled": prefilled, "locked_cells": locked}
    answer_key = {
        "cells": {
            "B15": {"expected": net_profit, "tolerance": 1, "mistake_note": "Net Profit should be Revenue minus COGS, Rent, and Salaries."},
            "B18": {"expected": total_assets, "tolerance": 1, "mistake_note": "Total Assets should add up Cash, Accounts Receivable, Inventory, and Furniture."},
            "B19": {"expected": total_liabilities, "tolerance": 1, "mistake_note": "Total Liabilities should add up Accounts Payable and Bank Loan."},
            "B20": {"expected": closing_capital, "tolerance": 1, "mistake_note": "Closing Capital should be Capital plus Net Profit minus Drawings."},
            "B21": {"expected": total_assets, "tolerance": 1, "mistake_note": "Total Liabilities + Equity should equal Total Assets for the books to balance."},
        },
        "checks": [{"left": "B18", "right": "B21", "tolerance": 1, "label": "Total Assets should equal Total Liabilities + Equity"}],
    }
    return template, answer_key


def _generate_pl_statement_variant(rng: random.Random) -> tuple[dict, dict]:
    """Monthly P&L — a straight sum-of-lines report, no cross-balancing
    identity needed (unlike the balance sheet): every line is jittered
    independently and the totals are pure arithmetic of those lines."""
    product_sales = _jitter(rng, 280000, pct=0.2)
    service_income = _jitter(rng, 45000, pct=0.25, step=500)
    cogs = _jitter(rng, 165000, pct=0.15)
    rent = _jitter(rng, 30000, pct=0.15, step=500)
    salaries = _jitter(rng, 55000, pct=0.15, step=500)
    utilities = _jitter(rng, 8000, pct=0.2, step=250)
    marketing = _jitter(rng, 12000, pct=0.25, step=500)
    misc_admin = _jitter(rng, 5000, pct=0.3, step=250)

    total_revenue = product_sales + service_income
    total_expenses = cogs + rent + salaries + utilities + marketing + misc_admin
    net_profit = total_revenue - total_expenses
    net_margin = round(net_profit / total_revenue * 100, 2)

    prefilled = {
        "A1": "Item", "B1": "Amount",
        "A2": "Product Sales", "B2": product_sales, "A3": "Service Income", "B3": service_income,
        "A4": "Total Revenue",
        "A6": "Cost of Goods Sold", "B6": cogs, "A7": "Rent", "B7": rent, "A8": "Salaries", "B8": salaries,
        "A9": "Utilities", "B9": utilities, "A10": "Marketing", "B10": marketing, "A11": "Misc Admin", "B11": misc_admin,
        "A12": "Total Expenses",
        "A14": "Net Profit / Loss", "A15": "Net Profit Margin %",
    }
    locked = ["A1", "B1", "A2", "B2", "A3", "B3", "A4", "A6", "B6", "A7", "B7", "A8", "B8",
              "A9", "B9", "A10", "B10", "A11", "B11", "A12", "A14", "A15"]
    template = {"rows": 16, "cols": 2, "headers": ["Item", "Amount"], "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {
        "B4": {"expected": total_revenue, "tolerance": 1}, "B12": {"expected": total_expenses, "tolerance": 1},
        "B14": {"expected": net_profit, "tolerance": 1}, "B15": {"expected": net_margin, "tolerance": 0.5},
    }}
    return template, answer_key


def _generate_gst_invoice_variant(rng: random.Random) -> tuple[dict, dict]:
    """Invoice & GST — Type (inclusive/exclusive) stays fixed per client so
    the IF-formula lesson the task teaches doesn't change, only the amounts
    do. Only F7 (Total GST Collected) is actually graded."""
    clients = [
        ("Client A", "Consulting Services", 1, 50000), ("Client B", "Software License", 0, 118000),
        ("Client C", "Design Services", 1, 25000), ("Client D", "Maintenance Contract", 0, 35400),
        ("Client E", "Training Workshop", 1, 80000),
    ]
    prefilled = {"A1": "Client", "B1": "Description", "C1": "Type (1=Excl,0=Incl)", "D1": "Given Amount",
                 "E1": "Base Amount", "F1": "GST (18%)", "G1": "Total Amount"}
    locked = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"]
    total_gst = 0.0
    for i, (client, desc, typ, base_amount) in enumerate(clients):
        r = i + 2
        amount = _jitter(rng, base_amount, pct=0.3, step=500)
        prefilled.update({f"A{r}": client, f"B{r}": desc, f"C{r}": typ, f"D{r}": amount})
        locked += [f"A{r}", f"B{r}", f"C{r}", f"D{r}"]
        gst = amount * 0.18 if typ == 1 else amount - amount / 1.18
        total_gst += gst
    prefilled["A7"] = "Total GST Collected"
    locked.append("A7")
    total_gst = round(total_gst, 2)

    template = {"rows": 8, "cols": 7,
                "headers": ["Client", "Description", "Type (1=Excl,0=Incl)", "Given Amount", "Base Amount", "GST (18%)", "Total Amount"],
                "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {"F7": {
        "expected": total_gst, "tolerance": 10,
        "mistake_note": "Your total GST doesn't check out — a common real mistake here is applying the wrong rate direction "
                         "(e.g. treating an inclusive amount as exclusive, or using 5% instead of 18%). In a real company, "
                         "this exact mistake means the wrong GST gets filed — leading to a tax audit flag and a real penalty.",
    }}}
    return template, answer_key


def _generate_bank_reconciliation_variant(rng: random.Random) -> tuple[dict, dict]:
    """Bank Reconciliation — each adjustment's sign (add-back vs subtract)
    is a fixed real-world fact about what that item IS, not something that
    varies per instance, so only magnitudes randomize. The Bank Statement
    Balance is SOLVED FOR from the adjusted cash book balance, so the
    reconciliation always ties out to a difference of exactly 0."""
    cash_book_balance = _jitter(rng, 124500, pct=0.15, step=500)
    uncleared_cheque = _jitter(rng, 8000, pct=0.3, step=100)
    bank_charges = _jitter(rng, 450, pct=0.4, step=50)
    duplicate_error = _jitter(rng, 1200, pct=0.3, step=100)
    deposit_in_transit = _jitter(rng, 2050, pct=0.3, step=50)

    net_adjustment = uncleared_cheque - bank_charges + duplicate_error - deposit_in_transit
    adjusted_balance = cash_book_balance + net_adjustment

    prefilled = {
        "A1": "Item", "B1": "Amount", "C1": "Sign (+1 Add / -1 Subtract)",
        "A2": "Cash Book Closing Balance (starting point)", "B2": cash_book_balance,
        "A3": "Uncleared cheque (issued, not yet presented to bank)", "B3": uncleared_cheque,
        "A4": "Bank charges not yet recorded in cash book", "B4": bank_charges,
        "A5": "Duplicate payment entry error in cash book", "B5": duplicate_error,
        "A6": "Deposit in transit (cheque deposited, not yet credited)", "B6": deposit_in_transit,
        "A8": "Adjusted Cash Book Balance", "A9": "Bank Statement Balance (given)", "B9": adjusted_balance,
        "A10": "Difference (should be 0 if correctly reconciled)",
    }
    locked = ["A1", "B1", "C1", "A2", "B2", "A3", "B3", "A4", "B4", "A5", "B5", "A6", "B6", "A8", "A9", "B9", "A10"]
    template = {"rows": 11, "cols": 3, "headers": ["Item", "Amount", "Sign (+1 Add / -1 Subtract)"], "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {"B8": {"expected": adjusted_balance, "tolerance": 1}, "B10": {"expected": 0, "tolerance": 1}}}
    return template, answer_key


_EXPENSE_ROWS_BASE = [
    ("05-Mar", "Ola Cabs - Client Meeting", 850), ("05-Mar", "Ola Cabs - Client Meeting", 850),
    ("06-Mar", "IndiGo Flight - Mumbai Trip", 6200), ("08-Mar", "Uber - Airport Transfer", 650),
    ("12-Mar", "Hotel Stay - Mumbai (2 nights)", 4800),
    ("02-Mar", "Stationery World - Printer Paper & Pens", 1200), ("07-Mar", "Amazon Business - Toner Cartridges", 3400),
    ("14-Mar", "Local Vendor - Whiteboard Markers", 350), ("18-Mar", "Office Depot - Filing Cabinets", 5600),
    ("22-Mar", "Amazon Business - Desk Organizers", 800),
    ("04-Mar", "Client Lunch - Taj Restaurant", 3200), ("09-Mar", "Team Lunch - Office Order", 1800),
    ("15-Mar", "Client Dinner - Business Meeting", 4500), ("19-Mar", "Coffee with Vendor", 450),
    ("25-Mar", "Team Celebration Lunch", 2200),
    ("01-Mar", "Electricity Bill - March", 12000), ("01-Mar", "Internet & Broadband - March", 2500),
    ("01-Mar", "Water Bill - March", 800), ("15-Mar", "Mobile/Phone Bill - Office Lines", 3200),
    ("28-Mar", "Generator Fuel/Diesel", 1500),
    ("03-Mar", "Facebook Ads - March Campaign", 8000), ("10-Mar", "Local Newspaper Ad", 4500),
    ("16-Mar", "Printing - Flyers & Banners", 2800), ("20-Mar", "Instagram Influencer Collab", 6000),
    ("27-Mar", "Google Ads - March Campaign", 7500),
    ("05-Mar", "Courier Charges", 400), ("11-Mar", "Bank Processing Fees", 250),
    ("17-Mar", "Cash Advance - Field Staff (no receipt attached)", 10000), ("23-Mar", "Office Cleaning Service", 1500),
    ("29-Mar", "Miscellaneous Repairs", 900),
]
# Category boundaries (5 rows each: Travel, Office Supplies, Meals &
# Entertainment, Utilities, Marketing, Misc/Admin) and which row-within-
# category is the intentional duplicate/suspicious entry to exclude —
# these positions are fixed facts about the exercise, not randomized.
_EXPENSE_CATEGORY_EXCLUSIONS = [{1}, set(), set(), set(), set(), {2}]


def _generate_expense_audit_variant(rng: random.Random) -> tuple[dict, dict]:
    """Expense Audit — amounts randomize, but the intentional duplicate
    pair (rows 1-2, same vendor/date) stays equal to itself, and the
    suspicious round-number entry (Cash Advance, no receipt) stays a round
    figure, so the exercise's actual lesson survives randomization."""
    amounts = [amt for _, _, amt in _EXPENSE_ROWS_BASE]
    dup_amount = _jitter(rng, amounts[0], pct=0.3, step=50)
    new_amounts = list(amounts)
    new_amounts[0] = dup_amount
    new_amounts[1] = dup_amount
    for i in range(2, len(amounts)):
        new_amounts[i] = _jitter(rng, amounts[i], pct=0.3, step=1000 if i == 27 else 50)

    prefilled = {"A1": "Date", "B1": "Vendor / Description", "C1": "Amount", "D1": "Category Code (1-6)",
                 "E1": "Flag (1=duplicate/suspicious)", "F1": "Adjusted Amount"}
    locked = ["A1", "B1", "C1", "D1", "E1", "F1"]
    for i, (date, desc, _) in enumerate(_EXPENSE_ROWS_BASE):
        r = i + 2
        prefilled.update({f"A{r}": date, f"B{r}": desc, f"C{r}": new_amounts[i]})
        locked += [f"A{r}", f"B{r}", f"C{r}"]
    prefilled.update({
        "A33": "CATEGORY TOTALS (using Adjusted Amount, excluding flagged entries)",
        "A34": "Travel Total", "A35": "Office Supplies Total", "A36": "Meals & Entertainment Total",
        "A37": "Utilities Total", "A38": "Marketing Total", "A39": "Misc/Admin Total", "A40": "Grand Total (Adjusted)",
    })
    locked += ["A33", "A34", "A35", "A36", "A37", "A38", "A39", "A40"]

    categories = [new_amounts[0:5], new_amounts[5:10], new_amounts[10:15], new_amounts[15:20], new_amounts[20:25], new_amounts[25:30]]
    category_totals = [
        sum(a for idx, a in enumerate(cat) if idx not in excl)
        for cat, excl in zip(categories, _EXPENSE_CATEGORY_EXCLUSIONS)
    ]
    grand_total = sum(category_totals)

    template = {"rows": 41, "cols": 6,
                "headers": ["Date", "Vendor / Description", "Amount", "Category Code (1-6)", "Flag (1=duplicate/suspicious)", "Adjusted Amount"],
                "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {
        f"B{34 + i}": {"expected": total, "tolerance": 1} for i, total in enumerate(category_totals + [grand_total])
    }}
    return template, answer_key


def _generate_budget_variance_variant(rng: random.Random) -> tuple[dict, dict]:
    """Budget Variance — Budgeted and Actual are independent real-world
    inputs (a department can over- or under-spend for any reason), so no
    plug variable is needed; the variance/% and totals are pure arithmetic
    of whatever the two independent draws land on."""
    depts = [("Marketing", 300000, 365000), ("Sales", 450000, 470000), ("Operations", 600000, 615000),
             ("HR", 150000, 142000), ("IT", 200000, 258000), ("Admin", 100000, 96000)]
    prefilled = {"A1": "Department", "B1": "Budgeted", "C1": "Actual", "D1": "Variance (Actual-Budgeted)", "E1": "Variance %"}
    locked = ["A1", "B1", "C1", "D1", "E1"]
    cells = {}
    total_budgeted = total_actual = 0
    for i, (name, base_bud, base_act) in enumerate(depts):
        r = i + 2
        budgeted = _jitter(rng, base_bud, pct=0.15, step=5000)
        actual = _jitter(rng, base_act, pct=0.15, step=5000)
        prefilled.update({f"A{r}": name, f"B{r}": budgeted, f"C{r}": actual})
        locked += [f"A{r}", f"B{r}", f"C{r}"]
        variance = actual - budgeted
        cells[f"D{r}"] = {"expected": variance, "tolerance": 1}
        cells[f"E{r}"] = {"expected": round(variance / budgeted * 100, 2), "tolerance": 0.5}
        total_budgeted += budgeted
        total_actual += actual
    prefilled.update({"A9": "Total Budgeted", "A10": "Total Actual", "A11": "Total Variance"})
    locked += ["A9", "A10", "A11"]
    cells.update({
        "B9": {"expected": total_budgeted, "tolerance": 1}, "B10": {"expected": total_actual, "tolerance": 1},
        "B11": {"expected": total_actual - total_budgeted, "tolerance": 1},
    })

    template = {"rows": 12, "cols": 5,
                "headers": ["Department", "Budgeted", "Actual", "Variance (Actual-Budgeted)", "Variance %"],
                "prefilled": prefilled, "locked_cells": locked}
    return template, {"cells": cells}


def _generate_ratio_analysis_variant(rng: random.Random) -> tuple[dict, dict]:
    """Ratio Analysis — Shareholders' Equity is SOLVED FOR (Total Assets
    minus Total Liabilities) so the underlying balance sheet always
    balances, same principle as the Trial Balance task. Net Profit is
    drawn as a random 6-12% margin of Revenue rather than fully
    independently, so the profitability ratios always land somewhere
    realistic instead of occasionally going negative or absurd."""
    cash = _jitter(rng, 180000, pct=0.2, step=5000)
    ar = _jitter(rng, 220000, pct=0.2, step=5000)
    inventory = _jitter(rng, 300000, pct=0.2, step=5000)
    fixed_assets = _jitter(rng, 950000, pct=0.15, step=10000)
    ap = _jitter(rng, 250000, pct=0.2, step=5000)
    short_term_loan = _jitter(rng, 150000, pct=0.2, step=5000)
    long_term_debt = _jitter(rng, 500000, pct=0.15, step=10000)

    total_assets = cash + ar + inventory + fixed_assets
    total_liabilities = ap + short_term_loan + long_term_debt
    equity = total_assets - total_liabilities

    revenue = _jitter(rng, 2400000, pct=0.2, step=10000)
    margin_pct = rng.uniform(6, 12)
    net_profit = int(round(revenue * margin_pct / 100 / 1000)) * 1000

    current_ratio = round((cash + ar + inventory) / (ap + short_term_loan), 2)
    quick_ratio = round((cash + ar) / (ap + short_term_loan), 2)
    net_margin = round(net_profit / revenue * 100, 2)
    roi = round(net_profit / equity * 100, 2)

    prefilled = {
        "A1": "Item", "B1": "Amount",
        "A2": "Cash", "B2": cash, "A3": "Accounts Receivable", "B3": ar, "A4": "Inventory", "B4": inventory,
        "A5": "Fixed Assets", "B5": fixed_assets, "A6": "Accounts Payable", "B6": ap, "A7": "Short-term Loan", "B7": short_term_loan,
        "A8": "Long-term Debt", "B8": long_term_debt, "A9": "Shareholders' Equity", "B9": equity,
        "A10": "Revenue", "B10": revenue, "A11": "Net Profit", "B11": net_profit,
        "A13": "RATIO CALCULATIONS",
        "A14": "Current Ratio (Current Assets ÷ Current Liabilities)",
        "A15": "Quick Ratio ((Current Assets - Inventory) ÷ Current Liabilities)",
        "A16": "Net Profit Margin %", "A17": "ROI % (Net Profit ÷ Equity)",
    }
    locked = ["A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4", "A5", "B5", "A6", "B6", "A7", "B7", "A8", "B8", "A9", "B9",
              "A10", "B10", "A11", "B11", "A13", "A14", "A15", "A16", "A17"]
    template = {"rows": 18, "cols": 2, "headers": ["Item", "Amount"], "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {
        "B14": {"expected": current_ratio, "tolerance": 0.05}, "B15": {"expected": quick_ratio, "tolerance": 0.05},
        "B16": {"expected": net_margin, "tolerance": 0.2}, "B17": {"expected": roi, "tolerance": 0.5},
    }}
    return template, answer_key


_DASH_CATEGORIES = ["Office Rent", "Vendor Payment", "Software Subscription", "Utility Bill", "Staff Reimbursement", "Marketing Spend", "Courier Charges", "Maintenance"]


def _generate_dashboard_variant(rng: random.Random) -> tuple[dict, dict]:
    """Monthly Financial Dashboard — 110 transactions redrawn per student
    (same income/expense position pattern and description style as the
    original, different amounts), with the summary totals computed
    directly from that same draw so they can never drift out of sync."""
    prefilled = {"A1": "Date", "B1": "Description", "C1": "Type (1=Income,0=Expense)", "D1": "Amount",
                 "E1": "Income (if Type=1)", "F1": "Expense (if Type=0)"}
    locked = ["A1", "B1", "C1", "D1", "E1", "F1"]
    total_income = 0
    total_expenses = 0
    for i in range(1, 111):
        r = i + 1
        is_income = (i % 3 == 0)
        day = (i % 28) + 1
        date = f"{day:02d}-Apr"
        if is_income:
            amount = rng.randint(15000, 35000)
            desc = f"Client Payment - Invoice #{1000 + i}"
            total_income += amount
        else:
            amount = rng.randint(500, 8500)
            desc = f"{_DASH_CATEGORIES[i % 8]} - Ref{i:03d}"
            total_expenses += amount
        prefilled.update({f"A{r}": date, f"B{r}": desc, f"C{r}": 1 if is_income else 0, f"D{r}": amount})
        locked += [f"A{r}", f"B{r}", f"C{r}", f"D{r}"]
    prefilled.update({
        "A113": "MONTHLY DASHBOARD", "A114": "Total Income", "A115": "Total Expenses",
        "A116": "Net Cash Flow", "A117": "Average Transaction Size",
    })
    locked += ["A113", "A114", "A115", "A116", "A117"]

    net_cash_flow = total_income - total_expenses
    avg_transaction = round((total_income + total_expenses) / 110, 2)

    template = {"rows": 118, "cols": 6,
                "headers": ["Date", "Description", "Type (1=Income,0=Expense)", "Amount", "Income (if Type=1)", "Expense (if Type=0)"],
                "prefilled": prefilled, "locked_cells": locked}
    answer_key = {"cells": {
        "B114": {"expected": total_income, "tolerance": 5}, "B115": {"expected": total_expenses, "tolerance": 5},
        "B116": {"expected": net_cash_flow, "tolerance": 5}, "B117": {"expected": avg_transaction, "tolerance": 5},
    }}
    return template, answer_key


# Keyed by task title (stable/readable) rather than the opaque pool `id`.
_SPREADSHEET_VARIANT_GENERATORS = {
    "Trial Balance to Balance Sheet": _generate_balance_sheet_variant,
    "Monthly P&L Statement": _generate_pl_statement_variant,
    "Invoice & GST Calculation": _generate_gst_invoice_variant,
    "Bank Reconciliation Statement": _generate_bank_reconciliation_variant,
    "Expense Audit": _generate_expense_audit_variant,
    "Budget Variance Analysis": _generate_budget_variance_variant,
    "Ratio Analysis Report": _generate_ratio_analysis_variant,
    "Build a Monthly Financial Dashboard": _generate_dashboard_variant,
}


def _randomize_task_for_student(task: dict, student_id: str) -> dict:
    """Returns `task` unchanged unless it has a registered variant
    generator, in which case a new dict is returned with
    spreadsheet_template/spreadsheet_answer_key swapped for a per-student
    randomized variant. Deterministically seeded by (student_id, task_id):
    the same student always sees the same numbers for that task across
    requests, but two students assigned the same pool task see different
    ones — and re-deriving the same seed at grading time reproduces the
    exact answer key the student's template was built from."""
    generator = _SPREADSHEET_VARIANT_GENERATORS.get(task.get("title"))
    if not generator:
        return task
    rng = random.Random(f"{student_id}:{task['id']}")
    template, answer_key = generator(rng)
    return {**task, "spreadsheet_template": template, "spreadsheet_answer_key": answer_key}


# ── Weekly task engine & submissions ──────────────────────────────────

async def _to_task_pool_out(doc: dict) -> TaskPoolOut:
    is_blindfold = doc.get("is_blindfold", False)
    return TaskPoolOut(
        id=doc["id"], track=doc["track"], track_label=TRACK_LABELS.get(doc["track"], doc["track"]),
        title=doc["title"], brief=doc["brief"], instructions=doc.get("instructions"),
        why_it_matters=doc.get("why_it_matters"),
        deliverable_type=doc["deliverable_type"], requires_geotag=doc.get("requires_geotag", True),
        points_value=doc.get("points_value", 50), difficulty=doc.get("difficulty", "medium"),
        estimated_duration=doc.get("estimated_duration"),
        is_active=doc.get("is_active", True), created_at=doc["created_at"],
        phase=doc.get("phase"), is_blindfold=is_blindfold, spreadsheet_template=doc.get("spreadsheet_template"),
        # Blindfold Mode: no hints, no sample solution — genuinely stripped
        # server-side (not just hidden in the UI), so it can't be read via
        # devtools/API either. See LanguageToggle's `disabled` prop for the
        # matching English-locked restriction.
        hints=None if is_blindfold else doc.get("hints"),
        sample_solution=None if is_blindfold else doc.get("sample_solution"),
    )


async def _to_task_pool_admin_out(doc: dict) -> TaskPoolAdminOut:
    base = await _to_task_pool_out(doc)
    return TaskPoolAdminOut(**base.dict(), spreadsheet_answer_key=doc.get("spreadsheet_answer_key"))


async def _assign_week_tasks(student: dict, week_number: int) -> list[dict]:
    """Lazily samples TASKS_PER_WEEK distinct tasks for this student/week the
    first time they're requested, then always returns the same set from
    then on — fully automatic, no admin action needed. Seeded by
    (student_id, week) so a given student always gets the same sequence if
    this ever re-runs, and different students get different (though not
    globally-collision-free — see product notes) sequences from each other.

    Guarantees at least one field-work task (photo/text_and_photo,
    requires_geotag) per week when the track's pool has one available, so
    "real fieldwork" isn't left to chance — the rest of the week's slots
    are filled from the remaining pool."""
    assigned = student.get("assigned_tasks") or {}
    key = str(week_number)
    task_ids = assigned.get(key)
    if task_ids:
        docs = []
        for tid in task_ids:
            doc = await internship_task_pool_collection.find_one({"id": tid})
            if doc:
                docs.append(doc)
        if docs:
            return docs

    pool = [doc async for doc in internship_task_pool_collection.find({"track": student["track"], "is_active": True})]
    if not pool:
        return []
    rng = random.Random(f"{student['id']}:{week_number}")

    # Curated, phase-tagged pools (see backend/internship_models.py's
    # TaskPhase) restrict each week to phase-appropriate tasks — guided
    # work only in weeks 1-5, independent in 6-9, capstone in 10-11,
    # blindfold in 12-13. Tracks not yet reworked onto a curated pool (no
    # task has a `phase` at all) fall straight through to the original
    # whole-pool behavior, unchanged.
    phase_tagged = any(t.get("phase") is not None for t in pool)
    if phase_tagged:
        phase, is_blindfold_week = _phase_for_week(week_number)
        phase_pool = [t for t in pool if t.get("phase") == phase and bool(t.get("is_blindfold", False)) == is_blindfold_week]
        working_pool = phase_pool or pool  # safety net; shouldn't normally trigger
    else:
        working_pool = pool

    # Deliberately capped at the phase pool's own size, never topped up
    # from another phase — a curated phase may have as few as 2-3 distinct
    # tasks spread across several weeks, and the same set is meant to
    # repeat identically within a phase rather than leak later-phase
    # (harder) work into an earlier week. See plan notes / PRD.
    target_count = min(TASKS_PER_WEEK, len(working_pool))

    field_tasks = [t for t in working_pool if t.get("requires_geotag")]
    sample = []
    if field_tasks:
        sample.append(rng.choice(field_tasks))
    remaining_pool = [t for t in working_pool if t["id"] not in {s["id"] for s in sample}]
    rng.shuffle(remaining_pool)
    sample.extend(remaining_pool[: max(0, target_count - len(sample))])

    task_ids = [t["id"] for t in sample]
    await internship_students_collection.update_one(
        {"id": student["id"]},
        {"$set": {f"assigned_tasks.{key}": task_ids, "updated_at": datetime.now(timezone.utc)}},
    )
    return sample


async def _week_quiz_passed(student_id: str, week_number: int) -> bool:
    attempt = await internship_quiz_attempts_collection.find_one(
        {"student_id": student_id, "week_number": week_number, "passed": True}
    )
    return attempt is not None


async def _effective_unlocked_week(student: dict, current_week_by_days: int) -> tuple[int, bool]:
    """(effective_week, is_locked). Drip-lock: week N+1's tasks stay locked
    until week N's quiz is passed, even if enough days have elapsed —
    'current_week_by_days' is just the day-count ceiling, not a guarantee of
    access. Returns the earliest week whose quiz hasn't been passed yet
    (capped at current_week_by_days) as the week the student should actually
    be working on.

    The demo account bypasses this entirely — it's meant to be jumped
    forward via /demo/advance to show off any week's content on demand,
    without needing to actually clear every quiz along the way."""
    if student.get("is_demo"):
        return current_week_by_days, False
    for w in range(1, current_week_by_days):
        if not await _week_quiz_passed(student["id"], w):
            return w, True
    return current_week_by_days, False


@router.get("/tasks/current")
async def get_current_tasks(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not student.get("track"):
        raise HTTPException(status_code=400, detail="Please select a track first")
    current_day, current_week_by_days = _compute_progress(student)
    if current_week_by_days == 0:
        return {"current_week": 0, "tasks": [], "message": "Your program hasn't started yet — waiting on payment confirmation."}

    effective_week, is_locked = await _effective_unlocked_week(student, current_week_by_days)

    tasks = await _assign_week_tasks(student, effective_week)
    tasks = [_randomize_task_for_student(t, student["id"]) for t in tasks]
    task_outs = [await _to_task_pool_out(t) for t in tasks]

    # Merge in this student's own submission status per task, so the UI can
    # show "submitted / pending review" vs "not started" vs "rejected — resubmit".
    submissions = {
        s["task_id"]: s
        async for s in internship_submissions_collection.find({"student_id": student["id"], "week_number": effective_week})
    }
    tasks_with_status = []
    for t in task_outs:
        sub = submissions.get(t.id)
        tasks_with_status.append({
            **t.dict(),
            "submission_status": sub["status"] if sub else None,
            "submission_id": sub["id"] if sub else None,
            "submission_note": sub.get("admin_note") if sub else None,
            "draft_text": sub.get("text_answer") if sub and sub.get("status") == "draft" else None,
            "draft_spreadsheet_data": sub.get("spreadsheet_data") if sub and sub.get("status") == "draft" else None,
        })

    quiz_passed_this_week = await _week_quiz_passed(student["id"], effective_week)
    message = None
    if is_locked:
        message = f"You're on Day {current_day}, but Week {effective_week}'s quiz isn't passed yet — pass it to unlock further weeks."

    return {
        "current_day": current_day, "current_week": effective_week, "day_based_week": current_week_by_days,
        "is_locked_on_quiz": is_locked, "quiz_passed_this_week": quiz_passed_this_week,
        "tasks": tasks_with_status, "message": message,
    }


@router.get("/tasks/all")
async def get_all_assigned_tasks(payload: dict = Depends(get_current_student_payload)):
    """Every task assigned so far, grouped by week — not just the current
    week. A task missed in an earlier week is never locked away forever;
    it stays here, completable any time, until the whole program wraps up
    (certificate eligibility is a percentage of total points, not a
    require-every-single-task rule — see graduation logic)."""
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not student.get("track"):
        raise HTTPException(status_code=400, detail="Please select a track first")
    current_day, current_week_by_days = _compute_progress(student)
    if current_week_by_days == 0:
        return {"weeks": [], "current_week": 0, "current_day": 0, "message": "Your program hasn't started yet — waiting on payment confirmation."}

    effective_week, is_locked = await _effective_unlocked_week(student, current_week_by_days)
    quiz_passed_this_week = await _week_quiz_passed(student["id"], effective_week)
    message = None
    if is_locked:
        message = f"You're on Day {current_day}, but Week {effective_week}'s quiz isn't passed yet — pass it to unlock further weeks."

    submissions = {
        s["task_id"]: s
        async for s in internship_submissions_collection.find({"student_id": student["id"]})
    }

    weeks_out = []
    for week_num in range(1, effective_week + 1):
        tasks = await _assign_week_tasks(student, week_num)
        tasks = [_randomize_task_for_student(t, student["id"]) for t in tasks]
        tasks_with_status = []
        for t in tasks:
            t_out = await _to_task_pool_out(t)
            sub = submissions.get(t_out.id)
            tasks_with_status.append({
                **t_out.dict(),
                "submission_status": sub["status"] if sub else None,
                "submission_id": sub["id"] if sub else None,
                "submission_note": sub.get("admin_note") if sub else None,
                "draft_text": sub.get("text_answer") if sub and sub.get("status") == "draft" else None,
                "draft_spreadsheet_data": sub.get("spreadsheet_data") if sub and sub.get("status") == "draft" else None,
            })
        approved = sum(1 for t in tasks_with_status if t["submission_status"] == "approved")
        weeks_out.append({
            "week_number": week_num, "tasks": tasks_with_status,
            "approved_count": approved, "total_count": len(tasks_with_status),
        })

    return {
        "weeks": weeks_out, "current_week": effective_week, "current_day": current_day,
        "is_locked_on_quiz": is_locked, "quiz_passed_this_week": quiz_passed_this_week, "message": message,
    }


# ── Manager's Feed — a small, track-specific rotating message board ──────
# Deliberately a hardcoded pool, not an admin-editable/DB-driven system —
# per product notes, a fixed pool that reliably rotates beats a "smart"
# system that can silently go empty. One new message per calendar day,
# picked deterministically (day-of-year mod pool size) so it's consistent
# across requests/instances without needing a scheduler.
_MANAGER_PERSONAS = {
    "finance": {"name": "Priya Nair", "role": "Finance Manager"},
    "marketing": {"name": "Karan Mehta", "role": "Marketing Head"},
    "sales": {"name": "Ritu Desai", "role": "Sales Manager"},
    "hr": {"name": "Arjun Rao", "role": "HR Manager"},
}
_MANAGER_MESSAGES = {
    "finance": [
        "Numbers don't lie, but they don't explain themselves either — that's your job. Always attach the 'why' to every figure you report.",
        "A trial balance that balances isn't proof it's correct — just that debits equal credits. Sanity-check the story the numbers are telling.",
        "In real audits, the first question is always 'show me the source document.' Get in the habit of it now.",
        "GST rates change, and it's on you to know the current one before you invoice — mistakes here cost real penalties.",
        "Reconciliation isn't busywork — it's how fraud and simple typos both get caught before they become expensive.",
        "A good financial dashboard tells a story in ten seconds. If someone has to ask 'so what does this mean', simplify it.",
        "Every rupee has to be somewhere — cash, receivable, expense, or owner's equity. If your books don't balance, one of those is wrong.",
        "Budgets are promises to your own team. A variance isn't a failure — it's information. Explain it, don't hide it.",
    ],
    "marketing": [
        "A campaign without a clear target audience is just noise with a budget attached.",
        "Data tells you what happened. Your job is figuring out why — and what to do next.",
        "The best copy doesn't sell the product — it sells the outcome the customer actually wants.",
        "Before you write a single word of a campaign, know exactly who you're NOT talking to.",
        "A/B testing isn't about being right — it's about being wrong faster and cheaper than your competitors.",
        "Brand consistency matters more than any single clever post — people trust what feels familiar.",
        "Your competitor's biggest weakness is usually visible in their own reviews. Go read them.",
        "Good marketing respects the customer's time. If it doesn't add value, it's just interruption.",
    ],
    "sales": [
        "Nobody buys a product — they buy a solution to a problem they already have. Find the problem first.",
        "The best salespeople talk less and listen more. Silence after a question is a tool, not a mistake.",
        "Objections aren't rejections — they're requests for more information. Answer the real concern underneath.",
        "A follow-up that comes a day late is often a deal that goes cold. Speed matters more than people admit.",
        "Know your numbers — conversion rate, average deal size, follow-up count. Feelings don't close deals; patterns do.",
        "The close isn't a single moment — it's the natural next step after you've actually solved the problem.",
        "Every 'no' today is data for the pitch you'll give tomorrow. Track why, not just that.",
        "Trust is built before the pitch even starts — in how you show up, how prepared you are, how well you listen.",
    ],
    "hr": [
        "Every policy you write will eventually be tested by exactly the edge case you didn't think of. Write for clarity, not just coverage.",
        "Onboarding sets the tone for someone's entire tenure — the first week matters more than people realize.",
        "A fair process, applied consistently, protects everyone — including the company.",
        "Exit interviews are one of the few honest feedback loops a company gets. Don't waste them.",
        "Documentation isn't bureaucracy — it's what protects both the employee and the company when memory gets fuzzy.",
        "Confidentiality isn't optional in HR — it's the entire foundation of the trust the role depends on.",
        "A good job description filters better than any interview question — be precise about what the role actually needs.",
        "People don't leave companies, they leave managers — and HR is often the first to see the warning signs.",
    ],
}


@router.get("/manager-feed")
async def get_manager_feed(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]}, {"track": 1})
    if not student or not student.get("track"):
        raise HTTPException(status_code=404, detail="Select a track first")
    track = student["track"]
    persona = _MANAGER_PERSONAS.get(track, _MANAGER_PERSONAS["finance"])
    pool = _MANAGER_MESSAGES.get(track, _MANAGER_MESSAGES["finance"])
    idx = date.today().toordinal() % len(pool)
    return {"persona_name": persona["name"], "persona_role": persona["role"], "message": pool[idx]}


async def _call_gemini(system_instruction: str, input_text: str, temperature: float = 0.2) -> str | None:
    """Returns the model's text output, or None if Gemini isn't configured or
    the call fails for any reason. Shared by auto-verification and the
    support widget below — both just narrowly-scoped system prompts against
    the same `/v1beta/interactions` endpoint already used for the public AI
    chat (see server.py)."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=45.0) as cli:
            response = await cli.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={"Content-Type": "application/json", "x-goog-api-key": gemini_key},
                json={
                    "model": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
                    "system_instruction": system_instruction,
                    "input": input_text,
                    "generation_config": {"temperature": temperature, "thinking_level": "low"},
                },
            )
        if response.status_code != 200:
            raise RuntimeError(f"Gemini {response.status_code}: {response.text[:200]}")
        data = response.json()
        for step in data.get("steps", []):
            if step.get("type") == "model_output":
                parts = step.get("content") or []
                text_out = "".join(p.get("text", "") for p in parts if p.get("type") == "text").strip()
                return text_out or None
        return None
    except Exception:
        logger.exception("Gemini call failed")
        return None


_VERIFY_SYSTEM_PROMPT_BASE = """You are an automatic grader for The Financial Doctor's internship program.
You will be given a task brief and a student's submitted answer. Judge only whether this is a
genuine, on-topic, substantive attempt at the task — not whether it is professionally polished.

Approve if the answer:
- Is clearly attempting the actual task (not empty, not random characters, not just the prompt repeated back).
- Shows some real effort and relevant content, even if brief or imperfect.
- Takes the correct approach — minor wording differences, small formatting issues, or a slightly
  incomplete word count are NOT reasons to reject on their own if the core reasoning/approach is right.

Reject only if the answer is empty, gibberish, completely off-topic, uses a genuinely wrong approach,
or is an obvious copy of the task brief/instructions with nothing added.

Respond with EXACTLY two lines, nothing else:
DECISION: APPROVE  (or)  DECISION: REJECT
REASON: <one short sentence>
"""

# Appended only for Blindfold Mode (Phase 3B) tasks — moderately stricter
# (no hints/sample solution were available, so more is expected of the
# reasoning), but explicitly NOT a zero-tolerance/perfectionist bar. The
# goal of Blindfold Mode is testing independent thinking, not building a
# trap nobody can pass — see product notes.
_VERIFY_SYSTEM_PROMPT_BLINDFOLD_ADDENDUM = """
This particular task is a "Blindfold Mode" task — the student had no hints or sample solution
available and had to work independently. Hold the answer to a MODERATELY higher bar than usual
(expect a bit more depth/completeness in the reasoning), but still do NOT demand perfection —
approve a genuinely correct approach with minor gaps or imperfect wording. Only reject for a
genuinely wrong approach or a major, substantive error, not small imperfections.
"""


async def _auto_verify_text(task: dict, text_answer: str) -> tuple[bool, str, str]:
    """(approved, reason, verified_by). Falls back to a lenient minimum-effort
    check (not empty, reasonable length) if Gemini is unavailable/errors, so
    a submission is never stuck waiting on a third-party API — "fully
    automatic" holds either way."""
    prompt = f"Task: {task['title']}\nBrief: {task['brief']}\n"
    if task.get("instructions"):
        prompt += f"Instructions: {task['instructions']}\n"
    prompt += f"\nStudent's answer:\n{text_answer.strip()}"

    system_prompt = _VERIFY_SYSTEM_PROMPT_BASE
    if task.get("is_blindfold"):
        system_prompt += _VERIFY_SYSTEM_PROMPT_BLINDFOLD_ADDENDUM

    text_out = await _call_gemini(system_prompt, prompt, temperature=0.1)
    if text_out:
        decision = "APPROVE" in text_out.upper().split("\n")[0]
        reason_line = next((l for l in text_out.split("\n") if l.upper().startswith("REASON:")), "")
        reason = reason_line.split(":", 1)[-1].strip() or "Reviewed by AI"
        return decision, reason, "ai"

    ok = len(text_answer.strip()) >= 15
    return ok, "Auto-checked (AI grading unavailable — basic check used)", "ai"


# Pass thresholds for spreadsheet grading — a ratio of correct cells/checks,
# NOT an all-or-nothing "every single cell must be exact" bar. Blindfold is
# moderately stricter (no hints/sample were available) but still well short
# of demanding 100% — see product notes on why a trap nobody can pass would
# hurt the program's credibility rather than help it.
_SPREADSHEET_PASS_THRESHOLD = 0.70
_SPREADSHEET_PASS_THRESHOLD_BLINDFOLD = 0.85


def _auto_verify_spreadsheet(task: dict, spreadsheet_data: dict) -> tuple[bool, str]:
    """(approved, reason). Trusts the client's computed per-cell values
    rather than re-running formulas server-side — the same trust boundary
    already extended elsewhere in this grading pipeline (AntiCheatTextarea
    is a soft deterrent, not real DRM; photo-only field tasks are
    presence-based, not content-quality-verified — see _auto_verify_text's
    neighbors). This is a non-proctored training program, not an exam."""
    answer_key = task.get("spreadsheet_answer_key") or {}
    cells = answer_key.get("cells") or {}
    checks = answer_key.get("checks") or []
    total = len(cells) + len(checks)
    if total == 0:
        return True, "No spreadsheet checks configured"

    failures = []
    passed = 0
    for cell_id, spec in cells.items():
        cell = spreadsheet_data.get(cell_id) or {}
        value = cell.get("value")
        if isinstance(value, (int, float)) and abs(value - spec["expected"]) <= spec.get("tolerance", 0.01):
            passed += 1
        else:
            # A per-cell mistake_note (admin-authored, see TaskPoolIn's
            # spreadsheet_answer_key docstring) explains the real-world
            # impact of THIS specific mistake, not just "which cell is off".
            failures.append(spec.get("mistake_note") or f"{cell_id} looks off")
    for chk in checks:
        left = (spreadsheet_data.get(chk["left"]) or {}).get("value")
        right = (spreadsheet_data.get(chk["right"]) or {}).get("value")
        if isinstance(left, (int, float)) and isinstance(right, (int, float)) and abs(left - right) <= chk.get("tolerance", 0.01):
            passed += 1
        else:
            failures.append(chk.get("label", f"{chk.get('left')} vs {chk.get('right')}"))

    threshold = _SPREADSHEET_PASS_THRESHOLD_BLINDFOLD if task.get("is_blindfold") else _SPREADSHEET_PASS_THRESHOLD
    ratio = passed / total
    if ratio >= threshold:
        note = "Spreadsheet values check out" if ratio == 1 else f"Spreadsheet mostly checks out ({passed}/{total} correct)"
        return True, note
    return False, (
        f"These don't check out yet ({passed}/{total} correct, need at least {int(threshold * 100)}%): "
        + "; ".join(failures[:3])
    )


# ── Voice explain (Hindi + English) ─────────────────────────────────────
# A short, spoken-style explanation of the task in two languages, read
# aloud client-side via the browser's Web Speech API (hi-IN / en-IN voices)
# — generated once per task via Gemini and cached on the task_pool doc, not
# regenerated on every request.

_VOICE_EXPLAIN_SYSTEM_PROMPT = """You are writing a short, easy-to-read explanation of a task for a
college-age intern, in two versions: plain English, and Hinglish.

Respond in EXACTLY this format, nothing else — two lines, each starting with the exact label shown:
ENGLISH: <a short, clear English explanation, 70-110 words>
HINDI: <a short Hinglish explanation, 90-140 words — Hindi written in ROMAN/ENGLISH LETTERS, NOT Devanagari script>

Rules for both:
- Cover: what this task is about, exactly what the student needs to do, and roughly how to submit it.
- Write it as natural, friendly sentences — NOT bullet points, NOT "Step 1/Step 2" headers, no markdown.

Rules for the Hinglish version specifically:
- MUST be written entirely in Roman/English letters (e.g. "Aapko yeh task karna hai..."), never in Devanagari
  (हिन्दी) script — this is Hinglish, the way Indian college students actually text each other, not Hindi.
- Use simple, everyday conversational Hindi words spelled phonetically in English, freely mixed with common
  English words the way people actually talk, especially for technical terms (e.g. "task", "submit", "photo",
  "location") — don't force awkward pure-Hindi translations of these.
- The goal is maximum easy understanding for a non-fluent-in-English student, not linguistic purity.
"""


_STEP_CONNECTORS = ["First,", "Next,", "After that,", "Then,", "Once that's done,", "Following that,", "After this,"]


def _steps_to_spoken(instructions: str) -> str:
    """Turns 'Step 1: ...\\nStep 2: ...' into flowing spoken sentences —
    used both by the plain-fallback path and to keep the Gemini prompt's
    own instructions input readable, so nothing ever gets read aloud as a
    literal 'Step 1: Step 2:' checklist."""
    if not instructions:
        return ""
    step_texts = [s.strip() for s in re.findall(r"Step \d+:\s*(.*?)(?=(?:\s*Step \d+:)|\Z)", instructions, re.DOTALL) if s.strip()]
    sentences = []
    for i, s in enumerate(step_texts):
        s = s.rstrip(".") + "."
        # Some step text (e.g. the auto-appended reflection step) already
        # opens with its own connector word — don't double it up with the
        # one we're about to prepend (avoids "Finally, finally, ...").
        s = re.sub(r"^(First|Next|Then|Finally|After that|After this|Once that's done|Following that),\s*", "", s, flags=re.IGNORECASE)
        connector = "Finally," if i == len(step_texts) - 1 else _STEP_CONNECTORS[min(i, len(_STEP_CONNECTORS) - 1)]
        sentences.append(f"{connector} {s[:1].lower()}{s[1:]}")
    return " ".join(sentences)


def _voice_explain_fallback(task: dict) -> tuple[str, str]:
    """Used only when Gemini is unavailable/errors (e.g. quota exhausted) —
    NOT an AI-written explanation, but a genuine spoken-style narration built
    from the task's own fields, never a raw 'Step 1: Step 2:' readback and
    never English text simply relabeled as Hindi."""
    spoken_steps = _steps_to_spoken(task.get("instructions", ""))
    submit_note = "Once you're done, submit it right from this screen — our system checks it automatically and instantly tells you if it's approved."
    english = f"{task.get('brief', '').strip()} {spoken_steps} {submit_note}".strip()

    hindi = (
        f"Yeh task hai — \"{task.get('title', '')}\". "
        f"Isme aapko yeh karna hai: {task.get('brief', '').strip()} "
        "Task ke andar upar diye gaye step-by-step instructions ko dhyan se padh lijiye. "
        "Jab aap apna answer likh lein ya photo khinch lein, to isi screen se submit kar dijiye — "
        "hamara system turant, automatically check karke bata dega ki aapka kaam verify hua ya nahi."
    )
    return english, hindi


async def _generate_voice_explain(task: dict) -> tuple[str, str, bool]:
    """(english_text, hindi_text, is_ai_generated). is_ai_generated tells the
    caller whether to persist this to the cache — the fallback is
    deliberately never cached, so the next request retries Gemini instead of
    being permanently stuck with the lower-quality fallback."""
    prompt = f"Task: {task['title']}\nBrief: {task['brief']}\n"
    if task.get("instructions"):
        prompt += f"Instructions: {task['instructions']}\n"

    text_out = await _call_gemini(_VOICE_EXPLAIN_SYSTEM_PROMPT, prompt, temperature=0.4)
    if text_out:
        english_match = re.search(r"ENGLISH:\s*(.+?)(?=\nHINDI:|\Z)", text_out, re.DOTALL | re.IGNORECASE)
        hindi_match = re.search(r"HINDI:\s*(.+)", text_out, re.DOTALL | re.IGNORECASE)
        english = english_match.group(1).strip() if english_match else ""
        hindi = hindi_match.group(1).strip() if hindi_match else ""
        if english and hindi:
            return english, hindi, True

    english, hindi = _voice_explain_fallback(task)
    return english, hindi, False


@router.get("/tasks/{task_id}/voice-explain")
async def get_task_voice_explain(task_id: str, _payload: dict = Depends(get_current_student_payload)):
    task = await internship_task_pool_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.get("voice_explain_english") and task.get("voice_explain_hindi"):
        return {"english": task["voice_explain_english"], "hindi": task["voice_explain_hindi"]}

    english, hindi, is_ai = await _generate_voice_explain(task)
    if is_ai:
        await internship_task_pool_collection.update_one(
            {"id": task_id}, {"$set": {"voice_explain_english": english, "voice_explain_hindi": hindi}},
        )
    return {"english": english, "hindi": hindi}


@router.put("/submissions/draft")
async def save_submission_draft(data: SubmissionDraftIn, payload: dict = Depends(get_current_student_payload)):
    """Saves in-progress text only — no AI verification runs, no photo/GPS
    involved. A student can type a bit, save, come back later, type more,
    and save again as many times as they like; the real 'Confirm Submit'
    (POST /submissions) is the only thing that actually gets graded."""
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    task = await internship_task_pool_collection.find_one({"id": data.task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    assigned = (student.get("assigned_tasks") or {}).get(str(data.week_number), [])
    if data.task_id not in assigned:
        raise HTTPException(status_code=400, detail="This task isn't assigned to you for this week")

    existing = await internship_submissions_collection.find_one({"student_id": student["id"], "task_id": data.task_id})
    if existing and existing.get("status") in ("pending", "approved"):
        raise HTTPException(status_code=409, detail="This task has already been submitted for review")

    spreadsheet_data = None
    if data.spreadsheet_data:
        try:
            spreadsheet_data = json.loads(data.spreadsheet_data)
        except (ValueError, TypeError):
            spreadsheet_data = None

    now = datetime.now(timezone.utc)
    doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student["id"], "student_name": student["name"],
        "task_id": data.task_id, "task_title": task["title"], "track": task["track"], "week_number": data.week_number,
        "text_answer": data.text_answer.strip() or None,
        "spreadsheet_data": spreadsheet_data if spreadsheet_data is not None else (existing.get("spreadsheet_data") if existing else None),
        "photo_r2_key": existing.get("photo_r2_key") if existing else None,
        "gps": existing.get("gps") if existing else None, "client_timestamp": existing.get("client_timestamp") if existing else None,
        "submitted_at": now, "status": "draft",
        "verified_by": None, "admin_reviewer_id": None, "admin_note": None,
        "points_awarded": None, "reviewed_at": None,
    }
    if existing:
        await internship_submissions_collection.update_one({"id": existing["id"]}, {"$set": doc})
    else:
        await internship_submissions_collection.insert_one(doc)
    return {"status": "draft_saved"}


@router.post("/submissions")
async def create_submission(
    task_id: str = Form(...),
    week_number: int = Form(...),
    text_answer: str = Form(default=""),
    spreadsheet_data: str = Form(default=""),
    gps_lat: float = Form(default=None),
    gps_lng: float = Form(default=None),
    gps_accuracy: float = Form(default=None),
    client_timestamp: str = Form(default=""),
    photo: UploadFile = File(default=None),
    payload: dict = Depends(get_current_student_payload),
):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    task = await internship_task_pool_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Same seed as when the task was rendered to this student, so a
    # randomized task grades against the exact answer key its template was
    # generated from (see _randomize_task_for_student).
    task = _randomize_task_for_student(task, student["id"])

    assigned = (student.get("assigned_tasks") or {}).get(str(week_number), [])
    if task_id not in assigned:
        raise HTTPException(status_code=400, detail="This task isn't assigned to you for this week")

    if task["deliverable_type"] in ("text", "text_and_photo", "text_and_spreadsheet") and not text_answer.strip():
        raise HTTPException(status_code=400, detail="A written answer is required for this task")
    if task["deliverable_type"] in ("photo", "text_and_photo") and not photo:
        raise HTTPException(status_code=400, detail="A photo is required for this task")
    if task["deliverable_type"] in ("spreadsheet", "text_and_spreadsheet") and not spreadsheet_data.strip():
        raise HTTPException(status_code=400, detail="Please fill in the spreadsheet before submitting")

    parsed_spreadsheet_data = None
    if spreadsheet_data.strip():
        try:
            parsed_spreadsheet_data = json.loads(spreadsheet_data)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Spreadsheet data was malformed — please try again")

    # A prior pending/approved submission for this task blocks resubmission;
    # a rejected one can be resubmitted (overwritten) once.
    existing = await internship_submissions_collection.find_one({"student_id": student["id"], "task_id": task_id})
    if existing and existing.get("status") in ("pending", "approved"):
        raise HTTPException(status_code=409, detail="You've already submitted this task")

    photo_r2_key = None
    if photo:
        content = await photo.read()
        ext = (photo.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        photo_r2_key = f"internship/{student['id']}/{uuid.uuid4()}.{ext}"
        upload_bytes(photo_r2_key, content, photo.content_type or "image/jpeg")

    now = datetime.now(timezone.utc)
    gps = None
    if gps_lat is not None and gps_lng is not None:
        gps = {"lat": gps_lat, "lng": gps_lng, "accuracy": gps_accuracy}

    # Fully automatic — no admin action needed. Text is judged by Gemini for
    # genuine, on-topic effort; a photo-only requirement auto-passes once the
    # photo (and GPS, if the task requires it) is actually present — real
    # photo-content verification would need vision AI and isn't built here,
    # so this is presence-based, not content-quality-based (see PRD notes).
    # Spreadsheet tasks additionally run _auto_verify_spreadsheet — see its
    # own docstring for the client-trust design note.
    needs_text = task["deliverable_type"] in ("text", "text_and_photo", "text_and_spreadsheet")
    needs_spreadsheet = task["deliverable_type"] in ("spreadsheet", "text_and_spreadsheet")
    if needs_text:
        text_approved, text_reason, verified_by = await _auto_verify_text(task, text_answer)
    else:
        text_approved, text_reason, verified_by = True, "Field task auto-verified: photo received" + (" with location" if gps else ""), "ai"

    if needs_spreadsheet:
        sheet_approved, sheet_reason = _auto_verify_spreadsheet(task, parsed_spreadsheet_data or {})
    else:
        sheet_approved, sheet_reason = True, None

    approved = text_approved and sheet_approved
    failure_reasons = [r for ok, r in ((text_approved, text_reason), (sheet_approved, sheet_reason)) if not ok and r]
    reason = " | ".join(failure_reasons) if failure_reasons else text_reason
    content_rejected = not approved

    if task.get("requires_geotag") and not gps:
        approved, reason = False, "Location wasn't captured with this submission — please allow location access and resubmit."
        content_rejected = False  # this rejection is about location, not the task's own content

    # "Why-audit": on a content rejection, append the task's own
    # admin-authored real-world-impact note, not just the auto-grader's
    # terse reason — e.g. "GST 18% ki jagah 5% laga diya - real audit mein
    # penalty ho sakta hai."
    if content_rejected and task.get("mistake_explanation"):
        reason = f"{reason}\n\nWhy this matters: {task['mistake_explanation']}"

    doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student["id"], "student_name": student["name"],
        "task_id": task_id, "task_title": task["title"], "track": task["track"], "week_number": week_number,
        "text_answer": text_answer.strip() or None,
        "spreadsheet_data": parsed_spreadsheet_data if parsed_spreadsheet_data is not None else (existing.get("spreadsheet_data") if existing else None),
        "photo_r2_key": photo_r2_key or (existing.get("photo_r2_key") if existing else None),
        "gps": gps, "client_timestamp": client_timestamp or None,
        "submitted_at": now, "status": "approved" if approved else "rejected",
        "verified_by": verified_by, "admin_reviewer_id": None, "admin_note": reason,
        "points_awarded": task.get("points_value", 0) if approved else None, "reviewed_at": now,
    }
    if existing:
        await internship_submissions_collection.update_one({"id": existing["id"]}, {"$set": doc})
    else:
        await internship_submissions_collection.insert_one(doc)

    return {"status": "submitted", "submission_id": doc["id"], "review_status": doc["status"], "admin_note": reason}


# ── Weekly quiz + drip-lock ────────────────────────────────────────────

QUIZ_QUESTIONS_PER_ATTEMPT = 5


@router.get("/quiz/current")
async def get_current_quiz(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not student.get("track"):
        raise HTTPException(status_code=400, detail="Please select a track first")
    current_day, current_week_by_days = _compute_progress(student)
    if current_week_by_days == 0:
        return {"week_number": 0, "questions": [], "already_passed": False}

    effective_week, _ = await _effective_unlocked_week(student, current_week_by_days)
    already_passed = await _week_quiz_passed(student["id"], effective_week)

    pool = [
        q async for q in internship_quiz_questions_collection.find({"track": student["track"], "is_active": True})
    ]
    rng = random.Random(f"quiz:{student['id']}:{effective_week}")
    sample = rng.sample(pool, min(QUIZ_QUESTIONS_PER_ATTEMPT, len(pool)))
    questions = [
        QuizQuestionOut(id=q["id"], track=q["track"], question_text=q["question_text"], options=q["options"], category=q["category"])
        for q in sample
    ]
    return {"week_number": effective_week, "questions": questions, "already_passed": already_passed, "pass_threshold": QUIZ_PASS_THRESHOLD}


@router.post("/quiz/submit", response_model=QuizAttemptOut)
async def submit_quiz(data: QuizSubmitIn, payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not data.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")

    question_ids = [a.question_id for a in data.answers]
    questions = {
        q["id"]: q
        async for q in internship_quiz_questions_collection.find({"id": {"$in": question_ids}})
    }

    category_correct: dict[str, int] = {}
    category_total: dict[str, int] = {}
    correct_count = 0
    for ans in data.answers:
        q = questions.get(ans.question_id)
        if not q:
            continue
        cat = q["category"]
        category_total[cat] = category_total.get(cat, 0) + 1
        if ans.selected_index == q["correct_index"]:
            correct_count += 1
            category_correct[cat] = category_correct.get(cat, 0) + 1

    total = len(data.answers)
    score_percent = round((correct_count / total) * 100, 1) if total else 0.0
    passed = (not data.auto_failed) and score_percent >= QUIZ_PASS_THRESHOLD
    category_scores = {
        cat: round((category_correct.get(cat, 0) / tot) * 100, 1) for cat, tot in category_total.items()
    }

    now = datetime.now(timezone.utc)
    attempt = {
        "id": str(uuid.uuid4()), "student_id": student["id"], "week_number": data.week_number,
        "score_percent": score_percent, "passed": passed, "category_scores": category_scores,
        "tab_switch_violations": data.tab_switch_violations, "auto_failed": data.auto_failed,
        "started_at": now, "submitted_at": now,
    }
    await internship_quiz_attempts_collection.insert_one(attempt)

    # Blend this attempt's category scores into the student's running radar
    # profile (simple running average, not an overwrite) — integrity is
    # additionally dinged per warning issued, per the original design notes.
    radar = dict(student.get("radar_scores", {}))
    for cat, pct in category_scores.items():
        radar[cat] = round((radar[cat] + pct) / 2, 1) if cat in radar else pct
    if "integrity" in radar:
        radar["integrity"] = max(0.0, radar["integrity"] - student.get("warning_count", 0) * 5)

    update = {"radar_scores": radar, "last_quiz_score": score_percent, "updated_at": now}
    if passed:
        update["quiz_pass_count"] = student.get("quiz_pass_count", 0) + 1
    await internship_students_collection.update_one({"id": student["id"]}, {"$set": update})

    attempt.pop("_id", None)
    return QuizAttemptOut(**attempt)


# ── Leaderboard ──────────────────────────────────────────────────────────
# No wallet/currency anywhere in this program — "score" here is computed
# fresh from approved-submission points + quizzes passed, purely for
# ranking display, never paid out or stored as a running balance.

@router.get("/leaderboard")
async def get_leaderboard(track: Optional[str] = Query(default=None), payload: dict = Depends(get_current_student_payload)):
    """Overall (all-tracks) by default; pass ?track=finance|marketing|sales|hr
    for a track-specific ranking — same scoring, just a filtered pool of
    students, so "top of my track" and "top overall" are both a single
    endpoint rather than two separate ones."""
    points_by_student: dict[str, int] = {}
    async for sub in internship_submissions_collection.find({"status": "approved"}, {"student_id": 1, "points_awarded": 1}):
        points_by_student[sub["student_id"]] = points_by_student.get(sub["student_id"], 0) + (sub.get("points_awarded") or 0)

    student_filter = {"status": {"$in": ["active", "graduated"]}, "is_demo": {"$ne": True}}
    if track:
        student_filter["track"] = track

    rows = []
    async for s in internship_students_collection.find(
        student_filter, {"id": 1, "name": 1, "track": 1, "quiz_pass_count": 1}
    ):
        task_points = points_by_student.get(s["id"], 0)
        score = task_points + s.get("quiz_pass_count", 0) * 100
        rows.append({
            "student_id": s["id"], "name": s["name"], "track": s.get("track"),
            "track_label": TRACK_LABELS.get(s.get("track")), "score": score,
        })
    rows.sort(key=lambda r: r["score"], reverse=True)
    for i, r in enumerate(rows, start=1):
        r["rank"] = i

    top = rows[:20]
    me = next((r for r in rows if r["student_id"] == payload["sub"]), None)
    return {"top": top, "me": me, "total_participants": len(rows)}


# ── Daily learning report ────────────────────────────────────────────────
# Purely a self-written log the student keeps for themselves — "what did I
# learn today, what did I do today" — one entry per calendar date, editable
# any time. Together, all entries ARE the student's internship report; no
# separate PDF/export step is needed, the Report page just lists them all.

def _to_report_out(doc: dict) -> ReportEntryOut:
    return ReportEntryOut(
        id=doc["id"], student_id=doc["student_id"], date=doc["date"],
        what_learned=doc.get("what_learned", ""), what_did=doc.get("what_did", ""),
        created_at=doc["created_at"], updated_at=doc["updated_at"],
    )


@router.get("/reports", response_model=list[ReportEntryOut])
async def list_reports(payload: dict = Depends(get_current_student_payload)):
    cursor = internship_reports_collection.find({"student_id": payload["sub"]}).sort("date", -1)
    return [_to_report_out(doc) async for doc in cursor]


@router.post("/reports", response_model=ReportEntryOut)
async def upsert_report(data: ReportEntryIn, payload: dict = Depends(get_current_student_payload)):
    """One entry per date — posting again for a date you already logged
    updates that same entry rather than creating a duplicate."""
    now = datetime.now(timezone.utc)
    existing = await internship_reports_collection.find_one({"student_id": payload["sub"], "date": data.date})
    if existing:
        await internship_reports_collection.update_one(
            {"id": existing["id"]},
            {"$set": {"what_learned": data.what_learned, "what_did": data.what_did, "updated_at": now}},
        )
        updated = await internship_reports_collection.find_one({"id": existing["id"]})
        return _to_report_out(updated)

    doc = {
        "id": str(uuid.uuid4()), "student_id": payload["sub"], "date": data.date,
        "what_learned": data.what_learned, "what_did": data.what_did,
        "created_at": now, "updated_at": now,
    }
    await internship_reports_collection.insert_one(doc)
    return _to_report_out(doc)


@router.put("/reports/{report_id}", response_model=ReportEntryOut)
async def update_report(report_id: str, data: ReportEntryIn, payload: dict = Depends(get_current_student_payload)):
    existing = await internship_reports_collection.find_one({"id": report_id, "student_id": payload["sub"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Report entry not found")
    now = datetime.now(timezone.utc)
    await internship_reports_collection.update_one(
        {"id": report_id},
        {"$set": {"date": data.date, "what_learned": data.what_learned, "what_did": data.what_did, "updated_at": now}},
    )
    updated = await internship_reports_collection.find_one({"id": report_id})
    return _to_report_out(updated)


@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, payload: dict = Depends(get_current_student_payload)):
    result = await internship_reports_collection.delete_one({"id": report_id, "student_id": payload["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report entry not found")
    return {"status": "deleted"}


@router.get("/reports/pdf")
async def download_progress_report_pdf(payload: dict = Depends(get_current_student_payload)):
    """An on-demand, in-progress version of the same rich report PDF that
    normally only gets generated at graduation (see generate_internship_
    report_pdf/create_graduation_certificate) — reused here rather than
    building a second, simpler report layout. Generated fresh every call,
    never stored, so it's always current as of the moment it's downloaded."""
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    track_label = TRACK_LABELS.get(student.get("track"), student.get("track") or "-")
    duration_days = student.get("duration_days", 90)
    start = student.get("program_start_date")
    issue_date = date.today().isoformat()

    grad = await _graduation_eligibility(student)
    report_entries = [
        {"date": e["date"], "what_learned": e.get("what_learned", ""), "what_did": e.get("what_did", "")}
        async for e in internship_reports_collection.find({"student_id": student["id"]}).sort("date", 1)
    ]
    approved_submissions = [
        {"week_number": s.get("week_number", 0), "task_title": s.get("task_title", "-"), "points_awarded": s.get("points_awarded") or 0, "status": s.get("status", "approved")}
        async for s in internship_submissions_collection.find({"student_id": student["id"], "status": "approved"}).sort("week_number", 1)
    ]
    radar_scores_labelled = {RADAR_CATEGORY_LABELS.get(k, k): v for k, v in (student.get("radar_scores") or {}).items()}

    report_photo_bytes = None
    if student.get("photo_r2_key"):
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=student["photo_r2_key"])
            report_photo_bytes = obj["Body"].read()
        except Exception:
            report_photo_bytes = None

    pdf_bytes = await asyncio.to_thread(
        generate_internship_report_pdf,
        {
            "name": student["name"], "intern_id": student.get("intern_id", ""), "college": student.get("college"),
            "college_id_number": student.get("college_id_number"), "course_year": student.get("course_year"),
            "track_label": track_label,
            "start_date": start.date().isoformat() if start else issue_date,
            "end_date": issue_date, "duration_days": duration_days,
            "status_label": "Graduated" if student.get("status") == "graduated" else f"In Progress — Day {_compute_progress(student)[0]}",
            "percentage": grad.percentage, "earned_points": grad.earned_points, "total_points": grad.total_points,
            "quiz_pass_count": student.get("quiz_pass_count", 0), "last_quiz_score": student.get("last_quiz_score"),
            "radar_scores": radar_scores_labelled, "submissions": approved_submissions, "entries": report_entries,
            "certificate_number": None,
        },
        photo_bytes=report_photo_bytes,
    )
    filename = f"TFD_Internship_Progress_Report_{student.get('intern_id', 'report')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


# ── Graduation & certificate ─────────────────────────────────────────
# Certificate eligibility is a percentage of the FULL task pool's
# weightage (points_value), not a require-every-task rule — a task missed
# in one week stays completable later (see /tasks/all's docstring), and
# graduation just looks at whatever fraction of the total weight ended up
# earned. Reuses the existing certificate_pdf/R2/certificates_collection
# infra (see certificate_routes.py) rather than building a parallel
# document pipeline — this is the only place internship_routes.py touches
# that system, via a distinct type="internship_program" so it never
# collides with the existing KYC-intern certificate flow (type="internship",
# intern_id set) that certificate_routes.py itself manages.

def _verify_url(certificate_number: str) -> str:
    return f"{SITE_URL}/verify?certificate={certificate_number.replace('/', '-')}"


async def _graduation_eligibility(student: dict) -> GraduationCheckOut:
    duration_days = student.get("duration_days", 90)
    total_weeks = ceil(duration_days / 7)

    # Deduped by task_id, not summed per-week — with curated phase-tagged
    # pools, the same task is deliberately served across every week of its
    # phase (see _assign_week_tasks), but a submission can only ever be
    # approved once per task_id, so summing per-week would count a task's
    # weight once for every week it was served while it can only ever be
    # *earned* once, artificially deflating the percentage.
    task_points_by_id: dict[str, int] = {}
    for week_num in range(1, total_weeks + 1):
        tasks = await _assign_week_tasks(student, week_num)
        for t in tasks:
            task_points_by_id[t["id"]] = t.get("points_value", 0)
    total_points = sum(task_points_by_id.values())

    earned_points = 0
    async for sub in internship_submissions_collection.find(
        {"student_id": student["id"], "status": "approved"}, {"points_awarded": 1}
    ):
        earned_points += sub.get("points_awarded") or 0

    percentage = round((earned_points / total_points) * 100, 1) if total_points else 0.0

    days_completed = False
    start = student.get("program_start_date")
    if start:
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - start).days + 1
        days_completed = elapsed >= duration_days
    current_day, _ = _compute_progress(student)

    already_graduated = student.get("status") == "graduated"
    eligible = (not already_graduated) and days_completed and percentage >= GRADUATION_THRESHOLD

    reason = None
    if already_graduated:
        reason = "Already graduated."
    elif not days_completed:
        reason = f"Program duration ({duration_days} days) hasn't been completed yet — currently Day {current_day}."
    elif percentage < GRADUATION_THRESHOLD:
        reason = f"Score is {percentage}%, below the {GRADUATION_THRESHOLD}% threshold required for a certificate."

    return GraduationCheckOut(
        eligible=eligible, already_graduated=already_graduated, percentage=percentage,
        earned_points=earned_points, total_points=total_points, threshold=GRADUATION_THRESHOLD,
        days_completed=days_completed, current_day=current_day, duration_days=duration_days, reason=reason,
    )


@router.get("/admin/students/{student_id}/graduation-check", response_model=GraduationCheckOut)
async def admin_graduation_check(student_id: str, _admin: dict = Depends(require_admin)):
    student = await internship_students_collection.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await _graduation_eligibility(student)


async def _generate_graduation_documents(student: dict, check: GraduationCheckOut, created_by: str) -> dict:
    """Generates the certificate + internship letter + internship report PDFs,
    stores all three in certificates_collection, flips the student to
    graduated, and returns a summary dict. Shared by the admin-triggered
    graduate endpoint and the demo account's self-service instant-graduate
    shortcut — same real documents either way, just a different caller."""
    track_label = TRACK_LABELS.get(student.get("track"), student.get("track") or "General")
    duration_days = student.get("duration_days", 90)
    issue_date = date.today().isoformat()
    year = date.today().year
    cert_number = await _next_sequence("internship_program", year)

    cert_data = {
        "certificate_number": cert_number, "person_name": student["name"], "cert_type": "internship",
        "department": track_label, "issue_date": issue_date, "duration_label": f"{duration_days} days",
        "custom_detail": (
            f"for successfully completing the {duration_days}-day TFD Internship Program in {track_label}, "
            f"achieving a program score of {check.percentage}%"
        ),
    }
    pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert_number))

    cert_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"certificates/{cert_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    now = datetime.now(timezone.utc)
    cert_doc = {
        "id": cert_id, "certificate_number": cert_number, "person_name": student["name"], "type": "internship_program",
        "cert_type": "internship", "department": track_label, "issue_date": issue_date, "duration_label": f"{duration_days} days",
        "college": student.get("college"), "linked_employee_id": None, "intern_id": None,
        "internship_student_id": student["id"], "percentage": check.percentage,
        "earned_points": check.earned_points, "total_points": check.total_points,
        "r2_key": r2_key, "created_by": created_by, "created_at": now.isoformat(),
    }
    await certificates_collection.insert_one(cert_doc)

    # Alongside the certificate, also generate the internship letter (reuses
    # this same certificate's QR/number, same pattern as the KYC-flow's
    # completion letter) and a snapshot PDF of the student's own report
    # entries — both unlock together with the certificate, not separately.
    letter_pdf = generate_internship_program_letter_pdf(
        {
            "name": student["name"], "college": student.get("college"), "track_label": track_label,
            "start_date": student["program_start_date"].date().isoformat() if student.get("program_start_date") else issue_date,
            "end_date": issue_date, "duration_days": duration_days, "percentage": check.percentage,
        },
        verify_url=_verify_url(cert_number), certificate_number=cert_number,
    )
    letter_id = str(uuid.uuid4())
    letter_r2_key = None
    if r2_enabled():
        letter_r2_key = f"certificates/{letter_id}.pdf"
        upload_bytes(letter_r2_key, letter_pdf, "application/pdf")
    letter_number = await _next_sequence("internship_program_letter", year)
    await certificates_collection.insert_one({
        "id": letter_id, "certificate_number": letter_number, "person_name": student["name"], "type": "internship_program_letter",
        "department": track_label, "issue_date": issue_date, "duration_label": f"{duration_days} days",
        "college": student.get("college"), "linked_employee_id": None, "intern_id": None,
        "internship_student_id": student["id"], "r2_key": letter_r2_key, "created_by": created_by, "created_at": now.isoformat(),
    })

    report_entries = [
        {"date": e["date"], "what_learned": e.get("what_learned", ""), "what_did": e.get("what_did", "")}
        async for e in internship_reports_collection.find({"student_id": student["id"]}).sort("date", 1)
    ]
    approved_submissions = [
        {"week_number": s.get("week_number", 0), "task_title": s.get("task_title", "-"), "points_awarded": s.get("points_awarded") or 0, "status": s.get("status", "approved")}
        async for s in internship_submissions_collection.find({"student_id": student["id"], "status": "approved"}).sort("week_number", 1)
    ]
    radar_scores_labelled = {
        RADAR_CATEGORY_LABELS.get(k, k): v for k, v in (student.get("radar_scores") or {}).items()
    }
    report_photo_bytes = None
    if student.get("photo_r2_key"):
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=student["photo_r2_key"])
            report_photo_bytes = obj["Body"].read()
        except Exception:
            report_photo_bytes = None
    report_pdf = generate_internship_report_pdf({
        "name": student["name"], "intern_id": student["intern_id"], "college": student.get("college"),
        "college_id_number": student.get("college_id_number"), "course_year": student.get("course_year"),
        "track_label": track_label,
        "start_date": student["program_start_date"].date().isoformat() if student.get("program_start_date") else issue_date,
        "end_date": issue_date, "duration_days": duration_days, "status_label": "Graduated",
        "percentage": check.percentage, "earned_points": check.earned_points, "total_points": check.total_points,
        "quiz_pass_count": student.get("quiz_pass_count", 0), "last_quiz_score": student.get("last_quiz_score"),
        "radar_scores": radar_scores_labelled, "submissions": approved_submissions, "entries": report_entries,
        "certificate_number": cert_number,
    }, photo_bytes=report_photo_bytes)
    report_id = str(uuid.uuid4())
    report_r2_key = None
    if r2_enabled():
        report_r2_key = f"certificates/{report_id}.pdf"
        upload_bytes(report_r2_key, report_pdf, "application/pdf")
    report_number = await _next_sequence("internship_program_report", year)
    await certificates_collection.insert_one({
        "id": report_id, "certificate_number": report_number, "person_name": student["name"], "type": "internship_program_report",
        "department": track_label, "issue_date": issue_date, "duration_label": f"{duration_days} days",
        "college": student.get("college"), "linked_employee_id": None, "intern_id": None,
        "internship_student_id": student["id"], "r2_key": report_r2_key, "created_by": created_by, "created_at": now.isoformat(),
    })

    await internship_students_collection.update_one(
        {"id": student["id"]},
        {"$set": {
            "status": "graduated", "certificate_id": cert_id, "letter_id": letter_id, "report_id": report_id,
            "graduated_at": now, "updated_at": now,
        }},
    )

    return {"cert_number": cert_number, "cert_r2_key": r2_key}


@router.post("/admin/students/{student_id}/graduate")
async def admin_graduate_student(student_id: str, data: GraduateIn, admin: dict = Depends(require_admin)):
    student = await internship_students_collection.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.get("status") == "banned":
        raise HTTPException(status_code=400, detail="Banned students cannot graduate")
    if student.get("status") == "graduated":
        raise HTTPException(status_code=409, detail="This student has already graduated")
    if student.get("status") != "active":
        raise HTTPException(status_code=400, detail="This student's program isn't active yet")

    check = await _graduation_eligibility(student)
    if not check.eligible and not data.force:
        raise HTTPException(status_code=400, detail=check.reason or "Not eligible for graduation yet")

    result = await _generate_graduation_documents(student, check, admin["sub"])
    await log_activity(
        admin["sub"], "internship_certificate_generated",
        f"Graduated internship student {student['name']} ({check.percentage}% score) — issued certificate {result['cert_number']}",
        link="/portal/admin/internship",
    )

    updated = await internship_students_collection.find_one({"id": student_id})
    return {
        "status": "graduated", "student": _to_student_out(updated),
        "certificate_number": result["cert_number"], "percentage": check.percentage,
        "pdf_url": presigned_url(result["cert_r2_key"]) if result["cert_r2_key"] else None,
    }


DEMO_MAX_ADVANCE_DAYS = 400  # generous ceiling — well past even a 90-day program, just guards against abuse


@router.post("/demo/advance")
async def demo_advance_day(days: int = Query(default=1, ge=1, le=45), payload: dict = Depends(get_current_student_payload)):
    """Demo-only — jumps the program forward by shifting program_start_date
    further into the past, so later weeks' tasks become visible on demand
    without waiting real days or passing quizzes (drip-lock is bypassed for
    is_demo accounts — see _effective_unlocked_week)."""
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student or not student.get("is_demo"):
        raise HTTPException(status_code=403, detail="This action is only available on the demo account")

    start = student.get("program_start_date") or datetime.now(timezone.utc)
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    elapsed_days = (datetime.now(timezone.utc) - start).days + 1
    new_elapsed = min(elapsed_days + days, DEMO_MAX_ADVANCE_DAYS)
    new_start = datetime.now(timezone.utc) - timedelta(days=new_elapsed - 1)

    await internship_students_collection.update_one(
        {"id": payload["sub"]}, {"$set": {"program_start_date": new_start, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return _to_student_out(updated)


@router.post("/demo/graduate")
async def demo_instant_graduate(payload: dict = Depends(get_current_student_payload)):
    """Demo-only — generates a real certificate + internship letter +
    internship report instantly, skipping the 75%/duration eligibility
    check entirely, so the Certificate Hub's fully-graduated state can be
    shown on demand. Resets back to normal on the next login, same as
    everything else on this account."""
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student or not student.get("is_demo"):
        raise HTTPException(status_code=403, detail="This action is only available on the demo account")
    if student.get("status") == "graduated":
        raise HTTPException(status_code=409, detail="Demo account has already graduated this session")

    check = await _graduation_eligibility(student)
    result = await _generate_graduation_documents(student, check, student["id"])
    updated = await internship_students_collection.find_one({"id": payload["sub"]})
    return {
        "status": "graduated", "student": _to_student_out(updated),
        "certificate_number": result["cert_number"], "percentage": check.percentage,
    }


@router.get("/me/certificate")
async def get_my_certificate(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    if student.get("status") != "graduated" or not student.get("certificate_id"):
        check = await _graduation_eligibility(student)
        return {"graduated": False, **check.dict()}

    cert = await certificates_collection.find_one({"id": student["certificate_id"]})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate record not found")
    return {
        "graduated": True, "certificate_number": cert["certificate_number"], "issue_date": cert["issue_date"],
        "percentage": cert.get("percentage"), "earned_points": cert.get("earned_points"), "total_points": cert.get("total_points"),
        "pdf_url": presigned_url(cert["r2_key"]) if cert.get("r2_key") else None,
    }


@router.get("/me/certificate/download")
async def download_my_certificate(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student or student.get("status") != "graduated" or not student.get("certificate_id"):
        raise HTTPException(status_code=404, detail="Certificate hasn't been issued yet")
    cert = await certificates_collection.find_one({"id": student["certificate_id"]})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate record not found")

    pdf_bytes = None
    if cert.get("r2_key"):
        try:
            obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=cert["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            pdf_bytes = None
    if pdf_bytes is None:
        cert_data = {
            "certificate_number": cert["certificate_number"], "person_name": cert["person_name"],
            "cert_type": cert.get("cert_type", "internship"), "department": cert.get("department"),
            "issue_date": cert["issue_date"], "duration_label": cert.get("duration_label"),
        }
        pdf_bytes = generate_certificate_pdf(cert_data, _verify_url(cert["certificate_number"]))

    filename = f"Certificate_{cert['certificate_number'].replace('/', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


async def _download_bundled_doc(student_id: str, doc_field: str, filename_prefix: str) -> StreamingResponse:
    """Shared by /me/letter/download and /me/report/download — both are
    generated once at graduation and just served back from R2 (or a 404 if
    the graduate step somehow didn't produce one, e.g. R2 was briefly down)."""
    student = await internship_students_collection.find_one({"id": student_id})
    doc_id = student.get(doc_field) if student else None
    if not student or student.get("status") != "graduated" or not doc_id:
        raise HTTPException(status_code=404, detail="Not available yet — this unlocks once you graduate.")
    doc = await certificates_collection.find_one({"id": doc_id})
    if not doc or not doc.get("r2_key"):
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        obj = r2_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
        pdf_bytes = obj["Body"].read()
    except Exception:
        raise HTTPException(status_code=404, detail="Document not found")
    filename = f"{filename_prefix}_{doc['certificate_number'].replace('/', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


@router.get("/me/letter/download")
async def download_my_letter(payload: dict = Depends(get_current_student_payload)):
    return await _download_bundled_doc(payload["sub"], "letter_id", "Internship_Letter")


@router.get("/me/report/download")
async def download_my_report(payload: dict = Depends(get_current_student_payload)):
    return await _download_bundled_doc(payload["sub"], "report_id", "Internship_Report")


@router.get("/certificate/sample")
@limiter.limit("20/minute")
async def get_sample_certificate(request: Request):
    """Public, unauthenticated — lets a not-yet-graduated student (or
    prospective applicant) preview what the real certificate looks like.
    Generated on the fly with clearly-marked placeholder data; never stored,
    never a real certificate_number, so it can't be mistaken for one."""
    cert_data = {
        "certificate_number": "TFD/INTP/SAMPLE", "person_name": "Your Name Here", "cert_type": "internship",
        "department": "Your Track", "issue_date": date.today().isoformat(), "duration_label": "90 days",
        "custom_detail": "for successfully completing the TFD Internship Program, achieving a program score of 90%",
    }
    pdf_bytes = generate_certificate_pdf(cert_data, f"{SITE_URL}/internship")
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": 'inline; filename="TFD_Internship_Sample_Certificate.pdf"'})


# ── Admin: task pool management ────────────────────────────────────────

@router.get("/admin/tasks", response_model=list[TaskPoolAdminOut])
async def admin_list_tasks(track: str = Query(default=None), _admin: dict = Depends(require_admin)):
    query = {"track": track} if track else {}
    cursor = internship_task_pool_collection.find(query).sort("created_at", -1)
    return [await _to_task_pool_admin_out(doc) async for doc in cursor]


@router.post("/admin/tasks", response_model=TaskPoolAdminOut)
async def admin_create_task(data: TaskPoolIn, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()), **data.dict(),
        "created_by": admin["sub"], "created_at": datetime.now(timezone.utc),
    }
    await internship_task_pool_collection.insert_one(doc)
    return await _to_task_pool_admin_out(doc)


@router.put("/admin/tasks/{task_id}", response_model=TaskPoolAdminOut)
async def admin_update_task(task_id: str, data: TaskPoolIn, _admin: dict = Depends(require_admin)):
    existing = await internship_task_pool_collection.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    await internship_task_pool_collection.update_one({"id": task_id}, {"$set": data.dict()})
    updated = await internship_task_pool_collection.find_one({"id": task_id})
    return await _to_task_pool_admin_out(updated)


@router.delete("/admin/tasks/{task_id}")
async def admin_delete_task(task_id: str, _admin: dict = Depends(require_admin)):
    result = await internship_task_pool_collection.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}


# ── Admin: submission review ────────────────────────────────────────────

async def _to_submission_out(doc: dict) -> SubmissionOut:
    photo_url = presigned_url(doc["photo_r2_key"]) if doc.get("photo_r2_key") else None
    return SubmissionOut(
        id=doc["id"], student_id=doc["student_id"], student_name=doc.get("student_name", ""),
        task_id=doc["task_id"], task_title=doc.get("task_title", ""), track=doc.get("track", ""),
        week_number=doc["week_number"], text_answer=doc.get("text_answer"), photo_url=photo_url,
        gps=doc.get("gps"), client_timestamp=doc.get("client_timestamp"), submitted_at=doc["submitted_at"],
        status=doc.get("status", "pending"), verified_by=doc.get("verified_by"), admin_note=doc.get("admin_note"),
        points_awarded=doc.get("points_awarded"), reviewed_at=doc.get("reviewed_at"),
    )


@router.get("/admin/submissions", response_model=list[SubmissionOut])
async def admin_list_submissions(status: str = Query(default=None), _admin: dict = Depends(require_admin)):
    # Drafts are in-progress, unfinished work — never shown to admins unless
    # explicitly filtered for, so the review queue only ever has real,
    # student-confirmed submissions in it.
    query = {"status": status} if status else {"status": {"$ne": "draft"}}
    cursor = internship_submissions_collection.find(query).sort("submitted_at", -1)
    return [await _to_submission_out(doc) async for doc in cursor]


@router.patch("/admin/submissions/{submission_id}/review", response_model=SubmissionOut)
async def admin_review_submission(submission_id: str, data: SubmissionReviewIn, admin: dict = Depends(require_admin)):
    """Every submission is already auto-verified on arrival (see
    create_submission) — this exists purely as a manual override an admin
    can use any time to correct an AI decision, not a required review gate.
    No wallet/payment is involved anywhere in this program — points are an
    internal, non-monetary progress score only."""
    sub = await internship_submissions_collection.find_one({"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    task = await internship_task_pool_collection.find_one({"id": sub["task_id"]})
    points = data.points_awarded if data.points_awarded is not None else (task.get("points_value", 0) if task else 0)
    now = datetime.now(timezone.utc)

    await internship_submissions_collection.update_one(
        {"id": submission_id},
        {"$set": {
            "status": data.status, "verified_by": "admin", "admin_note": data.admin_note, "admin_reviewer_id": admin["sub"],
            "points_awarded": points if data.status == "approved" else None, "reviewed_at": now,
        }},
    )

    updated = await internship_submissions_collection.find_one({"id": submission_id})
    return await _to_submission_out(updated)


# ── Admin: quiz question bank management ──────────────────────────────

@router.get("/admin/quiz-questions", response_model=list[QuizQuestionAdminOut])
async def admin_list_quiz_questions(track: str = Query(default=None), _admin: dict = Depends(require_admin)):
    query = {"track": track} if track else {}
    cursor = internship_quiz_questions_collection.find(query).sort("created_at", -1)
    return [QuizQuestionAdminOut(**doc) async for doc in cursor]


@router.post("/admin/quiz-questions", response_model=QuizQuestionAdminOut)
async def admin_create_quiz_question(data: QuizQuestionIn, _admin: dict = Depends(require_admin)):
    if data.correct_index >= len(data.options):
        raise HTTPException(status_code=400, detail="correct_index must point to one of the provided options")
    doc = {"id": str(uuid.uuid4()), **data.dict(), "created_at": datetime.now(timezone.utc)}
    await internship_quiz_questions_collection.insert_one(doc)
    return QuizQuestionAdminOut(**doc)


@router.put("/admin/quiz-questions/{question_id}", response_model=QuizQuestionAdminOut)
async def admin_update_quiz_question(question_id: str, data: QuizQuestionIn, _admin: dict = Depends(require_admin)):
    if data.correct_index >= len(data.options):
        raise HTTPException(status_code=400, detail="correct_index must point to one of the provided options")
    existing = await internship_quiz_questions_collection.find_one({"id": question_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Question not found")
    await internship_quiz_questions_collection.update_one({"id": question_id}, {"$set": data.dict()})
    updated = await internship_quiz_questions_collection.find_one({"id": question_id})
    return QuizQuestionAdminOut(**updated)


@router.delete("/admin/quiz-questions/{question_id}")
async def admin_delete_quiz_question(question_id: str, _admin: dict = Depends(require_admin)):
    result = await internship_quiz_questions_collection.delete_one({"id": question_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"status": "deleted"}


# ── Admin: warn / ban ────────────────────────────────────────────────────

@router.patch("/admin/students/{student_id}/warn")
async def admin_warn_student(student_id: str, data: WarnBanIn, admin: dict = Depends(require_admin)):
    doc = await internship_students_collection.find_one({"id": student_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    now = datetime.now(timezone.utc)
    await internship_students_collection.update_one(
        {"id": student_id},
        {
            "$inc": {"warning_count": 1},
            "$push": {"warnings": {"reason": data.reason, "by": admin["sub"], "at": now}},
            "$set": {"updated_at": now},
        },
    )
    updated = await internship_students_collection.find_one({"id": student_id})
    return _to_student_out(updated)


@router.patch("/admin/students/{student_id}/ban")
async def admin_ban_student(student_id: str, data: WarnBanIn, admin: dict = Depends(require_admin)):
    doc = await internship_students_collection.find_one({"id": student_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    now = datetime.now(timezone.utc)
    await internship_students_collection.update_one(
        {"id": student_id},
        {"$set": {"status": "banned", "ban_reason": data.reason, "banned_at": now, "updated_at": now}},
    )
    updated = await internship_students_collection.find_one({"id": student_id})
    return _to_student_out(updated)


@router.patch("/admin/students/{student_id}/unban")
async def admin_unban_student(student_id: str, admin: dict = Depends(require_admin)):
    doc = await internship_students_collection.find_one({"id": student_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    await internship_students_collection.update_one(
        {"id": student_id},
        {"$set": {"status": "active", "ban_reason": None, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await internship_students_collection.find_one({"id": student_id})
    return _to_student_out(updated)
