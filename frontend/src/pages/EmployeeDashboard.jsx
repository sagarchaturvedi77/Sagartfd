import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { getCurrentLocation } from "../portal/api";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [activeWidgets, setActiveWidgets] = useState([]);
  const [today, setToday] = useState(null);
  const [targets, setTargets] = useState([]);
  const [history, setHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  const syncCustomWidgets = useCallback(() => {
    const storageKey = `dashboard_widgets_${user?.id}_employee`;
    const defaultWidgets = ["attendance", "targets", "tasks", "salary", "leaves", "leads", "chat", "announce", "id_card", "profile"];
    try {
      const saved = localStorage.getItem(storageKey);
      setActiveWidgets(saved ? JSON.parse(saved) : defaultWidgets);
    } catch {
      setActiveWidgets(defaultWidgets);
    }
  }, [user?.id]);

  const fetchProfileStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile-status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfileStatus(data);
        if (!data.profile_completed) navigate("/portal/employee/onboarding");
      }
    } catch { /* silent */ }
  }, [token, navigate]);

  const fetchToday = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/today`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setToday(await res.json());
  }, [token]);

  const fetchTargets = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/targets/my?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTargets(await res.json());
  }, [token, month, year]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/my-history?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setHistory(await res.json());
  }, [token, month, year]);

  useEffect(() => {
    syncCustomWidgets();
    fetchProfileStatus();
    fetchToday();
    fetchTargets();
    fetchHistory();

    window.addEventListener("storage", syncCustomWidgets);
    const dashboardTimerRef = setInterval(syncCustomWidgets, 1000);
    
    return () => {
      window.removeEventListener("storage", syncCustomWidgets);
      clearInterval(dashboardTimerRef);
    };
  }, [syncCustomWidgets, fetchProfileStatus, fetchToday, fetchTargets, fetchHistory]);

  const punch = async (action) => {
    setActionLoading(true);
    const loc = await getCurrentLocation();
    const res = await fetch(`${API_BASE}/api/attendance/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(loc || {}),
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

  const renderWidget = (id) => {
    switch (id) {
      case "attendance":
        return (
          <div key="attendance" className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] rounded-2xl p-6 text-white shadow-lg col-span-2 sm:col-span-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today's Shift</p>
                <p className="text-xl font-serif">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                {hasClockedIn && (
                  <p className="text-sm text-white/60 mt-1">
                    Punched in at {new Date(today.clock_in).toLocaleTimeString()}
                    {hasClockedOut && ` — Out at ${new Date(today.clock_out).toLocaleTimeString()}`}
                  </p>
                )}
              </div>
              <div>
                {!hasClockedIn ? (
                  <button onClick={() => punch("clock-in")} disabled={actionLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all">
                    {actionLoading ? "Locating..." : "Punch In"}
                  </button>
                ) : !hasClockedOut ? (
                  <button onClick={() => punch("clock-out")} disabled={actionLoading} className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all">
                    {actionLoading ? "Locating..." : "Punch Out"}
                  </button>
                ) : (
                  <span className="bg-white/10 px-6 py-3 rounded-xl text-sm font-medium">Day Complete — {today.total_hours}h</span>
                )}
              </div>
            </div>
          </div>
        );
      case "targets":
        return currentTarget && (
          <div key="targets" className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm col-span-2 sm:col-span-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#0E1B2C]">Monthly Target Progress</h3>
              <span className="text-sm font-bold text-[#024396]">{currentTarget.progress_pct}%</span>
            </div>
            <div className="h-3 bg-[#E2D8C2]/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#024396] to-[#0356c4]" style={{ width: `${Math.min(currentTarget.progress_pct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[#2A364B]/50 mt-2">
              <span>{formatCurrency(currentTarget.achieved_amount)} achieved</span>
              <span>{formatCurrency(currentTarget.target_amount)} target</span>
            </div>
          </div>
        );
      case "tasks":
        return (
          <div key="tasks" className="grid grid-cols-2 sm:grid-cols-4 gap-4 col-span-2 sm:col-span-4">
            <QuickCard label="Present Days" value={presentDays} sub="this month" onClick={() => navigate("/portal/employee/attendance")} />
            <QuickCard label="Total Hours" value={`${totalHours}h`} sub="this month" onClick={() => navigate("/portal/employee/attendance")} />
            <QuickCard label="Target Progress" value={currentTarget ? `${currentTarget.progress_pct}%` : "-"} sub={currentTarget ? currentTarget.target_type : "No target set"} onClick={() => navigate("/portal/employee/targets")} />
            <QuickCard label="Target Amount" value={currentTarget ? formatCurrency(currentTarget.target_amount) : "-"} sub={currentTarget ? `Achieved: ${formatCurrency(currentTarget.achieved_amount)}` : ""} onClick={() => navigate("/portal/employee/targets")} />
          </div>
        );
      case "salary":
      case "leaves":
      case "leads":
      case "chat":
      case "announce":
      case "id_card":
      case "profile":
        return (
          <div key={id} className="bg-white rounded-2xl border border-[#E2D8C2] p-4 shadow-sm min-h-[90px] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#0E1B2C] uppercase tracking-wider">{id.replace("_", " ")} Block</span>
            <span className="text-xs text-[#5C677D]">Operational details synced. Click to navigate.</span>
            <button onClick={() => navigate(`/portal/employee/${id === 'id_card' ? 'id-card' : id}`)} style={{ background: "none", border: "none", color: "#024396", fontSize: 11, textAlign: "left", cursor: "pointer", fontWeight: "bold", padding: 0 }}>View Section →</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PortalLayout>
      {profileStatus?.training_days > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-orange-800">You are on Training Period</p>
            <p className="text-xs text-orange-600">{profileStatus.training_days} days training — only login days count</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
        {activeWidgets.map(id => renderWidget(id))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => navigate("/portal/employee/attendance")} className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">📅</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">Attendance History</h4>
              <p className="text-xs text-[#2A364B]/50">View your daily log summary</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/portal/employee/targets")} className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#024396]">🎯</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">My Targets & Analytics</h4>
              <p className="text-xs text-[#2A364B]/50">Track monthly performance metrics</p>
            </div>
          </div>
        </button>
      </div>
    </PortalLayout>
  );
}

function QuickCard({ label, value, sub, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 transition-all">
      <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-[#0E1B2C] truncate">{value}</p>
      {sub && <p className="text-[10px] text-[#2A364B]/40 mt-0.5 truncate">{sub}</p>}
    </button>
  );
}