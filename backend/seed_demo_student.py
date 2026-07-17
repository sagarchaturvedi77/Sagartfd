"""Creates the permanent TFD Internship demo account — a fixed, always-
available login used to walk someone through the whole student portal
without ever touching a real student's account.

Not a throwaway: this account exists forever. Its data is NOT permanent
though — every time anyone logs into it (see login()'s is_demo branch in
internship_routes.py), the backend automatically wipes its submissions,
quiz attempts, reports, warnings, and certificate, and resets it back to a
fresh Day-1 state. So a demo session behaves exactly like a real student
account (real submissions, real AI verification, real everything) while
never accumulating leftover data between demos.

The demo account can also switch between all 4 tracks freely at any time
(normal accounts lock in on first pick) — see select_track()'s is_demo
branch — so one login can show off Finance, Marketing, Sales, and HR content
without needing 4 separate accounts.

Safe to re-run — no-ops if the demo account already exists.

Usage: python seed_demo_student.py
"""
import asyncio
from datetime import datetime, timezone

from auth_utils import hash_password
from database import internship_students_collection
from internship_models import DURATION_PRICING, InternshipStudentInDB

DEMO_PHONE = "9000000001"
DEMO_PASSWORD = "TFDDemo@2026"
DEMO_NAME = "Aditya Sharma"
DEMO_EMAIL = "aditya.demo@thefinancialdoctor.in"
DEMO_COLLEGE = "Demo Public College"
DEMO_COURSE_YEAR = "BBA 2nd Year"
DEMO_TRACK = "marketing"
DEMO_DURATION = 90


async def seed():
    existing = await internship_students_collection.find_one({"phone": DEMO_PHONE})
    if existing:
        print(f"Demo account already exists (intern_id: {existing.get('intern_id')}). Skipping.")
        return

    from internship_routes import _gen_intern_id

    now = datetime.now(timezone.utc)
    student = InternshipStudentInDB(
        intern_id=await _gen_intern_id(),
        name=DEMO_NAME, phone=DEMO_PHONE, email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD),
        college=DEMO_COLLEGE, course_year=DEMO_COURSE_YEAR, dob="2003-06-15",
        duration_days=DEMO_DURATION, payment_amount=DURATION_PRICING.get(DEMO_DURATION, 2000),
        track=DEMO_TRACK, track_locked_at=now,
        payment_status="paid", payment_marked_by="seed_script", payment_marked_at=now,
        program_start_date=now, status="active",
        is_demo=True,
    )
    doc = student.dict()
    await internship_students_collection.insert_one(doc)

    print("Demo account created:")
    print(f"  Name:     {DEMO_NAME}")
    print(f"  Phone:    {DEMO_PHONE}")
    print(f"  Password: {DEMO_PASSWORD}")
    print(f"  Intern ID: {student.intern_id}")
    print("  Login at: /internship/login")
    print("  Resets to a clean Day-1 state automatically on every login.")


if __name__ == "__main__":
    asyncio.run(seed())
