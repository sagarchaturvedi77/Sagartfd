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
