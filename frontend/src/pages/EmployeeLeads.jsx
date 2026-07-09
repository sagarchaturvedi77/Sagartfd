import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import CallFlowPopup from "../components/CallFlowPopup";
import TransferLeadModal from "../components/TransferLeadModal";
import WhatsAppTemplateModal from "../components/WhatsAppTemplateModal";
import useCallReturn from "../hooks/useCallReturn";
import { Phone, MessageCircle, ArrowRightLeft, Search, Plus, ChevronLeft } from "lucide-react";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";
import StatusBadge from "../components/portal/StatusBadge";
import EmptyState from "../components/portal/EmptyState";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { codeFieldLabel } from "../lib/utils";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};
const TABS = ["new", "follow_up", "interested", "converted", "lost"];
const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

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

  const [detailLead, setDetailLead] = useState(null);
  const [addServiceLead, setAddServiceLead] = useState(null);
  const [newServiceValue, setNewServiceValue] = useState("");

  const [referralLead, setReferralLead] = useState(null);
  const [newReferral, setNewReferral] = useState({ name: "", phone: "", city: "", service_interest: "" });
  const [savingReferral, setSavingReferral] = useState(false);

  const [statusLead, setStatusLead] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "", follow_up_note: "", follow_up_date: "", service_interest: "", code_name: "", service_price: "", service_duration_months: "" });

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, { headers });
      if (res.ok) setLeads(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my/summary`, { headers });
      if (res.ok) setQueuedCount((await res.json()).queued || 0);
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); loadServices(); loadSummary(); }, [load, loadServices, loadSummary]);

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

  const submitReferral = async (e) => {
    e.preventDefault();
    if (!referralLead || !newReferral.name.trim() || !newReferral.phone.trim()) return;
    setSavingReferral(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, {
        method: "POST", headers,
        body: JSON.stringify({ ...newReferral, referred_by_lead_id: referralLead.id }),
      });
      if (res.ok) {
        setReferralLead(null);
        setNewReferral({ name: "", phone: "", city: "", service_interest: "" });
        load();
      }
    } finally {
      setSavingReferral(false);
    }
  };

  const updateLeadStatus = async () => {
    if (!statusLead || !statusForm.status) return;
    const payload = {
      status: statusForm.status,
      follow_up_note: statusForm.follow_up_note || null,
      follow_up_date: statusForm.follow_up_date || null,
      service_interest: statusForm.service_interest || null,
      code_name: statusForm.code_name || null,
      service_price: statusForm.service_price ? Number(statusForm.service_price) : null,
      service_duration_months: statusForm.service_duration_months ? Number(statusForm.service_duration_months) : null,
    };
    const res = await fetch(`${API_BASE}/api/leads/${statusLead.id}/status`, {
      method: "POST", headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) { setStatusLead(null); setStatusForm({ status: "", follow_up_note: "", follow_up_date: "", service_interest: "", code_name: "", service_price: "", service_duration_months: "" }); load(); loadSummary(); }
    else { const err = await res.json().catch(() => ({})); alert(err.detail || "Failed to update status"); }
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

  // A lead with a scheduled follow-up date should show in the Follow Up tab
  // even if its status is "interested" (not just the literal "follow_up"
  // status set by the not-connected/not-interested retry flow) — this was
  // the main reason follow-ups looked like they "weren't happening": the
  // date was saved correctly, it just never surfaced anywhere.
  const hasPendingFollowUp = (l) => l.follow_up_date && !["lost", "converted"].includes(l.status);

  const statCounts = {};
  leads.forEach((l) => { statCounts[l.status] = (statCounts[l.status] || 0) + 1; });
  statCounts.follow_up = leads.filter(hasPendingFollowUp).length;

  const filteredLeads = activeTab === "follow_up"
    ? leads.filter(hasPendingFollowUp)
    : leads.filter((l) => l.status === activeTab);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader
          icon="📋"
          title="My Leads"
          subtitle={`Total: ${leads.length} leads assigned to you`}
          actions={
            <Button onClick={() => setAddingLead(true)} className="bg-[#024396] hover:bg-[#023580]">
              <Plus size={14} className="mr-1.5" /> Add Lead
            </Button>
          }
        />

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40 dark:text-[#8E99AC]" />
          <input
            value={globalSearch} onChange={(e) => runGlobalSearch(e.target.value)}
            placeholder="Search any phone number..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white"
          />
          {globalResults !== null && (
            <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/15 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searching ? (
                <p className="text-xs text-center py-4 text-[#2A364B]/40 dark:text-[#8E99AC]">Searching...</p>
              ) : globalResults.length === 0 ? (
                <p className="text-xs text-center py-4 text-[#2A364B]/40 dark:text-[#8E99AC]">No existing lead found</p>
              ) : (
                globalResults.map((r) => (
                  <div key={r.id} className="px-4 py-2.5 border-b border-[#E2D8C2] dark:border-white/10 last:border-0 text-xs">
                    <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{r.name} — {r.phone}</p>
                    <p className="text-[#2A364B]/50 dark:text-[#8E99AC]">Status: {STATUS_LABELS[r.status] || r.status} · {r.assigned_to_name || "Unassigned"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {queuedCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs rounded-xl px-4 py-2.5">
            {queuedCount} more new lead{queuedCount > 1 ? "s are" : " is"} assigned to you and waiting in queue —
            they'll appear in "New" once you've called through the current batch.
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((s) => (
            <StatCard
              key={s}
              label={STATUS_LABELS[s]}
              value={statCounts[s] || 0}
              active={activeTab === s}
              compact
              onClick={() => setActiveTab(s)}
              className="w-auto min-w-[90px] shrink-0"
            />
          ))}
        </div>

        {/* Add Lead Modal */}
        <PortalModal open={addingLead} onOpenChange={setAddingLead} title="Add a Lead" maxWidth="max-w-sm">
          <form onSubmit={submitNewLead} className="space-y-3">
            <input placeholder="Name *" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className={field} required />
            <input placeholder="Phone *" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className={field} required />
            <input placeholder="City (optional)" value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} className={field} />
            <select value={newLead.service_interest} onChange={(e) => setNewLead({ ...newLead, service_interest: e.target.value })} className={field}>
              <option value="">Service interest (optional)</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <Button type="submit" className="w-full bg-[#024396] hover:bg-[#023580]">Add Lead</Button>
          </form>
        </PortalModal>

        {/* Add Referral Modal — creates a new lead linked back to referralLead */}
        <PortalModal
          open={!!referralLead}
          onOpenChange={(v) => !v && setReferralLead(null)}
          title="Add a Referral"
          description={referralLead ? `Referred by ${referralLead.name}` : ""}
          maxWidth="max-w-sm"
        >
          <form onSubmit={submitReferral} className="space-y-3">
            <input placeholder="Name *" value={newReferral.name} onChange={(e) => setNewReferral({ ...newReferral, name: e.target.value })} className={field} required />
            <input placeholder="Phone *" value={newReferral.phone} onChange={(e) => setNewReferral({ ...newReferral, phone: e.target.value })} className={field} required />
            <input placeholder="City (optional)" value={newReferral.city} onChange={(e) => setNewReferral({ ...newReferral, city: e.target.value })} className={field} />
            <select value={newReferral.service_interest} onChange={(e) => setNewReferral({ ...newReferral, service_interest: e.target.value })} className={field}>
              <option value="">Service interest (optional)</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <Button type="submit" disabled={savingReferral} className="w-full bg-violet-600 hover:bg-violet-700">
              {savingReferral ? "Saving..." : "Add Referral"}
            </Button>
          </form>
        </PortalModal>

        {/* Status Update Modal */}
        <PortalModal open={!!statusLead} onOpenChange={(v) => !v && setStatusLead(null)} title="Update Status" maxWidth="max-w-sm">
          {statusLead && (
            <div className="space-y-3">
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2">{statusLead.name} · {statusLead.phone}</p>
              <div className="grid grid-cols-3 gap-2">
                {["follow_up", "converted", "lost"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusForm({ ...statusForm, status: s })}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      statusForm.status === s ? "border-[#024396] dark:border-[#4C8DFF] bg-[#024396]/5 dark:bg-[#4C8DFF]/10 text-[#024396] dark:text-[#7CB0FF]" : "border-[#E2D8C2] dark:border-white/15 text-[#2A364B]/60 dark:text-[#8E99AC]"
                    }`}
                  >
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
              {statusForm.status === "converted" && (
                <>
                  <select value={statusForm.service_interest} onChange={(e) => setStatusForm({ ...statusForm, service_interest: e.target.value })} className={field}>
                    <option value="">Select service…</option>
                    {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <input placeholder={codeFieldLabel(statusForm.service_interest)} value={statusForm.code_name} onChange={(e) => setStatusForm({ ...statusForm, code_name: e.target.value })} className={field} />
                  <div>
                    <label className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC] mb-1 block">Amount / Price (₹)</label>
                    <input type="number" min="0" placeholder="e.g. 5000" value={statusForm.service_price} onChange={(e) => setStatusForm({ ...statusForm, service_price: e.target.value })} className={field} />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC] mb-1 block">Valid for how many months? (course / monthly service)</label>
                    <input type="number" min="1" placeholder="e.g. 12" value={statusForm.service_duration_months} onChange={(e) => setStatusForm({ ...statusForm, service_duration_months: e.target.value })} className={field} />
                  </div>
                </>
              )}
              {statusForm.status === "lost" && (
                <textarea placeholder="Reason for lost..." rows={2} value={statusForm.follow_up_note} onChange={(e) => setStatusForm({ ...statusForm, follow_up_note: e.target.value })} className={`${field} resize-none`} />
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStatusLead(null)}>Cancel</Button>
                <Button className="flex-1 bg-[#024396] hover:bg-[#023580]" disabled={!statusForm.status} onClick={updateLeadStatus}>Update</Button>
              </div>
            </div>
          )}
        </PortalModal>

        {/* Add Service Modal */}
        <PortalModal open={!!addServiceLead} onOpenChange={(v) => !v && setAddServiceLead(null)} title="Add New Service" maxWidth="max-w-sm">
          {addServiceLead && (
            <>
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] -mt-2 mb-1">{addServiceLead.name} — current: {addServiceLead.service_interest || "None"}</p>
              <select value={newServiceValue} onChange={(e) => setNewServiceValue(e.target.value)} className={field}>
                <option value="">Select service</option>
                {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="flex-1" onClick={() => setAddServiceLead(null)}>Cancel</Button>
                <Button className="flex-1 bg-[#024396] hover:bg-[#023580]" disabled={!newServiceValue} onClick={addNewService}>Add</Button>
              </div>
            </>
          )}
        </PortalModal>

        {/* Client Detail Panel */}
        <PortalModal open={!!detailLead} onOpenChange={(v) => !v && setDetailLead(null)} maxWidth="max-w-md">
          {detailLead && (
            <div>
              <div className="flex items-center justify-between mb-4 -mt-2">
                <button onClick={() => setDetailLead(null)} className="flex items-center gap-1 text-xs text-[#024396] dark:text-[#7CB0FF]"><ChevronLeft size={14} /> Back</button>
                <StatusBadge status={detailLead.status} label={STATUS_LABELS[detailLead.status]} />
              </div>
              <h3 className="font-semibold text-lg text-[#0E1B2C] dark:text-[#F1EDE3]">{detailLead.name}</h3>
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{detailLead.phone} {detailLead.email && `| ${detailLead.email}`} {detailLead.city && `| ${detailLead.city}`}</p>
              {detailLead.service_interest && <p className="text-xs text-[#024396] dark:text-[#7CB0FF] mt-1">Services: {detailLead.service_interest}</p>}
              {detailLead.follow_up_date && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Follow-up: {detailLead.follow_up_date}</p>}
              {(detailLead.code_name || detailLead.service_price || detailLead.service_expires_at) && (
                <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2.5 text-xs space-y-1 mt-2">
                  {detailLead.code_name && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">{codeFieldLabel(detailLead.service_interest)}: <strong>{detailLead.code_name}</strong></p>}
                  {detailLead.service_price != null && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">Amount: <strong>₹{detailLead.service_price.toLocaleString("en-IN")}</strong></p>}
                  {detailLead.service_expires_at && <p className="text-[#0E1B2C] dark:text-[#F1EDE3]">Valid until: <strong>{detailLead.service_expires_at}</strong></p>}
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => { setDetailLead(null); setStatusLead(detailLead); setStatusForm({ status: "", follow_up_note: "", follow_up_date: "", service_interest: "", code_name: "", service_price: "", service_duration_months: "" }); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10"
                >
                  Update Status
                </button>
                <button
                  onClick={() => { setDetailLead(null); setAddServiceLead(detailLead); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                >
                  Add Service
                </button>
                <button
                  onClick={() => { setDetailLead(null); setReferralLead(detailLead); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30"
                >
                  + Add Referral
                </button>
                <button
                  onClick={() => { setDetailLead(null); setTransferLead(detailLead); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#2A364B] dark:text-[#C7CEDA] bg-[#2A364B]/5 dark:bg-white/10"
                >
                  Transfer to Employee
                </button>
              </div>

              {leads.filter((l) => l.referred_by_lead_id === detailLead.id).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Referred by {detailLead.name}</h4>
                  <div className="space-y-1.5">
                    {leads.filter((l) => l.referred_by_lead_id === detailLead.id).map((r) => (
                      <div key={r.id} className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2 text-xs flex items-center justify-between">
                        <span className="text-[#0E1B2C] dark:text-[#F1EDE3]">{r.name} — {r.phone}</span>
                        <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailLead.status_history && detailLead.status_history.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Call & Update History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detailLead.status_history.map((h, i) => (
                      <div key={i} className="bg-[#F5F1EB] dark:bg-white/5 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{h.status || h.outcome || "Update"}</span>
                          <span className="text-[#2A364B]/40 dark:text-[#8E99AC]">{h.at ? new Date(h.at).toLocaleDateString("en-IN") : ""}</span>
                        </div>
                        {h.note && <p className="text-[#2A364B]/60 dark:text-[#8E99AC] mt-1">{h.note}</p>}
                        {h.by_name && <p className="text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-0.5">by {h.by_name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </PortalModal>

        {outcomeLead && <CallFlowPopup lead={outcomeLead} token={token} onClose={() => setOutcomeLead(null)} onSaved={() => { load(); loadSummary(); }} />}
        {transferLead && <TransferLeadModal lead={transferLead} token={token} onClose={() => setTransferLead(null)} onSaved={load} />}
        {waLead && <WhatsAppTemplateModal lead={waLead} token={token} onClose={() => setWaLead(null)} />}

        {/* Lead List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm">
            <EmptyState icon="📋" title={`No ${STATUS_LABELS[activeTab]} leads`} />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
            <div className="divide-y divide-[#F0EADD] dark:divide-white/10">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-[#FBF7EE] dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetailLead(lead)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{lead.phone} {lead.service_interest && `· ${lead.service_interest}`}</p>
                    {lead.follow_up_date && <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-0.5">Follow-up: {lead.follow_up_date}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                    <a href={`tel:+91${lead.phone.replace(/\D/g, "")}`} onClick={() => startCall(lead)}
                      className="w-8 h-8 rounded-lg bg-[#024396] flex items-center justify-center text-white">
                      <Phone size={14} />
                    </a>
                    <button onClick={() => setWaLead(lead)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <MessageCircle size={14} />
                    </button>
                    <button onClick={() => setTransferLead(lead)} className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <ArrowRightLeft size={14} />
                    </button>
                    <button
                      onClick={() => { setStatusLead(lead); setStatusForm({ status: "", follow_up_note: "", follow_up_date: "", service_interest: "", code_name: "", service_price: "", service_duration_months: "" }); }}
                      title="Quick update"
                      className="w-8 h-8 rounded-lg bg-[#024396]/10 dark:bg-white/10 flex items-center justify-center text-[#024396] dark:text-[#7CB0FF] font-bold">
                      <Plus size={14} />
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
