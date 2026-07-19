"""Google Business Profile OAuth + API client — lets the admin portal pull
live reviews and location info from TFD's Google Business Profile listing.

Auth is OAuth 2.0 (3-legged, admin-consent, not a service account) — Google
requires the actual account owner to grant access; there is no server-to-
server credential type for Business Profile data. Tokens are stored in
business_settings_collection under _id="google_business_oauth" (same
generic settings-doc pattern invoice_routes.py already uses for
"gst_template"), not a dedicated collection, since there is only ever one
connected business.

Google's Business Profile surface is split across three separate APIs that
must each be enabled in Cloud Console:
  - mybusinessaccountmanagement (list accounts)
  - mybusinessbusinessinformation (list locations)
  - mybusiness v4 (reviews — this is the older "Google My Business API";
    Google has at times gated review-read access behind an approval
    request even after enabling it in Console, so review fetches are
    expected to potentially 403 until/unless that's granted — every
    review-fetch call here surfaces that error clearly rather than
    swallowing it, so it's obvious what's actually blocking it.)
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx

from database import business_settings_collection

GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
BACKEND_PUBLIC_URL = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/")
REDIRECT_URI = f"{BACKEND_PUBLIC_URL}/api/admin/google-business/callback"

AUTH_URI = "https://accounts.google.com/o/oauth2/auth"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/business.manage"

SETTINGS_ID = "google_business_oauth"


class GoogleBusinessError(Exception):
    pass


def google_business_configured() -> bool:
    return bool(GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET and BACKEND_PUBLIC_URL)


def missing_config_vars() -> list[str]:
    """Named so a "not configured" admin-settings message can say exactly
    which variable is absent, instead of a generic message that leaves the
    actual cause (typo'd name, wrong service, stale process, ...) a guessing
    game between three separate variables."""
    missing = []
    if not GOOGLE_OAUTH_CLIENT_ID:
        missing.append("GOOGLE_OAUTH_CLIENT_ID")
    if not GOOGLE_OAUTH_CLIENT_SECRET:
        missing.append("GOOGLE_OAUTH_CLIENT_SECRET")
    if not BACKEND_PUBLIC_URL:
        missing.append("BACKEND_PUBLIC_URL")
    return missing


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",  # required to get a refresh_token back
        "prompt": "consent",  # forces a fresh refresh_token even on re-auth
        "state": state,
    }
    return f"{AUTH_URI}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(TOKEN_URI, data={
            "code": code,
            "client_id": GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        })
    if resp.status_code != 200:
        raise GoogleBusinessError(f"Token exchange failed: {resp.text[:300]}")
    return resp.json()


async def _refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(TOKEN_URI, data={
            "refresh_token": refresh_token,
            "client_id": GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "grant_type": "refresh_token",
        })
    if resp.status_code != 200:
        raise GoogleBusinessError(f"Token refresh failed: {resp.text[:300]}")
    return resp.json()


async def save_tokens(token_data: dict, extra: Optional[dict] = None) -> None:
    now = datetime.now(timezone.utc)
    doc = {
        "access_token": token_data["access_token"],
        "expires_at": now + timedelta(seconds=token_data.get("expires_in", 3600)),
        "connected_at": now,
        "updated_at": now,
    }
    # Google only returns refresh_token on the FIRST consent (or when
    # prompt=consent forces a fresh one) — never overwrite a previously
    # stored one with a missing value on a later token refresh.
    if token_data.get("refresh_token"):
        doc["refresh_token"] = token_data["refresh_token"]
    if extra:
        doc.update(extra)
    await business_settings_collection.update_one({"_id": SETTINGS_ID}, {"$set": doc}, upsert=True)


async def get_valid_access_token() -> str:
    """Returns a currently-valid access token, transparently refreshing via
    the stored refresh_token if the cached one has expired (or is about to,
    within a minute — avoids a race where it expires mid-request)."""
    settings = await business_settings_collection.find_one({"_id": SETTINGS_ID})
    if not settings or not settings.get("refresh_token"):
        raise GoogleBusinessError("Google Business isn't connected yet — connect it from the admin settings page first.")

    expires_at = settings.get("expires_at")
    now = datetime.now(timezone.utc)
    if expires_at and expires_at.replace(tzinfo=timezone.utc) > now + timedelta(minutes=1):
        return settings["access_token"]

    token_data = await _refresh_access_token(settings["refresh_token"])
    await save_tokens(token_data)
    return token_data["access_token"]


async def _api_get(url: str, access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
    if resp.status_code != 200:
        raise GoogleBusinessError(f"Google API call failed ({resp.status_code}): {resp.text[:300]}")
    return resp.json()


async def list_accounts() -> list[dict]:
    token = await get_valid_access_token()
    data = await _api_get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token)
    return data.get("accounts", [])


async def list_locations(account_name: str) -> list[dict]:
    """account_name is the resource name from list_accounts(), e.g.
    'accounts/1234567890'."""
    token = await get_valid_access_token()
    url = (
        f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations"
        "?readMask=name,title,phoneNumbers,storefrontAddress,regularHours,websiteUri"
    )
    data = await _api_get(url, token)
    return data.get("locations", [])


async def get_connection_status() -> dict:
    settings = await business_settings_collection.find_one({"_id": SETTINGS_ID}, {"_id": 0, "refresh_token": 0, "access_token": 0})
    if not settings:
        return {"connected": False}
    return {"connected": bool(settings.get("connected_at")), **settings}


async def disconnect() -> None:
    await business_settings_collection.delete_one({"_id": SETTINGS_ID})


async def fetch_reviews(account_id: str, location_id: str) -> list[dict]:
    """Reviews live under the older v4 "Google My Business API", which
    Google has historically gated review-read access behind a separate
    approval request even after the API is enabled in Cloud Console — a
    403 here most likely means that access hasn't been granted yet, not a
    code bug. Surfaced as GoogleBusinessError so the caller can show a
    clear message instead of a generic failure."""
    token = await get_valid_access_token()
    url = f"https://mybusiness.googleapis.com/v4/accounts/{account_id}/locations/{location_id}/reviews"
    try:
        data = await _api_get(url, token)
    except GoogleBusinessError as e:
        if "403" in str(e):
            raise GoogleBusinessError(
                "Google returned 403 for the reviews endpoint — this usually means the older "
                "'Google My Business API' (v4, used for reviews) needs a separate access request "
                "approved by Google, beyond just enabling it in Cloud Console. Account/location "
                "info still works without this."
            ) from e
        raise
    return data.get("reviews", [])
