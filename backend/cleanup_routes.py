from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin
from cleanup_service import preview_cleanup, execute_cleanup, CATEGORIES, LARGE_DELETE_THRESHOLD

router = APIRouter(prefix="/api/cleanup", tags=["cleanup"])


@router.get("/categories")
async def list_categories(admin: dict = Depends(require_admin)):
    return [{"key": k, "label": v["label"]} for k, v in CATEGORIES.items()]


class CleanupRequest(BaseModel):
    categories: List[str]
    cutoff_date: str  # YYYY-MM-DD — only records older than this are eligible


@router.post("/preview")
async def preview(data: CleanupRequest, admin: dict = Depends(require_admin)):
    """Read-only — shows exactly how many records would be affected, so
    admin sees the real count before ever considering deletion."""
    if not data.categories:
        raise HTTPException(status_code=400, detail="Select at least one category")
    results = await preview_cleanup(data.categories, data.cutoff_date)
    total = sum(r["count"] for r in results.values())
    return {"results": results, "total": total, "requires_extra_warning": total >= LARGE_DELETE_THRESHOLD}


class CleanupExecuteRequest(CleanupRequest):
    confirm_text: str
    confirm_large: bool = False


@router.post("/execute")
async def execute(data: CleanupExecuteRequest, admin: dict = Depends(require_admin)):
    """Actually deletes. Requires typing DELETE exactly, and — for 1000+
    matching records — an explicit confirm_large flag the frontend only
    sends after showing a bigger warning."""
    if data.confirm_text != "DELETE":
        raise HTTPException(status_code=400, detail='Type "DELETE" exactly to confirm')
    if not data.categories:
        raise HTTPException(status_code=400, detail="Select at least one category")

    preview_results = await preview_cleanup(data.categories, data.cutoff_date)
    total = sum(r["count"] for r in preview_results.values())
    if total >= LARGE_DELETE_THRESHOLD and not data.confirm_large:
        raise HTTPException(
            status_code=400,
            detail=f"{total} records match — this is a large delete, confirm_large must be set to proceed",
        )

    results = await execute_cleanup(data.categories, data.cutoff_date, admin["sub"])
    return {"results": results}
