import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Pencil, Trash2, Save, X, Calendar } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function StudentReport() {
  const { token } = useInternshipAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ date: todayStr(), what_learned: "", what_did: "" });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/reports`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEntries(await res.json());
    } catch {
      // best-effort — the form below still works even if the list fails to load
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ date: todayStr(), what_learned: "", what_did: "" });
    setEditingId(null);
  };

  const startEdit = (entry) => {
    setForm({ date: entry.date, what_learned: entry.what_learned, what_did: entry.what_did });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent requests, same pattern as CallFlowPopup /
  // EmployeeAgreement / EmployeeAttendance.
  const [save, saving] = useSubmitOnce(async () => {
    if (!form.what_learned.trim() && !form.what_did.trim()) {
      toast.error("Write at least one of the two fields before saving.");
      return;
    }
    try {
      const url = editingId ? `${API_BASE}/api/internship/reports/${editingId}` : `${API_BASE}/api/internship/reports`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not save");
      toast.success(editingId ? "Entry updated!" : "Entry saved!");
      resetForm();
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  });

  // No guard existed before — added fresh since this fires a DELETE call
  // that a rapid double-click/tap could otherwise send twice.
  const [remove, removing] = useSubmitOnce(async (id) => {
    if (!window.confirm("Delete this report entry?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/internship/reports/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not delete");
      toast.success("Entry deleted.");
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  });

  return (
    <StudentLayout activeKey="missions">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><NotebookPen size={22} className="text-[#14E0A0]" /> My Internship Report</h1>
          <p className="text-white/45 text-sm mt-1">Log what you learned and did each day — this builds into your final report automatically.</p>
        </div>

        <div className="rounded-2xl border border-[#14E0A0]/25 bg-white/[0.03] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{editingId ? "Editing Entry" : "Add Today's Entry"}</p>
            {editingId && (
              <button onClick={resetForm} className="flex items-center gap-1 text-xs text-white/40 hover:text-white">
                <X size={13} /> Cancel edit
              </button>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5"><Calendar size={12} /> Date</label>
            <input
              type="date"
              value={form.date}
              max={todayStr()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#14E0A0]/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">What did you learn today?</label>
            <textarea
              value={form.what_learned}
              onChange={(e) => setForm({ ...form, what_learned: e.target.value })}
              rows={3}
              placeholder="e.g. Today I learned how to read a company's balance sheet and what current ratio means..."
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">What did you do today?</label>
            <textarea
              value={form.what_did}
              onChange={(e) => setForm({ ...form, what_did: e.target.value })}
              rows={3}
              placeholder="e.g. I completed the Break-Even Point Calculation task and started researching for tomorrow's field visit..."
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            <Save size={14} /> {saving ? "Saving..." : editingId ? "Update Entry" : "Save Entry"}
          </button>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-3">Your Report So Far ({entries.length} {entries.length === 1 ? "entry" : "entries"})</p>

          {loading ? (
            <p className="text-white/40 text-sm">Loading...</p>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/35 text-sm">
              No entries yet — add your first one above.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-bold text-[#14E0A0]">{fmtDate(e.date)}</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(e)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => remove(e.id)} disabled={removing} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 disabled:opacity-50">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {e.what_learned && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide">Learned</p>
                      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{e.what_learned}</p>
                    </div>
                  )}
                  {e.what_did && (
                    <div>
                      <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wide">Did</p>
                      <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{e.what_did}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
