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

// Simple client-side translator using LibreTranslate or fallback hint
async function translateText(text, toLang) {
  try {
    // Use MyMemory free API
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

function MessageBubble({ m, isMe, onTranslate }) {
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
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{
        maxWidth: "72%", borderRadius: 16, padding: "8px 12px",
        background: isMe ? "#024396" : "#fff",
        color: isMe ? "#fff" : "#0E1B2C",
        borderTopRightRadius: isMe ? 4 : 16,
        borderTopLeftRadius: isMe ? 16 : 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        position: "relative",
      }}>
        {!isMe && (
          <p style={{ fontSize: 10, fontWeight: 700, color: m.sender_role === "admin" ? "#024396" : "#5C677D", marginBottom: 2 }}>
            {m.sender_name}
          </p>
        )}
        <p style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>{m.text}</p>

        {/* Translated text */}
        {translated && (
          <div style={{ marginTop: 6, padding: "6px 8px", background: isMe ? "rgba(255,255,255,0.15)" : "#F5F1EB", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: isMe ? "rgba(255,255,255,0.9)" : "#5C677D", margin: 0 }}>{translated}</p>
            <button onClick={copyTranslated} style={{ background: "none", border: "none", fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : "#024396", cursor: "pointer", padding: 0, marginTop: 3 }}>
              📋 Copy translation
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.6)" : "#9AA5B4" }}>
            {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {/* Translate button */}
          <button onClick={() => setShowTranslate(v => !v)} style={{ background: "none", border: "none", fontSize: 10, color: isMe ? "rgba(255,255,255,0.6)" : "#9AA5B4", cursor: "pointer", padding: 0 }}>
            🌐
          </button>
        </div>

        {/* Translate panel */}
        {showTranslate && (
          <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <select value={toLang} onChange={(e) => setToLang(e.target.value)} style={{ fontSize: 11, border: "1px solid #E2D8C2", borderRadius: 6, padding: "2px 6px", background: "#fff", color: "#0E1B2C" }}>
              {TRANSLATE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={doTranslate} disabled={translating} style={{ fontSize: 11, background: "#024396", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
              {translating ? "..." : "Translate"}
            </button>
            {translated && (
              <button onClick={() => { setTranslated(null); setShowTranslate(false); }} style={{ fontSize: 11, background: "#F5F1EB", color: "#5C677D", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeChat() {
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
    setMsgs(m => m.filter(x => x.id !== id));
  };

  return (
    <PortalLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#fff", borderRadius: 16, border: "1px solid #E2D8C2", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2D8C2", display: "flex", alignItems: "center", gap: 10, background: "#0E1B2C" }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>Team Chat — General</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>All team members can see this</p>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🌐 Tap any message to translate</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {msgs.length === 0 && <p style={{ textAlign: "center", color: "#9AA5B4", fontSize: 13, paddingTop: 40 }}>No messages yet. Say hello 👋</p>}
          {msgs.map(m => (
            <div key={m.id} style={{ position: "relative" }}>
              <MessageBubble m={m} isMe={m.sender_id === user?.id} />
              {(m.sender_id === user?.id) && (
                <button onClick={() => del(m.id)} style={{
                  position: "absolute", top: 0, right: 0,
                  background: "#fee2e2", border: "none", borderRadius: "50%",
                  width: 18, height: 18, fontSize: 10, color: "#dc2626",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0.7,
                }}>×</button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} style={{ borderTop: "1px solid #E2D8C2", padding: "10px 12px", display: "flex", gap: 8, background: "#FAFAF9" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, background: "#F5F1EB", borderRadius: 12, padding: "9px 14px", fontSize: 13, border: "none", outline: "none", color: "#0E1B2C" }}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()} style={{
            background: "#024396", color: "#fff", border: "none", borderRadius: 12,
            padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (sending || !text.trim()) ? 0.5 : 1,
          }}>
            Send
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}
