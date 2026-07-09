import os
import time
import json
import random
import logging
from datetime import datetime, timedelta

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

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:admin@thefinancialdoctor.in")
WEBSITE_NOTIF_INTERVAL_DAYS = float(os.environ.get("WEBSITE_NOTIF_INTERVAL_DAYS", "2"))


def send_push_to_user(uid: str, title: str, body: str, url: str | None = None) -> int:
    """Send a VAPID web push to every device the portal user (admin/employee)
    has subscribed from — same push_subscriptions collection and delivery
    mechanism notification_service.py uses for the main app's send path, so
    this worker and the FastAPI app never diverge in behavior. Returns how
    many devices were successfully sent to."""
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
        send_push_to_user(uid, "Punch Out Reminder", "Aapne aaj punch out nahi kiya. Kripya punch out karein.", "/portal/employee/attendance")
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
            send_push_to_user(uid, "Punch Out Reminder", "Kripya ab punch out karein — abhi pending hai.", "/portal/employee/attendance")
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
            send_push_to_user(uid, title, body, "/portal/employee/leads")
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


users = db.get_collection("users")
MORNING_HOUR = int(os.environ.get("SCHEDULER_MORNING_HOUR", "9"))
MORNING_MESSAGES = [
    "Good Morning! Aaj ka din productive banayein. Targets achieve karein!",
    "Good Morning! Naye din ki nayi shuruat — har call se ek kadam aage.",
    "Good Morning! Focus aur dedication se koi bhi target possible hai.",
    "Good Morning! Aaj bhi best performance dein — TFD pe bharosa rakhein!",
    "Good Morning! Har follow-up ek opportunity hai — aaj miss mat karein.",
    "Good Morning! Champions never give up — aaj ka din aapka hai!",
    "Good Morning! Client ka trust hi sabse bada asset hai — build karein!",
]
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
            msg = random.choice(MORNING_MESSAGES)
            title = f"Good Morning, {name}!" if name else "Good Morning!"

        send_push_to_user(uid, title, msg, "/portal/employee")


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
            send_push_to_user(uid, title, body, "/portal/employee/leads")


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


def generate_website_notification_content() -> tuple[str, str]:
    """Returns (title, body) in Hinglish via Gemini — a different topic each
    time so it never feels like the same repeated notification. Falls back
    to a canned message if Gemini isn't configured or the call fails, so a
    broadcast cycle is never silently skipped just because of that."""
    topic = random.choice(WEBSITE_NOTIF_TOPICS)
    fallback = ("The Financial Doctor", "Apne financial goals ke liye sahi planning zaroori hai — TFD se free consultation lein!")
    if not (GEMINI_API_KEY and httpx):
        return fallback
    try:
        prompt = (
            f"Ek chhota mobile push notification likho, Hinglish (Roman script Hindi + English mix) mein, "
            f"is topic par: \"{topic}\". Title max 40 characters, body max 110 characters. "
            f"Ye The Financial Doctor (TFD) ki taraf se ja raha hai — ek AMFI-registered mutual fund distributor "
            f"(Sagar Chaturvedi, Sehore MP). Guaranteed returns ka wada mat karo, koi specific fund/scheme "
            f"recommend mat karo, sirf general awareness/motivation do. "
            f"Sirf is exact JSON format mein jawab do, kuch aur text nahi: {{\"title\": \"...\", \"body\": \"...\"}}"
        )
        resp = httpx.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY},
            json={"model": GEMINI_MODEL, "input": prompt, "generation_config": {"temperature": 0.9}},
            timeout=20.0,
        )
        if resp.status_code != 200:
            LOG.warning("Gemini website-notification call failed: %s", resp.text)
            return fallback
        text = _extract_gemini_text(resp.json())
        parsed = json.loads(text[text.find("{"): text.rfind("}") + 1])
        title = (parsed.get("title") or fallback[0]).strip()[:60] or fallback[0]
        body = (parsed.get("body") or fallback[1]).strip()[:150] or fallback[1]
        return title, body
    except Exception as e:
        LOG.exception("Gemini website-notification generation failed: %s", e)
        return fallback


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
        ran.append("morning_notifications")

    # Evening: punch-out reminders start + lead inactivity sweep.
    if now_local.hour >= DAILY_HOUR and _job_due_today("evening_checks", now_local):
        LOG.info("Running evening checks at %s", now_local.isoformat())
        notify_open_shifts()
        check_lead_inactivity()
        ran.append("evening_checks")

    # Hourly-interval reminders (punch-out repeats, single-shot lead nudges) —
    # naturally idempotent via each reminder's own next_send_at field.
    process_due_reminders()
    ran.append("process_due_reminders")

    # Website visitor broadcast — internally throttled to once every
    # WEBSITE_NOTIF_INTERVAL_DAYS via its own scheduler_state doc.
    maybe_send_website_broadcast()
    ran.append("maybe_send_website_broadcast")

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
