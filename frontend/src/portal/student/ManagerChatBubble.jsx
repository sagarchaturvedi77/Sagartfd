import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useInternshipAuth } from "./InternshipAuthContext";
import { useSubmitOnce } from "../../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const UNREAD_POLL_MS = 30000;

// Persistent floating chat launcher — visible on every /portal/student/*
// page (mounted once in StudentLayout), not buried inside one dashboard
// card. Real two-way chat with an AI-played manager persona, briefed on
// this specific student's own tasks/performance (see backend's
// internship_manager_routes.py). Honestly labeled "AI Manager" throughout.
export default function ManagerChatBubble() {
    const { token } = useInternshipAuth();
    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [unread, setUnread] = useState(0);
    const scrollRef = useRef(null);

    const loadUnread = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/manager-chat/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => ({}));
            setUnread(json.unread || 0);
        } catch { /* silent — non-critical polling */ }
    };

    const loadMessages = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/manager-chat`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setPersona({ name: data.persona_name, role: data.persona_role });
                setMessages(data.messages || []);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!token) return;
        loadUnread();
        const id = setInterval(loadUnread, UNREAD_POLL_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open]);

    const openChat = async () => {
        setOpen(true);
        await loadMessages();
        await fetch(`${API_BASE}/api/internship/manager-chat/mark-seen`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        setUnread(0);
    };

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
            await fetch(`${API_BASE}/api/internship/manager-chat/mark-seen`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        } catch (err) {
            toast.error(err.message || "Message failed to send");
        }
    });

    return (
        <>
            {/* Floating launcher — bottom-right, cleared above the mobile
                bottom nav (which is ~64px tall) so it never overlaps it. */}
            {!open && (
                <button
                    onClick={openChat}
                    aria-label="Chat with your AI Manager"
                    data-testid="manager-chat-bubble"
                    className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] shadow-[0_8px_24px_rgba(20,224,160,0.4)] flex items-center justify-center transition-transform hover:scale-105"
                >
                    <MessageSquare size={22} />
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#C7102E] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#050B16]">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </button>
            )}

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
                                    <p className="text-sm font-bold text-white truncate">{persona?.name || "Your Manager"}</p>
                                    <p className="text-[10px] text-white/40 truncate">{persona?.role || ""} · AI Manager, not a real person</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white shrink-0"><X size={18} /></button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-white/35 text-xs text-center py-8">
                                    Say hi to {persona?.name || "your manager"} — ask about a task, your progress, or anything you're stuck on.
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
