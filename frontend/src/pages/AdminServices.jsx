import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminServices() {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/all`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await fetch(`${API_BASE}/api/services/${editId}`, { method: "PUT", headers, body: JSON.stringify(form) });
      } else {
        await fetch(`${API_BASE}/api/services/`, { method: "POST", headers, body: JSON.stringify(form) });
      }
      setShowAdd(false);
      setEditId(null);
      setForm({ name: "", description: "", category: "" });
      load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const deleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await fetch(`${API_BASE}/api/services/${id}`, { method: "DELETE", headers });
    load();
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || "", category: s.category || "" });
    setShowAdd(true);
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-[#0E1B2C]">Services</h2>
            <p className="text-xs text-[#2A364B]/50">Manage company services — these appear during employee calls</p>
          </div>
          <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", description: "", category: "" }); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] shadow-lg shadow-[#024396]/25">
            + Add Service
          </button>
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-semibold text-[#0E1B2C] mb-4">{editId ? "Edit Service" : "Add New Service"}</h3>
              <form onSubmit={save} className="space-y-3">
                <input required placeholder="Service Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                <input placeholder="Category (e.g. Insurance, Investment)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field} />
                <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} resize-none`} />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#2A364B]/70 border border-[#E2D8C2]">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] disabled:opacity-60">
                    {saving ? "Saving..." : editId ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2D8C2] p-10 text-center">
            <p className="text-[#2A364B]/50 text-sm">No services yet. Add your first service!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${s.is_active ? "border-[#E2D8C2]" : "border-red-200 bg-red-50/30"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#0E1B2C]">{s.name}</p>
                    {s.category && <p className="text-xs text-[#024396] mt-0.5">{s.category}</p>}
                    {s.description && <p className="text-xs text-[#2A364B]/60 mt-1">{s.description}</p>}
                  </div>
                  {!s.is_active && <span className="text-[10px] text-red-500 font-medium">Inactive</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => startEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#024396] bg-[#024396]/5 hover:bg-[#024396]/10">Edit</button>
                  <button onClick={() => deleteService(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
