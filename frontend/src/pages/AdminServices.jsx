import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminServices() {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/all`, { headers });
      if (res.ok) setServices(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const [save, saving] = useSubmitOnce(async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
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
  });

  const [deleteService, deleting] = useSubmitOnce(async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await fetch(`${API_BASE}/api/services/${id}`, { method: "DELETE", headers });
    load();
  });

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || "", category: s.category || "" });
    setShowAdd(true);
  };

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader
          icon="🧩"
          title="Services"
          subtitle="Manage company services — these appear during employee calls"
          actions={
            <Button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", description: "", category: "" }); }}
              className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              + Add Service
            </Button>
          }
        />

        <PortalModal
          open={showAdd}
          onOpenChange={(v) => { setShowAdd(v); if (!v) setEditId(null); }}
          title={editId ? "Edit Service" : "Add New Service"}
          maxWidth="max-w-sm"
        >
          <form onSubmit={save} className="space-y-3">
            <input required placeholder="Service Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            <input placeholder="Category (e.g. Insurance, Investment)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field} />
            <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${field} resize-none`} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAdd(false); setEditId(null); }}>Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]">
                {saving ? "Saving..." : editId ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </PortalModal>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" /></div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10">
            <EmptyState icon="🧩" title="No services yet." subtitle="Add your first service!" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className={`bg-white dark:bg-[#101D2E] rounded-2xl border p-5 shadow-sm ${s.is_active ? "border-[#E2D8C2] dark:border-white/10" : "border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-900/10"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{s.name}</p>
                    {s.category && <p className="text-xs text-[#024396] dark:text-[#7CB0FF] mt-0.5">{s.category}</p>}
                    {s.description && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mt-1">{s.description}</p>}
                  </div>
                  {!s.is_active && <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">Inactive</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => startEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/5 hover:bg-[#024396]/10 dark:hover:bg-white/10">Edit</button>
                  <button onClick={() => deleteService(s.id)} disabled={deleting} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
