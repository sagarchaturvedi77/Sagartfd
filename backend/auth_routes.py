from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
import random
import string

from pydantic import BaseModel

from auth_models import UserCreate, UserLogin, UserOut, UserInDB, TokenResponse, PasswordChange
from auth_utils import hash_password, verify_password, create_access_token, require_admin, get_current_user_payload
from database import users_collection
from utils.employee import gen_employee_id_from_phone
from utils.audit import write_audit
from email_service import send_welcome_email, email_configured

router = APIRouter(prefix="/api/auth", tags=["auth"])


def generate_password(length=8):
    """Generate a random password like TFD@xxxx (4 random alphanumeric)."""
    chars = string.ascii_letters + string.digits
    suffix = ''.join(random.choices(chars, k=length))
    return f"TFD@{suffix}"


def to_user_out(doc: dict) -> UserOut:
    return UserOut(
        id=doc["id"], name=doc["name"], email=doc.get("email", ""), role=doc["role"],
        phone=doc.get("phone"), designation=doc.get("designation"),
        created_at=doc["created_at"],
        training_days=doc.get("training_days"),
        training_salary=doc.get("training_salary"),
        training_start_date=doc.get("training_start_date"),
        base_salary=doc.get("base_salary"),
        profile_completed=doc.get("profile_completed"),
        join_date=doc.get("join_date"),
        is_active=doc.get("is_active", True),
        deactivated_at=doc.get("deactivated_at"),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    # Support login via phone number (primary) or email (legacy/admin)
    user = await users_collection.find_one({"phone": payload.phone})
    if not user:
        # Fallback: try email for admin accounts
        user = await users_collection.find_one({"email": payload.phone})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid User ID or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")

    token = create_access_token(user["id"], user["role"])

    # Welcome notification — only once per day, on the first login of the day
    # (previously fired on every single login, which spammed users who log
    # in/out multiple times a day).
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if user.get("last_welcome_notif_date") != today:
        try:
            from notification_service import create_notification
            name = user.get("name", user.get("profile_name", ""))
            await create_notification(
                user_id=user["id"],
                title=f"Welcome, {name}!" if name else "Welcome to TFD Workspace!",
                body="TFD Workspace mein aapka swagat hai. Aaj ka din productive banayein!",
                n_type="welcome",
                link="/portal/employee" if user.get("role") == "employee" else "/portal/admin",
            )
            await users_collection.update_one({"id": user["id"]}, {"$set": {"last_welcome_notif_date": today}})
        except Exception:
            pass

    return TokenResponse(access_token=token, user=to_user_out(user))


@router.post("/create-employee")
async def create_employee(payload: UserCreate, admin=Depends(require_admin)):
    """ADMIN ONLY — creates a new employee login. Phone is the login ID."""
    # Check duplicate phone
    existing = await users_collection.find_one({"phone": payload.phone})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists")

    # Auto-generate password if not provided
    plain_password = payload.password if payload.password else generate_password()

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
        name=payload.name, phone=payload.phone,
        email=payload.email or "",
        password_hash=hash_password(plain_password),
        role=payload.role, designation=payload.designation,
        base_salary=payload.base_salary, training_days=payload.training_days,
        training_salary=payload.training_salary, training_start_date=training_start,
        join_date=datetime.utcnow().strftime("%Y-%m-%d"),
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
        pass

    # Send welcome notification to admin about new employee
    try:
        from notification_service import create_notification
        admin_id = admin.get("sub") if isinstance(admin, dict) else None
        if admin_id:
            await create_notification(
                user_id=admin_id,
                title="New Employee Created",
                body=f"{payload.name} ({payload.phone}) has joined TFD Workspace!",
                n_type="employee",
                link="/portal/admin",
            )
    except Exception:
        pass

    # Return user + generated password (only on creation)
    user_out = to_user_out(new_user.dict())
    return {"user": user_out.dict(), "generated_password": plain_password}


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
async def list_employees(_payload: dict = Depends(get_current_user_payload)):
    """Any logged-in user (admin or employee) — lists all employee accounts.
    Used by the admin dashboard, and by employee-facing lead transfer/reassign
    pickers (TransferLeadModal, CallFlowPopup) which need to pick a colleague."""
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
    """ADMIN ONLY — disable an employee's login without deleting their data/history."""
    result = await users_collection.update_one(
        {"id": employee_id},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow().strftime("%Y-%m-%d")}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"status": "deactivated"}


@router.patch("/employees/{employee_id}/activate")
async def activate_employee(employee_id: str, admin=Depends(require_admin)):
    """ADMIN ONLY — re-enable a disabled employee."""
    result = await users_collection.update_one(
        {"id": employee_id},
        {"$set": {"is_active": True}, "$unset": {"deactivated_at": ""}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"status": "activated"}


@router.post("/employees/{employee_id}/reset-password")
async def reset_employee_password(employee_id: str, admin=Depends(require_admin)):
    """ADMIN ONLY — regenerate a new random password for an employee."""
    emp = await users_collection.find_one({"id": employee_id})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    new_password = generate_password()
    await users_collection.update_one(
        {"id": employee_id},
        {"$set": {"password_hash": hash_password(new_password)}},
    )
    return {"new_password": new_password, "phone": emp.get("phone", ""), "name": emp.get("name", "")}


class WelcomeEmailIn(BaseModel):
    """Credentials are passed in directly (from the just-created-account popup)
    rather than looked up — the plaintext password only ever exists in memory
    at creation time, it is never stored or retrievable afterwards."""
    email: str
    name: str
    phone: str
    password: str


@router.get("/email-status")
async def email_status(_admin=Depends(require_admin)):
    """ADMIN ONLY — whether GMAIL_SENDER_EMAIL/GMAIL_APP_PASSWORD are configured,
    so the frontend can hide/disable the Email button instead of failing silently."""
    return {"configured": email_configured()}


@router.post("/send-welcome-email")
async def send_welcome_email_route(data: WelcomeEmailIn, admin=Depends(require_admin)):
    """ADMIN ONLY — one-click send of login credentials to a newly created
    employee's email, from ceo@thefinancialdoctor.in."""
    ok, message = send_welcome_email(data.email, data.name, data.phone, data.password)
    if not ok:
        raise HTTPException(status_code=503, detail=message)
    return {"status": "sent"}
