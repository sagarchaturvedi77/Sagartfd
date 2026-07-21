import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, ChevronLeft, CheckCircle2, XCircle, Lock, RefreshCw } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_META = {
    new: { label: "Not started", color: "text-white/40" },
    in_progress: { label: "In conversation", color: "text-amber-400" },
    converted: { label: "Converted", color: "text-[#14E0A0]" },
    lost: { label: "Lost", color: "text-red-400" },
};

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function StudentConnect() {
    const { token } = useInternshipAuth();
    const [contacts, setContacts] = useState([]);
    const [threads, setThreads] = useState({});
    const [activeContact, setActiveContact] = useState(null);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [contactsError, setContactsError] = useState(false);
    const [threadError, setThreadError] = useState(false);
    const scrollRef = useRef(null);

    const loadContacts = useCallback(async () => {
        setLoading(true);
        setContactsError(false);
        try {
            const [contactsRes, threadsRes] = await Promise.all([
                fetch(`${API_BASE}/api/internship/connect/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/internship/connect/threads`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const contactsData = await contactsRes.json().catch(() => []);
            const threadsData = await threadsRes.json().catch(() => []);
            if (contactsRes.ok) setContacts(contactsData);
            else setContactsError(true);
            if (threadsRes.ok) {
                const map = {};
                threadsData.forEach((t) => { map[t.contact_id] = t; });
                setThreads(map);
            } else setContactsError(true);
        } catch { setContactsError(true); }
        setLoading(false);
    }, [token]);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    const openContact = async (contactId) => {
        setActiveContact(contactId);
        setThreadError(false);
        try {
            const res = await fetch(`${API_BASE}/api/internship/connect/thread/${contactId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => null);
            if (res.ok && data) setThreads((prev) => ({ ...prev, [contactId]: data }));
            else setThreadError(true);
        } catch { setThreadError(true); }
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [threads, activeContact]);

    const [handleSend, sending] = useSubmitOnce(async () => {
        const text = draft.trim();
        if (!text || !activeContact) return;
        setDraft("");
        try {
            const res = await fetch(`${API_BASE}/api/internship/connect/thread/${activeContact}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Message failed to send");
            setThreads((prev) => ({ ...prev, [activeContact]: data }));
        } catch (e) {
            toast.error(e.message);
        }
    });

    const activeThread = activeContact ? threads[activeContact] : null;
    const activeContactMeta = contacts.find((c) => c.id === activeContact);

    return (
        <StudentLayout activeKey="connect">
            <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -m-4 sm:-m-6 md:m-0 rounded-none md:rounded-2xl border-0 md:border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                    <h1 className="font-display text-base font-bold flex items-center gap-2"><MessageCircle size={16} className="text-[#14E0A0]" /> TFD Connect</h1>
                </div>

                <div className="flex flex-1 min-h-0">
                    <div className={`${activeContact ? "hidden md:flex" : "flex"} flex-col w-full md:w-[300px] shrink-0 border-r border-white/10 overflow-y-auto`}>
                        {loading && <div className="p-4 text-xs text-white/40">Loading...</div>}
                        {!loading && contactsError && (
                            <button onClick={loadContacts} className="flex items-center gap-1.5 p-4 text-xs text-amber-400 hover:text-amber-300 w-full text-left">
                                <RefreshCw size={12} /> Couldn't load contacts — tap to retry
                            </button>
                        )}
                        {contacts.map((c) => {
                            const t = threads[c.id];
                            const lastMsg = t?.messages?.[t.messages.length - 1];
                            const status = STATUS_META[t?.status || "new"];
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => openContact(c.id)}
                                    className={`text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors ${activeContact === c.id ? "bg-white/[0.06]" : ""}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-white truncate">{c.name}</p>
                                        <span className={`text-[9px] font-bold ${status.color}`}>{status.label}</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 truncate mt-0.5">{c.role}</p>
                                    {lastMsg && <p className="text-[11px] text-white/50 truncate mt-1">{lastMsg.sender === "student" ? "You: " : ""}{lastMsg.text}</p>}
                                </button>
                            );
                        })}
                    </div>

                    <div className={`${activeContact ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0`}>
                        {!activeContact && (
                            <div className="flex-1 flex items-center justify-center text-white/25 text-xs">Select a contact to start chatting</div>
                        )}
                        {activeContact && (
                            <>
                                <div className="flex items-center gap-2 p-3 border-b border-white/10">
                                    <button onClick={() => setActiveContact(null)} className="md:hidden text-white/50"><ChevronLeft size={18} /></button>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{activeContactMeta?.name}</p>
                                        <p className="text-[10px] text-white/40 truncate">{activeContactMeta?.role}</p>
                                    </div>
                                    {activeThread?.status === "converted" && <CheckCircle2 size={16} className="text-[#14E0A0] ml-auto shrink-0" />}
                                    {activeThread?.status === "lost" && <XCircle size={16} className="text-red-400 ml-auto shrink-0" />}
                                </div>

                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#0A0F1A]/40">
                                    {threadError && (
                                        <button onClick={() => openContact(activeContact)} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mx-auto">
                                            <RefreshCw size={12} /> Couldn't load this conversation — tap to retry
                                        </button>
                                    )}
                                    {!threadError && (!activeThread?.messages || activeThread.messages.length === 0) && (
                                        <p className="text-white/30 text-xs text-center py-8">Say hi to {activeContactMeta?.name} to start the conversation.</p>
                                    )}
                                    {activeThread?.messages?.map((m, i) => (
                                        <div key={i} className={`flex ${m.sender === "student" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${m.sender === "student" ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/10 text-white/90"}`}>
                                                {m.text}
                                                <p className={`text-[9px] mt-1 ${m.sender === "student" ? "text-[#050B16]/50" : "text-white/30"}`}>{formatTime(m.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 border-t border-white/10">
                                    {activeThread?.locked ? (
                                        <p className="flex items-center gap-1.5 text-[11px] text-white/40 justify-center py-2"><Lock size={12} /> This chat is locked — the task it belongs to has already been graded.</p>
                                    ) : activeThread?.status === "converted" || activeThread?.status === "lost" ? (
                                        <p className="text-[11px] text-white/40 text-center py-2">
                                            {activeThread.status === "converted" ? "Deal converted — nice work." : "This lead went cold, but you can keep chatting to try recovering it."}
                                        </p>
                                    ) : null}
                                    {!activeThread?.locked && (
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                value={draft}
                                                onChange={(e) => setDraft(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSend(); }}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30"
                                            />
                                            <button onClick={handleSend} disabled={sending || !draft.trim()} className="w-10 h-10 shrink-0 rounded-full bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] flex items-center justify-center">
                                                <Send size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
