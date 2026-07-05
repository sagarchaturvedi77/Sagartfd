import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { getCurrentLocation } from "../portal/api";
import { Search } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const now = new Date();

  const [today, setToday] = useState(null);
  const [leads, setLeads] = useState([]);
  const [services, setServices] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [showFollowUps, setShowFollowUps] = useState(false);

  const fetchProfileStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile-status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfileStatus(data);
        if (!data.profile_completed) navigate("/portal/employee/onboarding");
      }
    } catch { /* silent */ }
  }, [token, navigate]);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/today`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setToday(await res.json());
    } catch { /* silent */ }
  }, [token]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setLeads(await res.json());
    } catch { /* silent */ }
  }, [token]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchProfileStatus();
    fetchToday();
    fetchLeads();
    fetchServices();
  }, [fetchProfileStatus, fetchToday, fetchLeads, fetchServices]);

  const punch = async (action) => {
    setActionLoading(true);
    const loc = await getCurrentLocation();
    const res = await fetch(`${API_BASE}/api/attendance/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(loc || {}),
    });
    if (res.ok) { await fetchToday(); }
    setActionLoading(false);
  };

  const hasClockedIn = today && today.clock_in;
  const hasClockedOut = today && today.clock_out;

  // Lead stats
  const todayStr = now.toISOString().split("T")[0];
  const newLeads = leads.filter(l => l.status === "new").length;
  const followUpLeads = leads.filter(l => l.status === "follow_up").length;
  const totalClients = leads.length;
  const todayFollowUps = leads.filter(l => l.follow_up_date && l.follow_up_date.startsWith(todayStr));

  // Filter leads for search/filter view
  const filteredLeads = leads.filter(l => {
    if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase()) && !l.phone.includes(searchQuery)) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterService && (!l.service_interest || !l.service_interest.toLowerCase().includes(filterService.toLowerCase()))) return false;
    return true;
  });

  return (
    <PortalLayout>
      {profileStatus?.training_days > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-orange-800">Training Period</p>
          <p className="text-xs text-orange-600">{profileStatus.training_days} days remaining</p>
        </div>
      )}

      {/* Punch Section */}
      <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] rounded-2xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Today's Shift</p>
            <p className="text-xl font-serif">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            {hasClockedIn && (
              <p className="text-sm text-white/60 mt-1">
                Punched in at {new Date(today.clock_in).toLocaleTimeString()}
                {hasClockedOut && ` — Out at ${new Date(today.clock_out).toLocaleTimeString()}`}
              </p>
            )}
          </div>
          <div>
            {!hasClockedIn ? (
              <button onClick={() => punch("clock-in")} disabled={actionLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                {actionLoading ? "Locating..." : "Punch In"}
              </button>
            ) : !hasClockedOut ? (
              <button onClick={() => punch("clock-out")} disabled={actionLoading} className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                {actionLoading ? "Locating..." : "Punch Out"}
              </button>
            ) : (
              <span className="bg-white/10 px-6 py-3 rounded-xl text-sm font-medium">Day Complete — {today.total_hours}h</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button onClick={() => navigate("/portal/employee/leads")} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 transition-all">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">New Leads</p>
          <p className="text-2xl font-bold text-blue-600">{newLeads}</p>
        </button>
        <button onClick={() => navigate("/portal/employee/leads")} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 transition-all">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Follow Ups</p>
          <p className="text-2xl font-bold text-orange-600">{followUpLeads}</p>
        </button>
        <button onClick={() => navigate("/portal/employee/leads")} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 transition-all">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Total Clients</p>
          <p className="text-2xl font-bold text-[#0E1B2C]">{totalClients}</p>
        </button>
        <button onClick={() => setShowFollowUps(true)} className="bg-white rounded-xl border border-[#E2D8C2] p-4 shadow-sm text-left hover:border-[#024396]/30 transition-all relative">
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider mb-1">Today's Follow-ups</p>
          <p className="text-2xl font-bold text-purple-600">{todayFollowUps.length}</p>
          {todayFollowUps.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        </button>
      </div>

      {/* Today's Follow-ups Modal */}
      {showFollowUps && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0E1B2C]">Today's Follow-ups ({todayFollowUps.length})</h3>
              <button onClick={() => setShowFollowUps(false)} className="text-[#2A364B]/40 hover:text-[#2A364B] text-xl">&times;</button>
            </div>
            {todayFollowUps.length === 0 ? (
              <p className="text-sm text-[#2A364B]/50">No follow-ups scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayFollowUps.map(lead => (
                  <div key={lead.id} className="bg-[#FBF7EE] rounded-xl p-3">
                    <p className="font-medium text-sm text-[#0E1B2C]">{lead.name}</p>
                    <p className="text-xs text-[#2A364B]/60">{lead.phone} {lead.service_interest && `· ${lead.service_interest}`}</p>
                    {lead.follow_up_note && <p className="text-xs text-[#2A364B]/50 mt-1">{lead.follow_up_note}</p>}
                    <a href={`tel:+91${lead.phone.replace(/\D/g, "")}`} className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-medium text-white bg-[#024396]">Call Now</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter Section */}
      <div className="bg-white rounded-2xl border border-[#E2D8C2] p-4 shadow-sm mb-6 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2D8C2] text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border border-[#E2D8C2] rounded-lg px-3 py-1.5">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="follow_up">Follow Up</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="text-xs border border-[#E2D8C2] rounded-lg px-3 py-1.5">
            <option value="">All Services</option>
            {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          {(searchQuery || filterStatus || filterService) && (
            <button onClick={() => { setSearchQuery(""); setFilterStatus(""); setFilterService(""); }} className="text-xs text-[#024396] hover:underline">Clear All</button>
          )}
        </div>

        {/* Filtered Results */}
        {(searchQuery || filterStatus || filterService) && (
          <div className="mt-2">
            <p className="text-xs text-[#2A364B]/50 mb-2">{filteredLeads.length} results</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredLeads.slice(0, 20).map(lead => (
                <div key={lead.id} className="flex items-center justify-between bg-[#FBF7EE] rounded-lg p-2.5 cursor-pointer hover:bg-[#F5F1EB]" onClick={() => navigate("/portal/employee/leads")}>
                  <div>
                    <p className="font-medium text-xs text-[#0E1B2C]">{lead.name} — {lead.phone}</p>
                    <p className="text-[10px] text-[#2A364B]/50">{lead.service_interest || "No service"} · {lead.status}</p>
                  </div>
                  {lead.follow_up_date && <span className="text-[10px] text-orange-500">{lead.follow_up_date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => navigate("/portal/employee/leads")} className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#024396]">📋</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">My Leads</h4>
              <p className="text-xs text-[#2A364B]/50">Call, update & manage your clients</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/portal/employee/attendance")} className="bg-white rounded-2xl border border-[#E2D8C2] p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">📅</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C]">Attendance History</h4>
              <p className="text-xs text-[#2A364B]/50">View your daily log summary</p>
            </div>
          </div>
        </button>
      </div>
    </PortalLayout>
  );
}
