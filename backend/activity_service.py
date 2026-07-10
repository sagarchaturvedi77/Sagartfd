"""Admin activity feed — records what an admin *did* (added a lead,
imported a batch, downloaded a report, added a task, ...) so the admin
dashboard's "Recent Activity" panel can show that instead of a raw list of
lead phone numbers."""
import uuid
from datetime import datetime, timezone

from database import activity_log_collection, users_collection


async def log_activity(actor_id: str, action: str, description: str, link: str | None = None) -> None:
    actor = await users_collection.find_one({"id": actor_id})
    actor_name = actor.get("name", "Admin") if actor else "Admin"
    await activity_log_collection.insert_one({
        "id": str(uuid.uuid4()),
        "actor_id": actor_id,
        "actor_name": actor_name,
        "action": action,           # short machine tag, e.g. "lead_added", "lead_imported", "report_downloaded", "task_added"
        "description": description, # human-readable sentence shown in the feed
        "link": link,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
