"""Admin Accounts section — income, expenses, loans, balance sheet, networth."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from auth_utils import require_admin
from database import db

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

transactions_collection = db["account_transactions"]


class TransactionCreate(BaseModel):
    date: str
    type: str  # income, expense, loan, asset, liability
    category: str  # rent, salary_expense, office, travel, loan_emi, investment, revenue, etc.
    description: str = ""
    amount: float
    payment_mode: str = ""  # cash, bank, upi, cheque
    reference: str = ""


@router.get("/transactions")
async def list_transactions(
    month: Optional[str] = None,
    year: Optional[str] = None,
    type: Optional[str] = None,
    admin: dict = Depends(require_admin),
):
    """List all transactions, optionally filtered by month/year/type."""
    query = {}
    if type:
        query["type"] = type
    if year:
        query["date"] = {"$regex": f"^{year}"}
        if month:
            query["date"] = {"$regex": f"^{year}-{month.zfill(2)}"}

    docs = []
    cursor = transactions_collection.find(query).sort("date", -1)
    async for doc in cursor:
        doc.pop("_id", None)
        docs.append(doc)
    return docs


@router.post("/transactions")
async def create_transaction(data: TransactionCreate, admin: dict = Depends(require_admin)):
    """Add a new transaction entry."""
    doc = {
        "id": str(uuid.uuid4()),
        "date": data.date,
        "type": data.type,
        "category": data.category,
        "description": data.description,
        "amount": data.amount,
        "payment_mode": data.payment_mode,
        "reference": data.reference,
        "created_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await transactions_collection.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/transactions/{txn_id}")
async def update_transaction(txn_id: str, request: Request, admin: dict = Depends(require_admin)):
    """Update a transaction."""
    data = await request.json()
    allowed = {"date", "type", "category", "description", "amount", "payment_mode", "reference"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await transactions_collection.find_one_and_update(
        {"id": txn_id}, {"$set": updates}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    result.pop("_id", None)
    return result


@router.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str, admin: dict = Depends(require_admin)):
    """Delete a transaction."""
    result = await transactions_collection.delete_one({"id": txn_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "deleted"}


@router.get("/summary")
async def account_summary(
    year: Optional[str] = None,
    admin: dict = Depends(require_admin),
):
    """Auto-calculated summary: total income, expenses, profit/loss, assets, liabilities, networth."""
    yr = year or str(datetime.now().year)
    query = {"date": {"$regex": f"^{yr}"}}

    totals = {"income": 0, "expense": 0, "loan": 0, "asset": 0, "liability": 0}
    category_totals = {}
    monthly = {}

    cursor = transactions_collection.find(query)
    async for doc in cursor:
        t = doc.get("type", "expense")
        amt = doc.get("amount", 0)
        totals[t] = totals.get(t, 0) + amt

        cat = doc.get("category", "other")
        if t not in category_totals:
            category_totals[t] = {}
        category_totals[t][cat] = category_totals[t].get(cat, 0) + amt

        m = doc.get("date", "")[:7]
        if m not in monthly:
            monthly[m] = {"income": 0, "expense": 0}
        if t == "income":
            monthly[m]["income"] += amt
        elif t == "expense":
            monthly[m]["expense"] += amt

    profit_loss = totals["income"] - totals["expense"]
    networth = totals["asset"] - totals["liability"]

    return {
        "year": yr,
        "total_income": totals["income"],
        "total_expense": totals["expense"],
        "profit_loss": profit_loss,
        "total_assets": totals["asset"],
        "total_liabilities": totals["liability"],
        "networth": networth,
        "total_loans": totals["loan"],
        "category_breakdown": category_totals,
        "monthly": monthly,
    }
