"""
Run this ONCE to create the very first admin account on a fresh database.
Usage: python seed_admin.py
Set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PHONE / ADMIN_PASSWORD as environment
variables to control the created account; ADMIN_PASSWORD is optional — if
left unset, a secure random password is generated and printed once (it is
never stored anywhere else, so save it immediately).
Already has an admin with this email? The script no-ops — safe to re-run,
and it never touches an existing account's password.
"""
import asyncio
import os
import secrets
import string

from auth_models import UserInDB
from auth_utils import hash_password
from database import users_collection

ADMIN_NAME = os.environ.get("ADMIN_NAME", "Sagar Chaturvedi")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "ceo@thefinancialdoctor.in")
ADMIN_PHONE = os.environ.get("ADMIN_PHONE", "9876543210")


def generate_secure_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def seed():
    existing = await users_collection.find_one({"email": ADMIN_EMAIL})
    if existing:
        print("Admin already exists, skipping.")
        return

    password = os.environ.get("ADMIN_PASSWORD") or generate_secure_password()
    admin = UserInDB(
        name=ADMIN_NAME, email=ADMIN_EMAIL,
        phone=ADMIN_PHONE,
        password_hash=hash_password(password),
        role="admin",
    )
    await users_collection.insert_one(admin.dict())
    print(f"✅ Admin created: {ADMIN_EMAIL} (phone: {ADMIN_PHONE})")
    print(f"   Password: {password}")
    print("⚠️  This password is shown only once and is not stored anywhere — save it now, then log in and change it immediately.")


if __name__ == "__main__":
    asyncio.run(seed())
