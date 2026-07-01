import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminAttendance() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState([]);
  const [records, setRecords] = useState([]);
  const [view, setView] = useState("summary");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/attendance/summary?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSummary(await res.json());
    setLoading(false);
  }, [token, month, year]);

  const fetchRecords = useCallback(async (empId) => {
    const url = `${API_BASE}/api/attendance/all?month=${month}&year=${year}${empId ? `&employee_id=${empId}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRecords(await res.json());
  }, [token, month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const showDetail = async (empId, empName) => {
    setSelectedEmp(empName);
    setView("detail");
    await fetchRecords(empId);
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <PortalLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Attendance Tracker</h2>
          <p className="text-xs text-[#2A364B]/50">Monitor team attendance and working hours</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#E2D8C2] rounded-lg px-3 py-2 text-sm bg-white">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {view === "detail" && (
            <button onClick={() => setView("summary")} className="text-sm text-[#024396] hover:underline ml-2">
              Back to Summary
            </button>
          )}
        </div>
      </div>

      {view === "summary" ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2D8C2] bg-[#FBF7EE]/50">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">Monthly Summary — {monthNames[month - 1]} {year}</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-[#2A364B]/50">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Loading...
            </div>
          ) : summary.length === 0 ? (
            <div className="p-12 text-center text-[#2A364B]/40 text-sm">No attendance records for this month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FBF7EE]/50">
                    <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Employee</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Present Days</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Half Days</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Total Hours</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.employee_id} className="border-t border-[#E2D8C2]/50 hover:bg-[#FBF7EE]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold">
                            {s.employee_name?.charAt(0)}
                          </div>
                          <span className="font-medium text-[#0E1B2C]">{s.employee_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">{s.present_days}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">{s.half_days}</span>
                      </td>
                      <td className="p-4 text-center font-medium text-[#0E1B2C]">{s.total_hours}h</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => showDetail(s.employee_id, s.employee_name)}
                          className="text-[#024396] hover:underline text-xs font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2D8C2] bg-[#FBF7EE]/50">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">{selectedEmp} — Daily Records</h3>
          </div>
          {records.length === 0 ? (
            <div className="p-12 text-center text-[#2A364B]/40 text-sm">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FBF7EE]/50">
                    <th className="text-left p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Date</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Clock In</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Clock Out</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Hours</th>
                    <th className="text-center p-4 text-xs font-semibold text-[#2A364B]/60 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-[#E2D8C2]/50">
                      <td className="p-4 font-medium text-[#0E1B2C]">{r.date}</td>
                      <td className="p-4 text-center text-[#2A364B]/70">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : "-"}</td>
                      <td className="p-4 text-center text-[#2A364B]/70">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : "-"}</td>
                      <td className="p-4 text-center font-medium">{r.total_hours ? `${r.total_hours}h` : "-"}</td>
                      <td className="p-4 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}

function StatusBadge({ status }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-700",
    "half-day": "bg-amber-50 text-amber-700",
    absent: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
