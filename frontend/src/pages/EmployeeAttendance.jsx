import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import { getCurrentLocation } from "../portal/api";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";
import DataTable from "../components/portal/DataTable";
import StatusBadge from "../components/portal/StatusBadge";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { MapPin } from "lucide-react";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Client-side haversine (meters) for instant popup feedback
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EmployeeAttendance() {
  const { token } = useAuth();
  const now = new Date();
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showConfirm, setShowConfirm] = useState(false);
  const [locStatus, setLocStatus] = useState("checking"); // checking | ok | wrong | denied
  const [locMsg, setLocMsg] = useState("");
  const [confirmedLoc, setConfirmedLoc] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setToday(await res.json());
  }, [token]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await fetch(`${API_BASE}/api/attendance/my-history?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistory(await res.json());
    setHistoryLoading(false);
  }, [token, month, year]);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleClockIn = async () => {
    setShowConfirm(true);
    setLocStatus("checking");
    setLocMsg("");
    setConfirmedLoc(null);

    try {
      const [settRes, loc] = await Promise.all([
        fetch(`${API_BASE}/api/attendance/office-settings`, { headers: { Authorization: `Bearer ${token}` } }),
        getCurrentLocation(),
      ]);
      const office = settRes.ok ? await settRes.json() : { enforce: false };

      if (office.enforce && office.lat != null && office.lng != null) {
        if (!loc) {
          setLocStatus("denied");
          setLocMsg("Location access denied. Please allow location in your browser settings and try again.");
          return;
        }
        const dist = haversineM(loc.lat, loc.lng, office.lat, office.lng);
        if (dist > (office.radius_m || 500)) {
          setLocStatus("wrong");
          setLocMsg(`You are ${Math.round(dist)}m away from office. Allowed range is ${office.radius_m || 500}m. Your punch-in request will be rejected.`);
          return;
        }
      }
      setConfirmedLoc(loc);
      setLocStatus("ok");
      setLocMsg(office.enforce
        ? "✅ You are at the correct location. Confirm to punch in."
        : "Confirm that you are at your work location and want to punch in.");
    } catch {
      setLocStatus("ok");
      setLocMsg("Could not verify location. Confirm to proceed.");
    }
  };

  // useSubmitOnce guards both punch actions against rapid double-tap —
  // a duplicate clock-in/out POST hitting the backend twice from a fast
  // second tap is exactly the kind of double-submit this hook exists to
  // prevent, same as the lead-status-update and PDF-download fixes.
  const [confirmPunchIn, punchingIn] = useSubmitOnce(async () => {
    if (locStatus === "wrong" || locStatus === "denied") {
      setShowConfirm(false);
      return;
    }
    setShowConfirm(false);
    const res = await fetch(`${API_BASE}/api/attendance/clock-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(confirmedLoc || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail?.replace("WRONG_LOCATION: ", "❌ ").replace("LOCATION_REQUIRED: ", "📍 ") || "Punch-in failed.");
    }
    await fetchToday();
    await fetchHistory();
  });

  const [handleClockOut, punchingOut] = useSubmitOnce(async () => {
    const loc = await getCurrentLocation();
    const res = await fetch(`${API_BASE}/api/attendance/clock-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(loc || {}),
    });
    if (res.ok) { await fetchToday(); await fetchHistory(); }
  });

  const actionLoading = punchingIn || punchingOut;

  const hasClockedIn = today && today.clock_in;
  const hasClockedOut = today && today.clock_out;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const presentDays = history.filter((h) => h.status === "present").length;
  const halfDays = history.filter((h) => h.status === "half-day").length;
  const totalHours = history.reduce((sum, h) => sum + (h.total_hours || 0), 0).toFixed(1);

  const historyColumns = [
    { key: "date", label: "Date", render: (r) => <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{r.date}</span> },
    { key: "clock_in", label: "Punch In", render: (r) => r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : "-" },
    { key: "clock_out", label: "Punch Out", render: (r) => r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : "-" },
    { key: "total_hours", label: "Hours", render: (r) => r.total_hours ? `${r.total_hours}h` : "-" },
    { key: "clock_in_location", label: "Location", hideBelow: "lg", render: (r) => <span className="truncate block max-w-[160px]">{r.clock_in_location || "-"}</span> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <PortalLayout>
      <PageHeader icon="🕐" title="Attendance" subtitle="Punch in/out and track your monthly log" />

      {/* Punch-In Confirmation */}
      <PortalModal open={showConfirm} onOpenChange={setShowConfirm} title="Confirm Punch In" maxWidth="max-w-sm">
        {locStatus === "checking" && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 rounded-full border-2 border-[#024396] border-t-transparent animate-spin" />
            <p className="text-sm text-[#2A364B]/70 dark:text-[#C7CEDA]">Checking your location…</p>
          </div>
        )}
        {locStatus === "ok" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-800 dark:text-green-400">
            {locMsg}
          </div>
        )}
        {locStatus === "wrong" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
            ❌ {locMsg}
          </div>
        )}
        {locStatus === "denied" && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-sm text-orange-700 dark:text-orange-400">
            📍 {locMsg}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
          {locStatus === "ok" && (
            <Button className="flex-1 bg-[#024396] hover:bg-[#023580]" onClick={confirmPunchIn} disabled={punchingIn}>
              {punchingIn ? "Punching In..." : "Yes, Punch In"}
            </Button>
          )}
          {(locStatus === "wrong" || locStatus === "denied") && (
            <Button variant="destructive" className="flex-1" onClick={() => setShowConfirm(false)}>OK, Got it</Button>
          )}
        </div>
      </PortalModal>

      {/* Clock In/Out Card */}
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center sm:text-left flex-1">
            <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wider mb-1">Today's Status</p>
            <p className="text-3xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {hasClockedIn && (
              <div className="flex items-center gap-4 mt-2 text-sm text-[#2A364B]/70 dark:text-[#C7CEDA] flex-wrap">
                <span>Punch In: <b className="text-emerald-600 dark:text-emerald-400">{new Date(today.clock_in).toLocaleTimeString()}</b></span>
                {hasClockedOut && (
                  <span>Punch Out: <b className="text-red-500 dark:text-red-400">{new Date(today.clock_out).toLocaleTimeString()}</b></span>
                )}
                {today.total_hours && <span>Hours: <b className="text-[#024396] dark:text-[#7CB0FF]">{today.total_hours}h</b></span>}
              </div>
            )}
            {today?.clock_in_location && (
              <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <MapPin size={13} /> {today.clock_in_location}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {!hasClockedIn ? (
              <button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    Punch In
                  </span>
                )}
              </button>
            ) : !hasClockedOut ? (
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Punch Out
                  </span>
                )}
              </button>
            ) : (
              <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-2xl px-8 py-4 text-center">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Day Complete</p>
                <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{today.total_hours}h logged</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Present Days" value={presentDays} color="green" />
        <StatCard label="Half Days" value={halfDays} color="amber" />
        <StatCard label="Total Hours" value={`${totalHours}h`} color="navy" />
      </div>

      {/* History */}
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2D8C2] dark:border-white/10 flex items-center justify-between bg-[#FBF7EE]/50 dark:bg-white/5">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Attendance History</h3>
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Select month" className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-xs bg-white">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Select year" className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 text-xs bg-white">
              {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <DataTable columns={historyColumns} rows={history} loading={historyLoading} emptyTitle="No attendance records for this month" />
      </div>
    </PortalLayout>
  );
}
