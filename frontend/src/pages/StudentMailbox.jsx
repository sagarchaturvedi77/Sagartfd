import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Inbox, Send, FileEdit, PenSquare, X, ChevronLeft, Lock, RefreshCw } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const FOLDERS = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "sent", label: "Sent", icon: Send },
    { key: "drafts", label: "Drafts", icon: FileEdit },
];

function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function ComposeModal({ open, onClose, contacts, initial, onSent }) {
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [threadId, setThreadId] = useState(null);

    useEffect(() => {
        if (!open) return;
        setTo(initial?.to || "");
        setSubject(initial?.subject || "");
        setBody(initial?.body || "");
        setThreadId(initial?.thread_id || null);
    }, [open, initial]);

    const { token } = useInternshipAuth();

    const [handleSend, sending] = useSubmitOnce(async (isDraft = false) => {
        if (!to || !subject.trim() || !body.trim()) { toast.error("Fill in recipient, subject and body"); return; }
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/compose`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_email: to, subject, body, thread_id: threadId, is_draft: isDraft }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Could not send");
            toast.success(isDraft ? "Draft saved" : "Email sent — the client will reply within a while, check back soon");
            onSent?.();
            onClose();
        } catch (e) {
            toast.error(e.message);
        }
    });

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="w-full sm:max-w-lg bg-[#0A0F1A] border border-white/10 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">New Message</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto">
                    <select
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        disabled={!!initial?.thread_id}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white disabled:opacity-60"
                    >
                        <option value="">Select recipient...</option>
                        {contacts.map((c) => <option key={c.email} value={c.email}>{c.name} — {c.role}</option>)}
                    </select>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30"
                    />
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your email..."
                        rows={10}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 resize-none"
                    />
                </div>
                <div className="p-4 border-t border-white/10 flex gap-2">
                    <button onClick={() => handleSend(true)} disabled={sending} className="flex-1 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl py-2.5">Save Draft</button>
                    <button onClick={() => handleSend(false)} disabled={sending} className="flex-1 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] text-sm font-bold rounded-xl py-2.5">{sending ? "Sending..." : "Send"}</button>
                </div>
            </div>
        </div>
    );
}

export default function StudentMailbox() {
    const { token } = useInternshipAuth();
    const [folder, setFolder] = useState("inbox");
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeInitial, setComposeInitial] = useState(null);
    const [replyBody, setReplyBody] = useState("");

    const loadMessages = useCallback(async (f) => {
        setLoading(true);
        setSelectedThread(null);
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/messages?folder=${f}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => []);
            if (res.ok) setMessages(data);
        } catch { /* silent */ }
        setLoading(false);
    }, [token]);

    const loadContacts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/contacts`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => []);
            if (res.ok) setContacts(data);
        } catch { /* silent */ }
    }, [token]);

    useEffect(() => { loadContacts(); }, [loadContacts]);
    useEffect(() => { loadMessages(folder); }, [folder, loadMessages]);

    const openThread = async (threadId) => {
        setSelectedThread(threadId);
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/thread/${threadId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => []);
            if (res.ok) setThreadMessages(data);
        } catch { /* silent */ }
    };

    const sendDraft = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/draft/${id}/send`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Could not send draft");
            toast.success("Draft sent");
            loadMessages(folder);
        } catch (e) {
            toast.error(e.message);
        }
    };

    const [sendReply, replying] = useSubmitOnce(async () => {
        if (!replyBody.trim() || !threadMessages.length) return;
        const last = threadMessages[threadMessages.length - 1];
        const toContact = last.direction === "inbound" ? last.from_email : last.to_email;
        try {
            const res = await fetch(`${API_BASE}/api/internship/mailbox/compose`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_email: toContact, subject: `Re: ${last.subject.replace(/^Re:\s*/i, "")}`, body: replyBody, thread_id: selectedThread }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || "Could not send reply");
            setReplyBody("");
            toast.success("Reply sent");
            openThread(selectedThread);
        } catch (e) {
            toast.error(e.message);
        }
    });

    const isLocked = threadMessages.some((m) => m.locked);

    return (
        <StudentLayout activeKey="mailbox">
            <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -m-4 sm:-m-6 md:m-0 rounded-none md:rounded-2xl border-0 md:border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                    <h1 className="font-display text-base font-bold flex items-center gap-2"><Inbox size={16} className="text-[#14E0A0]" /> TFD Mailbox</h1>
                    <button onClick={() => { setComposeInitial(null); setComposeOpen(true); }} className="flex items-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] text-xs font-bold rounded-lg px-3 py-2">
                        <PenSquare size={13} /> Compose
                    </button>
                </div>

                <div className="flex flex-1 min-h-0">
                    {/* Folder rail */}
                    <div className="hidden sm:flex flex-col w-40 shrink-0 border-r border-white/10 p-2 gap-1">
                        {FOLDERS.map((f) => {
                            const Icon = f.icon;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => setFolder(f.key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left ${folder === f.key ? "bg-[#14E0A0]/15 text-[#14E0A0]" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                                >
                                    <Icon size={13} /> {f.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Message list */}
                    <div className={`${selectedThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-[280px] shrink-0 border-r border-white/10 overflow-y-auto`}>
                        <div className="flex sm:hidden gap-1 p-2 border-b border-white/10">
                            {FOLDERS.map((f) => (
                                <button key={f.key} onClick={() => setFolder(f.key)} className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg ${folder === f.key ? "bg-[#14E0A0]/15 text-[#14E0A0]" : "text-white/50"}`}>{f.label}</button>
                            ))}
                        </div>
                        {loading && <div className="p-4 text-xs text-white/40">Loading...</div>}
                        {!loading && messages.length === 0 && <div className="p-4 text-xs text-white/40">Nothing here yet.</div>}
                        {messages.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => (folder === "drafts" ? sendDraft(m.id) : openThread(m.thread_id))}
                                className={`text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors ${selectedThread === m.thread_id ? "bg-white/[0.06]" : ""} ${folder === "inbox" && !m.is_read ? "bg-[#14E0A0]/[0.04]" : ""}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs truncate ${folder === "inbox" && !m.is_read ? "font-bold text-white" : "font-medium text-white/70"}`}>
                                        {folder === "sent" || folder === "drafts" ? m.to_name : m.from_name}
                                    </p>
                                    <span className="text-[10px] text-white/30 shrink-0">{timeAgo(m.created_at)}</span>
                                </div>
                                <p className="text-[11px] text-white/50 truncate mt-0.5">{m.subject}</p>
                                {m.status === "draft" && <span className="text-[9px] text-amber-400 font-semibold">DRAFT — tap to send</span>}
                            </button>
                        ))}
                    </div>

                    {/* Reading pane */}
                    <div className={`${selectedThread ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0`}>
                        {!selectedThread && (
                            <div className="flex-1 flex items-center justify-center text-white/25 text-xs">Select an email to read</div>
                        )}
                        {selectedThread && (
                            <>
                                <button onClick={() => setSelectedThread(null)} className="md:hidden flex items-center gap-1 text-xs text-white/50 p-3 border-b border-white/10">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {threadMessages.map((m) => (
                                        <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs font-bold text-white">{m.from_name} <span className="text-white/30 font-normal">&lt;{m.from_email}&gt;</span></p>
                                                <span className="text-[10px] text-white/30">{timeAgo(m.created_at)}</span>
                                            </div>
                                            <p className="text-[11px] text-white/40 mb-2">To: {m.to_name}</p>
                                            <p className="text-sm font-semibold text-white mb-1.5">{m.subject}</p>
                                            <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 p-3">
                                    {isLocked ? (
                                        <p className="flex items-center gap-1.5 text-[11px] text-white/40 justify-center py-2"><Lock size={12} /> This thread is locked — the task it belongs to has already been graded.</p>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                value={replyBody}
                                                onChange={(e) => setReplyBody(e.target.value)}
                                                placeholder="Write a reply..."
                                                className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30"
                                            />
                                            <button onClick={sendReply} disabled={replying || !replyBody.trim()} className="bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] text-sm font-bold rounded-full px-4">
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

            <ComposeModal
                open={composeOpen}
                onClose={() => setComposeOpen(false)}
                contacts={contacts}
                initial={composeInitial}
                onSent={() => loadMessages(folder)}
            />
        </StudentLayout>
    );
}
