import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/portal/PageHeader";
import StatusBadge from "../components/portal/StatusBadge";
import EmptyState from "../components/portal/EmptyState";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const LEAVE_LABEL = { casual: "Casual Leave", sick: "Sick Leave", earned: "Earned Leave", half_day: "Half Day", wfh: "Work From Home", other: "Other" };

export default function AdminLeaveManagement() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState({});
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/leaves/${filter ? `?status=${filter}` : ""}`, { headers });
    if (res.ok) setLeaves(await res.json());
    setLoading(false);
  }, [token, filter]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await fetch(`${API_BASE}/api/leaves/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ status, admin_note: actionNote[id] || null }),
    });
    setActionNote((prev) => { const n = { ...prev }; delete n[id]; return n; });
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this leave record?")) return;
    await fetch(`${API_BASE}/api/leaves/${id}`, { method: "DELETE", headers });
    load();
  };

  return (
    <PortalLayout>
      <div className="space-y-5">
        <PageHeader
          icon="🌴"
          title="Leave Requests"
          subtitle="Review and action employee leave applications"
          actions={
            <div className="flex gap-2 flex-wrap">
              {["pending", "approved", "rejected", ""].map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === s ? "bg-[#024396] dark:bg-[#4C8DFF] text-white" : "bg-white dark:bg-white/5 border border-[#E2D8C2] dark:border-white/10 text-[#2A364B]/60 dark:text-[#8E99AC]"}`}>
                  {s || "All"}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
            <EmptyState icon="🌴" title={`No ${filter || ""} leave requests.`} />
          </div>
        ) : (
          <div className="grid gap-4">
            {leaves.map((lv) => (
              <div key={lv.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{lv.employee_name}</p>
                      <StatusBadge status={lv.status} />
                    </div>
                    <p className="text-sm text-[#024396] dark:text-[#7CB0FF] font-medium">{LEAVE_LABEL[lv.leave_type] || lv.leave_type}</p>
                    <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{lv.from_date} → {lv.to_date}{lv.half_day_session && ` (${lv.half_day_session})`}</p>
                    {lv.reason && <p className="text-xs text-[#2A364B]/70 dark:text-[#8E99AC] mt-1">Reason: {lv.reason}</p>}
                    {lv.admin_note && <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/70 italic">Admin note: {lv.admin_note}</p>}
                    <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/60">{new Date(lv.created_at).toLocaleDateString("en-IN")}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                    {lv.status === "pending" && (
                      <>
                        <input
                          placeholder="Admin note (optional)"
                          value={actionNote[lv.id] || ""}
                          onChange={(e) => setActionNote((p) => ({ ...p, [lv.id]: e.target.value }))}
                          className="text-xs border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2 py-1.5 outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(lv.id, "approved")}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700">
                            ✓ Approve
                          </button>
                          <button onClick={() => updateStatus(lv.id, "rejected")}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600">
                            ✗ Reject
                          </button>
                        </div>
                      </>
                    )}
                    <button onClick={() => del(lv.id)}
                      className="w-full py-1 rounded-lg text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-[#E2D8C2] dark:border-white/10">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
