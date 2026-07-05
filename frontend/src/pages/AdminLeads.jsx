import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
const SOURCES = ["manual", "website", "referral", "calculator", "whatsapp", "excel"];

export default function AdminLeads() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("my_leads"); // my_leads | employee_leads | website | career | pipeline
  const [webLeads, setWebLeads] = useState([]);
  const [careerLeads, setCareerLeads] = useState([]);
  const [importing, setImporting] = useState(false);
  const [pipelineStatuses, setPipelineStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [services, setServices] = useState([]);
  const fileRef = useRef(null);

  // Import assign dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [assignMode, setAssignMode] = useState("none"); // none, self, all, selected
  const [selectedAssignEmps, setSelectedAssignEmps] = useState([]);

  // Batch view
  const [batches, setBatches] = useState([]);
  const [openBatch, setOpenBatch] = useState(null);
  const [batchLeads, setBatchLeads] = useState([]);
  const [batchEmpFilter, setBatchEmpFilter] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  // Lead detail
  const [detailLead, setDetailLead] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", source: "manual", service_interest: "", notes: "", assigned_to: "" });
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search) params.set("search", search);
      const [leadsRes, empRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads/?${params}`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
        fetch(`${API_BASE}/api/leads/stats`, { headers }),
      ]);
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token, filter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/admin-my`, { headers });
      if (res.ok) setMyLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/batches`, { headers });
      if (res.ok) setBatches(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWebLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/website`, { headers });
      if (res.ok) setWebLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCareerLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/career`, { headers });
      if (res.ok) setCareerLeads(await res.json());
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPipeline = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/lead-pipeline`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPipelineStatuses(data.statuses || []);
      }
    } catch { /* silent */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); loadMyLeads(); loadBatches(); loadWebLeads(); loadCareerLeads(); loadPipeline(); loadServices(); }, [load, loadMyLeads, loadBatches, loadWebLeads, loadCareerLeads, loadPipeline, loadServices]);

  const addLead = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null }),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", phone: "", email: "", city: "", source: "manual", service_interest: "", notes: "", assigned_to: "" });
        load(); loadMyLeads();
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  const assignLead = async (leadId, empId) => {
    await fetch(`${API_BASE}/api/leads/${leadId}/assign?assigned_to=${empId}`, { method: "POST", headers });
    load(); loadMyLeads();
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm("Delete this lead?")) return;
    await fetch(`${API_BASE}/api/leads/${leadId}`, { method: "DELETE", headers });
    load(); loadMyLeads();
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setImportFile(file);
    setShowAssignDialog(true);
  };

  const executeImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setShowAssignDialog(false);
    const fd = new FormData();
    fd.append("file", importFile);
    let url = `${API_BASE}/api/leads/import-excel?assign_mode=${assignMode}`;
    if (assignMode === "selected" && selectedAssignEmps.length > 0) {
      url += `&employee_ids=${selectedAssignEmps.join(",")}`;
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.count} leads imported successfully!`);
        load(); loadMyLeads(); loadBatches();
      } else {
        const err = await res.json();
        alert(err.detail || "Import failed");
      }
    } catch { alert("Import failed"); }
    setImporting(false);
    setImportFile(null);
    setAssignMode("none");
    setSelectedAssignEmps([]);
  };

  const openBatchDetail = async (batch) => {
    setOpenBatch(batch);
    setBatchLoading(true);
    setBatchEmpFilter("");
    try {
      const res = await fetch(`${API_BASE}/api/leads/batches/${batch.batch_id}`, { headers });
      if (res.ok) setBatchLeads(await res.json());
    } catch { /* silent */ }
    setBatchLoading(false);
  };

  const filterBatchByEmp = async (empId) => {
    setBatchEmpFilter(empId);
    setBatchLoading(true);
    const url = empId
      ? `${API_BASE}/api/leads/batches/${openBatch.batch_id}?employee_filter=${empId}`
      : `${API_BASE}/api/leads/batches/${openBatch.batch_id}`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) setBatchLeads(await res.json());
    } catch { /* silent */ }
    setBatchLoading(false);
  };

  const convertWebLead = async (id) => {
    await fetch(`${API_BASE}/api/leads/website/${id}/convert`, { method: "POST", headers });
    loadWebLeads(); load();
  };

  const deleteWebLead = async (id) => {
    if (!window.confirm("Delete this website lead?")) return;
    await fetch(`${API_BASE}/api/leads/website/${id}`, { method: "DELETE", headers });
    loadWebLeads();
  };

  const updateCareerStatus = async (id, status) => {
    await fetch(`${API_BASE}/api/leads/career/${id}/status?status=${status}`, { method: "PUT", headers });
    loadCareerLeads();
  };

  const deleteCareerLead = async (id) => {
    if (!window.confirm("Delete this career application?")) return;
    await fetch(`${API_BASE}/api/leads/career/${id}`, { method: "DELETE", headers });
    loadCareerLeads();
  };

  const savePipeline = async () => {
    await fetch(`${API_BASE}/api/lead-pipeline`, {
      method: "PUT", headers,
      body: JSON.stringify({ statuses: pipelineStatuses }),
    });
    alert("Pipeline updated!");
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">Lead Management</h2>
            <p className="text-xs text-[#2A364B]/50">Track, assign & convert leads</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] shadow-lg shadow-[#024396]/25">
              + Add Lead
            </button>
            <label className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${importing ? "bg-gray-200 text-gray-500" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}>
              {importing ? "Importing..." : "Import Excel"}
              <input type="file" className="hidden" accept=".xlsx,.xls" ref={fileRef} onChange={(e) => handleFileSelect(e.target.files[0])} disabled={importing} />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2D8C2] overflow-x-auto">
          {[
            ["my_leads", `My Leads (${myLeads.length})`],
            ["employee_leads", "Employee Leads"],
            ["website", `Website Leads (${webLeads.length})`],
            ["career", `Career (${careerLeads.length})`],
            ["pipeline", "Pipeline Config"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${tab === key ? "border-[#024396] text-[#024396]" : "border-transparent text-[#2A364B]/50 hover:text-[#2A364B]"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Import Assign Dialog */}
        {showAssignDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-[#0E1B2C] mb-4">Import Leads — Assign To</h3>
              <p className="text-xs text-[#2A364B]/60 mb-4">Choose how to assign the imported leads:</p>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${assignMode === "none" ? "border-[#024396] bg-[#024396]/5" : "border-[#E2D8C2]"}`}>
                  <input type="radio" name="assign" checked={assignMode === "none"} onChange={() => setAssignMode("none")} />
                  <div><p className="text-sm font-medium">Don't assign (import only)</p><p className="text-xs text-[#2A364B]/50">Leads will remain unassigned</p></div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${assignMode === "self" ? "border-[#024396] bg-[#024396]/5" : "border-[#E2D8C2]"}`}>
                  <input type="radio" name="assign" checked={assignMode === "self"} onChange={() => setAssignMode("self")} />
                  <div><p className="text-sm font-medium">Assign to myself</p><p className="text-xs text-[#2A364B]/50">All leads go to My Leads</p></div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${assignMode === "all" ? "border-[#024396] bg-[#024396]/5" : "border-[#E2D8C2]"}`}>
                  <input type="radio" name="assign" checked={assignMode === "all"} onChange={() => setAssignMode("all")} />
                  <div><p className="text-sm font-medium">Shuffle to all employees</p><p className="text-xs text-[#2A364B]/50">Auto-distribute equally among all active employees</p></div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${assignMode === "selected" ? "border-[#024396] bg-[#024396]/5" : "border-[#E2D8C2]"}`}>
                  <input type="radio" name="assign" checked={assignMode === "selected"} onChange={() => setAssignMode("selected")} />
                  <div><p className="text-sm font-medium">Select employees</p><p className="text-xs text-[#2A364B]/50">Choose specific employees to distribute to</p></div>
                </label>
                {assignMode === "selected" && (
                  <div className="ml-8 space-y-2 max-h-40 overflow-y-auto">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selectedAssignEmps.includes(emp.id)} onChange={() => setSelectedAssignEmps(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} className="rounded" />
                        {emp.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowAssignDialog(false); setImportFile(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                <button onClick={executeImport} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">Import</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lead Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-[#0E1B2C] mb-4">Add New Lead</h3>
              <form onSubmit={addLead} className="space-y-3">
                <input required placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                <input required placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
                <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={field}>
                  {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select value={form.service_interest} onChange={(e) => setForm({ ...form, service_interest: e.target.value })} className={field}>
                  <option value="">Service Interest</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={field}>
                  <option value="">Assign to Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${field} resize-none`} />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60">
                    {saving ? "Saving..." : "Add Lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lead Detail Modal */}
        {detailLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#0E1B2C] text-lg">{detailLead.name}</h3>
                  <p className="text-xs text-[#2A364B]/60">{detailLead.phone} {detailLead.email && `| ${detailLead.email}`}</p>
                </div>
                <button onClick={() => setDetailLead(null)} className="text-[#2A364B]/40 hover:text-[#2A364B] text-xl">&times;</button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[detailLead.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[detailLead.status] || detailLead.status}
                  </span>
                  {detailLead.service_interest && <span className="text-xs text-[#024396] bg-[#024396]/5 px-2 py-0.5 rounded">{detailLead.service_interest}</span>}
                </div>
                {detailLead.assigned_to_name && <p className="text-xs">Assigned to: <strong>{detailLead.assigned_to_name}</strong></p>}
                {detailLead.follow_up_date && <p className="text-xs text-orange-600">Follow-up: {detailLead.follow_up_date}</p>}
                {detailLead.notes && <p className="text-xs text-[#2A364B]/70 bg-[#FBF7EE] p-2 rounded-lg">{detailLead.notes}</p>}
                {detailLead.status_history && detailLead.status_history.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#0E1B2C] mb-2 mt-3">Update History</h4>
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
          </div>
        )}

        {/* TAB: My Leads */}
        {tab === "my_leads" && (
          <>
            {stats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(filter === key ? "" : key)}
                    className={`rounded-xl p-3 text-center border transition-all ${filter === key ? "border-[#024396] ring-2 ring-[#024396]/20" : "border-[#E2D8C2]"} bg-white`}>
                    <p className="text-lg font-bold text-[#0E1B2C]">{myLeads.filter(l => l.status === key).length}</p>
                    <p className="text-[10px] text-[#2A364B]/50 uppercase">{label}</p>
                  </button>
                ))}
              </div>
            )}

            {myLeads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No leads assigned to you. Assign leads to yourself during import or manually.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F5F1EB] border-b border-[#E2D8C2]">
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Phone</th>
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70 hidden md:table-cell">Service</th>
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filter ? myLeads.filter(l => l.status === filter) : myLeads).map((lead) => (
                        <tr key={lead.id} className="border-b border-[#F0EADD] hover:bg-[#FBF7EE] transition-colors cursor-pointer" onClick={() => setDetailLead(lead)}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#0E1B2C]">{lead.name}</p>
                            {lead.city && <p className="text-[10px] text-[#2A364B]/50">{lead.city}</p>}
                          </td>
                          <td className="px-4 py-3 text-[#2A364B]">{lead.phone}</td>
                          <td className="px-4 py-3 text-[#2A364B] hidden md:table-cell">{lead.service_interest || "\u2014"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
                              {STATUS_LABELS[lead.status] || lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => deleteLead(lead.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: Employee Leads — Batch View */}
        {tab === "employee_leads" && (
          <>
            {openBatch ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => { setOpenBatch(null); setBatchLeads([]); }} className="text-xs text-[#024396] hover:underline mb-1">&larr; Back to batches</button>
                    <h3 className="text-sm font-semibold text-[#0E1B2C]">Batch uploaded on {new Date(openBatch.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</h3>
                    <p className="text-xs text-[#2A364B]/50">{openBatch.total} leads total</p>
                  </div>
                  <select value={batchEmpFilter} onChange={(e) => filterBatchByEmp(e.target.value)} className="text-xs border border-[#E2D8C2] rounded-lg px-3 py-1.5">
                    <option value="">All Employees</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                {batchLoading ? (
                  <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F5F1EB] border-b border-[#E2D8C2]">
                            <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Client</th>
                            <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Phone</th>
                            <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Employee</th>
                            <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchLeads.map(lead => (
                            <tr key={lead.id} className="border-b border-[#F0EADD] hover:bg-[#FBF7EE] cursor-pointer" onClick={() => setDetailLead(lead)}>
                              <td className="px-4 py-3 font-medium text-[#0E1B2C]">{lead.name}</td>
                              <td className="px-4 py-3 text-[#2A364B]">{lead.phone}</td>
                              <td className="px-4 py-3 text-xs text-[#024396]">{lead.assigned_to_name || "Unassigned"}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || "bg-gray-100"}`}>
                                  {STATUS_LABELS[lead.status] || lead.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#2A364B]/60">Lead upload batches — click to view details</p>
                {batches.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                    <p className="text-[#2A364B]/50 text-sm">No lead batches yet. Import leads via Excel to see them here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batches.map(batch => (
                      <button key={batch.batch_id} onClick={() => openBatchDetail(batch)}
                        className="w-full bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm text-left hover:border-[#024396]/40 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-[#0E1B2C]">{new Date(batch.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            <p className="text-xs text-[#2A364B]/50">{batch.total} leads uploaded</p>
                          </div>
                          <span className="text-xs text-[#024396]">View &rarr;</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div className="text-center"><p className="text-sm font-bold text-[#0E1B2C]">{batch.called}</p><p className="text-[9px] text-[#2A364B]/40">Called</p></div>
                          <div className="text-center"><p className="text-sm font-bold text-purple-600">{batch.interested}</p><p className="text-[9px] text-[#2A364B]/40">Interested</p></div>
                          <div className="text-center"><p className="text-sm font-bold text-orange-600">{batch.follow_up}</p><p className="text-[9px] text-[#2A364B]/40">Follow Up</p></div>
                          <div className="text-center"><p className="text-sm font-bold text-emerald-600">{batch.converted}</p><p className="text-[9px] text-[#2A364B]/40">Converted</p></div>
                          <div className="text-center"><p className="text-sm font-bold text-red-600">{batch.lost}</p><p className="text-[9px] text-[#2A364B]/40">Lost</p></div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TAB: Website Leads */}
        {tab === "website" && (
          <div className="space-y-4">
            <p className="text-sm text-[#2A364B]/60">Leads from website contact form & popup</p>
            {webLeads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No website leads yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webLeads.map((wl) => (
                  <div key={wl.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${wl.converted ? "border-emerald-200 bg-emerald-50/30" : "border-[#E2D8C2]"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0E1B2C]">{wl.full_name || wl.name}</p>
                        <p className="text-xs text-[#2A364B]/70">{wl.phone} {wl.email && `| ${wl.email}`}</p>
                        {wl.service && <p className="text-xs text-[#024396]">Service: {wl.service}</p>}
                        {wl.message && <p className="text-xs text-[#2A364B]/50 mt-1">{wl.message}</p>}
                        <p className="text-[10px] text-[#2A364B]/40">{wl.source || "website"} | {new Date(wl.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {wl.converted ? (
                          <span className="text-xs text-emerald-600 font-medium px-3 py-1 bg-emerald-100 rounded-full">Converted</span>
                        ) : (
                          <button onClick={() => convertWebLead(wl.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#024396] hover:bg-[#023580]">
                            Convert to Lead
                          </button>
                        )}
                        <button onClick={() => deleteWebLead(wl.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Career Leads */}
        {tab === "career" && (
          <div className="space-y-4">
            <p className="text-sm text-[#2A364B]/60">Applications from the Career page</p>
            {careerLeads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No career applications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {careerLeads.map((cl) => (
                  <div key={cl.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0E1B2C]">{cl.full_name}</p>
                        <p className="text-xs text-[#2A364B]/70">{cl.phone} {cl.email && `| ${cl.email}`}</p>
                        {cl.position && <p className="text-xs text-[#024396]">Applied for: {cl.position}</p>}
                        <p className="text-[10px] text-[#2A364B]/40">{new Date(cl.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select value={cl.status || "new"} onChange={(e) => updateCareerStatus(cl.id, e.target.value)} className="text-xs border border-[#E2D8C2] rounded-lg px-2 py-1.5">
                          <option value="new">New</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="hired">Hired</option><option value="rejected">Rejected</option>
                        </select>
                        <button onClick={() => deleteCareerLead(cl.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Pipeline Config */}
        {tab === "pipeline" && (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">Pipeline Stages</h3>
            <div className="space-y-2">
              {pipelineStatuses.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#2A364B]/40 w-6">{i + 1}.</span>
                  <input value={s} onChange={(e) => { const u = [...pipelineStatuses]; u[i] = e.target.value; setPipelineStatuses(u); }} className={`${field} flex-1`} />
                  <button onClick={() => setPipelineStatuses(pipelineStatuses.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="New stage name" className={`${field} flex-1`} />
              <button onClick={() => { if (newStatus.trim()) { setPipelineStatuses([...pipelineStatuses, newStatus.trim()]); setNewStatus(""); } }} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#024396]/10 text-[#024396]">Add</button>
            </div>
            <button onClick={savePipeline} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4]">Save Pipeline</button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
