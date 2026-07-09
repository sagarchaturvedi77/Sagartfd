import React, { useState, useEffect, useRef, useCallback } from "react";
import PortalLayout from "../components/PortalLayout";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 4000;

const TRANSLATE_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "hinglish", label: "Hinglish" },
];

async function translateText(text, toLang) {
  try {
    const langCode = toLang === "hinglish" ? "hi" : toLang;
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`);
    const data = await res.json();
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

function MessageBubble({ m, isMe }) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [toLang, setToLang] = useState("hi");

  const doTranslate = async () => {
    setTranslating(true);
    const result = await translateText(m.text, toLang);
    setTranslated(result);
    setTranslating(false);
    setShowTranslate(false);
  };

  const copyTranslated = () => {
    navigator.clipboard.writeText(translated || m.text);
    alert("Copied!");
  };

  return (
    <div className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm relative ${
        isMe
          ? "bg-[#024396] dark:bg-[#4C8DFF] text-white rounded-tr-md"
          : "bg-white dark:bg-[#182739] text-[#0E1B2C] dark:text-[#F1EDE3] rounded-tl-md border border-[#E2D8C2] dark:border-white/10"
      }`}>
        {!isMe && (
          <p className={`text-[10px] font-bold mb-0.5 ${m.sender_role === "admin" ? "text-[#024396] dark:text-[#7CB0FF]" : "text-[#5C677D] dark:text-[#8E99AC]"}`}>
            {m.sender_name}
          </p>
        )}
        <p className="text-sm leading-snug">{m.text}</p>

        {translated && (
          <div className={`mt-1.5 px-2 py-1.5 rounded-lg ${isMe ? "bg-white/15" : "bg-[#F5F1EB] dark:bg-white/5"}`}>
            <p className={`text-xs ${isMe ? "text-white/90" : "text-[#5C677D] dark:text-[#8E99AC]"}`}>{translated}</p>
            <button onClick={copyTranslated} className={`text-[10px] mt-0.5 ${isMe ? "text-white/70" : "text-[#024396] dark:text-[#7CB0FF]"}`}>
              📋 Copy translation
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] ${isMe ? "text-white/60" : "text-[#9AA5B4]"}`}>
            {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={() => setShowTranslate((v) => !v)} className={`text-[10px] ${isMe ? "text-white/60" : "text-[#9AA5B4]"}`}>
            🌐
          </button>
        </div>

        {showTranslate && (
          <div className="mt-1.5 flex gap-1 flex-wrap items-center">
            <select value={toLang} onChange={(e) => setToLang(e.target.value)}
              className="text-[11px] border border-[#E2D8C2] dark:border-white/15 rounded-md px-1.5 py-0.5 bg-white dark:bg-[#101D2E] text-[#0E1B2C] dark:text-[#F1EDE3]">
              {TRANSLATE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={doTranslate} disabled={translating}
              className="text-[11px] bg-[#024396] dark:bg-[#4C8DFF] text-white rounded-md px-2 py-0.5">
              {translating ? "..." : "Translate"}
            </button>
            {translated && (
              <button onClick={() => { setTranslated(null); setShowTranslate(false); }}
                className="text-[11px] bg-[#F5F1EB] dark:bg-white/10 text-[#5C677D] dark:text-[#8E99AC] rounded-md px-2 py-0.5">
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
    if (!window.confirm("Delete this message?")) return;
    await fetch(`${API_BASE}/api/chat/${id}`, { method: "DELETE", headers });
    setMsgs((m) => m.filter((x) => x.id !== id));
  };

  return (
    <PortalLayout>
      <div className="flex flex-col rounded-2xl border border-[#E2D8C2] dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-[#101D2E]" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#E2D8C2] dark:border-white/10 bg-[#0E1B2C] dark:bg-[#0B1420]">
          <span className="text-lg">💬</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Team Chat — General</p>
            <p className="text-white/50 text-[11px]">All team members can see this · You can moderate any message</p>
          </div>
          <div className="text-[11px] text-white/40 hidden sm:block">🌐 Tap any message to translate</div>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3">
          {msgs.length === 0 && <p className="text-center text-[#9AA5B4] text-sm pt-10">No messages yet. Say hello 👋</p>}
          {msgs.map((m) => (
            <div key={m.id} className="relative">
              <MessageBubble m={m} isMe={m.sender_id === user?.id} />
              {(m.sender_id === user?.id || user?.role === "admin") && (
                <button onClick={() => del(m.id)} title="Delete message"
                  className="absolute top-0 right-0 bg-red-100 dark:bg-red-900/40 border-none rounded-full w-[18px] h-[18px] text-[10px] text-red-600 dark:text-red-400 flex items-center justify-center opacity-70 hover:opacity-100">
                  ×
                </button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="border-t border-[#E2D8C2] dark:border-white/10 p-2.5 flex gap-2 bg-[#FAFAF9] dark:bg-white/5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#F5F1EB] dark:bg-white/10 rounded-xl px-3.5 py-2 text-sm outline-none text-[#0E1B2C] dark:text-[#F1EDE3] placeholder:text-[#9AA5B4]"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="bg-[#024396] dark:bg-[#4C8DFF] text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}
