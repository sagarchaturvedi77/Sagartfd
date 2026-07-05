from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime

from auth_models import UserCreate, UserLogin, UserOut, UserInDB, TokenResponse, PasswordChange
from auth_utils import hash_password, verify_password, create_access_token, require_admin, get_current_user_payload
from database import users_collection
from utils.employee import gen_employee_id_from_phone
from utils.audit import write_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])


def to_user_out(doc: dict) -> UserOut:
    return UserOut(
        id=doc["id"], name=doc["name"], email=doc["email"], role=doc["role"],
        phone=doc.get("phone"), designation=doc.get("designation"),
        created_at=doc["created_at"],
        training_days=doc.get("training_days"),
        training_salary=doc.get("training_salary"),
        training_start_date=doc.get("training_start_date"),
        base_salary=doc.get("base_salary"),
        profile_completed=doc.get("profile_completed"),
        join_date=doc.get("join_date"),
        certificate_no=doc.get("certificate_no"),
        is_active=doc.get("is_active", True),
        deactivated_at=doc.get("deactivated_at"),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await users_collection.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")

    token = create_access_token(user["id"], user["role"])
    return TokenResponse(access_token=token, user=to_user_out(user))


@router.post("/create-employee", response_model=UserOut)
async def create_employee(payload: UserCreate, admin=Depends(require_admin)):
    """ADMIN ONLY — creates a new employee login. Each employee gets a unique email/password."""
    existing = await users_collection.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    training_start = datetime.utcnow().strftime("%Y-%m-%d") if payload.training_days else None

    # Generate employee id from phone (format: TFD + first2 + 5th&6th + last2)
    emp_id = gen_employee_id_from_phone(payload.phone)
    # Ensure uniqueness; if collision, append short suffix
    suffix = 0
    base_id = emp_id
    while await users_collection.find_one({"id": emp_id}):
        suffix += 1
        emp_id = f"{base_id}-{suffix}"

    new_user = UserInDB(
        id=emp_id,
        name=payload.name, email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role, phone=payload.phone, designation=payload.designation,
        base_salary=payload.base_salary, training_days=payload.training_days,
        training_salary=payload.training_salary, training_start_date=training_start,
        join_date=datetime.utcnow().strftime("%Y-%m-%d"),
        certificate_no=payload.certificate_no,
    )
    await users_collection.insert_one(new_user.dict())

    # Audit log: user.create
    try:
        admin_id = admin.get("sub") if isinstance(admin, dict) else None
        admin_email = admin.get("email") if isinstance(admin, dict) else None
        await write_audit(
            event="user.create",
            actor_id=admin_id,
            actor_email=admin_email,
            target_id=emp_id,
            target_email=payload.email,
            meta={"phone": payload.phone, "role": payload.role},
            result="success",
        )
    except Exception:
        # audit errors should not block the main flow
        pass

    return to_user_out(new_user.dict())


@router.get("/me", response_model=UserOut)
async def get_me(payload: dict = Depends(get_current_user_payload)):
    user = await users_collection.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return to_user_out(user)


@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    payload: dict = Depends(get_current_user_payload),
):
    """Any logged-in user changes their own password."""
    user = await users_collection.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await users_collection.update_one({"id": payload["sub"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"status": "password_changed"}


@router.get("/employees", response_model=list[UserOut])
async def list_employees(admin=Depends(require_admin)):
    """ADMIN ONLY — lists all employee accounts for the admin dashboard."""
    cursor = users_collection.find({"role": "employee"})
    employees = [to_user_out(doc) async for doc in cursor]
    return employees


@router.get("/employees/{employee_id}/activity")
async def employee_activity(employee_id: str, admin=Depends(require_admin)):
    """ADMIN ONLY — everything one employee has done: their profile plus
    every lead assigned to them with the full update history on each.
    Powers the clickable employee-name profile view."""
    from database import leads_collection
    emp_doc = await users_collection.find_one({"id": employee_id}, {"_id": 0, "password_hash": 0})
    if not emp_doc:
        raise HTTPException(status_code=404, detail="Employee not found")
    leads_cursor = leads_collection.find({"assigned_to": employee_id}, {"_id": 0}).sort("updated_at", -1)
    leads = [doc async for doc in leads_cursor]
    return {"employee": emp_doc, "leads": leads}


@router.patch("/employees/{employee_id}/deactivate")
async def deactivate_employee(employee_id: str, admin=Depends(require_admin)):
    """ADMIN ONLY — disable an employee's login without deleting their data/history.
    Also stamps deactivated_at so the public Verification page can show the date they left.
    """
    result = await users_collection.update_one(
        {"id": employee_id},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow().strftime("%Y-%m-%d")}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"status": "deactivated"}
