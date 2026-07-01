import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import { getCurrentLocation } from "../portal/api";

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
  const [actionLoading, setActionLoading] = useState(false);
  // ── Confirmation popup ─────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [locStatus, setLocStatus] = useState("checking"); // checking | ok | wrong | denied
  const [locMsg, setLocMsg] = useState("");
  const [confirmedLoc, setConfirmedLoc] = useState(null);

  const fetchToday = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setToday(await res.json());
  }, [token]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/attendance/my-history?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setHistory(await res.json());
  }, [token, month, year]);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Punch In: open popup + check location ─────────────────────
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

      if (office.enforce && office.lat && office.lng) {
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

  const confirmPunchIn = async () => {
    if (locStatus === "wrong" || locStatus === "denied") {
      setShowConfirm(false);
      return;
    }
    setShowConfirm(false);
    setActionLoading(true);
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
    setActionLoading(false);
  };

  // ── Punch Out: no confirmation popup needed ───────────────────
  const handleClockOut = async () => {
    setActionLoading(true);
    const loc = await getCurrentLocation();
    const res = await fetch(`${API_BASE}/api/attendance/clock-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(loc || {}),
    });
    if (res.ok) { await fetchToday(); await fetchHistory(); }
    setActionLoading(false);
  };

  const hasClockedIn = today && today.clock_in;
  const hasClockedOut = today && today.clock_out;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const presentDays = history.filter(h => h.status === "present").length;
  const halfDays = history.filter(h => h.status === "half-day").length;
  const totalHours = history.reduce((sum, h) => sum + (h.total_hours || 0), 0).toFixed(1);

  return (
    <PortalLayout>
      {/* ── Punch-In Confirmation Popup ─────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-[#0E1B2C]">Confirm Punch In</h3>

            {locStatus === "checking" && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 rounded-full border-2 border-[#024396] border-t-transparent animate-spin" />
                <p className="text-sm text-[#2A364B]/70">Checking your location…</p>
              </div>
            )}

            {locStatus === "ok" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                {locMsg}
              </div>
            )}

            {locStatus === "wrong" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                ❌ {locMsg}
              </div>
            )}

            {locStatus === "denied" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
                📍 {locMsg}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl text-sm border border-[#E2D8C2] text-[#2A364B]/60 hover:bg-[#F5F1EB]">
                Cancel
              </button>
              {locStatus === "ok" && (
                <button onClick={confirmPunchIn}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580]">
                  Yes, Punch In
                </button>
              )}
              {(locStatus === "wrong" || locStatus === "denied") && (
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">
                  OK, Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clock In/Out Card */}
      <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Clock display */}
          <div className="text-center sm:text-left flex-1">
            <p className="text-xs text-[#2A364B]/50 uppercase tracking-wider mb-1">Today's Status</p>
            <p className="text-3xl font-serif text-[#0E1B2C] mb-1">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {hasClockedIn && (
              <div className="flex items-center gap-4 mt-2 text-sm text-[#2A364B]/70">
                <span>Punch In: <b className="text-emerald-600">{new Date(today.clock_in).toLocaleTimeString()}</b></span>
                {hasClockedOut && (
                  <span>Punch Out: <b className="text-red-500">{new Date(today.clock_out).toLocaleTimeString()}</b></span>
                )}
                {today.total_hours && <span>Hours: <b className="text-[#024396]">{today.total_hours}h</b></span>}
              </div>
            )}
            {today?.clock_in_location && (
              <p className="text-xs text-[#2A364B]/50 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {today.clock_in_location}
              </p>
            )}
          </div>

          {/* Action button */}
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
              <div className="bg-[#FBF7EE] rounded-2xl px-8 py-4 text-center">
                <p className="text-sm font-semibold text-emerald-600">Day Complete</p>
                <p className="text-xs text-[#2A364B]/50">{today.total_hours}h logged</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-center">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Present Days</p>
          <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-center">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Half Days</p>
          <p className="text-2xl font-bold text-amber-600">{halfDays}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-center">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-[#024396]">{totalHours}h</p>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2D8C2] flex items-center justify-between bg-[#FBF7EE]/50">
          <h3 className="text-sm font-semibold text-[#0E1B2C]">Attendance History</h3>
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-2 py-1.5 text-xs bg-white">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-2 py-1.5 text-xs bg-white">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center text-[#2A364B]/40 text-sm">No attendance records for this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]/30">
                  <th className="text-left p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Date</th>
                  <th className="text-center p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Punch In</th>
                  <th className="text-center p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Punch Out</th>
                  <th className="text-center p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Hours</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Location</th>
                  <th className="text-center p-3 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-t border-[#E2D8C2]/50">
                    <td className="p-3 font-medium text-[#0E1B2C]">{r.date}</td>
                    <td className="p-3 text-center text-[#2A364B]/70">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : "-"}</td>
                    <td className="p-3 text-center text-[#2A364B]/70">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : "-"}</td>
                    <td className="p-3 text-center font-medium">{r.total_hours ? `${r.total_hours}h` : "-"}</td>
                    <td className="p-3 text-left text-xs text-[#2A364B]/60 max-w-[160px] truncate">{r.clock_in_location || "-"}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status === "present" ? "bg-emerald-50 text-emerald-700" :
                        r.status === "half-day" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
