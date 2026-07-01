import re
from uuid import uuid4


def gen_employee_id_from_phone(phone: str) -> str:
    """Generate employee ID in format: TFD + first2 + (5th&6th) + last2 from a 10+ digit phone.

    Examples:
      phone=9876543210 -> TFD98 54 10 => TFD985410
    If phone is missing or shorter than 10 digits, fall back to TFD + 6 hex chars.
    """
    if not phone:
        return f"TFD{uuid4().hex[:6].upper()}"
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        first2 = digits[:2]
        mid56 = digits[4:6]
        last2 = digits[-2:]
        return f"TFD{first2}{mid56}{last2}"
    return f"TFD{uuid4().hex[:6].upper()}"
