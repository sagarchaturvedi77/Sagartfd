"""Seeds the internship_quiz_questions collection — 10 MCQs per track
(finance, marketing, sales, hr), 2 per radar category (communication,
finance, technical, integrity, execution_speed) so category_scores computed
from a quiz attempt map cleanly onto the student's radar chart.

Run once: python seed_internship_quizzes.py
Safe to re-run — upserts by (track, question_text).
"""
import asyncio
import uuid
from datetime import datetime, timezone

from database import internship_quiz_questions_collection

# (track, question_text, [options], correct_index, category)
QUESTIONS = [
    # ── Finance ──────────────────────────────────────────────────────
    ("finance", "\"NAV\" in mutual funds stands for:",
     ["Net Asset Value", "National Average Value", "New Account Value", "Net Annual Value"], 0, "finance"),
    ("finance", "Under which section of the Income Tax Act can ELSS investments be claimed for deduction?",
     ["Section 80C", "Section 80D", "Section 80G", "Section 10(10D)"], 0, "finance"),
    ("finance", "Which of these typically carries the HIGHEST risk?",
     ["Fixed Deposit", "PPF", "Equity Mutual Fund", "Post Office Savings"], 2, "finance"),
    ("finance", "SIP stands for:",
     ["Systematic Investment Plan", "Single Investment Policy", "Secured Insurance Plan", "Standard Interest Plan"], 0, "finance"),
    ("finance", "In A = P(1+r/n)^(nt), what does 'n' represent?",
     ["Number of years", "Principal amount", "Number of times interest compounds per year", "Interest rate"], 2, "technical"),
    ("finance", "Which of these is used to calculate a loan's monthly payment?",
     ["NAV", "EMI", "SIP", "ELSS"], 1, "technical"),
    ("finance", "What's the best way to explain SIP to a first-time investor?",
     ["Use only technical jargon", "Compare it to a familiar recurring payment, in simple terms", "Avoid mentioning risk entirely", "Just tell them to trust you"], 1, "communication"),
    ("finance", "When a client seems confused about a term, you should:",
     ["Repeat it louder", "Use a real-life analogy to clarify", "Move to the next topic quickly", "Assume they understood"], 1, "communication"),
    ("finance", "A client asks you to guarantee 15% returns on a mutual fund. What should you do?",
     ["Guarantee it to close the sale", "Politely explain returns can't be guaranteed and share realistic data", "Ignore the question", "Suggest a different advisor"], 1, "integrity"),
    ("finance", "After a client submits their KYC documents, what should happen next?",
     ["Wait a week before responding", "Verify and process promptly so the account isn't delayed", "Ask them to resubmit for no reason", "File it away without action"], 1, "execution_speed"),

    # ── Marketing ────────────────────────────────────────────────────
    ("marketing", "Which of these captions is most likely to engage on social media?",
     ["A generic product description", "A story-driven caption with a clear call-to-action", "No caption at all", "Only hashtags"], 1, "communication"),
    ("marketing", "What's the best way to respond to a negative comment on social media?",
     ["Delete it immediately", "Respond publicly and professionally", "Argue back", "Ignore it"], 1, "communication"),
    ("marketing", "Which content format typically gets the highest engagement today?",
     ["Static image only", "Short-form video/Reels", "Long text posts", "PDF documents"], 1, "technical"),
    ("marketing", "What does \"CTA\" stand for in marketing?",
     ["Call To Action", "Content Type Analysis", "Customer Target Audience", "Click Then Advertise"], 0, "technical"),
    ("marketing", "Marketing spend that generates more revenue than it costs is said to have a positive:",
     ["CTR", "ROI", "KYC", "SIP"], 1, "finance"),
    ("marketing", "Which metric best measures if a marketing campaign was profitable?",
     ["Number of likes", "Return on Investment (ROI)", "Number of comments", "Follower count alone"], 1, "finance"),
    ("marketing", "Is it okay to use a fake before/after testimonial to boost credibility?",
     ["Yes, if it looks convincing", "No, honesty in marketing claims matters", "Only for small campaigns", "Only if competitors do it too"], 1, "integrity"),
    ("marketing", "When promoting a mutual fund scheme, marketing content should:",
     ["Promise guaranteed high returns", "Include required risk disclaimers, avoid guaranteed-return claims", "Hide the risk factor", "Focus only on past performance"], 1, "integrity"),
    ("marketing", "A content calendar helps most with:",
     ["Making content planning and posting more consistent and timely", "Nothing, it's unnecessary", "Slowing down the team", "Reducing content quality"], 0, "execution_speed"),
    ("marketing", "If a scheduled post fails to publish, what should you do?",
     ["Ignore it", "Notice and republish it promptly", "Wait a week", "Delete the whole account"], 1, "execution_speed"),

    # ── Sales ────────────────────────────────────────────────────────
    ("sales", "The best way to open a cold call is to:",
     ["Launch straight into a sales pitch", "Briefly introduce yourself and state a clear reason for calling", "Ask for their bank details first", "Talk only about yourself"], 1, "communication"),
    ("sales", "When a prospect raises an objection, you should:",
     ["Argue with them", "Listen fully, then address the concern directly", "Hang up", "Ignore the objection and keep pitching"], 1, "communication"),
    ("sales", "What is a \"lead\" in sales terminology?",
     ["A completed sale", "A potential customer who has shown interest", "A rejected customer", "A competitor"], 1, "technical"),
    ("sales", "CRM stands for:",
     ["Customer Relationship Management", "Client Revenue Model", "Corporate Risk Management", "Customer Reach Metrics"], 0, "technical"),
    ("sales", "A \"conversion rate\" in sales measures:",
     ["The percentage of leads that become paying customers", "The interest rate on a loan", "The currency exchange rate", "The commission percentage"], 0, "finance"),
    ("sales", "Why is understanding a client's budget important before pitching?",
     ["It isn't important", "So you can recommend suitable, affordable options", "To overcharge them", "To avoid talking to them"], 1, "finance"),
    ("sales", "If a client asks a question you don't know the answer to, you should:",
     ["Make up an answer", "Admit you don't know and find out the correct answer", "Change the subject", "Avoid the client afterward"], 1, "integrity"),
    ("sales", "Pressuring a client to buy something they clearly don't need is:",
     ["Good sales technique", "Unethical and damages long-term trust", "Required to hit targets", "Encouraged"], 1, "integrity"),
    ("sales", "After a client shows interest, the ideal follow-up timing is:",
     ["Within a reasonable time while interest is fresh", "After a month", "Never follow up", "Only if they follow up first"], 0, "execution_speed"),
    ("sales", "A missed call from a prospect should be:",
     ["Ignored", "Returned promptly", "Returned after a week", "Forwarded without response"], 1, "execution_speed"),

    # ── HR ───────────────────────────────────────────────────────────
    ("hr", "During an interview, active listening means:",
     ["Interrupting frequently", "Focusing fully on the candidate's answers and responding thoughtfully", "Checking your phone", "Thinking about your next question only"], 1, "communication"),
    ("hr", "Giving constructive feedback to an employee should:",
     ["Be vague and generic", "Be specific, respectful, and focused on improvement", "Be given publicly to embarrass them", "Never happen"], 1, "communication"),
    ("hr", "What does \"onboarding\" refer to in HR?",
     ["Firing an employee", "The process of integrating a new employee into a company", "Filing taxes", "Booking travel"], 1, "technical"),
    ("hr", "A job description typically should NOT include:",
     ["Key responsibilities", "Required qualifications", "Discriminatory requirements unrelated to the job", "Reporting structure"], 2, "technical"),
    ("hr", "Which of these is typically part of an employee's total compensation?",
     ["Only base salary", "Base salary plus benefits and other perks", "Only bonuses", "None of these"], 1, "finance"),
    ("hr", "Why might a company offer non-monetary benefits like flexible hours?",
     ["They have no impact", "To improve retention and satisfaction at lower cost than raises", "To confuse employees", "It's always legally required"], 1, "finance"),
    ("hr", "If an employee shares a confidential complaint with HR, HR should:",
     ["Share it with the whole office", "Handle it with appropriate confidentiality", "Ignore it", "Post it publicly"], 1, "integrity"),
    ("hr", "Favoritism in hiring/promotion decisions is:",
     ["Acceptable if the person is likeable", "Unethical and undermines fair opportunity", "Encouraged", "Irrelevant"], 1, "integrity"),
    ("hr", "A new employee's onboarding paperwork should ideally be completed:",
     ["Within a reasonable time near their start date", "Months after they join", "Never", "Only if they ask"], 0, "execution_speed"),
    ("hr", "If a candidate is a strong fit, the hiring process should move:",
     ["As slowly as possible", "At a reasonably efficient pace so they aren't lost to competitors", "Never conclude", "Randomly"], 1, "execution_speed"),
]


async def seed():
    inserted, updated = 0, 0
    for track, question_text, options, correct_index, category in QUESTIONS:
        doc = {
            "id": str(uuid.uuid4()), "track": track, "question_text": question_text,
            "options": options, "correct_index": correct_index, "category": category,
            "is_active": True, "created_at": datetime.now(timezone.utc),
        }
        existing = await internship_quiz_questions_collection.find_one({"track": track, "question_text": question_text})
        if existing:
            doc["id"] = existing["id"]
            doc["created_at"] = existing.get("created_at", doc["created_at"])
            await internship_quiz_questions_collection.update_one({"_id": existing["_id"]}, {"$set": doc})
            updated += 1
        else:
            await internship_quiz_questions_collection.insert_one(doc)
            inserted += 1
    print(f"Quiz bank seeded: {inserted} inserted, {updated} updated, {len(QUESTIONS)} total.")


if __name__ == "__main__":
    asyncio.run(seed())
