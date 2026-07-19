import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Real two-way chat with an AI-played manager persona, briefed on this
// specific student's own tasks/performance (see backend's
// internship_manager_routes.py). Honestly labeled "AI Manager" throughout —
// persona immersion and disclosure aren't in conflict, same line the
// public site's TFD-AI already draws.
export default function ManagerFeedWidget() {
    const { token } = useInternshipAuth();
    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    const load = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/manager-chat`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setPersona({ name: data.persona_name, role: data.persona_role });
                setMessages(data.messages || []);
            }
        } catch {
            // silent — nice-to-have widget, not critical path
        }
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [token]);

    useEffect(() => {
        if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open]);

    const [handleSend, sending] = useSubmitOnce(async () => {
        const text = draft.trim();
        if (!text) return;
        setDraft("");
        setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "student", text, created_at: new Date().toISOString() }]);
        try {
            const res = await fetch(`${API_BASE}/api/internship/manager-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Could not send message");
            setMessages((prev) => [...prev, data.reply]);
        } catch (err) {
            toast.error(err.message || "Message failed to send");
        }
    });

    if (loading || !persona) return null;

    const lastMessage = messages[messages.length - 1];

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#14E0A0]/30 transition-colors p-5 flex items-start gap-3"
            >
                <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                    <MessageSquare size={17} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white/45 flex items-center gap-1.5">
                        {persona.name}, {persona.role}
                        <span className="text-[9px] uppercase tracking-wide text-[#14E0A0]/70 border border-[#14E0A0]/25 rounded-full px-1.5 py-0.5">AI Manager</span>
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed mt-1 truncate">
                        {lastMessage ? lastMessage.text : "Tap to chat with your manager — ask about any task, or just say hi."}
                    </p>
                </div>
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpen(false)}>
                    <div
                        className="w-full sm:max-w-md bg-[#0A0F1A] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85vh] sm:h-[600px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0] shrink-0">
                                    <Sparkles size={15} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{persona.name}</p>
                                    <p className="text-[10px] text-white/40 truncate">{persona.role} · AI Manager, not a real person</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white shrink-0"><X size={18} /></button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-white/35 text-xs text-center py-8">
                                    Say hi to {persona.name} — ask about a task, your progress, or anything you're stuck on.
                                </p>
                            )}
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                            m.role === "student" ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/[0.06] text-white/90"
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0">
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSend(); }}
                                placeholder="Type a message..."
                                className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60"
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !draft.trim()}
                                className="w-10 h-10 rounded-full bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] flex items-center justify-center shrink-0 transition-colors"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
