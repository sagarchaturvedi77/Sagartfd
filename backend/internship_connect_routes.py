"""TFD Connect — WhatsApp-styled live chat for lead conversion / client
conversation practice against fictional AI-played contacts. Unlike TFD
Mailbox (which simulates a real email delay), replies here are generated
synchronously in the same request, matching WhatsApp's real-time feel."""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from database import internship_connect_threads_collection, internship_students_collection
from internship_connect_models import ConnectContact, ConnectMessage, ConnectSendIn, ConnectThreadInDB, ConnectThreadOut
from internship_models import TRACK_LABELS
from internship_routes import _call_gemini, get_current_student_payload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/internship", tags=["internship-connect"])

CONNECT_CONTACTS: dict[str, list[dict]] = {
    "sales": [
        {"id": "arjun-mehta", "name": "Arjun Mehta", "role": "Owner, 2-outlet retail store — evaluating your pitch", "temperament": "price-sensitive, was oversold before, skeptical of salespeople"},
        {"id": "sunita-rao", "name": "Sunita Rao", "role": "Ops head, wholesale trader — warm lead, hasn't committed yet", "temperament": "busy, impatient, wants the bottom line fast"},
    ],
    "marketing": [
        {"id": "kabir-anand", "name": "Kabir Anand", "role": "Founder, D2C brand — discussing a campaign brief", "temperament": "creative but budget-conscious, second-guesses every spend"},
        {"id": "meera-joshi", "name": "Meera Joshi", "role": "Marketing lead, boutique brand — reviewing ad performance", "temperament": "data-driven, pushes back if numbers aren't justified"},
    ],
    "finance": [
        {"id": "vikram-shah", "name": "Vikram Shah", "role": "Small business owner — client for monthly books/GST", "temperament": "not financially literate, gets anxious about numbers, needs things explained simply"},
        {"id": "anita-desai", "name": "Anita Desai", "role": "Manufacturing unit owner — reconciliation/budget client", "temperament": "traditional, slow to trust new processes, asks a lot of 'why' questions"},
    ],
    "hr": [
        {"id": "farhan-sheikh", "name": "Farhan Sheikh", "role": "Hiring manager — discussing your shortlist", "temperament": "direct, no patience for vague answers, wants specific reasoning"},
        {"id": "pooja-nair", "name": "Pooja Nair", "role": "Employee — has an onboarding/leave query", "temperament": "a little frustrated already, wants to feel heard, not just processed"},
    ],
}

_CONNECT_SYSTEM_PROMPT = """You are {contact_name}, {contact_role}, chatting on WhatsApp with an intern at
The Financial Doctor. Personality: {temperament}. Track: {track_label}.

Conversation so far:
{history}

The intern just sent: "{last_message}"

Reply in character — short, WhatsApp-style messages (1-3 sentences, casual but real, not a formal email).
Raise realistic objections/questions matching your personality; don't fold instantly. Only mark status
"converted" once the intern has genuinely and specifically addressed your real concern (not just asked a
generic question) — you can string them along, ask follow-ups, push back on price, ask for proof, etc.
Mark "lost" only if they've been dismissive, rude, or ignored your actual concern repeatedly.

Respond with ONLY a JSON object, no markdown fences: {{"reply": "...", "sentiment": "positive|neutral|negative", "status": "in_progress|converted|lost"}}"""


def _to_out(doc: dict) -> ConnectThreadOut:
    return ConnectThreadOut(
        id=doc["id"], contact_id=doc["contact_id"], contact_name=doc["contact_name"],
        contact_role=doc["contact_role"], status=doc.get("status", "new"), locked=doc.get("locked", False),
        messages=[ConnectMessage(**m) for m in doc.get("messages", [])], updated_at=doc["updated_at"],
    )


async def _get_or_create_thread(student: dict, contact_id: str) -> dict:
    contact = next((c for c in CONNECT_CONTACTS.get(student.get("track"), []) if c["id"] == contact_id), None)
    if not contact:
        raise HTTPException(status_code=404, detail="Unknown contact for your track")
    doc = await internship_connect_threads_collection.find_one({"student_id": student["id"], "contact_id": contact_id})
    if doc:
        return doc
    new_doc = ConnectThreadInDB(
        student_id=student["id"], contact_id=contact["id"], contact_name=contact["name"], contact_role=contact["role"],
    ).dict()
    await internship_connect_threads_collection.insert_one(new_doc)
    return new_doc


@router.get("/connect/contacts", response_model=list[ConnectContact])
async def get_connect_contacts(payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student or not student.get("track"):
        raise HTTPException(status_code=400, detail="Please select a track first")
    return [ConnectContact(**c) for c in CONNECT_CONTACTS.get(student["track"], [])]


@router.get("/connect/threads", response_model=list[ConnectThreadOut])
async def list_connect_threads(payload: dict = Depends(get_current_student_payload)):
    docs = [d async for d in internship_connect_threads_collection.find({"student_id": payload["sub"]}).sort("updated_at", -1)]
    return [_to_out(d) for d in docs]


@router.get("/connect/thread/{contact_id}", response_model=ConnectThreadOut)
async def get_connect_thread(contact_id: str, payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    doc = await _get_or_create_thread(student, contact_id)
    return _to_out(doc)


@router.post("/connect/thread/{contact_id}/send", response_model=ConnectThreadOut)
async def send_connect_message(contact_id: str, data: ConnectSendIn, payload: dict = Depends(get_current_student_payload)):
    student = await internship_students_collection.find_one({"id": payload["sub"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    doc = await _get_or_create_thread(student, contact_id)
    if doc.get("locked"):
        raise HTTPException(status_code=409, detail="This chat is locked — the task it belongs to has already been graded")

    contact = next((c for c in CONNECT_CONTACTS.get(student.get("track"), []) if c["id"] == contact_id), None)
    now = datetime.now(timezone.utc)
    student_msg = ConnectMessage(sender="student", text=data.text, created_at=now).dict()
    messages = doc.get("messages", []) + [student_msg]

    history = "\n".join(f"{'Intern' if m['sender'] == 'student' else contact['name']}: {m['text']}" for m in messages[-12:])
    system = _CONNECT_SYSTEM_PROMPT.format(
        contact_name=contact["name"], contact_role=contact["role"], temperament=contact["temperament"],
        track_label=TRACK_LABELS.get(student.get("track"), student.get("track")),
        history=history, last_message=data.text,
    )
    text_out = await _call_gemini(system, "Reply now as the contact, per the instructions above.", temperature=0.7)

    reply_text, sentiment, new_status = None, "neutral", doc.get("status", "new")
    if text_out:
        cleaned = text_out.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            cleaned = parts[1] if len(parts) > 1 else cleaned
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
        try:
            parsed = json.loads(cleaned)
            reply_text = parsed.get("reply")
            sentiment = parsed.get("sentiment", "neutral")
            new_status = parsed.get("status", new_status if new_status != "new" else "in_progress")
        except (ValueError, TypeError):
            reply_text = cleaned[:500]
            new_status = "in_progress" if new_status == "new" else new_status

    if not reply_text:
        reply_text = "Hmm, can you tell me a bit more about that?"
        new_status = "in_progress" if new_status == "new" else new_status
    if new_status not in ("in_progress", "converted", "lost"):
        new_status = "in_progress"

    client_msg = ConnectMessage(sender="client", text=reply_text, sentiment=sentiment).dict()
    messages.append(client_msg)

    await internship_connect_threads_collection.update_one(
        {"id": doc["id"]},
        {"$set": {"messages": messages, "status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    doc["messages"], doc["status"] = messages, new_status
    return _to_out(doc)
