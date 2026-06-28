import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "holiday", label: "Holiday" },
  { value: "task", label: "Task" },
  { value: "general", label: "General Update" },
];

export default function AdminAnnounce() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("announcement");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null); // {type, text}

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, body, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not send");
      }
      const data = await res.json();
      setMsg({ type: "ok", text: `Sent to ${data.recipients} employee(s).` });
      setTitle(""); setBody("");
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSending(false);
    }
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Announce</h2>
          <p className="text-xs text-[#2A364B]/50">Send a notification to all employees</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office closed on Monday" className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Message</label>
              <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Details of the announcement..." className={`${field} resize-none`} />
            </div>
            {msg && (
              <p className={`text-sm ${msg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
            )}
            <button type="submit" disabled={sending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25 disabled:opacity-60">
              {sending ? "Sending..." : "Send to All Employees"}
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
