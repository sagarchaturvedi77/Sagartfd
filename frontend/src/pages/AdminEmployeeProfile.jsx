import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Phone, Mail, Briefcase, MessageSquarePlus, Clock } from "lucide-react";
import PortalModal from "../components/portal/PortalModal";
import StatusBadge from "../components/portal/StatusBadge";
import EmptyState from "../components/portal/EmptyState";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", follow_up: "Follow Up",
  interested: "Interested", converted: "Converted", lost: "Lost",
};

export default function AdminEmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [employee, setEmployee] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteFor, setNoteFor] = useState(null); // lead being annotated
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/employees/${employeeId}/activity`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        setLeads(data.leads || []);
      }
    } catch { /* silent */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, token]);

  useEffect(() => { load(); }, [load]);

  const [submitNote, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`${API_BASE}/api/leads/${noteFor.id}/note`, {
      method: "POST", headers, body: JSON.stringify({ note: noteText.trim() }),
    });
    if (res.ok) { setNoteFor(null); setNoteText(""); load(); }
  });

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }
  if (!employee) {
    return (
      <PortalLayout>
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-12 text-center shadow-sm">
          <p className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium mb-1">Employee not found</p>
          <button onClick={() => navigate("/portal/admin/leads")} className="text-sm text-[#024396] dark:text-[#7CB0FF] font-medium mt-2">← Back</button>
        </div>
      </PortalLayout>
    );
  }

  const statCounts = {};
  leads.forEach((l) => { statCounts[l.status] = (statCounts[l.status] || 0) + 1; });

  return (
    <PortalLayout>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-[#2A364B]/60 dark:text-[#8E99AC] hover:text-[#024396] dark:hover:text-[#7CB0FF] mb-4">
        <ArrowLeft size={13} /> Back
      </button>

      {/* Employee header card */}
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-6 shadow-sm mb-6 flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-white font-serif text-xl shrink-0">
          {(employee.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3]">{employee.name}</h2>
          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{employee.designation || "Employee"}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">
            {employee.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {employee.email}</span>}
            {employee.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {employee.phone}</span>}
            {employee.join_date && <span className="inline-flex items-center gap-1"><Briefcase size={12} /> Since {employee.join_date}</span>}
          </div>
        </div>
        {employee.is_active === false && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#C7102E] dark:text-red-400 bg-[#FBE4E4] dark:bg-red-900/20 px-2.5 py-1 rounded-full shrink-0">Inactive</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="shrink-0 bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 px-4 py-2 text-center min-w-[80px]">
            <p className="text-lg font-bold text-[#0E1B2C] dark:text-[#F1EDE3]">{statCounts[key] || 0}</p>
            <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] uppercase">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick note modal */}
      <PortalModal
        open={!!noteFor}
        onOpenChange={(v) => !v && setNoteFor(null)}
        title="Add Update"
        description={noteFor ? `${noteFor.name} · ${noteFor.phone}` : ""}
        maxWidth="max-w-sm"
      >
        <form onSubmit={submitNote} className="space-y-3">
          <textarea
            rows={3}
            autoFocus
            placeholder="What's the update?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 resize-none"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setNoteFor(null)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {saving ? "Saving…" : "Save Update"}
            </Button>
          </div>
        </form>
      </PortalModal>

      {/* Leads + their update history */}
      <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Leads &amp; Updates</h3>
      {leads.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10">
          <EmptyState icon="👤" title="No leads assigned to this employee yet." />
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{lead.name}</p>
                  <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">{lead.phone} {lead.city ? `· ${lead.city}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={lead.status} label={STATUS_LABELS[lead.status]} />
                  <button
                    onClick={() => { setNoteFor(lead); setNoteText(""); }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/5 hover:bg-[#024396]/10 dark:hover:bg-white/10 rounded-lg px-2.5 py-1.5"
                  >
                    <MessageSquarePlus size={12} /> Add Update
                  </button>
                </div>
              </div>

              {(lead.status_history || []).length === 0 ? (
                <p className="text-[11px] text-[#2A364B]/35 dark:text-[#8E99AC]/60">No updates logged yet.</p>
              ) : (
                <div className="space-y-2 border-t border-[#E2D8C2] dark:border-white/10 pt-3">
                  {[...(lead.status_history || [])].reverse().slice(0, 6).map((h, i) => (
                    <div key={i} className="flex gap-2 text-[12px]">
                      <Clock size={12} className="text-[#2A364B]/30 dark:text-[#8E99AC]/50 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[#2A364B]/40 dark:text-[#8E99AC]/70 text-[10.5px]">
                          {new Date(h.date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {h.by_name ? ` · ${h.by_name}` : ""}
                        </span>
                        <p className="text-[#2A364B]/80 dark:text-[#C7CEDA]">
                          {h.note || (h.status ? `Status → ${STATUS_LABELS[h.status] || h.status}` : h.connection_status ? `Call: ${h.connection_status} (${h.sub_stage})` : "Updated")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
