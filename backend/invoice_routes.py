import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from auth_utils import require_admin
from database import invoices_collection, business_settings_collection
from storage_r2 import r2_enabled, upload_bytes, presigned_url
from invoice_pdf import generate_invoice_pdf
from activity_service import log_activity

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


class InvoiceItem(BaseModel):
    description: str
    quantity: float
    rate: float


class InvoiceCreate(BaseModel):
    bill_to_name: str
    bill_to_address: Optional[str] = None
    bill_to_phone: Optional[str] = None
    items: List[InvoiceItem]
    gst_percent: Optional[float] = 0
    gst_type: Literal["inclusive", "exclusive"] = "exclusive"
    gst_number: Optional[str] = None
    save_gst_number: bool = False
    payment_method: Optional[Literal["cash", "upi", "bank_transfer"]] = None
    invoice_date: Optional[str] = None  # defaults to today


async def _next_invoice_number(year: int) -> str:
    prefix = f"TFD/INV/{year}/"
    count = await invoices_collection.count_documents({"invoice_number": {"$regex": f"^{prefix.replace('/', chr(92) + '/')}"}})
    return f"{prefix}{count + 1:04d}"


@router.get("/settings")
async def get_invoice_settings(admin: dict = Depends(require_admin)):
    """The last-saved GST number template — lets the "new invoice" form
    pre-fill it instead of retyping every time."""
    doc = await business_settings_collection.find_one({"_id": "gst_template"}, {"_id": 0})
    return doc or {"gst_number": None}


@router.post("")
async def create_invoice(data: InvoiceCreate, admin: dict = Depends(require_admin)):
    invoice_date = data.invoice_date or date.today().isoformat()
    year = date.fromisoformat(invoice_date).year
    invoice_number = await _next_invoice_number(year)

    invoice_data = {
        "invoice_number": invoice_number, "invoice_date": invoice_date,
        "bill_to_name": data.bill_to_name, "bill_to_address": data.bill_to_address,
        "bill_to_phone": data.bill_to_phone,
        "items": [i.model_dump() for i in data.items],
        "gst_percent": data.gst_percent, "gst_type": data.gst_type, "gst_number": data.gst_number,
        "payment_method": data.payment_method,
    }
    pdf_bytes, subtotal, gst_amount, total = generate_invoice_pdf(invoice_data)

    invoice_id = str(uuid.uuid4())
    r2_key = None
    if r2_enabled():
        r2_key = f"invoices/{invoice_id}.pdf"
        upload_bytes(r2_key, pdf_bytes, "application/pdf")

    doc = {
        "id": invoice_id, **invoice_data,
        "subtotal": subtotal, "gst_amount": gst_amount, "total": total,
        "r2_key": r2_key, "created_by": admin["sub"], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await invoices_collection.insert_one(doc)

    # Remember this GST number for next time, only if the admin explicitly
    # opted in — not automatically on every invoice with a GST number typed in.
    if data.save_gst_number and data.gst_number:
        await business_settings_collection.update_one(
            {"_id": "gst_template"}, {"$set": {"gst_number": data.gst_number}}, upsert=True,
        )

    await log_activity(admin["sub"], "invoice_created", f"Created invoice {invoice_number} for {data.bill_to_name} (₹{total:,.2f})", link="/portal/admin/invoices")

    doc.pop("_id", None)
    if r2_key:
        doc["pdf_url"] = presigned_url(r2_key)
    return doc


@router.get("")
async def list_invoices(admin: dict = Depends(require_admin)):
    docs = []
    async for doc in invoices_collection.find({}).sort("created_at", -1):
        doc.pop("_id", None)
        if doc.get("r2_key"):
            doc["pdf_url"] = presigned_url(doc["r2_key"])
        docs.append(doc)
    return docs


@router.get("/{invoice_id}/download")
async def download_invoice(invoice_id: str, admin: dict = Depends(require_admin)):
    """Serves the PDF directly through our own backend (not a presigned R2
    link) so a plain authenticated fetch always works — and regenerates the
    PDF on the fly from the stored invoice fields whenever R2 is
    unconfigured or a stored file can't be fetched, instead of failing.
    Every field generate_invoice_pdf needs is already saved on the invoice
    doc, so regeneration is cheap and always available."""
    doc = await invoices_collection.find_one({"id": invoice_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pdf_bytes = None
    if doc.get("r2_key"):
        try:
            from storage_r2 import get_client, R2_BUCKET_NAME
            obj = get_client().get_object(Bucket=R2_BUCKET_NAME, Key=doc["r2_key"])
            pdf_bytes = obj["Body"].read()
        except Exception:
            pdf_bytes = None
    if pdf_bytes is None:
        pdf_bytes, *_ = generate_invoice_pdf(doc)

    filename = f"Invoice_{doc['invoice_number'].replace('/', '_')}.pdf"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
