import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# 🔐 Set a strong random value for JWT_SECRET in your .env — never hardcode in production.
JWT_SECRET = os.environ.get("JWT_SECRET", "CHANGE_THIS_SECRET_KEY")
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
    """Decodes JWT and returns {sub: user_id, role: role}. Use in protected routes."""
    return decode_token(token)


def require_admin(payload: dict = Depends(get_current_user_payload)) -> dict:
    """Dependency that blocks non-admin users from admin-only routes."""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return payload
