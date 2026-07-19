import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Merge, ExternalLink, AlertTriangle } from "lucide-react";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import { apiGet, apiSend } from "../portal/api";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const TABS = [
    ["pending_review", "Pending Review"],
    ["published", "Published"],
    ["rejected", "Rejected"],
    ["merged", "Merged"],
];

export default function AdminInternshipContent() {
    const [status, setStatus] = useState("pending_review");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet(`/api/internship/admin/content?status=${status}`);
            setItems(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Could not load content queue");
        }
        setLoading(false);
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const [review, reviewing] = useSubmitOnce(async (id, action) => {
        let admin_note;
        if (action === "reject") {
            admin_note = window.prompt("Why is this being rejected? (shown to the student)") || undefined;
            if (admin_note === undefined) return; // cancelled
        }
        try {
            await apiSend(`/api/internship/admin/content/${id}/review`, "POST", { action, admin_note });
            toast.success(action === "approve" ? "Published to the website." : "Rejected — student notified.");
            load();
        } catch (e) {
            toast.error(e.message || "Could not update this item");
        }
    });

    return (
        <PortalLayout>
            <div className="space-y-6">
                <PageHeader
                    icon="✍️"
                    title="Internship Content Queue"
                    subtitle="Student-written blog posts & FAQs — review before they go live on the real website"
                />

                <div className="flex gap-2 border-b border-[#E2D8C2] dark:border-white/10 overflow-x-auto">
                    {TABS.map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setStatus(key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                status === key ? "border-[#024396] dark:border-[#4C8DFF] text-[#024396] dark:text-[#7CB0FF]" : "border-transparent text-[#2A364B]/50 dark:text-[#8E99AC]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">Loading...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-[#E2D8C2] dark:border-white/10 p-10 text-center text-sm text-[#2A364B]/50 dark:text-[#8E99AC]">
                        Nothing here right now.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((c) => (
                            <div key={c.id} className="rounded-2xl border border-[#E2D8C2] dark:border-white/10 bg-white dark:bg-white/[0.02] p-5">
                                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                {c.content_type === "faq" ? "FAQ" : "Blog"}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#2A364B]/50 dark:text-[#8E99AC] border border-[#E2D8C2] dark:border-white/15 px-2 py-0.5 rounded-full">
                                                {c.topic}
                                            </span>
                                            {c.quality_score != null && (
                                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                    AI Score: {Math.round(c.quality_score)}/100
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-sm text-[#0E1B2C] dark:text-[#F1EDE3]">{c.title}</h3>
                                        <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mt-0.5">by {c.student_name}</p>
                                    </div>
                                </div>

                                {c.admin_note && c.status === "pending_review" && (
                                    <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 mb-3">
                                        <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">{c.admin_note}</p>
                                    </div>
                                )}

                                <p className="text-sm text-[#2A364B]/80 dark:text-[#C7CEDA] leading-relaxed whitespace-pre-wrap mb-3">{c.body}</p>

                                {c.gemini_feedback && (
                                    <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] italic mb-3">AI note: {c.gemini_feedback}</p>
                                )}

                                {c.status === "published" && (
                                    <a
                                        href={c.content_type === "blog" ? `/blog/${c.id}` : "/faq"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-[#024396] dark:text-[#7CB0FF] hover:underline"
                                    >
                                        View live <ExternalLink size={11} />
                                    </a>
                                )}

                                {c.status === "pending_review" && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => review(c.id, "approve")}
                                            disabled={reviewing}
                                            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg transition-colors"
                                        >
                                            <CheckCircle2 size={13} /> Approve & Publish
                                        </button>
                                        <button
                                            onClick={() => review(c.id, "reject")}
                                            disabled={reviewing}
                                            className="flex items-center gap-1.5 text-xs font-bold bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-3.5 py-2 rounded-lg transition-colors"
                                        >
                                            <XCircle size={13} /> Reject
                                        </button>
                                    </div>
                                )}

                                {c.status === "merged" && (
                                    <p className="flex items-center gap-1.5 text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">
                                        <Merge size={12} /> Merged into an existing, similar entry — no separate publish needed.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}
