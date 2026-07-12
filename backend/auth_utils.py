import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from database import users_collection

# 🔐 Set a strong random value for JWT_SECRET in your .env — never hardcode in production.
# Refuses to start rather than silently signing tokens with a known-weak
# default: a missing/placeholder secret would let anyone forge admin logins.
JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET or JWT_SECRET == "CHANGE_THIS_SECRET_KEY":
    raise RuntimeError(
        "JWT_SECRET environment variable is missing (or still the placeholder value). "
        "Set a strong random JWT_SECRET before starting the app."
    )
JWT_ALGORITHM = "HS256"
# Staff expect to stay logged in on their own device indefinitely, the same
# way the native app-switcher behaves for any other app — sessions should
# only end when the user explicitly logs out, not after a few hours idle.
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 90  # 90 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Decodes JWT and returns {sub: user_id, role: role}. Use in protected routes.

    Also re-checks is_active against the DB on every call (not just at
    login) — JWTs are otherwise stateless and valid for their full 90-day
    life regardless of what happens to the account afterward, so an admin
    disabling someone's login wouldn't actually end their already-open
    session without this. The extra query is deliberately kept to a single
    indexed field so it doesn't meaningfully add latency."""
    payload = decode_token(token)
    user = await users_collection.find_one({"id": payload["sub"]}, {"is_active": 1})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return payload


def require_admin(payload: dict = Depends(get_current_user_payload)) -> dict:
    """Dependency that blocks non-admin users from admin-only routes."""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload
