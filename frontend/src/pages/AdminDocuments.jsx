import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { FileText, Upload, Trash2, FolderOpen, Plus } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "";

const CATEGORIES = ["General", "HR Policies", "Templates", "Legal", "Training", "Finance", "Other"];

export default function AdminDocuments() {
  const { token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", category: "General", description: "", file_url: "", file_name: "" });
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState("All");

  const fetchDocs = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/documents`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setDocs(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(f => ({ ...f, file_url: reader.result, file_name: file.name, file_type: file.type }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const r = await fetch(`${API}/api/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setShowAdd(false);
        setForm({ title: "", category: "General", description: "", file_url: "", file_name: "" });
        fetchDocs();
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await fetch(`${API}/api/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDocs();
  };

  const filtered = filterCat === "All" ? docs : docs.filter(d => d.category === filterCat);

  return (
    <PortalLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0E1B2C]">Company Documents</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#024396] text-white rounded-lg text-xs font-semibold">
            <Plus size={14} /> Add Document
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterCat === cat ? "bg-[#024396] text-white border-[#024396]" : "bg-white text-[#2A364B] border-[#E2D8C2]"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Documents List */}
        {loading ? (
          <p className="text-sm text-[#5C677D]">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2D8C2] p-8 text-center">
            <FolderOpen size={40} className="mx-auto text-[#E2D8C2] mb-2" />
            <p className="text-sm text-[#5C677D]">No documents yet. Upload your first company document.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-[#E2D8C2] p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F5F1EB] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#024396]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#0E1B2C] truncate">{doc.title}</h4>
                  <p className="text-xs text-[#5C677D] mt-0.5">{doc.category} {doc.file_name && `· ${doc.file_name}`}</p>
                  {doc.description && <p className="text-xs text-[#2A364B]/60 mt-1">{doc.description}</p>}
                  <p className="text-[10px] text-[#5C677D] mt-1">
                    Uploaded: {new Date(doc.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg bg-[#F5F1EB] text-[#024396] hover:bg-[#EAF1FB]">
                      <Upload size={14} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Document Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-[#0E1B2C]">Upload Document</h3>

              <div>
                <label className="text-xs text-[#5C677D] block mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" placeholder="Document title" />
              </div>

              <div>
                <label className="text-xs text-[#5C677D] block mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#5C677D] block mb-1">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]" rows={2} placeholder="Brief description" />
              </div>

              <div>
                <label className="text-xs text-[#5C677D] block mb-1">File</label>
                <input type="file" onChange={handleFileUpload} className="text-sm" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" />
                {form.file_name && <p className="text-xs text-green-600 mt-1">Selected: {form.file_name}</p>}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2D8C2] text-sm">Cancel</button>
                <button type="submit" disabled={uploading || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#024396] text-white text-sm font-semibold disabled:opacity-50">
                  {uploading ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
