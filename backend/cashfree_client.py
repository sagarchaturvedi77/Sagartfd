"""Cashfree Payment Gateway (PG API v3) — shared order-creation and
webhook-signature-verification helpers, used by every payment flow in this
app (internship signup, certificate regeneration, ...). One integration,
differentiated per caller by a `payment_type` string stored on the order
record (see database.py's payment_orders_collection) — not a separate
Cashfree integration per feature.

Sandbox vs production is controlled entirely by CASHFREE_ENV in .env — flip
it only after a real sandbox payment has been verified end-to-end.
"""
import base64
import hashlib
import hmac
import os
import uuid
from typing import Optional

import httpx

CASHFREE_APP_ID = os.environ.get("CASHFREE_APP_ID")
CASHFREE_SECRET_KEY = os.environ.get("CASHFREE_SECRET_KEY")
CASHFREE_ENV = os.environ.get("CASHFREE_ENV", "sandbox").strip().lower()
CASHFREE_API_VERSION = "2023-08-01"


def cashfree_configured() -> bool:
    return bool(CASHFREE_APP_ID and CASHFREE_SECRET_KEY)


def _base_url() -> str:
    return "https://api.cashfree.com/pg" if CASHFREE_ENV == "production" else "https://sandbox.cashfree.com/pg"


def _headers() -> dict:
    return {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": CASHFREE_API_VERSION,
        "Content-Type": "application/json",
    }


def new_order_id(prefix: str) -> str:
    """Cashfree order_ids must be alphanumeric plus a small set of symbols —
    keep it simple and always unique."""
    return f"{prefix}-{uuid.uuid4().hex[:20]}"


class CashfreeError(Exception):
    pass


async def create_order(
    order_id: str,
    amount: float,
    customer_id: str,
    customer_phone: str,
    customer_email: Optional[str],
    return_url: str,
    notify_url: str,
    order_note: Optional[str] = None,
) -> dict:
    """Creates a Cashfree order and returns the raw API response, which
    includes `payment_session_id` (handed to the frontend Drop-in Checkout
    SDK) and `cf_order_id` (Cashfree's own internal id)."""
    if not cashfree_configured():
        raise CashfreeError("Cashfree is not configured (missing CASHFREE_APP_ID/CASHFREE_SECRET_KEY)")

    payload = {
        "order_id": order_id,
        "order_amount": round(amount, 2),
        "order_currency": "INR",
        "customer_details": {
            "customer_id": customer_id,
            "customer_phone": customer_phone,
            **({"customer_email": customer_email} if customer_email else {}),
        },
        "order_meta": {
            "return_url": return_url,
            "notify_url": notify_url,
        },
    }
    if order_note:
        payload["order_note"] = order_note

    async with httpx.AsyncClient(timeout=30.0) as cli:
        resp = await cli.post(f"{_base_url()}/orders", headers=_headers(), json=payload)
    if resp.status_code not in (200, 201):
        raise CashfreeError(f"Cashfree create_order failed {resp.status_code}: {resp.text[:500]}")
    return resp.json()


async def get_order(order_id: str) -> dict:
    """Server-side status check — used as a fallback/reconciliation path
    when a webhook hasn't arrived yet (never trust the client-side redirect
    alone for whether a payment actually succeeded)."""
    if not cashfree_configured():
        raise CashfreeError("Cashfree is not configured")
    async with httpx.AsyncClient(timeout=30.0) as cli:
        resp = await cli.get(f"{_base_url()}/orders/{order_id}", headers=_headers())
    if resp.status_code != 200:
        raise CashfreeError(f"Cashfree get_order failed {resp.status_code}: {resp.text[:500]}")
    return resp.json()


def verify_webhook_signature(raw_body: bytes, timestamp: str, signature: str) -> bool:
    """Cashfree signs webhooks as base64(HMAC-SHA256(timestamp + raw_body,
    secret_key)) in the `x-webhook-signature` header, alongside a
    `x-webhook-timestamp` header carrying the timestamp used. Recomputing
    and comparing this is the ONLY trustworthy way to know a webhook call
    actually came from Cashfree — the payload's own "status" field must
    never be trusted without this check passing first."""
    if not CASHFREE_SECRET_KEY or not signature or not timestamp:
        return False
    signed_payload = timestamp.encode("utf-8") + raw_body
    computed = base64.b64encode(
        hmac.new(CASHFREE_SECRET_KEY.encode("utf-8"), signed_payload, hashlib.sha256).digest()
    ).decode("utf-8")
    return hmac.compare_digest(computed, signature)
