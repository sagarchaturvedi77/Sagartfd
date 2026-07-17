import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { apiGet, apiSend } from "../portal/api";
import { useAuth } from "../context/AuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

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

const TRACK_LABELS = {
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  hr: "HR",
};

const STATUS_STYLES = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  graduated: "bg-violet-50 text-violet-700 border-violet-200",
  banned: "bg-red-50 text-red-700 border-red-200",
  dropped: "bg-slate-100 text-slate-600 border-slate-200",
};

const TABS = [
  { key: "students", label: "Students" },
  { key: "tasks", label: "Task Pool" },
  { key: "submissions", label: "Submissions" },
];

export default function AdminInternship() {
  const [tab, setTab] = useState("students");

  return (
    <PortalLayout>
      <PageHeader title="TFD Internship" subtitle="Manage the gamified internship program — students, tasks, and submissions." />

      <div className="flex gap-1.5 mb-4 border-b border-[#E2D8C2] dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-[#024396] text-[#024396] dark:text-[#7CB0FF] dark:border-[#7CB0FF]"
                : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC] hover:text-[#0E1B2C] dark:hover:text-[#F1EDE3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "students" && <StudentsTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "submissions" && <SubmissionsTab />}
    </PortalLayout>
  );
}

// ── Students ──────────────────────────────────────────────────────────

function StudentsTab() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [warnTarget, setWarnTarget] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [gradTarget, setGradTarget] = useState(null);
  const [gradCheck, setGradCheck] = useState(null);
  const [gradLoading, setGradLoading] = useState(false);
  const [gradForce, setGradForce] = useState(false);
  const [gradBusy, setGradBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStudents(await apiGet("/api/internship/admin/students"));
    } catch (e) {
      toast.error(e.message || "Failed to load students");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // markPaid/submitWarn/submitBan/unban all shared one `busyId` state
  // already (single-flight across the whole table, not per-row) — this ref
  // preserves that exact behavior while closing the double-click race
  // window a state-only check can't.
  const actionInFlightRef = useRef(false);

  const markPaid = async (id) => {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setBusyId(id);
    try {
      await apiSend(`/api/internship/admin/students/${id}/payment`, "PATCH", {});
      toast.success("Marked as paid — Day 1 has started for this student.");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to update payment status");
    }
    actionInFlightRef.current = false;
    setBusyId(null);
  };

  const submitWarn = async () => {
    if (actionInFlightRef.current) return;
    if (!reason.trim()) return toast.error("Please enter a reason.");
    actionInFlightRef.current = true;
    setBusyId(warnTarget.id);
    try {
      await apiSend(`/api/internship/admin/students/${warnTarget.id}/warn`, "PATCH", { reason });
      toast.success("Warning issued.");
      setWarnTarget(null); setReason("");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to warn student");
    }
    actionInFlightRef.current = false;
    setBusyId(null);
  };

  const submitBan = async () => {
    if (actionInFlightRef.current) return;
    if (!reason.trim()) return toast.error("Please enter a reason.");
    actionInFlightRef.current = true;
    setBusyId(banTarget.id);
    try {
      await apiSend(`/api/internship/admin/students/${banTarget.id}/ban`, "PATCH", { reason });
      toast.success("Student banned from the program.");
      setBanTarget(null); setReason("");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to ban student");
    }
    actionInFlightRef.current = false;
    setBusyId(null);
  };

  const unban = async (id) => {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setBusyId(id);
    try {
      await apiSend(`/api/internship/admin/students/${id}/unban`, "PATCH", {});
      toast.success("Student reinstated.");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to unban student");
    }
    actionInFlightRef.current = false;
    setBusyId(null);
  };

  const openGraduate = async (s) => {
    setGradTarget(s);
    setGradCheck(null);
    setGradForce(false);
    setGradLoading(true);
    try {
      setGradCheck(await apiGet(`/api/internship/admin/students/${s.id}/graduation-check`));
    } catch (e) {
      toast.error(e.message || "Failed to check graduation eligibility");
    }
    setGradLoading(false);
  };

  const confirmGraduate = async () => {
    if (gradBusy) return;
    setGradBusy(true);
    try {
      await apiSend(`/api/internship/admin/students/${gradTarget.id}/graduate`, "POST", { force: gradForce });
      toast.success("Student graduated — certificate issued.");
      setGradTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to graduate student");
    }
    setGradBusy(false);
  };

  const [downloadCertificate, downloadingCert] = useSubmitOnce(async (certificateId, name) => {
    try {
      const res = await fetch(`${API_BASE}/api/certificates/${certificateId}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) await downloadBlob(res, `Certificate_${name.replace(/\s+/g, "_")}.pdf`);
      else toast.error("Failed to download certificate");
    } catch (e) {
      toast.error("Failed to download certificate");
    }
  });

  return (
    <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E2D8C2] dark:border-white/10">
        <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Student Roster ({students.length})</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">Loading...</div>
      ) : students.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">No students have signed up yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC] border-b border-[#E2D8C2] dark:border-white/10">
                <th className="px-5 py-2.5 font-semibold">Name</th>
                <th className="px-5 py-2.5 font-semibold">Contact</th>
                <th className="px-5 py-2.5 font-semibold">Track</th>
                <th className="px-5 py-2.5 font-semibold">Duration</th>
                <th className="px-5 py-2.5 font-semibold">Day</th>
                <th className="px-5 py-2.5 font-semibold">Warnings</th>
                <th className="px-5 py-2.5 font-semibold">Video Review</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-[#E2D8C2]/60 dark:border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{s.name}</td>
                  <td className="px-5 py-3 text-xs text-[#2A364B]/70 dark:text-[#C7CEDA]">{s.phone}<br />{s.email}</td>
                  <td className="px-5 py-3 text-xs text-[#024396] dark:text-[#7CB0FF]">{TRACK_LABELS[s.track] || "—"}</td>
                  <td className="px-5 py-3 text-xs">{s.duration_days} days <span className="text-[#2A364B]/40 dark:text-[#8E99AC]/70">(₹{s.payment_amount})</span></td>
                  <td className="px-5 py-3 text-xs">{s.current_day ? `${s.current_day}/${s.duration_days}` : "—"}</td>
                  <td className="px-5 py-3 text-xs">{s.warning_count > 0 ? <span className="text-amber-600 dark:text-amber-400 font-semibold">{s.warning_count}</span> : "—"}</td>
                  <td className="px-5 py-3 text-xs">
                    {s.video_review_url ? (
                      <a href={s.video_review_url} target="_blank" rel="noreferrer" className="text-[#024396] dark:text-[#7CB0FF] hover:underline">
                        {s.video_consent ? "✅ Submitted (can share)" : "🔒 Submitted (private)"}
                      </a>
                    ) : (
                      <span className="text-[#2A364B]/35 dark:text-[#8E99AC]/50">Not submitted</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[s.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {s.payment_status === "pending" && (
                        <button onClick={() => markPaid(s.id)} disabled={busyId === s.id} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white bg-[#024396] hover:bg-[#023580] disabled:opacity-50 whitespace-nowrap">
                          Mark Paid
                        </button>
                      )}
                      {s.status === "banned" ? (
                        <button onClick={() => unban(s.id)} disabled={busyId === s.id} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                          Unban
                        </button>
                      ) : s.status === "graduated" ? (
                        s.certificate_id && (
                          <button onClick={() => downloadCertificate(s.certificate_id, s.name)} disabled={downloadingCert} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 disabled:opacity-50">
                            Certificate
                          </button>
                        )
                      ) : (
                        <>
                          {s.status === "active" && (
                            <button onClick={() => openGraduate(s)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400">
                              Graduate
                            </button>
                          )}
                          <button onClick={() => { setWarnTarget(s); setReason(""); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                            Warn
                          </button>
                          <button onClick={() => { setBanTarget(s); setReason(""); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                            Ban
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PortalModal open={!!warnTarget} onOpenChange={(v) => !v && setWarnTarget(null)} title={`Warn ${warnTarget?.name || ""}`} maxWidth="max-w-sm">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for warning..." className="w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 rounded-lg px-3 py-2 text-sm mb-3" />
        <button onClick={submitWarn} disabled={busyId === warnTarget?.id} className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">Issue Warning</button>
      </PortalModal>

      <PortalModal open={!!banTarget} onOpenChange={(v) => !v && setBanTarget(null)} title={`Ban ${banTarget?.name || ""}`} maxWidth="max-w-sm">
        <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-3">This locks the student out of the program dashboard immediately.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for ban..." className="w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 rounded-lg px-3 py-2 text-sm mb-3" />
        <button onClick={submitBan} disabled={busyId === banTarget?.id} className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">Confirm Ban</button>
      </PortalModal>

      <PortalModal open={!!gradTarget} onOpenChange={(v) => !v && setGradTarget(null)} title={`Graduate ${gradTarget?.name || ""}`} maxWidth="max-w-sm">
        {gradLoading ? (
          <div className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] py-4 text-center">Checking eligibility...</div>
        ) : gradCheck ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#2A364B]/60 dark:text-[#8E99AC]">Program Score</span>
                <span className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{gradCheck.percentage}% <span className="text-[#2A364B]/40 dark:text-[#8E99AC]/70 font-normal">(threshold {gradCheck.threshold}%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F1EB] dark:bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${gradCheck.percentage >= gradCheck.threshold ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, gradCheck.percentage)}%` }} />
              </div>
              <p className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC] mt-1">{gradCheck.earned_points} / {gradCheck.total_points} points earned</p>
            </div>
            <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">Day {gradCheck.current_day} of {gradCheck.duration_days} &middot; {gradCheck.days_completed ? "Duration completed" : "Duration not yet completed"}</p>

            {gradCheck.eligible ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2.5">✅ Eligible — a certificate will be generated and the student's program marked graduated.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2.5">⚠️ {gradCheck.reason}</p>
                <label className="flex items-center gap-1.5 text-xs text-[#2A364B]/70 dark:text-[#C7CEDA]">
                  <input type="checkbox" checked={gradForce} onChange={(e) => setGradForce(e.target.checked)} /> Graduate anyway (admin override)
                </label>
              </div>
            )}

            <button
              onClick={confirmGraduate}
              disabled={gradBusy || (!gradCheck.eligible && !gradForce)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {gradBusy ? "Issuing Certificate..." : "Graduate & Issue Certificate"}
            </button>
          </div>
        ) : (
          <div className="text-sm text-red-600 py-4 text-center">Failed to load eligibility.</div>
        )}
      </PortalModal>
    </div>
  );
}

// ── Task Pool ─────────────────────────────────────────────────────────

const EMPTY_TASK = { track: "finance", title: "", brief: "", instructions: "", why_it_matters: "", deliverable_type: "text_and_photo", requires_geotag: true, points_value: 50, difficulty: "medium", estimated_duration: "", is_active: true };

function TasksTab() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // task object, or {} for new
  const [form, setForm] = useState(EMPTY_TASK);

  const load = useCallback(async () => {
    try {
      setTasks(await apiGet("/api/internship/admin/tasks"));
    } catch (e) {
      toast.error(e.message || "Failed to load tasks");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(EMPTY_TASK); setEditing({}); };
  const openEdit = (t) => { setForm({ ...t }); setEditing(t); };

  const [save, saving] = useSubmitOnce(async () => {
    if (!form.title.trim() || !form.brief.trim()) return toast.error("Title and brief are required.");
    try {
      if (editing?.id) {
        await apiSend(`/api/internship/admin/tasks/${editing.id}`, "PUT", form);
        toast.success("Task updated.");
      } else {
        await apiSend("/api/internship/admin/tasks", "POST", form);
        toast.success("Task created.");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to save task");
    }
  });

  const removeInFlightRef = useRef(new Set());
  const remove = async (id) => {
    if (!window.confirm("Delete this task from the pool?")) return;
    if (removeInFlightRef.current.has(id)) return;
    removeInFlightRef.current.add(id);
    try {
      await apiSend(`/api/internship/admin/tasks/${id}`, "DELETE");
      toast.success("Task deleted.");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to delete task");
    }
    removeInFlightRef.current.delete(id);
  };

  const field = "w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E2D8C2] dark:border-white/10 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Task Pool ({tasks.length})</p>
        <button onClick={openNew} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#024396] hover:bg-[#023580]">+ Add Task</button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">No tasks yet — add one, or run backend/seed_internship_tasks.py.</div>
      ) : (
        <div className="divide-y divide-[#E2D8C2]/60 dark:divide-white/5">
          {tasks.map((t) => (
            <div key={t.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-[#024396] dark:text-[#7CB0FF]">{t.track_label}</span>
                  <span className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/70">&middot; {t.difficulty} &middot; +{t.points_value}pts{t.estimated_duration && ` · ${t.estimated_duration}`}</span>
                  {!t.is_active && <span className="text-[10px] text-red-500 font-semibold">INACTIVE</span>}
                </div>
                <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{t.title}</p>
                <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mt-0.5 line-clamp-2">{t.brief}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(t)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10">Edit</button>
                <button onClick={() => remove(t.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-900/30">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PortalModal open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit Task" : "Add Task"} maxWidth="max-w-lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Track</label>
              <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className={field}>
                {Object.entries(TRACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={field}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Brief (the task prompt)</label>
            <textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} rows={3} className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Instructions (optional)</label>
            <textarea value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Why This Task Matters (optional — shown to the student)</label>
            <textarea placeholder="e.g. This task builds your negotiation skills — useful in any job, not just sales." value={form.why_it_matters || ""} onChange={(e) => setForm({ ...form, why_it_matters: e.target.value })} rows={2} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Deliverable</label>
              <select value={form.deliverable_type} onChange={(e) => setForm({ ...form, deliverable_type: e.target.value })} className={field}>
                <option value="text">Text only</option>
                <option value="photo">Photo only</option>
                <option value="text_and_photo">Text + Photo</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Points</label>
              <input type="number" value={form.points_value} onChange={(e) => setForm({ ...form, points_value: Number(e.target.value) })} className={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Estimated Duration</label>
            <input placeholder="e.g. 20-30 mins, 1-2 hours" value={form.estimated_duration || ""} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} className={field} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={form.requires_geotag} onChange={(e) => setForm({ ...form, requires_geotag: e.target.checked })} /> Field task (GPS required)</label>
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
          </div>
          <button onClick={save} disabled={saving} className="w-full bg-[#024396] hover:bg-[#023580] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 mt-2">
            {saving ? "Saving..." : editing?.id ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </PortalModal>
    </div>
  );
}

// ── Submissions ───────────────────────────────────────────────────────

function SubmissionsTab() {
  const [filter, setFilter] = useState("");
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  // Set-based ref guard (id-keyed, like AdminInvoices' download/share) so a
  // rapid double-click on the SAME submission's Approve/Reject can't fire
  // twice, while other rows' buttons stay independently usable.
  const reviewInFlightRef = useRef(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : "";
      setSubs(await apiGet(`/api/internship/admin/submissions${q}`));
    } catch (e) {
      toast.error(e.message || "Failed to load submissions");
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    if (reviewInFlightRef.current.has(id)) return;
    reviewInFlightRef.current.add(id);
    setBusyId(id);
    try {
      await apiSend(`/api/internship/admin/submissions/${id}/review`, "PATCH", { status, admin_note: noteDraft[id] || "" });
      toast.success(status === "approved" ? "Marked verified." : "Marked not verified.");
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to update submission");
    }
    reviewInFlightRef.current.delete(id);
    setBusyId(null);
  };

  return (
    <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E2D8C2] dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Submissions ({subs.length})</p>
          <p className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC]">Auto-verified on submit — this is an audit log. Use Approve/Reject to override the AI's decision anytime.</p>
        </div>
        <div className="flex gap-1.5">
          {["", "approved", "rejected"].map((f) => (
            <button key={f || "all"} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize ${filter === f ? "bg-[#024396] text-white" : "bg-[#F5F1EB] dark:bg-white/5 text-[#2A364B]/60 dark:text-[#8E99AC]"}`}>
              {f || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">Loading...</div>
      ) : subs.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">Nothing here.</div>
      ) : (
        <div className="divide-y divide-[#E2D8C2]/60 dark:divide-white/5">
          {subs.map((s) => (
            <div key={s.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{s.student_name} <span className="text-[#2A364B]/40 dark:text-[#8E99AC]/70 font-normal">&middot; Week {s.week_number}</span></p>
                  <p className="text-xs text-[#024396] dark:text-[#7CB0FF] mt-0.5">{s.task_title}</p>
                </div>
                <span className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/70">{new Date(s.submitted_at).toLocaleString("en-IN")}</span>
              </div>

              {s.text_answer && <p className="text-xs text-[#2A364B]/80 dark:text-[#C7CEDA] bg-[#F5F1EB] dark:bg-white/5 rounded-lg p-2.5 mt-2 whitespace-pre-wrap">{s.text_answer}</p>}

              {s.photo_url && (
                <a href={s.photo_url} target="_blank" rel="noreferrer" className="inline-block mt-2">
                  <img src={s.photo_url} alt="submission" className="h-28 rounded-lg border border-[#E2D8C2] dark:border-white/10 object-cover" />
                </a>
              )}

              {s.gps && (
                <a
                  href={`https://www.google.com/maps?q=${s.gps.lat},${s.gps.lng}`}
                  target="_blank" rel="noreferrer"
                  className="block text-[11px] text-[#024396] dark:text-[#7CB0FF] mt-2 hover:underline"
                >
                  📍 {s.gps.lat.toFixed(5)}, {s.gps.lng.toFixed(5)} — view on map
                </a>
              )}

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${s.status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                  {s.status === "approved" ? "Verified" : "Not Verified"}
                </span>
                <span className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/70">
                  {s.verified_by === "ai" ? "🤖 Auto-verified" : s.verified_by === "admin" ? "👤 Admin override" : ""}
                </span>
                {s.admin_note && <span className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC]">"{s.admin_note}"</span>}
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  placeholder="Override note (optional)..."
                  value={noteDraft[s.id] || ""}
                  onChange={(e) => setNoteDraft({ ...noteDraft, [s.id]: e.target.value })}
                  className="flex-1 min-w-[160px] border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <button onClick={() => review(s.id, "approved")} disabled={busyId === s.id || s.status === "approved"} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40">Approve</button>
                <button onClick={() => review(s.id, "rejected")} disabled={busyId === s.id || s.status === "rejected"} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
