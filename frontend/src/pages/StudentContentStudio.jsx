import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, MessageCircleQuestion, Sparkles, CheckCircle2, Clock3, XCircle, Merge } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_META = {
    pending_review: { label: "In Review", icon: Clock3, cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
    published: { label: "Published", icon: CheckCircle2, cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
    rejected: { label: "Not Approved", icon: XCircle, cls: "text-red-300 border-red-400/30 bg-red-400/10" },
    merged: { label: "Merged With Another", icon: Merge, cls: "text-white/60 border-white/15 bg-white/5" },
};

export default function StudentContentStudio() {
    const { token } = useInternshipAuth();
    const [topics, setTopics] = useState([]);
    const [mine, setMine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentType, setContentType] = useState("faq");
    const [topic, setTopic] = useState("");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const load = useCallback(async () => {
        try {
            const [topicsRes, mineRes] = await Promise.all([
                fetch(`${API_BASE}/api/internship/content/topics`),
                fetch(`${API_BASE}/api/internship/content/mine`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const topicsJson = await topicsRes.json().catch(() => []);
            const mineJson = await mineRes.json().catch(() => []);
            setTopics(Array.isArray(topicsJson) ? topicsJson : []);
            setMine(Array.isArray(mineJson) ? mineJson : []);
            if (!topic && topicsJson?.[0]) setTopic(topicsJson[0].value);
        } catch {
            toast.error("Could not load Content Studio — please refresh.");
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const [handleSubmit, submitting] = useSubmitOnce(async () => {
        if (!topic) { toast.error("Pick a topic first."); return; }
        if (title.trim().length < 8) { toast.error(contentType === "faq" ? "Write a real question (8+ characters)." : "Write a real headline (8+ characters)."); return; }
        if (body.trim().length < 40) { toast.error("Your answer/post is too short — write at least a few real sentences."); return; }
        try {
            const res = await fetch(`${API_BASE}/api/internship/content`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content_type: contentType, topic, title: title.trim(), body: body.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Submission failed");
            toast.success(
                data.status === "merged"
                    ? "Similar content already exists — yours was merged in, and you're credited as a contributor."
                    : "Submitted for review — you'll be notified once an admin approves it."
            );
            setTitle("");
            setBody("");
            load();
        } catch (err) {
            toast.error(err.message || "Submission failed");
        }
    });

    return (
        <StudentLayout activeKey="missions">
            <div className="max-w-3xl mx-auto space-y-5 pb-10">
                <div>
                    <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                        <Sparkles size={20} className="text-[#14E0A0]" /> Content Studio
                    </h1>
                    <p className="text-white/50 text-sm mt-1">
                        Write blogs and FAQs about SIP, lumpsum, SWP, financial planning, and TFD's products — real,
                        AI-reviewed writing that (once an admin approves it) gets published on the real website,
                        with your name on it.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#14E0A0]/20 bg-[#14E0A0]/5 p-4 text-[#14E0A0]/90 text-xs leading-relaxed">
                    Suggested pace: <strong>2 FAQs a day</strong>, <strong>3 blog posts a week</strong> — but there's
                    no hard limit or penalty either way, write as much genuinely good content as you want.
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                    <div className="flex gap-2">
                        {[["faq", "Write an FAQ", MessageCircleQuestion], ["blog", "Write a Blog", FileText]].map(([val, label, Icon]) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setContentType(val)}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border transition-colors ${
                                    contentType === val ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]" : "border-white/10 text-white/50 hover:border-white/25"
                                }`}
                            >
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">Topic</label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#14E0A0]/60"
                        >
                            {topics.map((t) => (
                                <option key={t.value} value={t.value} className="bg-[#0B1424]">{t.label}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-white/35 mt-1.5">
                            Picking the right topic lets us auto-attach the matching page link once this is published.
                        </p>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                            {contentType === "faq" ? "The Question" : "Headline"}
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={contentType === "faq" ? "e.g. What is a SIP and how does it work?" : "e.g. 5 Things First-Time Investors Get Wrong About SIPs"}
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                            {contentType === "faq" ? "The Answer" : "Full Post"}
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={contentType === "faq" ? 5 : 10}
                            placeholder="Write it in your own words — this gets AI-reviewed for accuracy and quality before it ever reaches an admin."
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                        {submitting ? "Submitting..." : "Submit for Review"}
                    </button>
                </div>

                <div>
                    <h2 className="text-sm font-bold text-white/70 mb-3">Your Submissions</h2>
                    {loading ? (
                        <p className="text-white/40 text-xs">Loading...</p>
                    ) : mine.length === 0 ? (
                        <p className="text-white/40 text-xs">Nothing submitted yet — your first one is above.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {mine.map((c) => {
                                const meta = STATUS_META[c.status] || STATUS_META.pending_review;
                                const Icon = meta.icon;
                                return (
                                    <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{c.title}</p>
                                                <p className="text-[10px] text-white/40 mt-0.5">{c.content_type === "faq" ? "FAQ" : "Blog"} &middot; {c.topic}</p>
                                            </div>
                                            <span className={`flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${meta.cls}`}>
                                                <Icon size={10} /> {meta.label}
                                            </span>
                                        </div>
                                        {c.quality_score != null && (
                                            <p className="text-[10px] text-white/35 mt-2">AI quality score: {Math.round(c.quality_score)}/100{c.gemini_feedback ? ` — ${c.gemini_feedback}` : ""}</p>
                                        )}
                                        {c.status === "rejected" && c.admin_note && (
                                            <p className="text-[10.5px] text-red-300/80 mt-1.5">"{c.admin_note}"</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
