import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { Download, Eye, Mail, Share2 } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

async function downloadBlob(res, filename) {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function AdminLetterheads() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [letterheads, setLetterheads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [signatureType, setSignatureType] = useState("ceo");
  const [includeDisclaimer, setIncludeDisclaimer] = useState(false);
  const [saving, setSaving] = useState(false);

  const [emailTarget, setEmailTarget] = useState(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/letterheads`, { headers });
      if (res.ok) setLetterheads(await res.json());
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/letterheads`, {
        method: "POST", headers,
        body: JSON.stringify({ title: title || null, content, signature_type: includeSignature ? signatureType : "none", include_disclaimer: includeDisclaimer }),
      });
      if (res.ok) {
        setTitle(""); setContent(""); setIncludeSignature(true); setSignatureType("ceo"); setIncludeDisclaimer(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const viewLetterhead = async (lh) => {
    const res = await fetch(`${API_BASE}/api/letterheads/${lh.id}/download`, { headers });
    if (res.ok) {
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    }
  };

  const downloadLetterhead = async (lh) => {
    const res = await fetch(`${API_BASE}/api/letterheads/${lh.id}/download`, { headers });
    if (res.ok) await downloadBlob(res, `Letterhead_${lh.certificate_number.replace(/\//g, "_")}.pdf`);
  };

  const shareViaWhatsApp = (lh) => {
    const phone = window.prompt("Enter the recipient's WhatsApp number (10-digit mobile):");
    if (!phone || !phone.trim()) return;
    const digits = phone.replace(/\D/g, "");
    const target = digits.length === 10 ? `91${digits}` : digits;
    const text = `Hello, please find your letter from The Financial Doctor (Ref: ${lh.certificate_number}) attached.${lh.pdf_url ? `\n\n${lh.pdf_url}` : "\n\n(PDF will be shared separately)"}`;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendEmail = async () => {
    if (!emailTarget || !emailAddress.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/api/letterheads/${emailTarget.id}/email`, {
        method: "POST", headers,
        body: JSON.stringify({ to_email: emailAddress.trim(), cc_emails: emailCc.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10) }),
      });
      if (res.ok) {
        setEmailTarget(null); setEmailAddress(""); setEmailCc("");
        alert("Letterhead emailed successfully.");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to send email");
      }
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <PortalLayout>
      <PageHeader icon="📜" title="Blank Letterhead" subtitle="Free-text official letters on TFD letterhead — header/footer stay fixed" />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">New Letterhead</h3>
          <form onSubmit={submit} className="space-y-3">
            <input placeholder="Title (optional, e.g. 'Recommendation Letter')" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />

            <div>
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">
                Content — use <code>**text**</code> for bold, lines starting with <code>- </code> for bullet points, blank line for a new paragraph
              </label>
              <textarea
                required value={content} onChange={(e) => setContent(e.target.value)}
                rows={14} className={`${field} resize-y font-mono text-xs leading-relaxed`}
                placeholder={"To Whomsoever It May Concern,\n\nThis is to certify that **Jane Doe** has been associated with us since...\n\n- Point one\n- Point two\n\nRegards."}
              />
            </div>

            <div>
              <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none">
                <input type="checkbox" checked={includeSignature} onChange={(e) => setIncludeSignature(e.target.checked)} className="w-4 h-4 rounded accent-[#024396]" />
                <span className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">Include Signature</span>
                <span className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">— untick for a signature-less letter</span>
              </label>
              {includeSignature && (
                <select value={signatureType} onChange={(e) => setSignatureType(e.target.value)} className={`${field} mt-2`}>
                  <option value="ceo">CEO Signature (Sagar Chaturvedi)</option>
                  <option value="authorized_palak">Authorised Signature — Palak Mehta</option>
                  <option value="authorized">Authorized Signature (blank/generic)</option>
                </select>
              )}
            </div>

            <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none">
              <input type="checkbox" checked={includeDisclaimer} onChange={(e) => setIncludeDisclaimer(e.target.checked)} className="w-4 h-4 rounded accent-[#024396]" />
              <span className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">Add Disclaimer</span>
              <span className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">— standard mutual fund / investment risk disclaimer</span>
            </label>

            <Button type="submit" disabled={saving || !content.trim()} className="w-full bg-[#024396] hover:bg-[#023580]">
              {saving ? "Generating..." : "Generate Letterhead"}
            </Button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Past Letterheads</h3>
          {loading ? <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
            <div className="space-y-2">
              {letterheads.map((lh) => (
                <div key={lh.id} className="p-3 rounded-xl border border-[#E2D8C2] dark:border-white/10 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{lh.person_name}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{lh.certificate_number} · {lh.issue_date}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => viewLetterhead(lh)}><Eye size={12} className="mr-1" /> View</Button>
                    <Button size="sm" variant="outline" onClick={() => downloadLetterhead(lh)}><Download size={12} className="mr-1" /> Download</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEmailTarget(lh); setEmailAddress(""); setEmailCc(""); }}><Mail size={12} className="mr-1" /> Email</Button>
                    <Button size="sm" variant="outline" onClick={() => shareViaWhatsApp(lh)}><Share2 size={12} className="mr-1" /> WhatsApp</Button>
                  </div>
                </div>
              ))}
              {letterheads.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No letterheads generated yet.</p>}
            </div>
          )}
        </div>
      </div>

      <PortalModal open={!!emailTarget} onOpenChange={(v) => { if (!v) { setEmailTarget(null); setEmailAddress(""); setEmailCc(""); } }} title="Email Letterhead" maxWidth="max-w-sm">
        <div className="space-y-3">
          <input type="email" placeholder="recipient@email.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className={field} />
          <div>
            <input placeholder="CC (comma-separated, optional)" value={emailCc} onChange={(e) => setEmailCc(e.target.value)} className={field} />
            <p className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/60 mt-1">Up to 10 addresses, separated by commas</p>
          </div>
          <Button onClick={sendEmail} disabled={sendingEmail || !emailAddress.trim()} className="w-full bg-[#024396] hover:bg-[#023580]">{sendingEmail ? "Sending..." : "Send"}</Button>
        </div>
      </PortalModal>
    </PortalLayout>
  );
}
