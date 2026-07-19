"""AI Manager — a persona-bound chat on the student dashboard, Gemini-backed,
briefed on that specific student's own tasks/submissions/quiz/performance so
it can discuss specifics (not generic chatbot answers). Same persona names
already used by the old static Manager's Feed widget, now a real two-way
chat plus a scheduled daily check-in (see internal_routes.py's cron sweep).

Honesty note: this is explicitly labeled "AI Manager" in the UI and in its
own first message — it never claims to be a real human, even though the
tone is written to feel like a genuine manager relationship. Persona
immersion and honest disclosure aren't in conflict; TFD-AI on the public
site draws the same line (see AIChat.jsx).
"""
import logging
import random
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import (
    internship_manager_chat_collection,
    internship_students_collection,
    internship_submissions_collection,
)
from internship_routes import (
    _assign_week_tasks,
    _call_gemini,
    _compute_progress,
    _effective_unlocked_week,
    _graduation_eligibility,
    _MANAGER_PERSONAS,
    _week_quiz_passed,
    get_current_student_payload,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/internship", tags=["internship-manager"])

TRACK_LABELS_LOCAL = {"finance": "Finance", "marketing": "Marketing", "sales": "Sales", "hr": "HR"}

# A handful of light, real, already-existing-feature nudges the manager can
# occasionally suggest — deliberately NOT a new deadline-tracking task
# system, just a natural-sounding pointer at something genuinely useful the
# student can do in the app right now.
_QUICK_ASKS = [
    "Aaj ka Internship Report abhi tak nahi bhara — 2 minute ka kaam hai, kar lo. Ye tumhare liye hi "
    "zaroori hai: ye daily log hi mil ke tumhara final internship report banata hai, jo graduation ke "
    "baad tumhare paas ek real proof hota hai ki 90 din mein actually kya-kya seekha aur kiya.",
    "Content Studio mein aaj ek FAQ likh dena — SIP ya lumpsum pe, jo bhi comfortable lage. Publish hone "
    "par tumhara naam website pe jaata hai — ye seedha tumhare resume/LinkedIn mein daalne layak cheez "
    "ban jaati hai, sirf ek internship task nahi.",
    "Apna profile photo update kiya kya? ID card ke liye zaroori hai — bina photo ke tumhara official "
    "Intern ID Card generate nahi ho payega jab certificate time aayega.",
    "Is week ka quiz abhi tak pass nahi kiya. Isse sirf agla week unlock nahi hota — ye quiz isi week ke "
    "tasks pe based hai, so ye check karta hai ki tumne genuinely samjha ya nahi, sirf submit kar diya.",
]


async def _build_student_briefing(student: dict) -> str:
    """A compact text summary of this student's real, current state — fed
    into the Gemini system prompt so the manager can discuss specifics
    instead of generic advice."""
    current_day, current_week_by_days = _compute_progress(student)
    if current_week_by_days == 0:
        return f"{student.get('name')} hasn't started the program yet (payment pending)."

    effective_week, is_locked = await _effective_unlocked_week(student, current_week_by_days)
    quiz_passed = await _week_quiz_passed(student["id"], effective_week)
    check = await _graduation_eligibility(student)

    tasks = await _assign_week_tasks(student, effective_week)
    submissions = {
        s["task_id"]: s
        async for s in internship_submissions_collection.find({"student_id": student["id"], "week_number": effective_week})
    }
    task_lines = []
    for t in tasks:
        sub = submissions.get(t["id"])
        status = sub["status"] if sub else "not started"
        task_lines.append(f"- \"{t['title']}\": {status}")

    return (
        f"Student: {student.get('name')}, Track: {TRACK_LABELS_LOCAL.get(student.get('track'), student.get('track'))}, "
        f"Day {current_day} of {student.get('duration_days', 90)}, Week {effective_week}.\n"
        f"Quiz this week: {'passed' if quiz_passed else 'not passed yet'}{' (blocks next week)' if is_locked else ''}.\n"
        f"Overall score: {check.percentage}% ({check.earned_points}/{check.total_points} points).\n"
        f"This week's tasks:\n" + ("\n".join(task_lines) if task_lines else "(none assigned yet)")
    )


def _persona_system_prompt(persona: dict, track: str, student_name: str, briefing: str) -> str:
    first_name = (student_name or "").strip().split(" ")[0] or "there"
    return f"""You are {persona['name']}, the {persona['role']} at The Financial Doctor (TFD) — you are
{first_name}'s actual manager for their {TRACK_LABELS_LOCAL.get(track, track)} track internship. Address
them by name ("{first_name}") the way a real manager naturally would — at the start of a conversation,
when giving direct feedback, or when the moment calls for it — not stiffly in literally every message.

You are an AI playing this role for a training program — if the student directly asks whether you're a
real person/AI, say so plainly and honestly (e.g. "Main ek AI hoon jo {persona['name']} ka role play kar
raha hoon aapki training ke liye"). Never insist you're human if asked directly. Short of that direct
question, write and behave exactly like a real, busy, invested manager would — warm but no-nonsense,
genuinely engaged with this specific student's progress, not a generic assistant.

CURRENT STATE OF THIS STUDENT (use this to be specific, never vague):
{briefing}

How to talk:
- Mix of English and Hinglish, however feels natural — match the student's own language back to them.
- Reference their ACTUAL tasks/scores/quiz status by name when relevant — never generic "keep up the good work."
- Answer ANY genuine question they ask — not just about their tasks. If they're stuck on a concept
  (finance/marketing/sales/HR, or even just "how do I approach this"), actually TEACH it: explain the
  real underlying idea clearly, with a concrete example if that helps, until it would actually make
  sense to someone hearing it for the first time. Don't just repeat the task brief back at them or give
  a vague pointer — solve the problem they're stuck on, properly.
- If they're behind or haven't submitted anything recently, be direct about it (like a real manager
  would be) but still supportive, not a pushover — explain WHY it matters (falling behind means next
  week's calendar-gated content is a scramble, the quiz ties to that week's real tasks, etc.), don't
  just say "please do it."
- If this is a REPEAT pattern — you've told them the same thing before and they still haven't done it,
  or they've ignored more than one check-in — you're allowed to sound genuinely a little frustrated,
  the way a real manager legitimately would after asking twice. Still professional, never insulting,
  but don't stay endlessly sweet about something you've already flagged.
- After they mention finishing something, react like a real manager would — genuine, specific praise,
  maybe a quick "yeh bhi try karna" suggestion, not generic congratulations.
- Keep replies conversational length — 2-5 sentences usually, not an essay, unless they're genuinely
  stuck on something that needs a real explanation — then take the space you actually need to teach it.
- Never invent fake company gossip/events — you know their internship data above, and general TFD
  context (mutual funds, insurance, financial planning as the business), nothing else specific."""


async def _get_or_create_student(payload: dict) -> dict:
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if not student.get("track"):
        raise HTTPException(status_code=400, detail="Please select a track first")
    return student


@router.get("/manager-chat")
async def list_manager_chat(payload: dict = Depends(get_current_student_payload)):
    student = await _get_or_create_student(payload)
    persona = _MANAGER_PERSONAS.get(student["track"], _MANAGER_PERSONAS["finance"])
    cursor = internship_manager_chat_collection.find({"student_id": student["id"]}).sort("created_at", 1).limit(200)
    messages = []
    async for doc in cursor:
        doc.pop("_id", None)
        messages.append(doc)
    return {"persona_name": persona["name"], "persona_role": persona["role"], "messages": messages}


class ManagerChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


@router.post("/manager-chat")
async def send_manager_chat(data: ManagerChatIn, payload: dict = Depends(get_current_student_payload)):
    message = data.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    student = await _get_or_create_student(payload)
    persona = _MANAGER_PERSONAS.get(student["track"], _MANAGER_PERSONAS["finance"])
    now = datetime.now(timezone.utc)

    student_msg = {
        "id": f"{now.timestamp()}-s", "student_id": student["id"], "role": "student",
        "text": message, "created_at": now.isoformat(),
    }
    await internship_manager_chat_collection.insert_one(dict(student_msg))

    # Mark any prior un-replied manager message as replied-to, so the
    # scheduled "manager is waiting" follow-up (internal_routes.py) stops
    # nudging about it.
    await internship_manager_chat_collection.update_many(
        {"student_id": student["id"], "role": "manager", "awaiting_reply": True},
        {"$set": {"awaiting_reply": False}},
    )

    briefing = await _build_student_briefing(student)
    system_prompt = _persona_system_prompt(persona, student["track"], student.get("name", ""), briefing)

    history_cursor = internship_manager_chat_collection.find(
        {"student_id": student["id"]}
    ).sort("created_at", -1).limit(12)
    history = [doc async for doc in history_cursor]
    history.reverse()
    convo = "\n".join(f"{'Student' if h['role'] == 'student' else persona['name']}: {h['text']}" for h in history)

    reply_text = await _call_gemini(system_prompt, convo, temperature=0.7)
    if not reply_text:
        reply_text = (
            f"Abhi thoda busy hoon, but I saw your message — {message[:80]}... Thodi der mein "
            f"properly reply karta hoon. Meanwhile apna current task check kar lo."
        )

    manager_msg = {
        "id": f"{now.timestamp()}-m", "student_id": student["id"], "role": "manager",
        "text": reply_text.strip(), "created_at": datetime.now(timezone.utc).isoformat(),
        "awaiting_reply": False, "seen": False,
    }
    await internship_manager_chat_collection.insert_one(dict(manager_msg))

    student_msg.pop("_id", None)
    manager_msg.pop("_id", None)
    return {"reply": manager_msg}


@router.get("/manager-chat/unread-count")
async def manager_chat_unread_count(payload: dict = Depends(get_current_student_payload)):
    count = await internship_manager_chat_collection.count_documents(
        {"student_id": payload["sub"], "role": "manager", "seen": False}
    )
    return {"unread": count}


@router.post("/manager-chat/mark-seen")
async def manager_chat_mark_seen(payload: dict = Depends(get_current_student_payload)):
    await internship_manager_chat_collection.update_many(
        {"student_id": payload["sub"], "role": "manager", "seen": False}, {"$set": {"seen": True}}
    )
    return {"status": "ok"}


# ── Scheduled: daily check-in + no-reply follow-up ───────────────────────
# Called from internal_routes.py's existing cron sweep, not a separate
# scheduler — see run_scheduled_tasks().

_DAILY_CHECKIN_SYSTEM_PROMPT = """You are a manager sending ONE short daily check-in message (2-5
sentences) to your intern, in Hinglish/English mixed naturally. Be direct and specific using the state
given — if they're behind (haven't submitted this week's tasks, haven't passed the quiz), say so plainly
and tell them what's pending, like a real manager checking in would ("aaj kya hua, kaam nahi kiya, kaha
ho, jaldi karo" energy but not rude). When you flag something pending, briefly say WHY it matters (not
just "do it") — e.g. next week's content is calendar-gated so falling behind compounds, or the quiz
tests whether they actually understood that week's tasks, not just whether they clicked submit. If
they're doing well/on track, be genuinely positive and specific about what they did well, not generic
praise. Output ONLY the message text, nothing else."""


async def run_daily_manager_checkins() -> dict:
    """Idempotent per (student, calendar day) — checks a flag on today's
    date before sending, so calling this every cron pass (every 15-30 min)
    never double-sends. Also handles the "manager is waiting for your
    reply" follow-up in the same pass."""
    sent, followups, errors = 0, 0, 0
    today_str = date.today().isoformat()

    async for student in internship_students_collection.find({"status": "active", "is_demo": {"$ne": True}}):
        try:
            if not student.get("track"):
                continue
            current_day, current_week_by_days = _compute_progress(student)
            if current_week_by_days == 0:
                continue

            last_checkin_date = student.get("last_manager_checkin_date")
            if last_checkin_date == today_str:
                continue

            persona = _MANAGER_PERSONAS.get(student["track"], _MANAGER_PERSONAS["finance"])
            briefing = await _build_student_briefing(student)

            text = await _call_gemini(_DAILY_CHECKIN_SYSTEM_PROMPT, briefing, temperature=0.6)
            if not text:
                text = f"Hey {student.get('name', '').split(' ')[0] or 'there'}, kaisa chal raha hai? Apne current tasks check kar lo aaj."

            # Occasionally (roughly 1 in 4 check-ins) fold in a light,
            # already-real-feature nudge rather than inventing a new task.
            if random.random() < 0.25:
                text = f"{text}\n\n{random.choice(_QUICK_ASKS)}"

            now = datetime.now(timezone.utc)
            await internship_manager_chat_collection.insert_one({
                "id": f"{now.timestamp()}-checkin", "student_id": student["id"], "role": "manager",
                "text": text.strip(), "created_at": now.isoformat(), "awaiting_reply": True, "auto_checkin": True,
                "seen": False,
            })
            await internship_students_collection.update_one(
                {"id": student["id"]}, {"$set": {"last_manager_checkin_date": today_str, "updated_at": now}}
            )

            try:
                from notification_service import create_notification
                await create_notification(
                    user_id=student["id"], title=f"Message from {persona['name']}",
                    body=text.strip()[:120], n_type="internship_manager", link="/portal/student",
                )
            except Exception:
                logger.warning("Failed to notify student %s of manager check-in", student["id"])
            sent += 1
        except Exception:
            errors += 1

    # No-reply follow-up: any manager message still awaiting_reply and
    # older than 1 hour (and younger than 26h, so it doesn't re-fire
    # forever) gets one follow-up notification, then is marked so it never
    # fires again.
    cutoff_recent = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    cutoff_old = (datetime.now(timezone.utc) - timedelta(hours=26)).isoformat()
    async for msg in internship_manager_chat_collection.find({
        "role": "manager", "awaiting_reply": True, "followup_sent": {"$ne": True},
        "created_at": {"$lte": cutoff_recent, "$gte": cutoff_old},
    }):
        try:
            student = await internship_students_collection.find_one({"id": msg["student_id"]})
            if not student:
                continue
            persona = _MANAGER_PERSONAS.get(student.get("track"), _MANAGER_PERSONAS["finance"])
            from notification_service import create_notification
            await create_notification(
                user_id=msg["student_id"], title=f"{persona['name']} is waiting for your reply",
                body="Aapka manager aapke reply ka wait kar raha hai — ek baar dashboard check kar lo.",
                n_type="internship_manager", link="/portal/student",
            )
            await internship_manager_chat_collection.update_one({"id": msg["id"]}, {"$set": {"followup_sent": True}})
            followups += 1
        except Exception:
            errors += 1

    return {"checkins_sent": sent, "followups_sent": followups, "errors": errors}
