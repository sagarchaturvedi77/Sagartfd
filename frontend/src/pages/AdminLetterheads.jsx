import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminLetterheads() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [letterheads, setLetterheads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [signatureType, setSignatureType] = useState("ceo");
  const [includeDisclaimer, setIncludeDisclaimer] = useState(false);
  const [saving, setSaving] = useState(false);

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
        body: JSON.stringify({ title: title || null, content, signature_type: signatureType, include_disclaimer: includeDisclaimer }),
      });
      if (res.ok) {
        setTitle(""); setContent(""); setSignatureType("ceo"); setIncludeDisclaimer(false);
        load();
      }
    } finally {
      setSaving(false);
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
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1 block">Signature</label>
              <select value={signatureType} onChange={(e) => setSignatureType(e.target.value)} className={field}>
                <option value="ceo">CEO Signature (Sagar Chaturvedi)</option>
                <option value="authorized">Authorized Signature (generic)</option>
              </select>
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
                <div key={lh.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E2D8C2] dark:border-white/10">
                  <div>
                    <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{lh.person_name}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{lh.certificate_number} · {lh.issue_date}</p>
                  </div>
                  {lh.pdf_url && <a href={lh.pdf_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Download size={12} className="mr-1" /> PDF</Button></a>}
                </div>
              ))}
              {letterheads.length === 0 && <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-8">No letterheads generated yet.</p>}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
