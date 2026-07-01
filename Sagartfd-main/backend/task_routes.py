"""Admin self-task / reminder routes. Admin's personal task & follow-up manager."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from task_models import TaskCreate, TaskUpdate, TaskInDB, TaskOut
from auth_utils import get_current_user_payload
from database import db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

tasks_collection = db["tasks"]


def to_task_out(doc: dict) -> TaskOut:
    return TaskOut(**{k: doc.get(k) for k in TaskOut.model_fields})


@router.post("/", response_model=TaskOut)
async def create_task(data: TaskCreate, payload: dict = Depends(get_current_user_payload)):
    task = TaskInDB(user_id=payload["sub"], **data.model_dump())
    await tasks_collection.insert_one(task.model_dump())
    return to_task_out(task.model_dump())


@router.get("/", response_model=list[TaskOut])
async def list_tasks(payload: dict = Depends(get_current_user_payload)):
    cursor = tasks_collection.find({"user_id": payload["sub"]}).sort("created_at", -1).limit(200)
    return [to_task_out(doc) async for doc in cursor]


@router.get("/today", response_model=list[TaskOut])
async def today_tasks(payload: dict = Depends(get_current_user_payload)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cursor = tasks_collection.find({
        "user_id": payload["sub"],
        "status": {"$nin": ["completed", "cancelled"]},
        "$or": [
            {"due_date": today},
            {"due_date": {"$lt": today}},  # overdue
        ],
    }).sort("priority", -1)
    return [to_task_out(doc) async for doc in cursor]


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, data: TaskUpdate, payload: dict = Depends(get_current_user_payload)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await tasks_collection.find_one_and_update(
        {"id": task_id, "user_id": payload["sub"]},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return to_task_out(result)


@router.delete("/{task_id}")
async def delete_task(task_id: str, payload: dict = Depends(get_current_user_payload)):
    result = await tasks_collection.delete_one({"id": task_id, "user_id": payload["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}


@router.get("/stats")
async def task_stats(payload: dict = Depends(get_current_user_payload)):
    pipeline = [
        {"$match": {"user_id": payload["sub"]}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    status_counts = {}
    async for doc in tasks_collection.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue = await tasks_collection.count_documents({
        "user_id": payload["sub"],
        "status": {"$nin": ["completed", "cancelled"]},
        "due_date": {"$lt": today, "$ne": None},
    })

    return {
        "total": sum(status_counts.values()),
        "by_status": status_counts,
        "overdue": overdue,
    }
