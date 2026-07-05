import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import CallFlowPopup from "../components/CallFlowPopup";
import TransferLeadModal from "../components/TransferLeadModal";
import WhatsAppTemplateModal from "../components/WhatsAppTemplateModal";
import useCallReturn from "../hooks/useCallReturn";
import { Phone, MessageCircle, ArrowRightLeft, Search, Plus, X, ChevronLeft } from "lucide-react";

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
const TABS = ["new", "follow_up", "interested", "converted", "lost"];
const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

export default function EmployeeLeads() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");
  const [services, setServices] = useState([]);

  const [outcomeLead, setOutcomeLead] = useState(null);
  const [transferLead, setTransferLead] = useState(null);
  const [waLead, setWaLead] = useState(null);
  const [addingLead, setAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", city: "", service_interest: "", reference_note: "" });

  // Client detail
  const [detailLead, setDetailLead] = useState(null);
  const [addServiceLead, setAddServiceLead] = useState(null);
  const [newServiceValue, setNewServiceValue] = useState("");

  // Status update
  const [statusLead, setStatusLead] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "", follow_up_note: "", follow_up_date: "" });

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, { headers });
      if (res.ok) setLeads(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); loadServices(); }, [load, loadServices]);

  const { startCall } = useCallReturn((lead) => setOutcomeLead(lead));

  const runGlobalSearch = async (q) => {
    setGlobalSearch(q);
    if (q.trim().length < 3) { setGlobalResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/search?phone=${encodeURIComponent(q.trim())}`, { headers });
      if (res.ok) setGlobalResults(await res.json());
    } finally { setSearching(false); }
  };

  const submitNewLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) return;
    const res = await fetch(`${API_BASE}/api/leads/my`, {
      method: "POST", headers, body: JSON.stringify(newLead),
    });
    if (res.ok) { setAddingLead(false); setNewLead({ name: "", phone: "", city: "", service_interest: "", reference_note: "" }); load(); }
  };

  const updateLeadStatus = async () => {
    if (!statusLead || !statusForm.status) return;
    const res = await fetch(`${API_BASE}/api/leads/${statusLead.id}/status`, {
      method: "PUT", headers,
      body: JSON.stringify(statusForm),
    });
    if (res.ok) { setStatusLead(null); setStatusForm({ status: "", follow_up_note: "", follow_up_date: "" }); load(); }
  };

  const addNewService = async () => {
    if (!addServiceLead || !newServiceValue.trim()) return;
    const currentService = addServiceLead.service_interest || "";
    const updated = currentService ? `${currentService}, ${newServiceValue.trim()}` : newServiceValue.trim();
    const res = await fetch(`${API_BASE}/api/leads/${addServiceLead.id}/service`, {
      method: "PUT", headers, body: JSON.stringify({ service_interest: updated }),
    });
    if (res.ok) { setAddServiceLead(null); setNewServiceValue(""); load(); }
  };

  const statCounts = {};
  leads.forEach((l) => { statCounts[l.status] = (statCounts[l.status] || 0) + 1; });

  const filteredLeads = leads.filter(l => l.status === activeTab);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">My Leads</h2>
            <p className="text-xs text-[#2A364B]/50">Total: {leads.length} leads assigned to you</p>
          </div>
          <button onClick={() => setAddingLead(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#024396] hover:bg-[#023580] rounded-xl px-4 py-2.5 shrink-0">
            <Plus size={14} /> Add Lead
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40" />
          <input value={globalSearch} onChange={(e) => runGlobalSearch(e.target.value)}
            placeholder="Search any phone number..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2D8C2] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white" />
          {globalResults !== null && (
            <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-[#E2D8C2] rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searching ? (<p className="text-xs text-center py-4 text-[#2A364B]/40">Searching...</p>) :
                globalResults.length === 0 ? (<p className="text-xs text-center py-4 text-[#2A364B]/40">No existing lead found</p>) :
                globalResults.map((r) => (
                  <div key={r.id} className="px-4 py-2.5 border-b border-[#E2D8C2] last:border-0 text-xs">
                    <p className="font-medium text-[#0E1B2C]">{r.name} — {r.phone}</p>
                    <p className="text-[#2A364B]/50">Status: {STATUS_LABELS[r.status] || r.status} · {r.assigned_to_name || "Unassigned"}</p>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((s) => (
            <button key={s} onClick={() => setActiveTab(s)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-center border transition-all ${activeTab === s ? "border-[#024396] bg-[#024396]/5 ring-1 ring-[#024396]/20" : "border-[#E2D8C2] bg-white"}`}>
              <p className="text-lg font-bold text-[#0E1B2C]">{statCounts[s] || 0}</p>
              <p className="text-[10px] text-[#2A364B]/50 uppercase">{STATUS_LABELS[s]}</p>
            </button>
          ))}
        </div>

        {/* Add Lead Modal */}
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
                <select value={newLead.service_interest} onChange={(e) => setNewLead({ ...newLead, service_interest: e.target.value })} className={field}>
                  <option value="">Service interest (optional)</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396]">Add Lead</button>
              </form>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {statusLead && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[16px] text-[#0E1B2C]">Update Status</h3>
                <button onClick={() => setStatusLead(null)} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={16} /></button>
              </div>
              <p className="text-xs text-[#2A364B]/60 mb-3">{statusLead.name} · {statusLead.phone}</p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {["follow_up", "converted", "lost"].map(s => (
                    <button key={s} onClick={() => setStatusForm({ ...statusForm, status: s })}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${statusForm.status === s ? "border-[#024396] bg-[#024396]/5 text-[#024396]" : "border-[#E2D8C2] text-[#2A364B]/60"}`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                {statusForm.status === "follow_up" && (
                  <>
                    <input type="date" value={statusForm.follow_up_date} onChange={(e) => setStatusForm({ ...statusForm, follow_up_date: e.target.value })} className={field} />
                    <textarea placeholder="Follow-up note..." rows={2} value={statusForm.follow_up_note} onChange={(e) => setStatusForm({ ...statusForm, follow_up_note: e.target.value })} className={`${field} resize-none`} />
                  </>
                )}
                {statusForm.status === "lost" && (
                  <textarea placeholder="Reason for lost..." rows={2} value={statusForm.follow_up_note} onChange={(e) => setStatusForm({ ...statusForm, follow_up_note: e.target.value })} className={`${field} resize-none`} />
                )}
                <div className="flex gap-2">
                  <button onClick={() => setStatusLead(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button onClick={updateLeadStatus} disabled={!statusForm.status} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396] disabled:opacity-50">Update</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Service Modal */}
        {addServiceLead && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
              <h3 className="font-serif text-[16px] text-[#0E1B2C] mb-3">Add New Service</h3>
              <p className="text-xs text-[#2A364B]/60 mb-3">{addServiceLead.name} — current: {addServiceLead.service_interest || "None"}</p>
              <select value={newServiceValue} onChange={(e) => setNewServiceValue(e.target.value)} className={field}>
                <option value="">Select service</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setAddServiceLead(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                <button onClick={addNewService} disabled={!newServiceValue} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396] disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Client Detail Panel */}
        {detailLead && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setDetailLead(null)} className="flex items-center gap-1 text-xs text-[#024396]"><ChevronLeft size={14} /> Back</button>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[detailLead.status] || "bg-gray-100"}`}>
                  {STATUS_LABELS[detailLead.status] || detailLead.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-[#0E1B2C]">{detailLead.name}</h3>
              <p className="text-xs text-[#2A364B]/60">{detailLead.phone} {detailLead.email && `| ${detailLead.email}`} {detailLead.city && `| ${detailLead.city}`}</p>
              {detailLead.service_interest && <p className="text-xs text-[#024396] mt-1">Services: {detailLead.service_interest}</p>}
              {detailLead.follow_up_date && <p className="text-xs text-orange-600 mt-1">Follow-up: {detailLead.follow_up_date}</p>}

              <div className="flex gap-2 mt-4">
                <button onClick={() => { setDetailLead(null); setStatusLead(detailLead); setStatusForm({ status: "", follow_up_note: "", follow_up_date: "" }); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#024396] bg-[#024396]/5">Update Status</button>
                <button onClick={() => { setDetailLead(null); setAddServiceLead(detailLead); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50">Add Service</button>
              </div>

              {/* Status History */}
              {detailLead.status_history && detailLead.status_history.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-[#0E1B2C] mb-2">Call & Update History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detailLead.status_history.map((h, i) => (
                      <div key={i} className="bg-[#F5F1EB] rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0E1B2C]">{h.status || h.outcome || "Update"}</span>
                          <span className="text-[#2A364B]/40">{h.at ? new Date(h.at).toLocaleDateString("en-IN") : ""}</span>
                        </div>
                        {h.note && <p className="text-[#2A364B]/60 mt-1">{h.note}</p>}
                        {h.by_name && <p className="text-[#2A364B]/40 mt-0.5">by {h.by_name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {outcomeLead && <CallFlowPopup lead={outcomeLead} token={token} onClose={() => setOutcomeLead(null)} onSaved={load} />}
        {transferLead && <TransferLeadModal lead={transferLead} token={token} onClose={() => setTransferLead(null)} onSaved={load} />}
        {waLead && <WhatsAppTemplateModal lead={waLead} token={token} onClose={() => setWaLead(null)} />}

        {/* Lead List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No {STATUS_LABELS[activeTab]} leads</p>
          </div>
        ) : activeTab === "lost" ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 text-center">
            <p className="text-3xl font-bold text-red-600">{filteredLeads.length}</p>
            <p className="text-sm text-[#2A364B]/50 mt-1">Lost Leads</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
            <div className="divide-y divide-[#F0EADD]">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-[#FBF7EE] transition-colors cursor-pointer" onClick={() => setDetailLead(lead)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0E1B2C] text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-[#2A364B]/50">{lead.phone} {lead.service_interest && `· ${lead.service_interest}`}</p>
                    {lead.follow_up_date && <p className="text-[10px] text-orange-500 mt-0.5">Follow-up: {lead.follow_up_date}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:+91${lead.phone.replace(/\D/g, "")}`} onClick={() => startCall(lead)}
                      className="w-8 h-8 rounded-lg bg-[#024396] flex items-center justify-center text-white">
                      <Phone size={14} />
                    </a>
                    <button onClick={() => setWaLead(lead)} className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <MessageCircle size={14} />
                    </button>
                    <button onClick={() => setTransferLead(lead)} className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                      <ArrowRightLeft size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
