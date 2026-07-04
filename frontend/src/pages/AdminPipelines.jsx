import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { Plus, X, Trash2, Users, Pencil, PhoneCall, PhoneOff, ChevronRight, GripVertical } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const COLORS = ["#024396", "#16a34a", "#C7102E", "#B8862B", "#7c3aed", "#0891b2", "#5C677D"];

const emptyStage = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  name: "",
  parent_id: null,
  outcome_type: null,
  children: [],
  color: COLORS[0],
});

const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";
const btnPrimary = "bg-[#024396] text-white py-2.5 px-6 rounded-xl text-sm font-medium hover:bg-[#023580] shadow-md shadow-[#024396]/20 inline-flex items-center gap-2 disabled:opacity-50";
const btnGhost = "text-[#2A364B] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2A364B]/5 inline-flex items-center gap-2";

export default function AdminPipelines() {
  const { token } = useAuth();
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const [pipelines, setPipelines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingPipeline, setEditingPipeline] = useState(null); // null = closed, {} = new, {...} = edit
  const [assigningPipeline, setAssigningPipeline] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async (pipeline) => {
    if (!window.confirm(`Delete pipeline "${pipeline.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API_BASE}/api/pipelines/${pipeline.id}`, { method: "DELETE", headers });
    if (res.ok) load();
  };

  const countStages = (stages = []) =>
    stages.reduce((sum, s) => sum + 1 + countStages(s.children || []), 0);

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || "Unknown";

  if (loading) {
    return <PortalLayout><div className="py-24 text-center text-[#2A364B]/50 text-sm">Loading pipelines…</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Lead Pipelines</h2>
          <p className="text-xs text-[#2A364B]/50 mt-0.5">
            Build call-flow pipelines for your team — separate paths for calls that connect and calls that don't.
          </p>
        </div>
        <button className={btnPrimary} onClick={() => setEditingPipeline({})}>
          <Plus size={16} /> New Pipeline
        </button>
      </div>

      {pipelines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2D8C2] p-14 text-center shadow-sm">
          <p className="text-[#0E1B2C] font-medium mb-1">No pipelines yet</p>
          <p className="text-sm text-[#2A364B]/50 mb-5">Create your first pipeline to organise how your team follows up on leads.</p>
          <button className={btnPrimary} onClick={() => setEditingPipeline({})}>
            <Plus size={16} /> Create a Pipeline
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pipelines.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-serif text-[16px] text-[#0E1B2C] leading-snug">{p.name}</h3>
                {!p.is_active && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#C7102E] bg-[#FBE4E4] px-2 py-0.5 rounded-full shrink-0">Inactive</span>
                )}
              </div>
              {p.description && <p className="text-[13px] text-[#2A364B]/60 mb-4 leading-relaxed">{p.description}</p>}

              <div className="flex items-center gap-4 text-[12.5px] text-[#2A364B]/70 mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <PhoneCall size={13} className="text-[#16a34a]" /> {countStages(p.connected_stages)} stages
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PhoneOff size={13} className="text-[#C7102E]" /> {countStages(p.not_connected_stages)} stages
                </span>
              </div>

              <div className="mb-4">
                {(p.assigned_to || []).length === 0 ? (
                  <p className="text-[12px] text-[#2A364B]/40">Not assigned to anyone yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(p.assigned_to || []).slice(0, 4).map((id) => (
                      <span key={id} className="text-[11px] bg-[#F6F1E8] border border-[#E2D8C2] text-[#2A364B] px-2 py-1 rounded-full">
                        {employeeName(id)}
                      </span>
                    ))}
                    {p.assigned_to.length > 4 && (
                      <span className="text-[11px] text-[#2A364B]/50 px-1 py-1">+{p.assigned_to.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-3 border-t border-[#E2D8C2]">
                <button onClick={() => setEditingPipeline(p)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#024396] bg-[#024396]/5 hover:bg-[#024396]/10 rounded-lg py-2">
                  <Pencil size={13} /> Manage Stages
                </button>
                <button onClick={() => setAssigningPipeline(p)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#2A364B] bg-[#2A364B]/5 hover:bg-[#2A364B]/10 rounded-lg py-2">
                  <Users size={13} /> Assign
                </button>
                <button onClick={() => handleDelete(p)} title="Delete" className="p-2 text-[#C7102E]/70 hover:text-[#C7102E] hover:bg-[#C7102E]/10 rounded-lg">
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
          saving={saving}
          setSaving={setSaving}
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
function PipelineModal({ pipeline, onClose, onSaved, headers, saving, setSaving }) {
  const isNew = !pipeline.id;
  const [name, setName] = useState(pipeline.name || "");
  const [description, setDescription] = useState(pipeline.description || "");
  const [connected, setConnected] = useState(pipeline.connected_stages?.length ? pipeline.connected_stages : []);
  const [notConnected, setNotConnected] = useState(pipeline.not_connected_stages?.length ? pipeline.not_connected_stages : []);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Give the pipeline a name."); return; }
    setError("");
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E2D8C2] px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-serif text-lg text-[#0E1B2C]">{isNew ? "New Pipeline" : `Edit — ${pipeline.name}`}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2A364B]/5 rounded-lg text-[#2A364B]/60"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A364B] mb-1.5">Pipeline Name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mutual Fund Follow-up" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A364B] mb-1.5">Description <span className="font-normal text-[#2A364B]/40">(optional)</span></label>
              <input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this pipeline for?" />
            </div>
          </div>

          <p className="text-xs text-[#2A364B]/50 -mt-2">
            Build two call-outcome flows below. Each stage can have sub-stages — click <span className="font-medium">+ sub-stage</span> to nest one.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <StageColumn
              title="Call Connected"
              icon={<PhoneCall size={15} className="text-[#16a34a]" />}
              accent="#16a34a"
              stages={connected}
              setStages={setConnected}
            />
            <StageColumn
              title="Call Not Connected"
              icon={<PhoneOff size={15} className="text-[#C7102E]" />}
              accent="#C7102E"
              stages={notConnected}
              setStages={setNotConnected}
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#9B2335] bg-[#FBE4E4] border border-[#F0B4B4] rounded-lg px-3 py-2.5">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E2D8C2] px-6 py-4 flex items-center justify-end gap-3">
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
function StageColumn({ title, icon, accent, stages, setStages }) {
  const addStage = () => setStages([...stages, emptyStage()]);

  return (
    <div className="bg-[#F6F1E8] rounded-xl p-4 border border-[#E2D8C2]">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <h4 className="text-[13px] font-semibold text-[#0E1B2C]">{title}</h4>
      </div>

      {stages.length === 0 && (
        <p className="text-[12px] text-[#2A364B]/40 mb-3">No stages yet.</p>
      )}

      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <StageNode
            key={stage.id}
            stage={stage}
            depth={0}
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
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white"
        style={{ color: accent }}
      >
        <Plus size={13} /> Add Stage
      </button>
    </div>
  );
}

/* ============================================================
   STAGE NODE — recursive: name, color, children, add/remove
   ============================================================ */
const StageNode = memo(function StageNode({ stage, depth, onChange, onRemove }) {
  console.log("Rendering stage:", stage.id, "at depth:", depth);
  const [showColors, setShowColors] = useState(false);

  const addChild = () => {
    onChange({ 
      ...stage, 
      children: [...(stage.children || []), { ...emptyStage(), parent_id: stage.id }] 
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
    <div style={{ marginLeft: depth ? 16 : 0 }} className={depth ? "border-l-2 border-[#E2D8C2] pl-3" : ""}>
      <div className="flex items-center gap-1.5 bg-white border border-[#E2D8C2] rounded-lg px-2 py-1.5 mb-2">
        <GripVertical size={13} className="text-[#2A364B]/25 shrink-0" />
        <button type="button" onClick={() => setShowColors(!showColors)} className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ background: stage.color || COLORS[0] }} />
        {showColors && (
          <div className="absolute z-20 bg-white border border-[#E2D8C2] rounded-lg shadow-lg p-2 flex gap-1.5">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => { onChange({ ...stage, color: c }); setShowColors(false); }} className="w-5 h-5 rounded-full" style={{ background: c }} />
            ))}
          </div>
        )}
        <input value={stage.name} onChange={(e) => onChange({ ...stage, name: e.target.value })} placeholder="Stage name" className="flex-1 min-w-0 text-[13px] outline-none bg-transparent" />
        <button type="button" onClick={addChild} className="text-[11px] text-[#2A364B]/50 hover:text-[#024396] px-1.5 inline-flex items-center"><ChevronRight size={12} /> sub-stage</button>
        <button type="button" onClick={onRemove} className="text-[#2A364B]/40 hover:text-[#C7102E]"><X size={14} /></button>
      </div>
     {/* Recursion ko break karne ke liye niche wala code use karein */}
      {stage.children && stage.children.length > 0 && depth < 15 && (
        <div className="mt-2 space-y-2">
          {stage.children.map((child, i) => (
             <StageNode 
                key={child.id || i} 
                stage={child} 
                depth={depth + 1} 
                onChange={(upd) => updateChild(i, upd)} 
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
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/pipelines/${pipeline.id}/assign`, {
        method: "POST",
        headers,
        body: JSON.stringify({ employee_ids: selected }),
      });
      if (res.ok) onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-lg text-[#0E1B2C] mb-1">Assign — {pipeline.name}</h3>
        <p className="text-xs text-[#2A364B]/50 mb-4">Select who should follow this pipeline for their leads.</p>

        <div className="space-y-1.5 max-h-72 overflow-y-auto mb-5">
          {employees.length === 0 && <p className="text-sm text-[#2A364B]/40">No employees found.</p>}
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F6F1E8] cursor-pointer">
              <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggle(emp.id)} className="accent-[#024396]" />
              <span className="text-sm text-[#0E1B2C]">{emp.name}</span>
              {emp.designation && <span className="text-[11px] text-[#2A364B]/40">— {emp.designation}</span>}
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
