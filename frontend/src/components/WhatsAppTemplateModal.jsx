import React, { useState, useEffect } from "react";
import { X, MessageCircle, Plus, Trash2 } from "lucide-react";
import ProtectedText from "./portal/ProtectedText";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

// Fill {name} / {service} placeholders in a template with the lead's real data
function fillTemplate(body, lead) {
  return body
    .replace(/\{name\}/gi, lead.name || "")
    .replace(/\{service\}/gi, lead.service_interest || "")
    .replace(/\{phone\}/gi, lead.phone || "");
}

export default function WhatsAppTemplateModal({ lead, token, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", body: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/pipelines/templates/`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = (body) => {
    const filled = fillTemplate(body, lead);
    const phone = (lead.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(filled)}`, "_blank");
    onClose();
  };

  const createTemplate = async (e) => {
    e.preventDefault();
    if (!newTpl.name.trim() || !newTpl.body.trim()) return;
    const res = await fetch(`${API_BASE}/api/pipelines/templates/`, {
      method: "POST", headers, body: JSON.stringify(newTpl),
    });
    if (res.ok) {
      setNewTpl({ name: "", body: "" });
      setCreating(false);
      load();
    }
  };

  const deleteTemplate = async (id) => {
    await fetch(`${API_BASE}/api/pipelines/templates/${id}`, { method: "DELETE", headers });
    load();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-[16px] text-[#0E1B2C] flex items-center gap-2">
            <MessageCircle size={16} className="text-[#16a34a]" /> Send WhatsApp
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={16} /></button>
        </div>
        <p className="text-[12px] text-[#2A364B]/50 mb-4">{lead.name} · <ProtectedText>{lead.phone}</ProtectedText></p>

        {loading ? (
          <p className="text-xs text-[#2A364B]/40 text-center py-6">Loading templates…</p>
        ) : (
          <div className="space-y-2 mb-4">
            <button
              onClick={() => send(`Hi ${lead.name}, this is from The Financial Doctor. Following up on our conversation.`)}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-[#E2D8C2] hover:border-[#16a34a] text-[13px] text-[#0E1B2C]"
            >
              Quick default message
            </button>
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => send(t.body)}
                  className="flex-1 text-left px-3 py-2.5 rounded-xl border border-[#E2D8C2] hover:border-[#16a34a] text-[13px] text-[#0E1B2C] truncate"
                  title={t.body}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-[11px] text-[#2A364B]/40 truncate">{t.body}</span>
                </button>
                <button onClick={() => deleteTemplate(t.id)} className="p-2 text-[#C7102E]/50 hover:text-[#C7102E]" title="Delete template">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {creating ? (
          <form onSubmit={createTemplate} className="space-y-2.5 border-t border-[#E2D8C2] pt-4">
            <input placeholder="Template name" value={newTpl.name} onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })} className={field} />
            <textarea
              rows={3}
              placeholder="Message text — use {name} and {service} as placeholders"
              value={newTpl.body}
              onChange={(e) => setNewTpl({ ...newTpl, body: e.target.value })}
              className={`${field} resize-none`}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(false)} className="flex-1 py-2 rounded-xl text-xs font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
              <button type="submit" className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-[#024396]">Save Template</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#024396] border border-dashed border-[#024396]/40 rounded-xl py-2.5">
            <Plus size={13} /> New Template
          </button>
        )}
      </div>
    </div>
  );
}
