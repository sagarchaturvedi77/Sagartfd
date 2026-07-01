import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const STATUS_COLOR = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-serif text-[#0E1B2C]">🌴 Leave Requests</h1>
          <div className="flex gap-2">
            {["pending", "approved", "rejected", ""].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? "bg-[#024396] text-white" : "bg-white border border-[#E2D8C2] text-[#2A364B]/60"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#2A364B]/50 py-10 text-center">Loading…</p>
        ) : leaves.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No {filter} leave requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {leaves.map((lv) => (
              <div key={lv.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#0E1B2C]">{lv.employee_name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[lv.status]}`}>{lv.status}</span>
                    </div>
                    <p className="text-sm text-[#024396] font-medium">{LEAVE_LABEL[lv.leave_type] || lv.leave_type}</p>
                    <p className="text-xs text-[#2A364B]/60">{lv.from_date} → {lv.to_date}{lv.half_day_session && ` (${lv.half_day_session})`}</p>
                    {lv.reason && <p className="text-xs text-[#2A364B]/70 mt-1">Reason: {lv.reason}</p>}
                    {lv.admin_note && <p className="text-xs text-[#2A364B]/50 italic">Admin note: {lv.admin_note}</p>}
                    <p className="text-[10px] text-[#2A364B]/40">{new Date(lv.created_at).toLocaleDateString("en-IN")}</p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                    {lv.status === "pending" && (
                      <>
                        <input
                          placeholder="Admin note (optional)"
                          value={actionNote[lv.id] || ""}
                          onChange={(e) => setActionNote((p) => ({ ...p, [lv.id]: e.target.value }))}
                          className="text-xs border border-[#E2D8C2] rounded-lg px-2 py-1.5 outline-none"
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
                      className="w-full py-1 rounded-lg text-xs text-[#2A364B]/40 hover:text-red-400 hover:bg-red-50 border border-[#E2D8C2]">
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
