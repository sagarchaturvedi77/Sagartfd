from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone
import uuid

from database import db
from auth_utils import get_current_user_payload, require_admin

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])


# ─────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────

class Stage(BaseModel):
    """Recursive nested stage — admin can nest as deep as needed."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_id: Optional[str] = None          # None = top-level
    outcome_type: Optional[str] = None        # "connected" | "not_connected" | None
    children: List["Stage"] = []              # nested sub-stages
    color: Optional[str] = "#024396"          # visual colour for kanban

Stage.model_rebuild()  # needed for recursive model


class PipelineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    connected_stages: List[Stage] = []        # stages when call connects
    not_connected_stages: List[Stage] = []    # stages when call doesn't connect


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    connected_stages: Optional[List[Stage]] = None
    not_connected_stages: Optional[List[Stage]] = None


class PipelineAssign(BaseModel):
    employee_ids: List[str]                   # assign pipeline to these employees


# WhatsApp Templates
class TemplateCreate(BaseModel):
    name: str
    body: str                                 # template message text


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    body: Optional[str] = None


# ─────────────────────────────────────────
# PIPELINE CRUD — ADMIN ONLY
# ─────────────────────────────────────────

@router.post("/")
async def create_pipeline(payload: PipelineCreate, admin=Depends(require_admin)):
    """Admin creates a new pipeline with nested stages."""
    pipeline = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "description": payload.description,
        "connected_stages": [s.model_dump() for s in payload.connected_stages],
        "not_connected_stages": [s.model_dump() for s in payload.not_connected_stages],
        "created_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "assigned_to": [],       # list of employee IDs
        "is_active": True,
    }
    await db.pipelines.insert_one(pipeline)
    pipeline.pop("_id", None)
    return pipeline


@router.get("/")
async def list_pipelines(admin=Depends(require_admin)):
    """Admin sees all pipelines."""
    pipelines = await db.pipelines.find({}, {"_id": 0}).to_list(200)
    return pipelines


@router.get("/{pipeline_id}")
async def get_pipeline(pipeline_id: str, user=Depends(get_current_user_payload)):
    pipeline = await db.pipelines.find_one({"id": pipeline_id}, {"_id": 0})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    # Employee can only see pipelines assigned to them
    if user["role"] != "admin" and user["sub"] not in pipeline.get("assigned_to", []):
        raise HTTPException(status_code=403, detail="Not assigned to this pipeline")
    return pipeline


@router.put("/{pipeline_id}")
async def update_pipeline(pipeline_id: str, payload: PipelineUpdate, admin=Depends(require_admin)):
    """Admin can edit pipeline name, description, or stages at any time."""
    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    # Convert Stage objects to dicts
    if "connected_stages" in update_data:
        update_data["connected_stages"] = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in (payload.connected_stages or [])
        ]
    if "not_connected_stages" in update_data:
        update_data["not_connected_stages"] = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in (payload.not_connected_stages or [])
        ]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.pipelines.update_one({"id": pipeline_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    updated = await db.pipelines.find_one({"id": pipeline_id}, {"_id": 0})
    return updated


@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: str, admin=Depends(require_admin)):
    result = await db.pipelines.delete_one({"id": pipeline_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return {"status": "deleted"}


# ─────────────────────────────────────────
# PIPELINE ASSIGNMENT — ADMIN ONLY
# ─────────────────────────────────────────

@router.post("/{pipeline_id}/assign")
async def assign_pipeline(pipeline_id: str, payload: PipelineAssign, admin=Depends(require_admin)):
    """Admin assigns a pipeline to one or more employees."""
    pipeline = await db.pipelines.find_one({"id": pipeline_id})
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    await db.pipelines.update_one(
        {"id": pipeline_id},
        {"$set": {"assigned_to": payload.employee_ids}}
    )
    return {"status": "assigned", "employee_ids": payload.employee_ids}


@router.get("/my/assigned")
async def my_pipelines(user=Depends(get_current_user_payload)):
    """Employee sees only their assigned pipelines."""
    pipelines = await db.pipelines.find(
        {"assigned_to": user["sub"], "is_active": True}, {"_id": 0}
    ).to_list(50)
    return pipelines


# ─────────────────────────────────────────
# WHATSAPP TEMPLATES — PER EMPLOYEE
# ─────────────────────────────────────────

@router.post("/templates/")
async def create_template(payload: TemplateCreate, user=Depends(get_current_user_payload)):
    """Employee creates a personal WhatsApp message template."""
    template = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "body": payload.body,
        "created_by": user["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.wa_templates.insert_one(template)
    template.pop("_id", None)
    return template


@router.get("/templates/")
async def list_templates(user=Depends(get_current_user_payload)):
    """Employee sees their own templates."""
    templates = await db.wa_templates.find(
        {"created_by": user["sub"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return templates


@router.put("/templates/{template_id}")
async def update_template(template_id: str, payload: TemplateUpdate, user=Depends(get_current_user_payload)):
    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    result = await db.wa_templates.update_one(
        {"id": template_id, "created_by": user["sub"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    updated = await db.wa_templates.find_one({"id": template_id}, {"_id": 0})
    return updated


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user=Depends(get_current_user_payload)):
    result = await db.wa_templates.delete_one(
        {"id": template_id, "created_by": user["sub"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "deleted"}
