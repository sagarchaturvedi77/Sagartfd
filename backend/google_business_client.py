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

from database import business_settings_collection, gbp_post_queue_collection, internship_content_collection

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
        "?readMask=name,title,phoneNumbers,storefrontAddress,regularHours,websiteUri,metadata"
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


def build_post_summary(title: str, meta_description: Optional[str] = None, hashtags: Optional[list[str]] = None) -> str:
    """Short-hook Local Post text: headline + one-line description +
    hashtags, in that order — trimmed to stay well under the API's ~1500
    character cap on `summary` (GBP posts read best around 100-300 chars
    anyway, so this rarely needs the trim in practice)."""
    parts = [title]
    if meta_description:
        parts.append(meta_description)
    if hashtags:
        parts.append(" ".join(hashtags))
    return "\n\n".join(p for p in parts if p)[:1490]


async def create_local_post(
    account_id: str,
    location_id: str,
    summary: str,
    cta_url: str,
    image_url: Optional[str] = None,
) -> dict:
    """Creates a Google Business Profile "Local Post" (the Updates/What's
    New feed) — short hook text + a "Learn More" button pointing at the
    blog URL, optionally with a photo attached.

    Local Posts live under the same older v4 "Google My Business API" as
    reviews (see fetch_reviews' docstring) — Google has, in the past,
    gated write access to this API behind a separate approval request even
    after it's enabled in Cloud Console, so a 403/404 here most likely
    means that access hasn't been granted yet, not a code bug.
    """
    token = await get_valid_access_token()
    url = f"https://mybusiness.googleapis.com/v4/accounts/{account_id}/locations/{location_id}/localPosts"
    payload = {
        "languageCode": "en-US",
        "summary": summary,
        "callToAction": {"actionType": "LEARN_MORE", "url": cta_url},
        "topicType": "STANDARD",
    }
    if image_url:
        payload["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": image_url}]

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, headers={"Authorization": f"Bearer {token}"}, json=payload)
    if resp.status_code not in (200, 201):
        raise GoogleBusinessError(f"Local Post creation failed ({resp.status_code}): {resp.text[:300]}")
    return resp.json()


SITE_URL = "https://thefinancialdoctor.in"
SHARE_CARD_IMAGE = f"{SITE_URL}/assets/og/blog-share-card.png"


async def post_blog_content(content: dict) -> dict:
    """Orchestrates posting one published blog doc (from
    internship_content_collection) to GBP as a Local Post — short hook +
    "Learn More" CTA to the blog's own URL, with the branded share card as
    the photo. Used both by the manual admin-triggered route and the
    auto-fire hook on blog publish (internship_content_routes.py).

    Raises GoogleBusinessError for any failure (not connected, no location
    linked, API error) — callers decide whether that's fatal (manual
    route) or just logged (auto-fire, which must never block a publish).
    """
    settings = await get_connection_status()
    if not settings.get("connected"):
        raise GoogleBusinessError("Google Business isn't connected yet.")
    account_name = settings.get("account_name")
    location_name = settings.get("location_name")
    if not account_name or not location_name:
        raise GoogleBusinessError(
            "No Business Profile location is linked to this connection yet — "
            "reconnect from the admin settings page once the account/location can be resolved."
        )
    account_id = account_name.split("/")[-1]
    location_id = location_name.split("/")[-1]

    summary = build_post_summary(
        title=content.get("title", ""),
        meta_description=content.get("meta_description"),
        hashtags=content.get("hashtags"),
    )
    cta_url = f"{SITE_URL}/blog/{content['id']}"
    return await create_local_post(account_id, location_id, summary, cta_url, image_url=SHARE_CARD_IMAGE)


# ── Drip-post queue (Part 1 of the "ready the moment GBP approval lands"
# work) — spreads the existing ~150-post blog backlog out at one post
# every 2 days instead of firing all of them the instant OAuth connects. ──

async def mark_queue_posted(content_id: str, title: str = "") -> None:
    """Marks (or creates, if it was never backfilled into the queue) a
    drip-queue entry as already posted. Called after EITHER the manual
    admin trigger (google_business_routes.py's POST /post-blog/{id}) or the
    auto-fire hook on approval (internship_content_routes.py) successfully
    posts a blog to GBP — without this, a later backfill run would add that
    same content_id back in as "pending" (backfill only skips content_ids
    already present in the queue, and a manually/auto-posted item may never
    have been added yet) and the drip job would eventually re-post it.
    Upsert, not update-only, since a manually-pushed post that predates its
    own backfill entry has nothing to update yet."""
    now = datetime.now(timezone.utc)
    await gbp_post_queue_collection.update_one(
        {"content_id": content_id},
        {
            "$set": {"status": "posted", "posted_at": now, "title": title or "", "error": None},
            "$setOnInsert": {
                "queued_at": now,
                "summary": None,
                "og_image_url": f"{SITE_URL}/assets/og/blog-post-{content_id}.png",
                "blog_link": f"{SITE_URL}/blog/{content_id}",
            },
        },
        upsert=True,
    )


async def backfill_post_queue() -> dict:
    """One-off (but safe to re-run — idempotent) population of the GBP
    drip-post queue from every currently-published blog post. Skips any
    content_id already present in the queue regardless of status, so
    re-running after new posts get approved/auto-posted only adds the
    genuinely new ones, and never re-queues something mark_queue_posted
    already recorded as posted."""
    existing_ids = {
        d["content_id"]
        async for d in gbp_post_queue_collection.find({}, {"content_id": 1})
    }
    added = 0
    async for content in internship_content_collection.find({"status": "published", "content_type": "blog"}):
        content_id = content["id"]
        if content_id in existing_ids:
            continue
        summary = build_post_summary(
            title=content.get("title", ""),
            meta_description=content.get("meta_description"),
            hashtags=content.get("hashtags"),
        )
        await gbp_post_queue_collection.insert_one({
            "content_id": content_id,
            "title": content.get("title", ""),
            "summary": summary,
            "og_image_url": f"{SITE_URL}/assets/og/blog-post-{content_id}.png",
            "blog_link": f"{SITE_URL}/blog/{content_id}",
            "status": "pending",
            "queued_at": datetime.now(timezone.utc),
            "posted_at": None,
            "error": None,
        })
        added += 1
    total_pending = await gbp_post_queue_collection.count_documents({"status": "pending"})
    return {"added": added, "total_pending": total_pending}


async def process_gbp_post_queue() -> dict:
    """Picks the OLDEST still-"pending" drip-queue entry and attempts to
    post it, marking it "posted"/"failed" accordingly. Called on a 2-day
    cadence — gated by scheduler_worker.py's _job_due_every_n_days(
    "gbp_post_queue", ...) — via internal_routes.py's async
    run_scheduled_tasks, not scheduler_worker.py's own (sync, pymongo)
    run_due_checks directly: posting needs this module's async Motor +
    async httpx calls, and reusing that same async Motor client from a
    second event loop spun up inside scheduler_worker's sync thread-pool
    thread is unsafe (Motor's internal locks bind to whichever event loop
    first used them) — the exact reason internal_routes.py already keeps
    the internship auto-graduate/manager-checkin/mailbox jobs out of
    run_due_checks too.

    Uses the queue doc's OWN stored summary/image/link (snapshotted at
    backfill/queue time) rather than re-fetching+rebuilding from
    internship_content_collection, so a queue entry's caption stays stable
    even if the source post is edited later.

    Never raises — a failure (most likely "GBP not connected yet" until
    Google's approval lands) is recorded on the entry and the function
    returns normally, so one failed attempt never blocks the next
    scheduled attempt (2 days later, next-oldest pending entry) from
    trying."""
    doc = await gbp_post_queue_collection.find_one({"status": "pending"}, sort=[("queued_at", 1)])
    if not doc:
        return {"status": "empty"}

    try:
        settings = await get_connection_status()
        if not settings.get("connected"):
            raise GoogleBusinessError("GBP not connected yet — waiting on Google API approval.")
        account_name = settings.get("account_name")
        location_name = settings.get("location_name")
        if not account_name or not location_name:
            raise GoogleBusinessError("Connected, but no Business Profile location is linked yet.")
        account_id = account_name.split("/")[-1]
        location_id = location_name.split("/")[-1]
        await create_local_post(
            account_id, location_id,
            summary=doc.get("summary") or doc.get("title", ""),
            cta_url=doc["blog_link"],
            image_url=doc.get("og_image_url"),
        )
    except Exception as e:
        await gbp_post_queue_collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": "failed", "error": str(e)[:300]}},
        )
        return {"status": "failed", "content_id": doc.get("content_id"), "title": doc.get("title"), "error": str(e)[:300]}

    await gbp_post_queue_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "posted", "posted_at": datetime.now(timezone.utc), "error": None}},
    )
    return {"status": "posted", "content_id": doc.get("content_id"), "title": doc.get("title")}


# ── Reviews cache (Part 2) — GET /reviews degrades to the last-successful
# fetch instead of erroring while the GBP API is unapproved. Stored in
# business_settings_collection under its own _id, same generic
# settings-doc pattern the OAuth tokens use (see module docstring). ──

REVIEWS_CACHE_ID = "google_business_reviews_cache"


async def get_cached_reviews() -> dict:
    """Returns the last-successful reviews fetch, or an empty,
    clearly-"not yet available" result if nothing has ever been fetched
    successfully (e.g. before GBP approval lands)."""
    doc = await business_settings_collection.find_one({"_id": REVIEWS_CACHE_ID})
    if not doc:
        return {"reviews": [], "cached": False, "cached_at": None, "available": False}
    return {"reviews": doc.get("reviews", []), "cached": True, "cached_at": doc.get("cached_at"), "available": True}


async def save_reviews_cache(reviews: list[dict]) -> None:
    await business_settings_collection.update_one(
        {"_id": REVIEWS_CACHE_ID},
        {"$set": {"reviews": reviews, "cached_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


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
