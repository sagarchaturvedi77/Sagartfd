import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import EmployeeTasks from "./EmployeeTasks";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatTargetValue(t) {
  if (t.unit === "count") return `${t.target_amount % 1 === 0 ? t.target_amount : t.target_amount.toFixed(1)} ${t.target_type}`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(t.target_amount);
}
function formatAchievedValue(t) {
  if (t.unit === "count") return `${t.achieved_amount % 1 === 0 ? t.achieved_amount : t.achieved_amount.toFixed(1)}`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(t.achieved_amount);
}

export default function EmployeeTargets() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const [tab, setTab] = useState("targets"); // targets | tasks
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(searchParams.get("report") === "1");

  const [updateTarget, setUpdateTarget] = useState(null);
  const [achieved, setAchieved] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  // Re-check on every searchParams change, not just on mount — a
  // notification click can navigate an already-open portal tab to this
  // same route client-side (see clients.openWindow in web-push-sw.js),
  // which wouldn't re-run the useState initializer above.
  useEffect(() => {
    if (searchParams.get("report") === "1") setShowReport(true);
  }, [searchParams]);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/targets/my?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTargets(await res.json());
    setLoading(false);
  }, [token, month, year]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);

  const openUpdate = (t) => {
    setUpdateTarget(t);
    setAchieved(String(t.achieved_amount || ""));
    setNote(t.note || "");
    setMsg("");
  };

  const [submitProgress, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/targets/my/${updateTarget.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achieved_amount: Number(achieved), note: note || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Update failed");
      }
      await fetchTargets();
      setUpdateTarget(null);
    } catch (err) {
      setMsg(err.message);
    }
  });

  return (
    <PortalLayout>
      <PageHeader
        icon="🎯"
        title="My Targets"
        subtitle="Track your monthly performance"
        actions={tab === "targets" && (
          <>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#101D2E]">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#101D2E]">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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

      {/* My Progress Report — opened from the weekly/monthly digest notification's link (?report=1) */}
      <PortalModal
        open={showReport}
        onOpenChange={(v) => { setShowReport(v); if (!v) { searchParams.delete("report"); setSearchParams(searchParams, { replace: true }); } }}
        title="My Progress Report"
        description={`${monthNames[month - 1]} ${year}`}
        maxWidth="max-w-md"
      >
        {targets.length === 0 ? (
          <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC] text-center py-4">No targets set for this month yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#F5F1EB] dark:bg-white/5 rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC]">Overall Average</p>
              <p className="text-3xl font-bold text-[#024396] dark:text-[#7CB0FF] mt-1">
                {Math.round(targets.reduce((s, t) => s + t.progress_pct, 0) / targets.length)}%
              </p>
            </div>
            {targets.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b border-[#E2D8C2] dark:border-white/10 pb-2">
                <span className="text-[#0E1B2C] dark:text-[#F1EDE3]">{t.target_type}</span>
                <span className={`font-semibold ${t.progress_pct >= 100 ? "text-emerald-600 dark:text-emerald-400" : t.progress_pct >= 50 ? "text-[#024396] dark:text-[#7CB0FF]" : "text-amber-600 dark:text-amber-400"}`}>
                  {formatAchievedValue(t)} / {formatTargetValue(t)} ({t.progress_pct}%)
                </span>
              </div>
            ))}
          </div>
        )}
        <Button className="w-full mt-4 bg-gradient-to-r from-[#024396] to-[#0356c4]" onClick={() => { setShowReport(false); searchParams.delete("report"); setSearchParams(searchParams, { replace: true }); }}>
          Close
        </Button>
      </PortalModal>

      {/* Self-update modal */}
      <PortalModal
        open={!!updateTarget}
        onOpenChange={(v) => !v && setUpdateTarget(null)}
        title="Update My Progress"
        description={updateTarget ? `${updateTarget.target_type} — target ${formatTargetValue(updateTarget)}` : ""}
        maxWidth="max-w-sm"
      >
        <form onSubmit={submitProgress} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC]/70 mb-1">
              {updateTarget?.unit === "count" ? "Total achieved (count)" : "Total achieved amount (₹)"}
            </label>
            <input
              type="number" min="0" required value={achieved}
              onChange={(e) => setAchieved(e.target.value)}
              placeholder={updateTarget?.unit === "count" ? "e.g. 3" : "e.g. 500000"}
              className="w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC]/70 mb-1">Work details / note (optional)</label>
            <textarea
              rows={3} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you achieve? e.g. Closed 3 SIPs, 1 insurance policy..."
              className="w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 resize-none"
            />
          </div>
          {msg && <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setUpdateTarget(null)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600">
              {saving ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </PortalModal>

      {tab === "tasks" ? (
        <EmployeeTasks wrapInLayout={false} />
      ) : loading ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-12 text-center text-[#2A364B]/50 dark:text-[#8E99AC]/50 shadow-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396] dark:text-[#7CB0FF]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Loading...
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
          <EmptyState icon="🎯" title={`No target set for ${monthNames[month - 1]} ${year}`} subtitle="Your admin will set your monthly target(s)." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((t) => (
            <div key={t.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{t.target_type}</span>
                <span className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/40">{monthNames[t.month - 1]} {t.year}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#2A364B]/60 dark:text-[#8E99AC]/60">Progress</span>
                  <span className={`font-bold ${t.progress_pct >= 100 ? "text-emerald-600 dark:text-emerald-400" : t.progress_pct >= 50 ? "text-[#024396] dark:text-[#7CB0FF]" : "text-amber-600 dark:text-amber-400"}`}>
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

              <div className="flex justify-between text-xs text-[#2A364B]/70 dark:text-[#8E99AC]/70 mb-1">
                <span>Achieved: <b className="text-[#0E1B2C] dark:text-[#F1EDE3]">{formatAchievedValue(t)}</b></span>
                <span>Target: <b className="text-[#0E1B2C] dark:text-[#F1EDE3]">{formatTargetValue(t)}</b></span>
              </div>

              {t.target_description && (
                <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]/60 bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2 mt-2">{t.target_description}</p>
              )}
              {t.note && (
                <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50 mt-2">
                  <span className="uppercase tracking-wider text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/40 block mb-0.5">Last update</span>
                  {t.note}
                </p>
              )}

              <button
                onClick={() => openUpdate(t)}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-md shadow-[#024396]/20"
              >
                Update My Progress
              </button>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
