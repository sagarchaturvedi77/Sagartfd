"""Department-specific body text for offer letters, completion letters, and
certificates — so the generated documents don't read as generic filler."""

DEPARTMENTS = ["HR", "Sales", "Marketing", "Accounts"]

DEPARTMENT_RESPONSIBILITIES = {
    "HR": "recruitment support, employee relations, and onboarding coordination",
    "Sales": "client interaction, lead generation, and working towards sales targets",
    "Marketing": "marketing campaigns, content creation, and brand promotion activities",
    "Accounts": "financial record-keeping, reconciliation, and compliance documentation",
}

DEPARTMENT_OFFER_DUTIES = {
    "HR": "assist the HR team with recruitment, employee records, and onboarding of new staff",
    "Sales": "engage with clients, generate and follow up on leads, and work towards assigned sales targets",
    "Marketing": "support marketing campaigns, content creation, and brand-building initiatives",
    "Accounts": "assist with financial record-keeping, reconciliation, and compliance-related documentation",
}


def responsibilities_for(department: str) -> str:
    return DEPARTMENT_RESPONSIBILITIES.get(department, "a range of responsibilities within the department")


def offer_duties_for(department: str) -> str:
    return DEPARTMENT_OFFER_DUTIES.get(department, "assist the team with department-related responsibilities")
