import os
import time
import json
import random
import uuid
import logging
from datetime import datetime, timedelta, timezone

import pytz
from pymongo import MongoClient

try:
    from pywebpush import webpush, WebPushException
    _PYWEBPUSH_OK = True
except Exception:
    _PYWEBPUSH_OK = False

try:
    import httpx
except Exception:
    httpx = None

LOG = logging.getLogger("scheduler")
LOG.setLevel(logging.INFO)

MONGO = os.environ.get("MONGO_URL") or os.environ.get("MONGO_URI")
DB_NAME = os.environ.get("DB_NAME") or os.environ.get("MONGO_DB") or "tfd"
APP_TZ = os.environ.get("APP_TIMEZONE", "Asia/Kolkata")
CHECK_INTERVAL = int(os.environ.get("SCHEDULER_POLL_SECONDS", "30"))
DAILY_HOUR = int(os.environ.get("SCHEDULER_DAILY_HOUR", "17"))  # 17:00 local — punch-out reminder start
MAX_RETRIES = int(os.environ.get("PUSH_MAX_RETRIES", "3"))

if not MONGO:
    raise RuntimeError("MONGO_URL (or MONGO_URI) must be set for scheduler")

client = MongoClient(MONGO)
db = client[DB_NAME]
attendance = db.get_collection("attendance")
push_subscriptions = db.get_collection("push_subscriptions")  # portal (admin/employee) — same collection notification_service.py uses
reminders = db.get_collection("reminders")
leads = db.get_collection("leads")
web_push_subs = db.get_collection("web_push_subs")
scheduler_state = db.get_collection("scheduler_state")
events = db.get_collection("events")  # backend/analytics_routes.py's EventTrack docs (calculator_use, proposal_generate)
targets = db.get_collection("targets")
employee_profiles = db.get_collection("employee_profiles")
notifications = db.get_collection("notifications")  # in-app bell/list — see backend/notification_service.py's NotificationInDB shape

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")
WEBSITE_NOTIF_INTERVAL_DAYS = float(os.environ.get("WEBSITE_NOTIF_INTERVAL_DAYS", "2"))


def send_push_to_user(uid: str, title: str, body: str, url: str | None = None, n_type: str = "scheduled") -> int:
    """Send a VAPID web push to every device the portal user (admin/employee)
    has subscribed from — same push_subscriptions collection and delivery
    mechanism notification_service.py uses for the main app's send path, so
    this worker and the FastAPI app never diverge in behavior. Also writes
    the in-app bell/list record unconditionally (same as
    notification_service.create_notification does) — without this, a
    scheduler-originated notification only ever existed as a push attempt:
    if delivery failed or the device was offline, the user had no way to
    ever see it, since nothing was ever persisted. Returns how many devices
    were successfully sent to."""
    notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "title": title,
        "body": body,
        "type": n_type,
        "link": url or "/portal/employee",
        "read": False,
        "created_at": datetime.utcnow(),
    })

    if not (_PYWEBPUSH_OK and VAPID_PRIVATE_KEY):
        LOG.warning("Web push not configured (pywebpush/VAPID_PRIVATE_KEY) — skipping send to %s", uid)
        return 0
    payload = json.dumps({"title": title, "body": body, "url": url or "/portal/employee"})
    sent = 0
    for sub in list(push_subscriptions.find({"user_id": uid})):
        attempt = 0
        while attempt < MAX_RETRIES:
            try:
                webpush(
                    subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL},
                )
                sent += 1
                break
            except WebPushException as e:
                resp = getattr(e, "response", None)
                # 404/410 = subscription gone; 401/403 = VAPID key mismatch
                # (subscribed against a different server key) — neither is
                # worth retrying, so prune and stop instead of burning
                # MAX_RETRIES on a request that can never succeed.
                if resp is not None and resp.status_code in (401, 403, 404, 410):
                    push_subscriptions.delete_one({"_id": sub["_id"]})
                    break
                attempt += 1
                LOG.warning("Web push failed for %s (attempt %s): %s", uid, attempt, e)
                time.sleep(0.5 * (2 ** attempt))
            except Exception as e:
                attempt += 1
                LOG.exception("Web push error for %s (attempt %s): %s", uid, attempt, e)
                time.sleep(0.5 * (2 ** attempt))
    return sent


def find_open_shifts_local_date(local_date: datetime):
    # attendance documents use 'date' (YYYY-MM-DD) and clock_in/clock_out fields per models
    date_str = local_date.strftime("%Y-%m-%d")
    docs = list(attendance.find({"date": date_str, "clock_in": {"$ne": None}, "clock_out": None}))
    return docs


def notify_open_shifts():
    tz = pytz.timezone(APP_TZ)
    today_local = datetime.now(tz)
    open_shifts = find_open_shifts_local_date(today_local)
    LOG.info("Found %s open shifts for %s", len(open_shifts), today_local.date())
    for a in open_shifts:
        uid = a.get("employee_id") or a.get("employee") or a.get("user_id")
        if not uid:
            continue
        send_push_to_user(uid, "Punch Out Reminder", "Aapne aaj punch out nahi kiya. Kripya punch out karein.", "/portal/employee/attendance", n_type="punch_out")
        # create a reminder entry to send hourly follow-ups until punch_out
        reminders.update_one(
            {"user_id": uid, "type": "punch_out"},
            {"$set": {"user_id": uid, "type": "punch_out", "active": True, "next_send_at": datetime.utcnow() + timedelta(hours=1), "interval_minutes": 60, "created_at": datetime.utcnow()}},
            upsert=True,
        )


def process_due_reminders():
    now = datetime.utcnow()
    due = list(reminders.find({"active": True, "next_send_at": {"$lte": now}}))
    LOG.info("Found %s due reminders", len(due))
    for r in due:
        rtype = r.get("type", "punch_out")
        uid = r.get("user_id")

        if rtype == "punch_out":
            interval = int(r.get("interval_minutes") or 60)
            send_push_to_user(uid, "Punch Out Reminder", "Kripya ab punch out karein — abhi pending hai.", "/portal/employee/attendance", n_type="punch_out")
            next_send = datetime.utcnow() + timedelta(minutes=interval)
            reminders.update_one({"_id": r["_id"]}, {"$set": {"next_send_at": next_send}})
            date_str = datetime.utcnow().astimezone(pytz.timezone(APP_TZ)).strftime("%Y-%m-%d")
            open_today = attendance.find_one({"employee_id": uid, "date": date_str, "clock_out": None})
            if not open_today:
                reminders.update_one({"_id": r["_id"]}, {"$set": {"active": False}})

        elif rtype in ("lead_follow_up", "lead_retry", "service_expiry", "lead_inactivity"):
            # single-shot lead reminders — send once, then deactivate
            title = r.get("title", "Lead Reminder")
            body = r.get("body", "You have a pending lead follow-up.")
            send_push_to_user(uid, title, body, "/portal/employee/leads", n_type=rtype)
            reminders.update_one({"_id": r["_id"]}, {"$set": {"active": False}})

        else:
            # unknown type — deactivate so it doesn't loop forever
            reminders.update_one({"_id": r["_id"]}, {"$set": {"active": False}})


def check_lead_inactivity():
    """Once a day: any open lead (not converted/lost) whose status hasn't
    moved in 5+ days gets a nudge reminder to whoever owns it."""
    cutoff = (datetime.utcnow() - timedelta(days=5)).isoformat()
    stale = list(leads.find({
        "status": {"$nin": ["converted", "lost"]},
        "updated_at": {"$lt": cutoff},
        "assigned_to": {"$ne": None},
    }))
    LOG.info("Found %s inactive leads (5+ days untouched)", len(stale))
    for lead in stale:
        uid = lead.get("assigned_to")
        if not uid:
            continue
        reminders.update_one(
            {"lead_id": lead["id"], "type": "lead_inactivity"},
            {"$set": {
                "user_id": uid,
                "lead_id": lead["id"],
                "type": "lead_inactivity",
                "title": "Lead Needs Attention",
                "body": f"{lead.get('name', 'This lead')} hasn't been updated in 5+ days.",
                "active": True,
                "next_send_at": datetime.utcnow(),
                "created_at": datetime.utcnow(),
            }},
            upsert=True,
        )


def send_weekly_admin_report():
    """Monday morning: one digest per admin summarizing each active
    employee's leads touched/converted this week, attendance, and this
    month's target completion so far."""
    now = datetime.utcnow()
    week_ago = (now - timedelta(days=7)).isoformat()
    week_ago_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")

    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))
    lines = []
    for emp in active_employees:
        uid = emp.get("id")
        name = emp.get("name", emp.get("profile_name", "Employee"))

        touched = leads.count_documents({"assigned_to": uid, "updated_at": {"$gte": week_ago}})
        converted = leads.count_documents({"assigned_to": uid, "status": "converted", "updated_at": {"$gte": week_ago}})
        present_days = attendance.count_documents({"employee_id": uid, "date": {"$gte": week_ago_date}, "clock_in": {"$ne": None}})

        month_targets = list(targets.find({"employee_id": uid, "month": now.month, "year": now.year}))
        avg_pct = round(sum(t.get("progress_pct", 0) for t in month_targets) / len(month_targets)) if month_targets else None

        summary = f"{name}: {touched} leads touched, {converted} converted, {present_days}d present"
        if avg_pct is not None:
            summary += f", {avg_pct}% target"
        lines.append(summary)

    if not lines:
        return

    body = " | ".join(lines[:8]) + (f" +{len(lines) - 8} more" if len(lines) > 8 else "")
    for admin in users.find({"role": "admin"}):
        send_push_to_user(
            admin["id"],
            "Weekly Team Report",
            body,
            "/portal/admin/reports?range=week",
            n_type="weekly_report",
        )


users = db.get_collection("users")
MORNING_HOUR = int(os.environ.get("SCHEDULER_MORNING_HOUR", "9"))
SUNDAY_MESSAGES = [
    "Happy Sunday! Aaj apna time enjoy karein. Kal phir se josh ke saath!",
    "Itwar hai — relax karein, family ke saath time spend karein. See you Monday!",
    "Sunday Funday! Achhe se rest karein, Monday ko full energy ke saath aayein!",
]


def send_daily_morning_notifications():
    """9 AM: Send motivation to all active employees on working days, enjoy msg on Sunday."""
    tz = pytz.timezone(APP_TZ)
    now_local = datetime.now(tz)
    is_sunday = now_local.weekday() == 6

    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))
    LOG.info("Sending morning notifications to %s employees (sunday=%s)", len(active_employees), is_sunday)

    import random
    for emp in active_employees:
        uid = emp.get("id")
        name = emp.get("name", emp.get("profile_name", ""))

        if is_sunday:
            msg = random.choice(SUNDAY_MESSAGES)
            title = "Happy Sunday!"
        else:
            title, msg = generate_employee_motivation_content(name)
            if name and "Good Morning" in title and name not in title:
                title = f"Good Morning, {name}!"

        send_push_to_user(uid, title, msg, "/portal/employee", n_type="motivation")


def send_followup_reminders():
    """9 AM on working days: tell each employee how many follow-ups they have today."""
    tz = pytz.timezone(APP_TZ)
    now_local = datetime.now(tz)
    if now_local.weekday() == 6:
        return

    today_str = now_local.strftime("%Y-%m-%d")
    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))

    for emp in active_employees:
        uid = emp.get("id")
        name = emp.get("name", emp.get("profile_name", ""))

        followup_count = leads.count_documents({
            "assigned_to": uid,
            "status": "follow_up",
            "$or": [
                {"follow_up_date": today_str},
                {"follow_up_date": {"$lte": today_str}, "status": "follow_up"},
            ]
        })

        if followup_count > 0:
            title = f"Aaj ke Follow-ups: {followup_count}"
            body = f"{name}, aapke paas aaj {followup_count} follow-up hain. Bhool mat jaana — har call important hai!"
            send_push_to_user(uid, title, body, "/portal/employee/leads", n_type="followup_digest")


def send_followup_miss_check():
    """Evening (DAILY_HOUR, same slot as punch-out reminders): any lead that
    was due for follow-up today and is still sitting in "follow_up" status
    hasn't been actioned — nudge whoever owns it."""
    tz = pytz.timezone(APP_TZ)
    now_local = datetime.now(tz)
    today_str = now_local.strftime("%Y-%m-%d")
    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))

    for emp in active_employees:
        uid = emp.get("id")
        missed_count = leads.count_documents({
            "assigned_to": uid,
            "status": "follow_up",
            "follow_up_date": {"$lte": today_str},
        })
        if missed_count > 0:
            send_push_to_user(
                uid,
                "Follow-ups Pending",
                f"Aapne aaj {missed_count} follow-up ka status update nahi kiya. Din khatam hone se pehle update kar lijiye!",
                "/portal/employee/leads",
                n_type="followup_missed",
            )


def send_employee_progress_report(period: str):
    """period: 'weekly' or 'monthly' — digest of target completion % and
    leads converted, sent to every active employee, linking to a personal
    progress view (EmployeeTargets.jsx opens a summary modal on ?report=1)."""
    now = datetime.utcnow()
    if period == "weekly":
        since = (now - timedelta(days=7)).isoformat()
        title = "Your Weekly Progress"
    else:
        since = now.replace(day=1).isoformat()
        title = "Your Monthly Progress"

    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))
    for emp in active_employees:
        uid = emp.get("id")
        converted = leads.count_documents({"assigned_to": uid, "status": "converted", "updated_at": {"$gte": since}})
        month_targets = list(targets.find({"employee_id": uid, "month": now.month, "year": now.year}))
        avg_pct = round(sum(t.get("progress_pct", 0) for t in month_targets) / len(month_targets)) if month_targets else None

        body = f"{converted} leads converted"
        if avg_pct is not None:
            body += f", {avg_pct}% of this month's target achieved"
        body += ". Tap to see your full report."
        send_push_to_user(uid, title, body, "/portal/employee/targets?report=1", n_type="progress_report")


def send_employee_birthday_wishes():
    """Once daily, early morning: match each active employee's dob
    (month+day, year ignored) against today and send a personal wish. dob
    lives in the employee_profiles collection (set during onboarding — see
    onboarding_routes.py), not on the users document itself."""
    tz = pytz.timezone(APP_TZ)
    today_local = datetime.now(tz)
    today_md = today_local.strftime("%m-%d")

    active_employees = list(users.find({"role": "employee", "is_active": {"$ne": False}}))
    for emp in active_employees:
        uid = emp.get("id")
        profile = employee_profiles.find_one({"user_id": uid})
        dob = profile.get("dob") if profile else None
        if not dob or len(dob) < 10 or dob[5:10] != today_md:
            continue
        name = emp.get("name", "there")
        send_push_to_user(
            uid,
            f"Happy Birthday, {name}! 🎉",
            "TFD Workspace ki puri team ki taraf se aapko dher saari shubhkamnayein! Aapka din shandaar ho.",
            "/portal/employee?birthday=1",
            n_type="birthday",
        )


# ── Automated website visitor notifications (Gemini-generated, Hinglish) ──

WEBSITE_NOTIF_TOPICS = [
    "SIP (Systematic Investment Plan) shuru karne ke fayde",
    "Lumpsum investment kab aur kaise karein",
    "Term Insurance kyu zaroori hai har kamaane wale ke liye",
    "Health Insurance / Mediclaim ki ahmiyat medical emergency mein",
    "Financial discipline aur paisa bachane ki motivation",
    "TFD se ek free personalised financial proposal banwaayein",
]


def _extract_gemini_text(data: dict) -> str:
    """The Gemini `/v1beta/interactions` endpoint does NOT return a top-level
    `output_text` field (verified against the live API) — the answer is
    nested in `steps[]`, in the entry with type == "model_output". See the
    identical helper in server.py for the AI chat endpoint."""
    for step in data.get("steps", []):
        if step.get("type") == "model_output":
            parts = step.get("content") or []
            texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
            if texts:
                return "".join(texts).strip()
    return ""


def _generate_hinglish_notification(topics: list[str], persona: str, fallback: tuple[str, str]) -> tuple[str, str]:
    """Shared Gemini content-generation core — returns (title, body) in
    Hinglish, a different topic picked each call so rotating notifications
    never feel repeated. Falls back to a canned message if Gemini isn't
    configured or the call fails, so a send is never silently skipped just
    because of that. `persona` frames who the message is from/about."""
    topic = random.choice(topics)
    if not (GEMINI_API_KEY and httpx):
        return fallback
    try:
        prompt = (
            f"Ek chhota mobile push notification likho, Hinglish (Roman script Hindi + English mix) mein, "
            f"is topic par: \"{topic}\". Title max 40 characters, body max 110 characters. "
            f"{persona} "
            f"Sirf is exact JSON format mein jawab do, kuch aur text nahi: {{\"title\": \"...\", \"body\": \"...\"}}"
        )
        resp = httpx.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY},
            json={"model": GEMINI_MODEL, "input": prompt, "generation_config": {"temperature": 0.9}},
            timeout=20.0,
        )
        if resp.status_code != 200:
            LOG.warning("Gemini notification call failed: %s", resp.text)
            return fallback
        text = _extract_gemini_text(resp.json())
        parsed = json.loads(text[text.find("{"): text.rfind("}") + 1])
        title = (parsed.get("title") or fallback[0]).strip()[:60] or fallback[0]
        body = (parsed.get("body") or fallback[1]).strip()[:150] or fallback[1]
        return title, body
    except Exception as e:
        LOG.exception("Gemini notification generation failed: %s", e)
        return fallback


def generate_website_notification_content() -> tuple[str, str]:
    """Returns (title, body) in Hinglish via Gemini for website visitors."""
    return _generate_hinglish_notification(
        WEBSITE_NOTIF_TOPICS,
        persona=(
            "Ye The Financial Doctor (TFD) ki taraf se ja raha hai — ek AMFI-registered mutual fund distributor "
            "(Sagar Chaturvedi, Sehore MP). Guaranteed returns ka wada mat karo, koi specific fund/scheme "
            "recommend mat karo, sirf general awareness/motivation do."
        ),
        fallback=("The Financial Doctor", "Apne financial goals ke liye sahi planning zaroori hai — TFD se free consultation lein!"),
    )


EMPLOYEE_MOTIVATION_TOPICS = [
    "Sales calls mein confidence kaise banayein",
    "Monthly target achieve karne ki strategy",
    "Promotion aur growth ke liye kya karna chahiye",
    "Incentive aur commission maximize karne ke tips",
    "Client ke saath trust building",
    "Follow-up disciplined tarike se karne ki ahmiyat",
    "Har din thoda better banne ki soch",
]


def generate_employee_motivation_content(name: str) -> tuple[str, str]:
    """Returns (title, body) in Hinglish via Gemini for the daily employee
    motivation push — rotates topic each day so it's never the same message
    twice in a row, unlike the previous static MORNING_MESSAGES list."""
    return _generate_hinglish_notification(
        EMPLOYEE_MOTIVATION_TOPICS,
        persona=(
            f"Ye The Financial Doctor (TFD) ki taraf se apne employee '{name}' ko roz subah bheja jaane wala "
            f"motivational message hai — sales, targets, promotion ya incentive se related. Josh badhane wala, "
            f"positive tone rakho, employee ka naam body mein use mat karo (title mein already hai)."
        ),
        fallback=("Good Morning!", "Aaj ka din productive banayein. Targets achieve karein!"),
    )


def _send_visitor_push(sub: dict, title: str, body: str, url: str) -> bool:
    """Send one VAPID push to a single website-visitor subscription (web_push_subs
    collection, keyed by visitor_id — not a portal user). Returns True if the
    push service accepted it. Prunes the subscription on 401/403/404/410."""
    if not (_PYWEBPUSH_OK and VAPID_PRIVATE_KEY):
        return False
    payload = json.dumps({"title": title, "body": body, "url": url})
    try:
        webpush(
            subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIM_EMAIL},
        )
        return True
    except WebPushException as e:
        resp = getattr(e, "response", None)
        if resp is not None and resp.status_code in (401, 403, 404, 410):
            web_push_subs.delete_one({"_id": sub["_id"]})
        else:
            LOG.warning("Visitor push error: %s", e)
    except Exception as e:
        LOG.warning("Visitor push error: %s", e)
    return False


def send_calculator_followups():
    """Any calculator_use event (with a visitor_id, from the Phase 0
    correlation plumbing) that's 2 hours to 3 days old and hasn't been
    followed up yet gets a one-shot nudge, if that visitor is still
    subscribed to website push. Marks followed_up on the event either way,
    so a visitor with no active subscription doesn't get re-checked forever."""
    now = datetime.now(timezone.utc)
    recent_enough = (now - timedelta(hours=2)).isoformat()
    not_too_old = (now - timedelta(days=3)).isoformat()
    candidates = list(events.find({
        "event": "calculator_use",
        "visitor_id": {"$ne": None},
        "followed_up": {"$ne": True},
        "ts": {"$lte": recent_enough, "$gte": not_too_old},
    }))
    LOG.info("Found %s calculator_use events due for follow-up", len(candidates))
    for ev in candidates:
        sub = web_push_subs.find_one({"visitor_id": ev["visitor_id"]})
        if sub:
            label = ev.get("label") or "calculator"
            _send_visitor_push(
                sub,
                "Investment start karne ka time!",
                f"Aapne {label} use kiya tha — ab investment start karne mein der kis baat ki?",
                "https://thefinancialdoctor.in/#calculators",
            )
        events.update_one({"_id": ev["_id"]}, {"$set": {"followed_up": True}})


def send_proposal_followups():
    """Same shape as send_calculator_followups but for proposal_generate
    events, delayed ~24h per the user's spec ('1 din baad follow-up')."""
    now = datetime.now(timezone.utc)
    recent_enough = (now - timedelta(hours=24)).isoformat()
    not_too_old = (now - timedelta(days=4)).isoformat()
    candidates = list(events.find({
        "event": "proposal_generate",
        "visitor_id": {"$ne": None},
        "followed_up": {"$ne": True},
        "ts": {"$lte": recent_enough, "$gte": not_too_old},
    }))
    LOG.info("Found %s proposal_generate events due for follow-up", len(candidates))
    for ev in candidates:
        sub = web_push_subs.find_one({"visitor_id": ev["visitor_id"]})
        if sub:
            _send_visitor_push(
                sub,
                "Proposal kaisa laga?",
                "Kal aapne apna financial proposal banaya tha — ab SIP start karne ka sahi waqt hai!",
                "https://thefinancialdoctor.in/",
            )
        events.update_one({"_id": ev["_id"]}, {"$set": {"followed_up": True}})


def send_website_broadcast() -> bool:
    """Sends one Gemini-generated Hinglish notification to every website
    visitor who opted into push (web_push_subs) — raw Web Push via
    pywebpush, delivered through public/web-push-sw.js (icon = TFD logo).
    Returns True only if a send was actually attempted (so the caller
    doesn't start the throttle clock on a day with zero subscribers)."""
    if not (_PYWEBPUSH_OK and VAPID_PRIVATE_KEY):
        LOG.warning("Website push not configured (pywebpush/VAPID_PRIVATE_KEY) — skipping broadcast")
        return False
    subs = list(web_push_subs.find())
    if not subs:
        LOG.info("No website push subscribers yet — skipping broadcast")
        return False

    title, body = generate_website_notification_content()
    payload = json.dumps({"title": title, "body": body, "url": "https://thefinancialdoctor.in/"})
    sent, stale = 0, []
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            )
            sent += 1
        except WebPushException as e:
            resp = getattr(e, "response", None)
            # 404/410 = subscription gone; 401/403 = VAPID key mismatch.
            if resp is not None and resp.status_code in (401, 403, 404, 410):
                stale.append(sub["_id"])
            else:
                LOG.warning("Website push error: %s", e)
        except Exception as e:
            LOG.warning("Website push error: %s", e)

    if stale:
        web_push_subs.delete_many({"_id": {"$in": stale}})
    LOG.info("Website broadcast '%s' sent to %s/%s subscribers, %s stale removed", title, sent, len(subs), len(stale))
    return True


def maybe_send_website_broadcast():
    """Runs at most once every WEBSITE_NOTIF_INTERVAL_DAYS. This is a single
    broadcast to everyone, not a per-user reminder, so throttling is tracked
    via one shared timestamp doc rather than per-subscriber state. Only
    starts the throttle clock once a broadcast is actually sent, so an empty
    subscriber list today doesn't suppress tomorrow's attempt."""
    state = scheduler_state.find_one({"_id": "website_broadcast"}) or {}
    last_sent = state.get("last_sent_at")
    now = datetime.utcnow()
    if last_sent and (now - last_sent) < timedelta(days=WEBSITE_NOTIF_INTERVAL_DAYS):
        return
    if send_website_broadcast():
        scheduler_state.update_one({"_id": "website_broadcast"}, {"$set": {"last_sent_at": now}}, upsert=True)


def _job_due_today(job_name: str, now_local: datetime) -> bool:
    """DB-backed once-per-day gate (scheduler_state collection) — deliberately
    not in-memory state, because this worker no longer runs as a persistent
    process. Render's free plan has no standalone Background Worker, so this
    logic is invoked per-request from an HTTP endpoint (see
    backend/internal_routes.py) triggered every 15-30 min by an external free
    cron (e.g. cron-job.org). In-memory "last run" variables would reset on
    every cold start / redeploy and could double-send; a Mongo-persisted date
    string survives restarts and makes each check idempotent."""
    today_str = now_local.strftime("%Y-%m-%d")
    state = scheduler_state.find_one({"_id": job_name}) or {}
    if state.get("last_run_date") == today_str:
        return False
    scheduler_state.update_one({"_id": job_name}, {"$set": {"last_run_date": today_str}}, upsert=True)
    return True


def _job_due_this_week(job_name: str, now_local: datetime) -> bool:
    """Same idempotency approach as _job_due_today but keyed by ISO week
    (year + week number) instead of date, for jobs that run once a week."""
    week_key = now_local.strftime("%G-W%V")
    state = scheduler_state.find_one({"_id": job_name}) or {}
    if state.get("last_run_week") == week_key:
        return False
    scheduler_state.update_one({"_id": job_name}, {"$set": {"last_run_week": week_key}}, upsert=True)
    return True


def _job_due_this_month(job_name: str, now_local: datetime) -> bool:
    """Same idempotency approach as _job_due_today but keyed by year-month,
    for jobs that run once a month (e.g. on the 1st)."""
    month_key = now_local.strftime("%Y-%m")
    state = scheduler_state.find_one({"_id": job_name}) or {}
    if state.get("last_run_month") == month_key:
        return False
    scheduler_state.update_one({"_id": job_name}, {"$set": {"last_run_month": month_key}}, upsert=True)
    return True


def run_due_checks() -> dict:
    """One pass over every scheduled job — safe to call as often as the
    external cron likes (every 15-30 min recommended). Each job internally
    decides whether it's actually due, so extra calls are harmless no-ops."""
    tz = pytz.timezone(APP_TZ)
    now_local = datetime.now(tz)
    ran = []

    # Morning: motivation + "today's follow-ups" digest — any cron tick at or
    # after MORNING_HOUR, once per day (>= not ==, since we can't rely on the
    # cron landing exactly on the hour).
    if now_local.hour >= MORNING_HOUR and _job_due_today("morning_notifications", now_local):
        LOG.info("Running morning notifications at %s", now_local.isoformat())
        send_daily_morning_notifications()
        send_followup_reminders()
        send_employee_birthday_wishes()
        ran.append("morning_notifications")

    # Monday morning: weekly team + per-employee progress reports.
    if now_local.weekday() == 0 and now_local.hour >= MORNING_HOUR and _job_due_this_week("weekly_admin_report", now_local):
        LOG.info("Running weekly admin report at %s", now_local.isoformat())
        send_weekly_admin_report()
        ran.append("weekly_admin_report")

    if now_local.weekday() == 0 and now_local.hour >= MORNING_HOUR and _job_due_this_week("weekly_employee_progress", now_local):
        LOG.info("Running weekly employee progress report at %s", now_local.isoformat())
        send_employee_progress_report("weekly")
        ran.append("weekly_employee_progress")

    # 1st of the month: monthly per-employee progress report.
    if now_local.day == 1 and now_local.hour >= MORNING_HOUR and _job_due_this_month("monthly_employee_progress", now_local):
        LOG.info("Running monthly employee progress report at %s", now_local.isoformat())
        send_employee_progress_report("monthly")
        ran.append("monthly_employee_progress")

    # Evening: punch-out reminders start + lead inactivity sweep + missed
    # follow-up nudge.
    if now_local.hour >= DAILY_HOUR and _job_due_today("evening_checks", now_local):
        LOG.info("Running evening checks at %s", now_local.isoformat())
        notify_open_shifts()
        check_lead_inactivity()
        send_followup_miss_check()
        ran.append("evening_checks")

    # Once a day: refresh the storage-usage dashboard cache (MongoDB/R2 live,
    # Render/Netlify from admin-entered figures) and notify admins on any
    # 80%/95% threshold crossing.
    if _job_due_today("storage_status_refresh", now_local):
        LOG.info("Refreshing storage status at %s", now_local.isoformat())
        try:
            from storage_status import refresh_storage_status
            refresh_storage_status()
        except Exception as e:
            LOG.exception("Storage status refresh failed: %s", e)
        ran.append("storage_status_refresh")

    # Hourly-interval reminders (punch-out repeats, single-shot lead nudges) —
    # naturally idempotent via each reminder's own next_send_at field.
    process_due_reminders()
    ran.append("process_due_reminders")

    # Website visitor broadcast — internally throttled to once every
    # WEBSITE_NOTIF_INTERVAL_DAYS via its own scheduler_state doc.
    maybe_send_website_broadcast()
    ran.append("maybe_send_website_broadcast")

    # Behavioral website follow-ups — each event marks itself followed_up so
    # these are naturally idempotent, safe to check on every pass.
    send_calculator_followups()
    ran.append("calculator_followups")
    send_proposal_followups()
    ran.append("proposal_followups")

    return {"ran": ran, "checked_at": now_local.isoformat()}


def run_loop():
    """Optional local-dev convenience only — production runs via the
    /api/internal/run-scheduled-tasks endpoint on an external cron instead
    (see run_due_checks() above and backend/internal_routes.py)."""
    LOG.info("Scheduler loop started (local dev), timezone=%s", APP_TZ)
    try:
        while True:
            run_due_checks()

            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        LOG.info("Scheduler stopped by KeyboardInterrupt")


if __name__ == "__main__":
    run_loop()
