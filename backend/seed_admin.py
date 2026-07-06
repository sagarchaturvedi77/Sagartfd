"""
Run this ONCE to create the very first admin account.
Usage: python seed_admin.py
After running, log in with this email/password from the admin login page.
"""
import asyncio
from datetime import datetime
from auth_models import UserInDB
from auth_utils import hash_password
from database import users_collection

ADMIN_NAME = "Sagar Chaturvedi"
ADMIN_EMAIL = "ceo@thefinancialdoctor.in"
ADMIN_PHONE = "9876543210"
ADMIN_PASSWORD = "Sagar@123"


async def seed():
    existing = await users_collection.find_one({"email": ADMIN_EMAIL})
    if existing:
        print("Admin already exists, skipping.")
        return

    admin = UserInDB(
        name=ADMIN_NAME, email=ADMIN_EMAIL,
        phone=ADMIN_PHONE,
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
    )
    await users_collection.insert_one(admin.dict())
    print(f"✅ Admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print("   (Also login with phone: {ADMIN_PHONE})")
    print("⚠️  Log in once, then change this password immediately.")


if __name__ == "__main__":
    asyncio.run(seed())
