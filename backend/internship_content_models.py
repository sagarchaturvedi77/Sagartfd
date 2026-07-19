"""Student-written blog/FAQ content — SIP/lumpsum/SWP/financial-planning and
TFD's own products, written as a task by interns across every track (not
just Marketing). Every piece is Gemini-scored and near-duplicate-checked,
then sits in pending_review until an admin approves it — nothing reaches
the real public website or Google Business Profile without that human
checkpoint. See internship_content_routes.py.
"""
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field
import uuid

ContentType = Literal["blog", "faq", "poster", "reel"]

ContentTopic = Literal[
    "sip", "lumpsum", "swp", "financial_planning", "term_insurance",
    "health_insurance", "elss_tax_saving", "retirement_planning",
    "general_investing", "awareness", "brand_comparison", "other",
]

# poster/reel is a design CONCEPT — headline/message/disclaimer written
# here, the actual artwork (if any) lives at design_link (Canva/Drive
# share link) — same "just a link, no file upload" pattern already used
# for the video-review consent flow (InternshipSignup.jsx).
ContentStatus = Literal["pending_review", "approved", "rejected", "merged", "published"]

TOPIC_LABELS: dict[str, str] = {
    "sip": "SIP",
    "lumpsum": "Lumpsum Investing",
    "swp": "SWP (Systematic Withdrawal Plan)",
    "financial_planning": "Financial Planning",
    "term_insurance": "Term Insurance",
    "health_insurance": "Health Insurance",
    "elss_tax_saving": "ELSS / Tax Saving",
    "retirement_planning": "Retirement Planning",
    "general_investing": "General Investing",
    "awareness": "General Awareness",
    "brand_comparison": "Why TFD / Comparison",
    "other": "Other",
}

# Auto-attached on approval when the topic matches — internal site pages
# only (never a direct external policy-purchase link), same reasoning as
# why AIChat.jsx only ever points at Regular Plan / internal pages.
TOPIC_PRODUCT_LINKS: dict[str, Optional[str]] = {
    "sip": "/calculators/sip",
    "lumpsum": "/calculators/lumpsum",
    "swp": "/calculators/swp",
    "financial_planning": "/services",
    "term_insurance": "/services",
    "health_insurance": "/services",
    "elss_tax_saving": "/calculators/tax",
    "retirement_planning": "/calculators/goal",
    "general_investing": "/top-funds",
    "awareness": "/",
    "brand_comparison": "/about-us",
    "other": None,
}


class ContentSubmitIn(BaseModel):
    content_type: ContentType
    topic: ContentTopic
    # FAQ: title = the question, body = the answer.
    # Blog: title = the headline, body = the full post.
    # Poster/Reel: title = headline/hook, body = full concept description
    # (key message, disclaimer text used, how logo/website are placed).
    title: str = Field(min_length=8, max_length=200)
    body: str = Field(min_length=40, max_length=8000)
    # Optional Canva/Drive/social share link to the actual artwork —
    # poster/reel only, never required (concept alone is a valid submission).
    design_link: Optional[str] = Field(default=None, max_length=500)


class ContentReviewIn(BaseModel):
    action: Literal["approve", "reject"]
    admin_note: Optional[str] = None


class ContentInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    student_name: str
    track: str
    content_type: ContentType
    topic: ContentTopic
    title: str
    body: str
    design_link: Optional[str] = None
    status: ContentStatus = "pending_review"
    quality_score: Optional[float] = None          # 0-100, from Gemini
    gemini_feedback: Optional[str] = None
    merged_into_id: Optional[str] = None            # set when status == "merged"
    contributor_ids: list[str] = Field(default_factory=list)  # every student whose near-duplicate merged into this one
    product_link: Optional[str] = None
    admin_note: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_at: Optional[str] = None
    published_at: Optional[str] = None


class ContentOut(BaseModel):
    id: str
    student_id: str
    student_name: str
    content_type: ContentType
    topic: ContentTopic
    title: str
    body: str
    design_link: Optional[str] = None
    status: ContentStatus
    quality_score: Optional[float] = None
    gemini_feedback: Optional[str] = None
    product_link: Optional[str] = None
    admin_note: Optional[str] = None
    created_at: str
    reviewed_at: Optional[str] = None
    published_at: Optional[str] = None


class PublicContentOut(BaseModel):
    """What the public website actually reads — no student_id, no internal
    review fields, only ever content that's status == "published"."""
    id: str
    content_type: ContentType
    topic: ContentTopic
    topic_label: str
    title: str
    body: str
    author_name: str
    product_link: Optional[str] = None
    published_at: str
