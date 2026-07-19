"""Seeds the internship_task_pool collection with general, industry-standard
case-study tasks across the 4 tracks (finance, marketing, sales, hr) — 50
per track, 200 total, so a large cohort of students can each get a
distinct-feeling weekly sequence without everyone seeing the same 4 tasks.

Deliberately NOT tied to TFD's own business (mutual funds/insurance
distribution) — a student may end up joining any kind of company after this
internship (a finance company, a trading firm, a manufacturer, an IT
company, anything), so every task teaches a transferable, general
professional skill for that track, usable anywhere.

Every task's `instructions` field is written as explicit numbered steps in
plain language, defining any jargon inline, and every task carries an
`estimated_duration` so a student knows roughly how long to budget for it —
the goal is that a student with zero background in the subject can read a
task once and know exactly what to do and how long it should take.

Run once: python seed_internship_tasks.py
Safe to re-run — upserts by (track, title) so existing tasks aren't
duplicated; edit TASKS below and re-run to update copy or add more. Any
old seed-script task whose title is no longer in this list gets removed
automatically (admin-added tasks, which have a different `created_by`,
are never touched).
"""
import asyncio
import uuid
from datetime import datetime, timezone

from database import internship_task_pool_collection

# deliverable_type: "text" | "photo" | "text_and_photo" | "spreadsheet" | "text_and_spreadsheet"
# requires_geotag only matters for photo/text_and_photo deliverables.
# phase: 1 = guided (Day 1-30), 2 = independent (Day 31-60), 3 = capstone
# (Day 61-90) — see backend/internship_routes.py's _phase_for_week. Only
# set on tracks that have been reworked onto the curated pool (Finance is
# the first); tracks with no phase field keep the old whole-pool behavior.
# spreadsheet_template/spreadsheet_answer_key back the in-browser mini
# spreadsheet tool (frontend/src/components/SpreadsheetGrid.jsx) — see
# _col_letter/_grid below for how these are built.

def _col_letter(idx: int) -> str:
    """0-based column index -> spreadsheet letter (0->A, 25->Z, 26->AA...)."""
    letters = ""
    idx += 1
    while idx > 0:
        idx, rem = divmod(idx - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def _grid(rows: int, cols: int, headers: list, prefilled: dict, locked: list) -> dict:
    return {"rows": rows, "cols": cols, "headers": headers, "prefilled": prefilled, "locked_cells": locked}


# ── FINANCE — 8 tasks, realistic 90-day corporate simulation ─────────────
# Generic/fictional mock company data ("Bright Retail Traders", "Meridian
# Textiles Ltd") — deliberately not TFD's own business. Every task pairs
# the spreadsheet tool with a written-reasoning component (deliverable_type
# "text_and_spreadsheet"): the numbers alone aren't graded as "the point" —
# explaining them is.

_TB_ROWS = [
    ("Cash", 85000, None), ("Accounts Receivable", 45000, None), ("Inventory", 120000, None),
    ("Furniture & Fixtures", 60000, None), ("Accounts Payable", None, 38000), ("Bank Loan", None, 100000),
    ("Owner's Capital", None, 150000), ("Sales Revenue", None, 340000), ("Cost of Goods Sold", 210000, None),
    ("Rent Expense", 36000, None), ("Salaries Expense", 60000, None), ("Owner's Drawings", 12000, None),
]
_TB_PREFILLED = {"A1": "Item", "B1": "Debit", "C1": "Credit"}
_TB_LOCKED = ["A1", "B1", "C1"]
for _i, (_label, _debit, _credit) in enumerate(_TB_ROWS):
    _r = _i + 2
    _TB_PREFILLED[f"A{_r}"] = _label
    _TB_LOCKED.append(f"A{_r}")
    if _debit is not None:
        _TB_PREFILLED[f"B{_r}"] = _debit
        _TB_LOCKED.append(f"B{_r}")
    if _credit is not None:
        _TB_PREFILLED[f"C{_r}"] = _credit
        _TB_LOCKED.append(f"C{_r}")
_TB_PREFILLED.update({
    "A15": "Net Profit (Revenue - COGS - Rent - Salaries)",
    "A17": "BALANCE SHEET", "A18": "Total Assets (Cash+AR+Inventory+Furniture)",
    "A19": "Total Liabilities (AP+Bank Loan)", "A20": "Closing Capital (Capital+Net Profit-Drawings)",
    "A21": "Total Liabilities + Equity",
})
_TB_LOCKED += ["A15", "A17", "A18", "A19", "A20", "A21"]
_TASK1_TEMPLATE = _grid(22, 3, ["Item", "Debit", "Credit"], _TB_PREFILLED, _TB_LOCKED)
_TASK1_ANSWER_KEY = {
    "cells": {
        "B15": {"expected": 34000, "tolerance": 1}, "B18": {"expected": 310000, "tolerance": 1},
        "B19": {"expected": 138000, "tolerance": 1}, "B20": {"expected": 172000, "tolerance": 1},
        "B21": {"expected": 310000, "tolerance": 1},
    },
    "checks": [{"left": "B18", "right": "B21", "tolerance": 1, "label": "Total Assets should equal Total Liabilities + Equity"}],
}

_PL_PREFILLED = {
    "A1": "Item", "B1": "Amount",
    "A2": "Product Sales", "B2": 280000, "A3": "Service Income", "B3": 45000,
    "A4": "Total Revenue",
    "A6": "Cost of Goods Sold", "B6": 165000, "A7": "Rent", "B7": 30000, "A8": "Salaries", "B8": 55000,
    "A9": "Utilities", "B9": 8000, "A10": "Marketing", "B10": 12000, "A11": "Misc Admin", "B11": 5000,
    "A12": "Total Expenses",
    "A14": "Net Profit / Loss", "A15": "Net Profit Margin %",
}
_TASK2_TEMPLATE = _grid(16, 2, ["Item", "Amount"], _PL_PREFILLED, [
    "A1", "B1", "A2", "B2", "A3", "B3", "A4", "A6", "B6", "A7", "B7", "A8", "B8",
    "A9", "B9", "A10", "B10", "A11", "B11", "A12", "A14", "A15",
])
_TASK2_ANSWER_KEY = {"cells": {
    "B4": {"expected": 325000, "tolerance": 1}, "B12": {"expected": 275000, "tolerance": 1},
    "B14": {"expected": 50000, "tolerance": 1}, "B15": {"expected": 15.38, "tolerance": 0.5},
}}

_INV_ROWS = [
    ("Client A", "Consulting Services", 1, 50000), ("Client B", "Software License", 0, 118000),
    ("Client C", "Design Services", 1, 25000), ("Client D", "Maintenance Contract", 0, 35400),
    ("Client E", "Training Workshop", 1, 80000),
]
_INV_PREFILLED = {"A1": "Client", "B1": "Description", "C1": "Type (1=Excl,0=Incl)", "D1": "Given Amount", "E1": "Base Amount", "F1": "GST (18%)", "G1": "Total Amount"}
_INV_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"]
for _i, (_client, _desc, _typ, _amt) in enumerate(_INV_ROWS):
    _r = _i + 2
    _INV_PREFILLED.update({f"A{_r}": _client, f"B{_r}": _desc, f"C{_r}": _typ, f"D{_r}": _amt})
    _INV_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}"]
_INV_PREFILLED["A7"] = "Total GST Collected"
_INV_LOCKED.append("A7")
_TASK3_TEMPLATE = _grid(8, 7, ["Client", "Description", "Type (1=Excl,0=Incl)", "Given Amount", "Base Amount", "GST (18%)", "Total Amount"], _INV_PREFILLED, _INV_LOCKED)
_TASK3_ANSWER_KEY = {"cells": {"F7": {
    "expected": 51300, "tolerance": 5,
    "mistake_note": "Your total GST doesn't check out — a common real mistake here is applying the wrong rate direction "
                     "(e.g. treating an inclusive amount as exclusive, or using 5% instead of 18%). In a real company, "
                     "this exact mistake means the wrong GST gets filed — leading to a tax audit flag and a real penalty.",
}}}

_BR_PREFILLED = {
    "A1": "Item", "B1": "Amount", "C1": "Sign (+1 Add / -1 Subtract)",
    "A2": "Cash Book Closing Balance (starting point)", "B2": 124500,
    "A3": "Uncleared cheque (issued, not yet presented to bank)", "B3": 8000,
    "A4": "Bank charges not yet recorded in cash book", "B4": 450,
    "A5": "Duplicate payment entry error in cash book", "B5": 1200,
    "A6": "Deposit in transit (cheque deposited, not yet credited)", "B6": 2050,
    "A8": "Adjusted Cash Book Balance", "A9": "Bank Statement Balance (given)", "B9": 131200,
    "A10": "Difference (should be 0 if correctly reconciled)",
}
_TASK4_TEMPLATE = _grid(11, 3, ["Item", "Amount", "Sign (+1 Add / -1 Subtract)"], _BR_PREFILLED, [
    "A1", "B1", "C1", "A2", "B2", "A3", "B3", "A4", "B4", "A5", "B5", "A6", "B6", "A8", "A9", "B9", "A10",
])
_TASK4_ANSWER_KEY = {"cells": {"B8": {"expected": 131200, "tolerance": 1}, "B10": {"expected": 0, "tolerance": 1}}}

_EXPENSE_ROWS = [
    ("05-Mar", "Ola Cabs - Client Meeting", 850), ("05-Mar", "Ola Cabs - Client Meeting", 850),
    ("06-Mar", "IndiGo Flight - Mumbai Trip", 6200), ("08-Mar", "Uber - Airport Transfer", 650),
    ("12-Mar", "Hotel Stay - Mumbai (2 nights)", 4800),
    ("02-Mar", "Stationery World - Printer Paper & Pens", 1200), ("07-Mar", "Amazon Business - Toner Cartridges", 3400),
    ("14-Mar", "Local Vendor - Whiteboard Markers", 350), ("18-Mar", "Office Depot - Filing Cabinets", 5600),
    ("22-Mar", "Amazon Business - Desk Organizers", 800),
    ("04-Mar", "Client Lunch - Taj Restaurant", 3200), ("09-Mar", "Team Lunch - Office Order", 1800),
    ("15-Mar", "Client Dinner - Business Meeting", 4500), ("19-Mar", "Coffee with Vendor", 450),
    ("25-Mar", "Team Celebration Lunch", 2200),
    ("01-Mar", "Electricity Bill - March", 12000), ("01-Mar", "Internet & Broadband - March", 2500),
    ("01-Mar", "Water Bill - March", 800), ("15-Mar", "Mobile/Phone Bill - Office Lines", 3200),
    ("28-Mar", "Generator Fuel/Diesel", 1500),
    ("03-Mar", "Facebook Ads - March Campaign", 8000), ("10-Mar", "Local Newspaper Ad", 4500),
    ("16-Mar", "Printing - Flyers & Banners", 2800), ("20-Mar", "Instagram Influencer Collab", 6000),
    ("27-Mar", "Google Ads - March Campaign", 7500),
    ("05-Mar", "Courier Charges", 400), ("11-Mar", "Bank Processing Fees", 250),
    ("17-Mar", "Cash Advance - Field Staff (no receipt attached)", 10000), ("23-Mar", "Office Cleaning Service", 1500),
    ("29-Mar", "Miscellaneous Repairs", 900),
]
_EXPENSE_PREFILLED = {"A1": "Date", "B1": "Vendor / Description", "C1": "Amount", "D1": "Category Code (1-6)", "E1": "Flag (1=duplicate/suspicious)", "F1": "Adjusted Amount"}
_EXPENSE_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1"]
for _i, (_date, _desc, _amt) in enumerate(_EXPENSE_ROWS):
    _r = _i + 2
    _EXPENSE_PREFILLED.update({f"A{_r}": _date, f"B{_r}": _desc, f"C{_r}": _amt})
    _EXPENSE_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}"]
_EXPENSE_PREFILLED.update({
    "A33": "CATEGORY TOTALS (using Adjusted Amount, excluding flagged entries)",
    "A34": "Travel Total", "A35": "Office Supplies Total", "A36": "Meals & Entertainment Total",
    "A37": "Utilities Total", "A38": "Marketing Total", "A39": "Misc/Admin Total", "A40": "Grand Total (Adjusted)",
})
_EXPENSE_LOCKED += ["A33", "A34", "A35", "A36", "A37", "A38", "A39", "A40"]
_TASK5_TEMPLATE = _grid(41, 6, ["Date", "Vendor / Description", "Amount", "Category Code (1-6)", "Flag (1=duplicate/suspicious)", "Adjusted Amount"], _EXPENSE_PREFILLED, _EXPENSE_LOCKED)
_TASK5_ANSWER_KEY = {"cells": {
    "B34": {"expected": 12500, "tolerance": 1}, "B35": {"expected": 11350, "tolerance": 1},
    "B36": {"expected": 12150, "tolerance": 1}, "B37": {"expected": 20000, "tolerance": 1},
    "B38": {"expected": 28800, "tolerance": 1}, "B39": {"expected": 3050, "tolerance": 1},
    "B40": {"expected": 87850, "tolerance": 1},
}}

_BUDGET_ROWS = [
    ("Marketing", 300000, 365000), ("Sales", 450000, 470000), ("Operations", 600000, 615000),
    ("HR", 150000, 142000), ("IT", 200000, 258000), ("Admin", 100000, 96000),
]
_BUDGET_PREFILLED = {"A1": "Department", "B1": "Budgeted", "C1": "Actual", "D1": "Variance (Actual-Budgeted)", "E1": "Variance %"}
_BUDGET_LOCKED = ["A1", "B1", "C1", "D1", "E1"]
for _i, (_dept, _bud, _act) in enumerate(_BUDGET_ROWS):
    _r = _i + 2
    _BUDGET_PREFILLED.update({f"A{_r}": _dept, f"B{_r}": _bud, f"C{_r}": _act})
    _BUDGET_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}"]
_BUDGET_PREFILLED.update({"A9": "Total Budgeted", "A10": "Total Actual", "A11": "Total Variance"})
_BUDGET_LOCKED += ["A9", "A10", "A11"]
_TASK6_TEMPLATE = _grid(12, 5, ["Department", "Budgeted", "Actual", "Variance (Actual-Budgeted)", "Variance %"], _BUDGET_PREFILLED, _BUDGET_LOCKED)
_TASK6_ANSWER_KEY = {"cells": {
    "D2": {"expected": 65000, "tolerance": 1}, "E2": {"expected": 21.67, "tolerance": 0.5},
    "D3": {"expected": 20000, "tolerance": 1}, "E3": {"expected": 4.44, "tolerance": 0.5},
    "D4": {"expected": 15000, "tolerance": 1}, "E4": {"expected": 2.5, "tolerance": 0.5},
    "D5": {"expected": -8000, "tolerance": 1}, "E5": {"expected": -5.33, "tolerance": 0.5},
    "D6": {"expected": 58000, "tolerance": 1}, "E6": {"expected": 29, "tolerance": 0.5},
    "D7": {"expected": -4000, "tolerance": 1}, "E7": {"expected": -4, "tolerance": 0.5},
    "B9": {"expected": 1800000, "tolerance": 1}, "B10": {"expected": 1946000, "tolerance": 1}, "B11": {"expected": 146000, "tolerance": 1},
}}

_RATIO_PREFILLED = {
    "A1": "Item", "B1": "Amount",
    "A2": "Cash", "B2": 180000, "A3": "Accounts Receivable", "B3": 220000, "A4": "Inventory", "B4": 300000,
    "A5": "Fixed Assets", "B5": 950000, "A6": "Accounts Payable", "B6": 250000, "A7": "Short-term Loan", "B7": 150000,
    "A8": "Long-term Debt", "B8": 500000, "A9": "Shareholders' Equity", "B9": 750000,
    "A10": "Revenue", "B10": 2400000, "A11": "Net Profit", "B11": 216000,
    "A13": "RATIO CALCULATIONS",
    "A14": "Current Ratio (Current Assets ÷ Current Liabilities)",
    "A15": "Quick Ratio ((Current Assets - Inventory) ÷ Current Liabilities)",
    "A16": "Net Profit Margin %", "A17": "ROI % (Net Profit ÷ Equity)",
}
_TASK7_TEMPLATE = _grid(18, 2, ["Item", "Amount"], _RATIO_PREFILLED, [
    "A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4", "A5", "B5", "A6", "B6", "A7", "B7", "A8", "B8", "A9", "B9",
    "A10", "B10", "A11", "B11", "A13", "A14", "A15", "A16", "A17",
])
_TASK7_ANSWER_KEY = {"cells": {
    "B14": {"expected": 1.75, "tolerance": 0.05}, "B15": {"expected": 1.0, "tolerance": 0.05},
    "B16": {"expected": 9, "tolerance": 0.2}, "B17": {"expected": 28.8, "tolerance": 0.5},
}}

# 110 fictional transactions, generated deterministically (fixed formula,
# not random — reproducible, and the answer key below was computed from
# this exact same sequence) so re-running this seed script always produces
# the same dataset and the same correct totals.
_DASH_CATEGORIES = ["Office Rent", "Vendor Payment", "Software Subscription", "Utility Bill", "Staff Reimbursement", "Marketing Spend", "Courier Charges", "Maintenance"]
_DASH_PREFILLED = {"A1": "Date", "B1": "Description", "C1": "Type (1=Income,0=Expense)", "D1": "Amount", "E1": "Income (if Type=1)", "F1": "Expense (if Type=0)"}
_DASH_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1"]
for _i in range(1, 111):
    _r = _i + 1
    _is_income = (_i % 3 == 0)
    _day = (_i % 28) + 1
    _date = f"{_day:02d}-Apr"
    if _is_income:
        _amount = 15000 + (_i * 137) % 20000
        _desc = f"Client Payment - Invoice #{1000 + _i}"
    else:
        _amount = 500 + (_i * 53) % 8000
        _desc = f"{_DASH_CATEGORIES[_i % 8]} - Ref{_i:03d}"
    _DASH_PREFILLED.update({f"A{_r}": _date, f"B{_r}": _desc, f"C{_r}": 1 if _is_income else 0, f"D{_r}": _amount})
    _DASH_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}"]
_DASH_PREFILLED.update({
    "A113": "MONTHLY DASHBOARD", "A114": "Total Income", "A115": "Total Expenses",
    "A116": "Net Cash Flow", "A117": "Average Transaction Size",
})
_DASH_LOCKED += ["A113", "A114", "A115", "A116", "A117"]
_TASK8_TEMPLATE = _grid(118, 6, ["Date", "Description", "Type (1=Income,0=Expense)", "Amount", "Income (if Type=1)", "Expense (if Type=0)"], _DASH_PREFILLED, _DASH_LOCKED)
_TASK8_ANSWER_KEY = {"cells": {
    "B114": {"expected": 813726, "tolerance": 5}, "B115": {"expected": 254671, "tolerance": 5},
    "B116": {"expected": 559055, "tolerance": 5}, "B117": {"expected": 9712.7, "tolerance": 5},
}}

FINANCE_TASKS = [
    {"track": "finance", "title": "Trial Balance to Balance Sheet", "phase": 1, "difficulty": "medium",
     "points_value": 90, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "2-3 hours",
     "brief": "You've been given Bright Retail Traders' trial balance for the month. Build a proper Balance Sheet from it in the spreadsheet below — classify each item as an Asset, a Liability, or part of Equity, and make sure your numbers actually balance (Assets = Liabilities + Equity, always).",
     "why_it_matters": "Every accountant's first real job is turning a raw trial balance into a Balance Sheet — this is the single most common finance task in any company, in any industry.",
     "instructions": "Step 1: Look at the 12 trial balance line items already filled in for you (rows 2-13).\nStep 2: In row 15, calculate Net Profit using the formula shown — reference the Sales Revenue, COGS, Rent, and Salaries cells directly (e.g. =C9-B10-B11-B12) rather than retyping numbers.\nStep 3: In rows 18-21, build the Balance Sheet — Total Assets, Total Liabilities, Closing Capital (Capital + Net Profit - Drawings), and Total Liabilities + Equity. Use cell-reference formulas throughout, not hand-typed totals.\nStep 4: Confirm B18 and B21 come out equal — if they don't, you've misclassified something.\nStep 5: In the text box, explain in 100+ words why Assets must always equal Liabilities + Equity, and what it would mean (practically) if a real company's books didn't balance.",
     "spreadsheet_template": _TASK1_TEMPLATE, "spreadsheet_answer_key": _TASK1_ANSWER_KEY,
     "mistake_explanation": "If Assets doesn't equal Liabilities + Equity, something was misclassified — usually a "
                             "liability treated as an asset (or vice versa), or a formula that hand-typed a total "
                             "instead of referencing cells. In a real company, a Balance Sheet that doesn't balance "
                             "can't be filed or audited — it's not a minor rounding issue, it means the books are wrong.",
     "hints": [
         "Hint 1: An asset is something the business OWNS (Cash, Accounts Receivable, Inventory, Furniture). A liability is something it OWES (Accounts Payable, Bank Loan). Equity is the owner's own stake (Capital, plus profit, minus drawings).",
         "Hint 2: Net Profit (B15) = Sales Revenue − COGS − Rent − Salaries. Use a formula referencing C9, B10, B11, B12 — don't type the final number by hand.",
         "Hint 3: Closing Capital (B20) = Owner's Capital + Net Profit − Drawings. If B18 (Total Assets) doesn't equal B21 (Total Liabilities + Equity) after this, re-check which items you classified as assets vs liabilities.",
     ],
     "sample_solution": "Worked example using the same structure (different numbers): if Cash=50000, AR=30000, Inventory=80000, "
                         "Furniture=40000 → Total Assets = 50000+30000+80000+40000 = 200000. If AP=20000, Bank Loan=60000 → "
                         "Total Liabilities = 80000. If Capital=100000, Net Profit=30000, Drawings=10000 → Closing Capital = "
                         "100000+30000-10000=120000. Total Liabilities+Equity = 80000+120000 = 200000 — matches Total Assets. "
                         "The written explanation should say: this equality isn't a coincidence, it's a rule (double-entry "
                         "accounting) — every asset the business holds was paid for either by borrowing (liability) or by "
                         "the owner's own money (equity), so the two sides can never legitimately disagree."},

    {"track": "finance", "title": "Monthly P&L Statement", "phase": 1, "difficulty": "medium",
     "points_value": 85, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "1.5-2.5 hours",
     "brief": "Bright Retail Traders' March revenue and expense figures are given below. Build a Profit & Loss statement — total revenue, total expenses, and the net profit or loss for the month.",
     "why_it_matters": "A monthly P&L is the single most-requested report from any finance team — this is exactly the shape of report you'll build (by hand or in Excel) in almost any junior finance role.",
     "instructions": "Step 1: In B4, calculate Total Revenue by summing the two revenue lines (Product Sales + Service Income).\nStep 2: In B12, calculate Total Expenses using SUM() across all 6 expense lines (rows 6-11).\nStep 3: In B14, calculate Net Profit/Loss = Total Revenue - Total Expenses.\nStep 4: In B15, calculate the Net Profit Margin % = (Net Profit ÷ Total Revenue) × 100.\nStep 5: In the text box, write 150+ words: is a ~15% net margin healthy for a retail business, and what could Bright Retail Traders realistically do next month to improve it?",
     "spreadsheet_template": _TASK2_TEMPLATE, "spreadsheet_answer_key": _TASK2_ANSWER_KEY},

    {"track": "finance", "title": "Invoice & GST Calculation", "phase": 1, "difficulty": "easy",
     "points_value": 80, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "1.5-2 hours",
     "brief": "5 mock service invoices are listed below — some quote a GST-exclusive amount (18% GST needs to be added), others quote a GST-inclusive amount (the 18% GST is already baked in and needs to be extracted). Work out the Base Amount, GST, and Total for each.",
     "why_it_matters": "Getting inclusive vs exclusive GST wrong is one of the most common real invoicing mistakes — every business that raises invoices deals with this distinction constantly.",
     "instructions": "Step 1: Column C tells you the type — 1 means the Given Amount (column D) is GST-exclusive (add 18%), 0 means it's already GST-inclusive (extract the 18%).\nStep 2: In column E (Base Amount), use an IF formula: =IF(C2=1,D2,D2/1.18) — same pattern for each row.\nStep 3: In column G (Total Amount), use =IF(C2=1,D2*1.18,D2).\nStep 4: In column F (GST), just subtract: =G2-E2.\nStep 5: In F7, total up all 5 rows' GST with SUM().\nStep 6: In the text box, explain in 100+ words the difference between GST-inclusive and GST-exclusive pricing, and why a business needs to track this correctly for its GST filing.",
     "spreadsheet_template": _TASK3_TEMPLATE, "spreadsheet_answer_key": _TASK3_ANSWER_KEY,
     "mistake_explanation": "GST-inclusive vs exclusive is the single most common invoicing mistake — e.g. treating an "
                             "18%-inclusive amount as if it were exclusive (or applying the wrong rate entirely, like 5% "
                             "instead of 18%). In a real business, this means the wrong GST gets filed with the government, "
                             "which shows up in a tax audit as a mismatch — and mismatches like this carry real penalties."},

    {"track": "finance", "title": "Bank Reconciliation Statement", "phase": 2, "difficulty": "medium",
     "points_value": 95, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "2-3 hours",
     "brief": "Bright Retail Traders' Cash Book shows a closing balance of ₹1,24,500, but the Bank Statement shows ₹1,31,200. Reconcile the two using the 4 reconciling items given — figure out whether each one should be added or subtracted, and confirm your adjusted balance matches the bank.",
     "why_it_matters": "A cash book and a bank statement almost never match on any given day for entirely normal reasons — reconciling them is a routine, expected finance task, not a sign something's wrong.",
     "instructions": "For each of the 4 reconciling items, decide the correct sign (+1 to add, -1 to subtract) in column C based on your own understanding of why that item causes a difference — this isn't given to you. Then in B8, calculate the Adjusted Cash Book Balance: =B2+B3*C3+B4*C4+B5*C5+B6*C6. In B10, calculate the Difference: =B8-B9 (this should land on 0 if your signs are right). In the text box, explain in 150+ words WHY each of the 4 items causes a difference between the cash book and the bank statement — this is the real point of the exercise, not just getting the numbers to match.",
     "spreadsheet_template": _TASK4_TEMPLATE, "spreadsheet_answer_key": _TASK4_ANSWER_KEY},

    {"track": "finance", "title": "Expense Audit", "phase": 2, "difficulty": "hard",
     "points_value": 100, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "2.5-3.5 hours",
     "brief": "30 raw expense entries for March are listed below, exactly as messy as a real company's actual expense sheet — mixed categories, at least one exact duplicate, and at least one suspicious round-number entry with no real detail. Categorize everything, flag anything that looks wrong, and produce category-wise totals.",
     "why_it_matters": "Reviewing real expense claims for duplicates and suspicious entries — not just data-entry — is genuine, everyday finance-team work, and the single biggest source of quiet cost leakage in most small companies.",
     "instructions": "The 30 entries are pre-grouped into 6 categories of 5 rows each (Travel, Office Supplies, Meals & Entertainment, Utilities, Marketing, Misc/Admin — in that row order). For each row: fill in a Category Code 1-6 in column D (for your own reference), and set the Flag in column E to 1 if you think the entry is a duplicate or suspicious, 0 otherwise (look carefully — there's more than one entry worth flagging). In column F (Adjusted Amount), use =IF(E2=1,0,C2) so flagged entries get excluded from totals. In rows 34-39, calculate each category's total using SUM() over that category's 5-row range in column F. In row 40, calculate the Grand Total. In the text box (150+ words): which entries did you flag and why, and what process would you recommend to prevent duplicate/suspicious claims like these in the future?",
     "spreadsheet_template": _TASK5_TEMPLATE, "spreadsheet_answer_key": _TASK5_ANSWER_KEY},

    {"track": "finance", "title": "Budget Variance Analysis", "phase": 2, "difficulty": "medium",
     "points_value": 95, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "2-2.5 hours",
     "brief": "Q1 budgeted vs actual spend for 6 departments is given below. Calculate the variance and variance % for each, then total everything up.",
     "why_it_matters": "Explaining WHY a department overspent — not just flagging that it did — is what separates a junior analyst who fills in a template from one who actually gets asked into the budget review meeting.",
     "instructions": "Step 1: In column D, calculate Variance = Actual - Budgeted for each department.\nStep 2: In column E, calculate Variance % = (Variance ÷ Budgeted) × 100.\nStep 3: In row 9-11, total up Budgeted, Actual, and Variance across all 6 departments using SUM().\nStep 4: In the text box, identify the top 3 overspend departments by variance %, and write 150+ words on why each might have overspent and what corrective action you'd suggest for each.",
     "spreadsheet_template": _TASK6_TEMPLATE, "spreadsheet_answer_key": _TASK6_ANSWER_KEY},

    {"track": "finance", "title": "Ratio Analysis Report", "phase": 3, "difficulty": "hard",
     "points_value": 110, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "2.5-3.5 hours",
     "brief": "You've been handed Meridian Textiles Ltd's full Balance Sheet + P&L snapshot for the year. Calculate the 4 standard health-check ratios and form your own judgment on whether this company is financially healthy.",
     "why_it_matters": "This is the exact exercise a credit analyst, an investor, or a lender runs before deciding whether to trust a company with money — a capstone-level, judgment-heavy task, not a formula-filling exercise.",
     "instructions": "No step-by-step this time — you're given the raw financial data (rows 2-11) and need to work out the 4 ratios yourself in rows 14-17: Current Ratio, Quick Ratio, Net Profit Margin %, and ROI % (using Shareholders' Equity as the investment base). Then write a 200-word summary: is Meridian Textiles Ltd financially healthy? Use all 4 ratios you calculated to support your answer, and call out at least one risk or concern if you see one.",
     "spreadsheet_template": _TASK7_TEMPLATE, "spreadsheet_answer_key": _TASK7_ANSWER_KEY, "is_blindfold": False},

    # Grand Finale / Blindfold — no hints, no sample solution, English-only,
    # moderately (not perfectionist-ly) stricter grading. See
    # backend/internship_routes.py's _phase_for_week/is_blindfold handling.
    {"track": "finance", "title": "Build a Monthly Financial Dashboard", "phase": 3, "is_blindfold": True, "difficulty": "hard",
     "points_value": 130, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False, "estimated_duration": "3-4 hours",
     "brief": "110 raw transactions for the month are listed below — a mix of client payments (income) and vendor/operational payments (expenses), completely unsorted, exactly like a real bulk transaction export. Build a summary dashboard from it: total income, total expenses, net cash flow, and average transaction size — using formulas, not manual counting.",
     "why_it_matters": "This is literally what a finance analyst delivers every single month at almost any company — a clean summary dashboard built from a messy raw export. It's the closing, capstone-level task of the Finance track for a reason.",
     "instructions": "No hand-holding here — you have 110 raw rows (columns A-D, already filled in) and an empty Dashboard section starting at row 113. Column C tells you the type for each row (1=Income, 0=Expense). Build columns E and F yourself (Income/Expense helper columns, using IF formulas), then use SUM()/AVERAGE() to fill in Total Income (B114), Total Expenses (B115), Net Cash Flow (B116), and Average Transaction Size (B117, across all 110 transactions regardless of type). In the text box, write 150+ words summarizing what this month's cash flow tells you about the business, and flag anything in the data that looks worth a closer look.",
     "spreadsheet_template": _TASK8_TEMPLATE, "spreadsheet_answer_key": _TASK8_ANSWER_KEY},
]


# ════════════════════════════════════════════════════════════════════
# MARKETING (7) — 90-day phase-based curated pool, mirrors Finance
# ════════════════════════════════════════════════════════════════════
# ── Task 4: Marketing Budget Allocation — spreadsheet ─────────────────────
# Fictional company: Nimbus Home Decor (e-commerce home decor brand).
# Fixed monthly budget = Rs 2,00,000, split across 6 channels using a given
# recommended Allocation % (based on each channel's historical performance,
# described in the brief) and a given historical Cost per Lead (Rs).
#
# Arithmetic (hand-checked):
#   Allocated Amount = Allocation % x 200000
#   Projected Leads   = Allocated Amount / Cost per Lead
#
#   Social Media Ads:        30% x 200000 = 60000   ; 60000 / 250  = 240
#   Google Search Ads:       25% x 200000 = 50000   ; 50000 / 400  = 125
#   Influencer Marketing:    15% x 200000 = 30000   ; 30000 / 600  = 50
#   Print / Local Ads:       10% x 200000 = 20000   ; 20000 / 800  = 25
#   Events & Sponsorships:   10% x 200000 = 20000   ; 20000 / 1000 = 20
#   Content Marketing (SEO): 10% x 200000 = 20000   ; 20000 / 200  = 100
#   Allocation % total = 30+25+15+10+10+10 = 100  -> Total Allocated = 200000 (checks out)
#   Total Projected Leads = 240+125+50+25+20+100 = 560
#   Blended Cost per Lead = 200000 / 560 = 357.142857... ~= 357.14

_MKT_TASK4_TEMPLATE = {
    "rows": 12,
    "cols": 5,
    "headers": ["Channel", "Cost per Lead (Rs)", "Allocation %", "Allocated Amount (Rs)", "Projected Leads"],
    "prefilled": {
        "A1": "Channel", "B1": "Cost per Lead (Rs)", "C1": "Allocation %",
        "D1": "Allocated Amount (Rs)", "E1": "Projected Leads",
        "A2": "Social Media Ads", "B2": 250, "C2": 30,
        "A3": "Google Search Ads", "B3": 400, "C3": 25,
        "A4": "Influencer Marketing", "B4": 600, "C4": 15,
        "A5": "Print / Local Ads", "B5": 800, "C5": 10,
        "A6": "Events & Sponsorships", "B6": 1000, "C6": 10,
        "A7": "Content Marketing (SEO/Blog)", "B7": 200, "C7": 10,
        "A9": "TOTALS",
        "A10": "Total Allocated Amount (Rs)",
        "A11": "Total Projected Leads",
        "A12": "Blended Cost per Lead (Total Budget / Total Leads)",
    },
    "locked_cells": [
        "A1", "B1", "C1", "D1", "E1",
        "A2", "B2", "C2", "A3", "B3", "C3", "A4", "B4", "C4",
        "A5", "B5", "C5", "A6", "B6", "C6", "A7", "B7", "C7",
        "A9", "A10", "A11", "A12",
    ],
}

_MKT_TASK4_ANSWER_KEY = {
    "cells": {
        "D2": {"expected": 60000, "tolerance": 1}, "E2": {"expected": 240, "tolerance": 1},
        "D3": {"expected": 50000, "tolerance": 1}, "E3": {"expected": 125, "tolerance": 1},
        "D4": {"expected": 30000, "tolerance": 1}, "E4": {"expected": 50, "tolerance": 1},
        "D5": {"expected": 20000, "tolerance": 1}, "E5": {"expected": 25, "tolerance": 1},
        "D6": {"expected": 20000, "tolerance": 1}, "E6": {"expected": 20, "tolerance": 1},
        "D7": {"expected": 20000, "tolerance": 1}, "E7": {"expected": 100, "tolerance": 1},
        "D10": {
            "expected": 200000, "tolerance": 1,
            "mistake_note": "Total allocated must equal the full Rs 2,00,000 budget exactly — if it doesn't, one of "
                             "your Allocated Amount formulas isn't correctly referencing the Allocation % and total budget.",
        },
        "E11": {"expected": 560, "tolerance": 2},
        "D12": {"expected": 357.14, "tolerance": 1},
    },
}

# ── Task 6: Ad Performance Analysis — spreadsheet ──────────────────────────
# Fictional company: Nimbus Home Decor (same brand as Task 4, for continuity).
# 18 raw ad campaigns across 4 channels, average order value = Rs 1,200/conversion.
#
# Formulas: CTR % = Clicks/Impressions*100 ; CPC = Spend/Clicks ;
#           CPA = Spend/Conversions ; Revenue = Conversions*1200 ; ROAS = Revenue/Spend
#
# Hand-checked arithmetic for every row (row = campaign# + 1, header is row 1):
#  1 FB-Diwali-Sale            15000 300000 6000  120 -> CTR=2.0  CPC=2.5  CPA=125  Rev=144000 ROAS=9.6
#  2 FB-Retarget-Cart           8000 100000 2500  100 -> CTR=2.5  CPC=3.2  CPA=80   Rev=120000 ROAS=15
#  3 FB-Brand-Awareness        12000 600000 6000   30 -> CTR=1.0  CPC=2.0  CPA=400  Rev=36000  ROAS=3
#  4 FB-Lookalike-Audience     10000 200000 4000   80 -> CTR=2.0  CPC=2.5  CPA=125  Rev=96000  ROAS=9.6
#  5 FB-Video-Ad                9000 450000 4500   45 -> CTR=1.0  CPC=2.0  CPA=200  Rev=54000  ROAS=6
#  6 Google-Search-Brand       20000  80000 4000  200 -> CTR=5.0  CPC=5.0  CPA=100  Rev=240000 ROAS=12
#  7 Google-Search-Generic     24000 150000 3000   80 -> CTR=2.0  CPC=8.0  CPA=300  Rev=96000  ROAS=4
#  8 Google-Shopping           18000  90000 1800   90 -> CTR=2.0  CPC=10.0 CPA=200  Rev=108000 ROAS=6
#  9 Google-Display-Network     6000 500000 2500   15 -> CTR=0.5  CPC=2.4  CPA=400  Rev=18000  ROAS=3
# 10 Google-Remarketing         7000  70000 1400   70 -> CTR=2.0  CPC=5.0  CPA=100  Rev=84000  ROAS=12
# 11 Insta-Reels-Launch        11000 275000 5500   55 -> CTR=2.0  CPC=2.0  CPA=200  Rev=66000  ROAS=6
# 12 Insta-Influencer-Collab   15000 400000 6000   30 -> CTR=1.5  CPC=2.5  CPA=500  Rev=36000  ROAS=2.4
# 13 Insta-Story-Ads            6000 200000 4000   40 -> CTR=2.0  CPC=1.5  CPA=150  Rev=48000  ROAS=8
# 14 Insta-Carousel-Ad          9000 300000 6000   36 -> CTR=2.0  CPC=1.5  CPA=250  Rev=43200  ROAS=4.8
# 15 YouTube-Skippable-Ad      14000 700000 7000   28 -> CTR=1.0  CPC=2.0  CPA=500  Rev=33600  ROAS=2.4
# 16 YouTube-Bumper-Ad          8000 800000 4000   16 -> CTR=0.5  CPC=2.0  CPA=500  Rev=19200  ROAS=2.4
# 17 YouTube-InStream-Ad       10000 500000 5000   25 -> CTR=1.0  CPC=2.0  CPA=400  Rev=30000  ROAS=3
# 18 YouTube-Discovery-Ad       5000 250000 2500   25 -> CTR=1.0  CPC=2.0  CPA=200  Rev=30000  ROAS=6
#
# Total Spend       = 15000+8000+12000+10000+9000+20000+24000+18000+6000+7000+11000+15000+6000+9000+14000+8000+10000+5000 = 207000
# Total Conversions = 120+100+30+80+45+200+80+90+15+70+55+30+40+36+28+16+25+25 = 1085
# Total Revenue     = 1085 * 1200 = 1302000
# Overall ROAS      = 1302000 / 207000 = 6.28985... ~= 6.29

_TASK6_ROWS = [
    ("FB-Diwali-Sale", "Facebook Ads", 15000, 300000, 6000, 120),
    ("FB-Retarget-Cart", "Facebook Ads", 8000, 100000, 2500, 100),
    ("FB-Brand-Awareness", "Facebook Ads", 12000, 600000, 6000, 30),
    ("FB-Lookalike-Audience", "Facebook Ads", 10000, 200000, 4000, 80),
    ("FB-Video-Ad", "Facebook Ads", 9000, 450000, 4500, 45),
    ("Google-Search-Brand", "Google Search Ads", 20000, 80000, 4000, 200),
    ("Google-Search-Generic", "Google Search Ads", 24000, 150000, 3000, 80),
    ("Google-Shopping", "Google Search Ads", 18000, 90000, 1800, 90),
    ("Google-Display-Network", "Google Display Ads", 6000, 500000, 2500, 15),
    ("Google-Remarketing", "Google Search Ads", 7000, 70000, 1400, 70),
    ("Insta-Reels-Launch", "Instagram Ads", 11000, 275000, 5500, 55),
    ("Insta-Influencer-Collab", "Instagram Ads", 15000, 400000, 6000, 30),
    ("Insta-Story-Ads", "Instagram Ads", 6000, 200000, 4000, 40),
    ("Insta-Carousel-Ad", "Instagram Ads", 9000, 300000, 6000, 36),
    ("YouTube-Skippable-Ad", "YouTube Ads", 14000, 700000, 7000, 28),
    ("YouTube-Bumper-Ad", "YouTube Ads", 8000, 800000, 4000, 16),
    ("YouTube-InStream-Ad", "YouTube Ads", 10000, 500000, 5000, 25),
    ("YouTube-Discovery-Ad", "YouTube Ads", 5000, 250000, 2500, 25),
]

_TASK6_PREFILLED = {
    "A1": "Campaign", "B1": "Channel", "C1": "Spend (Rs)", "D1": "Impressions", "E1": "Clicks",
    "F1": "Conversions", "G1": "CTR %", "H1": "CPC (Rs)", "I1": "CPA (Rs)", "J1": "Revenue (Rs)", "K1": "ROAS",
}
_TASK6_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1"]
for _i, (_camp, _chan, _spend, _imp, _clicks, _conv) in enumerate(_TASK6_ROWS):
    _r = _i + 2
    _TASK6_PREFILLED[f"A{_r}"] = _camp
    _TASK6_PREFILLED[f"B{_r}"] = _chan
    _TASK6_PREFILLED[f"C{_r}"] = _spend
    _TASK6_PREFILLED[f"D{_r}"] = _imp
    _TASK6_PREFILLED[f"E{_r}"] = _clicks
    _TASK6_PREFILLED[f"F{_r}"] = _conv
    _TASK6_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}", f"E{_r}", f"F{_r}"]
_TASK6_PREFILLED.update({
    "A20": "TOTALS (across all 18 campaigns) — Avg Order Value per conversion = Rs 1,200",
    "A21": "Total Spend (Rs)",
    "A22": "Total Conversions",
    "A23": "Total Revenue (Rs)",
    "A24": "Overall ROAS (Blended) = Total Revenue / Total Spend",
})
_TASK6_LOCKED += ["A20", "A21", "A22", "A23", "A24"]

_MKT_TASK6_TEMPLATE = {
    "rows": 24,
    "cols": 11,
    "headers": ["Campaign", "Channel", "Spend (Rs)", "Impressions", "Clicks", "Conversions",
                "CTR %", "CPC (Rs)", "CPA (Rs)", "Revenue (Rs)", "ROAS"],
    "prefilled": _TASK6_PREFILLED,
    "locked_cells": _TASK6_LOCKED,
}

_MKT_TASK6_ANSWER_KEY = {
    "cells": {
        # Row 2 = campaign 1 (FB-Diwali-Sale)
        "G2": {"expected": 2.0, "tolerance": 0.1}, "H2": {"expected": 2.5, "tolerance": 0.1},
        "I2": {"expected": 125, "tolerance": 1}, "J2": {"expected": 144000, "tolerance": 1},
        "K2": {"expected": 9.6, "tolerance": 0.1},
        # Row 7 = campaign 6 (Google-Search-Brand)
        "G7": {"expected": 5.0, "tolerance": 0.1}, "H7": {"expected": 5.0, "tolerance": 0.1},
        "I7": {"expected": 100, "tolerance": 1}, "J7": {"expected": 240000, "tolerance": 1},
        "K7": {"expected": 12.0, "tolerance": 0.2},
        # Row 10 = campaign 9 (Google-Display-Network)
        "G10": {"expected": 0.5, "tolerance": 0.05}, "H10": {"expected": 2.4, "tolerance": 0.1},
        "I10": {"expected": 400, "tolerance": 1}, "J10": {"expected": 18000, "tolerance": 1},
        "K10": {
            "expected": 3.0, "tolerance": 0.1,
            "mistake_note": "A ROAS of 3 with a CPA of Rs 400 (the highest CPA of any campaign here) marks this as a "
                             "candidate to CUT or rework, not scale — missing this is a common mistake when only "
                             "looking at Spend or Impressions instead of the efficiency ratios.",
        },
        # Row 12 = campaign 11 (Insta-Reels-Launch)
        "G12": {"expected": 2.0, "tolerance": 0.1}, "H12": {"expected": 2.0, "tolerance": 0.1},
        "I12": {"expected": 200, "tolerance": 1}, "J12": {"expected": 66000, "tolerance": 1},
        "K12": {"expected": 6.0, "tolerance": 0.1},
        # Row 16 = campaign 15 (YouTube-Skippable-Ad)
        "G16": {"expected": 1.0, "tolerance": 0.1}, "H16": {"expected": 2.0, "tolerance": 0.1},
        "I16": {"expected": 500, "tolerance": 1}, "J16": {"expected": 33600, "tolerance": 1},
        "K16": {"expected": 2.4, "tolerance": 0.1},
        # Row 19 = campaign 18 (YouTube-Discovery-Ad)
        "G19": {"expected": 1.0, "tolerance": 0.1}, "H19": {"expected": 2.0, "tolerance": 0.1},
        "I19": {"expected": 200, "tolerance": 1}, "J19": {"expected": 30000, "tolerance": 1},
        "K19": {"expected": 6.0, "tolerance": 0.1},
        # Totals
        "C21": {"expected": 207000, "tolerance": 1},
        "F22": {"expected": 1085, "tolerance": 1},
        "J23": {"expected": 1302000, "tolerance": 5},
        "K24": {"expected": 6.29, "tolerance": 0.1},
    },
}


MARKETING_TASKS = [

    # ── Phase 1 (guided, Day 1-30) ─────────────────────────────────────────
    {
        "track": "marketing",
        "title": "Social Media Caption Writing",
        "phase": 1,
        "is_blindfold": False,
        "difficulty": "easy",
        "points_value": 70,
        "deliverable_type": "text",
        "requires_geotag": False,
        "estimated_duration": "1.5-2 hours",
        "brief": "Urban Nest Bakery is a boutique neighbourhood bakery known for sourdough bread and fresh "
                 "pastries. Weekday afternoons (2-6 PM) are their slowest period — most customers only come in "
                 "on weekend mornings. To fix this, they're launching the 'Monsoon Chai-Time Box' — a "
                 "limited-time snack box (2 samosas, 1 slice of banana bread, 1 cup of masala chai) priced at "
                 "Rs 149, available only Monday-Friday, 2-6 PM, for the next 4 weeks. The owner has asked you "
                 "to write the social captions for the launch, across platforms.",
        "why_it_matters": "Adjusting tone and structure for the platform (not just the product) is a core "
                           "copywriting skill that applies at any company selling anything, on any channel.",
        "instructions": "Step 1: Read the brief carefully — note the product, the price, the availability "
                         "window, and the specific problem (slow weekday afternoons) this campaign is solving.\n"
                         "Step 2: Write 2 Instagram captions — casual, visual-first tone, emojis and 3-5 "
                         "relevant hashtags are fine, each under 150 words.\n"
                         "Step 3: Write 2 Facebook captions — slightly longer and more descriptive, "
                         "community/local-story tone, each under 150 words.\n"
                         "Step 4: Write 1-2 LinkedIn captions — professional tone, framed as a founder-story or "
                         "small-business angle, no emojis, no hard sell, under 150 words.\n"
                         "Step 5: Under each caption, add a 1-2 sentence rationale explaining why that specific "
                         "tone/angle fits that platform and this campaign's goal.\n"
                         "Step 6: Finally, write a 150+ word summary explaining which platform you think will "
                         "drive the most weekday walk-ins for this specific campaign, and why.",
        "mistake_explanation": "Using the same caption and tone across every platform is one of the most common "
                                "junior-marketer mistakes — Instagram audiences skim visually and respond to "
                                "casual, hashtag-driven copy, while LinkedIn audiences expect a professional, "
                                "story-driven angle and disengage from hard-sell language. In a real company, "
                                "posting identical copy everywhere signals the brand doesn't understand its own "
                                "audience, and it measurably lowers engagement on every platform at once.",
        "hints": [
            "Hint 1: Instagram captions can be short and punchy with emojis/hashtags — the photo does most of "
            "the work there, the caption just needs a hook.",
            "Hint 2: Facebook captions can be a little longer and more 'story-like' — naming the actual problem "
            "(slow weekday afternoons) directly tends to land well with Facebook's local-community tone.",
            "Hint 3: LinkedIn is not the place for a hard sell or emojis — reframe the same launch as a "
            "small-business decision or a founder's story, and keep the tone professional throughout.",
        ],
        "sample_solution": "Worked example using a different fictional business (PowerFit Gym, launching a "
                            "Rs 999/month student discount): Instagram — 'Student budget, no excuses. PowerFit's "
                            "new Rs 999/month plan is live — bring your student ID, walk out with a plan. Tag "
                            "your gym buddy #StudentFitness #GymLife #PowerFit' (Rationale: short, uses an "
                            "emoji-driven CTA and a tag-a-friend hook — this is how Instagram users are used to "
                            "consuming offers.) LinkedIn — 'We noticed a lot of our neighbourhood's college "
                            "students skip the gym once expenses add up. So we built a Rs 999/month student "
                            "plan — not a marketing gimmick, just something that made sense for our community. "
                            "If you know a student who could use it, feel free to share.' (Rationale: no "
                            "emojis, frames the offer as a considered business decision for a professional "
                            "audience, not a hard sell.)",
    },

    {
        "track": "marketing",
        "title": "Competitor Analysis",
        "phase": 1,
        "is_blindfold": False,
        "difficulty": "medium",
        "points_value": 85,
        "deliverable_type": "text_and_photo",
        "requires_geotag": True,
        "estimated_duration": "2-3 hours (including travel)",
        "brief": "Urban Nest Bakery (the same fictional bakery from your caption-writing task — premium "
                 "sourdough and pastries, Rs 149 Chai-Time Box promo, moderate pricing, no loyalty program yet, "
                 "and very light social media activity, roughly one post every 2 weeks) wants to understand "
                 "how a real, similarly-positioned local business markets itself in person, not just online. "
                 "Go find any real nearby business that competes for a similar kind of customer — a bakery, "
                 "cafe, sweet shop, quick-service restaurant, or any local food/retail business near you — and "
                 "study its in-person marketing.",
        "why_it_matters": "Reading a real business's in-person marketing signals — signage, pricing display, "
                           "visible offers, positioning — is a skill no amount of online research replaces, and "
                           "it's exactly what a marketing analyst is expected to do before writing any real "
                           "recommendation.",
        "instructions": "Step 1: Pick a real local business near you that competes for a customer similar to "
                         "Urban Nest Bakery's (any bakery, cafe, sweet shop, or small food/retail business is "
                         "fine — it doesn't need to be an exact match).\n"
                         "Step 2: Take a live photo of its storefront, signage, or window display — this is "
                         "your proof-of-visit, and your location will be captured automatically with the "
                         "photo.\n"
                         "Step 3: While there, note what you observe: signage/branding, any visible offers or "
                         "discounts, how prices are displayed, footfall at the time you visited, and anything "
                         "about how it visually tries to pull people in off the street.\n"
                         "Step 4: Compare what you saw to Urban Nest Bakery's current situation as given in the "
                         "brief — its pricing, lack of a loyalty program, and light social media presence.\n"
                         "Step 5: Write 200+ words covering: what this real business does well that Urban Nest "
                         "Bakery doesn't, at least 2 concrete and specific recommendations Urban Nest Bakery "
                         "could copy or adapt, and one thing you think this real competitor could itself "
                         "improve.\n"
                         "Step 6: Submit your photo together with your written analysis.",
        "mistake_explanation": "A competitor analysis that stays vague ('their signage looks nice') instead of "
                                "specific ('they display a Buy-1-Get-1 pastry board right at eye level near the "
                                "entrance, which is exactly the kind of visible, low-cost promo Urban Nest "
                                "Bakery could run in its slow 2-6 PM window') gives a business owner nothing "
                                "they can actually act on. In a real company, recommendations that aren't "
                                "grounded in specific, observed detail get ignored — genuinely useful "
                                "competitive intelligence is the entire point of this kind of field research.",
        "hints": [
            "Hint 1: Don't just photograph the sign — look at what's near the entrance/window: price boards, "
            "offer stickers, queue length, how staff greet walk-ins. These in-person details are what "
            "online-only 'competitor research' misses entirely.",
            "Hint 2: A useful recommendation is specific and actionable ('add a visible weekday-afternoon "
            "offer board near the entrance') — not generic ('improve their marketing').",
            "Hint 3: It's fine if the business you visit isn't an exact bakery match — a cafe, sweet shop, or "
            "any small food/retail business works, as long as you can genuinely compare its in-person "
            "marketing approach to Urban Nest Bakery's.",
        ],
        "sample_solution": "Worked example using a different fictional client and a different real visit: if "
                            "your fictional client were 'GreenCup Coffee' (no visible in-store offers, plain "
                            "paper cups, minimal signage) and you visited a real nearby juice bar that had a "
                            "large 'Today's Combo: Juice + Sandwich Rs 99' board right at the door, laminated "
                            "price cards on every table, and a 'Follow us, tag us, get 10% off' sticker at the "
                            "counter — your write-up would note: GreenCup Coffee has no visible in-store offer "
                            "at all, so a simple laminated 'Today's Combo' board near the entrance (mirroring "
                            "what you saw) is a low-cost, high-visibility fix, and the 'follow us for a "
                            "discount' sticker is another near-zero-cost idea that directly grows their weak "
                            "social presence. You'd also flag one thing the juice bar itself could improve — "
                            "e.g. its queue management looked disorganised during your visit.",
    },

    {
        "track": "marketing",
        "title": "Email Campaign Draft",
        "phase": 1,
        "is_blindfold": False,
        "difficulty": "medium",
        "points_value": 75,
        "deliverable_type": "text",
        "requires_geotag": False,
        "estimated_duration": "1.5-2.5 hours",
        "brief": "PulseFit is a fictional mobile fitness app. They're launching 'PulseFit Pro' — a new premium "
                 "subscription tier (personalised workout plans, live trainer chat, and offline video "
                 "downloads) priced at Rs 499/month. For the first 500 signups only, they're offering 30% off "
                 "for the first 3 months (so Rs 349/month), and the offer expires in 7 days. This email will go "
                 "to PulseFit's existing free-tier user base (around 40,000 users) who have never upgraded.",
        "why_it_matters": "Writing a subject line and body that actually get opened and acted on — not just "
                           "filled with buzzwords — is one of the highest-leverage, most measurable skills in "
                           "any marketing role, at any company.",
        "instructions": "Step 1: Write a subject line (under 60 characters) designed to get a free-tier user to "
                         "open the email.\n"
                         "Step 2: Write the email body (150-250 words) — open with the free-tier user's likely "
                         "pain point, introduce PulseFit Pro's 3 key features, and state the 30% early-bird "
                         "discount, the 'first 500 signups' scarcity, and the 7-day deadline clearly and "
                         "early.\n"
                         "Step 3: Write one clear, single call-to-action (e.g. 'Upgrade to Pro Now') — not "
                         "multiple competing actions.\n"
                         "Step 4: Below the email, write a 150+ word note on your subject-line strategy — why "
                         "you chose those specific words, what makes a free-tier user open a fitness-app email "
                         "versus ignore it, and whether urgency/scarcity language works well here and why.",
        "mistake_explanation": "A vague or clickbait-y subject line ('You won't believe this!!') either gets "
                                "filtered as spam or opened with the wrong intent and immediately deleted — in "
                                "a real company, subject-line performance is measured directly as open rate, "
                                "and a bad one means the entire email, no matter how good the body is, gets "
                                "read by almost nobody. Burying the actual offer (price, discount %, deadline) "
                                "deep in paragraph 3 instead of stating it early is the second most common "
                                "mistake — real users skim, they don't read start to finish.",
        "hints": [
            "Hint 1: A strong subject line is specific, not hype-y — naming the actual benefit or the deadline "
            "(a number, a percentage, or a countdown) usually outperforms vague excitement.",
            "Hint 2: State the discount, the eligibility ('first 500 signups'), and the deadline explicitly and "
            "early in the body — don't make the reader hunt for the actual offer.",
            "Hint 3: One CTA, not three — an email offering 'Upgrade Now' AND 'Learn More' AND 'Share with a "
            "friend' dilutes the single action you actually want taken.",
        ],
        "sample_solution": "Worked example for a different fictional product (Nimbus Home Decor's 'Nimbus "
                            "Bundle', a 3-piece home decor set at Rs 2,499, 20% off for the first 200 orders, "
                            "5-day deadline): Subject: '20% off your first Nimbus Bundle - 5 days left'. Body: "
                            "'Hi [Name], your home deserves better than mismatched decor. The Nimbus Bundle "
                            "brings 3 pieces — a woven wall hanging, a ceramic vase, and a table runner — "
                            "designed to work together, for Rs 2,499. For the next 5 days (or the first 200 "
                            "orders, whichever comes first), it's 20% off at Rs 1,999. [Shop the Bundle Now]'. "
                            "Subject-line note: the subject leads with a concrete number (20%) and a real "
                            "deadline (5 days) instead of vague excitement — specific numbers signal a real, "
                            "time-bound offer rather than routine promotional noise, which is what actually "
                            "earns an open from a user who already gets several marketing emails a week.",
    },

    # ── Phase 2 (independent, Day 31-60) ────────────────────────────────────
    {
        "track": "marketing",
        "title": "Marketing Budget Allocation",
        "phase": 2,
        "is_blindfold": False,
        "difficulty": "medium",
        "points_value": 95,
        "deliverable_type": "text_and_spreadsheet",
        "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "brief": "Nimbus Home Decor (a fictional e-commerce home decor brand) has a fixed monthly marketing "
                 "budget of Rs 2,00,000 to split across 6 channels. Based on last quarter's performance, each "
                 "channel has a historical Cost per Lead and a recommended Allocation % already worked out for "
                 "you: Social Media Ads (Cost per Lead Rs 250, Allocation 30%), Google Search Ads (Rs 400, "
                 "25%), Influencer Marketing (Rs 600, 15%), Print / Local Ads (Rs 800, 10%), Events & "
                 "Sponsorships (Rs 1,000, 10%), Content Marketing / SEO-Blog (Rs 200, 10%). Turn this into "
                 "actual rupee amounts and a projected lead count per channel, then form your own view on "
                 "whether this recommended split is actually the smart one.",
        "why_it_matters": "Turning a budget and channel-performance data into an actual rupee allocation — and "
                           "then being able to argue whether that allocation is smart — is exactly what a "
                           "marketing coordinator or analyst does before any campaign spend is approved, at any "
                           "company.",
        "instructions": "Step 1: In column D (Allocated Amount), calculate each channel's rupee allocation as "
                         "Allocation % x total budget (Rs 2,00,000) — use a formula that references the "
                         "Allocation % cell, don't hand-type the result.\n"
                         "Step 2: In column E (Projected Leads), calculate Allocated Amount / Cost per Lead for "
                         "each channel.\n"
                         "Step 3: In row 10, sum up the Total Allocated Amount across all 6 channels (it should "
                         "land on exactly Rs 2,00,000).\n"
                         "Step 4: In row 11, sum up Total Projected Leads across all 6 channels.\n"
                         "Step 5: In row 12, calculate the Blended Cost per Lead = Total Allocated Amount / "
                         "Total Projected Leads.\n"
                         "Step 6: In the text box, write 150+ words: which channel is the most lead-efficient, "
                         "would you change the given allocation at all if it were your decision, and why (or "
                         "why not)?",
        "spreadsheet_template": _MKT_TASK4_TEMPLATE,
        "spreadsheet_answer_key": _MKT_TASK4_ANSWER_KEY,
        "mistake_explanation": "Allocating budget without checking that it actually adds up to the full "
                                "approved amount (here, exactly Rs 2,00,000) is a real, common mistake — either "
                                "money goes unspent and sits idle, or the plan quietly overshoots the approved "
                                "budget, which is exactly the kind of error that gets a marketing plan sent "
                                "back by finance before any of it can run.",
        "hints": [
            "Hint 1: Allocated Amount = Allocation % x Total Budget (Rs 2,00,000) — for example, "
            "=C2*200000/100 (or reference a dedicated budget cell) rather than typing the rupee number by "
            "hand.",
            "Hint 2: Projected Leads = Allocated Amount / Cost per Lead for that same channel.",
            "Hint 3: Your 6 Allocated Amounts should sum to exactly Rs 2,00,000 — if D10 doesn't show that, "
            "re-check that your Allocation % formulas reference the right cells.",
        ],
        "sample_solution": "Worked example with a smaller Rs 1,00,000 budget and 2 channels (different mock "
                            "data): Channel A has Allocation % = 40% and Cost per Lead = Rs 200 -> Allocated "
                            "Amount = 0.40 x 100000 = Rs 40,000 -> Projected Leads = 40000/200 = 200 leads. "
                            "Channel B has Allocation % = 60% and Cost per Lead = Rs 500 -> Allocated Amount = "
                            "Rs 60,000 -> Projected Leads = 60000/500 = 120 leads. Total Allocated = Rs "
                            "1,00,000, Total Leads = 320, Blended Cost per Lead = 100000/320 = Rs 312.5. The "
                            "written justification should note Channel A is far more lead-efficient (Rs 200 vs "
                            "Rs 500 per lead) and argue whether the allocation should skew even further toward "
                            "A, or whether Channel B still deserves its share for reasons beyond pure "
                            "lead-cost, like broader reach or brand visibility.",
    },

    {
        "track": "marketing",
        "title": "Content Calendar Planning",
        "phase": 2,
        "is_blindfold": False,
        "difficulty": "medium",
        "points_value": 85,
        "deliverable_type": "text",
        "requires_geotag": False,
        "estimated_duration": "2-3 hours",
        "brief": "GreenLeaf Organics is a fictional organic grocery delivery startup preparing to launch a new "
                 "'Farm Box Subscription' (a weekly box of seasonal organic produce) in 2 weeks. Before the "
                 "launch, they want a content calendar covering the 14 days leading up to launch day (Day 14) "
                 "— building awareness and pre-launch interest across Instagram, Facebook, and email.",
        "why_it_matters": "Sequencing content over time toward a specific date — instead of just posting "
                           "randomly — is what separates a real pre-launch marketing plan from a list of "
                           "disconnected social posts, and it's a skill used identically whether the launch is "
                           "a grocery subscription or a software product.",
        "instructions": "Step 1: For each of the 14 days, decide 4 things: the platform (Instagram / Facebook "
                         "/ Email — mix them, don't repeat the same platform every day), the content type "
                         "(e.g. reel, carousel post, static image, behind-the-scenes, testimonial, countdown, "
                         "email teaser, FAQ post, etc.), the theme/topic for that day, and the specific goal "
                         "(awareness, education, trust-building, urgency, or conversion).\n"
                         "Step 2: Make sure the mix isn't repetitive — vary content type and platform across "
                         "the 14 days, and build toward increasing urgency as Day 14 (launch) approaches.\n"
                         "Step 3: Include at least 2 purely educational posts (e.g. 'why organic matters', 'how "
                         "the Farm Box works') somewhere in the first week — not just promotional content.\n"
                         "Step 4: Include at least 1 countdown/urgency-driven post in the final 3 days before "
                         "launch.\n"
                         "Step 5: Present your calendar as a day-by-day list (Day 1 through Day 14) with the 4 "
                         "fields above for each day.\n"
                         "Step 6: Finally, write 150+ words explaining your reasoning — why you sequenced the "
                         "content the way you did, and why this mix and cadence builds toward launch day "
                         "rather than just filling 14 days.",
        "mistake_explanation": "A content calendar that posts the same content type on the same platform every "
                                "single day (e.g. 14 straight promotional Instagram posts) fatigues an audience "
                                "fast — engagement drops sharply after the first few repetitive posts, and by "
                                "launch day the audience has already tuned out. In a real company, a calendar "
                                "that doesn't vary content type/platform and doesn't build urgency toward a "
                                "specific date wastes the entire pre-launch window — the whole point of a "
                                "content calendar like this is to build momentum, not just to fill days.",
        "hints": [
            "Hint 1: Think of the 14 days in 3 phases — early days build awareness/education (why should "
            "anyone care), middle days build trust (testimonials, behind-the-scenes, how it works), and the "
            "final 2-3 days build urgency (countdown, 'launching in 2 days', early-bird signup).",
            "Hint 2: Email doesn't need to go out every day like social does — 2-3 well-timed emails (e.g. a "
            "teaser mid-week, a 'launching in 3 days' reminder) are usually enough.",
            "Hint 3: Vary content TYPE even on the same platform — a week of nothing but static image posts on "
            "Instagram is just as repetitive as posting on only one platform.",
        ],
        "sample_solution": "Worked example using a different fictional brand (BrightPage Books, launching a "
                            "'Monthly Book Box' in 2 weeks): Day 1 — Instagram, carousel post, 'Why we started "
                            "BrightPage', awareness. Day 3 — Facebook, static post, 'What's inside a Book Box?', "
                            "education. Day 5 — Instagram, reel, 'Unboxing a sample box', trust-building. Day 7 "
                            "— Email, teaser email, 'Something's coming...', awareness. Day 9 — Instagram, "
                            "testimonial graphic, 'What early readers are saying', trust-building. Day 11 — "
                            "Facebook, FAQ post, 'Your questions answered', education/trust. Day 12 — Email, "
                            "'Launching in 2 days + early-bird 15% off', urgency/conversion. Day 13 — "
                            "Instagram, countdown post, '1 day left', urgency. Day 14 — all platforms, launch "
                            "announcement with direct signup link, conversion. The reasoning would explain: the "
                            "first week deliberately avoids selling anything and builds the 'why', the middle "
                            "stretch builds proof/trust, and only the final 3 days push urgency, because "
                            "spending the strongest urgency messaging on Day 1, on an audience that doesn't "
                            "know the brand yet, wastes it on people who aren't ready to convert.",
    },

    # ── Phase 3 (Day 61-90) ─────────────────────────────────────────────────
    {
        "track": "marketing",
        "title": "Ad Performance Analysis",
        "phase": 3,
        "is_blindfold": False,
        "difficulty": "hard",
        "points_value": 115,
        "deliverable_type": "text_and_spreadsheet",
        "requires_geotag": False,
        "estimated_duration": "3-4 hours",
        "brief": "Nimbus Home Decor (the same fictional brand from your Budget Allocation task) ran 18 ad "
                 "campaigns last quarter across Facebook, Google Search, Google Display, Instagram, and "
                 "YouTube. The raw spend/impressions/clicks/conversions data for all 18 campaigns is already "
                 "filled into the spreadsheet below. Their average order value is Rs 1,200 per conversion. "
                 "Calculate CTR, CPC, CPA, Revenue, and ROAS for every campaign, then decide which campaigns "
                 "you'd scale up and which you'd cut.",
        "why_it_matters": "Turning a raw, unsorted ad-performance export into CTR/CPC/CPA/ROAS and using those "
                           "numbers (not gut feeling) to decide what to scale or cut is the single most common "
                           "recurring task for a performance marketer or media buyer at any company running "
                           "paid ads.",
        "instructions": "Step 1: In column G, calculate CTR % = (Clicks / Impressions) x 100 for each of the "
                         "18 campaigns.\n"
                         "Step 2: In column H, calculate CPC (Cost per Click) = Spend / Clicks.\n"
                         "Step 3: In column I, calculate CPA (Cost per Acquisition) = Spend / Conversions.\n"
                         "Step 4: In column J, calculate Revenue = Conversions x Rs 1,200 (the given average "
                         "order value).\n"
                         "Step 5: In column K, calculate ROAS (Return on Ad Spend) = Revenue / Spend.\n"
                         "Step 6: In rows 21-24, calculate the Total Spend, Total Conversions, Total Revenue, "
                         "and the Overall Blended ROAS (Total Revenue / Total Spend) across all 18 campaigns.\n"
                         "Step 7: In the text box, write 200+ words identifying at least 3 campaigns you'd "
                         "scale up (highest ROAS / lowest CPA relative to their channel) and at least 3 you'd "
                         "cut or rework (lowest ROAS / highest CPA), with your reasoning for each.",
        "spreadsheet_template": _MKT_TASK6_TEMPLATE,
        "spreadsheet_answer_key": _MKT_TASK6_ANSWER_KEY,
        "mistake_explanation": "Judging a campaign by Spend or Impressions alone — instead of CPA and ROAS — is "
                                "a common, costly mistake: a campaign can have huge reach and still lose money "
                                "on every conversion, or a small, cheap campaign can be quietly the most "
                                "profitable one in the account. In a real company, scaling the wrong campaign "
                                "based on vanity metrics (impressions, clicks) instead of ROAS directly wastes "
                                "ad spend that could have gone to a campaign that was actually converting "
                                "efficiently.",
        "hints": [
            "Hint 1: CTR % = (Clicks / Impressions) x 100. CPC (Cost per Click) = Spend / Clicks. Both use the "
            "raw Spend/Impressions/Clicks columns already filled in for you.",
            "Hint 2: CPA (Cost per Acquisition) = Spend / Conversions. Revenue = Conversions x Rs 1,200 (the "
            "average order value given in the brief) — this isn't in the raw data, you calculate it yourself.",
            "Hint 3: ROAS (Return on Ad Spend) = Revenue / Spend. A ROAS well below the account average is "
            "usually a signal to cut or rework a campaign, not scale it — compare each campaign's ROAS and CPA "
            "against others in the same channel before deciding.",
        ],
        "sample_solution": "Worked example with a single different fictional campaign: Spend = Rs 4,000, "
                            "Impressions = 100,000, Clicks = 2,000, Conversions = 20, Average Order Value = Rs "
                            "1,000. CTR = 2000/100000*100 = 2%. CPC = 4000/2000 = Rs 2. CPA = 4000/20 = Rs 200. "
                            "Revenue = 20 x 1000 = Rs 20,000. ROAS = 20000/4000 = 5. A ROAS of 5 (Rs 5 earned "
                            "for every Rs 1 spent) with a moderate CPA is a solid candidate to scale further; "
                            "if a second campaign showed ROAS of 1.5 with a much higher CPA, that one would be "
                            "the one to cut or rework instead — the decision should always compare campaigns "
                            "against each other, not judge one campaign in isolation.",
    },

    {
        "track": "marketing",
        "title": "Full Campaign Proposal",
        "phase": 3,
        "is_blindfold": True,
        "difficulty": "hard",
        "points_value": 130,
        "deliverable_type": "text",
        "requires_geotag": False,
        "estimated_duration": "3-4 hours",
        "brief": "Verve Audio (a fictional consumer electronics brand) is launching 'Verve Pods X' — a new "
                 "pair of wireless earbuds (Rs 3,999, active noise cancellation, 30-hour battery life) "
                 "targeting urban working professionals aged 24-35 who currently use budget/no-name earbuds "
                 "and are ready to upgrade. Verve Audio has approved a total marketing budget of Rs 8,00,000 "
                 "for the 6-week launch window and wants a complete campaign proposal before they approve any "
                 "spend.",
        "why_it_matters": "Building a complete, defensible campaign proposal — objective, audience, channels, "
                           "budget, timeline, and success metrics, all tied together — is the actual work "
                           "product a marketing manager delivers before any real campaign is approved to run, "
                           "at any company, for any product.",
        "instructions": "Step 1: Write a clear campaign Objective (1-2 sentences) — what specifically should "
                         "this campaign achieve in 6 weeks (a unit-sales target, a signup/waitlist number, or a "
                         "specific measurable awareness metric). A vague objective like 'increase brand "
                         "awareness' is not acceptable — make it specific and measurable.\n"
                         "Step 2: Define the Target Audience in detail — not just the age range given, but "
                         "their likely habits, where they spend time online and offline, and what would "
                         "actually make them switch from a budget earbud to a Rs 3,999 one.\n"
                         "Step 3: Propose a Channel Mix — which channels you'd use (e.g. Instagram, Google "
                         "Search, YouTube, influencer marketing, offline retail activation, etc.) and a "
                         "one-line reason why each fits this specific audience and product.\n"
                         "Step 4: Build a Budget Breakdown — allocate the full Rs 8,00,000 across your chosen "
                         "channels, with a rupee amount (or %) per channel, and a one-line reason for each "
                         "allocation.\n"
                         "Step 5: Build a Timeline across the 6 weeks — what happens in which week (e.g. "
                         "teaser phase, launch day, sustain phase, final-push phase).\n"
                         "Step 6: Define Success Metrics — the specific numbers/KPIs you'd check at the end of "
                         "6 weeks to know if the campaign worked, tied back to your Step 1 objective.\n"
                         "Step 7: Write your full proposal as one structured document with a clear heading for "
                         "each of the 6 sections above — minimum 500 words total across the whole proposal.",
        "mistake_explanation": "A campaign proposal that skips straight to 'post on Instagram and run some ads' "
                                "without a specific objective, a defined audience, or a budget breakdown is the "
                                "single most common reason real campaign proposals get rejected before they "
                                "even reach execution — a stakeholder approving Rs 8,00,000 in spend needs to "
                                "see exactly where the money goes, why, and how success will be measured, or "
                                "the campaign has no way to be judged a win or a failure afterward. A vague "
                                "objective like 'increase awareness' with no measurable target is functionally "
                                "impossible to grade as successful or not.",
    },

    # Interactive tool task — a real ad-copy + audience-targeting workspace,
    # for a fictional brand. No real audience is ever targeted and nothing
    # is published anywhere; the tool just structures the creative brief.
    # deliverable_type stays "text": graded by the same AI text grader as
    # every other Marketing task.
    {
        "track": "marketing", "title": "Launch Your First Ad Campaign Brief", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 90, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "interactive_tool": "ad_copy_workspace",
        "tool_seed_data": {
            "company": "Nimbus Home Decor",
            "campaign_brief": "New festive-season home decor collection launch — cushions, wall art, and lighting.",
            "audience_options": {
                "age": ["18-24", "25-34", "35-44", "45+"],
                "income": ["Budget-conscious", "Mid-income", "Premium"],
                "location": ["Metro cities", "Tier-2 cities", "Pan-India"],
            },
        },
        "brief": (
            "Nimbus Home Decor (fictional e-commerce brand) is launching a festive-season collection. Use the "
            "workspace below to write 3 ad hooks/headlines, a short caption for each, and select the audience "
            "targeting (age, income group, location) you'd actually run this to."
        ),
        "why_it_matters": (
            "Writing a hook that stops someone mid-scroll, then pairing it with audience targeting that actually "
            "matches who'd care about that hook, is the entire job of a performance-marketing creative role — "
            "most campaigns fail on the hook and the targeting, not the product itself."
        ),
        "instructions": (
            "Step 1: Write 3 different hook/headline options for the same collection — vary the angle (e.g. one "
            "price-led, one aspirational/lifestyle-led, one urgency-led) rather than writing 3 versions of the "
            "same idea.\n"
            "Step 2: Write a 1-2 line caption to go with each hook.\n"
            "Step 3: Select the audience (age, income group, location) you'd target for this campaign, and note "
            "in your answer WHY that audience fits a festive home-decor collection specifically.\n"
            "Step 4: In the answer box, write 150+ words explaining which of your 3 hooks you'd lead with as the "
            "primary ad and why, and how you'd know within the first week if it was working."
        ),
        "hints": [
            "Hint 1: A hook that could apply to literally any product (\"Shop Now!\", \"Limited Time Offer!\") "
            "isn't doing its job — a good hook is specific to what makes THIS collection worth stopping for.",
            "Hint 2: Festive home decor skews toward people who already own a home/rent long-term and have "
            "some discretionary spend — think about what age/income combination that actually points to.",
            "Hint 3: 'How you'd know if it was working' should name an actual number (click-through rate, cost "
            "per lead, add-to-cart rate) — not just 'if people like it.'",
        ],
        "sample_solution": (
            "Worked example for a different product (a budget fitness tracker): Hook A (price-led): 'Rs 1,499. "
            "One month of data. Zero excuses.' Hook B (lifestyle-led): 'The tracker that fits the plan you "
            "actually keep.' Hook C (urgency-led): 'Festive price ends Sunday — your next streak starts Monday.' "
            "Audience: 22-34, budget-conscious to mid-income, Tier-2 + metro — first-time fitness buyers, not "
            "serious athletes who'd want premium features. Primary pick reasoning: Hook A tests best for a "
            "budget-positioned product because price IS the differentiator here — the written answer should say "
            "that explicitly, not just declare a favorite."
        ),
    },
]


# ════════════════════════════════════════════════════════════════════
# SALES (8) — 90-day phase-based curated pool, mirrors Finance
# ════════════════════════════════════════════════════════════════════
# ── Task 5 mock data: "Prioritize Lead List" ──────────────────────────────
# 16 leads (rows 2-17), raw signals in columns B-F, computed Priority Score
# in column G. Weighted scoring formula (weights sum to 1.0, max score 10):
#   G = 0.35*MIN(10, DealSize/20000)      [max 3.5]
#     + 0.15*(EmailOpens*2)               [max 1.5]
#     + 0.20*(MeetingAttended*10)         [max 2.0]
#     + 0.15*Responsiveness               [max 1.5]
#     + 0.15*MAX(0, 10-DaysSinceContact)  [max 1.5]
# Arithmetic for every row (hand-verified, shown per row below):
#   Kumar Hardware:      0.35*2.25 + 0.15*6 + 0.20*10 + 0.15*7 + 0.15*6
#                       = 0.7875 + 0.9 + 2.0 + 1.05 + 0.9        = 5.6375
#   Priya Boutique:       0.35*9.0 + 0.15*10 + 0.20*10 + 0.15*9 + 0.15*8
#                       = 3.15 + 1.5 + 2.0 + 1.35 + 1.2           = 9.2
#   Grover Wholesale:     0.35*10(capped,11) + 0.15*8 + 0.20*10 + 0.15*8 + 0.15*9
#                       = 3.5 + 1.2 + 2.0 + 1.2 + 1.35             = 9.25
#   Sethi General Store:  0.35*0.75 + 0.15*2 + 0.20*0 + 0.15*3 + 0.15*0(neg->0)
#                       = 0.2625 + 0.3 + 0 + 0.45 + 0              = 1.0125
#   Om Sai Distributors:  0.35*4.75 + 0.15*4 + 0.20*0 + 0.15*5 + 0.15*0
#                       = 1.6625 + 0.6 + 0 + 0.75 + 0               = 3.0125
#   Verma Electronics:    0.35*3.0 + 0.15*8 + 0.20*10 + 0.15*6 + 0.15*4
#                       = 1.05 + 1.2 + 2.0 + 0.9 + 0.6              = 5.75
#   Bansal Textiles:      0.35*1.5 + 0.15*0 + 0.20*0 + 0.15*2 + 0.15*0
#                       = 0.525 + 0 + 0 + 0.3 + 0                   = 0.825
#   Nagpal Supermart:     0.35*6.5 + 0.15*6 + 0.20*10 + 0.15*7 + 0.15*5
#                       = 2.275 + 0.9 + 2.0 + 1.05 + 0.75            = 6.975
#   City Book Depot:      0.35*1.0 + 0.15*4 + 0.20*0 + 0.15*4 + 0.15*0
#                       = 0.35 + 0.6 + 0 + 0.6 + 0                  = 1.55
#   Rathi Wholesale Foods: 0.35*10(capped,12.5) + 0.15*10 + 0.20*10 + 0.15*9 + 0.15*7
#                       = 3.5 + 1.5 + 2.0 + 1.35 + 1.05             = 9.4
#   Anand Stationery Mart: 0.35*1.25 + 0.15*2 + 0.20*0 + 0.15*3 + 0.15*0
#                       = 0.4375 + 0.3 + 0 + 0.45 + 0               = 1.1875
#   Bright Kids Toys:      0.35*2.75 + 0.15*6 + 0.20*0 + 0.15*6 + 0.15*2
#                       = 0.9625 + 0.9 + 0 + 0.9 + 0.3              = 3.0625
#   Metro Hardware Sol.:   0.35*5.5 + 0.15*8 + 0.20*10 + 0.15*8 + 0.15*8
#                       = 1.925 + 1.2 + 2.0 + 1.2 + 1.2             = 7.525
#   Deshmukh Auto Parts:   0.35*2.0 + 0.15*4 + 0.20*10 + 0.15*5 + 0.15*0
#                       = 0.7 + 0.6 + 2.0 + 0.75 + 0                = 4.05
#   Fresh Mart Groceries:  0.35*0.9 + 0.15*0 + 0.20*0 + 0.15*2 + 0.15*0
#                       = 0.315 + 0 + 0 + 0.3 + 0                   = 0.615
#   Kapoor Furnishings:    0.35*8.0 + 0.15*8 + 0.20*10 + 0.15*7 + 0.15*6
#                       = 2.8 + 1.2 + 2.0 + 1.05 + 0.9              = 7.95
# Ranked descending -> Top 5: Rathi Wholesale Foods (9.4), Grover Wholesale
# Traders (9.25), Priya Boutique Chain (9.2), Kapoor Furnishings (7.95),
# Metro Hardware Solutions (7.525).

_T5_LEADS = [
    ("Kumar Hardware Store", 45000, 3, 1, 7, 4),
    ("Priya Boutique Chain", 180000, 5, 1, 9, 2),
    ("Grover Wholesale Traders", 220000, 4, 1, 8, 1),
    ("Sethi General Store", 15000, 1, 0, 3, 20),
    ("Om Sai Distributors", 95000, 2, 0, 5, 10),
    ("Verma Electronics", 60000, 4, 1, 6, 6),
    ("Bansal Textiles", 30000, 0, 0, 2, 28),
    ("Nagpal Supermart", 130000, 3, 1, 7, 5),
    ("City Book Depot", 20000, 2, 0, 4, 15),
    ("Rathi Wholesale Foods", 250000, 5, 1, 9, 3),
    ("Anand Stationery Mart", 25000, 1, 0, 3, 18),
    ("Bright Kids Toys", 55000, 3, 0, 6, 8),
    ("Metro Hardware Solutions", 110000, 4, 1, 8, 2),
    ("Deshmukh Auto Parts", 40000, 2, 1, 5, 12),
    ("Fresh Mart Groceries", 18000, 0, 0, 2, 25),
    ("Kapoor Furnishings", 160000, 4, 1, 7, 4),
]

_T5_PREFILLED = {
    "A1": "Lead / Company", "B1": "Deal Size (₹)", "C1": "Email Opens (out of last 5 sent)",
    "D1": "Meeting Attended (1=Yes, 0=No)", "E1": "Responsiveness Rating (0-10)",
    "F1": "Days Since Last Contact", "G1": "Priority Score (weighted, 0-10)",
}
_T5_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"]
for _i, (_name, _deal, _opens, _meet, _resp, _days) in enumerate(_T5_LEADS):
    _r = _i + 2
    _T5_PREFILLED[f"A{_r}"] = _name
    _T5_PREFILLED[f"B{_r}"] = _deal
    _T5_PREFILLED[f"C{_r}"] = _opens
    _T5_PREFILLED[f"D{_r}"] = _meet
    _T5_PREFILLED[f"E{_r}"] = _resp
    _T5_PREFILLED[f"F{_r}"] = _days
    _T5_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}", f"E{_r}", f"F{_r}"]

_SALES_TASK5_TEMPLATE = {
    "rows": 17, "cols": 7,
    "headers": ["Lead / Company", "Deal Size (₹)", "Email Opens (out of last 5 sent)",
                "Meeting Attended (1=Yes, 0=No)", "Responsiveness Rating (0-10)",
                "Days Since Last Contact", "Priority Score (weighted, 0-10)"],
    "prefilled": _T5_PREFILLED, "locked_cells": _T5_LOCKED,
}
_SALES_TASK5_ANSWER_KEY = {"cells": {
    "G2": {"expected": 5.6375, "tolerance": 0.3},
    "G3": {"expected": 9.2, "tolerance": 0.3},
    "G4": {"expected": 9.25, "tolerance": 0.3,
           "mistake_note": "Deal Size Score is capped at 10 — Grover's deal (₹220,000 ÷ 20,000 = 11) does NOT score "
                            "an 11, it caps at 10. Forgetting the cap over-inflates a large deal's priority beyond "
                            "what it should be."},
    "G5": {"expected": 1.0125, "tolerance": 0.3},
    "G6": {"expected": 3.0125, "tolerance": 0.3},
    "G7": {"expected": 5.75, "tolerance": 0.3},
    "G8": {"expected": 0.825, "tolerance": 0.3,
           "mistake_note": "Recency Score floors at 0 — with 28 days since contact (10-28 = -18), the score is 0, "
                            "not a negative number. A negative recency score would incorrectly drag an already-cold "
                            "lead's total even lower than it should go."},
    "G9": {"expected": 6.975, "tolerance": 0.3},
    "G10": {"expected": 1.55, "tolerance": 0.3},
    "G11": {"expected": 9.4, "tolerance": 0.3},
    "G12": {"expected": 1.1875, "tolerance": 0.3},
    "G13": {"expected": 3.0625, "tolerance": 0.3},
    "G14": {"expected": 7.525, "tolerance": 0.3},
    "G15": {"expected": 4.05, "tolerance": 0.3},
    "G16": {"expected": 0.615, "tolerance": 0.3},
    "G17": {"expected": 7.95, "tolerance": 0.3},
}}

# ── Task 6 mock data: "Pipeline Analysis" ─────────────────────────────────
# 14 deals (rows 2-15). Weighted Value (col F) = Deal Value * WinProb/100.
# Arithmetic per row:
#   Bansal Furniture World: 50000*0.10=5000        (Prospecting, open)
#   Rathi Wholesale Foods:  250000*0.25=62500       (Qualified, open)
#   Grover Wholesale Traders: 220000*0.80=176000    (Negotiation, open)
#   Priya Boutique Chain:   180000*0.60=108000      (Proposal Sent, open)
#   Metro Hardware Solutions: 110000*0.40=44000     (Demo Scheduled, open)
#   Kapoor Furnishings:     160000*0.60=96000        (Proposal Sent, open)
#   Om Sai Distributors:    95000*0.25=23750         (Qualified, open)
#   Nagpal Supermart:       130000*0.80=104000        (Negotiation, open)
#   Verma Electronics:      60000*0.10=6000           (Prospecting, open)
#   City Book Depot:        20000*0.00=0              (Closed Lost, EXCLUDED)
#   Anand Stationery Mart:  25000*1.00=25000           (Closed Won, EXCLUDED)
#   Sethi General Store:    15000*0.10=1500            (Prospecting, open)
#   Deshmukh Auto Parts:    40000*0.40=16000            (Demo Scheduled, open)
#   Fresh Mart Groceries:   18000*0.25=4500             (Qualified, open)
# Open deals = all except City Book Depot & Anand Stationery Mart (12 deals).
# Total Open Pipeline Value = sum of Deal Value over the 12 open rows:
#   50000+250000+220000+180000+110000+160000+95000+130000+60000+15000+40000+18000
#   = 1,328,000
# Total Weighted Pipeline Value = sum of Weighted Value over the same 12 rows:
#   5000+62500+176000+108000+44000+96000+23750+104000+6000+1500+16000+4500
#   = 647,250
# Average Days in Stage (open only) = (5+12+18+9+25+40+6+4+20+3+8+15)/12
#   = 165/12 = 13.75
# Stage conversion rates from last-quarter funnel counts:
#   Prospecting(50) -> Qualified(32):        32/50*100  = 64.0%
#   Qualified(32) -> Demo Scheduled(20):     20/32*100  = 62.5%
#   Demo Scheduled(20) -> Proposal Sent(12): 12/20*100  = 60.0%
#   Proposal Sent(12) -> Negotiation(8):     8/12*100   = 66.666...%
#   Negotiation(8) -> Closed Won(5):         5/8*100    = 62.5%

_T6_DEALS = [
    ("Bansal Furniture World", "Prospecting", 50000, 5, 10),
    ("Rathi Wholesale Foods", "Qualified", 250000, 12, 25),
    ("Grover Wholesale Traders", "Negotiation", 220000, 18, 80),
    ("Priya Boutique Chain", "Proposal Sent", 180000, 9, 60),
    ("Metro Hardware Solutions", "Demo Scheduled", 110000, 25, 40),
    ("Kapoor Furnishings", "Proposal Sent", 160000, 40, 60),
    ("Om Sai Distributors", "Qualified", 95000, 6, 25),
    ("Nagpal Supermart", "Negotiation", 130000, 4, 80),
    ("Verma Electronics", "Prospecting", 60000, 20, 10),
    ("City Book Depot", "Closed Lost", 20000, 0, 0),
    ("Anand Stationery Mart", "Closed Won", 25000, 0, 100),
    ("Sethi General Store", "Prospecting", 15000, 3, 10),
    ("Deshmukh Auto Parts", "Demo Scheduled", 40000, 8, 40),
    ("Fresh Mart Groceries", "Qualified", 18000, 15, 25),
]

_T6_PREFILLED = {
    "A1": "Deal / Company", "B1": "Stage", "C1": "Deal Value (₹)", "D1": "Days in Current Stage",
    "E1": "Win Probability % (stage standard)", "F1": "Weighted Value (Deal Value x Win Probability%)",
}
_T6_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1"]
for _i, (_name, _stage, _val, _days, _prob) in enumerate(_T6_DEALS):
    _r = _i + 2
    _T6_PREFILLED[f"A{_r}"] = _name
    _T6_PREFILLED[f"B{_r}"] = _stage
    _T6_PREFILLED[f"C{_r}"] = _val
    _T6_PREFILLED[f"D{_r}"] = _days
    _T6_PREFILLED[f"E{_r}"] = _prob
    _T6_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}", f"E{_r}"]

_T6_PREFILLED.update({
    "A17": "PIPELINE SUMMARY (Open Deals Only)",
    "A18": "Total Open Pipeline Value (₹) - excludes Closed Won/Lost",
    "A19": "Total Weighted Pipeline Value (₹) - excludes Closed Won/Lost",
    "A20": "Average Days in Stage (Open Deals Only)",
    "A22": "LAST QUARTER FUNNEL COUNTS (deals that reached each stage)",
    "A23": "Prospecting (entered)", "B23": 50,
    "A24": "Qualified", "B24": 32,
    "A25": "Demo Scheduled", "B25": 20,
    "A26": "Proposal Sent", "B26": 12,
    "A27": "Negotiation", "B27": 8,
    "A28": "Closed Won", "B28": 5,
    "A30": "STAGE CONVERSION RATES (%)",
    "A31": "Prospecting -> Qualified", "A32": "Qualified -> Demo Scheduled",
    "A33": "Demo Scheduled -> Proposal Sent", "A34": "Proposal Sent -> Negotiation",
    "A35": "Negotiation -> Closed Won",
})
_T6_LOCKED += ["A17", "A18", "A19", "A20", "A22", "A23", "B23", "A24", "B24", "A25", "B25",
               "A26", "B26", "A27", "B27", "A28", "B28", "A30", "A31", "A32", "A33", "A34", "A35"]

_SALES_TASK6_TEMPLATE = {
    "rows": 35, "cols": 6,
    "headers": ["Deal / Company", "Stage", "Deal Value (₹)", "Days in Current Stage",
                "Win Probability % (stage standard)", "Weighted Value (Deal Value x Win Probability%)"],
    "prefilled": _T6_PREFILLED, "locked_cells": _T6_LOCKED,
}
_SALES_TASK6_ANSWER_KEY = {"cells": {
    "F2": {"expected": 5000, "tolerance": 50}, "F3": {"expected": 62500, "tolerance": 100},
    "F4": {"expected": 176000, "tolerance": 200}, "F5": {"expected": 108000, "tolerance": 100},
    "F6": {"expected": 44000, "tolerance": 100}, "F7": {"expected": 96000, "tolerance": 100},
    "F8": {"expected": 23750, "tolerance": 50}, "F9": {"expected": 104000, "tolerance": 100},
    "F10": {"expected": 6000, "tolerance": 50}, "F11": {"expected": 0, "tolerance": 1},
    "F12": {"expected": 25000, "tolerance": 50}, "F13": {"expected": 1500, "tolerance": 20},
    "F14": {"expected": 16000, "tolerance": 50}, "F15": {"expected": 4500, "tolerance": 50},
    "B18": {"expected": 1328000, "tolerance": 500,
            "mistake_note": "A common mistake is including Closed Won / Closed Lost deal values in the open "
                             "pipeline total — those deals are already decided, so counting them inflates (or "
                             "confuses) what's actually still 'in flight'."},
    "B19": {"expected": 647250, "tolerance": 500},
    "B20": {"expected": 13.75, "tolerance": 0.5,
            "mistake_note": "Average Days in Stage should also exclude the two closed deals (their 0-day values "
                             "would otherwise drag the average down and hide real stalling)."},
    "B31": {"expected": 64.0, "tolerance": 1}, "B32": {"expected": 62.5, "tolerance": 1},
    "B33": {"expected": 60.0, "tolerance": 1},
    "B34": {"expected": 66.67, "tolerance": 1,
            "mistake_note": "8/12*100 = 66.67%, not 67% flat or 66% flat — small rounding slips here are normal, "
                             "but the raw ratio (count reaching next stage / count reaching current stage) is what "
                             "actually matters, not memorizing a rounded figure."},
    "B35": {"expected": 62.5, "tolerance": 1},
}}


SALES_TASKS = [

    # ═══════════════════════ PHASE 1 — guided (Day 1-30) ═══════════════════
    {
        "track": "sales", "title": "Add Leads to CRM", "phase": 1, "is_blindfold": False,
        "difficulty": "easy", "points_value": 70, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "1.5-2 hours",
        "brief": (
            "You're a Business Development Executive at Solstice CRM (a company that sells cloud inventory + "
            "billing software to small and mid-size retail/wholesale businesses). Last week your team had a "
            "booth at the 'Bengaluru Retail Tech Meet 2026' trade show, and a few inbound calls came in the same "
            "week. Here are the raw lead notes exactly as they were scribbled down or typed in a hurry — nobody "
            "has cleaned these up yet:\n\n"
            "1. \"Ramesh Kumar - Kumar Hardware Store (Pune) - owner - 98765-43210 - picked up a brochure, said "
            "'maybe next year, not urgent right now' - booth visitor\"\n"
            "2. \"inbound call, didn't catch full number (9876...call back needed) - Priya S. - Priya Boutique "
            "Chain, 3 stores - VERY keen, wants a demo ASAP - said a friend Meera from Meera Textiles referred her\"\n"
            "3. \"Grover Wholesale Traders - Ajay Grover, Ops Manager - card scanned at booth - no other notes\"\n"
            "4. \"walk-in - didn't give company name - said 'just browsing, comparing options' - no phone given\"\n"
            "5. \"Verma Electronics - Sanjay Verma - 9988776655 - asked detailed pricing questions, says budget "
            "approved for this quarter - booth\"\n"
            "6. \"LinkedIn msg - Bright Kids Toys - Neha (didn't get last name) - interested in demo, mentioned "
            "expanding to 2 more stores soon - no phone yet, only LinkedIn profile\"\n"
            "7. \"Sethi General Store - phone - 91234 56789 - guy said not interested, just wanted the free pen "
            "- booth\"\n"
            "8. \"inbound call - Om Sai Distributors - Rakesh - asked if we do inventory + billing both, seemed "
            "unsure if he's the decision maker, wants to 'check with partner'\"\n"
            "9. \"card: Nagpal Supermart, Anita Nagpal, 9871122334 - said current system 'is fine for now' but "
            "open to hearing more in 2-3 months - booth\"\n"
            "10. \"Metro Hardware Solutions - Vikram - no card, wrote number on napkin - 90909 80808 - very "
            "interested, said their Excel sheet caused a stock mismatch last month that cost them money\"\n"
            "11. \"duplicate? - Ramesh Kumar again, second booth visit same day, same store - re-asked same "
            "brochure question\"\n\n"
            "None of this is structured yet. Your job is to describe how you'd turn this mess into a clean, "
            "usable CRM lead list."
        ),
        "why_it_matters": "Every sales team runs on the quality of its CRM data — structuring messy raw notes into consistent, complete lead records is a foundational skill for any sales, ops, or customer-facing role at any company.",
        "instructions": (
            "Step 1: Read all 11 raw lead notes carefully.\n"
            "Step 2: In your written answer, define a fixed set of fields every lead record should capture (for "
            "example: Full Name, Company, Phone, Source, Interest Level, Notes/Follow-up date) and apply that "
            "SAME structure to describe all 11 entries — don't invent a different field set per entry.\n"
            "Step 3: Decide on a standardized Interest Level scale (e.g. Hot/Warm/Cold, or 1-5) and map each of "
            "the 11 raw notes onto it, explaining your reasoning for each one in a short line.\n"
            "Step 4: Call out every entry with missing or incomplete data (no phone, no company name, etc.) and "
            "state exactly what you'd do about each gap — never invent a value that wasn't given.\n"
            "Step 5: Identify the duplicate entry (or entries) and explain how you'd handle it so the same lead "
            "doesn't end up as two separate CRM records.\n"
            "Step 6: Write 150+ words explaining your overall data-hygiene approach — why standardizing fields "
            "and flagging incomplete/duplicate data before it enters a shared CRM matters for an entire sales team, "
            "not just for you."
        ),
        "mistake_explanation": (
            "Messy, duplicated, or inconsistently-labeled CRM entries cause real damage: two reps end up calling "
            "the same lead separately (which looks unprofessional to the prospect), a genuinely hot lead gets "
            "buried under noisy low-quality entries and goes cold before anyone follows up, and pipeline reports "
            "become inaccurate because duplicate records inflate the lead count. Clean data entry isn't busywork "
            "— it's what the entire sales team's forecasting and follow-up depends on."
        ),
        "hints": [
            "Hint 1: Start by deciding a fixed set of fields every lead record needs (Name, Company, Phone, "
            "Source, Interest Level, Notes) and apply the SAME fields to every entry, even when a raw note is "
            "missing some of them.",
            "Hint 2: Don't guess or fill in missing data (e.g. don't invent a phone number) — flag it clearly "
            "instead (\"Phone: not captured - follow up required\") so nobody downstream mistakes a guess for a "
            "verified fact.",
            "Hint 3: Look closely for note pairs that might describe the same person or company under slightly "
            "different wording — catching and merging a duplicate before it's saved is far cheaper than cleaning "
            "it up after multiple reps have already called the same lead separately.",
        ],
        "sample_solution": (
            "Worked example using different raw notes than the task above. Raw note: \"card - Singh Auto Parts, "
            "Deepak Singh, 99001-22334, said current vendor contract ends in 2 months, seemed like the "
            "decision-maker, booth.\" Structured: Name: Deepak Singh | Company: Singh Auto Parts | Phone: "
            "99001-22334 | Source: Trade Show Booth | Authority: Likely decision-maker (self-described) | "
            "Interest Level: Warm (has a clear budget trigger — contract ending — but not urgent yet) | Notes: "
            "Contract renewal in ~2 months, follow up in 4-5 weeks rather than immediately.\n\n"
            "Raw note (missing-data example): \"inbound call, no company given, asked general questions, hung up "
            "before leaving a number.\" Structured: Name: Unknown | Company: Unknown | Phone: Not captured | "
            "Source: Inbound Call | Interest Level: Cold/Unqualified — insufficient information to qualify | "
            "Notes: Flag as 'incomplete lead — do not count toward pipeline until contact info obtained'; do not "
            "fabricate any field.\n\n"
            "Overall reasoning to demonstrate: every entry gets the same field template regardless of how messy "
            "the source note was, ambiguous or missing fields are explicitly flagged rather than guessed, and "
            "anything that resembles an existing lead is checked against the list before being saved as a new "
            "record."
        ),
    },

    {
        "track": "sales", "title": "Lead Qualification", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 80, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "brief": (
            "7 lead profiles from Solstice CRM's pipeline are below, each with different levels of clarity on "
            "Budget, Authority, Need, and Timeline (BANT). Qualify each one as Hot, Warm, or Cold.\n\n"
            "Lead 1: Meera Agarwal, Operations Head at Grover Wholesale Traders (~40 employees, multi-location "
            "wholesale distributor). Inbound inquiry after seeing a LinkedIn ad. On the discovery call she said: "
            "'We've set aside about ₹2.2 lakh in this quarter's budget specifically for a software upgrade.' "
            "She's leading the evaluation but will get final sign-off from the Managing Director, who has already "
            "asked her to move fast. Their current process is entirely Excel-based, and last month a stock "
            "mismatch across two warehouses caused them to oversell to a large customer, damaging that "
            "relationship. She wants to be live before their festive season order rush, which starts in about "
            "5 weeks.\n\n"
            "Lead 2: Ajay Mehta, filled a 'download our brochure' form on the website 6 months ago, has not "
            "responded to 3 follow-up emails since. When a rep finally reached him by phone he said, 'Oh yeah, I "
            "remember downloading that, I think — not really looking into anything right now, we're happy with "
            "what we have.' No budget mentioned, no clear role given (just 'I work there'), no timeline.\n\n"
            "Lead 3: Sanjay Verma, 'Senior Manager' at Verma Electronics (single showroom + warehouse). Says he's "
            "'pushing hard' for new inventory software because they lose track of stock every festive season, "
            "and thinks he can get approval for around ₹80,000, but admits 'the final call is really my father's "
            "— he owns the business and doesn't love new expenses.' No fixed timeline, just 'sometime this year "
            "hopefully.'\n\n"
            "Lead 4: Anita Nagpal, owner of Nagpal Supermart (2 stores). She's clearly the decision maker and "
            "openly complains that her current billing software doesn't talk to her inventory at all, causing "
            "daily reconciliation headaches. When asked about budget she said, 'I don't really have a number yet, "
            "need to see what it costs first.' Timeline: 'no rush, just tired of the manual work.'\n\n"
            "Lead 5: Vikram Rathi, IT Coordinator at Rathi Wholesale Foods (large distributor, ~120 employees). "
            "Very responsive, attended a demo, and says leadership has approved a ₹2.5 lakh budget for 'a systems "
            "upgrade' this quarter — but when asked specifically what problem they're trying to solve, he was "
            "vague: 'management just said we need to modernize.' He confirmed he's not the final approver — "
            "that's the CFO, who wasn't on the call.\n\n"
            "Lead 6: Om Sai Distributors, spoke with Rakesh (title unclear). On a discovery call he said the "
            "business is 'doing fine with pen-and-paper for now' and that any software spend 'isn't something "
            "we're considering this year at all' — he was only on the call because a colleague asked him to take "
            "it out of courtesy.\n\n"
            "Lead 7: Neha Kapoor, store manager at Bright Kids Toys, currently 1 store expanding to 3 within the "
            "next 2 months per an already-signed lease. She's clearly worried about managing inventory across 3 "
            "locations manually and wants something in place before the second store opens. She's not sure of "
            "the exact budget her owner has approved, and she'll need her owner's final sign-off, but she has "
            "been proactively chasing the sales rep for updates twice a week."
        ),
        "why_it_matters": "Accurately separating real buyers from tire-kickers is what determines whether a sales team spends its limited time on deals it can actually win — this judgment call is central to any quota-carrying sales role.",
        "instructions": (
            "Step 1: For each of the 7 leads, note what you can tell about Budget, Authority, Need, and Timeline "
            "— some will be clear, some will be missing or ambiguous, and that's intentional.\n"
            "Step 2: Assign each lead a Hot, Warm, or Cold qualification.\n"
            "Step 3: For each lead, write 2-4 sentences of reasoning explaining WHICH BANT signals drove your "
            "call — don't just state the label.\n"
            "Step 4: Finish with a short overall summary (200+ words total across all 7) reflecting on which "
            "signal (Budget, Authority, Need, or Timeline) was hardest to judge across this set of leads, and why."
        ),
        "mistake_explanation": (
            "Mis-qualifying a lead in either direction wastes real time and money: marking a Cold lead as Hot "
            "means a rep spends hours chasing someone who was never going to buy, while marking a genuinely Hot "
            "lead as Cold or Warm means it sits at the bottom of the call list and a competitor closes it first. "
            "In a real sales team, qualification accuracy directly affects whether the team hits its revenue target."
        ),
        "hints": [
            "Hint 1: BANT stands for Budget, Authority, Need, Timeline — check all four for each lead "
            "individually; a lead can have a huge budget but no real need, or a real need but zero timeline, and "
            "either one changes the qualification.",
            "Hint 2: Don't just average the four signals in your head — a single clearly negative signal (e.g. "
            "'not considering this year at all') can be disqualifying even if the other three look fine, and a "
            "single ambiguous signal (e.g. 'not sure of the budget yet') doesn't automatically make a lead Cold "
            "if the other three are strong.",
            "Hint 3: Authority is often the trickiest signal — someone can be genuinely enthusiastic and still "
            "not be the person who signs off; note who actually has to say yes, and treat that as a real (but not "
            "always disqualifying) risk factor rather than ignoring it.",
        ],
        "sample_solution": (
            "Worked example using different leads than the task above. Lead: 'Rohit Malhotra, owner of Malhotra "
            "Fashion Store (1 store). Says he's been manually tracking stock for 8 years, is tired of it, has "
            "₹40,000 set aside already, and wants to start within 2 weeks before an upcoming sale event.' — "
            "Budget: confirmed and specific. Authority: he's the owner, no one else to check with. Need: "
            "explicitly stated, long-standing pain. Timeline: hard deadline (2 weeks). All four signals strong "
            "and specific → Hot.\n\n"
            "Lead: 'Sunita Rao, marketing intern at Rao Traders, filled out a contact form out of curiosity while "
            "researching for a college project, admits she has no purchasing authority and the business isn't "
            "currently looking to buy anything.' — Budget: none. Authority: explicitly none. Need: none stated. "
            "Timeline: none. All four signals absent or explicitly negative → Cold.\n\n"
            "The written answer for each lead should name which of the 4 BANT signals were strong, weak, or "
            "missing, and explain how that specific combination — not a gut feeling — led to the Hot/Warm/Cold call."
        ),
    },

    {
        "track": "sales", "title": "Cold-Call Script Writing", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 85, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-3 hours",
        "brief": (
            "Product: Solstice CRM's core offering — affordable cloud inventory + billing management software "
            "built for small-to-mid retail and wholesale businesses (1-10 locations), priced per location, no "
            "long-term contract required.\n\n"
            "Target persona for this cold call: the owner-operator of a 2-3 location retail or wholesale "
            "business. They currently track inventory in Excel or a paper register, have never used sales "
            "software before, and are busy and impatient on unsolicited calls (realistically, you have under 15 "
            "seconds to earn their attention before they hang up). They're price-sensitive, have been burned "
            "before by an overpriced software subscription they barely used, and are mildly skeptical of "
            "salespeople in general.\n\n"
            "Write a complete cold-call script for a rep calling this exact persona."
        ),
        "why_it_matters": "Structuring a cold call around a specific customer's real objections and attention span — rather than reciting a generic pitch — is the core skill behind every successful outbound sales motion, in any industry.",
        "instructions": (
            "Step 1: Write the Opener (first 10-15 seconds) — its only job is to earn the next 30 seconds, not "
            "to explain the product yet.\n"
            "Step 2: Write a one-sentence Value Proposition, phrased as an outcome for THIS persona, not a list "
            "of features.\n"
            "Step 3: Write one Qualifying Question that helps the rep understand this prospect's current setup.\n"
            "Step 4: Write at least 2 Objection-Handling lines for objections this specific persona would "
            "realistically raise (e.g. 'I don't have time for this' / 'we already manage fine on Excel' / 'we "
            "tried software like this before and it was a waste of money').\n"
            "Step 5: Write a Close that asks for one specific, low-commitment next step (e.g. booking a 15-minute "
            "demo), not a vague 'let me know if you're interested.'\n"
            "Step 6: Write 150+ words explaining WHY you structured the script this way for this specific "
            "persona — reference their attention span, price sensitivity, and past bad experience explicitly."
        ),
        "mistake_explanation": (
            "A generic, one-size-fits-all cold-call script that ignores who's actually on the other end of the "
            "phone gets hung up on in the opening line — most cold-call attempts fail in the first 10-15 seconds "
            "alone. A script that doesn't address this persona's real objections (price sensitivity, a past bad "
            "experience, limited time) wastes every single dial the sales team makes that day, and can even "
            "damage the company's reputation with prospects who feel talked at rather than listened to."
        ),
        "hints": [
            "Hint 1: The opener has exactly one job — earn the next 20-30 seconds. It should name a specific, "
            "relevant problem this persona likely has and ask permission to continue, not launch into the pitch.",
            "Hint 2: Your value proposition should be one sentence, in the customer's own language, describing "
            "the OUTCOME (e.g. 'never oversell stock you don't actually have') rather than the mechanism (e.g. "
            "'real-time inventory sync API').",
            "Hint 3: For objection-handling lines, follow this pattern: acknowledge the objection genuinely "
            "(don't argue with it), reframe it, then ask a question that moves the conversation forward — never "
            "just push past what they said.",
        ],
        "sample_solution": (
            "Worked example for a DIFFERENT product and persona — a payroll software company cold-calling small "
            "manufacturing unit owners who currently run payroll by hand.\n"
            "Opener: 'Hi, this is Arjun calling from Clearline Payroll — I know this is out of the blue, do you "
            "have 20 seconds before I explain why I'm calling?'\n"
            "Value prop: 'We help small manufacturing units like yours cut payroll processing from a full day "
            "down to about 20 minutes, and avoid the compliance mistakes that come with doing it by hand.'\n"
            "Qualifying question: 'Out of curiosity, how are you currently handling payroll for your team right "
            "now?'\n"
            "Objection ('too expensive'): 'Totally fair to ask about cost — most owners tell me that too, until "
            "they count the hours they're personally spending on it each month. Can I show you the actual math "
            "on a 10-minute call?'\n"
            "Objection ('no time right now'): 'I hear that a lot, which is exactly why I'm not asking for an "
            "hour — just 10 minutes, and if it's not useful you'll know within the first 2.'\n"
            "Close: 'Would Tuesday 11am or Wednesday 3pm work better for that 10-minute call?'\n"
            "The write-up should explain that every line is built around THIS persona's specific pain (manual, "
            "time-consuming, compliance-risk) rather than a generic pitch that could apply to any customer."
        ),
    },

    # ═══════════════════════ PHASE 2 — independent (Day 31-60) ═════════════
    {
        "track": "sales", "title": "Objection Handling", "phase": 2, "is_blindfold": False,
        "difficulty": "medium", "points_value": 90, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "brief": (
            "6 realistic objections a Solstice CRM rep has heard on recent sales calls are listed below. Write a "
            "response to each one.\n\n"
            "1. \"Your pricing is too high compared to what we're paying now.\"\n"
            "2. \"This isn't a good time for us, maybe check back next quarter.\"\n"
            "3. \"I like it, but I'll need to run this by my partner before deciding anything.\"\n"
            "4. \"We looked at a competitor too and they're cheaper for basically the same thing.\"\n"
            "5. \"We tried a software like this two years ago and it was a mess — nobody on our team actually "
            "used it.\"\n"
            "6. \"Can you just send me the pricing over email? I'll get back to you.\""
        ),
        "why_it_matters": "Handling objections well — rather than either caving or arguing — is often the exact moment a deal is won or lost, and it's a skill that transfers directly to any sales, negotiation, or client-facing role.",
        "instructions": (
            "Step 1: For each of the 6 objections, write a response the rep could actually say out loud on a "
            "call.\n"
            "Step 2: For each response, name the technique you used (for example: reframing, social proof, "
            "isolating the objection, trial close, offering a low-commitment next step) — pick a deliberate "
            "technique for each, don't reuse the exact same one for all 6.\n"
            "Step 3: For each objection, write 1-2 sentences explaining WHY that technique fits that specific "
            "objection (200+ words total across all 6).\n"
            "Step 4: In your response to objection 6 specifically, think carefully about what the prospect is "
            "actually communicating by asking for a pricing email instead of continuing the call."
        ),
        "mistake_explanation": (
            "A weak or defensive response to a common objection is often the exact moment a winnable deal is "
            "lost — most objections are not a hard 'no,' they're a request for reassurance, and a rep who "
            "responds with a mismatched approach (e.g. arguing on price when the real issue was trust) pushes "
            "the prospect toward a competitor or toward doing nothing at all."
        ),
        "hints": [
            "Hint 1: Most sales objections aren't really about what they sound like on the surface — 'send me "
            "the pricing over email' is very often a polite way of ending the call, not a genuine request; your "
            "response should try to keep the conversation live, not just comply.",
            "Hint 2: Naming the technique you're using isn't just decoration — it forces you to pick a "
            "deliberate approach instead of writing a generic reassurance that could apply to any objection.",
            "Hint 3: Never argue directly against an objection ('no, we're actually not more expensive') — "
            "acknowledge it first, then reframe with a fact, story, or question; direct disagreement makes a "
            "prospect defensive.",
        ],
        "sample_solution": (
            "Worked example for 2 different objections than the task above.\n"
            "Objection: 'Your onboarding takes too long, we need this running in a week.' Response: 'That's a "
            "completely fair concern — most of our customers say the same thing going in. What we've found is "
            "that a rushed 1-week setup usually causes more problems later than a proper 2-week one does — can I "
            "walk you through exactly what happens in each of those two weeks so you can judge for yourself if "
            "it's justified?' Technique: reframing + inviting scrutiny, rather than just promising faster service.\n\n"
            "Objection: 'I've heard mixed reviews about companies like yours online.' Response: 'That's worth "
            "taking seriously, and I'd rather you hear it from me directly than wonder about it — can I share two "
            "references, similar-sized businesses to yours, who you can call directly and ask whatever you "
            "want?' Technique: social proof + transparency, not defensiveness.\n\n"
            "Each written response should name the technique and explain, in a sentence, why that technique "
            "specifically fits that objection rather than reusing a generic reassurance."
        ),
    },

    {
        "track": "sales", "title": "Prioritize Lead List", "phase": 2, "is_blindfold": False,
        "difficulty": "hard", "points_value": 100, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False,
        "estimated_duration": "2.5-3.5 hours",
        "brief": (
            "16 leads currently sitting in Solstice CRM's pipeline are listed in the spreadsheet below, with 5 "
            "raw signals for each: Deal Size, Email Opens (out of the last 5 emails sent), Meeting Attended "
            "(1=Yes, 0=No), a Responsiveness Rating (0-10, based on how quickly and consistently the lead "
            "replies), and Days Since Last Contact. You need to score and rank all 16 using a weighted scoring "
            "model, then decide which 5 to call first."
        ),
        "why_it_matters": "Sales reps never have time to call every lead with equal urgency — building a repeatable, defensible scoring model to decide who gets called first (instead of just going by gut feeling) is exactly what separates a systematic sales process from a chaotic one.",
        "instructions": (
            "Step 1: In column G, calculate each lead's Priority Score (0-10 scale) using this exact weighted "
            "formula: G = 0.35*MIN(10, DealSize/20000) + 0.15*(EmailOpens*2) + 0.20*(MeetingAttended*10) + "
            "0.15*Responsiveness + 0.15*MAX(0, 10-DaysSinceLastContact). For example, G2 = "
            "0.35*MIN(10,B2/20000) + 0.15*(C2*2) + 0.20*(D2*10) + 0.15*E2 + 0.15*MAX(0,10-F2).\n"
            "Step 2: Apply the same formula to all 16 rows.\n"
            "Step 3: Sort/identify the 5 leads with the highest Priority Score.\n"
            "Step 4: In the text box, name your top 5 leads in order and write 150+ words explaining why this "
            "scoring model prioritizes them the way it does — call out at least one lead whose score surprised "
            "you (e.g. a large deal that scored lower than expected because of weak engagement, or a small deal "
            "that scored high because it's fast-moving) and explain why."
        ),
        "mistake_explanation": (
            "Prioritizing leads purely by deal size (ignoring engagement and recency) means reps waste time "
            "chasing large deals that have gone cold, while a smaller but highly-engaged, ready-to-close lead "
            "sits ignored and eventually goes to a competitor who called first. A scoring model that gets the "
            "weighting wrong doesn't just produce a slightly different order — it can mean the sales team misses "
            "its easiest wins of the month."
        ),
        "hints": [
            "Hint 1: Deal Size Score caps at 10 — a ₹250,000 deal (250000/20000 = 12.5) does not score higher "
            "than a ₹200,000 deal (200000/20000 = 10); both cap at 10. Forgetting the cap over-rewards very large "
            "deals.",
            "Hint 2: Recency Score cannot go negative — MAX(0, 10-Days) means any lead untouched for 10+ days "
            "scores exactly 0 on that component, not a negative number that would drag the total below what a "
            "lead with zero engagement elsewhere would score.",
            "Hint 3: Once you have all 16 scores, don't just eyeball the top 5 — actually sort or compare them "
            "carefully, since a couple of scores in this dataset are close enough that a careless read could "
            "swap the ranking.",
        ],
        "sample_solution": (
            "Worked example using 3 different leads than the task above, same formula. Lead X: Deal Size "
            "₹100,000, Email Opens 5/5, Meeting Attended 1, Responsiveness 9, Days Since Contact 1. Deal Score = "
            "MIN(10,100000/20000)=5, so 0.35*5=1.75. Email: 0.15*(5*2)=1.5. Meeting: 0.20*(1*10)=2.0. "
            "Responsiveness: 0.15*9=1.35. Recency: 0.15*MAX(0,10-1)=0.15*9=1.35. Total = "
            "1.75+1.5+2.0+1.35+1.35 = 8.0 (very high — strong across every signal).\n"
            "Lead Y: Deal Size ₹300,000 (huge), but Email Opens 0, Meeting 0, Responsiveness 1, Days Since "
            "Contact 45. Deal Score = MIN(10,300000/20000)=MIN(10,15)=10, so 0.35*10=3.5. Email: 0.15*0=0. "
            "Meeting: 0.20*0=0. Responsiveness: 0.15*1=0.15. Recency: 0.15*MAX(0,10-45)=0.15*0=0. Total = "
            "3.5+0+0+0.15+0 = 3.65 (surprisingly low, despite the huge deal size, because every engagement "
            "signal is dead).\n"
            "The written explanation should make exactly this kind of point: a big deal with no real engagement "
            "can score below a modest deal that's actively moving, and that's the model working correctly, not a "
            "flaw in it."
        ),
        "spreadsheet_template": _SALES_TASK5_TEMPLATE, "spreadsheet_answer_key": _SALES_TASK5_ANSWER_KEY,
    },

    {
        "track": "sales", "title": "Pipeline Analysis", "phase": 2, "is_blindfold": False,
        "difficulty": "hard", "points_value": 100, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False,
        "estimated_duration": "2.5-3.5 hours",
        "brief": (
            "Solstice CRM's current sales pipeline snapshot (14 deals) is in the spreadsheet below, along with "
            "last quarter's stage-by-stage funnel counts (how many deals reached each stage). Each pipeline "
            "stage has a standard win probability used company-wide: Prospecting 10%, Qualified 25%, Demo "
            "Scheduled 40%, Proposal Sent 60%, Negotiation 80%, Closed Won 100%, Closed Lost 0%. Calculate the "
            "pipeline's health metrics and identify where deals are getting stuck."
        ),
        "why_it_matters": "Reading a raw pipeline snapshot and turning it into conversion rates, weighted forecasts, and bottleneck flags is exactly what sales managers and RevOps analysts do every week to know whether a team will hit its number.",
        "instructions": (
            "Step 1: In column F, calculate each deal's Weighted Value = Deal Value x (Win Probability % / 100). "
            "For example, F2 = C2*E2/100.\n"
            "Step 2: In B18, calculate Total Open Pipeline Value = SUM of Deal Value (column C) for every row "
            "EXCEPT Closed Won and Closed Lost.\n"
            "Step 3: In B19, calculate Total Weighted Pipeline Value = SUM of Weighted Value (column F) for the "
            "same open-deal rows only.\n"
            "Step 4: In B20, calculate Average Days in Stage = AVERAGE of Days in Current Stage (column D) for "
            "the same open-deal rows only.\n"
            "Step 5: In B31-B35, calculate each Stage Conversion Rate using the funnel counts given in rows "
            "23-28: (count that reached the NEXT stage / count that reached the CURRENT stage) x 100. For "
            "example, B31 = B24/B23*100.\n"
            "Step 6: In the text box, write 200+ words identifying which deal(s) in the open pipeline look "
            "stalled (unusually long Days in Current Stage for their stage) and which stage-to-stage conversion "
            "rate is the weakest link — then recommend one concrete action for each bottleneck you flag."
        ),
        "mistake_explanation": (
            "Including already-closed deals in an 'open pipeline' total, or getting a stage conversion rate "
            "backwards, doesn't just produce a slightly-off number — it directly misleads whoever uses that "
            "number to forecast revenue or decide where to focus coaching effort. A sales manager who trusts a "
            "wrong pipeline number can walk into a leadership meeting promising revenue that was never really "
            "there, or miss a stage that's quietly bleeding deals."
        ),
        "hints": [
            "Hint 1: 'Open pipeline' means deals still in progress — Closed Won and Closed Lost deals are "
            "already decided and should be excluded from every open-pipeline total (value, weighted value, and "
            "average days in stage).",
            "Hint 2: A stage conversion rate is always (count that reached the NEXT stage) divided by (count "
            "that reached the CURRENT stage) — not the other way around, and not divided by the total number of "
            "leads overall.",
            "Hint 3: A 'stalled' deal isn't just one with a lot of days in its stage in absolute terms — compare "
            "it to how long deals typically sit in that particular stage; a deal sitting far longer than that "
            "stage's normal pace is the real bottleneck signal.",
        ],
        "sample_solution": (
            "Worked example with 3 different deals and a different funnel than the task above. Deals: Deal A — "
            "Qualified, ₹80,000, 6 days, 25% win probability → Weighted Value = 80000*0.25 = 20,000. Deal B — "
            "Negotiation, ₹150,000, 3 days, 80% → Weighted Value = 150000*0.80 = 120,000. Deal C — Closed Won, "
            "₹60,000, 0 days, 100% → excluded from open totals. Open Pipeline Value = 80,000+150,000 = 230,000. "
            "Open Weighted Pipeline Value = 20,000+120,000 = 140,000. Average Days in Stage (open only) = "
            "(6+3)/2 = 4.5.\n"
            "Funnel: Qualified 40 deals entered, Negotiation only 10 reached it. Conversion Qualified → "
            "Negotiation-adjacent stage = 10/40*100 = 25% — a weak link worth flagging, since 75% of qualified "
            "deals never make it that far.\n"
            "The written answer should tie a specific stalled deal (e.g. Deal A sitting in Qualified for 6 days "
            "when most Qualified deals move in 3-4) to a specific low conversion rate, and recommend something "
            "concrete — e.g. a scripted follow-up cadence for deals stuck in Qualified past day 5."
        ),
        "spreadsheet_template": _SALES_TASK6_TEMPLATE, "spreadsheet_answer_key": _SALES_TASK6_ANSWER_KEY,
    },

    # ═══════════════════════ PHASE 3 — capstone (Day 61-90) ═════════════════
    {
        "track": "sales", "title": "Sales Proposal Writing", "phase": 3, "is_blindfold": False,
        "difficulty": "hard", "points_value": 115, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2.5-3 hours",
        "brief": (
            "Client: Kapoor Furnishings, a furniture retailer with 3 showrooms, owner Rajeev Kapoor. Stated "
            "needs and constraints from the discovery call:\n"
            "- Currently tracks inventory separately per showroom in Excel; stock has been oversold twice this "
            "year because the showrooms can't see each other's numbers.\n"
            "- Staff are not technical — whatever is proposed needs to be simple enough for showroom floor staff "
            "to use daily, not just head office.\n"
            "- Budget ceiling: ₹1,50,000 per year, stated firmly by Rajeev.\n"
            "- Wants to decide within 3 weeks — a 4th showroom opens next quarter and he wants this sorted "
            "before then.\n"
            "- Actively comparing Solstice CRM against a cheaper competitor, 'QuickStock Basic', priced at "
            "₹60,000/year — but QuickStock Basic only supports single-location inventory with no multi-location "
            "sync, which does not solve Kapoor Furnishings' actual overselling problem.\n"
            "- Solstice CRM's standard multi-location plan (3 locations) list-prices at ₹4,300/location/month, "
            "which comes to ₹1,54,800/year — ₹4,800 OVER Rajeev's stated budget."
        ),
        "why_it_matters": "Turning a client's specific stated needs, budget, and objections into a proposal that directly answers each one (rather than a generic pitch deck) is what actually wins deals — and what loses them when done poorly.",
        "instructions": (
            "Step 1: Write a Solution Summary explaining specifically how Solstice CRM solves Kapoor Furnishings' "
            "stated problem (multi-location stock visibility, ease of use for non-technical staff) — not a "
            "generic feature list.\n"
            "Step 2: Write a Pricing section. The list price (₹1,54,800/year) is above Rajeev's stated "
            "₹1,50,000 budget — decide how you'd address that gap (for example, an annual-prepay discount, a "
            "phased rollout that adds the 4th showroom later at a locked-in rate, or another justified approach) "
            "and state the final number clearly.\n"
            "Step 3: Write Terms — contract length, payment schedule, and anything relevant to reducing Rajeev's "
            "risk of committing (e.g. no long-term lock-in).\n"
            "Step 4: Write Next Steps — concrete, dated actions tied to his 3-week decision window and the "
            "upcoming 4th showroom.\n"
            "Step 5: Write 150+ words explaining how your proposal specifically addresses (a) the QuickStock "
            "Basic price comparison, and (b) the fact that his staff are non-technical — don't just say the "
            "proposal 'addresses these', explain exactly how."
        ),
        "mistake_explanation": (
            "A proposal that ignores the client's stated budget ceiling, or fails to explain why a more "
            "expensive option is worth it compared to a cheaper competitor, is one of the most common reasons a "
            "winnable deal is lost — the prospect doesn't reject the product, they reject a proposal that didn't "
            "actually engage with their real concerns. A generic proposal template sent to every client, without "
            "addressing their specific numbers and objections by name, reads as lazy and gets ignored."
        ),
        "hints": [
            "Hint 1: Don't just quote the list price and hope Rajeev accepts going over budget — actively "
            "propose a specific way to close the ₹4,800 gap (a discount, a phased plan, etc.) so the number in "
            "your proposal matches or beats his stated ceiling.",
            "Hint 2: When addressing the QuickStock Basic comparison, don't just say 'we're better' — name the "
            "specific gap (no multi-location sync) and tie it directly back to the overselling problem Rajeev "
            "described, since that's the actual reason a cheaper single-location tool won't solve his problem.",
            "Hint 3: For non-technical staff, be specific about what 'simple' actually means in your proposal "
            "(e.g. training time, interface simplicity, support availability) rather than just asserting the "
            "product is 'easy to use.'",
        ],
        "sample_solution": (
            "Worked example for a different client than the task above. Client: a 2-location bakery chain, "
            "budget ₹80,000/year, comparing against a free spreadsheet-based tracker, decision needed in 2 "
            "weeks before a big holiday order season.\n"
            "Solution Summary: 'Solstice CRM replaces your manual spreadsheet with automatic stock sync between "
            "both locations, so an order at Location A instantly reflects in Location B's available stock — no "
            "more overselling around your busiest season.'\n"
            "Pricing: List price for 2 locations is ₹86,000/year; offering a first-year 8% early-decision "
            "discount brings it to ₹79,120/year, under budget.\n"
            "Terms: Month-to-month after the first year, no cancellation fee, payment can be split quarterly.\n"
            "Next Steps: 'A 20-minute setup call this week, live in both locations within 5 business days — "
            "comfortably before your holiday order season starts.'\n"
            "Reasoning write-up: should explicitly connect the discount to the stated budget ceiling, and "
            "explicitly contrast the free spreadsheet's lack of real-time sync against the client's stated "
            "overselling risk — not just assert the paid tool is 'worth it.'"
        ),
    },

    # Grand Finale / Blindfold — no hints, no sample solution, done fully
    # independently. See backend/internship_routes.py's is_blindfold handling.
    {
        "track": "sales", "title": "Go-to-Market Strategy", "phase": 3, "is_blindfold": True,
        "difficulty": "hard", "points_value": 130, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "3-4 hours",
        "brief": (
            "Solstice CRM is launching a new add-on product: 'Solstice Insights' — an AI-powered demand "
            "forecasting module that predicts how much stock a retailer should order per SKU, per location, "
            "ahead of each season, to reduce both overstock and stockouts.\n\n"
            "Target market context: mid-size retail chains with 10-50 stores, who currently forecast demand by "
            "gut feel or basic spreadsheets, and who lose real money every season to either overstock "
            "(discounted/wasted inventory) or understock (missed sales). Solstice CRM already has ~200 existing "
            "customers, but most of them are smaller (1-9 stores) — the 10-50 store segment is mostly net-new "
            "for the company.\n\n"
            "Competitive landscape:\n"
            "- ForecastIQ: enterprise-focused, ₹8,00,000+/year, complex 3-month implementation, targets large "
            "national chains (100+ stores).\n"
            "- SimpleStock AI: cheap (~₹50,000/year), fast to set up, but retailers who've used it report it's "
            "frequently inaccurate and many have quietly stopped relying on it after a season or two.\n\n"
            "Company goal: reach ₹50 lakh in first-year ARR (annual recurring revenue) from Solstice Insights.\n\n"
            "Write a complete go-to-market strategy for this launch."
        ),
        "why_it_matters": "Designing a full go-to-market plan — who to target, how to position against existing alternatives, how to price, how to actually reach buyers, and how to sequence the first 90 days — is capstone-level strategic thinking that sits above individual sales skills and applies to launching any product at any company.",
        "instructions": (
            "Step 1: Define the target segment precisely — within '10-50 store retail chains', which specific "
            "type of retailer should Solstice Insights go after first, and why (consider Solstice CRM's existing "
            "customer relationships, and where the gap between ForecastIQ and SimpleStock AI actually is).\n"
            "Step 2: Write a positioning statement — how Solstice Insights should be described relative to both "
            "ForecastIQ (too expensive/complex) and SimpleStock AI (too inaccurate/untrusted).\n"
            "Step 3: Propose a pricing approach (structure and rough numbers) that fits this segment and "
            "supports the ₹50 lakh first-year ARR goal — show your reasoning on how the number of customers "
            "needed relates to your price point.\n"
            "Step 4: Define the primary sales channel/motion — for example, cross-selling to Solstice CRM's "
            "existing customer base vs. new outbound prospecting vs. inbound content, and justify which should "
            "be the PRIMARY motion for the first 90 days specifically.\n"
            "Step 5: Write a 90-day rollout plan broken into roughly 3 phases (Day 1-30, Day 31-60, Day 61-90), "
            "each with concrete milestones.\n"
            "Step 6: Write a final synthesis section (300+ words) explaining how your strategy uses lead "
            "qualification, objection handling, proposal, and pipeline-thinking skills together — this is the "
            "capstone task of the Sales track, so your answer should show you can combine everything from "
            "earlier in the internship, not just answer each step in isolation."
        ),
        "mistake_explanation": (
            "A go-to-market strategy that picks the wrong initial segment, prices without connecting to the "
            "revenue goal, or spreads effort evenly across every possible channel instead of committing to a "
            "primary motion, is how real product launches quietly fail — not with an obvious catastrophe, but by "
            "burning the first 90 days (the period when the sales team has the most focus and momentum) on the "
            "wrong target market or a channel that never had a real chance of hitting the revenue number."
        ),
    },

    # Interactive tool task — a real Kanban pipeline UI, entirely fictional
    # leads (invented businesses, not real people, not TFD's own pipeline).
    # deliverable_type stays "text": the tool composes a summary into the
    # student's answer, graded by the same AI text grader as every other
    # Sales task — no separate grading path.
    {
        "track": "sales", "title": "Run Your First Sales Pipeline", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 90, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "interactive_tool": "kanban_crm",
        "tool_seed_data": {
            "company": "Solstice CRM",
            "stages": ["New Lead", "Contacted", "Demo Scheduled", "Deal Won", "Deal Lost"],
            "leads": [
                {"id": "l1", "name": "Rajesh Malhotra", "business": "Malhotra Auto Showroom, Bhopal",
                 "note": "Visited the trade show booth, interested in inventory tracking for spare parts."},
                {"id": "l2", "name": "Kavita Rathi", "business": "Sunrise Jewellers, Sehore",
                 "note": "Inbound call — wants a billing software demo covering 2 store locations."},
                {"id": "l3", "name": "Vikram Oberoi", "business": "Metro Textiles Wholesale, Indore",
                 "note": "LinkedIn inquiry — budget confirmed for this quarter, evaluating 2 vendors."},
                {"id": "l4", "name": "Anita Sharma", "business": "Om Sai Distributors, Bhopal",
                 "note": "Referral from an existing client — no urgency mentioned yet."},
                {"id": "l5", "name": "Suresh Yadav", "business": "Green Leaf Grocers, Sehore",
                 "note": "Cold outreach response — price-sensitive, actively comparing 2 vendors."},
            ],
        },
        "brief": (
            "You're a Business Development Executive at Solstice CRM (fictional — cloud inventory + billing "
            "software for small/mid retail businesses). 5 leads are loaded into your pipeline board below. Work "
            "each one through the stages — New Lead, Contacted, Demo Scheduled, Deal Won, or Deal Lost — adding a "
            "short note each time you move a card explaining why, based on what you know about that lead."
        ),
        "why_it_matters": (
            "Moving a deal through pipeline stages with a clear reason at each step — not just clicking a card "
            "forward — is literally what every CRM (Salesforce, HubSpot, Zoho) is built around, and it's the "
            "single habit that separates an organized rep's pipeline from a messy one."
        ),
        "instructions": (
            "Step 1: Open each of the 5 leads and read their note carefully.\n"
            "Step 2: Move each card to the stage that reflects where you'd realistically put it right now given "
            "only the information provided — don't jump straight to 'Deal Won' without a reason.\n"
            "Step 3: For every move, write a one-line reason (e.g. 'Moved to Demo Scheduled — budget already "
            "confirmed, just needs to see the product').\n"
            "Step 4: In the answer box below, write 150+ words on your overall pipeline strategy — which lead "
            "you'd prioritize calling first and why, which one needs more qualification before it can move "
            "forward, and how you'd handle the price-sensitive lead differently from the budget-confirmed one."
        ),
        "hints": [
            "Hint 1: A lead with a confirmed budget and clear urgency (like a contract renewal or approved "
            "spend) should move faster through your pipeline than one that's still just 'interested.'",
            "Hint 2: 'Comparing 2 vendors' isn't a reason to give up on a lead — it's a reason to move fast and "
            "differentiate, not a reason to leave it sitting in 'New Lead.'",
            "Hint 3: Not every lead needs to end at 'Deal Won' in your answer — a realistic pipeline has leads at "
            "different stages, and honestly assessing which ones aren't ready yet is as valuable as closing.",
        ],
        "sample_solution": (
            "Worked example with a different lead: 'Inbound call, mentioned their current Excel-based tracking "
            "caused a stock mismatch that cost them money last month.' This is a strong signal — a specific, "
            "recent, costly pain point — so this lead moves to 'Contacted' immediately with a note like 'Has a "
            "clear, recent pain point (stock mismatch loss) — prioritize this call, lead with how we prevent "
            "exactly that problem.' The written strategy should explain WHY that pain point makes this lead "
            "worth prioritizing over a vaguer 'just browsing' inquiry, not just restate the note."
        ),
    },
]


# ════════════════════════════════════════════════════════════════════
# HR (8) — 90-day phase-based curated pool, mirrors Finance
# ════════════════════════════════════════════════════════════════════
# ── Task 6 ("Attendance Analysis") spreadsheet build ──────────────────────
# Northstar BPO Services, Customer Support department, 3 employees, 10
# scheduled working days each (two Mon-Fri weeks in June) = 30 data rows.
# Status is one of Present / Late / Absent (Late = clocked in after the
# 9:45 AM grace cutoff for a 9:30 AM shift start).
_ATT_ROWS = [
    # Priya Nair — reliable, 1 late day, 0 absences
    ("Priya Nair", "02-Jun", "Present", "9:28 AM", "6:32 PM"),
    ("Priya Nair", "03-Jun", "Present", "9:31 AM", "6:30 PM"),
    ("Priya Nair", "04-Jun", "Present", "9:25 AM", "6:35 PM"),
    ("Priya Nair", "05-Jun", "Late", "10:05 AM", "6:30 PM"),
    ("Priya Nair", "06-Jun", "Present", "9:30 AM", "6:30 PM"),
    ("Priya Nair", "09-Jun", "Present", "9:29 AM", "6:31 PM"),
    ("Priya Nair", "10-Jun", "Present", "9:33 AM", "6:30 PM"),
    ("Priya Nair", "11-Jun", "Present", "9:27 AM", "6:33 PM"),
    ("Priya Nair", "12-Jun", "Present", "9:30 AM", "6:30 PM"),
    ("Priya Nair", "13-Jun", "Present", "9:31 AM", "6:29 PM"),
    # Rohan Mehta — chronic lateness + 2 absences
    ("Rohan Mehta", "02-Jun", "Late", "10:10 AM", "6:30 PM"),
    ("Rohan Mehta", "03-Jun", "Late", "9:50 AM", "6:30 PM"),
    ("Rohan Mehta", "04-Jun", "Present", "9:35 AM", "6:30 PM"),
    ("Rohan Mehta", "05-Jun", "Absent", "-", "-"),
    ("Rohan Mehta", "06-Jun", "Late", "10:00 AM", "6:25 PM"),
    ("Rohan Mehta", "09-Jun", "Present", "9:40 AM", "6:30 PM"),
    ("Rohan Mehta", "10-Jun", "Late", "9:55 AM", "6:30 PM"),
    ("Rohan Mehta", "11-Jun", "Present", "9:32 AM", "6:30 PM"),
    ("Rohan Mehta", "12-Jun", "Late", "10:15 AM", "6:20 PM"),
    ("Rohan Mehta", "13-Jun", "Absent", "-", "-"),
    # Kavita Joshi — mostly present, moderate lateness, 1 absence
    ("Kavita Joshi", "02-Jun", "Present", "9:29 AM", "6:30 PM"),
    ("Kavita Joshi", "03-Jun", "Present", "9:31 AM", "6:30 PM"),
    ("Kavita Joshi", "04-Jun", "Late", "9:52 AM", "6:30 PM"),
    ("Kavita Joshi", "05-Jun", "Present", "9:28 AM", "6:32 PM"),
    ("Kavita Joshi", "06-Jun", "Absent", "-", "-"),
    ("Kavita Joshi", "09-Jun", "Late", "10:02 AM", "6:30 PM"),
    ("Kavita Joshi", "10-Jun", "Present", "9:30 AM", "6:30 PM"),
    ("Kavita Joshi", "11-Jun", "Present", "9:33 AM", "6:29 PM"),
    ("Kavita Joshi", "12-Jun", "Present", "9:29 AM", "6:31 PM"),
    ("Kavita Joshi", "13-Jun", "Late", "9:47 AM", "6:30 PM"),
]

_ATT_PREFILLED = {
    "A1": "Employee", "B1": "Date", "C1": "Status", "D1": "In-Time", "E1": "Out-Time",
    "F1": "Late Flag (1/0)", "G1": "Worked Flag (1/0)",
}
_ATT_LOCKED = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"]
for _i, (_emp, _date, _status, _in, _out) in enumerate(_ATT_ROWS):
    _r = _i + 2
    _ATT_PREFILLED.update({f"A{_r}": _emp, f"B{_r}": _date, f"C{_r}": _status, f"D{_r}": _in, f"E{_r}": _out})
    _ATT_LOCKED += [f"A{_r}", f"B{_r}", f"C{_r}", f"D{_r}", f"E{_r}"]
_ATT_PREFILLED.update({
    "A33": "SUMMARY (10 scheduled working days per employee)",
    "A34": "Employee", "B34": "Days Present (incl. Late)", "C34": "Late Count",
    "D34": "Attendance %", "E34": "Flag (1 if Attendance % < 85)",
    "A35": "Priya Nair", "A36": "Rohan Mehta", "A37": "Kavita Joshi",
    "A39": "Department Average Attendance %",
})
_ATT_LOCKED += ["A33", "A34", "B34", "C34", "D34", "E34", "A35", "A36", "A37", "A39"]
_HR_TASK6_TEMPLATE = _grid(
    39, 7,
    ["Employee", "Date", "Status", "In-Time", "Out-Time", "Late Flag (1/0)", "Worked Flag (1/0)"],
    _ATT_PREFILLED, _ATT_LOCKED,
)

# Arithmetic check (by hand, since this feeds real automated grading):
#   Priya Nair  (rows 2-11):  statuses = P,P,P,Late,P,P,P,P,P,P
#     -> Late count = 1 (row 5).  Worked (Present+Late) = 10 of 10.
#     -> Attendance % = 10/10*100 = 100.  Flag = 0 (100 is not < 85).
#   Rohan Mehta (rows 12-21): statuses = Late,Late,P,Absent,Late,P,Late,P,Late,Absent
#     -> Late count = 5 (rows 12,13,16,18,20).  Present(non-late) = 3 (rows 14,17,19).
#     -> Worked = 5+3 = 8 of 10.  Attendance % = 8/10*100 = 80.  Flag = 1 (80 < 85).
#   Kavita Joshi (rows 22-31): statuses = P,P,Late,P,Absent,Late,P,P,P,Late
#     -> Late count = 3 (rows 24,27,31).  Present(non-late) = 6 (rows 22,23,25,28,29,30).
#     -> Worked = 3+6 = 9 of 10.  Attendance % = 9/10*100 = 90.  Flag = 0 (90 is not < 85).
#   Department average attendance % = AVERAGE(100, 80, 90) = 270/3 = 90.
_HR_TASK6_ANSWER_KEY = {
    "cells": {
        "B35": {"expected": 10, "tolerance": 0.5}, "C35": {"expected": 1, "tolerance": 0.5},
        "D35": {"expected": 100, "tolerance": 0.5}, "E35": {"expected": 0, "tolerance": 0.5},
        "B36": {"expected": 8, "tolerance": 0.5}, "C36": {"expected": 5, "tolerance": 0.5},
        "D36": {"expected": 80, "tolerance": 0.5},
        "E36": {"expected": 1, "tolerance": 0.5,
                "mistake_note": "Rohan Mehta's attendance is 80% — below the 85% threshold — so this should be "
                                 "flagged. Missing this flag means a genuine attendance problem goes unnoticed until "
                                 "it's already hurt team coverage and morale."},
        "B37": {"expected": 9, "tolerance": 0.5}, "C37": {"expected": 3, "tolerance": 0.5},
        "D37": {"expected": 90, "tolerance": 0.5}, "E37": {"expected": 0, "tolerance": 0.5},
        "B39": {"expected": 90, "tolerance": 0.5},
    },
}

HR_TASKS = [
    # ═══════════════════════ PHASE 1 — guided (Day 1-30) ═══════════════════
    {
        "track": "hr", "title": "Resume Shortlisting", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 85, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "brief": (
            "Meridian Textiles Ltd (a mid-sized fictional textile manufacturer based out of Sehore) is hiring a "
            "Junior Accountant for its Finance department — entry-to-mid level, salary budget ₹18,000-₹22,000/month, "
            "must be comfortable with Tally and basic GST work, immediate joiner preferred. You've been handed 9 "
            "resumes as a first screening pass. Your job is to shortlist 3-4 to move forward to interview.\n\n"
            "1. Ankit Verma — B.Com (2023). 0 years experience, fresh graduate. Knows MS Excel (basic) and Tally "
            "ERP9 (self-taught, no certification, no work history yet). Based in Sehore.\n"
            "2. Priyanka Sharma — B.Com (2019). 4 years experience, currently Senior Accountant at a manufacturing "
            "firm, expert in Tally Prime, GST filing, and MIS reporting. Currently earning ₹35,000/month. Based in "
            "Indore.\n"
            "3. Rahul Kushwaha — B.A. Economics (2022). 1 year experience as a Sales Executive (not accounting). "
            "Knows basic Excel only. Applied because he \"wants to switch fields into accounts.\" No accounting "
            "software experience.\n"
            "4. Sneha Patil — B.Com (2021). 2 years experience as Junior Accountant at a trading company. Working "
            "knowledge of Tally ERP9 and GST returns. Immediate joiner. Based in Sehore. Expects ₹20,000/month.\n"
            "5. Deepak Malviya — M.Com (2020). 3 years experience but has changed 4 jobs in 3 years (average ~9 "
            "months per job), each role titled \"Accountant,\" reason for leaving listed each time as \"better "
            "opportunity.\" Knows Tally, Busy, and Excel.\n"
            "6. Kavya Reddy — B.Com (2022). 1.5 years experience as Accounts Assistant at a textile trading firm "
            "(same industry as Meridian). Knows Tally ERP9, basic GST, and has completed a certificate course in "
            "Advanced Excel. Based in Bhopal (~45 km away). Expects ₹19,000/month.\n"
            "7. Mohammed Irfan — B.Com (2018). 6 years experience, most recently as Accounts Manager handling a "
            "team of 3. Expects ₹45,000/month. Applied despite being well above this role's level.\n"
            "8. Neha Joshi — B.Com (2020). 2-year employment gap (2021-2023, listed as \"career break\"); before "
            "that, 1 year as an Accounts Trainee. Knows basic Tally. Based in Sehore. Flexible on salary.\n"
            "9. Sanjay Rathore — 12th pass, no degree. 5 years experience as a \"Store Accountant\" at a small "
            "kirana wholesale business. Self-taught in Tally, says he's \"familiar\" with GST filing but has no "
            "formal experience filing it. Expects ₹18,000/month."
        ),
        "why_it_matters": (
            "Screening resumes against a role's real requirements (not just keyword-matching) is the first skill "
            "any recruiter or hiring manager builds, and it applies to hiring for any role at any company."
        ),
        "instructions": (
            "Step 1: Re-read the role's actual requirements — budget, must-have skills, seniority level, and "
            "location/joining constraints.\n"
            "Step 2: Go through all 9 resumes one at a time. For each, write one line: shortlist or reject, and why "
            "— tie your reason back to a specific requirement, not a vague impression.\n"
            "Step 3: From your notes, pick your final 3-4 candidates to move to interview.\n"
            "Step 4: Write 150+ words explaining your final shortlist as a whole — why these 3-4 together give the "
            "hiring manager a good set of options, and what risk (if any) you'd flag about each one even though you "
            "shortlisted them."
        ),
        "mistake_explanation": (
            "A resume shortlist that ignores salary-expectation mismatches or job-hopping patterns wastes everyone's "
            "time — interviewing a candidate who will reject the offer over salary, or hiring someone who leaves in "
            "9 months, costs a real company weeks of re-hiring effort and lost productivity, not just an awkward "
            "conversation."
        ),
        "hints": [
            "Hint 1: A resume can look strong on paper and still be a bad shortlist choice — check salary "
            "expectation against the budget before anything else. A candidate earning far more than the budget "
            "rarely accepts the offer even if they interview well.",
            "Hint 2: Relevant industry experience (same domain, e.g. textiles) and geographic fit (can actually join "
            "without relocating) matter as much as raw years of experience for a junior role.",
            "Hint 3: A pattern (like four jobs in three years, or claiming a skill without ever having done it "
            "formally) is worth flagging even if the candidate is otherwise decent — note the risk, don't just "
            "silently reject or silently ignore it.",
        ],
        "sample_solution": (
            "Worked example for a different role (Warehouse Supervisor at a logistics company, budget ₹25,000-"
            "₹28,000/month): Candidate X has exactly the required 3 years of warehouse experience, expects "
            "₹26,000/month, and lives 10 minutes from the site — shortlist, strong fit on every axis. Candidate Y "
            "has 8 years experience and expects ₹40,000/month — reject, over-budget and likely to leave quickly if "
            "hired at a lower offer out of desperation. Candidate Z has zero warehouse experience but strong general "
            "operations experience and is willing to start at the bottom of the budget band — shortlist as a "
            "calculated bet, but flag the ramp-up risk to the hiring manager explicitly rather than hiding it. The "
            "written summary should name the trade-off for each shortlisted candidate, not just declare them "
            "\"good.\""
        ),
    },
    {
        "track": "hr", "title": "Job Description Writing", "phase": 1, "is_blindfold": False,
        "difficulty": "easy", "points_value": 70, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "1.5-2 hours",
        "brief": (
            "Bright Retail Traders (a fictional regional retail chain expanding its online presence) needs to hire "
            "a Digital Marketing Executive for its Marketing department. Hiring details given to you: mid-level "
            "role (2-4 years experience), reports to the Marketing Manager, monthly budget ₹25,000-₹32,000, "
            "primary responsibilities will be running paid Instagram/Facebook ad campaigns, managing the company's "
            "social pages day-to-day, and producing basic monthly performance reports. Write the complete Job "
            "Description (JD) that will be posted publicly."
        ),
        "why_it_matters": (
            "Writing a clear, accurately-scoped JD is one of the highest-leverage HR documents — a vague or "
            "over-inflated JD is the single biggest cause of mismatched hires, and this exact skill transfers to "
            "hiring for any role at any company."
        ),
        "instructions": (
            "Step 1: Write a Job Title that matches the actual seniority and budget (don't inflate the title beyond "
            "what a ₹25,000-₹32,000/month role can justify).\n"
            "Step 2: Write a 2-3 line \"About the Role\" summary.\n"
            "Step 3: List 5-7 Responsibilities as concrete, specific bullet points (not vague phrases like \"manage "
            "marketing\").\n"
            "Step 4: List Requirements (must-haves — years of experience, specific skills, tools) separately from "
            "Nice-to-haves (things that would help but aren't dealbreakers).\n"
            "Step 5: Add the salary range and any other practical details (location, reporting line).\n"
            "Step 6: Write a 150+ word reasoning note explaining why you framed the responsibilities and "
            "requirements the way you did — in particular, justify what you put in \"must-have\" vs \"nice-to-have\" "
            "and why, given the stated budget."
        ),
        "mistake_explanation": (
            "A JD that overstates the role (senior-sounding title, a long must-have list that doesn't match the "
            "budget) attracts candidates who will reject the offer or quit within months once they realize the "
            "actual scope and pay — that mismatch is one of the most expensive, avoidable causes of early attrition "
            "a company faces."
        ),
        "hints": [
            "Hint 1: Match the title to the budget, not to how important the role feels — \"Digital Marketing "
            "Executive,\" not \"Digital Marketing Manager,\" for this pay band.",
            "Hint 2: Keep the must-have list short and realistic for someone earning ₹25,000-₹32,000/month — "
            "demanding 5+ years of experience or advanced certifications here will filter out exactly the "
            "candidates this budget can actually attract.",
            "Hint 3: Nice-to-haves are for genuinely optional extras (e.g. \"experience with a specific design "
            "tool\") — don't quietly hide a real requirement there just to keep the must-have list short.",
        ],
        "sample_solution": (
            "Worked example for a different hiring need (Front Desk Executive, budget ₹15,000-₹18,000/month, at a "
            "small clinic): Title — \"Front Desk Executive.\" About the Role — first point of contact for patients, "
            "manages appointment scheduling and basic billing. Responsibilities — greet and check in patients, "
            "manage the appointment calendar, handle incoming calls, collect basic payment and issue receipts, "
            "maintain patient record filing. Requirements — 12th pass minimum, basic computer literacy, clear "
            "spoken Hindi and English, based within commutable distance. Nice-to-haves — prior front-desk or "
            "receptionist experience, familiarity with a scheduling app. The reasoning note should explain: since "
            "the budget is entry-level, the must-haves stay to basic literacy and communication rather than "
            "healthcare-specific experience, which would be unrealistic to demand at this pay."
        ),
    },
    {
        "track": "hr", "title": "Interview Questions Design", "phase": 1, "is_blindfold": False,
        "difficulty": "easy", "points_value": 65, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "1.5-2 hours",
        "brief": (
            "Northstar BPO Services is hiring a Customer Support Team Lead — this person will manage a team of 8 "
            "support agents handling voice and chat support for an e-commerce client, own escalation handling, "
            "coach agents on call quality, and be responsible for hitting the team's SLA (service-level agreement) "
            "targets. Design the interview question set for this role."
        ),
        "why_it_matters": (
            "A good interview question is designed to reveal something specific about a candidate's ability, not "
            "just to fill time — this structured-question-design skill is used in hiring interviews across every "
            "role and every industry."
        ),
        "instructions": (
            "Step 1: Write 3-4 Technical/Role-knowledge questions (things specific to running a support team — SLAs, "
            "escalation handling, quality coaching).\n"
            "Step 2: Write 3-4 Behavioral questions (asking about a real past experience, usually starting with "
            "\"Tell me about a time...\").\n"
            "Step 3: Write 2-3 Situational questions (a hypothetical scenario specific to this role, asking how "
            "they'd handle it).\n"
            "Step 4: For every single question, add a one-line rationale explaining exactly what it's meant to "
            "reveal about the candidate.\n"
            "Step 5: Write 100+ words on which 2 questions you consider the most important for THIS specific role, "
            "and why."
        ),
        "mistake_explanation": (
            "Generic questions (\"tell me about yourself,\" \"what's your biggest weakness\") don't actually predict "
            "whether someone can run a support team under SLA pressure — a poorly designed interview lets a weak "
            "hire slip through, and the real cost shows up months later as missed SLAs and a team that doesn't trust "
            "its lead."
        ),
        "hints": [
            "Hint 1: A technical question for a team lead role should test judgment about escalation/SLA handling, "
            "not just knowledge of support terminology — e.g. \"how would you decide which of two escalations to "
            "handle first?\" reveals more than \"what is SLA?\"",
            "Hint 2: A strong behavioral question asks for a SPECIFIC past example (\"tell me about a time you had "
            "to manage an underperforming team member\") rather than a general opinion question — specific stories "
            "are harder to fake convincingly.",
            "Hint 3: A situational question should be a realistic scenario this exact role will actually face (an "
            "angry escalated customer, a team member missing SLA repeatedly) — not a generic puzzle question "
            "unrelated to the job.",
        ],
        "sample_solution": (
            "Worked example for a different role (Warehouse Shift Supervisor): Technical — \"How would you "
            "prioritize which orders to pick first if you're running behind schedule?\" (rationale: tests whether "
            "they understand operational prioritization, not just process steps). Behavioral — \"Tell me about a "
            "time you had to report a safety issue to your manager.\" (rationale: reveals whether they'll actually "
            "flag problems rather than stay quiet). Situational — \"If two team members are in a heated "
            "disagreement on the floor during a shift, what do you do in the next 5 minutes?\" (rationale: tests "
            "real-time conflict de-escalation under time pressure, which is the actual job). The written summary "
            "should explain that the situational question is the most important one here, because a shift "
            "supervisor's real value is shown in live moments, not in a rehearsed answer."
        ),
    },

    # ═══════════════════════ PHASE 2 — independent (Day 31-60) ═════════════
    {
        "track": "hr", "title": "Onboarding Checklist Design", "phase": 2, "is_blindfold": False,
        "difficulty": "medium", "points_value": 85, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "1.5-2 hours",
        "brief": (
            "Emberline Retail Group has just hired a new Sales Executive who joins on Monday — a field + in-store "
            "sales role covering a specific territory. On their first day they'll need: an introduction to their "
            "manager and team, a walkthrough of the product catalog, access and training on the company's CRM tool "
            "(internally called \"SalesTrack\"), their territory assignment and account list, HR paperwork and ID "
            "card issuance, and a period shadowing a senior sales rep before going out on their own. Design the "
            "full first-week (5 working days) onboarding checklist/schedule."
        ),
        "why_it_matters": (
            "A well-sequenced first week is the single biggest lever a company has over whether a new hire feels "
            "confident or lost — this exact planning skill (breaking a fuzzy goal into a day-by-day schedule) "
            "applies to onboarding any role, anywhere."
        ),
        "instructions": (
            "Step 1: List every onboarding item mentioned in the brief (there are 6).\n"
            "Step 2: Assign each item to a specific day (Day 1 through Day 5) — don't just list them in one big pile.\n"
            "Step 3: Within each day, order the items so the sequence actually makes sense (e.g. you can't assign "
            "territory before they know the product catalog).\n"
            "Step 4: Add at least one check-in point during the week (e.g. an end-of-week conversation with their "
            "manager) so problems surface early.\n"
            "Step 5: Write 150+ words explaining your sequencing choices — specifically, why you put certain items "
            "early vs late in the week, and what would go wrong if the order were reversed."
        ),
        "mistake_explanation": (
            "Onboarding items done in the wrong order (e.g. sending a new hire out on live sales calls before they "
            "know the product or the CRM) makes a bad first impression on customers and on the new hire themselves "
            "— a real company's first-week churn (new hires quitting within days) is very often an onboarding "
            "sequencing failure, not a hiring failure."
        ),
        "hints": [
            "Hint 1: Paperwork, ID card, and team introductions belong on Day 1 — before anything role-specific, so "
            "the new hire feels settled and has what they need to function.",
            "Hint 2: Product knowledge should come before CRM training, and both should come before territory "
            "assignment or shadowing — you can't usefully shadow a call you don't understand yet.",
            "Hint 3: Shadowing a senior rep should be the last step of the week, once the new hire has enough "
            "context to actually learn from watching rather than just being confused.",
        ],
        "sample_solution": (
            "Worked example for a different role (new hire joining as an Accounts Assistant): Day 1 — HR paperwork, "
            "ID card, desk/system setup, team introductions. Day 2 — walkthrough of the company's chart of accounts "
            "and current month's books. Day 3 — hands-on training on the accounting software (login, basic entry "
            "practice on a test file, not live data yet). Day 4 — shadow the senior accountant on 2-3 real "
            "transactions, ask questions. Day 5 — attempt 2-3 real entries independently with the senior accountant "
            "reviewing before submission, plus a short end-of-week check-in with the finance manager. The reasoning "
            "should note: software training before real transactions prevents costly data-entry mistakes in live "
            "books, and the Friday check-in exists specifically to catch confusion before it turns into a bad "
            "second week."
        ),
    },
    {
        "track": "hr", "title": "Employee Complaint Handling", "phase": 2, "is_blindfold": False,
        "difficulty": "hard", "points_value": 100, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "brief": (
            "You receive a written complaint at Northstar BPO Services from Ritu Sharma, a Customer Support agent. "
            "Her complaint: her direct manager, Vikas, consistently assigns her the team's toughest escalation "
            "calls while giving easier calls to others; he has denied her last two shift-swap and leave requests "
            "while approving near-identical requests from other team members around the same time; and he has "
            "publicly criticized her call handling in front of the whole team twice in the last month, instead of "
            "giving that feedback privately. Ritu says she's stressed, feels singled out, and is seriously "
            "considering resigning. She has not filed this anywhere else yet and asked that it be handled "
            "carefully. Write how you, as HR, would investigate and resolve this."
        ),
        "why_it_matters": (
            "Handling an employee complaint fairly — hearing both sides, documenting properly, and reaching a "
            "resolution without retaliation — is one of the highest-stakes HR skills, because getting it wrong "
            "creates real legal and trust exposure for any employer."
        ),
        "instructions": (
            "Step 1: List the specific facts Ritu has alleged (there are 3 distinct issues — call assignment, "
            "leave/shift approvals, and public criticism) — don't lump them into one vague \"conflict.\"\n"
            "Step 2: Describe how you would investigate each one — who else you'd talk to, what records you'd pull "
            "(e.g. call assignment logs, leave-approval history for the whole team), and how you'd keep the process "
            "confidential and non-retaliatory while it's ongoing.\n"
            "Step 3: Describe how you would hear Vikas's side fairly, without assuming guilt before the "
            "investigation is done.\n"
            "Step 4: Describe 2-3 possible outcomes depending on what the investigation finds, ranging from \"no "
            "wrongdoing found, but coach Vikas on public feedback anyway\" to \"pattern confirmed, formal corrective "
            "action.\"\n"
            "Step 5: Write 200+ words explaining how you would protect Ritu from retaliation during and after this "
            "process, and how you would follow up with her afterward regardless of the outcome."
        ),
        "mistake_explanation": (
            "A complaint that's handled by only hearing the manager's side, or that leaks the complainant's identity "
            "without protection, or that never follows up — creates exactly the kind of retaliation and unfair-"
            "process exposure that turns into resignations, damaged trust across the whole team, and real legal "
            "risk for the company, even when the original complaint itself was minor."
        ),
        "hints": [
            "Hint 1: Separate the 3 allegations and investigate each with actual evidence (call logs, leave-request "
            "records comparing Ritu's team) rather than treating the whole thing as one vague personality conflict.",
            "Hint 2: Fair process means BOTH sides are heard before any conclusion is reached — write out what "
            "questions you'd ask Vikas, not just what you'd ask Ritu.",
            "Hint 3: Confidentiality and non-retaliation aren't just nice-to-haves — explicitly state how you'd "
            "make sure Vikas doesn't find out who complained until the formal process requires it, and how you'd "
            "check in on Ritu afterward to confirm there's been no retaliation.",
        ],
        "sample_solution": (
            "Worked example for a different scenario (a warehouse employee complains their supervisor is "
            "consistently assigning them the heaviest/most physically demanding tasks while giving lighter tasks to "
            "a friend of the supervisor): Investigation — pull the task-assignment log for the last month across "
            "the whole shift, compare distribution across all workers, interview 2-3 other team members "
            "confidentially about whether they've noticed the same pattern. Hearing the supervisor's side — ask "
            "them directly how they decide task assignments, without revealing who complained. Possible outcomes — "
            "if the log shows a genuine skew, retrain the supervisor on rotation-based assignment and monitor for a "
            "month; if the log shows assignments were actually balanced overall, still coach the supervisor on "
            "communicating task-assignment reasoning transparently, since the perception problem itself is worth "
            "fixing. The retaliation-protection section should specifically describe checking in with the "
            "complainant 2-3 weeks later, privately, to confirm nothing changed for the worse."
        ),
    },
    {
        "track": "hr", "title": "Attendance Analysis", "phase": 2, "is_blindfold": False,
        "difficulty": "medium", "points_value": 95, "deliverable_type": "text_and_spreadsheet", "requires_geotag": False,
        "estimated_duration": "2.5-3 hours",
        "brief": (
            "Northstar BPO Services' Customer Support department has 3 agents — Priya Nair, Rohan Mehta, and Kavita "
            "Joshi. Their raw daily attendance for 10 scheduled working days in June (two Mon-Fri weeks) is loaded "
            "into the spreadsheet below exactly as recorded by the biometric system: employee name, date, status "
            "(Present / Late / Absent), and clock-in/clock-out times. The shift starts at 9:30 AM with a 15-minute "
            "grace period — anyone clocking in after 9:45 AM is marked Late. Build the summary analysis: total days "
            "worked, late count, and attendance % per employee, and flag anyone whose attendance falls below 85%."
        ),
        "why_it_matters": (
            "Turning raw biometric/attendance logs into a clean per-employee summary — and knowing where to draw "
            "the line for a flag — is routine, recurring HR work at almost every company with hourly or shift-based "
            "staff."
        ),
        "instructions": (
            "Step 1: Look at the 30 raw attendance rows (rows 2-31) already filled in for you, split into 3 blocks "
            "of 10 rows per employee (Priya rows 2-11, Rohan rows 12-21, Kavita rows 22-31).\n"
            "Step 2: In column F (Late Flag), for every row, use a formula like =IF(C2=\"Late\",1,0).\n"
            "Step 3: In column G (Worked Flag), for every row, use a formula like =IF(OR(C2=\"Present\",C2=\"Late\"),"
            "1,0) — a Late day still counts as worked, just flagged separately.\n"
            "Step 4: In row 35 (Priya), row 36 (Rohan), and row 37 (Kavita): B = SUM() of that employee's Worked "
            "Flag range (e.g. B35=SUM(G2:G11)), C = SUM() of their Late Flag range, D = Attendance % (B ÷ 10 × 100).\n"
            "Step 5: In column E (rows 35-37), flag anyone under 85% attendance: =IF(D35<85,1,0).\n"
            "Step 6: In B39, calculate the department's average attendance % across all 3 employees using AVERAGE().\n"
            "Step 7: In the text box, write 150+ words: who (if anyone) should have a conversation with their "
            "manager about attendance, referencing both their attendance % and their late-count pattern — explain "
            "why a borderline case is different from a clearly flagged case."
        ),
        "mistake_explanation": (
            "Miscounting Late days as full absences (or vice versa) skews the attendance % and can wrongly flag a "
            "generally reliable employee, or worse, miss someone who's genuinely below threshold — in a real "
            "company, attendance summaries like this often feed directly into performance reviews and even payroll "
            "deductions, so an arithmetic mistake here has a real, direct impact on an employee's record."
        ),
        "hints": [
            "Hint 1: A Late day still counts toward \"days worked\" — only Absent days should reduce it. Don't "
            "confuse the Late Flag column with the Worked Flag column; they answer different questions.",
            "Hint 2: Attendance % is Days Worked ÷ Total Scheduled Days (10) × 100 — not Days Worked ÷ 30 (that "
            "would divide by all 3 employees' rows combined, which is wrong for a per-employee number).",
            "Hint 3: The 85% flag should be based on Attendance %, but your written explanation should also look at "
            "the Late Count separately — someone can be above 85% attendance and still have a lateness pattern "
            "worth raising.",
        ],
        "sample_solution": (
            "Worked example with different numbers (2 employees, 5 scheduled days each): Employee X — 4 Present, 1 "
            "Late, 0 Absent -> Worked = 5, Attendance % = 5/5*100 = 100%, not flagged, but Late Count = 1 is worth "
            "a passing mention. Employee Y — 2 Present, 1 Late, 2 Absent -> Worked = 3, Attendance % = 3/5*100 = "
            "60%, clearly flagged (well under 85%). The written explanation should distinguish these: Employee X "
            "doesn't need a formal conversation, just a friendly note about the one late day; Employee Y needs an "
            "actual manager conversation, because 60% attendance over just 5 days is a serious, not borderline, "
            "problem."
        ),
        "spreadsheet_template": _HR_TASK6_TEMPLATE,
        "spreadsheet_answer_key": _HR_TASK6_ANSWER_KEY,
    },

    # ═══════════════════════ PHASE 3 — capstone (Day 61-90) ════════════════
    {
        "track": "hr", "title": "Exit Interview Analysis", "phase": 3, "is_blindfold": False,
        "difficulty": "hard", "points_value": 110, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2.5-3 hours",
        "brief": (
            "Vantage Logistics Pvt Ltd has had 6 employees leave over the last quarter. Here are their exit "
            "interview summaries:\n\n"
            "1. Warehouse Supervisor, 2.1 years tenure — reason given: \"better salary elsewhere.\" Sentiment: "
            "neutral. Mentioned salary hasn't been revised despite a promised annual increment cycle.\n"
            "2. Dispatch Coordinator, 8 months tenure — reason given: \"work-life balance, mandatory overtime "
            "without notice.\" Sentiment: negative. Mentioned frequent last-minute Saturday shifts assigned with "
            "less than a day's notice.\n"
            "3. Fleet Executive, 3.4 years tenure — reason given: \"relocating to hometown for family reasons.\" "
            "Sentiment: positive. Praised management directly, reason appears genuinely personal.\n"
            "4. Inventory Clerk, 1.2 years tenure — reason given: \"no growth or promotion path.\" Sentiment: "
            "negative. Said they asked twice about promotion timeline and got vague, non-committal answers both "
            "times.\n"
            "5. Warehouse Associate, 6 months tenure — reason given: \"mandatory overtime and unpredictable "
            "scheduling.\" Sentiment: negative. Very similar complaint to the Dispatch Coordinator above.\n"
            "6. Assistant Fleet Manager, 4 years tenure — reason given: \"better salary and designation elsewhere.\" "
            "Sentiment: neutral-to-positive, but also mentioned their annual increment came in below expectation "
            "for two years running.\n\n"
            "Identify the real patterns behind these 6 exits and recommend retention actions."
        ),
        "why_it_matters": (
            "Spotting the actual root cause behind a cluster of resignations — instead of treating each one as an "
            "isolated \"better opportunity\" story — is exactly the analysis that separates HR that reacts to "
            "attrition from HR that actually reduces it."
        ),
        "instructions": (
            "Step 1: Read all 6 exit summaries and group them by underlying cause, not just by the stated reason "
            "(two people who both say \"better salary\" may actually be pointing at the same root problem: "
            "increments not keeping pace).\n"
            "Step 2: Identify which exits look genuinely unavoidable (personal/uncontrollable) vs which point to a "
            "fixable company-side issue.\n"
            "Step 3: For each fixable pattern you find, name it explicitly (e.g. \"scheduling practice in "
            "warehouse/dispatch roles,\" \"stagnant salary reviews for tenured staff,\" \"no defined promotion "
            "criteria\").\n"
            "Step 4: For each pattern, recommend one concrete retention action a company could realistically take.\n"
            "Step 5: Write 200+ words tying it together: which single pattern, if fixed first, would likely have "
            "the biggest impact on future retention, and why."
        ),
        "mistake_explanation": (
            "Treating every resignation as a one-off (\"they just got a better offer\") instead of spotting the "
            "shared pattern means the company keeps losing people to the exact same fixable problem quarter after "
            "quarter — exit interviews only create value if someone actually connects the dots across multiple "
            "exits, not just files each one away individually."
        ),
        "hints": [
            "Hint 1: Two exits mentioning \"better salary\" alongside a specific detail about increments not "
            "keeping pace are pointing at the same root issue — a compensation review problem, not two unrelated "
            "coincidences.",
            "Hint 2: Two exits with almost identical complaints about last-minute mandatory overtime, in the same "
            "type of role (warehouse/dispatch), point to an operational scheduling-policy problem, not two "
            "unrelated personality clashes.",
            "Hint 3: Not every exit needs fixing — the relocation-for-family-reasons case is a normal, unavoidable "
            "departure with a positive sentiment; don't force a root-cause narrative onto it.",
        ],
        "sample_solution": (
            "Worked example with a different set of exits (3 resignations from a retail chain's cashier team): "
            "Exit A cites \"unclear shift roster, found out my week's schedule only 2 days in advance\"; Exit B "
            "cites \"never knew my schedule until the last minute, hard to plan anything\"; Exit C cites \"moving "
            "abroad with spouse.\" Pattern: A and B point to the same root cause — the store isn't publishing "
            "rosters far enough in advance — while C is a genuine personal/uncontrollable exit. Recommended action: "
            "publish the weekly roster at least 5 days in advance as a standing policy, and track whether cashier "
            "attrition drops over the following two quarters. The written summary should explicitly say which fix "
            "to prioritize first and why it's the highest-leverage one, not just list every possible improvement."
        ),
    },
    {
        "track": "hr", "title": "Leave Policy Design", "phase": 3, "is_blindfold": True,
        "difficulty": "hard", "points_value": 130, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "3-4 hours",
        "brief": (
            "Solaris Devices Pvt Ltd is a 50-employee IT hardware startup with a single office in Pune, "
            "Maharashtra. It currently has NO written leave policy at all — leave has been handled informally, "
            "manager by manager, which has already caused a few disputes over who got approved and who didn't. The "
            "founders have asked you to design the company's first formal leave policy from scratch, given these "
            "constraints:\n\n"
            "- 50 employees total, single office, all roles on-site (no remote/field staff to plan around).\n"
            "- The company works Monday-Saturday currently, with alternate Saturdays off.\n"
            "- Budget-conscious startup — the founders explicitly said they cannot match a large corporation's "
            "leave count, but want something competitive enough to attract talent.\n"
            "- Fixed public holidays that cannot be skipped: Republic Day (Jan 26), Independence Day (Aug 15), "
            "Gandhi Jayanti (Oct 2) — beyond these, the founders are open to a small list of floating/regional "
            "festival holidays employees can choose from.\n"
            "- The founders are worried about leave-liability payout costs, so they specifically do NOT want "
            "unlimited or overly generous carryover/encashment.\n"
            "- New hires should have some flexibility but not full leave access from day one — the founders "
            "mentioned a probation period (typically 90 days) should have its own, more restricted leave rules.\n"
            "- The company must account for statutory-style leave categories any Indian employer is expected to "
            "offer in some form (e.g. sick leave, earned/privilege leave, maternity/paternity leave, bereavement "
            "leave), even though you are not expected to cite exact legal clauses — design something realistic and "
            "defensible.\n\n"
            "Design the complete leave policy for Solaris Devices Pvt Ltd."
        ),
        "why_it_matters": (
            "Designing a leave policy from a blank page — balancing employee fairness against real cost/liability "
            "constraints — is exactly the kind of judgment-heavy, no-template HR work a founder or a small "
            "company's first HR hire is actually asked to do."
        ),
        "instructions": (
            "Step 1: Define every leave type the policy will offer (at minimum: Casual Leave, Sick Leave, Earned/"
            "Privilege Leave, Maternity Leave, Paternity Leave, Bereavement Leave) with a specific number of days "
            "per year for each.\n"
            "Step 2: Define the accrual rule for each leave type — does it accrue monthly, is it granted in full at "
            "the start of the year, or does it depend on tenure?\n"
            "Step 3: Define the carryover and/or encashment rule — how much (if any) unused leave carries into the "
            "next year, and what happens to the rest.\n"
            "Step 4: Define the approval process — who approves leave requests, how much advance notice is "
            "required for planned leave vs sick leave, and whether there are any blackout periods.\n"
            "Step 5: Define the probation-period rule specifically — what leave (if any) is available to an "
            "employee in their first 90 days, and why.\n"
            "Step 6: Write 250+ words of reasoning explaining the choice behind EACH major policy decision above — "
            "tie each choice back to the specific constraints given (budget-conscious, worried about payout "
            "liability, wants to stay competitive, single office, etc.)."
        ),
        "mistake_explanation": (
            "A leave policy with vague or missing accrual/carryover rules is exactly what creates payroll disputes "
            "later — if it's unclear how many days an employee has actually earned by the time they resign or ask "
            "for encashment, HR and Finance end up in a dispute with the employee (and sometimes each other) over "
            "money, and an inconsistent or informal policy (like Solaris has right now) is what causes employees to "
            "feel that leave approval depends on who your manager is rather than on a fair, written rule."
        ),
    },

    # Interactive tool task — a real roster/screening UI, entirely fictional
    # candidates (invented profiles, never scraped from LinkedIn/Indeed or
    # any real person). deliverable_type stays "text": graded by the same
    # AI text grader as every other HR task.
    {
        "track": "hr", "title": "Screen & Structure Your First Hiring Roster", "phase": 1, "is_blindfold": False,
        "difficulty": "medium", "points_value": 90, "deliverable_type": "text", "requires_geotag": False,
        "estimated_duration": "2-2.5 hours",
        "interactive_tool": "roster_processor",
        "tool_seed_data": {
            "company": "Meridian Textiles Ltd",
            "role": "Junior Accountant — Finance Dept",
            "budget": "Rs 18,000 - 22,000 / month",
            "candidates": [
                {"id": "c1", "name": "Ankit Verma", "summary": "B.Com 2023, fresher, self-taught Tally, based in Sehore, salary expectation not specified"},
                {"id": "c2", "name": "Sneha Patil", "summary": "B.Com 2021, 2 yrs Junior Accountant, Tally ERP9 + GST, immediate joiner, expects Rs 20,000"},
                {"id": "c3", "name": "Mohammed Irfan", "summary": "B.Com 2018, 6 yrs experience, Accounts Manager level, expects Rs 45,000 (well above budget)"},
                {"id": "c4", "name": "Kavya Reddy", "summary": "B.Com 2022, 1.5 yrs same-industry (textiles) experience, Advanced Excel certified, expects Rs 19,000"},
            ],
            "salary_breakup_defaults": {"basic_pct": 50, "hra_pct": 20, "bonus_pct": 10},
        },
        "brief": (
            "Meridian Textiles Ltd (fictional) needs to fill a Junior Accountant role, budget Rs 18,000-22,000/month. "
            "4 candidate profiles are loaded into the roster board below. For each one, decide Screen In or Reject "
            "with a one-line reason, then use the salary breakup calculator to work out what a Basic/HRA/Bonus split "
            "would look like for your final pick at their expected salary."
        ),
        "why_it_matters": (
            "Screening against a role's real constraints (not just years of experience) and being able to break a "
            "gross salary into Basic/HRA/Bonus components are both everyday HR-desk skills — the second one "
            "specifically feeds directly into how offer letters and payroll actually get structured."
        ),
        "instructions": (
            "Step 1: Review each candidate against the role's budget and requirements.\n"
            "Step 2: Mark each one Screen In or Reject with a one-line reason tied to a specific fact (budget fit, "
            "relevant experience, availability) — not a vague impression.\n"
            "Step 3: For your top pick, use the salary calculator to compute a Basic/HRA/Bonus breakup at their "
            "expected monthly salary.\n"
            "Step 4: In the answer box, write 150+ words explaining your final shortlist — who you'd move to "
            "interview and why, and what risk (if any) you'd flag about your top choice even though you screened "
            "them in."
        ),
        "hints": [
            "Hint 1: A candidate expecting more than double the budget ceiling is very unlikely to accept an offer "
            "even if the interview goes well — flag this before anything else.",
            "Hint 2: Same-industry experience (textiles, in this case) is a real advantage for a junior role even "
            "when the candidate has fewer total years than someone from an unrelated industry.",
            "Hint 3: A fresher with zero experience isn't automatically a reject for a junior role with a tight "
            "budget — weigh it against candidates whose salary expectations don't fit at all.",
        ],
        "sample_solution": (
            "Worked example for a different role (Sales Coordinator, budget Rs 22,000-25,000): Candidate expects "
            "Rs 24,000, has 2 years of directly relevant coordination experience, and is an immediate joiner — "
            "Screen In, strong fit on budget and relevance. Candidate expects Rs 40,000 with 5 years of unrelated "
            "field-sales experience — Reject, over-budget and the experience doesn't transfer cleanly. For the "
            "screened-in candidate at Rs 24,000: Basic (50%) = Rs 12,000, HRA (20%) = Rs 4,800, Bonus (10%) = "
            "Rs 2,400, remainder as other allowances. The written summary should name the trade-off, not just "
            "declare the pick \"good.\""
        ),
    },
]


TASKS = FINANCE_TASKS + MARKETING_TASKS + SALES_TASKS + HR_TASKS


async def seed():
    inserted, updated = 0, 0
    for t in TASKS:
        doc = {
            "id": str(uuid.uuid4()),
            "track": t["track"],
            "title": t["title"],
            "brief": t["brief"],
            "instructions": t.get("instructions"),
            "why_it_matters": t.get("why_it_matters"),
            "deliverable_type": t["deliverable_type"],
            "requires_geotag": t["requires_geotag"],
            "points_value": t["points_value"],
            "difficulty": t["difficulty"],
            "estimated_duration": t.get("estimated_duration"),
            "is_active": True,
            "phase": t.get("phase"),
            "is_blindfold": t.get("is_blindfold", False),
            "spreadsheet_template": t.get("spreadsheet_template"),
            "spreadsheet_answer_key": t.get("spreadsheet_answer_key"),
            "mistake_explanation": t.get("mistake_explanation"),
            "hints": t.get("hints"),
            "sample_solution": t.get("sample_solution"),
            "interactive_tool": t.get("interactive_tool"),
            "tool_seed_data": t.get("tool_seed_data"),
            "created_by": "seed_script",
            "created_at": datetime.now(timezone.utc),
        }
        existing = await internship_task_pool_collection.find_one({"track": t["track"], "title": t["title"]})
        if existing:
            doc["id"] = existing["id"]
            doc["created_at"] = existing.get("created_at", doc["created_at"])
            await internship_task_pool_collection.update_one({"_id": existing["_id"]}, {"$set": doc})
            updated += 1
        else:
            await internship_task_pool_collection.insert_one(doc)
            inserted += 1

    # Remove old seed-script tasks whose title isn't in the current TASKS
    # list — but never touch tasks an admin added by hand (created_by
    # would be their user id, not "seed_script").
    current_titles = {(t["track"], t["title"]) for t in TASKS}
    removed = 0
    async for doc in internship_task_pool_collection.find({"created_by": "seed_script"}):
        if (doc["track"], doc["title"]) not in current_titles:
            await internship_task_pool_collection.delete_one({"_id": doc["_id"]})
            removed += 1

    print(f"Task pool seeded: {inserted} inserted, {updated} updated, {removed} stale tasks removed, {len(TASKS)} total active.")


if __name__ == "__main__":
    asyncio.run(seed())
