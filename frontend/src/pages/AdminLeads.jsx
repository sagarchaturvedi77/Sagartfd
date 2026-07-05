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
const SERVICES = ["SIP", "Mutual Fund", "Insurance", "Tax Planning", "Lumpsum", "NPS", "Other"];

export default function AdminLeads() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("leads"); // leads | website | pipeline
  const [webLeads, setWebLeads] = useState([]);
  const [careerLeads, setCareerLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedEmps, setSelectedEmps] = useState([]);
  const [showShuffle, setShowShuffle] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pipelineStatuses, setPipelineStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", source: "manual", service_interest: "", notes: "", assigned_to: "" });
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

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

  useEffect(() => { load(); loadWebLeads(); loadCareerLeads(); loadPipeline(); }, [load, loadWebLeads, loadCareerLeads, loadPipeline]);

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
        load();
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  const assignLead = async (leadId, empId) => {
    await fetch(`${API_BASE}/api/leads/${leadId}/assign?assigned_to=${empId}`, { method: "POST", headers });
    load();
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm("Delete this lead?")) return;
    await fetch(`${API_BASE}/api/leads/${leadId}`, { method: "DELETE", headers });
    load();
  };

  const importExcel = async (file) => {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/leads/import-excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        await load();
        if (data.lead_ids && data.lead_ids.length > 0) {
          setSelectedLeads(data.lead_ids);
          setShowShuffle(true);
        } else {
          alert(`${data.count} leads imported successfully!`);
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Import failed");
      }
    } catch { alert("Import failed"); }
    setImporting(false);
  };

  const shuffleAssign = async () => {
    if (selectedLeads.length === 0 || selectedEmps.length === 0) {
      alert("Select leads and employees first");
      return;
    }
    const res = await fetch(`${API_BASE}/api/leads/shuffle-assign`, {
      method: "POST", headers,
      body: JSON.stringify({ lead_ids: selectedLeads, employee_ids: selectedEmps }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`${data.total} leads shuffled and assigned!`);
      setShowShuffle(false);
      setSelectedLeads([]);
      setSelectedEmps([]);
      load();
    }
  };

  const convertWebLead = async (id) => {
    await fetch(`${API_BASE}/api/leads/website/${id}/convert`, { method: "POST", headers });
    loadWebLeads();
    load();
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

  const toggleLeadSelect = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllLeads = () => {
    const unassigned = leads.filter(l => !l.assigned_to).map(l => l.id);
    setSelectedLeads(prev => prev.length === unassigned.length ? [] : unassigned);
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
              <input type="file" className="hidden" accept=".xlsx,.xls" ref={fileRef} onChange={(e) => importExcel(e.target.files[0])} disabled={importing} />
            </label>
            <button onClick={() => setShowShuffle(!showShuffle)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100">
              Shuffle & Assign
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2D8C2]">
          {[["leads", "All Leads"], ["website", `Website Leads (${webLeads.length})`], ["career", `Career Leads (${careerLeads.length})`], ["pipeline", "Pipeline Config"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === key ? "border-[#024396] text-[#024396]" : "border-transparent text-[#2A364B]/50 hover:text-[#2A364B]"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* SHUFFLE MODAL */}
        {showShuffle && (
          <div className="bg-white rounded-2xl border border-violet-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">Shuffle & Assign Leads</h3>
            <p className="text-xs text-[#2A364B]/60">Select unassigned leads and employees. Leads will be randomly shuffled and distributed equally.</p>
            <div className="flex items-center gap-2">
              <button onClick={selectAllLeads} className="text-xs text-[#024396] hover:underline">
                {selectedLeads.length === leads.filter(l => !l.assigned_to).length ? "Deselect All" : "Select All Unassigned"}
              </button>
              <span className="text-xs text-[#2A364B]/40">({selectedLeads.length} leads selected)</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {leads.filter(l => !l.assigned_to).map(l => (
                <label key={l.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#FBF7EE] p-1 rounded">
                  <input type="checkbox" checked={selectedLeads.includes(l.id)} onChange={() => toggleLeadSelect(l.id)} className="rounded" />
                  {l.name} — {l.phone}
                </label>
              ))}
              {leads.filter(l => !l.assigned_to).length === 0 && <p className="text-xs text-[#2A364B]/40">No unassigned leads</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-[#0E1B2C] mb-2">Assign to employees:</p>
              <div className="flex flex-wrap gap-2">
                {employees.map(emp => (
                  <label key={emp.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all ${selectedEmps.includes(emp.id) ? "border-[#024396] bg-[#024396]/5 text-[#024396]" : "border-[#E2D8C2] text-[#2A364B]/60"}`}>
                    <input type="checkbox" checked={selectedEmps.includes(emp.id)} onChange={() => setSelectedEmps(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} className="rounded" />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowShuffle(false)} className="px-4 py-2 rounded-xl text-sm text-[#2A364B]/60 border border-[#E2D8C2]">Cancel</button>
              <button onClick={shuffleAssign} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600">
                Shuffle & Assign ({selectedLeads.length} leads to {selectedEmps.length} employees)
              </button>
            </div>
          </div>
        )}

        {/* TAB: All Leads */}
        {tab === "leads" && (
          <>
            {stats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(filter === key ? "" : key)}
                    className={`rounded-xl p-3 text-center border transition-all ${filter === key ? "border-[#024396] ring-2 ring-[#024396]/20" : "border-[#E2D8C2]"} bg-white`}>
                    <p className="text-lg font-bold text-[#0E1B2C]">{stats.by_status?.[key] || 0}</p>
                    <p className="text-[10px] text-[#2A364B]/50 uppercase">{label}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or email..."
                className={`${field} max-w-sm`}
                onKeyDown={(e) => e.key === "Enter" && load()} />
              {search && <button onClick={() => { setSearch(""); }} className="text-xs text-[#024396]">Clear</button>}
            </div>

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
                      {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={field}>
                      <option value="">Assign to Employee</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    <textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${field} resize-none`} />
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAdd(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                      <button type="submit" disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60">
                        {saving ? "Saving..." : "Add Lead"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No leads found. Add your first lead!</p>
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
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70 hidden sm:table-cell">Assigned</th>
                        <th className="text-left px-4 py-3 font-medium text-[#2A364B]/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-[#F0EADD] hover:bg-[#FBF7EE] transition-colors">
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
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {lead.assigned_to && (
                              <button
                                onClick={() => navigate(`/portal/admin/employees/${lead.assigned_to}`)}
                                className="block text-[11px] text-[#024396] font-medium hover:underline mb-1"
                              >
                                {lead.assigned_to_name || "View profile"}
                              </button>
                            )}
                            <select value={lead.assigned_to || ""} onChange={(e) => e.target.value && assignLead(lead.id, e.target.value)}
                              className="text-xs border border-[#E2D8C2] rounded-lg px-2 py-1 bg-transparent">
                              <option value="">Unassigned</option>
                              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="WhatsApp">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                              <button onClick={() => deleteLead(lead.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                                title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
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

        {/* TAB: Website Leads */}
        {tab === "website" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#2A364B]/60">Leads from website contact form & popup</p>
            </div>
            {webLeads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No website leads yet. Leads from your website forms will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#2A364B]/60">Applications from the Career page (resume + form)</p>
            </div>
            {careerLeads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No career applications yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {careerLeads.map((cl) => (
                  <div key={cl.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0E1B2C]">{cl.full_name}</p>
                        <p className="text-xs text-[#2A364B]/70">{cl.phone} {cl.email && `| ${cl.email}`}</p>
                        {cl.position && <p className="text-xs text-[#024396]">Applied for: {cl.position} {cl.experience && `(${cl.experience})`}</p>}
                        {cl.message && <p className="text-xs text-[#2A364B]/50 mt-1">{cl.message}</p>}
                        {cl.resume_url && (
                          <a href={cl.resume_url} target="_blank" rel="noreferrer" className="text-xs text-[#024396] underline">
                            View Resume
                          </a>
                        )}
                        <p className="text-[10px] text-[#2A364B]/40">{new Date(cl.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={cl.status || "new"}
                          onChange={(e) => updateCareerStatus(cl.id, e.target.value)}
                          className="text-xs border border-[#E2D8C2] rounded-lg px-2 py-1.5"
                        >
                          <option value="new">New</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button onClick={() => deleteCareerLead(cl.id)}
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

        {/* TAB: Pipeline Config */}
        {tab === "pipeline" && (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C]">Pipeline Stages</h3>
            <p className="text-xs text-[#2A364B]/50">Customize lead pipeline stages. Drag to reorder or add/remove stages.</p>
            <div className="space-y-2">
              {pipelineStatuses.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#2A364B]/40 w-6">{i + 1}.</span>
                  <input value={s} onChange={(e) => {
                    const updated = [...pipelineStatuses];
                    updated[i] = e.target.value;
                    setPipelineStatuses(updated);
                  }} className={`${field} flex-1`} />
                  <button onClick={() => setPipelineStatuses(pipelineStatuses.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="New stage name" className={`${field} flex-1`} />
              <button onClick={() => { if (newStatus.trim()) { setPipelineStatuses([...pipelineStatuses, newStatus.trim()]); setNewStatus(""); } }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#024396] text-white">Add</button>
            </div>
            <button onClick={savePipeline}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600">
              Save Pipeline
            </button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
