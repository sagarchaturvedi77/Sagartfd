import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeTargets() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [achieved, setAchieved] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/targets/my?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTargets(await res.json());
    setLoading(false);
  }, [token, month, year]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formatCurrency = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const currentTarget = targets[0];

  const openForm = () => {
    setAchieved(currentTarget ? String(currentTarget.achieved_amount || "") : "");
    setNote(currentTarget?.note || "");
    setMsg("");
    setShowForm(true);
  };

  const submitProgress = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/targets/my/${currentTarget.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ achieved_amount: Number(achieved), note: note || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Update failed");
      }
      await fetchTargets();
      setShowForm(false);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">My Targets</h2>
          <p className="text-xs text-[#2A364B]/50">Track your monthly performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-12 text-center text-[#2A364B]/50 shadow-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Loading...
        </div>
      ) : !currentTarget ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-12 text-center shadow-sm">
          <svg className="w-12 h-12 mx-auto mb-3 text-[#2A364B]/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <p className="text-[#2A364B]/40 text-sm">No target set for {monthNames[month - 1]} {year}.</p>
          <p className="text-[#2A364B]/30 text-xs mt-1">Your admin will set your monthly target.</p>
        </div>
      ) : (
        <>
          {/* Main progress card */}
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6 sm:p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-xs text-[#2A364B]/50 uppercase tracking-wider mb-2">{monthNames[month - 1]} {year} Target</p>
              <p className="text-sm text-[#2A364B]/60 mb-1">{currentTarget.target_type}</p>
            </div>

            {/* Circular progress indicator */}
            <div className="flex justify-center mb-6">
              <div className="relative w-44 h-44">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 176 176">
                  <circle cx="88" cy="88" r="78" stroke="#E2D8C2" strokeWidth="12" fill="none" />
                  <circle
                    cx="88" cy="88" r="78"
                    stroke={currentTarget.progress_pct >= 100 ? "#10b981" : currentTarget.progress_pct >= 50 ? "#024396" : "#f59e0b"}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(currentTarget.progress_pct, 100) * 4.9} 490`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${
                    currentTarget.progress_pct >= 100 ? "text-emerald-600" :
                    currentTarget.progress_pct >= 50 ? "text-[#024396]" : "text-amber-600"
                  }`}>
                    {currentTarget.progress_pct}%
                  </span>
                  <span className="text-xs text-[#2A364B]/50">Achieved</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FBF7EE] rounded-xl p-4 text-center">
                <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Achieved</p>
                <p className="text-xl font-bold text-[#024396]">{formatCurrency(currentTarget.achieved_amount)}</p>
              </div>
              <div className="bg-[#FBF7EE] rounded-xl p-4 text-center">
                <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Target</p>
                <p className="text-xl font-bold text-[#0E1B2C]">{formatCurrency(currentTarget.target_amount)}</p>
              </div>
            </div>

            {/* Remaining */}
            {currentTarget.progress_pct < 100 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-[#2A364B]/60">
                  Remaining: <b className="text-[#0E1B2C]">{formatCurrency(currentTarget.target_amount - currentTarget.achieved_amount)}</b>
                </p>
              </div>
            )}

            {currentTarget.note && (
              <div className="mt-4 bg-[#FBF7EE] rounded-xl p-3 text-sm text-[#2A364B]/70">
                <span className="text-[10px] uppercase tracking-wider text-[#2A364B]/40 block mb-0.5">Last update note</span>
                {currentTarget.note}
              </div>
            )}

            {/* Self-update */}
            <div className="mt-6 pt-6 border-t border-[#E2D8C2]">
              {!showForm ? (
                <button
                  onClick={openForm}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25"
                >
                  Update My Progress
                </button>
              ) : (
                <form onSubmit={submitProgress} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Total achieved amount (₹)</label>
                    <input
                      type="number" min="0" required value={achieved}
                      onChange={(e) => setAchieved(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Work details / note (optional)</label>
                    <textarea
                      rows={3} value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What did you achieve? e.g. Closed 3 SIPs, 1 insurance policy..."
                      className="w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 resize-none"
                    />
                  </div>
                  {msg && <p className="text-sm text-red-600">{msg}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2] hover:bg-[#F5F1EB] transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 transition-all disabled:opacity-60">
                      {saving ? "Saving..." : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* All targets history */}
          {targets.length > 1 && (
            <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2D8C2] bg-[#FBF7EE]/50">
                <h3 className="text-sm font-semibold text-[#0E1B2C]">Previous Targets</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FBF7EE]/30">
                      <th className="text-left p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Period</th>
                      <th className="text-left p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Type</th>
                      <th className="text-right p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Target</th>
                      <th className="text-right p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Achieved</th>
                      <th className="text-right p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.slice(1).map((t) => (
                      <tr key={t.id} className="border-t border-[#E2D8C2]/50">
                        <td className="p-3 font-medium text-[#0E1B2C]">{monthNames[t.month - 1]} {t.year}</td>
                        <td className="p-3 text-[#2A364B]/70">{t.target_type}</td>
                        <td className="p-3 text-right text-[#2A364B]/70">{formatCurrency(t.target_amount)}</td>
                        <td className="p-3 text-right text-[#2A364B]/70">{formatCurrency(t.achieved_amount)}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            t.progress_pct >= 100 ? "bg-emerald-50 text-emerald-700" :
                            t.progress_pct >= 50 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                          }`}>{t.progress_pct}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
}
