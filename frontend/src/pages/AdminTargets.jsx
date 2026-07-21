import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import AdminTasks from "./AdminTasks";
import PageHeader from "../components/portal/PageHeader";
import { Trash2 } from "lucide-react";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Matches how targets actually get handed out here — a mix of count-based
// goals (do 5 SIPs, open 10 Demat accounts) and amount-based goals (₹15,000
// revenue, ₹X brokerage) rather than everything forced into one ₹ figure.
const TARGET_TYPES = ["SIP", "Lumpsum", "Insurance", "Demat Account", "Course", "Brokerage", "Revenue", "Mixed", "Custom"];
const UNITS = [
  { value: "amount", label: "Amount (₹)" },
  { value: "count", label: "Count (number of X)" },
];

function formatTargetValue(t) {
  if (t.unit === "count") return `${t.target_amount % 1 === 0 ? t.target_amount : t.target_amount.toFixed(1)} ${t.target_type}`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(t.target_amount);
}
function formatAchievedValue(t) {
  if (t.unit === "count") return `${t.achieved_amount % 1 === 0 ? t.achieved_amount : t.achieved_amount.toFixed(1)}`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(t.achieved_amount);
}

export default function AdminTargets() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const [tab, setTab] = useState("targets"); // targets | tasks
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", target_amount: "", unit: "amount", target_type: "SIP", target_description: "" });
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/targets/all?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTargets(await res.json());
      } else {
        toast.error("Could not load targets.");
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, month, year]);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/auth/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEmployees(await res.json());
  }, [token]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Deep-link from a notification: ?targetId=... expands that target's row.
  useEffect(() => {
    const targetId = searchParams.get("targetId");
    if (!targetId || !targets.length) return;
    if (targets.some((t) => t.id === targetId)) {
      setTab("targets");
      setViewId(targetId);
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("targetId"); return next; }, { replace: true });
    }
  }, [searchParams, targets, setSearchParams]);

  const [handleSetTarget, settingTarget] = useSubmitOnce(async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/targets/set`, {
      method: "POST", headers,
      body: JSON.stringify({
        ...form,
        month,
        year,
        target_amount: form.target_amount ? Number(form.target_amount) : 0,
        target_description: form.target_description || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ employee_id: "", target_amount: "", unit: "amount", target_type: "SIP", target_description: "" });
      fetchTargets();
    }
  });

  const [handleUpdateProgress, updatingProgress] = useSubmitOnce(async (targetId) => {
    const res = await fetch(`${API_BASE}/api/targets/${targetId}/progress`, {
      method: "PATCH", headers,
      body: JSON.stringify({ achieved_amount: Number(editAmt) }),
    });
    if (res.ok) {
      setEditId(null);
      setEditAmt("");
      fetchTargets();
    }
  });

  const [handleDeleteTarget, deletingTarget] = useSubmitOnce(async (targetId) => {
    if (!window.confirm("Remove this target?")) return;
    const res = await fetch(`${API_BASE}/api/targets/${targetId}`, { method: "DELETE", headers });
    if (res.ok) fetchTargets();
  });

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const field = "w-full border border-[#E2D8C2] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  // Grouped by employee so admin sees "this person has these N targets this
  // month" at a glance, rather than a flat grid mixing everyone together.
  const grouped = targets.reduce((acc, t) => {
    (acc[t.employee_id] = acc[t.employee_id] || { name: t.employee_name, items: [] }).items.push(t);
    return acc;
  }, {});

  return (
    <PortalLayout>
      <PageHeader
        icon="🎯"
        title="Monthly Targets"
        subtitle="Set and track employee targets — amount or custom goals"
        actions={tab === "targets" && (
          <>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#101D2E]">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#101D2E]">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showForm ? "bg-[#2A364B]/10 text-[#2A364B] dark:text-[#8E99AC]" : "bg-[#024396] text-white shadow-md shadow-[#024396]/20"
              }`}
            >
              {showForm ? "Cancel" : "+ Add Target"}
            </button>
          </>
        )}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2D8C2] dark:border-white/10 mb-6">
        {[["targets", "🎯 Targets"], ["tasks", "✅ Tasks"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === key ? "border-[#024396] dark:border-[#4C8DFF] text-[#024396] dark:text-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC]/50 hover:text-[#2A364B] dark:hover:text-[#F1EDE3]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "tasks" && <AdminTasks wrapInLayout={false} />}

      {tab === "targets" && (
        <>
      {showForm && (
        <form onSubmit={handleSetTarget} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Add a target for {monthNames[month - 1]} {year}</h3>
          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50 mb-4">
            An employee can have several targets in the same month — e.g. "5 SIPs" and "₹15,000 revenue" and "3 courses" as separate goals.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className={field}>
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            <select value={form.target_type} onChange={e => setForm({...form, target_type: e.target.value})} className={field}>
              {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className={field}>
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
            <input type="number" placeholder={form.unit === "count" ? "e.g. 5" : "e.g. 15000"} value={form.target_amount}
              onChange={e => setForm({...form, target_amount: e.target.value})}
              className={field} />
            <textarea placeholder="Description / notes (optional)" rows={2}
              value={form.target_description} onChange={e => setForm({...form, target_description: e.target.value})}
              className={`${field} resize-none sm:col-span-2`} />
          </div>
          <button type="submit" disabled={settingTarget} className="mt-4 bg-[#024396] text-white py-2.5 px-8 rounded-xl text-sm font-medium hover:bg-[#023580] shadow-md shadow-[#024396]/20 disabled:opacity-50">
            {settingTarget ? "Adding..." : "Add Target"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-12 text-center text-[#2A364B]/50 dark:text-[#8E99AC]/50 shadow-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396] dark:text-[#7CB0FF]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Loading...
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-12 text-center text-[#2A364B]/40 dark:text-[#8E99AC]/40 text-sm shadow-sm">
          No targets set for {monthNames[month - 1]} {year}. Click "+ Add Target" to add one.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([empId, group]) => (
            <div key={empId}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold">
                  {group.name?.charAt(0)}
                </div>
                <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{group.name}</h3>
                <span className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/40">{group.items.length} target{group.items.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{t.target_type}</span>
                      <div className="flex items-center gap-2">
                        {(t.details || t.note || t.target_description) && (
                          <button onClick={() => setViewId(viewId === t.id ? null : t.id)} className="text-[10px] text-[#024396] dark:text-[#7CB0FF] hover:underline">
                            {viewId === t.id ? "Hide" : "Details"}
                          </button>
                        )}
                        <button onClick={() => handleDeleteTarget(t.id)} disabled={deletingTarget} className="text-[#2A364B]/30 dark:text-[#8E99AC]/40 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {t.target_description && (
                      <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2 mb-3">
                        <p className="text-xs text-[#2A364B]/80 dark:text-[#8E99AC]/80">{t.target_description}</p>
                      </div>
                    )}

                    {t.target_amount > 0 && (
                      <>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#2A364B]/60 dark:text-[#8E99AC]/60">Progress</span>
                            <span className={`font-bold ${t.progress_pct >= 100 ? "text-emerald-600" : t.progress_pct >= 50 ? "text-[#024396] dark:text-[#7CB0FF]" : "text-amber-600"}`}>
                              {t.progress_pct}%
                            </span>
                          </div>
                          <div className="h-2.5 bg-[#E2D8C2]/50 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                t.progress_pct >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                t.progress_pct >= 50 ? "bg-gradient-to-r from-[#024396] to-[#0356c4]" :
                                "bg-gradient-to-r from-amber-400 to-amber-500"
                              }`}
                              style={{ width: `${Math.min(t.progress_pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-[#2A364B]/70 dark:text-[#8E99AC]/70 mb-3">
                          <span>Achieved: <b className="text-[#0E1B2C] dark:text-[#F1EDE3]">{formatAchievedValue(t)}</b></span>
                          <span>Target: <b className="text-[#0E1B2C] dark:text-[#F1EDE3]">{formatTargetValue(t)}</b></span>
                        </div>
                      </>
                    )}

                    {viewId === t.id && (t.details || t.note) && (
                      <div className="bg-[#F5F1EB] dark:bg-white/5 rounded-lg p-3 mb-3 text-xs text-[#2A364B]/70 dark:text-[#8E99AC]/70 space-y-1">
                        {t.note && <p><strong>Note:</strong> {t.note}</p>}
                        {t.details && <p><strong>Work Details:</strong> {t.details}</p>}
                      </div>
                    )}

                    {editId === t.id ? (
                      <div className="flex gap-2">
                        <input type="number" placeholder="Achieved" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                          className="flex-1 border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-1.5 text-sm" />
                        <button onClick={() => handleUpdateProgress(t.id)} disabled={updatingProgress} className="bg-[#024396] text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">{updatingProgress ? "Saving..." : "Save"}</button>
                        <button onClick={() => setEditId(null)} className="text-[#2A364B]/50 dark:text-[#8E99AC]/50 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(t.id); setEditAmt(String(t.achieved_amount)); }}
                        className="w-full text-center text-xs text-[#024396] dark:text-[#7CB0FF] hover:underline font-medium py-1">
                        Update Progress
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </PortalLayout>
  );
}
