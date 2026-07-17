import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { Plus, Trash2, Download, MessageCircle, Share2, Receipt } from "lucide-react";
import { useSubmitOnce } from "../lib/useSubmitOnce";

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
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState("18");
  const [gstType, setGstType] = useState("exclusive");
  const [gstNumber, setGstNumber] = useState("");
  const [saveGstNumber, setSaveGstNumber] = useState(false);
  const [savedGstNumber, setSavedGstNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, rate: "" }]);
  const [busyId, setBusyId] = useState(null); // invoice id currently downloading/sharing — per-row UI feedback
  // Set-based ref guard (not useSubmitOnce directly — these actions are
  // keyed per-invoice-id, and a hook can't be instantiated dynamically per
  // row) so a rapid double-click on the SAME invoice's button can't fire
  // two concurrent downloads/shares, while a different invoice's button
  // stays independently clickable (busyId already gave per-row visual
  // feedback; this closes the actual race window that state alone can't).
  const inFlightRef = useRef(new Set());
  const [detailInvoice, setDetailInvoice] = useState(null);

  const load = useCallback(async () => {
    try {
      const [invRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/invoices`, { headers }),
        fetch(`${API_BASE}/api/invoices/settings`, { headers }),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.gst_number) setSavedGstNumber(s.gst_number);
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
  const rate = gstEnabled ? (Number(gstPercent) || 0) : 0;
  let previewBase, previewGst, previewTotal;
  if (gstEnabled && gstType === "inclusive" && rate) {
    previewTotal = rawSubtotal;
    previewBase = (previewTotal * 100) / (100 + rate);
    previewGst = previewTotal - previewBase;
  } else {
    previewBase = rawSubtotal;
    previewGst = rawSubtotal * rate / 100;
    previewTotal = previewBase + previewGst;
  }

  const useSavedGst = () => setGstNumber(savedGstNumber);

  const [submit, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    if (!billToName.trim() || items.some((it) => !it.description.trim() || !it.rate)) return;
    const res = await fetch(`${API_BASE}/api/invoices`, {
      method: "POST", headers,
      body: JSON.stringify({
        bill_to_name: billToName, bill_to_address: billToAddress || null, bill_to_phone: billToPhone || null,
        items: items.map((it) => ({ description: it.description, quantity: Number(it.quantity), rate: Number(it.rate) })),
        gst_percent: rate, gst_type: gstType, gst_number: gstEnabled ? (gstNumber || null) : null,
        save_gst_number: gstEnabled && saveGstNumber,
        payment_method: paymentMethod || null,
      }),
    });
    if (res.ok) {
      setBillToName(""); setBillToAddress(""); setBillToPhone(""); setPaymentMethod("");
      setItems([{ description: "", quantity: 1, rate: "" }]);
      setGstEnabled(false); setGstNumber(""); setSaveGstNumber(false);
      load();
    }
  });

  // Always fetches the PDF fresh through our own authenticated endpoint
  // (regenerated server-side from the stored invoice fields if needed)
  // instead of relying on a presigned R2 link that may be missing.
  const fetchInvoicePdfBlob = async (inv) => {
    const res = await fetch(`${API_BASE}/api/invoices/${inv.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Could not fetch invoice PDF");
    return res.blob();
  };

  const downloadInvoice = async (inv) => {
    if (inFlightRef.current.has(inv.id)) return;
    inFlightRef.current.add(inv.id);
    setBusyId(inv.id);
    try {
      const blob = await fetchInvoicePdfBlob(inv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${inv.invoice_number.replace(/\//g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download the invoice PDF. Please try again.");
    } finally {
      inFlightRef.current.delete(inv.id);
      setBusyId(null);
    }
  };

  const shareInvoice = async (inv) => {
    if (inFlightRef.current.has(inv.id)) return;
    inFlightRef.current.add(inv.id);
    setBusyId(inv.id);
    const message = `Hello ${inv.bill_to_name},\n\nPlease find your invoice from The Financial Doctor:\nInvoice #: ${inv.invoice_number}\nAmount: ₹${inv.total.toFixed(2)}\n\nThank you for your business!\n- The Financial Doctor`;
    try {
      const blob = await fetchInvoicePdfBlob(inv);
      const file = new File([blob], `Invoice_${inv.invoice_number.replace(/\//g, "_")}.pdf`, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${inv.invoice_number}`, text: message });
        return;
      }
      // No native file-share support (most desktop browsers) — open the
      // PDF in a new tab so it can be saved/attached manually, alongside
      // a WhatsApp click-to-chat with the message pre-filled.
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      const digits = (inv.bill_to_phone || "").replace(/\D/g, "");
      const waUrl = digits ? `https://wa.me/91${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    } catch (e) {
      if (e?.name !== "AbortError") alert("Could not share the invoice. Please try downloading it instead.");
    } finally {
      inFlightRef.current.delete(inv.id);
      setBusyId(null);
    }
  };

  const gstBreakdown = (inv) => {
    const subtotal = inv.items.reduce((s, it) => s + it.quantity * it.rate, 0);
    return { subtotal, gst: inv.gst_amount || 0, total: inv.total };
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

            <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none">
              <input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} className="w-4 h-4 rounded accent-[#024396]" />
              <span className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">GST Bill</span>
              <span className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">— turn on to add GST %, type and GSTIN</span>
            </label>

            {gstEnabled && (
              <div className="space-y-3 bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-3.5">
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
                  <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">GST Number</label>
                  <div className="flex gap-2">
                    <input placeholder="e.g. 23AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={field} />
                    {savedGstNumber && savedGstNumber !== gstNumber && (
                      <button type="button" onClick={useSavedGst} className="shrink-0 text-xs px-3 rounded-xl border border-[#E2D8C2] dark:border-white/15 text-[#024396] dark:text-[#7CB0FF] font-medium whitespace-nowrap">
                        Use saved
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={saveGstNumber} onChange={(e) => setSaveGstNumber(e.target.checked)} className="w-3.5 h-3.5 rounded accent-[#024396]" />
                  <span className="text-xs text-[#2A364B]/70 dark:text-[#8E99AC]">Save this GST number for next time</span>
                </label>
              </div>
            )}

            <div>
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={field}>
                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#2A364B]/60 dark:text-[#8E99AC]">Base Amount</span><span>₹{previewBase.toFixed(2)}</span></div>
              {gstEnabled && <div className="flex justify-between"><span className="text-[#2A364B]/60 dark:text-[#8E99AC]">GST ({rate}%)</span><span>₹{previewGst.toFixed(2)}</span></div>}
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
                <div
                  key={inv.id}
                  onClick={() => setDetailInvoice(inv)}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E2D8C2] dark:border-white/10 flex-wrap gap-2 cursor-pointer hover:bg-[#FBF7EE] dark:hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{inv.bill_to_name}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{inv.invoice_number} · ₹{inv.total.toFixed(2)} · {inv.invoice_date}</p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" disabled={busyId === inv.id} onClick={() => shareInvoice(inv)}><Share2 size={12} className="mr-1" /> Share</Button>
                    <Button size="sm" variant="outline" disabled={busyId === inv.id} onClick={() => downloadInvoice(inv)}><Download size={12} className="mr-1" /> PDF</Button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No invoices yet.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Invoice detail — visual bill preview + full breakdown */}
      <PortalModal
        open={!!detailInvoice}
        onOpenChange={(v) => !v && setDetailInvoice(null)}
        title={detailInvoice?.invoice_number}
        maxWidth="max-w-lg"
      >
        {detailInvoice && (() => {
          const { subtotal, gst, total } = gstBreakdown(detailInvoice);
          return (
            <div className="space-y-4">
              {/* Receipt-style visual preview */}
              <div className="rounded-2xl border border-[#E2D8C2] dark:border-white/10 overflow-hidden">
                <div className="bg-[#0E1B2C] px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-bold text-sm flex items-center gap-1.5"><Receipt size={14} /> The Financial Doctor</span>
                  <span className="text-white/60 text-xs">{detailInvoice.invoice_date}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#0B1420] space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC]">Bill To</p>
                    <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{detailInvoice.bill_to_name}</p>
                    {detailInvoice.bill_to_address && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{detailInvoice.bill_to_address}</p>}
                    {detailInvoice.bill_to_phone && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{detailInvoice.bill_to_phone}</p>}
                  </div>

                  <div className="border-t border-dashed border-[#E2D8C2] dark:border-white/10 pt-2 space-y-1.5">
                    {detailInvoice.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-[#2A364B] dark:text-[#C7CEDA]">{it.description} <span className="text-[#2A364B]/40 dark:text-[#8E99AC]">× {it.quantity}</span></span>
                        <span className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium">₹{(it.quantity * it.rate).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-[#E2D8C2] dark:border-white/10 pt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-[#2A364B]/60 dark:text-[#8E99AC]"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    {detailInvoice.gst_percent > 0 && (
                      <div className="flex justify-between text-[#2A364B]/60 dark:text-[#8E99AC]"><span>GST ({detailInvoice.gst_percent}%, {detailInvoice.gst_type})</span><span>₹{gst.toFixed(2)}</span></div>
                    )}
                    {detailInvoice.gst_number && (
                      <div className="flex justify-between text-[#2A364B]/60 dark:text-[#8E99AC]"><span>GSTIN</span><span>{detailInvoice.gst_number}</span></div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] pt-1"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  </div>

                  {detailInvoice.payment_method && (
                    <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 uppercase tracking-wide">
                      Paid via {PAYMENT_METHODS.find((p) => p.value === detailInvoice.payment_method)?.label || detailInvoice.payment_method}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" disabled={busyId === detailInvoice.id} onClick={() => shareInvoice(detailInvoice)}>
                  <Share2 size={14} className="mr-1.5" /> Share
                </Button>
                <Button className="flex-1 bg-[#024396] hover:bg-[#023580]" disabled={busyId === detailInvoice.id} onClick={() => downloadInvoice(detailInvoice)}>
                  <Download size={14} className="mr-1.5" /> Download PDF
                </Button>
              </div>
              {detailInvoice.bill_to_phone && (
                <Button
                  variant="outline" className="w-full"
                  onClick={() => {
                    const message = `Hello ${detailInvoice.bill_to_name},\n\nPlease find your invoice from The Financial Doctor:\nInvoice #: ${detailInvoice.invoice_number}\nAmount: ₹${detailInvoice.total.toFixed(2)}\n\nThank you for your business!\n- The Financial Doctor`;
                    const digits = detailInvoice.bill_to_phone.replace(/\D/g, "");
                    window.open(`https://wa.me/91${digits}?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                >
                  <MessageCircle size={14} className="mr-1.5" /> Message on WhatsApp
                </Button>
              )}
            </div>
          );
        })()}
      </PortalModal>
    </PortalLayout>
  );
}
