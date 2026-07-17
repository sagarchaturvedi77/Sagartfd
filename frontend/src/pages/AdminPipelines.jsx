import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { Plus, X, Trash2, Users, Pencil, PhoneCall, PhoneOff, ChevronRight, GripVertical, LayoutGrid } from "lucide-react";
import PageHeader from "../components/portal/PageHeader";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const COLORS = ["#024396", "#16a34a", "#C7102E", "#B8862B", "#7c3aed", "#0891b2", "#5C677D"];

// What each custom stage means to the call-flow engine (drives reminders,
// 3-attempt auto-lost, etc). Optional — leave blank for a purely organisational stage.
const CONNECTED_OUTCOME_TYPES = [
  { value: "", label: "— none —" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];
const NOT_CONNECTED_OUTCOME_TYPES = [
  { value: "", label: "— none —" },
  { value: "npc", label: "No Response" },
  { value: "switchoff", label: "Switched Off" },
  { value: "invalid", label: "Invalid Number" },
  { value: "network_issue", label: "Network Issue" },
];

const emptyStage = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  name: "",
  parent_id: null,
  outcome_type: null,
  children: [],
  color: COLORS[0],
});

const field = "w-full border border-[#E2D8C2] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";
const btnPrimary = "bg-[#024396] text-white py-2.5 px-6 rounded-xl text-sm font-medium hover:bg-[#023580] shadow-md shadow-[#024396]/20 inline-flex items-center gap-2 disabled:opacity-50";
const btnGhost = "text-[#2A364B] dark:text-[#8E99AC] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2A364B]/5 inline-flex items-center gap-2";

export default function AdminPipelines() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const [pipelines, setPipelines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingPipeline, setEditingPipeline] = useState(null); // null = closed, {} = new, {...} = edit
  const [assigningPipeline, setAssigningPipeline] = useState(null);

  const load = useCallback(async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/api/pipelines/`, { headers }),
        fetch(`${API_BASE}/api/auth/employees`, { headers }),
      ]);
      if (pRes.ok) setPipelines(await pRes.json());
      if (eRes.ok) setEmployees(await eRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const [handleDelete, deleting] = useSubmitOnce(async (pipeline) => {
    if (!window.confirm(`Delete pipeline "${pipeline.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API_BASE}/api/pipelines/${pipeline.id}`, { method: "DELETE", headers });
    if (res.ok) load();
  });

  const countStages = (stages = []) =>
    stages.reduce((sum, s) => sum + 1 + countStages(s.children || []), 0);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || "Unknown";

  if (loading) {
    return <PortalLayout><div className="py-24 text-center text-[#2A364B]/50 dark:text-[#8E99AC]/50 text-sm">Loading pipelines…</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <PageHeader
        icon="🔀"
        title="Lead Pipelines"
        subtitle="Build call-flow pipelines for your team — separate paths for calls that connect and calls that don't. Leads are auto-attached to whichever pipeline their employee is assigned."
        actions={
          <button className={btnPrimary} onClick={() => setEditingPipeline({})}>
            <Plus size={16} /> New Pipeline
          </button>
        }
      />

      {pipelines.length === 0 ? (
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-14 text-center shadow-sm">
          <p className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium mb-1">No pipelines yet</p>
          <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC]/50 mb-5">Create your first pipeline to organise how your team follows up on leads.</p>
          <button className={btnPrimary} onClick={() => setEditingPipeline({})}>
            <Plus size={16} /> Create a Pipeline
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pipelines.map((p) => (
            <div key={p.id} className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-5 shadow-sm flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-serif text-[16px] text-[#0E1B2C] dark:text-[#F1EDE3] leading-snug">{p.name}</h3>
                {!p.is_active && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#C7102E] bg-[#FBE4E4] dark:bg-red-900/20 px-2 py-0.5 rounded-full shrink-0">Inactive</span>
                )}
              </div>
              {p.description && <p className="text-[13px] text-[#2A364B]/60 dark:text-[#8E99AC]/60 mb-4 leading-relaxed">{p.description}</p>}

              <div className="flex items-center gap-4 text-[12.5px] text-[#2A364B]/70 dark:text-[#8E99AC]/70 mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <PhoneCall size={13} className="text-[#16a34a]" /> {countStages(p.connected_stages)} stages
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PhoneOff size={13} className="text-[#C7102E]" /> {countStages(p.not_connected_stages)} stages
                </span>
              </div>

              <div className="mb-4">
                {(p.assigned_to || []).length === 0 ? (
                  <p className="text-[12px] text-[#2A364B]/40 dark:text-[#8E99AC]/40">Not assigned to anyone yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(p.assigned_to || []).slice(0, 4).map((id) => (
                      <span key={id} className="text-[11px] bg-[#F6F1E8] dark:bg-white/5 border border-[#E2D8C2] dark:border-white/10 text-[#2A364B] dark:text-[#8E99AC] px-2 py-1 rounded-full">
                        {employeeName(id)}
                      </span>
                    ))}
                    {p.assigned_to.length > 4 && (
                      <span className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 px-1 py-1">+{p.assigned_to.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-3 border-t border-[#E2D8C2] dark:border-white/10">
                <button onClick={() => navigate(`/portal/admin/pipelines/${p.id}/board`)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-[#024396] hover:bg-[#023580] rounded-lg py-2">
                  <LayoutGrid size={13} /> View Board
                </button>
                <button onClick={() => setEditingPipeline(p)} title="Manage Stages" className="p-2 text-[#024396] bg-[#024396]/5 hover:bg-[#024396]/10 rounded-lg">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setAssigningPipeline(p)} title="Assign" className="p-2 text-[#2A364B] dark:text-[#8E99AC] bg-[#2A364B]/5 hover:bg-[#2A364B]/10 rounded-lg">
                  <Users size={13} />
                </button>
                <button onClick={() => handleDelete(p)} disabled={deleting} title="Delete" className="p-2 text-[#C7102E]/70 hover:text-[#C7102E] hover:bg-[#C7102E]/10 rounded-lg disabled:opacity-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPipeline !== null && (
        <PipelineModal
          pipeline={editingPipeline}
          onClose={() => setEditingPipeline(null)}
          onSaved={() => { setEditingPipeline(null); load(); }}
          headers={headers}
        />
      )}

      {assigningPipeline && (
        <AssignModal
          pipeline={assigningPipeline}
          employees={employees}
          onClose={() => setAssigningPipeline(null)}
          onSaved={() => { setAssigningPipeline(null); load(); }}
          headers={headers}
        />
      )}
    </PortalLayout>
  );
}

/* ============================================================
   PIPELINE CREATE / EDIT MODAL
   ============================================================ */
function PipelineModal({ pipeline, onClose, onSaved, headers }) {
  const isNew = !pipeline.id;
  const [name, setName] = useState(pipeline.name || "");
  const [description, setDescription] = useState(pipeline.description || "");
  const [connected, setConnected] = useState(pipeline.connected_stages?.length ? pipeline.connected_stages : []);
  const [notConnected, setNotConnected] = useState(pipeline.not_connected_stages?.length ? pipeline.not_connected_stages : []);
  const [error, setError] = useState("");

  const [handleSave, saving] = useSubmitOnce(async () => {
    if (!name.trim()) { setError("Give the pipeline a name."); return; }
    setError("");
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      connected_stages: stripEmpty(connected),
      not_connected_stages: stripEmpty(notConnected),
    };
    try {
      const url = isNew ? `${API_BASE}/api/pipelines/` : `${API_BASE}/api/pipelines/${pipeline.id}`;
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
      else setError("Couldn't save the pipeline. Please try again.");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#101D2E] border-b border-[#E2D8C2] dark:border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-serif text-lg text-[#0E1B2C] dark:text-[#F1EDE3]">{isNew ? "New Pipeline" : `Edit — ${pipeline.name}`}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60 dark:text-[#8E99AC]/60"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A364B] dark:text-[#8E99AC] mb-1.5">Pipeline Name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mutual Fund Follow-up" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A364B] dark:text-[#8E99AC] mb-1.5">Description <span className="font-normal text-[#2A364B]/40 dark:text-[#8E99AC]/40">(optional)</span></label>
              <input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this pipeline for?" />
            </div>
          </div>

          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50 -mt-2">
            Build two call-outcome flows below. Each stage can have sub-stages — click <span className="font-medium">+ sub-stage</span> to nest one.
            The small dropdown on each stage tells the call popup what it means (Interested, Lost, etc) — leave it blank for a purely organisational stage.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <StageColumn
              title="Call Connected"
              icon={<PhoneCall size={15} className="text-[#16a34a]" />}
              accent="#16a34a"
              stages={connected}
              setStages={setConnected}
              outcomeOptions={CONNECTED_OUTCOME_TYPES}
            />
            <StageColumn
              title="Call Not Connected"
              icon={<PhoneOff size={15} className="text-[#C7102E]" />}
              accent="#C7102E"
              stages={notConnected}
              setStages={setNotConnected}
              outcomeOptions={NOT_CONNECTED_OUTCOME_TYPES}
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#9B2335] dark:text-red-400 bg-[#FBE4E4] dark:bg-red-900/20 border border-[#F0B4B4] dark:border-red-900/50 rounded-lg px-3 py-2.5">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-[#101D2E] border-t border-[#E2D8C2] dark:border-white/10 px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : isNew ? "Create Pipeline" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function stripEmpty(stages) {
  return stages
    .filter((s) => s.name.trim())
    .map((s) => ({ ...s, name: s.name.trim(), children: stripEmpty(s.children || []) }));
}

/* ============================================================
   STAGE COLUMN — top-level "+ Add Stage" + recursive stage list
   ============================================================ */
function StageColumn({ title, icon, accent, stages, setStages, outcomeOptions }) {
  const addStage = () => setStages([...stages, emptyStage()]);

  return (
    <div className="bg-[#F6F1E8] dark:bg-white/5 rounded-xl p-4 border border-[#E2D8C2] dark:border-white/10">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <h4 className="text-[13px] font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{title}</h4>
      </div>

      {stages.length === 0 && (
        <p className="text-[12px] text-[#2A364B]/40 dark:text-[#8E99AC]/40 mb-3">No stages yet.</p>
      )}

      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <StageNode
            key={stage.id}
            stage={stage}
            depth={0}
            outcomeOptions={outcomeOptions}
            onChange={(updated) => {
              const next = [...stages];
              next[idx] = updated;
              setStages(next);
            }}
            onRemove={() => setStages(stages.filter((_, i) => i !== idx))}
          />
        ))}
      </div>

      <button
        onClick={addStage}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10"
        style={{ color: accent }}
      >
        <Plus size={13} /> Add Stage
      </button>
    </div>
  );
}

/* ============================================================
   STAGE NODE — recursive: name, color, outcome tag, children, add/remove
   ============================================================ */
const StageNode = memo(function StageNode({ stage, depth, outcomeOptions, onChange, onRemove }) {
  const [showColors, setShowColors] = useState(false);

  const addChild = () => {
    onChange({
      ...stage,
      children: [...(stage.children || []), { ...emptyStage(), parent_id: stage.id }],
    });
  };

  const updateChild = (i, updated) => {
    const children = [...(stage.children || [])];
    children[i] = updated;
    onChange({ ...stage, children });
  };

  const removeChild = (i) => {
    onChange({ ...stage, children: (stage.children || []).filter((_, idx) => idx !== i) });
  };

  return (
    <div style={{ marginLeft: depth ? 16 : 0 }} className={depth ? "border-l-2 border-[#E2D8C2] dark:border-white/10 pl-3" : ""}>
      <div className="flex items-center gap-1.5 bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/10 rounded-lg px-2 py-1.5 mb-2 flex-wrap">
        <GripVertical size={13} className="text-[#2A364B]/25 dark:text-[#8E99AC]/25 shrink-0" />

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowColors((v) => !v)}
            className="w-4 h-4 rounded-full border border-black/10"
            style={{ background: stage.color || COLORS[0] }}
            title="Change colour"
          />
          {showColors && (
            <div className="absolute z-20 top-6 left-0 bg-white dark:bg-[#101D2E] border border-[#E2D8C2] dark:border-white/10 rounded-lg shadow-lg p-2 flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange({ ...stage, color: c }); setShowColors(false); }}
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>

        <input
          value={stage.name}
          onChange={(e) => onChange({ ...stage, name: e.target.value })}
          placeholder="Stage name"
          className="flex-1 min-w-[90px] text-[13px] outline-none bg-transparent text-[#0E1B2C] dark:text-[#F1EDE3]"
        />

        <select
          value={stage.outcome_type || ""}
          onChange={(e) => onChange({ ...stage, outcome_type: e.target.value || null })}
          className="text-[11px] border border-[#E2D8C2] dark:border-white/10 rounded-md px-1.5 py-1 bg-white dark:bg-[#101D2E] text-[#2A364B] dark:text-[#8E99AC] shrink-0"
          title="What this stage means to the call-flow engine"
        >
          {outcomeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button type="button" onClick={addChild} title="Add sub-stage" className="text-[11px] text-[#2A364B]/50 dark:text-[#8E99AC]/50 hover:text-[#024396] px-1.5 py-1 shrink-0 inline-flex items-center gap-0.5">
          <ChevronRight size={12} /> sub-stage
        </button>
        <button type="button" onClick={onRemove} title="Remove stage" className="p-1 text-[#2A364B]/40 dark:text-[#8E99AC]/40 hover:text-[#C7102E] shrink-0">
          <X size={14} />
        </button>
      </div>

      {stage.children && stage.children.length > 0 && depth < 15 && (
        <div className="mt-2 space-y-2">
          {stage.children.map((child, i) => (
            <StageNode
              key={child.id || i}
              stage={child}
              depth={depth + 1}
              outcomeOptions={outcomeOptions}
              onChange={(updated) => updateChild(i, updated)}
              onRemove={() => removeChild(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* ============================================================
   ASSIGN MODAL
   ============================================================ */
function AssignModal({ pipeline, employees, onClose, onSaved, headers }) {
  const [selected, setSelected] = useState(pipeline.assigned_to || []);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const [handleSave, saving] = useSubmitOnce(async () => {
    const res = await fetch(`${API_BASE}/api/pipelines/${pipeline.id}/assign`, {
      method: "POST",
      headers,
      body: JSON.stringify({ employee_ids: selected }),
    });
    if (res.ok) onSaved();
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#101D2E] rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-lg text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Assign — {pipeline.name}</h3>
        <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]/50 mb-4">Select who should follow this pipeline for their leads. Their new/reassigned leads will automatically use these stages.</p>

        <div className="space-y-1.5 max-h-72 overflow-y-auto mb-5">
          {employees.length === 0 && <p className="text-sm text-[#2A364B]/40 dark:text-[#8E99AC]/40">No employees found.</p>}
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F6F1E8] dark:bg-white/5 cursor-pointer">
              <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggle(emp.id)} className="accent-[#024396]" />
              <span className="text-sm text-[#0E1B2C] dark:text-[#F1EDE3]">{emp.name}</span>
              {emp.designation && <span className="text-[11px] text-[#2A364B]/40 dark:text-[#8E99AC]/40">— {emp.designation}</span>}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
