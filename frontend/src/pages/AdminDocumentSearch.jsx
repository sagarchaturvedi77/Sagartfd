import React, { useEffect, useState, useCallback, useRef } from "react";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import PortalModal from "../components/portal/PortalModal";
import { apiGet } from "../portal/api";
import { Search, Download } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "invoice", label: "Invoice" },
  { value: "certificate", label: "Certificate" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "completion_letter", label: "Completion Letter" },
  { value: "letterhead", label: "Letterhead" },
];

const TYPE_LABELS = {
  invoice: "Invoice",
  internship: "Internship Certificate",
  employee: "Employee Certificate",
  achievement: "Achievement",
  offer_letter: "Offer Letter",
  completion_letter: "Completion Letter",
  letterhead: "Letterhead",
};

const TYPE_COLORS = {
  invoice: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  internship: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  employee: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  achievement: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  offer_letter: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  completion_letter: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  letterhead: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-[#F1EDE3]",
};

export default function AdminDocumentSearch() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (query, typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (typeFilter) params.set("type", typeFilter);
      const data = await apiGet(`/api/documents/search?${params.toString()}`);
      setResults(data);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch("", "");
  }, [runSearch]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q, type), 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, type, runSearch]);

  const field = "border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  return (
    <PortalLayout>
      <PageHeader icon="🔎" title="Document Search" subtitle="Search across every invoice, certificate, letter and letterhead ever generated" />

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C677D]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or document number..."
              className={`${field} w-full pl-10`}
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 text-center"><div className="w-6 h-6 border-2 border-[#024396] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : results.length === 0 ? (
          <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC] text-center py-10">No documents found.</p>
        ) : (
          <div className="divide-y divide-[#E2D8C2] dark:divide-white/10">
            {results.map((doc) => (
              <button
                key={`${doc.document_type}-${doc.id}`}
                onClick={() => setDetail(doc)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#F5F1EB] dark:hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.document_type] || "bg-slate-100 text-slate-700"}`}>
                      {TYPE_LABELS[doc.document_type] || doc.document_type}
                    </span>
                    <span className="text-xs font-mono text-[#2A364B]/50 dark:text-[#8E99AC]">{doc.document_number}</span>
                  </div>
                  <p className="text-sm font-medium text-[#0E1B2C] dark:text-[#F1EDE3] truncate">{doc.person_name}</p>
                  <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">
                    By {doc.created_by_name} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
                {doc.pdf_url && (
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-[#024396] dark:text-[#7CB0FF] px-3 py-1.5 rounded-lg border border-[#024396]/30 hover:bg-[#024396]/5"
                  >
                    <Download size={12} /> PDF
                  </a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <PortalModal open={!!detail} onOpenChange={(v) => !v && setDetail(null)} title={detail?.person_name} maxWidth="max-w-lg">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Type" value={TYPE_LABELS[detail.document_type] || detail.document_type} />
              <DetailRow label="Document No." value={detail.document_number} />
              <DetailRow label="Issued On" value={detail.issue_date} />
              <DetailRow label="Created By" value={detail.created_by_name} />
              <DetailRow label="Created At" value={detail.created_at ? new Date(detail.created_at).toLocaleString("en-IN") : "—"} />
              {detail.extra?.department && <DetailRow label="Department" value={detail.extra.department} />}
              {detail.extra?.duration_label && <DetailRow label="Duration" value={detail.extra.duration_label} />}
              {detail.extra?.total != null && <DetailRow label="Total" value={`₹${Number(detail.extra.total).toLocaleString("en-IN")}`} />}
              {detail.extra?.payment_method && <DetailRow label="Payment Method" value={detail.extra.payment_method} />}
            </div>
            {detail.pdf_url && (
              <a href={detail.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#024396] dark:text-[#7CB0FF]">
                <Download size={12} /> Download PDF
              </a>
            )}
          </div>
        )}
      </PortalModal>
    </PortalLayout>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] uppercase tracking-wide">{label}</p>
      <p className="text-[#0E1B2C] dark:text-[#F1EDE3] font-medium">{value}</p>
    </div>
  );
}
