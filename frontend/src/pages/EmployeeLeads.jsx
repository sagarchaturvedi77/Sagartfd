import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};
const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700", contacted: "bg-yellow-100 text-yellow-700",
  follow_up: "bg-orange-100 text-orange-700", interested: "bg-purple-100 text-purple-700",
  converted: "bg-emerald-100 text-emerald-700", lost: "bg-red-100 text-red-700",
};
const STATUS_OPTIONS = ["new", "contacted", "follow_up", "interested", "converted", "lost"];

export default function EmployeeLeads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // lead id being updated
  const [statusForm, setStatusForm] = useState({ status: "", follow_up_note: "", follow_up_date: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, { headers });
      if (res.ok) setLeads(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openUpdate = (lead) => {
    setUpdating(lead.id);
    setStatusForm({ status: lead.status, follow_up_note: "", follow_up_date: "" });
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/api/leads/${updating}/status`, {
      method: "POST", headers,
      body: JSON.stringify(statusForm),
    });
    setUpdating(null);
    load();
  };

  const statCounts = {};
  leads.forEach(l => { statCounts[l.status] = (statCounts[l.status] || 0) + 1; });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">My Leads</h2>
          <p className="text-xs text-[#2A364B]/50">Leads assigned to you — update status & follow up</p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map(s => (
            <div key={s} className="shrink-0 bg-white rounded-xl border border-[#E2D8C2] px-4 py-2 text-center min-w-[80px]">
              <p className="text-lg font-bold text-[#0E1B2C]">{statCounts[s] || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 uppercase">{STATUS_LABELS[s]}</p>
            </div>
          ))}
        </div>

        {/* Status update modal */}
        {updating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-semibold text-[#0E1B2C] mb-4">Update Lead Status</h3>
              <form onSubmit={submitStatus} className="space-y-3">
                <select value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <textarea placeholder="Follow-up note (optional)" rows={3} value={statusForm.follow_up_note}
                  onChange={(e) => setStatusForm({ ...statusForm, follow_up_note: e.target.value })}
                  className="w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 resize-none" />
                <input type="date" value={statusForm.follow_up_date}
                  onChange={(e) => setStatusForm({ ...statusForm, follow_up_date: e.target.value })}
                  className="w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setUpdating(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lead cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No leads assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#0E1B2C]">{lead.name}</p>
                    <p className="text-xs text-[#2A364B]/50">{lead.phone} {lead.city ? `· ${lead.city}` : ""}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[lead.status] || lead.status}
                  </span>
                </div>

                {lead.service_interest && (
                  <p className="text-xs text-[#024396] bg-[#024396]/5 px-2 py-1 rounded-lg inline-block">{lead.service_interest}</p>
                )}

                {lead.follow_up_note && (
                  <div className="bg-[#FBF7EE] rounded-xl p-3 text-xs text-[#2A364B]/70">
                    <span className="text-[10px] uppercase tracking-wider text-[#2A364B]/40 block mb-0.5">Last Note</span>
                    {lead.follow_up_note}
                  </div>
                )}

                {lead.follow_up_date && (
                  <p className="text-[10px] text-[#2A364B]/50">Follow-up: {lead.follow_up_date}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => openUpdate(lead)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] transition-all">
                    Update Status
                  </button>
                  <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0"
                    title="WhatsApp">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
