import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, ArrowRight } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Minimal, safe Markdown-ish renderer for Gemini-generated study notes —
// no dangerouslySetInnerHTML, same spirit as AIChat.jsx's renderer, but a
// smaller subset (headings/bold/bullets/numbered lists/paragraphs) since
// study notes don't need links or code blocks.
function renderInline(text, keyPrefix) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return <strong key={`${keyPrefix}-${i}`} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
    });
}

function StudyMarkdown({ content }) {
    const lines = (content || "").split("\n");
    const blocks = [];
    let listBuffer = [];
    let listType = null;

    const flushList = (key) => {
        if (!listBuffer.length) return;
        const Tag = listType === "ol" ? "ol" : "ul";
        blocks.push(
            <Tag key={key} className={`space-y-1.5 my-3 pl-5 text-sm text-white/70 ${listType === "ol" ? "list-decimal" : "list-disc"}`}>
                {listBuffer.map((item, i) => <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>)}
            </Tag>
        );
        listBuffer = [];
        listType = null;
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) { flushList(`flush-${idx}`); return; }

        const heading = trimmed.match(/^(#{1,3})\s+(.*)/);
        if (heading) {
            flushList(`flush-${idx}`);
            const level = heading[1].length;
            const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
            const sizeClass = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";
            blocks.push(<Tag key={idx} className={`${sizeClass} font-display font-bold text-white mt-5 mb-2`}>{renderInline(heading[2], `h-${idx}`)}</Tag>);
            return;
        }

        const bullet = trimmed.match(/^[-*]\s+(.*)/);
        if (bullet) {
            listType = "ul";
            listBuffer.push(bullet[1]);
            return;
        }

        const numbered = trimmed.match(/^\d+[.)]\s+(.*)/);
        if (numbered) {
            listType = "ol";
            listBuffer.push(numbered[1]);
            return;
        }

        flushList(`flush-${idx}`);
        blocks.push(<p key={idx} className="text-sm text-white/70 leading-relaxed my-2">{renderInline(trimmed, `p-${idx}`)}</p>);
    });
    flushList("flush-end");

    return <div>{blocks}</div>;
}

export default function StudentStudyMaterial() {
    const { token } = useInternshipAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/internship/study-material/current`, { headers: { Authorization: `Bearer ${token}` } });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json.detail || "Could not load study material");
                setData(json);
            } catch (e) {
                toast.error(e.message);
            }
            setLoading(false);
        })();
    }, [token]);

    const continueToQuiz = async () => {
        try {
            await fetch(`${API_BASE}/api/internship/study-material/mark-viewed`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        } catch { /* non-blocking — quiz page also tolerates a retry */ }
        navigate("/portal/student/quiz");
    };

    if (loading) {
        return (
            <StudentLayout activeKey="missions">
                <div className="text-white/50 text-sm">Loading study material...</div>
            </StudentLayout>
        );
    }

    if (!data || data.week_number === 0) {
        return (
            <StudentLayout activeKey="missions">
                <div className="max-w-lg mx-auto text-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                    <p className="text-white/50 text-sm">Your program hasn't started yet.</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout activeKey="missions">
            <div className="max-w-2xl mx-auto pb-24">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-9 h-9 rounded-full bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0]">
                        <BookOpen size={16} />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-bold">Week {data.week_number} Study Material</h1>
                        <p className="text-[11px] text-white/40">Read this before the quiz — it's built from your actual assigned tasks.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mt-5">
                    <StudyMarkdown content={data.content} />
                </div>

                <div className="fixed bottom-0 inset-x-0 md:sticky md:bottom-3 p-4 md:p-0 bg-[#050B16] md:bg-transparent border-t md:border-0 border-white/10 z-10 mt-6">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={continueToQuiz}
                            className="w-full bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Continue to Quiz <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
