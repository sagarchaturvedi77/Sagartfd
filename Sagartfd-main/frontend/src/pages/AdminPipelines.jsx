import React, { useState, useEffect, useCallback, memo } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const COLORS = ["#024396", "#16a34a", "#dc2626", "#ea580c", "#7c3aed", "#0891b2", "#ca8a04"];

function newStage(name = "New Stage") {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    parent_id: null,
    outcome_type: null,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    children: [],
  };
}

// ── ✅ LOOP SE BACHNE KE LIYE DEEP-CLONE HELPER ──
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── ✅ NON-RECURSIVE SAFE UPDATER ──
function updateStageInTree(stages, id, patch) {
  const cloned = deepClone(stages);
  const queue = [...cloned];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.id === id) {
      Object.assign(current, patch);
      break;
    }
    if (current.children) {
      queue.push(...current.children);
    }
  }
  return cloned;
}

// ── ✅ NON-RECURSIVE SAFE DELETER ──
function removeStageFromTree(stages, id) {
  const cloned = deepClone(stages);
  const filterAndQueue = (list) => {
    const filtered = list.filter(item => item.id !== id);
    filtered.forEach(item => {
      if (item.children) {
        item.children = filterAndQueue(item.children);
      }
    });
    return filtered;
  };
  return filterAndQueue(cloned);
}

// ── ✅ NON-RECURSIVE SAFE CHILD ADDER ──
function addChildToTree(stages, parentId, childObj) {
  const cloned = deepClone(stages);
  const queue = [...cloned];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.id === parentId) {
      current.children = [...(current.children || []), childObj];
      break;
    }
    if (current.children) {
      queue.push(...current.children);
    }
  }
  return cloned;
}

// ── STAGE ROW COMPONENT ──
const StageRow = memo(({ stage, depth, onUpdate, onDelete, onAddChild }) => {
  return (
    <div style={{ marginLeft: depth * 22 }} className="mt-2">
      <div className="flex items-center gap-2 bg-white border border-[#E2D8C2] rounded-xl px-3 py-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: stage.color }} />
        <input
          value={stage.name}
          onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
          className="flex-1 text-sm outline-none bg-transparent text-[#0E1B2C] font-medium min-w-0"
        />
        <input
          type="color"
          value={stage.color}
          onChange={(e) => onUpdate(stage.id, { color: e.target.value })}
          className="w-6 h-6 rounded cursor-pointer border-0 shrink-0"
          title="Stage colour"
        />
        <button
          type="button"
          onClick={() => onAddChild(stage.id)}
          className="text-xs px-2 py-1 rounded-lg bg-[#024396]/10 text-[#024396] hover:bg-[#024396]/20 shrink-0"
          title="Add a sub-stage inside this stage"
        >
          + Sub-stage
        </button>
        <button
          type="button"
          onClick={() => onDelete(stage.id)}
          className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 shrink-0"
          title="Delete stage (and its sub-stages)"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {(stage.children || []).map((child) => (
        <StageRow key={child.id} stage={child} depth={depth + 1} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  );
});

// ── STAGE COLUMN COMPONENT ──
function StageColumn({ title, stages, setStages }) {
  const onUpdate = (id, patch) => setStages((prev) => updateStageInTree(prev, id, patch));
  const onDelete = (id) => setStages((prev) => removeStageFromTree(prev, id));
  const onAddChild = (parentId) => setStages((prev) => addChildToTree(prev, parentId, { ...newStage(), parent_id: parentId }));
  const addTopLevel = () => setStages((prev) => [...prev, newStage()]);

  return (
    <div className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#0E1B2C]">{title}</h4>
        <button type="button" onClick={addTopLevel} className="text-xs px-3 py-1.5 rounded-lg bg-[#024396] text-white hover:bg-[#023580]">
          + Add Stage
        </button>
      </div>
      {stages.length === 0 && <p className="text-xs text-[#2A364B]/40 py-4 text-center">No stages yet — click "+ Add Stage"</p>}
      {stages.map((s) => (
        <StageRow key={s.id} stage={s} depth={0} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  );
}

// ── MAIN ADMIN PIPELINES COMPONENT ──
export default function AdminPipelines() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [pipelines, setPipelines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); 
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [connectedStages, setConnectedStages] = useState([]);
  const [notConnectedStages, setNotConnectedStages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assignFor, setAssignFor] = useState(null); 
  const [assignSelected, setAssignSelected] = useState([]);

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
  }, [token]); 

  useEffect(() => { load(); }, [load]);

  const startNew = () => {
    setEditingId("new");
    setName("");
    setDescription("");
    setConnectedStages([]);
    setNotConnectedStages([]);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || "");
    setConnectedStages(p.connected_stages || []);
    setNotConnectedStages(p.not_connected_stages || []);
  };

  const cancelEdit = () => setEditingId(null);

  const savePipeline = async () => {
    if (!name.trim()) return alert("Pipeline name is required");
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        connected_stages: connectedStages,
        not_connected_stages: notConnectedStages,
      });
      if (editingId === "new") {
        await fetch(`${API_BASE}/api/pipelines/`, { method: "POST", headers, body });
      } else {
        await fetch(`${API_BASE}/api/pipelines/${editingId}`, { method: "PUT", headers, body });
      }
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const deletePipeline = async (id) => {
    if (!window.confirm("Delete this pipeline? This cannot be undone.")) return;
    await fetch(`${API_BASE}/api/pipelines/${id}`, { method: "DELETE", headers });
    load();
  };

  const openAssign = (p) => {
    setAssignFor(p.id);
    setAssignSelected(p.assigned_to || []);
  };

  const saveAssign = async () => {
    await fetch(`${API_BASE}/api/pipelines/${assignFor}/assign`, {
      method: "POST",
      headers,
      body: JSON.stringify({ employee_ids: assignSelected }),
    });
    setAssignFor(null);
    load();
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="py-20 text-center text-[#2A364B]/50">Loading pipelines…</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-[#0E1B2C]">Lead Pipelines</h1>
            <p className="text-sm text-[#2A364B]/60">
              Create custom pipelines with unlimited nested stages — and decide which leads should follow which pipeline.
            </p>
          </div>
          {editingId === null && (
            <button onClick={startNew} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580]">
              + New Pipeline
            </button>
          )}
        </div>

        {editingId !== null && (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-6 space-y-5 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#2A364B]/70 block mb-1">Pipeline Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mutual Fund Leads"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#2A364B]/70 block mb-1">Description (optional)</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note about this pipeline"
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" />
              </div>
            </div>

            <p className="text-xs text-[#2A364B]/50">
              Build stages below. Click "+ Add Stage" for a top-level stage, then "+ Sub-stage" on any stage to nest a stage
              inside it — you can go as many levels deep as you need (stage → stage → stage…).
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <StageColumn title="🟢 If Call Connects" stages={connectedStages} setStages={setConnectedStages} />
              <StageColumn title="🔴 If Call Doesn't Connect" stages={notConnectedStages} setStages={setNotConnectedStages} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm text-[#2A364B]/60 border border-[#E2D8C2]">
                Cancel
              </button>
              <button onClick={savePipeline} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580] disabled:opacity-50">
                {saving ? "Saving…" : editingId === "new" ? "Create Pipeline" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {editingId === null && (
          <div className="grid gap-4">
            {pipelines.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
                <p className="text-[#2A364B]/50 text-sm">No pipelines yet. Click "+ New Pipeline" to build your first one.</p>
              </div>
            )}
            {pipelines.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#E2D8C2] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-[#0E1B2C]">{p.name}</p>
                    {p.description && <p className="text-xs text-[#2A364B]/60 mt-0.5">{p.description}</p>}
                    <p className="text-[11px] text-[#2A364B]/40 mt-1">
                      {(p.connected_stages || []).length} connected stage(s) · {(p.not_connected_stages || []).length} not-connected stage(s) ·{" "}
                      {(p.assigned_to || []).length} employee(s) assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openAssign(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100">
                      Assign
                    </button>
                    <button onClick={() => startEdit(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#024396]/10 text-[#024396] hover:bg-[#024396]/20">
                      Edit
                    </button>
                    <button onClick={() => deletePipeline(p.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {assignFor === p.id && (
                  <div className="mt-4 bg-[#FBF7EE] border border-[#E2D8C2] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-medium text-[#0E1B2C]">Assign this pipeline to employees:</p>
                    <div className="flex flex-wrap gap-2">
                      {employees.map((emp) => (
                        <label key={emp.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all ${assignSelected.includes(emp.id) ? "border-[#024396] bg-[#024396]/5 text-[#024396]" : "border-[#E2D8C2] text-[#2A364B]/60"}`}>
                          <input
                            type="checkbox"
                            checked={assignSelected.includes(emp.id)}
                            onChange={() =>
                              setAssignSelected((prev) => (prev.includes(emp.id) ? prev.filter((x) => x !== emp.id) : [...prev, emp.id]))
                            }
                            className="rounded"
                          />
                          {emp.name}
                        </label>
                      ))}
                      {employees.length === 0 && <p className="text-xs text-[#2A364B]/40">No employees found.</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAssignFor(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#2A364B]/60 border border-[#E2D8C2]">Cancel</button>
                      <button onClick={saveAssign} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#024396] hover:bg-[#023580]">Save Assignment</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}