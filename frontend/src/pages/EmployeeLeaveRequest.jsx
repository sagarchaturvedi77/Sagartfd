import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const STATUS_COLOR = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };
const LEAVE_TYPES = [
  { value: "casual",   label: "Casual Leave" },
  { value: "sick",     label: "Sick Leave" },
  { value: "earned",   label: "Earned Leave" },
  { value: "half_day", label: "Half Day" },
  { value: "wfh",      label: "Work From Home" },
  { value: "other",    label: "Other" },
];

export default function EmployeeLeaveRequest() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leave_type: "casual", from_date: "", to_date: "", reason: "", half_day_session: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/leaves/my`, { headers });
    if (res.ok) setLeaves(await res.json());
    setLoading(false);
  }, [token]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date) return alert("Please select dates.");
    setSubmitting(true);
    const body = { leave_type: form.leave_type, from_date: form.from_date, to_date: form.to_date, reason: form.reason || null };
    if (form.leave_type === "half_day") body.half_day_session = form.half_day_session || "morning";
    const res = await fetch(`${API_BASE}/api/leaves/`, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) {
      setForm({ leave_type: "casual", from_date: "", to_date: "", reason: "", half_day_session: "" });
      setShowForm(false);
      load();
    } else {
      alert("Failed to apply. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <PortalLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif text-[#0E1B2C]">🌴 My Leaves</h1>
          <button onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580]">
            {showForm ? "Cancel" : "+ Apply Leave"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-[#0E1B2C]">Apply for Leave</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]">
                  {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.leave_type === "half_day" && (
                <div>
                  <label className="text-xs text-[#2A364B]/60 block mb-1">Session</label>
                  <select value={form.half_day_session} onChange={(e) => setForm({ ...form, half_day_session: e.target.value })}
                    className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]">
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">From Date</label>
                <input type="date" required value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 block mb-1">To Date</label>
                <input type="date" required value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  min={form.from_date}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#2A364B]/60 block mb-1">Reason (optional)</label>
              <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Brief reason for leave…"
                className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396] resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580] disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit Leave Request"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-center text-[#2A364B]/50 py-8">Loading…</p>
        ) : leaves.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No leave requests yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {leaves.map((lv) => (
              <div key={lv.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#0E1B2C] text-sm">{LEAVE_TYPES.find((t) => t.value === lv.leave_type)?.label || lv.leave_type}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[lv.status]}`}>{lv.status}</span>
                  </div>
                  <p className="text-xs text-[#2A364B]/60">{lv.from_date} → {lv.to_date}</p>
                  {lv.reason && <p className="text-xs text-[#2A364B]/50 mt-0.5">{lv.reason}</p>}
                  {lv.admin_note && <p className="text-xs text-[#024396] mt-0.5 italic">Admin: {lv.admin_note}</p>}
                </div>
                <p className="text-[10px] text-[#2A364B]/40">{new Date(lv.created_at).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
