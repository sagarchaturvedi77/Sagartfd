"""Admin self-task / reminder routes. Admin's personal task & follow-up manager
— also supports admin-assigning a task to an employee (assigned_to on create)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from task_models import TaskCreate, TaskUpdate, TaskInDB, TaskOut
from auth_utils import get_current_user_payload
from database import db, users_collection
from notification_service import create_notification
from activity_service import log_activity

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

tasks_collection = db["tasks"]


def to_task_out(doc: dict) -> TaskOut:
    return TaskOut(**{k: doc.get(k) for k in TaskOut.model_fields})


@router.post("/", response_model=TaskOut)
async def create_task(data: TaskCreate, payload: dict = Depends(get_current_user_payload)):
    fields = data.model_dump()
    assigned_to = fields.pop("assigned_to", None)

    # Only admins can assign to someone else — an employee-supplied
    # assigned_to is ignored so a task always lands on its creator otherwise,
    # preserving today's self-task behavior.
    owner_id = payload["sub"]
    assigned_by = assigned_by_name = None
    if assigned_to and payload.get("role") == "admin" and assigned_to != payload["sub"]:
        owner_id = assigned_to
        assigned_by = payload["sub"]
        admin_doc = await users_collection.find_one({"id": payload["sub"]})
        assigned_by_name = admin_doc.get("name", "Admin") if admin_doc else "Admin"

    task = TaskInDB(user_id=owner_id, assigned_by=assigned_by, assigned_by_name=assigned_by_name, **fields)
    await tasks_collection.insert_one(task.model_dump())

    if assigned_by:
        await create_notification(
            user_id=owner_id,
            title="New Task Assigned",
            body=f"{assigned_by_name} assigned you: {task.title}" + (f" (due {task.due_date})" if task.due_date else ""),
            n_type="task_assigned",
            link=f"/portal/employee/tasks?taskId={task.id}",
        )

    if payload.get("role") == "admin":
        desc = f"Added a task: {task.title}"
        if assigned_by:
            desc += f" (assigned to {(await users_collection.find_one({'id': owner_id}) or {}).get('name', 'an employee')})"
        await log_activity(payload["sub"], "task_added", desc, link="/portal/admin/tasks")

    return to_task_out(task.model_dump())


@router.get("/", response_model=list[TaskOut])
async def list_tasks(payload: dict = Depends(get_current_user_payload)):
    # An assigned task's user_id is the assignee's id, not the assigner's —
    # without the assigned_by clause an admin would never see tasks they
    # handed out to employees in their own list, only the employee would.
    cursor = tasks_collection.find({
        "$or": [{"user_id": payload["sub"]}, {"assigned_by": payload["sub"]}],
    }).sort("created_at", -1).limit(200)
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
