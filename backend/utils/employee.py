import random


def gen_random_employee_id() -> str:
    """TFD + a random 6-digit number — deliberately not derived from the
    phone number (the old scheme was TFD + digits picked out of the phone
    itself, e.g. phone=9876543210 -> TFD985410), since anyone who knows both
    the formula and an employee's phone number could compute their employee
    ID without it ever being shared. The caller is expected to check this
    against users_collection for uniqueness and retry on the rare collision
    (see create_employee in auth_routes.py)."""
    return f"TFD{random.randint(100000, 999999)}"
