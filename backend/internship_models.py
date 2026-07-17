import re

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import uuid

PAN_PATTERN = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")

Track = Literal["finance", "marketing", "sales", "hr"]

TRACK_LABELS: dict[str, str] = {
    "finance": "Finance",
    "marketing": "Marketing",
    "sales": "Sales",
    "hr": "HR",
}

ProgramStatus = Literal["pending_payment", "active", "graduated", "banned", "dropped"]
PaymentStatus = Literal["pending", "paid", "waived"]

DurationDays = Literal[90]
ALLOWED_DURATIONS = (90,)
DEFAULT_DURATION_DAYS = 90
DURATION_PRICING: dict[int, int] = {90: 5000}


class StudentSignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=15)
    email: str
    password: str = Field(min_length=6)
    college: Optional[str] = None
    course_year: Optional[str] = None
    duration_days: DurationDays = 90
    # Disclosed and captured at signup: every student is told upfront that a
    # short video review of their internship experience will be asked for
    # near the end of the program, and asked whether TFD may feature that
    # video on its social media. Re-confirmable later (not locked in) when
    # they actually submit the video — see VideoReviewIn.
    video_consent: bool = False


class StudentLoginIn(BaseModel):
    phone: str
    password: str


class ForgotPasswordIn(BaseModel):
    email: str


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class TrackSelectIn(BaseModel):
    track: Track


class PaymentOverrideIn(BaseModel):
    note: Optional[str] = None


class DobUpdateIn(BaseModel):
    dob: str = Field(min_length=8, max_length=10)  # "YYYY-MM-DD"


class KycSubmitIn(BaseModel):
    """The mandatory one-time KYC step, gating the rest of the portal until
    completed (see profile_completed) — name/phone/email are already known
    from signup and deliberately not repeated here."""
    dob: str = Field(min_length=8, max_length=10)
    gender: Literal["male", "female"]
    aadhar_number: str
    pan_number: Optional[str] = None
    no_pan: bool = False
    college_id_number: str = Field(min_length=1, max_length=50)

    @field_validator("aadhar_number")
    @classmethod
    def _validate_aadhar(cls, v: str) -> str:
        # Accepts either raw digits or the spaced "XXXX XXXX XXXX" display
        # format the frontend types in — normalizes to 12 plain digits either
        # way, and rejects anything that isn't exactly 12 digits (previously
        # a plain str Field(min_length=12, max_length=14) let up to 14
        # characters of anything through).
        digits = re.sub(r"\D", "", v or "")
        if len(digits) != 12:
            raise ValueError("Aadhaar number must be exactly 12 digits")
        return digits

    @field_validator("pan_number")
    @classmethod
    def _validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        cleaned = v.strip().upper()
        if not PAN_PATTERN.match(cleaned):
            raise ValueError("PAN must be in the format AAAAA9999A (5 letters, 4 digits, 1 letter)")
        return cleaned


class AgreementSignIn(BaseModel):
    lat: float
    lng: float


class InternshipStudentInDB(BaseModel):
    """Credentials live directly on this collection — deliberately NOT in
    users_collection. The internship program has its own login, separate
    from TFD Workspace (staff CRM) auth, since it's headed for its own APK.
    Admins still manage this data from inside the staff portal (their own
    admin login is unaffected), but a student account has no relationship
    to users_collection/Role at all."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    intern_id: str
    name: str
    phone: str
    email: str
    password_hash: str
    college: Optional[str] = None
    course_year: Optional[str] = None
    dob: Optional[str] = None
    photo_r2_key: Optional[str] = None
    gender: Optional[str] = None  # "male" | "female"
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    no_pan: bool = False  # "I don't have a PAN card" — makes pan_number optional
    college_id_number: Optional[str] = None
    agreement_signature_r2_key: Optional[str] = None
    agreement_signed_at: Optional[datetime] = None
    agreement_signed_location: Optional[str] = None  # "lat, lng" string, same format as the employee agreement
    profile_completed: bool = False  # KYC + agreement both done — gates the rest of the portal
    duration_days: DurationDays = 90
    track: Optional[Track] = None
    track_locked_at: Optional[datetime] = None
    payment_status: PaymentStatus = "pending"
    payment_amount: int = 2000
    payment_marked_by: Optional[str] = None
    payment_marked_at: Optional[datetime] = None
    program_start_date: Optional[datetime] = None
    status: ProgramStatus = "pending_payment"
    warning_count: int = 0
    ban_reason: Optional[str] = None
    banned_at: Optional[datetime] = None
    assigned_tasks: dict = Field(default_factory=dict)
    quiz_pass_count: int = 0
    last_quiz_score: Optional[float] = None
    radar_scores: dict = Field(default_factory=dict)
    certificate_id: Optional[str] = None
    letter_id: Optional[str] = None
    report_id: Optional[str] = None
    video_consent: bool = False
    video_review_url: Optional[str] = None
    video_review_submitted_at: Optional[datetime] = None
    is_demo: bool = False  # a fixed, always-available walkthrough account — see seed_demo_student.py
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StudentOut(BaseModel):
    id: str
    intern_id: str
    name: str
    phone: str
    email: str
    college: Optional[str] = None
    course_year: Optional[str] = None
    dob: Optional[str] = None
    photo_url: Optional[str] = None
    gender: Optional[str] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    no_pan: bool = False
    college_id_number: Optional[str] = None
    agreement_signed_at: Optional[datetime] = None
    agreement_signed_location: Optional[str] = None
    profile_completed: bool = False
    duration_days: int = 90
    track: Optional[str] = None
    track_label: Optional[str] = None
    payment_status: PaymentStatus
    payment_amount: int
    program_start_date: Optional[datetime] = None
    program_end_date: Optional[datetime] = None
    current_day: int = 0
    current_week: int = 0
    status: ProgramStatus
    warning_count: int = 0
    quiz_pass_count: int = 0
    radar_scores: dict = Field(default_factory=dict)
    certificate_id: Optional[str] = None
    letter_id: Optional[str] = None
    report_id: Optional[str] = None
    video_consent: bool = False
    video_review_url: Optional[str] = None
    video_review_submitted_at: Optional[datetime] = None
    is_demo: bool = False
    created_at: datetime


# ── Task pool / weekly missions / submissions ────────────────────────────
# No payment/wallet to students — points are an internal, non-monetary
# progress score only (used later for the leaderboard/radar chart), never
# paid out.

DeliverableType = Literal["text", "photo", "text_and_photo", "spreadsheet", "text_and_spreadsheet"]
Difficulty = Literal["easy", "medium", "hard"]
SubmissionStatus = Literal["draft", "pending", "approved", "rejected"]
VerifiedBy = Literal["ai", "admin"]
# 1 = guided (Day 1-30), 2 = independent (Day 31-60), 3 = capstone (Day 61-90+)
# — mirrors a real career progression. Optional/nullable so tracks not yet
# reworked onto the curated pool (see _assign_week_tasks's phase_tagged
# check) keep behaving exactly as before. Phase 3 has two flavours,
# distinguished by the separate `is_blindfold` flag below rather than a 4th
# phase number — "3B / Grand Finale" is still phase 3 (same day range), just
# with hints/sample-solution/Hinglish stripped and a moderately (not
# perfectionist-ly) higher grading bar. See _phase_for_week.
TaskPhase = Literal[1, 2, 3]


class TaskPoolIn(BaseModel):
    track: Track
    title: str = Field(min_length=3, max_length=150)
    brief: str = Field(min_length=10)
    instructions: Optional[str] = None
    why_it_matters: Optional[str] = None  # what skill this builds and why it's useful anywhere, not just at TFD
    deliverable_type: DeliverableType = "text_and_photo"
    requires_geotag: bool = True
    points_value: int = Field(default=50, ge=0, le=1000)
    difficulty: Difficulty = "medium"
    estimated_duration: Optional[str] = None  # e.g. "20-30 mins", "1-2 hours"
    is_active: bool = True
    phase: Optional[TaskPhase] = None
    # "Grand Finale / Blindfold" — a phase-3 task done independently with no
    # hints, no sample solution, and English-locked (see _to_task_pool_out,
    # LanguageToggle's disabled prop). Grading is moderately stricter, not
    # perfectionist — see _auto_verify_spreadsheet/_auto_verify_text.
    is_blindfold: bool = False
    # Starter grid data (rows/cols/headers/prefilled/locked_cells) for
    # "spreadsheet"/"text_and_spreadsheet" tasks — see SpreadsheetGrid.jsx.
    spreadsheet_template: Optional[dict] = None
    # Grading key (expected cell values + structural checks) — admin/server
    # only, never sent to students. Input-only: TaskPoolIn is what an admin
    # POSTs, TaskPoolOut is what a student receives (see TaskPoolAdminOut
    # below for the admin-facing read model that also carries this).
    # A "cells" entry may also carry an optional "mistake_note" — a specific,
    # business-impact explanation shown to the student if THAT cell is what
    # failed (see _auto_verify_spreadsheet). Falls back to mistake_explanation
    # below when no per-cell note is set.
    spreadsheet_answer_key: Optional[dict] = None
    # General "why this is wrong + real business impact" note, authored by
    # whoever writes the task, shown to the student on rejection alongside
    # the auto-grader's own reason — not just a score, an explanation of
    # what actually goes wrong in a real job if this mistake ships.
    mistake_explanation: Optional[str] = None
    # 2-3 progressively-revealing hints, admin-authored — stripped from the
    # student-facing TaskPoolOut for blindfold tasks (see _to_task_pool_out).
    hints: Optional[list[str]] = None
    # A worked-example explanation students can peek at on demand — same
    # blindfold-stripping as hints. Not a graded field; free text, can
    # reference formulas/values in prose for spreadsheet tasks.
    sample_solution: Optional[str] = None


class TaskPoolOut(BaseModel):
    id: str
    track: str
    track_label: str
    title: str
    brief: str
    instructions: Optional[str] = None
    why_it_matters: Optional[str] = None
    deliverable_type: DeliverableType
    requires_geotag: bool
    points_value: int
    difficulty: Difficulty
    estimated_duration: Optional[str] = None
    is_active: bool
    created_at: datetime
    phase: Optional[TaskPhase] = None
    is_blindfold: bool = False
    spreadsheet_template: Optional[dict] = None
    mistake_explanation: Optional[str] = None
    # Both stripped to None for blindfold tasks before this reaches the
    # student — see _to_task_pool_out in internship_routes.py.
    hints: Optional[list[str]] = None
    sample_solution: Optional[str] = None


class TaskPoolAdminOut(TaskPoolOut):
    """Same reasoning as QuizQuestionOut/QuizQuestionAdminOut (see below) —
    spreadsheet_answer_key must never reach the student-facing TaskPoolOut,
    only the admin task-management screens."""
    spreadsheet_answer_key: Optional[dict] = None


class SubmissionIn(BaseModel):
    task_id: str
    week_number: int
    text_answer: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_accuracy: Optional[float] = None
    client_timestamp: Optional[str] = None


class SubmissionDraftIn(BaseModel):
    """Saves in-progress text without triggering AI verification — a
    student can type a bit, save, come back later, type more, save again,
    with no requirement to finish in one sitting. The real 'Confirm Submit'
    (SubmissionIn/POST /submissions) is what actually gets graded."""
    task_id: str
    week_number: int
    text_answer: str = ""
    spreadsheet_data: Optional[str] = None  # JSON string of {cellId: {input, value}}


class SubmissionReviewIn(BaseModel):
    status: Literal["approved", "rejected"]
    admin_note: Optional[str] = None
    points_awarded: Optional[int] = None


class SubmissionOut(BaseModel):
    id: str
    student_id: str
    student_name: str
    task_id: str
    task_title: str
    track: str
    week_number: int
    text_answer: Optional[str] = None
    photo_url: Optional[str] = None
    spreadsheet_data: Optional[dict] = None
    gps: Optional[dict] = None
    client_timestamp: Optional[str] = None
    submitted_at: datetime
    status: SubmissionStatus
    verified_by: Optional[VerifiedBy] = None
    admin_note: Optional[str] = None
    points_awarded: Optional[int] = None
    reviewed_at: Optional[datetime] = None


class WarnBanIn(BaseModel):
    reason: str = Field(min_length=3)


class SupportQueryIn(BaseModel):
    message: str = Field(min_length=3, max_length=1000)


# ── Quizzes / drip-lock / radar score ────────────────────────────────────

RadarCategory = Literal["communication", "finance", "technical", "integrity", "execution_speed"]
RADAR_CATEGORY_LABELS: dict[str, str] = {
    "communication": "Communication",
    "finance": "Finance",
    "technical": "Technical",
    "integrity": "Integrity",
    "execution_speed": "Execution Speed",
}
QUIZ_PASS_THRESHOLD = 80.0


class QuizQuestionIn(BaseModel):
    track: Track
    question_text: str = Field(min_length=5, max_length=500)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_index: int = Field(ge=0)
    category: RadarCategory
    is_active: bool = True


class QuizQuestionOut(BaseModel):
    """No correct_index — this is what a student fetches before attempting."""
    id: str
    track: str
    question_text: str
    options: list[str]
    category: RadarCategory


class QuizQuestionAdminOut(QuizQuestionOut):
    correct_index: int
    is_active: bool
    created_at: datetime


class QuizAnswerIn(BaseModel):
    question_id: str
    selected_index: int


class QuizSubmitIn(BaseModel):
    week_number: int
    answers: list[QuizAnswerIn]
    tab_switch_violations: int = 0
    auto_failed: bool = False


class QuizAttemptOut(BaseModel):
    id: str
    student_id: str
    week_number: int
    score_percent: float
    passed: bool
    category_scores: dict
    tab_switch_violations: int
    auto_failed: bool
    started_at: datetime
    submitted_at: datetime


# ── Daily learning report ─────────────────────────────────────────────
# A simple day-by-day log the student fills in themselves — "what did I
# learn today, what did I actually do today" — which together forms their
# internship report over the whole program. One entry per calendar date.

class ReportEntryIn(BaseModel):
    date: str = Field(min_length=8, max_length=10)  # "YYYY-MM-DD"
    what_learned: str = Field(default="", max_length=3000)
    what_did: str = Field(default="", max_length=3000)


class ReportEntryOut(BaseModel):
    id: str
    student_id: str
    date: str
    what_learned: str
    what_did: str
    created_at: datetime
    updated_at: datetime


# ── Graduation / certificate ──────────────────────────────────────────
# Certificate eligibility is a percentage of total possible task
# weightage (points_value), NOT a require-every-task rule — a task missed
# in one week stays completable in a later week (see /tasks/all), and the
# student's score simply reflects however much of the full assigned pool
# they ended up completing by graduation time.

GRADUATION_THRESHOLD = 75.0


class GraduationCheckOut(BaseModel):
    eligible: bool
    already_graduated: bool
    percentage: float
    earned_points: int
    total_points: int
    threshold: float = GRADUATION_THRESHOLD
    days_completed: bool
    current_day: int
    duration_days: int
    reason: Optional[str] = None


class GraduateIn(BaseModel):
    force: bool = False


# ── Cashfree payment (internship signup) ─────────────────────────────────

class PaymentOrderOut(BaseModel):
    order_id: str
    payment_session_id: str
    amount: int
    cashfree_env: str


class PaymentStatusOut(BaseModel):
    order_id: str
    order_status: str  # our payment_orders_collection status: "created"|"paid"|"failed"
    payment_status: str  # the student's own payment_status, for convenience


# ── Certificate regeneration (public, no login — ₹499 via Cashfree) ─────
# Lets a graduated student re-fetch their certificate + internship letter
# by email if they've lost them, without needing to log in — identified
# either by their certificate number, or by at least two of their own KYC
# details (deliberately requiring 2+ to make this hard to enumerate).

class RegenerateSearchIn(BaseModel):
    certificate_number: Optional[str] = None
    college_id_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    aadhar_number: Optional[str] = None


class RegenerateSearchOut(BaseModel):
    found: bool
    certificate_number: Optional[str] = None
    name: Optional[str] = None
    masked_email: Optional[str] = None


# ── End-of-program video review ─────────────────────────────────────────
# Requested, not required for the certificate — a short review of the
# student's internship experience (they're free to include small clips
# from wherever they were working), submitted as a link to wherever they've
# already uploaded it (YouTube/Instagram/Drive), not a raw file upload.
# Consent for TFD to feature it on social media is captured at signup and
# re-confirmable here when they actually submit the link.

class VideoReviewIn(BaseModel):
    video_url: str = Field(min_length=5, max_length=500)
    consent: bool = False
