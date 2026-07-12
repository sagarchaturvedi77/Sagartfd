import React, { useState, useEffect } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import ProtectedText from "./portal/ProtectedText";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

export default function TransferLeadModal({ lead, token, onClose, onSaved }) {
  const [employees, setEmployees] = useState([]);
  const [toEmployee, setToEmployee] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/employees`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEmployees(data.filter((e) => e.id !== lead.assigned_to)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!toEmployee) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${lead.id}/transfer`, {
        method: "POST", headers,
        body: JSON.stringify({ to_employee_id: toEmployee, reference_note: note || null }),
      });
      if (res.ok) { onSaved?.(); onClose(); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-[16px] text-[#0E1B2C] flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-[#024396]" /> Transfer Lead
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={16} /></button>
        </div>
        <p className="text-[12px] text-[#2A364B]/50 mb-4">{lead.name} · <ProtectedText>{lead.phone}</ProtectedText></p>

        <form onSubmit={submit} className="space-y-3">
          <select value={toEmployee} onChange={(e) => setToEmployee(e.target.value)} className={field} required>
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}{e.designation ? ` — ${e.designation}` : ""}</option>
            ))}
          </select>
          <textarea
            rows={3}
            placeholder="Reference note — e.g. why you're transferring, what was discussed, if the client referred someone…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${field} resize-none`}
          />
          <button type="submit" disabled={saving || !toEmployee} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396] disabled:opacity-50">
            {saving ? "Transferring…" : "Transfer Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}
