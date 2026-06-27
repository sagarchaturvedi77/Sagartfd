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
users_collection = db["users"]          # admin + employee accounts
leads_collection = db["leads"]          # CRM leads
clients_collection = db["clients"]      # converted clients
proposals_collection = db["proposals"]  # mutual fund / insurance proposals
attendance_collection = db["attendance"]
payments_collection = db["payments"]
targets_collection = db["targets"]
salary_collection = db["salary"]
