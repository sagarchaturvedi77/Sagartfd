from database import db
from datetime import datetime

# create index for audits if not exists (run-once helper)
async def ensure_audit_index():
    await db.audit_logs.create_index([("created_at", 1)])

# helper to write an audit entry
async def write_audit(event: str, actor_id: str | None, actor_email: str | None, target_id: str | None, target_email: str | None, meta: dict | None = None, result: str = "success"):
    await db.audit_logs.insert_one({
        "event": event,
        "actor_id": actor_id,
        "actor_email": actor_email,
        "target_id": target_id,
        "target_email": target_email,
        "meta": meta or {},
        "result": result,
        "created_at": datetime.utcnow(),
    })
