"""Department-specific body text for offer letters, completion letters, and
certificates — so the generated documents don't read as generic filler."""

DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"]

DEPARTMENT_RESPONSIBILITIES = {
    "Sales": "was actively involved in client interaction, lead generation, and follow-up on prospective investors, gaining practical exposure to financial sales processes and client relationship management",
    "Marketing": "was involved in content creation, digital campaign support, and brand-awareness activities, gaining hands-on experience in financial-services marketing and audience engagement strategies",
    "HR": "was involved in recruitment coordination, employee onboarding support, and documentation processes, gaining practical exposure to human-resource operations within a financial-services organisation",
    "Accounts": "was involved in maintaining financial records, assisting with reconciliation processes, and supporting day-to-day accounting operations, gaining practical exposure to financial compliance and bookkeeping practices",
}

DEPARTMENT_OFFER_DUTIES = {
    "Sales": "engage with clients, generate and follow up on leads, and work towards assigned sales targets",
    "Marketing": "support content creation, digital campaigns, and brand-awareness initiatives",
    "HR": "assist with recruitment coordination, employee onboarding, and HR documentation processes",
    "Accounts": "assist with maintaining financial records, reconciliation processes, and day-to-day accounting operations",
}


def responsibilities_for(department: str) -> str:
    """Past-tense clause for the completion letter — 'During this period,
    {name} {responsibilities_for(dept)}.' Uses the intern's first name in
    place of a he/she pronoun since we don't collect gender on the intern
    form; reads naturally either way."""
    return DEPARTMENT_RESPONSIBILITIES.get(department, "was involved in a range of responsibilities within the department")


def offer_duties_for(department: str) -> str:
    return DEPARTMENT_OFFER_DUTIES.get(department, "assist the team with department-related responsibilities")
