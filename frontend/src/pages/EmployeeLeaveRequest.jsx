import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/portal/PageHeader";
import StatusBadge from "../components/portal/StatusBadge";
import EmptyState from "../components/portal/EmptyState";
import { Button } from "../components/ui/button";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
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

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396] dark:focus:border-[#7CB0FF]";

  return (
    <PortalLayout>
      <div className="space-y-5">
        <PageHeader
          icon="🌴"
          title="My Leaves"
          subtitle="Apply for leave and track approval status"
          actions={
            <Button onClick={() => setShowForm((v) => !v)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {showForm ? "Cancel" : "+ Apply Leave"}
            </Button>
          }
        />

        {showForm && (
          <form onSubmit={submit} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Apply for Leave</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className={field}>
                  {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.leave_type === "half_day" && (
                <div>
                  <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">Session</label>
                  <select value={form.half_day_session} onChange={(e) => setForm({ ...form, half_day_session: e.target.value })} className={field}>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">From Date</label>
                <input type="date" required value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} className={field} />
              </div>
              <div>
                <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">To Date</label>
                <input type="date" required value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  min={form.from_date} className={field} />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] block mb-1">Reason (optional)</label>
              <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Brief reason for leave…" className={`${field} resize-none`} />
            </div>
            <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {submitting ? "Submitting…" : "Submit Leave Request"}
            </Button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
            <EmptyState icon="🌴" title="No leave requests yet." />
          </div>
        ) : (
          <div className="grid gap-3">
            {leaves.map((lv) => (
              <div key={lv.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] text-sm">{LEAVE_TYPES.find((t) => t.value === lv.leave_type)?.label || lv.leave_type}</p>
                    <StatusBadge status={lv.status} />
                  </div>
                  <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{lv.from_date} → {lv.to_date}</p>
                  {lv.reason && <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/70 mt-0.5">{lv.reason}</p>}
                  {lv.admin_note && <p className="text-xs text-[#024396] dark:text-[#7CB0FF] mt-0.5 italic">Admin: {lv.admin_note}</p>}
                </div>
                <p className="text-[10px] text-[#2A364B]/40 dark:text-[#8E99AC]/60">{new Date(lv.created_at).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
