from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime

from auth_models import UserCreate, UserLogin, UserOut, UserInDB, TokenResponse, PasswordChange
from auth_utils import hash_password, verify_password, create_access_token, require_admin, get_current_user_payload
from database import users_collection

router = APIRouter(prefix="/api/auth", tags=["auth"])


def to_user_out(doc: dict) -> UserOut:
    return UserOut(
        id=doc["id"], name=doc["name"], email=doc["email"], role=doc["role"],
        phone=doc.get("phone"), designation=doc.get("designation"),
        created_at=doc["created_at"],
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

    new_user = UserInDB(
        name=payload.name, email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role, phone=payload.phone, designation=payload.designation,
    )
    await users_collection.insert_one(new_user.dict())
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
    await users_collection.update_one(
        {"id": payload["sub"]},
        {"$set": {"password_hash": hash_password(data.new_password)}},
    )
    return {"status": "password_changed"}


@router.get("/employees", response_model=list[UserOut])
async def list_employees(admin=Depends(require_admin)):
    """ADMIN ONLY — lists all employee accounts for the admin dashboard."""
    cursor = users_collection.find({"role": "employee"})
    employees = [to_user_out(doc) async for doc in cursor]
    return employees


@router.patch("/employees/{employee_id}/deactivate")
async def deactivate_employee(employee_id: str, admin=Depends(require_admin)):
    """ADMIN ONLY — disable an employee's login without deleting their data/history."""
    result = await users_collection.update_one({"id": employee_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"status": "deactivated"}
