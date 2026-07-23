import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
load_dotenv(Path(__file__).parent / '.env')
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "tfd_crm")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
# Collections used across the CRM
users_collection = db["users"]
leads_collection = db["leads"]
clients_collection = db["clients"]
proposals_collection = db["proposals"]
attendance_collection = db["attendance"]
payments_collection = db["payments"]
targets_collection = db["targets"]
salary_collection = db["salary"]
notifications_collection = db["notifications"]
push_subscriptions_collection = db["push_subscriptions"]
# Website analytics & public push
page_views_collection = db["page_views"]
events_collection = db["events"]
web_push_collection = db["web_push_subs"]
# Pipeline & CRM
pipelines_collection = db["pipelines"]
wa_templates_collection = db["wa_templates"]
tasks_collection = db["tasks"]
onboarding_collection = db["onboarding"]
# Reminders & scheduling
reminders_collection = db["reminders"]
settings_collection = db["settings"]
chat_collection = db["chat_messages"]
leaves_collection = db["leaves"]
lead_batches_collection = db["lead_batches"]
activity_log_collection = db["activity_log"]
storage_settings_collection = db["storage_settings"]
storage_cache_collection = db["storage_cache"]
certificates_collection = db["certificates"]
invoices_collection = db["invoices"]
interns_collection = db["interns"]
business_settings_collection = db["business_settings"]
password_resets_collection = db["password_resets"]
# TFD Internship (gamified program) — separate from the interns_collection
# KYC-application/offer-letter pipeline above; only converges with the
# certificate/QR system at Day-45 graduation (see internship_routes.py).
internship_students_collection = db["internship_students"]
internship_task_pool_collection = db["internship_task_pool"]
internship_submissions_collection = db["internship_submissions"]
internship_quiz_questions_collection = db["internship_quiz_questions"]
internship_quiz_attempts_collection = db["internship_quiz_attempts"]
internship_reports_collection = db["internship_reports"]
# Student-written blog/FAQ content (mutual fund / financial planning topics)
# — pending_review until an admin approves it, only then does it ever reach
# the real public website. See internship_content_routes.py.
internship_content_collection = db["internship_content"]
# AI Manager chat history — one document per message (student or manager
# role), see internship_manager_routes.py.
internship_manager_chat_collection = db["internship_manager_chat"]
# TFD Mailbox — one document per email message (student <-> fictional
# client), see internship_mailbox_routes.py.
internship_mailbox_collection = db["internship_mailbox"]
# TFD Connect — one document per (student, contact) WhatsApp-style chat
# thread, messages embedded — see internship_connect_routes.py.
internship_connect_threads_collection = db["internship_connect_threads"]
# Cashfree Payment Gateway orders — generic across payment_type values
# ("internship_signup", "certificate_regeneration", ...), see cashfree_client.py.
payment_orders_collection = db["payment_orders"]
# Weekly-refreshed cache of the top 3 real mutual funds per category,
# ranked by trailing 1Y return from a curated candidate pool — written by
# scheduler_worker.py's refresh_top_funds() (see run_due_checks), read by
# the /api/mf/top-funds endpoint in server.py. Replaces a hardcoded,
# never-updated fund list.
top_funds_collection = db["top_funds_cache"]
