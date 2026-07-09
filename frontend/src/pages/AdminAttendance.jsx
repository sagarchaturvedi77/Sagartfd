import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import DataTable from "../components/portal/DataTable";
import StatusBadge from "../components/portal/StatusBadge";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

  const summaryColumns = [
    {
      key: "employee_name", label: "Employee",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {s.employee_name?.charAt(0)}
          </div>
          <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{s.employee_name}</span>
        </div>
      ),
    },
    {
      key: "present_days", label: "Present Days",
      render: (s) => <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">{s.present_days}</span>,
    },
    {
      key: "half_days", label: "Half Days",
      render: (s) => <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-medium">{s.half_days}</span>,
    },
    { key: "total_hours", label: "Total Hours", render: (s) => <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{s.total_hours}h</span> },
    {
      key: "actions", label: "Actions",
      render: (s) => (
        <button onClick={() => showDetail(s.employee_id, s.employee_name)} className="text-[#024396] dark:text-[#7CB0FF] hover:underline text-xs font-medium">
          View Details
        </button>
      ),
    },
  ];

  const recordColumns = [
    { key: "date", label: "Date", render: (r) => <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{r.date}</span> },
    { key: "clock_in", label: "Clock In", render: (r) => r.clock_in ? new Date(r.clock_in).toLocaleTimeString() : "-" },
    { key: "clock_out", label: "Clock Out", render: (r) => r.clock_out ? new Date(r.clock_out).toLocaleTimeString() : "-" },
    { key: "total_hours", label: "Hours", render: (r) => r.total_hours ? `${r.total_hours}h` : "-" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <PortalLayout>
      <PageHeader
        icon="🕐"
        title="Attendance Tracker"
        subtitle="Monitor team attendance and working hours"
        actions={
          <>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-2 text-sm bg-white">
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-3 py-2 text-sm bg-white">
              {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {view === "detail" && (
              <button onClick={() => setView("summary")} className="text-sm text-[#024396] dark:text-[#7CB0FF] hover:underline ml-2">
                Back to Summary
              </button>
            )}
          </>
        }
      />

      {view === "summary" ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2D8C2] dark:border-white/10 bg-[#FBF7EE]/50 dark:bg-white/5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Monthly Summary — {MONTH_NAMES[month - 1]} {year}</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-[#2A364B]/50 dark:text-[#8E99AC]">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#024396]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Loading...
            </div>
          ) : (
            <DataTable columns={summaryColumns} rows={summary} keyField="employee_id" emptyTitle="No attendance records for this month" />
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2D8C2] dark:border-white/10 bg-[#FBF7EE]/50 dark:bg-white/5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{selectedEmp} — Daily Records</h3>
          </div>
          <DataTable columns={recordColumns} rows={records} emptyTitle="No records found" />
        </div>
      )}
    </PortalLayout>
  );
}
