"""Admin-only: connect TFD's Google Business Profile via OAuth and pull
location/review data into the portal. See google_business_client.py for the
actual Google API calls — this file is just the FastAPI routes."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from auth_utils import require_admin
from database import business_settings_collection, internship_content_collection
import google_business_client as gb

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/google-business", tags=["google-business"])

FRONTEND_SITE_URL = "https://www.thefinancialdoctor.in"
STATE_SETTINGS_ID = "google_business_oauth_state"


@router.get("/status")
async def status(_admin: dict = Depends(require_admin)):
    missing = gb.missing_config_vars()
    if missing:
        return {"connected": False, "configured": False, "missing_env_vars": missing}
    result = await gb.get_connection_status()
    result["configured"] = True
    return result


@router.get("/authorize")
async def authorize(_admin: dict = Depends(require_admin)):
    """Returns the Google consent URL for the frontend to redirect the
    browser to — not a server-side redirect itself, since this is called
    via an authenticated fetch (Authorization header), which a full-page
    browser redirect can't carry."""
    if not gb.google_business_configured():
        raise HTTPException(status_code=503, detail="Google Business isn't configured yet — GOOGLE_OAUTH_CLIENT_ID/SECRET missing.")
    state = secrets.token_urlsafe(24)
    await business_settings_collection.update_one(
        {"_id": STATE_SETTINGS_ID},
        {"$set": {"state": state, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"authorize_url": gb.build_authorize_url(state)}


@router.get("/callback")
async def callback(code: str = Query(default=""), state: str = Query(default=""), error: str = Query(default="")):
    """Public — this is where Google itself redirects the browser back to
    after the admin grants (or denies) consent, so it can't require our own
    JWT. The random `state` value (minted in authorize() above, valid for
    10 minutes) is the CSRF protection instead — anyone hitting this URL
    without a state Google itself just issued gets rejected."""
    redirect_target = f"{FRONTEND_SITE_URL}/portal/admin/settings?google_business="

    if error:
        return RedirectResponse(f"{redirect_target}denied")

    stored = await business_settings_collection.find_one({"_id": STATE_SETTINGS_ID})
    valid_state = (
        stored
        and stored.get("state") == state
        and stored.get("created_at")
        and stored["created_at"].replace(tzinfo=timezone.utc) > datetime.now(timezone.utc) - timedelta(minutes=10)
    )
    if not valid_state:
        return RedirectResponse(f"{redirect_target}invalid_state")

    await business_settings_collection.delete_one({"_id": STATE_SETTINGS_ID})

    try:
        token_data = await gb.exchange_code_for_tokens(code)
        await gb.save_tokens(token_data)

        # Discover and cache the account/location resource names right
        # away, so every later reviews/location call doesn't need to
        # re-walk accounts -> locations itself.
        accounts = await gb.list_accounts()
        if accounts:
            account_name = accounts[0]["name"]  # e.g. "accounts/1234567890"
            locations = await gb.list_locations(account_name)
            location_name = locations[0]["name"] if locations else None
            await gb.save_tokens({"access_token": token_data["access_token"]}, extra={
                "account_name": account_name,
                "location_name": location_name,
                "location_title": locations[0].get("title") if locations else None,
            })
    except gb.GoogleBusinessError:
        logger.exception("Google Business OAuth callback failed")
        return RedirectResponse(f"{redirect_target}error")

    return RedirectResponse(f"{redirect_target}connected")


@router.post("/disconnect")
async def disconnect(_admin: dict = Depends(require_admin)):
    await gb.disconnect()
    return {"status": "disconnected"}


@router.post("/post-blog/{content_id}")
async def post_blog_to_gbp(content_id: str, _admin: dict = Depends(require_admin)):
    """Manually pushes one published blog post to Google Business Profile
    as a Local Post — same short-hook + "Learn More" CTA format the
    auto-fire hook uses on new publishes (internship_content_routes.py),
    exposed here so a specific post (including ones from the existing
    150-post backlog) can be pushed individually, on the admin's own
    throttled schedule, instead of only ever firing automatically."""
    content = await internship_content_collection.find_one({"id": content_id, "content_type": "blog"})
    if not content:
        raise HTTPException(status_code=404, detail="Blog post not found")
    if content.get("status") != "published":
        raise HTTPException(status_code=409, detail="Only published posts can be pushed to GBP")
    try:
        result = await gb.post_blog_content(content)
    except gb.GoogleBusinessError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"status": "posted", "gbp_response": result}


@router.get("/reviews")
async def reviews(_admin: dict = Depends(require_admin)):
    settings = await gb.get_connection_status()
    if not settings.get("connected"):
        raise HTTPException(status_code=409, detail="Google Business isn't connected yet.")
    account_name = settings.get("account_name")  # "accounts/123"
    location_name = settings.get("location_name")  # "accounts/123/locations/456"
    if not account_name or not location_name:
        raise HTTPException(status_code=409, detail="No location found on this Google Business account.")
    account_id = account_name.split("/")[-1]
    location_id = location_name.split("/")[-1]
    try:
        return {"reviews": await gb.fetch_reviews(account_id, location_id)}
    except gb.GoogleBusinessError as e:
        raise HTTPException(status_code=502, detail=str(e))
