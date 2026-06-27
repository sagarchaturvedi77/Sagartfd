import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [today, setToday] = useState(null);
  const [targets, setTargets] = useState([]);
  const [history, setHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchToday = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setToday(await res.json());
  }, [token]);

  const fetchTargets = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/targets/my?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTargets(await res.json());
  }, [token, month, year]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/my-history?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistory(await res.json());
  }, [token, month, year]);

  useEffect(() => { fetchToday(); fetchTargets(); fetchHistory(); }, [fetchToday, fetchTargets, fetchHistory]);

  const handleClockIn = async () => {
    setActionLoading(true);
    const res = await fetch(`${API_BASE}/api/attendance/clock-in`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { await fetchToday(); await fetchHistory(); }
    setActionLoading(false);
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    const res = await fetch(`${API_BASE}/api/attendance/clock-out`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { await fetchToday(); await fetchHistory(); }
    setActionLoading(false);
  };

  const hasClockedIn = today && today.clock_in;
  const hasClockedOut = today && today.clock_out;
  const currentTarget = targets[0];
  const presentDays = history.filter(h => h.status === "present").length;
  const totalHours = history.reduce((sum, h) => sum + (h.total_hours || 0), 0).toFixed(1);
  const formatCurrency = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <PortalLayout>
      {/* Quick attendance action */}
      <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today</p>
            <p className="text-xl font-serif">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {hasClockedIn && (
              <p className="text-sm text-white/60 mt-1">
                Clocked in at {new Date(today.clock_in).toLocaleTimeString()}
                {hasClockedOut && ` — Out at ${new Date(today.clock_out).toLocaleTimeString()}`}
              </p>
            )}
          </div>
          <div>
            {!hasClockedIn ? (
              <button onClick={handleClockIn} disabled={actionLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-60">
                {actionLoading ? "Processing..." : "Clock In"}
              </button>
            ) : !hasClockedOut ? (
              <button onClick={handleClockOut} disabled={actionLoading}
                className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all disabled:opacity-60">
                {actionLoading ? "Processing..." : "Clock Out"}
              </button>
            ) : (
              <span className="bg-white/10 px-6 py-3 rounded-xl text-sm font-medium">Day Complete — {today.total_hours}h</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <QuickCard label="Present Days" value={presentDays} sub="this month" onClick={() => navigate("/portal/employee/attendance")} />
        <QuickCard label="Total Hours" value={`${totalHours}h`} sub="this month" onClick={() => navigate("/portal/employee/attendance")} />
        <QuickCard
          label="Target Progress"
          value={currentTarget ? `${currentTarget.progress_pct}%` : "-"}
          sub={currentTarget ? currentTarget.target_type : "No target set"}
          onClick={() => navigate("/portal/employee/targets")}
        />
        <QuickCard
          label="Target Amount"
          value={currentTarget ? formatCurrency(currentTarget.target_amount) : "-"}
          sub={currentTarget ? `Achieved: ${formatCurrency(currentTarget.achieved_amount)}` : ""}
          onClick={() => navigate("/portal/employee/targets")}
        />
      </div>

      {/* Target progress bar (if exists) */}
      {currentTarget && (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">Monthly Target Progress</h3>
            <span className={`text-sm font-bold ${
              currentTarget.progress_pct >= 100 ? "text-emerald-600" :
              currentTarget.progress_pct >= 50 ? "text-[#024396]" : "text-amber-600"
            }`}>{currentTarget.progress_pct}%</span>
          </div>
          <div className="h-3 bg-[#E2D8C2]/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                currentTarget.progress_pct >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                currentTarget.progress_pct >= 50 ? "bg-gradient-to-r from-[#024396] to-[#0356c4]" :
                "bg-gradient-to-r from-amber-400 to-amber-500"
              }`}
              style={{ width: `${Math.min(currentTarget.progress_pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#2A364B]/50 mt-2">
            <span>{formatCurrency(currentTarget.achieved_amount)} achieved</span>
            <span>{formatCurrency(currentTarget.target_amount)} target</span>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => navigate("/portal/employee/attendance")}
          className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">Attendance History</h4>
              <p className="text-xs text-[#2A364B]/50">View your daily attendance log</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/portal/employee/targets")}
          className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#024396] group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">My Targets & Analytics</h4>
              <p className="text-xs text-[#2A364B]/50">Track your monthly performance</p>
            </div>
          </div>
        </button>
      </div>
    </PortalLayout>
  );
}

function QuickCard({ label, value, sub, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 hover:shadow-md transition-all">
      <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-[#0E1B2C] truncate">{value}</p>
      {sub && <p className="text-[10px] text-[#2A364B]/40 mt-0.5 truncate">{sub}</p>}
    </button>
  );
}
