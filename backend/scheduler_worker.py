import os
import time
import json
import logging
from datetime import datetime, timedelta

import pytz
from pymongo import MongoClient

# Firebase Admin will be initialized via backend/init_firebase.py helper
try:
    from firebase_admin import messaging
    from backend.init_firebase import init_firebase_from_env
except Exception:
    messaging = None
    init_firebase_from_env = None

LOG = logging.getLogger("scheduler")
LOG.setLevel(logging.INFO)

MONGO = os.environ.get("MONGO_URL") or os.environ.get("MONGO_URI")
DB_NAME = os.environ.get("DB_NAME") or os.environ.get("MONGO_DB") or "tfd"
APP_TZ = os.environ.get("APP_TIMEZONE", "Asia/Kolkata")
CHECK_INTERVAL = int(os.environ.get("SCHEDULER_POLL_SECONDS", "30"))
DAILY_HOUR = int(os.environ.get("SCHEDULER_DAILY_HOUR", "18"))  # 18:00 local
MAX_RETRIES = int(os.environ.get("FCM_MAX_RETRIES", "3"))

if not MONGO:
    raise RuntimeError("MONGO_URL (or MONGO_URI) must be set for scheduler")

client = MongoClient(MONGO)
db = client[DB_NAME]
attendance = db.get_collection("attendance")
fcm_tokens = db.get_collection("fcm_tokens")
reminders = db.get_collection("reminders")
leads = db.get_collection("leads")

# initialize firebase admin if available
if init_firebase_from_env:
    init_firebase_from_env()


def send_fcm_token(token: str, title: str, body: str, data: dict | None = None) -> bool:
    if messaging is None:
        LOG.warning("firebase_admin.messaging not available — skipping send")
        return False
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=token,
        data=data or {},
    )
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            resp = messaging.send(message)
            LOG.info("FCM send success: %s", resp)
            return True
        except Exception as e:
            attempt += 1
            LOG.exception("FCM send failed (attempt %s): %s", attempt, e)
            time.sleep(0.5 * (2 ** attempt))
    return False


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
        tokens = list(fcm_tokens.find({"user_id": uid}))
        for t in tokens:
            token = t.get("token")
            if not token:
                continue
            send_fcm_token(token, "Punch Out Reminder", "Aapne aaj punch out nahi kiya. Kripya punch out karein.", {"screen": "attendance"})
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
        tokens = list(fcm_tokens.find({"user_id": uid}))

        if rtype == "punch_out":
            interval = int(r.get("interval_minutes") or 60)
            for t in tokens:
                token = t.get("token")
                if token:
                    send_fcm_token(token, "Punch Out Reminder", "Kripya ab punch out karein — abhi pending hai.", {"screen": "attendance"})
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
            for t in tokens:
                token = t.get("token")
                if token:
                    send_fcm_token(token, title, body, {"screen": "leads", "lead_id": r.get("lead_id", "")})
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


def run_loop():
    tz = pytz.timezone(APP_TZ)
    LOG.info("Scheduler started, timezone=%s", APP_TZ)
    last_daily_date = None
    try:
        while True:
            now_local = datetime.now(tz)
            # daily 18:00 local
            if now_local.hour == DAILY_HOUR and (last_daily_date is None or last_daily_date < now_local.date()):
                LOG.info("Running daily open-shifts check at %s", now_local.isoformat())
                notify_open_shifts()
                check_lead_inactivity()
                last_daily_date = now_local.date()
            # process reminders
            process_due_reminders()
            time.sleep(CHECK_INTERVAL)
    except KeyboardInterrupt:
        LOG.info("Scheduler stopped by KeyboardInterrupt")


if __name__ == "__main__":
    run_loop()
