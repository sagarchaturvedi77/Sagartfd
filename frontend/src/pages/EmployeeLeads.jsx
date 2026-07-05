import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import CallFlowPopup from "../components/CallFlowPopup";
import TransferLeadModal from "../components/TransferLeadModal";
import WhatsAppTemplateModal from "../components/WhatsAppTemplateModal";
import useCallReturn from "../hooks/useCallReturn";
import { Phone, MessageCircle, ArrowRightLeft, Search, Plus, X, History, MessageSquarePlus } from "lucide-react";

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
const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

export default function EmployeeLeads() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [outcomeLead, setOutcomeLead] = useState(null);   // triggers CallFlowPopup
  const [transferLead, setTransferLead] = useState(null); // triggers TransferLeadModal
  const [waLead, setWaLead] = useState(null);              // triggers WhatsAppTemplateModal
  const [addingLead, setAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", city: "", service_interest: "", reference_note: "" });
  const [noteFor, setNoteFor] = useState(null);
  const [noteText, setNoteText] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, { headers });
      if (res.ok) setLeads(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Fires automatically once the employee returns from tapping a tel: link
  const { startCall } = useCallReturn((lead) => setOutcomeLead(lead));

  const runGlobalSearch = async (q) => {
    setGlobalSearch(q);
    if (q.trim().length < 3) { setGlobalResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/search?phone=${encodeURIComponent(q.trim())}`, { headers });
      if (res.ok) setGlobalResults(await res.json());
    } finally {
      setSearching(false);
    }
  };

  const submitNewLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) return;
    const res = await fetch(`${API_BASE}/api/leads/my`, {
      method: "POST", headers, body: JSON.stringify(newLead),
    });
    if (res.ok) {
      setAddingLead(false);
      setNewLead({ name: "", phone: "", city: "", service_interest: "", reference_note: "" });
      load();
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`${API_BASE}/api/leads/${noteFor.id}/note`, {
      method: "POST", headers, body: JSON.stringify({ note: noteText.trim() }),
    });
    if (res.ok) { setNoteFor(null); setNoteText(""); load(); }
  };

  const statCounts = {};
  leads.forEach((l) => { statCounts[l.status] = (statCounts[l.status] || 0) + 1; });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">My Leads</h2>
            <p className="text-xs text-[#2A364B]/50">Leads assigned to you — call, update outcome & follow up</p>
          </div>
          <button
            onClick={() => setAddingLead(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#024396] hover:bg-[#023580] rounded-xl px-4 py-2.5 shrink-0"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>

        {/* Global phone search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40" />
          <input
            value={globalSearch}
            onChange={(e) => runGlobalSearch(e.target.value)}
            placeholder="Search any phone number across all leads (check before you call)…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2D8C2] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
          />
          {globalResults !== null && (
            <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-[#E2D8C2] rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searching ? (
                <p className="text-xs text-[#2A364B]/40 text-center py-4">Searching…</p>
              ) : globalResults.length === 0 ? (
                <p className="text-xs text-[#2A364B]/40 text-center py-4">No existing lead with this number — safe to add as new.</p>
              ) : (
                globalResults.map((r) => (
                  <div key={r.id} className="px-4 py-2.5 border-b border-[#E2D8C2] last:border-0 text-xs">
                    <p className="font-medium text-[#0E1B2C]">{r.name} — {r.phone}</p>
                    <p className="text-[#2A364B]/50">Status: {STATUS_LABELS[r.status] || r.status} · Assigned: {r.assigned_to_name || "Unassigned"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((s) => (
            <div key={s} className="shrink-0 bg-white rounded-xl border border-[#E2D8C2] px-4 py-2 text-center min-w-[80px]">
              <p className="text-lg font-bold text-[#0E1B2C]">{statCounts[s] || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 uppercase">{STATUS_LABELS[s]}</p>
            </div>
          ))}
        </div>

        {/* Add Lead modal */}
        {addingLead && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[16px] text-[#0E1B2C]">Add a Lead</h3>
                <button onClick={() => setAddingLead(false)} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={16} /></button>
              </div>
              <form onSubmit={submitNewLead} className="space-y-3">
                <input placeholder="Name *" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className={field} required />
                <input placeholder="Phone *" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className={field} required />
                <input placeholder="City (optional)" value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} className={field} />
                <input placeholder="Service interest (optional)" value={newLead.service_interest} onChange={(e) => setNewLead({ ...newLead, service_interest: e.target.value })} className={field} />
                <textarea
                  rows={2}
                  placeholder="Reference note — e.g. 'Referred by Priya Sharma (existing client)'"
                  value={newLead.reference_note}
                  onChange={(e) => setNewLead({ ...newLead, reference_note: e.target.value })}
                  className={`${field} resize-none`}
                />
                <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396]">Add Lead</button>
              </form>
            </div>
          </div>
        )}

        {outcomeLead && (
          <CallFlowPopup lead={outcomeLead} token={token} onClose={() => setOutcomeLead(null)} onSaved={load} />
        )}
        {transferLead && (
          <TransferLeadModal lead={transferLead} token={token} onClose={() => setTransferLead(null)} onSaved={load} />
        )}
        {waLead && (
          <WhatsAppTemplateModal lead={waLead} token={token} onClose={() => setWaLead(null)} />
        )}

        {noteFor && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
              <h3 className="font-serif text-[16px] text-[#0E1B2C] mb-1">Add Update</h3>
              <p className="text-xs text-[#2A364B]/50 mb-4">{noteFor.name} · {noteFor.phone}</p>
              <form onSubmit={submitNote} className="space-y-3">
                <textarea
                  rows={3}
                  autoFocus
                  placeholder="What's the update?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={`${field} resize-none`}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNoteFor(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396]">Save Update</button>
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

                {lead.reference_note && (
                  <p className="text-[11px] text-[#B8862B] bg-[#FBF1DD] px-2 py-1 rounded-lg">↳ {lead.reference_note}</p>
                )}

                {lead.notes && (
                  <div className="bg-[#FBF7EE] rounded-xl p-3 text-xs text-[#2A364B]/70">
                    <span className="text-[10px] uppercase tracking-wider text-[#2A364B]/40 block mb-0.5">Last Note</span>
                    {lead.notes}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-[#2A364B]/45">
                  {lead.follow_up_date && <span>Follow-up: {lead.follow_up_date}</span>}
                  {lead.call_attempts > 0 && lead.status !== "lost" && lead.status !== "converted" && (
                    <span>Attempt {lead.call_attempts}/3</span>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <a
                    href={`tel:+91${lead.phone.replace(/\D/g, "")}`}
                    onClick={() => startCall(lead)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] flex items-center justify-center gap-1.5"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <button
                    onClick={() => setWaLead(lead)}
                    className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 shrink-0"
                    title="WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    onClick={() => setTransferLead(lead)}
                    className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 hover:bg-violet-100 shrink-0"
                    title="Transfer"
                  >
                    <ArrowRightLeft size={15} />
                  </button>
                  <button
                    onClick={() => { setNoteFor(lead); setNoteText(""); }}
                    className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 hover:bg-amber-100 shrink-0"
                    title="Add Update"
                  >
                    <MessageSquarePlus size={15} />
                  </button>
                  <button
                    onClick={() => setOutcomeLead(lead)}
                    className="w-9 h-9 rounded-xl bg-[#2A364B]/5 flex items-center justify-center text-[#2A364B] hover:bg-[#2A364B]/10 shrink-0"
                    title="Log outcome manually"
                  >
                    <History size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
