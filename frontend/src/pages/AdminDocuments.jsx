import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";
import { FileText, Upload, Trash2, Plus } from "lucide-react";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";
import PortalModal from "../components/portal/PortalModal";
import { Button } from "../components/ui/button";

const API = process.env.REACT_APP_BACKEND_URL || "";

const CATEGORIES = ["General", "HR Policies", "Templates", "Legal", "Training", "Finance", "Other"];

export default function AdminDocuments() {
  const { token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", category: "General", description: "" });
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleFileUpload = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setUploading(true);
    try {
      let r;
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("title", form.title);
        fd.append("category", form.category);
        fd.append("description", form.description);
        r = await fetch(`${API}/api/documents/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      } else {
        r = await fetch(`${API}/api/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      if (r.ok) {
        setShowAdd(false);
        setForm({ title: "", category: "General", description: "" });
        setSelectedFile(null);
        fetchDocs();
      }
    } catch { /* ignore */ }
    setUploading(false);
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
  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396] dark:focus:border-[#7CB0FF]";

  return (
    <PortalLayout>
      <div className="space-y-4">
        <PageHeader
          icon="🗂️"
          title="Company Documents"
          subtitle="Shared HR policies, templates, and reference files"
          actions={
            <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              <Plus size={14} className="mr-1" /> Add Document
            </Button>
          }
        />

        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterCat === cat ? "bg-[#024396] dark:bg-[#4C8DFF] text-white border-[#024396] dark:border-[#4C8DFF]" : "bg-white dark:bg-white/5 text-[#2A364B] dark:text-[#8E99AC] border-[#E2D8C2] dark:border-white/10"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10">
            <EmptyState icon="🗂️" title="No documents yet." subtitle="Upload your first company document." />
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-[#101D2E] rounded-xl border border-[#E2D8C2] dark:border-white/10 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F5F1EB] dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#024396] dark:text-[#7CB0FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] truncate">{doc.title}</h4>
                  <p className="text-xs text-[#5C677D] dark:text-[#8E99AC] mt-0.5">{doc.category} {doc.file_name && `· ${doc.file_name}`}</p>
                  {doc.description && <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mt-1">{doc.description}</p>}
                  <p className="text-[10px] text-[#5C677D] dark:text-[#8E99AC]/70 mt-1">
                    Uploaded: {new Date(doc.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg bg-[#F5F1EB] dark:bg-white/5 text-[#024396] dark:text-[#7CB0FF] hover:bg-[#EAF1FB] dark:hover:bg-white/10">
                      <Upload size={14} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PortalModal
          open={showAdd}
          onOpenChange={setShowAdd}
          title="Upload Document"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={field} placeholder="Document title" />
            </div>

            <div>
              <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={field}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={field} rows={2} placeholder="Brief description" />
            </div>

            <div>
              <label className="text-xs text-[#5C677D] dark:text-[#8E99AC] block mb-1">File</label>
              <input type="file" onChange={handleFileUpload} className="text-sm text-[#2A364B] dark:text-[#C7CEDA]" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" />
              {selectedFile && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Selected: {selectedFile.name}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading || !form.title.trim()} className="flex-1 bg-gradient-to-r from-[#024396] to-[#0356c4]">
                {uploading ? "Uploading..." : "Save Document"}
              </Button>
            </div>
          </form>
        </PortalModal>
      </div>
    </PortalLayout>
  );
}
