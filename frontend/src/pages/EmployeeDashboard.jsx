import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { getCurrentLocation } from "../portal/api";
import { Search } from "lucide-react";
import { useWidgets } from "../components/DashboardCustomizer";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";
import PortalModal from "../components/portal/PortalModal";
import RecentActivity from "../components/portal/RecentActivity";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const { activeWidgets } = useWidgets(user?.id, "employee");

  const [today, setToday] = useState(null);
  const [leads, setLeads] = useState([]);
  const [services, setServices] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [myTarget, setMyTarget] = useState(null);

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

  const fetchMyTarget = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/targets/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = await res.json();
        const nowD = new Date();
        // An employee can carry several distinct targets in one month now
        // (e.g. "5 SIPs" + "₹15,000 revenue") — the dashboard quick-stat
        // shows the average progress across all of them, not just one.
        const current = list.filter(t => t.month === nowD.getMonth() + 1 && t.year === nowD.getFullYear());
        setMyTarget(current.length
          ? { progress_pct: current.reduce((sum, t) => sum + t.progress_pct, 0) / current.length, count: current.length }
          : null);
      }
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchProfileStatus();
    fetchToday();
    fetchLeads();
    fetchServices();
    fetchMyTarget();
  }, [fetchProfileStatus, fetchToday, fetchLeads, fetchServices, fetchMyTarget]);

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
  // Matches EmployeeLeads.jsx's Follow Up tab exactly: any lead with a
  // scheduled follow_up_date counts, not just status === "follow_up"
  // literally (e.g. an "interested" lead can still have a pending
  // follow-up) — this card previously used the narrower definition, which
  // is why the count here never matched what the Follow Up tab showed.
  const followUpLeads = leads.filter(l => l.follow_up_date && !["lost", "converted"].includes(l.status)).length;
  const totalClients = leads.filter(l => l.status === "converted").length;
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
      <PageHeader icon="📊" title={`Hi, ${user?.name?.split(" ")[0] || "there"}`} subtitle="Here's what's happening today" />

      {profileStatus?.training_days > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-orange-800">Training Period</p>
          <p className="text-xs text-orange-600">{profileStatus.training_days} days remaining</p>
        </div>
      )}

      {/* Punch Section - Compact */}
      {activeWidgets.includes("attendance") && (
        <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] rounded-xl p-3.5 text-white shadow-md mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">{now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
              {hasClockedIn && (
                <p className="text-[11px] text-white/60 mt-0.5">
                  In: {new Date(today.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {hasClockedOut && ` · Out: ${new Date(today.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </p>
              )}
            </div>
            <div>
              {!hasClockedIn ? (
                <button onClick={() => punch("clock-in")} disabled={actionLoading} className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow">
                  {actionLoading ? "..." : "Punch In"}
                </button>
              ) : !hasClockedOut ? (
                <button onClick={() => punch("clock-out")} disabled={actionLoading} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow">
                  {actionLoading ? "..." : "Punch Out"}
                </button>
              ) : (
                <span className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium">{today.total_hours}h Done</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {(activeWidgets.includes("targets") || activeWidgets.includes("leads")) && (
        <div className="flex flex-wrap gap-4 mb-6">
          {activeWidgets.includes("targets") && (
            <StatCard
              label="🎯 My Target" color="green"
              trend={myTarget?.count > 1 ? `Avg across ${myTarget.count} targets` : "Tasks also inside"}
              value={myTarget ? `${Math.round(myTarget.progress_pct)}%` : "—"}
              onClick={() => navigate("/portal/employee/targets")}
              className="flex-1 min-w-[140px]"
            />
          )}
          {activeWidgets.includes("leads") && (
            <>
              <StatCard label="New Leads" color="navy" value={newLeads} onClick={() => navigate("/portal/employee/leads?tab=new")} className="flex-1 min-w-[140px]" />
              <StatCard label="Follow Ups" color="amber" value={followUpLeads} onClick={() => navigate("/portal/employee/leads?tab=follow_up")} className="flex-1 min-w-[140px]" />
              <StatCard label="Total Clients" color="slate" value={totalClients} onClick={() => navigate("/portal/employee/leads?tab=converted")} className="flex-1 min-w-[140px]" />
              <StatCard
                label="Today's Follow-ups" color="purple" value={todayFollowUps.length}
                onClick={() => setShowFollowUps(true)} className="flex-1 min-w-[140px] relative"
                icon={todayFollowUps.length > 0 ? <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : null}
              />
            </>
          )}
        </div>
      )}

      {/* Today's Follow-ups Modal */}
      <PortalModal
        open={showFollowUps}
        onOpenChange={setShowFollowUps}
        title={`Today's Follow-ups (${todayFollowUps.length})`}
        maxWidth="max-w-md"
      >
        {todayFollowUps.length === 0 ? (
          <p className="text-sm text-[#2A364B]/50 dark:text-[#C7CEDA]/50">No follow-ups scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayFollowUps.map(lead => (
              <div key={lead.id} className="bg-[#FBF7EE] dark:bg-white/5 rounded-xl p-3">
                <p className="font-medium text-sm text-[#0E1B2C] dark:text-[#F1EDE3]">{lead.name}</p>
                <p className="text-xs text-[#2A364B]/60 dark:text-[#C7CEDA]/60">{lead.phone} {lead.service_interest && `· ${lead.service_interest}`}</p>
                {lead.follow_up_note && <p className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50 mt-1">{lead.follow_up_note}</p>}
                <a href={`tel:+91${lead.phone.replace(/\D/g, "")}`} className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-medium text-white bg-[#024396]">Call Now</a>
              </div>
            ))}
          </div>
        )}
      </PortalModal>

      {/* Search + Filter Section */}
      {activeWidgets.includes("leads") && (
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 shadow-sm mb-6 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2A364B]/40 dark:text-[#C7CEDA]/40" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2D8C2] dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-1.5">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="follow_up">Follow Up</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="text-xs border border-[#E2D8C2] dark:border-white/10 rounded-lg px-3 py-1.5">
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
            <p className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50 mb-2">{filteredLeads.length} results</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredLeads.slice(0, 20).map(lead => (
                <div key={lead.id} className="flex items-center justify-between bg-[#FBF7EE] dark:bg-white/5 rounded-lg p-2.5 cursor-pointer hover:bg-[#F5F1EB] dark:bg-white/5" onClick={() => navigate("/portal/employee/leads")}>
                  <div>
                    <p className="font-medium text-xs text-[#0E1B2C] dark:text-[#F1EDE3]">{lead.name} — {lead.phone}</p>
                    <p className="text-[10px] text-[#2A364B]/50 dark:text-[#C7CEDA]/50">{lead.service_interest || "No service"} · {lead.status}</p>
                  </div>
                  {lead.follow_up_date && <span className="text-[10px] text-orange-500">{lead.follow_up_date}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Recent Activity — recent calls & status updates, one-tap call-back */}
      {activeWidgets.includes("leads") && (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-4 sm:p-5 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Recent Activity</h3>
          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mb-2">Your latest calls and status updates</p>
          <RecentActivity leads={leads} token={token} onUpdated={fetchLeads} />
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => navigate("/portal/employee/leads")} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#024396]">📋</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">My Leads</h4>
              <p className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50">Call, update & manage your clients</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/portal/employee/attendance")} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm text-left hover:border-[#024396]/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">📅</div>
            <div>
              <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Attendance History</h4>
              <p className="text-xs text-[#2A364B]/50 dark:text-[#C7CEDA]/50">View your daily log summary</p>
            </div>
          </div>
        </button>
      </div>
    </PortalLayout>
  );
}
