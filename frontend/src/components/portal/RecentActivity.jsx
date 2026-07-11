import React, { useState } from "react";
import { Phone, MessageCircle, PencilLine, UserPlus, Check } from "lucide-react";
import { timeAgo } from "../../lib/utils";
import EmptyState from "./EmptyState";
import PortalModal from "./PortalModal";
import CallFlowPopup from "../CallFlowPopup";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_TEXT = {
  new: "New lead added",
  contacted: "Contacted",
  follow_up: "Follow-up scheduled",
  interested: "Marked interested",
  converted: "Converted 🎉",
  lost: "Marked lost",
  not_interested: "Not interested",
};

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

function hasRealName(lead) {
  const name = lead.name?.trim();
  return !!name && name !== lead.phone;
}

function describeLead(lead) {
  const lastHistory = lead.status_history?.[lead.status_history.length - 1];
  const lastHistoryAt = lastHistory?.at || lastHistory?.date;
  const attemptAt = lead.last_call_attempted_at;

  // A call was started (tel: link tapped) but nothing was recorded since —
  // the outcome popup was likely missed or dismissed (app backgrounded and
  // killed mid-call, accidental tap-away). Surface this distinctly so the
  // employee knows to tap "Add update" and finish recording it, instead of
  // it silently vanishing from view.
  const outcomePending = attemptAt
    && (!lead.last_call_at || new Date(attemptAt) > new Date(lead.last_call_at))
    && (!lastHistoryAt || new Date(attemptAt) > new Date(lastHistoryAt));
  if (outcomePending) {
    return { text: "Call started — outcome not recorded yet", at: attemptAt, isCall: true, pending: true };
  }

  if (lastHistory?.status) {
    return { text: STATUS_TEXT[lastHistory.status] || `Status: ${lastHistory.status}`, at: lastHistory.at, isCall: false };
  }
  if (lastHistory?.connection_status) {
    const label = lastHistory.connection_status === "connected" ? "Call connected" : "Call attempted — not connected";
    return { text: label, at: lastHistory.date, isCall: true };
  }
  if (lead.last_call_at) {
    return { text: `Called (${lead.call_attempts || 1} attempt${lead.call_attempts === 1 ? "" : "s"})`, at: lead.last_call_at, isCall: true };
  }
  return { text: "Updated", at: lead.updated_at, isCall: false };
}

// Every history-entry shape used across the lead call-flow (status change,
// call outcome, transfer note) gets normalized to one {label, note, by, at}
// row so the timeline can render them uniformly regardless of which flow
// produced them.
function historyRows(lead) {
  const rows = [];
  for (const h of lead.status_history || []) {
    if (h.status) {
      rows.push({ label: STATUS_TEXT[h.status] || h.status, note: h.note, by: h.by_name, at: h.at });
    } else if (h.connection_status) {
      const label = h.connection_status === "connected"
        ? `Connected${h.sub_stage ? ` — ${h.sub_stage}` : ""}`
        : `Not connected${h.sub_stage ? ` — ${h.sub_stage}` : ""}`;
      rows.push({ label, note: h.note, by: h.by, at: h.date });
    } else if (h.note !== undefined && h.date) {
      rows.push({ label: "Note added", note: h.note, by: h.by_name, at: h.date });
    }
  }
  for (const t of lead.transfer_history || []) {
    rows.push({ label: `Reassigned${t.to ? ` to ${t.to}` : ""}`, note: t.note, by: t.from, at: t.at });
  }
  return rows.filter((r) => r.at).sort((a, b) => new Date(b.at) - new Date(a.at));
}

// Downloads a .vcf — mobile browsers hand this straight to the Contacts
// app, so this is the actual "save this number on my phone" action, not
// just a CRM-side save.
function saveToContacts(lead) {
  const digits = String(lead.phone || "").replace(/\D/g, "");
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${lead.name || lead.phone}`,
    `TEL;TYPE=CELL:+91${digits}`,
    "END:VCARD",
  ].join("\n");
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(lead.name || lead.phone).replace(/[^\w\s-]/g, "")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function NameEditor({ lead, token, onSaved }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${lead.id}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Add client name…"
        className="min-w-0 flex-1 text-sm px-2 py-1 rounded-md border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] outline-none focus:border-[#024396]"
      />
      <button
        onClick={save}
        disabled={!name.trim() || saving}
        className="shrink-0 w-7 h-7 rounded-md bg-[#024396] text-white flex items-center justify-center disabled:opacity-40"
        title="Save name"
      >
        <Check size={13} />
      </button>
    </div>
  );
}

/**
 * "Recent calls / recent updates" feed — the most recently touched leads.
 * Click the name for full history, or use the quick actions: call,
 * WhatsApp, add a status update (reuses the same CallFlowPopup as the
 * Leads page), or save the number to the phone's contacts. Leads that only
 * have a phone number (no name yet) get an inline name field instead of
 * the usual name/click-through row.
 */
export default function RecentActivity({ leads = [], limit = 6, token, onUpdated }) {
  const [historyLead, setHistoryLead] = useState(null);
  const [updateLead, setUpdateLead] = useState(null);

  const activityAt = (l) => {
    const times = [l.updated_at, l.last_call_attempted_at].filter(Boolean).map((t) => new Date(t).getTime());
    return times.length ? Math.max(...times) : 0;
  };

  const sorted = [...leads]
    .filter((l) => l.updated_at || l.last_call_attempted_at)
    .sort((a, b) => activityAt(b) - activityAt(a))
    .slice(0, limit);

  if (sorted.length === 0) {
    return <EmptyState icon="🕓" title="No recent activity yet" subtitle="Calls and status updates will show up here." />;
  }

  return (
    <>
      <div className="divide-y divide-[#E2D8C2]/60 dark:divide-white/10">
        {sorted.map((lead) => {
          const { text, at, isCall, pending } = describeLead(lead);
          const waPhone = normalizePhone(lead.phone);
          const named = hasRealName(lead);
          return (
            <div key={lead.id} className={`flex items-center gap-3 py-2.5 ${pending ? "bg-amber-50/60 dark:bg-amber-900/10 -mx-2 px-2 rounded-lg" : ""}`}>
              <button
                onClick={() => named && setHistoryLead(lead)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative ${
                  pending
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                    : isCall ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-blue-50 dark:bg-blue-900/30 text-[#024396] dark:text-[#7CB0FF]"
                }`}
              >
                {isCall ? <Phone size={14} /> : named ? lead.name.charAt(0).toUpperCase() : "?"}
                {pending && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-[#101D2E]" />}
              </button>

              {named ? (
                <button onClick={() => setHistoryLead(lead)} className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] truncate hover:underline">{lead.name}</p>
                  <p className={`text-xs truncate ${pending ? "text-amber-600 dark:text-amber-400 font-medium" : "text-[#2A364B]/50 dark:text-[#8E99AC]"}`}>{text} · {timeAgo(at || lead.updated_at)}</p>
                </button>
              ) : token ? (
                <NameEditor lead={lead} token={token} onSaved={onUpdated} />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] truncate">{lead.phone}</p>
                  <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] truncate">{text} · {timeAgo(at || lead.updated_at)}</p>
                </div>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {lead.phone && (
                  <a
                    href={`tel:+91${lead.phone.replace(/\D/g, "")}`}
                    className="w-8 h-8 rounded-full bg-[#024396]/10 dark:bg-white/10 text-[#024396] dark:text-[#7CB0FF] flex items-center justify-center hover:bg-[#024396]/20 dark:hover:bg-white/20 transition-colors"
                    title={`Call ${lead.name || lead.phone}`}
                  >
                    <Phone size={14} />
                  </a>
                )}
                {waPhone && (
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${named ? lead.name : ""}, this is from The Financial Doctor — following up on your enquiry.`.replace("Hi , ", "Hi, "))}`}
                    target="_blank" rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    title={`WhatsApp ${lead.name || lead.phone}`}
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
                {lead.phone && (
                  <button
                    onClick={() => saveToContacts(lead)}
                    className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                    title="Save to phone contacts"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
                {token && (
                  <button
                    onClick={() => setUpdateLead(lead)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      pending
                        ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    }`}
                    title={pending ? `Record call outcome for ${lead.name || lead.phone}` : `Add update for ${lead.name || lead.phone}`}
                  >
                    <PencilLine size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Client history timeline */}
      <PortalModal
        open={!!historyLead}
        onOpenChange={(v) => !v && setHistoryLead(null)}
        title={historyLead?.name}
        description={historyLead ? `${historyLead.phone}${historyLead.service_interest ? ` · ${historyLead.service_interest}` : ""}` : ""}
        maxWidth="max-w-md"
      >
        {historyLead && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto -mr-1 pr-1">
            {historyRows(historyLead).length === 0 ? (
              <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">No history recorded yet for this lead.</p>
            ) : (
              historyRows(historyLead).map((row, i) => (
                <div key={i} className="border-l-2 border-[#024396]/20 dark:border-[#7CB0FF]/30 pl-3">
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{row.label}</p>
                  {row.note && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mt-0.5">{row.note}</p>}
                  <p className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-0.5">
                    {row.by ? `${row.by} · ` : ""}{timeAgo(row.at)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </PortalModal>

      {/* Add update — reuses the same call-flow popup as the Leads page */}
      {updateLead && token && (
        <CallFlowPopup
          lead={updateLead}
          token={token}
          onClose={() => setUpdateLead(null)}
          onSaved={() => { setUpdateLead(null); onUpdated?.(); }}
        />
      )}
    </>
  );
}
