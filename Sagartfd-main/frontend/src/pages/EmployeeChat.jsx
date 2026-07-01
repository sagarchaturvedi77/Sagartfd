import React, { useState, useEffect, useRef, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 4000;

export default function AdminChat() {
  const { token, user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/chat/?room=general&limit=80`, { headers });
    if (res.ok) setMsgs(await res.json());
  }, [token]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, POLL_MS); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await fetch(`${API_BASE}/api/chat/`, { method: "POST", headers, body: JSON.stringify({ text: text.trim(), room: "general" }) });
    setText("");
    await load();
    setSending(false);
  };

  const del = async (id) => {
    await fetch(`${API_BASE}/api/chat/${id}`, { method: "DELETE", headers });
    setMsgs((m) => m.filter((x) => x.id !== id));
  };

  return (
    <PortalLayout>
      <div className="flex flex-col h-[calc(100vh-130px)] bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E2D8C2] flex items-center gap-3">
          <span className="text-lg">💬</span>
          <div>
            <p className="font-semibold text-[#0E1B2C] text-sm">Team Chat — General</p>
            <p className="text-[11px] text-[#2A364B]/50">Everyone in TFD can see this channel</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {msgs.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`group relative max-w-[75%] rounded-2xl px-4 py-2 shadow-sm text-sm ${isMe ? "bg-[#024396] text-white rounded-tr-none" : "bg-[#F5F1EB] text-[#0E1B2C] rounded-tl-none"}`}>
                  {!isMe && <p className={`text-[10px] font-semibold mb-0.5 ${m.sender_role === "admin" ? "text-[#024396]" : "text-[#2A364B]/60"}`}>{m.sender_name}</p>}
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/60" : "text-[#2A364B]/40"}`}>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  <button onClick={() => del(m.id)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-100 text-red-400 text-[10px] hidden group-hover:flex items-center justify-center">×</button>
                </div>
              </div>
            );
          })}
          {msgs.length === 0 && <p className="text-center text-sm text-[#2A364B]/40 py-10">No messages yet. Say hello 👋</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="border-t border-[#E2D8C2] px-4 py-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 text-sm bg-[#F5F1EB] rounded-xl px-4 py-2.5 outline-none text-[#0E1B2C]"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580] disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}
