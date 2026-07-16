"""TFD Internship — gamified 45-day program.

Deliberately separate from the existing interns_collection (KYC-application
-> offer-letter pipeline in certificate_routes.py). Only Day-45 graduation
(a later phase) reaches into the existing certificate/QR-verification
system; nothing here touches interns_collection or certificates_collection.

Auth is ALSO fully separate from TFD Workspace (staff CRM) login: students
are not stored in users_collection and have no Role — this program is
headed for its own standalone app/APK, independent of the staff portal.
Only the admin-facing roster/payment endpoints below use the shared
require_admin staff-auth dependency, because admins manage this data from
inside the existing staff portal; the student-facing endpoints use their
own get_current_student_payload dependency defined in this file.
"""
import io
import logging
import os
import random
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from math import ceil

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer

from activity_service import log_activity
from auth_utils import create_access_token, decode_token, hash_password, require_admin, verify_password
from certificate_pdf import generate_certificate_pdf, generate_internship_program_letter_pdf, generate_internship_report_pdf
from certificate_routes import _next_sequence
from database import (
    certificates_collection,
    internship_quiz_attempts_collection,
    internship_quiz_questions_collection,
    internship_reports_collection,
    internship_students_collection,
    internship_submissions_collection,
    internship_task_pool_collection,
)
from internship_models import (
    DURATION_PRICING,
    GRADUATION_THRESHOLD,
    QUIZ_PASS_THRESHOLD,
    RADAR_CATEGORY_LABELS,
    TRACK_LABELS,
    DobUpdateIn,
    GraduateIn,
    GraduationCheckOut,
    InternshipStudentInDB,
    PaymentOverrideIn,
    QuizAttemptOut,
    QuizQuestionAdminOut,
    QuizQuestionIn,
    QuizQuestionOut,
    QuizSubmitIn,
    ReportEntryIn,
    ReportEntryOut,
    StudentLoginIn,
    StudentOut,
    StudentSignupIn,
    SubmissionDraftIn,
    SubmissionOut,
    SubmissionReviewIn,
    SupportQueryIn,
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
    duration = doc.get("duration_days", 45)
    if not start:
        return 0, 0
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - start).days + 1
    current_day = max(1, min(elapsed, duration))
    current_week = ceil(current_day / 7)
    return current_day, current_week


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
        program_end_date = start + timedelta(days=doc.get("duration_days", 45) - 1)
    photo_url = presigned_url(doc["photo_r2_key"]) if doc.get("photo_r2_key") else None
    return StudentOut(
        id=doc["id"], intern_id=doc.get("intern_id", ""), name=doc["name"], phone=doc["phone"], email=doc["email"],
        college=doc.get("college"), course_year=doc.get("course_year"), dob=doc.get("dob"), photo_url=photo_url,
        duration_days=doc.get("duration_days", 45),
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
        payment_amount=DURATION_PRICING.get(data.duration_days, 2000),
        video_consent=data.video_consent,
    )
    doc = student.dict()
    await internship_students_collection.insert_one(doc)
    doc.pop("_id", None)

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
                "updated_at": now,
            },
            "$unset": {"ban_reason": "", "banned_at": "", "certificate_id": "", "letter_id": "", "report_id": "", "graduated_at": ""},
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
    if doc.get("is_demo"):
        doc = await _reset_demo_student(doc["id"])
    token = create_access_token(doc["id"], "internship_student")
    return {"access_token": token, "token_type": "bearer", "student": _to_student_out(doc)}


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
- 45, 60, or 90-day tracks in Finance, Marketing, Sales, or HR, chosen at signup.
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


@router.patch("/admin/students/{student_id}/payment")
async def mark_paid(student_id: str, data: PaymentOverrideIn, admin: dict = Depends(require_admin)):
    """Manual admin override standing in for the real payment gateway until
    API keys are available — sets Day 1 the moment a seat is confirmed."""
    doc = await internship_students_collection.find_one({"id": student_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    now = datetime.now(timezone.utc)
    await internship_students_collection.update_one(
        {"id": student_id},
        {"$set": {
            "payment_status": "paid", "payment_marked_by": admin["sub"], "payment_marked_at": now,
            "program_start_date": doc.get("program_start_date") or now,
            "status": "active", "updated_at": now,
        }},
    )
    updated = await internship_students_collection.find_one({"id": student_id})
    return _to_student_out(updated)


# ── Weekly task engine & submissions ──────────────────────────────────

async def _to_task_pool_out(doc: dict) -> TaskPoolOut:
    return TaskPoolOut(
        id=doc["id"], track=doc["track"], track_label=TRACK_LABELS.get(doc["track"], doc["track"]),
        title=doc["title"], brief=doc["brief"], instructions=doc.get("instructions"),
        why_it_matters=doc.get("why_it_matters"),
        deliverable_type=doc["deliverable_type"], requires_geotag=doc.get("requires_geotag", True),
        points_value=doc.get("points_value", 50), difficulty=doc.get("difficulty", "medium"),
        estimated_duration=doc.get("estimated_duration"),
        is_active=doc.get("is_active", True), created_at=doc["created_at"],
    )


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

    field_tasks = [t for t in pool if t.get("requires_geotag")]
    sample = []
    if field_tasks:
        sample.append(rng.choice(field_tasks))
    remaining_pool = [t for t in pool if t["id"] not in {s["id"] for s in sample}]
    rng.shuffle(remaining_pool)
    sample.extend(remaining_pool[: max(0, TASKS_PER_WEEK - len(sample))])

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


_VERIFY_SYSTEM_PROMPT = """You are an automatic grader for The Financial Doctor's internship program.
You will be given a task brief and a student's submitted answer. Judge only whether this is a
genuine, on-topic, substantive attempt at the task — not whether it is professionally polished.

Approve if the answer:
- Is clearly attempting the actual task (not empty, not random characters, not just the prompt repeated back).
- Shows some real effort and relevant content, even if brief or imperfect.

Reject only if the answer is empty, gibberish, completely off-topic, or an obvious copy of the task
brief/instructions with nothing added.

Respond with EXACTLY two lines, nothing else:
DECISION: APPROVE  (or)  DECISION: REJECT
REASON: <one short sentence>
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

    text_out = await _call_gemini(_VERIFY_SYSTEM_PROMPT, prompt, temperature=0.1)
    if text_out:
        decision = "APPROVE" in text_out.upper().split("\n")[0]
        reason_line = next((l for l in text_out.split("\n") if l.upper().startswith("REASON:")), "")
        reason = reason_line.split(":", 1)[-1].strip() or "Reviewed by AI"
        return decision, reason, "ai"

    ok = len(text_answer.strip()) >= 15
    return ok, "Auto-checked (AI grading unavailable — basic check used)", "ai"


# ── Voice explain (Hindi + English) ─────────────────────────────────────
# A short, spoken-style explanation of the task in two languages, read
# aloud client-side via the browser's Web Speech API (hi-IN / en-IN voices)
# — generated once per task via Gemini and cached on the task_pool doc, not
# regenerated on every request.

_VOICE_EXPLAIN_SYSTEM_PROMPT = """You are creating a short spoken audio-script explanation of a task for a
college-age intern, in two languages, so it can be read aloud by a text-to-speech engine.

Respond in EXACTLY this format, nothing else — two lines, each starting with the exact label shown:
ENGLISH: <a short spoken-style English explanation, 70-110 words>
HINDI: <a short spoken-style Hindi explanation, 90-140 words, written in Devanagari script>

Rules for both:
- Cover: what this task is about, exactly what the student needs to do, and roughly how to submit it.
- Write it as natural spoken sentences a mentor would say out loud — NOT bullet points, NOT "Step 1/Step 2"
  headers, no markdown.
- Keep sentences short and simple so a TTS engine reads them clearly.

Rules for the Hindi version specifically:
- Use simple, everyday conversational Hindi — the kind actually spoken by a non-fluent-in-English Indian
  college student, not formal/literary/Sanskritized Hindi.
- It's completely fine to naturally mix in common English words the way people actually talk (Hinglish),
  especially for technical terms (e.g. "task", "submit", "photo", "location") — don't force awkward pure-Hindi
  translations of these.
- The goal is maximum easy understanding, not linguistic purity.
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

    now = datetime.now(timezone.utc)
    doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student["id"], "student_name": student["name"],
        "task_id": data.task_id, "task_title": task["title"], "track": task["track"], "week_number": data.week_number,
        "text_answer": data.text_answer.strip() or None,
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

    assigned = (student.get("assigned_tasks") or {}).get(str(week_number), [])
    if task_id not in assigned:
        raise HTTPException(status_code=400, detail="This task isn't assigned to you for this week")

    if task["deliverable_type"] in ("text", "text_and_photo") and not text_answer.strip():
        raise HTTPException(status_code=400, detail="A written answer is required for this task")
    if task["deliverable_type"] in ("photo", "text_and_photo") and not photo:
        raise HTTPException(status_code=400, detail="A photo is required for this task")

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
    needs_text = task["deliverable_type"] in ("text", "text_and_photo")
    approved, reason, verified_by = (
        await _auto_verify_text(task, text_answer) if needs_text
        else (True, "Field task auto-verified: photo received" + (" with location" if gps else ""), "ai")
    )
    if task.get("requires_geotag") and not gps:
        approved, reason = False, "Location wasn't captured with this submission — please allow location access and resubmit."

    doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student["id"], "student_name": student["name"],
        "task_id": task_id, "task_title": task["title"], "track": task["track"], "week_number": week_number,
        "text_answer": text_answer.strip() or None,
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
async def get_leaderboard(payload: dict = Depends(get_current_student_payload)):
    points_by_student: dict[str, int] = {}
    async for sub in internship_submissions_collection.find({"status": "approved"}, {"student_id": 1, "points_awarded": 1}):
        points_by_student[sub["student_id"]] = points_by_student.get(sub["student_id"], 0) + (sub.get("points_awarded") or 0)

    rows = []
    async for s in internship_students_collection.find(
        {"status": {"$in": ["active", "graduated"]}, "is_demo": {"$ne": True}}, {"id": 1, "name": 1, "track": 1, "quiz_pass_count": 1}
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
    duration_days = student.get("duration_days", 45)
    total_weeks = ceil(duration_days / 7)

    total_points = 0
    for week_num in range(1, total_weeks + 1):
        tasks = await _assign_week_tasks(student, week_num)
        total_points += sum(t.get("points_value", 0) for t in tasks)

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
    duration_days = student.get("duration_days", 45)
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
    report_pdf = generate_internship_report_pdf({
        "name": student["name"], "intern_id": student["intern_id"], "track_label": track_label,
        "start_date": student["program_start_date"].date().isoformat() if student.get("program_start_date") else issue_date,
        "end_date": issue_date, "entries": report_entries,
    })
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
        "department": "Your Track", "issue_date": date.today().isoformat(), "duration_label": "45 days",
        "custom_detail": "for successfully completing the TFD Internship Program, achieving a program score of 90%",
    }
    pdf_bytes = generate_certificate_pdf(cert_data, f"{SITE_URL}/internship")
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": 'inline; filename="TFD_Internship_Sample_Certificate.pdf"'})


# ── Admin: task pool management ────────────────────────────────────────

@router.get("/admin/tasks", response_model=list[TaskPoolOut])
async def admin_list_tasks(track: str = Query(default=None), _admin: dict = Depends(require_admin)):
    query = {"track": track} if track else {}
    cursor = internship_task_pool_collection.find(query).sort("created_at", -1)
    return [await _to_task_pool_out(doc) async for doc in cursor]


@router.post("/admin/tasks", response_model=TaskPoolOut)
async def admin_create_task(data: TaskPoolIn, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()), **data.dict(),
        "created_by": admin["sub"], "created_at": datetime.now(timezone.utc),
    }
    await internship_task_pool_collection.insert_one(doc)
    return await _to_task_pool_out(doc)


@router.put("/admin/tasks/{task_id}", response_model=TaskPoolOut)
async def admin_update_task(task_id: str, data: TaskPoolIn, _admin: dict = Depends(require_admin)):
    existing = await internship_task_pool_collection.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    await internship_task_pool_collection.update_one({"id": task_id}, {"$set": data.dict()})
    updated = await internship_task_pool_collection.find_one({"id": task_id})
    return await _to_task_pool_out(updated)


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
