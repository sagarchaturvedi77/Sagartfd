"""Student blog/FAQ writing — mutual fund / financial-planning topics,
written by interns across every track. Every submission is Gemini-scored
and checked for near-duplicates against existing content on the same
topic (so 10 students writing basically the same SIP FAQ merge into one
entry instead of publishing 10 times). Nothing reaches the real public
website until an admin approves it from the queue here — see
CLAUDE.md-adjacent product notes on why: this is content about regulated
financial products going out under TFD's real, AMFI-registered brand.
"""
import logging
from datetime import datetime, timezone
from difflib import SequenceMatcher

from fastapi import APIRouter, Depends, HTTPException, Query

from auth_utils import require_admin
from database import internship_content_collection, internship_students_collection
from internship_routes import _call_gemini, get_current_student_payload
from internship_content_models import (
    TOPIC_LABELS,
    TOPIC_PRODUCT_LINKS,
    ContentInDB,
    ContentOut,
    ContentReviewIn,
    ContentSubmitIn,
    PublicContentOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/internship", tags=["internship-content"])

# Points a fully-approved (100% quality score) piece contributes toward the
# student's certificate percentage — capped in total (see CONTENT_BONUS_CAP
# below) so a flood of content can't dwarf the actual task-based curriculum,
# but still a real, meaningful chunk (roughly a quarter of Finance's 8-task
# total) so quality genuinely moves the needle like requested.
_BLOG_MAX_POINTS = 40
_FAQ_MAX_POINTS = 15
_POSTER_MAX_POINTS = 25
_REEL_MAX_POINTS = 25
CONTENT_BONUS_CAP = 300
_CONTENT_MAX_POINTS = {"blog": _BLOG_MAX_POINTS, "faq": _FAQ_MAX_POINTS, "poster": _POSTER_MAX_POINTS, "reel": _REEL_MAX_POINTS}

# Above this text-similarity ratio (difflib, on normalized/lowercased body
# text), a new submission is treated as a near-duplicate of existing
# content on the same topic+type and gets merged rather than queued again.
_DUPLICATE_SIMILARITY_THRESHOLD = 0.72


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


async def _find_near_duplicate(content_type: str, topic: str, body: str) -> dict | None:
    norm = _normalize(body)
    cursor = internship_content_collection.find(
        {"content_type": content_type, "topic": topic, "status": {"$in": ["pending_review", "approved", "published"]}}
    )
    async for doc in cursor:
        ratio = SequenceMatcher(None, norm, _normalize(doc.get("body", ""))).ratio()
        if ratio >= _DUPLICATE_SIMILARITY_THRESHOLD:
            return doc
    return None


_VERIFY_SYSTEM_PROMPT = """You are reviewing a piece of content written by a college-age intern for TFD
(The Financial Doctor, a mutual fund distributor) — either financial-education content (a blog post or
FAQ answer about mutual funds/insurance/financial planning) or a marketing poster/reel concept (headline,
key message, and how the disclaimer/logo/website are described as being used). Either way it's meant to
possibly be used as real TFD content, so it needs the same scrutiny.

Score it 0-100 on: is it accurate (no factually wrong claims about how SIP/lumpsum/SWP/mutual funds
actually work), is it genuinely useful/clear (not vague filler), and does it AVOID anything a real
regulated financial-services company legally cannot publish — no guaranteed/fixed return promises, no
"this fund will definitely give you X%", no advice framed as certain rather than an estimate.

Respond in EXACTLY this format, nothing else:
SCORE: <a number 0-100>
FLAG: <YES if it contains a compliance problem (guaranteed returns, factually wrong claim), NO otherwise>
FEEDBACK: <one or two sentences — if FLAG is YES, explain exactly what's wrong; otherwise a short quality note>
"""


async def _verify_content(title: str, body: str) -> tuple[float, bool, str]:
    """(score, compliance_flag, feedback). Falls back to a neutral,
    conservative score if Gemini isn't configured/reachable — never blocks
    submission, just means the admin queue leans on human judgment alone
    for that item, same posture as _auto_verify_text's own fallback."""
    text_out = await _call_gemini(_VERIFY_SYSTEM_PROMPT, f"TITLE: {title}\n\nBODY: {body}", temperature=0.1)
    if not text_out:
        return 50.0, False, "AI review unavailable — please assess manually."

    score, flag, feedback = 50.0, False, ""
    for line in text_out.split("\n"):
        if line.upper().startswith("SCORE:"):
            try:
                score = max(0.0, min(100.0, float(line.split(":", 1)[1].strip())))
            except ValueError:
                pass
        elif line.upper().startswith("FLAG:"):
            flag = "YES" in line.upper()
        elif line.upper().startswith("FEEDBACK:"):
            feedback = line.split(":", 1)[1].strip()
    return score, flag, feedback or "Reviewed."


@router.post("/content", response_model=ContentOut)
async def submit_content(data: ContentSubmitIn, payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    score, flag, feedback = await _verify_content(data.title, data.body)
    duplicate = await _find_near_duplicate(data.content_type, data.topic, data.body)

    doc = ContentInDB(
        student_id=student["id"], student_name=student["name"], track=student.get("track") or "",
        content_type=data.content_type, topic=data.topic, title=data.title.strip(), body=data.body.strip(),
        design_link=(data.design_link or "").strip() or None,
        quality_score=score, gemini_feedback=feedback,
        status="merged" if duplicate else "pending_review",
        merged_into_id=duplicate["id"] if duplicate else None,
    ).dict()
    if flag:
        doc["admin_note"] = "⚠️ AI flagged a possible compliance issue — review carefully before approving."

    await internship_content_collection.insert_one(doc)

    if duplicate:
        await internship_content_collection.update_one(
            {"id": duplicate["id"]}, {"$addToSet": {"contributor_ids": student["id"]}}
        )

    return ContentOut(**{k: doc.get(k) for k in ContentOut.model_fields})


@router.get("/content/mine", response_model=list[ContentOut])
async def list_my_content(payload: dict = Depends(get_current_student_payload)):
    cursor = internship_content_collection.find({"student_id": payload["sub"]}).sort("created_at", -1).limit(100)
    return [ContentOut(**{k: doc.get(k) for k in ContentOut.model_fields}) async for doc in cursor]


@router.get("/content/topics")
async def list_topics():
    return [{"value": k, "label": v} for k, v in TOPIC_LABELS.items()]


# ── Admin review queue ────────────────────────────────────────────────

@router.get("/admin/content", response_model=list[ContentOut])
async def admin_list_content(status: str = Query(default="pending_review"), _admin: dict = Depends(require_admin)):
    cursor = internship_content_collection.find({"status": status}).sort("created_at", 1).limit(200)
    return [ContentOut(**{k: doc.get(k) for k in ContentOut.model_fields}) async for doc in cursor]


@router.post("/admin/content/{content_id}/review", response_model=ContentOut)
async def admin_review_content(content_id: str, data: ContentReviewIn, admin: dict = Depends(require_admin)):
    doc = await internship_content_collection.find_one({"id": content_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Content not found")
    if doc["status"] not in ("pending_review",):
        raise HTTPException(status_code=409, detail=f"This item is already {doc['status']}")

    now = datetime.now(timezone.utc)
    update = {"reviewed_by": admin["sub"], "reviewed_at": now.isoformat(), "admin_note": data.admin_note}

    if data.action == "approve":
        update["status"] = "published"
        update["published_at"] = now.isoformat()
        update["product_link"] = TOPIC_PRODUCT_LINKS.get(doc["topic"])

        max_points = _CONTENT_MAX_POINTS.get(doc["content_type"], _FAQ_MAX_POINTS)
        awarded = round((doc.get("quality_score") or 0) / 100 * max_points)
        student = await internship_students_collection.find_one({"id": doc["student_id"]})
        current_bonus = (student or {}).get("content_bonus_points", 0)
        new_bonus = min(CONTENT_BONUS_CAP, current_bonus + awarded)
        await internship_students_collection.update_one(
            {"id": doc["student_id"]}, {"$set": {"content_bonus_points": new_bonus, "updated_at": now}}
        )

        try:
            from notification_service import create_notification
            await create_notification(
                user_id=doc["student_id"],
                title="Your content is live! ✍️",
                body=f"Your {doc['content_type']} on {TOPIC_LABELS.get(doc['topic'], doc['topic'])} was approved and published — +{awarded} points.",
                n_type="internship_content",
                link="/portal/student/missions",
            )
        except Exception:
            logger.warning("Failed to notify student %s of content approval", doc["student_id"])

        # Auto-fire a Google Business Profile Local Post for newly-published
        # blogs (not FAQs — a Local Post needs an article to link to). This
        # is explicitly best-effort: GBP being disconnected, quota-limited,
        # or erroring must never block the actual publish, so any failure
        # here is only logged, never raised.
        if doc["content_type"] == "blog":
            try:
                import google_business_client as gb
                full_doc = {**doc, **update}
                await gb.post_blog_content(full_doc)
            except Exception:
                logger.warning("Failed to auto-post blog %s to Google Business Profile", doc["id"])
    else:
        update["status"] = "rejected"

    await internship_content_collection.update_one({"id": content_id}, {"$set": update})
    updated = await internship_content_collection.find_one({"id": content_id})
    return ContentOut(**{k: updated.get(k) for k in ContentOut.model_fields})


# ── Public (no auth) — what the real website reads ──────────────────────

@router.get("/public/content", response_model=list[PublicContentOut])
async def public_list_content(
    content_type: str = Query(default="blog"),
    topic: str | None = Query(default=None),
    limit: int = Query(default=30, le=300),
    light: bool = Query(default=False, description="Omit body/body_en (list views only ever show title + meta_description; full body is only needed on a single post's detail view)"),
):
    query = {"status": "published", "content_type": content_type}
    if topic:
        query["topic"] = topic
    cursor = internship_content_collection.find(query).sort("published_at", -1).limit(limit)
    out = []
    async for doc in cursor:
        out.append(PublicContentOut(
            id=doc["id"], content_type=doc["content_type"], topic=doc["topic"],
            topic_label=TOPIC_LABELS.get(doc["topic"], doc["topic"]), title=doc["title"],
            body="" if light else doc["body"],
            author_name=doc["student_name"], product_link=doc.get("product_link"),
            published_at=doc.get("published_at") or doc["created_at"],
            meta_description=doc.get("meta_description"), keywords=doc.get("keywords"),
            title_en=doc.get("title_en"), body_en=(None if light else doc.get("body_en")),
            hashtags=doc.get("hashtags"), date_modified=doc.get("date_modified"),
        ))
    return out


@router.get("/public/content/{content_id}", response_model=PublicContentOut)
async def public_get_content(content_id: str):
    doc = await internship_content_collection.find_one({"id": content_id, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return PublicContentOut(
        id=doc["id"], content_type=doc["content_type"], topic=doc["topic"],
        topic_label=TOPIC_LABELS.get(doc["topic"], doc["topic"]), title=doc["title"], body=doc["body"],
        author_name=doc["student_name"], product_link=doc.get("product_link"),
        published_at=doc.get("published_at") or doc["created_at"],
        meta_description=doc.get("meta_description"), keywords=doc.get("keywords"),
        title_en=doc.get("title_en"), body_en=doc.get("body_en"),
        hashtags=doc.get("hashtags"), date_modified=doc.get("date_modified"),
    )
