from fastapi import APIRouter, Depends

from auth_utils import require_admin
from database import activity_log_collection

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/recent")
async def recent_activity(admin: dict = Depends(require_admin)):
    """Last 30 admin actions across the portal — newest first."""
    cursor = activity_log_collection.find({}).sort("created_at", -1).limit(30)
    items = []
    async for doc in cursor:
        doc.pop("_id", None)
        items.append(doc)
    return items
