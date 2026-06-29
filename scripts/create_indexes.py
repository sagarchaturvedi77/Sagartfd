#!/usr/bin/env python3
"""Create helpful indexes for the application collections.
Run: python scripts/create_indexes.py
"""
import os
from pymongo import MongoClient

MONGO = os.environ.get("MONGO_URL") or os.environ.get("MONGO_URI")
DB_NAME = os.environ.get("DB_NAME") or os.environ.get("MONGO_DB") or "tfd"

if not MONGO:
    raise RuntimeError("MONGO_URL (or MONGO_URI) must be set")

client = MongoClient(MONGO)
db = client[DB_NAME]

print("Creating indexes...")
# reminders.next_send_at index
db.reminders.create_index([("next_send_at", 1)], name="reminders_next_send_at_idx")
# fcm_tokens.user_id
db.fcm_tokens.create_index([("user_id", 1)], name="fcm_user_idx")
# pipelines.id
db.pipelines.create_index([("id", 1)], unique=True, name="pipelines_id_idx")

print("Indexes created")
