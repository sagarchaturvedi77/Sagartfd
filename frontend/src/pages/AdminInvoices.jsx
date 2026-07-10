import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";
import { Plus, Trash2, Download, MessageCircle } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const PAYMENT_METHODS = [
  { value: "", label: "Not specified" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function AdminInvoices() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [gstPercent, setGstPercent] = useState("18");
  const [gstType, setGstType] = useState("exclusive");
  const [gstNumber, setGstNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, rate: "" }]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [invRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/invoices`, { headers }),
        fetch(`${API_BASE}/api/invoices/settings`, { headers }),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.gst_number) setGstNumber(s.gst_number);
      }
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const updateItem = (i, key, value) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, rate: "" }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const rawSubtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
  const rate = Number(gstPercent) || 0;
  let previewBase, previewGst, previewTotal;
  if (gstType === "inclusive" && rate) {
    previewTotal = rawSubtotal;
    previewBase = (previewTotal * 100) / (100 + rate);
    previewGst = previewTotal - previewBase;
  } else {
    previewBase = rawSubtotal;
    previewGst = rawSubtotal * rate / 100;
    previewTotal = previewBase + previewGst;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!billToName.trim() || items.some((it) => !it.description.trim() || !it.rate)) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST", headers,
        body: JSON.stringify({
          bill_to_name: billToName, bill_to_address: billToAddress || null, bill_to_phone: billToPhone || null,
          items: items.map((it) => ({ description: it.description, quantity: Number(it.quantity), rate: Number(it.rate) })),
          gst_percent: rate, gst_type: gstType, gst_number: gstNumber || null,
          payment_method: paymentMethod || null,
        }),
      });
      if (res.ok) {
        setBillToName(""); setBillToAddress(""); setBillToPhone(""); setPaymentMethod("");
        setItems([{ description: "", quantity: 1, rate: "" }]);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const shareOnWhatsApp = async (inv) => {
    const message = `Hello ${inv.bill_to_name},\n\nPlease find your invoice from The Financial Doctor:\nInvoice #: ${inv.invoice_number}\nAmount: ₹${inv.total.toFixed(2)}\n\nThank you for your business!\n- The Financial Doctor`;

    if (inv.pdf_url && navigator.canShare) {
      try {
        const res = await fetch(inv.pdf_url);
        const blob = await res.blob();
        const file = new File([blob], `Invoice_${inv.invoice_number.replace(/\//g, "_")}.pdf`, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Invoice ${inv.invoice_number}`, text: message });
          return;
        }
      } catch { /* fall through to link-based share below */ }
    }

    // WhatsApp's click-to-chat link can't attach a file directly (platform
    // limitation, not something a link can work around) — send the text,
    // and open the PDF too so it can be attached manually in WhatsApp.
    const digits = (inv.bill_to_phone || "").replace(/\D/g, "");
    const waUrl = digits ? `https://wa.me/91${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    if (inv.pdf_url) window.open(inv.pdf_url, "_blank");
  };

  return (
    <PortalLayout>
      <PageHeader icon="🧾" title="Billing / Invoices" subtitle="Generate and download invoices with TFD letterhead" />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">New Invoice</h3>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Bill To (Name) *" value={billToName} onChange={(e) => setBillToName(e.target.value)} className={field} />
            <textarea placeholder="Address (optional)" rows={2} value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} className={`${field} resize-none`} />
            <input placeholder="Phone (optional, for WhatsApp share)" value={billToPhone} onChange={(e) => setBillToPhone(e.target.value)} className={field} />

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input required placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className={`${field} col-span-6`} />
                  <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className={`${field} col-span-2`} />
                  <input required type="number" min="0" placeholder="Rate ₹" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} className={`${field} col-span-3`} />
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="col-span-1 text-red-500 disabled:opacity-30"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="text-xs text-[#024396] dark:text-[#7CB0FF] font-medium flex items-center gap-1"><Plus size={13} /> Add Item</button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">GST %</label>
                <input type="number" min="0" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} className={field} />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">GST Type</label>
                <select value={gstType} onChange={(e) => setGstType(e.target.value)} className={field}>
                  <option value="exclusive">Exclusive (add GST on top)</option>
                  <option value="inclusive">Inclusive (already included)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">GST Number (optional — remembered for next time)</label>
              <input placeholder="e.g. 23AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={field} />
            </div>

            <div>
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={field}>
                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#2A364B]/60 dark:text-[#8E99AC]">Base Amount</span><span>₹{previewBase.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[#2A364B]/60 dark:text-[#8E99AC]">GST ({rate}%)</span><span>₹{previewGst.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]"><span>Total Payable</span><span>₹{previewTotal.toFixed(2)}</span></div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-[#024396] hover:bg-[#023580]">{saving ? "Generating..." : "Generate Invoice"}</Button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Past Invoices</h3>
          {loading ? <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E2D8C2] dark:border-white/10 flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{inv.bill_to_name}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{inv.invoice_number} · ₹{inv.total.toFixed(2)} · {inv.invoice_date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => shareOnWhatsApp(inv)}><MessageCircle size={12} className="mr-1" /> WhatsApp</Button>
                    {inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Download size={12} className="mr-1" /> PDF</Button></a>}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No invoices yet.</p>}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
