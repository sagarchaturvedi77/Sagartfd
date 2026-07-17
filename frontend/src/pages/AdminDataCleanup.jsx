import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const CATEGORIES = [
  { key: "leads_lost", label: "Old Leads (Lost only)", note: "Converted leads are never eligible here." },
  { key: "career_applications", label: "Career Applications", note: "Job-applicant records only — website contact leads are untouched." },
  { key: "notifications", label: "Old Notifications" },
  { key: "chat_messages", label: "Old Chat Messages" },
  { key: "attendance", label: "Attendance Records" },
];

export default function AdminDataCleanup() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [cutoffDate, setCutoffDate] = useState("");
  const [selected, setSelected] = useState([]);
  const [previewResult, setPreviewResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [executeResult, setExecuteResult] = useState(null);

  const toggleCategory = (key) => {
    setPreviewResult(null);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const [runPreview, previewing] = useSubmitOnce(async () => {
    if (!cutoffDate || selected.length === 0) return;
    setExecuteResult(null);
    const res = await fetch(`${API_BASE}/api/cleanup/preview`, {
      method: "POST", headers,
      body: JSON.stringify({ categories: selected, cutoff_date: cutoffDate }),
    });
    if (res.ok) setPreviewResult(await res.json());
  });

  // This is the highest-blast-radius action in the app — a PERMANENT bulk
  // delete. useSubmitOnce's ref-based guard (synchronous, not React state)
  // is what actually closes the double-click/laggy-render window that could
  // otherwise fire this DELETE request twice.
  const [runExecute, executing] = useSubmitOnce(async () => {
    if (confirmText !== "DELETE") return;
    if (previewResult?.requires_extra_warning && !confirmLarge) return;
    const res = await fetch(`${API_BASE}/api/cleanup/execute`, {
      method: "POST", headers,
      body: JSON.stringify({
        categories: selected, cutoff_date: cutoffDate,
        confirm_text: confirmText, confirm_large: confirmLarge,
      }),
    });
    if (res.ok) {
      setExecuteResult(await res.json());
      setShowConfirm(false);
      setConfirmText("");
      setConfirmLarge(false);
      setPreviewResult(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Cleanup failed");
    }
  });

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <PageHeader icon="🗑️" title="Data Cleanup Tool" subtitle="Permanently deletes old records — read the warnings below." />

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold">This tool permanently deletes data. Deletions cannot be undone from the app.</p>
          <p className="mt-1 text-xs">
            The following are <strong>never</strong> deletable here, no matter what: employee/admin records, KYC documents
            (Aadhaar, photo, signature, resume), certificates, and ID card data. This is enforced in the backend, not just hidden from this screen.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5 space-y-5">
        <div>
          <label className="text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] uppercase tracking-wide block mb-2">
            Delete records older than
          </label>
          <input type="date" value={cutoffDate} onChange={(e) => { setCutoffDate(e.target.value); setPreviewResult(null); }} className={`${field} max-w-xs`} />
        </div>

        <div>
          <label className="text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] uppercase tracking-wide block mb-2">
            Categories
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label key={cat.key} className="flex items-start gap-3 p-3 rounded-xl border border-[#E2D8C2] dark:border-white/15 cursor-pointer hover:bg-[#FBF7EE] dark:hover:bg-white/5">
                <input type="checkbox" checked={selected.includes(cat.key)} onChange={() => toggleCategory(cat.key)} className="mt-0.5 rounded" />
                <div>
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{cat.label}</p>
                  {cat.note && <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{cat.note}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={runPreview} disabled={!cutoffDate || selected.length === 0 || previewing} variant="outline">
          {previewing ? "Checking..." : "Preview"}
        </Button>

        {previewResult && (
          <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">This will affect:</h4>
            <div className="space-y-1.5 mb-3">
              {Object.values(previewResult.results).map((r) => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#2A364B]/70 dark:text-[#8E99AC]">{r.label}</span>
                  <span className="font-mono font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{r.count}</span>
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Total: {previewResult.total} record(s)</p>

            {previewResult.requires_extra_warning && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 mb-3">
                This affects 1000+ records — you'll need an extra confirmation step to proceed.
              </div>
            )}

            {previewResult.total > 0 && (
              <Button onClick={() => setShowConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white">
                Delete {previewResult.total} Record(s)…
              </Button>
            )}
          </div>
        )}

        {executeResult && (
          <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={16} /> <h4 className="text-sm font-semibold">Cleanup complete</h4>
            </div>
            <div className="space-y-1.5">
              {Object.values(executeResult.results).map((r) => (
                <div key={r.label} className="text-xs text-[#2A364B]/70 dark:text-[#8E99AC]">
                  {r.label}: <strong>{r.deleted}</strong> deleted
                  {r.backup_key ? ` (backed up)` : r.deleted > 0 ? " (not backed up — R2 not configured)" : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PortalModal open={showConfirm} onOpenChange={(v) => { setShowConfirm(v); if (!v) { setConfirmText(""); setConfirmLarge(false); } }} title="Confirm permanent deletion" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-[#2A364B]/70 dark:text-[#8E99AC]">
            You're about to permanently delete <strong>{previewResult?.total}</strong> record(s). A backup will be saved automatically before deletion, where possible.
          </p>
          <div>
            <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">Type <strong>DELETE</strong> to confirm</label>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={field} placeholder="DELETE" />
          </div>
          {previewResult?.requires_extra_warning && (
            <label className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 cursor-pointer">
              <input type="checkbox" checked={confirmLarge} onChange={(e) => setConfirmLarge(e.target.checked)} className="mt-0.5" />
              I understand this deletes 1000+ records and cannot be undone from the app.
            </label>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={confirmText !== "DELETE" || (previewResult?.requires_extra_warning && !confirmLarge) || executing}
              onClick={runExecute}
            >
              {executing ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </PortalModal>
    </PortalLayout>
  );
}
