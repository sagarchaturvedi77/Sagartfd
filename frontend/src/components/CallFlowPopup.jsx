import React, { useState } from "react";
import { PhoneCall, PhoneOff, X, CheckCircle2, XCircle, Trophy, Clock, PhoneMissed, PhoneOff as SwitchOffIcon, Ban, WifiOff } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

const SERVICE_OPTIONS = ["Mutual Fund", "Insurance - Term", "Insurance - Health", "Insurance - Motor", "NPS", "Bonds/NCDs", "Portfolio Management", "Other"];

const CONNECTED_OPTIONS = [
  { key: "interested", label: "Interested", icon: CheckCircle2, color: "#16a34a", bg: "#EAF6EE" },
  { key: "not_interested", label: "Not Interested", icon: XCircle, color: "#B8862B", bg: "#FBF1DD" },
  { key: "converted", label: "Converted", icon: Trophy, color: "#024396", bg: "#EAF1FB" },
  { key: "lost", label: "Lost", icon: XCircle, color: "#C7102E", bg: "#FBE4E4" },
];

const NOT_CONNECTED_OPTIONS = [
  { key: "npc", label: "No Response (NPC)", icon: PhoneMissed, color: "#B8862B", bg: "#FBF1DD" },
  { key: "switchoff", label: "Switched Off", icon: SwitchOffIcon, color: "#5C677D", bg: "#F0F1F3" },
  { key: "invalid", label: "Invalid Number", icon: Ban, color: "#C7102E", bg: "#FBE4E4" },
  { key: "network_issue", label: "Network Issue", icon: WifiOff, color: "#0891b2", bg: "#E3F4F7" },
];

export default function CallFlowPopup({ lead, token, onClose, onSaved }) {
  const [connectionStatus, setConnectionStatus] = useState(null); // "connected" | "not_connected"
  const [subStage, setSubStage] = useState(null);
  const [form, setForm] = useState({
    notes: "", service_interest: "", code_name: "", service_duration_months: "",
    follow_up_date: "", follow_up_time: "",
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // server response after save

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const reset = () => { setConnectionStatus(null); setSubStage(null); setResult(null); };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        connection_status: connectionStatus,
        sub_stage: subStage,
        notes: form.notes || null,
        service_interest: form.service_interest || null,
        code_name: form.code_name || null,
        service_duration_months: form.service_duration_months ? Number(form.service_duration_months) : null,
        follow_up_date: form.follow_up_date || null,
        follow_up_time: form.follow_up_time || null,
      };
      const res = await fetch(`${API_BASE}/api/leads/${lead.id}/call-outcome`, {
        method: "POST", headers, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } finally {
      setSaving(false);
    }
  };

  const finish = () => { onSaved?.(); onClose(); };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E2D8C2] px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-serif text-[16px] text-[#0E1B2C]">Call Outcome</h3>
            <p className="text-[11.5px] text-[#2A364B]/50">{lead.name} · {lead.phone}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={18} /></button>
        </div>

        <div className="p-5">
          {result ? (
            <ResultScreen result={result} onDone={finish} />
          ) : !connectionStatus ? (
            <>
              <p className="text-[13px] text-[#2A364B]/60 mb-4">Did the call connect?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConnectionStatus("connected")}
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-[#16a34a]/30 bg-[#EAF6EE] hover:border-[#16a34a] transition-colors"
                >
                  <PhoneCall size={26} className="text-[#16a34a]" />
                  <span className="text-[13px] font-semibold text-[#0E1B2C]">Connected</span>
                </button>
                <button
                  onClick={() => setConnectionStatus("not_connected")}
                  className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-[#C7102E]/30 bg-[#FBE4E4] hover:border-[#C7102E] transition-colors"
                >
                  <PhoneOff size={26} className="text-[#C7102E]" />
                  <span className="text-[13px] font-semibold text-[#0E1B2C]">Not Connected</span>
                </button>
              </div>
            </>
          ) : !subStage ? (
            <>
              <button onClick={reset} className="text-[11.5px] text-[#2A364B]/50 hover:text-[#024396] mb-3">← Back</button>
              <p className="text-[13px] text-[#2A364B]/60 mb-4">
                {connectionStatus === "connected" ? "How did it go?" : "What happened?"}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {(connectionStatus === "connected" ? CONNECTED_OPTIONS : NOT_CONNECTED_OPTIONS).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSubStage(opt.key)}
                      className="flex flex-col items-center gap-1.5 py-4 rounded-xl border text-center"
                      style={{ background: opt.bg, borderColor: `${opt.color}40` }}
                    >
                      <Icon size={20} style={{ color: opt.color }} />
                      <span className="text-[12px] font-medium text-[#0E1B2C]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setSubStage(null)} className="text-[11.5px] text-[#2A364B]/50 hover:text-[#024396] mb-3">← Back</button>
              <SubStageForm
                subStage={subStage}
                form={form}
                setForm={setForm}
                saving={saving}
                onSubmit={submit}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SubStageForm({ subStage, form, setForm, saving, onSubmit }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (subStage === "interested") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <p className="text-[12.5px] font-medium text-[#0E1B2C]">Update client details</p>
        <select value={form.service_interest} onChange={(e) => set("service_interest", e.target.value)} className={field}>
          <option value="">Select service…</option>
          {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <textarea rows={3} placeholder="What did you discuss? (notes)" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} resize-none`} />
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-[#2A364B]/50 mb-1 block">Next follow-up date</label>
            <input type="date" value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-[11px] text-[#2A364B]/50 mb-1 block">Time</label>
            <input type="time" value={form.follow_up_time} onChange={(e) => set("follow_up_time", e.target.value)} className={field} />
          </div>
        </div>
        <p className="text-[11px] text-[#2A364B]/40 flex items-center gap-1"><Clock size={11} /> A reminder will be sent automatically on that date/time.</p>
        <SubmitBtn saving={saving} />
      </form>
    );
  }

  if (subStage === "converted") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <p className="text-[12.5px] font-medium text-[#0E1B2C]">🎉 Converted — update details</p>
        <select value={form.service_interest} onChange={(e) => set("service_interest", e.target.value)} className={field}>
          <option value="">Select service…</option>
          {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Plan / code name" value={form.code_name} onChange={(e) => set("code_name", e.target.value)} className={field} />
        <div>
          <label className="text-[11px] text-[#2A364B]/50 mb-1 block">If this is a monthly service, how many months?</label>
          <input type="number" min="1" placeholder="e.g. 12" value={form.service_duration_months} onChange={(e) => set("service_duration_months", e.target.value)} className={field} />
        </div>
        <textarea rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} resize-none`} />
        {form.service_duration_months && (
          <p className="text-[11px] text-[#2A364B]/40 flex items-center gap-1"><Clock size={11} /> You'll get a renewal reminder 3 days before it expires.</p>
        )}
        <SubmitBtn saving={saving} label="Save & Mark Converted" />
      </form>
    );
  }

  if (subStage === "not_interested") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <p className="text-[12.5px] text-[#2A364B]/60">
          We'll remind you to try again tomorrow. After 3 "not interested" calls, this lead moves to Lost automatically.
        </p>
        <textarea rows={2} placeholder="Reason (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} resize-none`} />
        <SubmitBtn saving={saving} />
      </form>
    );
  }

  if (subStage === "lost") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <p className="text-[12.5px] text-[#2A364B]/60">This lead will be marked Lost.</p>
        <textarea rows={2} placeholder="Reason (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} resize-none`} />
        <SubmitBtn saving={saving} label="Mark as Lost" />
      </form>
    );
  }

  if (subStage === "invalid") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <p className="text-[12.5px] text-[#2A364B]/60">Invalid numbers are moved straight to Lost — no retries.</p>
        <SubmitBtn saving={saving} label="Confirm & Mark Lost" />
      </form>
    );
  }

  // npc / switchoff / network_issue
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
      <p className="text-[12.5px] text-[#2A364B]/60">
        We'll remind you to try again tomorrow. After 3 unanswered attempts, this lead moves to Lost automatically.
      </p>
      <SubmitBtn saving={saving} />
    </form>
  );
}

function SubmitBtn({ saving, label = "Save" }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60"
    >
      {saving ? "Saving…" : label}
    </button>
  );
}

function ResultScreen({ result, onDone }) {
  const statusMessages = {
    interested: "Marked as Interested — follow-up reminder set.",
    follow_up: "Reminder set to retry tomorrow.",
    converted: "🎉 Marked as Converted!",
    lost: "This lead has been marked Lost.",
  };
  return (
    <div className="text-center py-6">
      <CheckCircle2 size={40} className="text-[#16a34a] mx-auto mb-3" />
      <p className="text-[14px] font-medium text-[#0E1B2C] mb-1">Saved</p>
      <p className="text-[13px] text-[#2A364B]/60 mb-1">{statusMessages[result.new_status] || `Status: ${result.new_status}`}</p>
      {result.call_attempts > 0 && result.new_status !== "lost" && (
        <p className="text-[11px] text-[#2A364B]/40 mb-5">Attempt {result.call_attempts} of 3</p>
      )}
      <button onClick={onDone} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#024396]">Done</button>
    </div>
  );
}
