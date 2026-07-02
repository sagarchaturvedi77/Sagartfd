import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import InstallPrompt from "./InstallPrompt";
import { registerServiceWorker, enablePush } from "../portal/push";

const adminItems = [
  { key: "dashboard",  label: "📊 Dashboard",         path: "/portal/admin" },
  { key: "attendance", label: "🕐 Attendance",         path: "/portal/admin/attendance" },
  { key: "leads",      label: "📋 Leads",              path: "/portal/admin/leads" },
  { key: "pipelines",  label: "🔀 Pipelines",          path: "/portal/admin/pipelines" },
  { key: "salary",     label: "💰 Salary",             path: "/portal/admin/salary" },
  { key: "tasks",      label: "✅ Tasks",              path: "/portal/admin/tasks" },
  { key: "targets",    label: "🎯 Targets",            path: "/portal/admin/targets" },
  { key: "reports",    label: "📈 Reports",            path: "/portal/admin/reports" },
  { key: "leaves",     label: "🌴 Leave Requests",     path: "/portal/admin/leaves" },
  { key: "chat",       label: "💬 Team Chat",          path: "/portal/admin/chat" },
  { key: "access",     label: "🔑 Access Control",     path: "/portal/admin/access" },
  { key: "announce",   label: "📢 Announcements",      path: "/portal/admin/announce" },
  { key: "website",    label: "🌐 Website / Content",  path: "/portal/admin/website" },
  { key: "settings",   label: "⚙️ Settings",           path: "/portal/admin/settings" },
];

const employeeItems = [
  { key: "dashboard",   label: "📊 Dashboard",         path: "/portal/employee" },
  { key: "attendance",  label: "🕐 Attendance",         path: "/portal/employee/attendance" },
  { key: "leads",       label: "📋 My Leads",           path: "/portal/employee/leads" },
  { key: "calculators", label: "🧮 Calculators",        path: "/portal/employee/calculators" },
  { key: "id-card",     label: "🪪 ID & Visiting Card", path: "/portal/employee/id-card" },
  { key: "salary",      label: "💰 Salary",             path: "/portal/employee/salary" },
  { key: "tasks",       label: "✅ Tasks",              path: "/portal/employee/tasks" },
  { key: "targets",     label: "🎯 Targets",            path: "/portal/employee/targets" },
  { key: "leaves",      label: "🌴 My Leaves",          path: "/portal/employee/leaves" },
  { key: "chat",        label: "💬 Team Chat",          path: "/portal/employee/chat" },
  { key: "profile",     label: "👤 My Profile",         path: "/portal/employee/profile" },
  { key: "settings",    label: "⚙️ Settings",           path: "/portal/employee/settings" },
];

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 5000;

export default function PortalLayout({ children }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminItems : employeeItems;

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [lastSeen] = useState(() => localStorage.getItem("chat_last_seen") || "");
  const [showTranslator, setShowTranslator] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetMode, setTargetMode] = useState("english");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [popupMsgs, setPopupMsgs] = useState([]);
  const [popupText, setPopupText] = useState("");
  const [popupSending, setPopupSending] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const popupBottomRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") enablePush();
    const handleClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileMenuOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close sidebar on mobile route change
  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, [location.pathname]);

  // Mark chat as seen when on chat page
  useEffect(() => {
    if (location.pathname.includes("/chat")) {
      const now = new Date().toISOString();
      localStorage.setItem("chat_last_seen", now);
      setUnreadChat(0);
    }
  }, [location.pathname]);

  const loadPopupChat = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/?room=general&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const msgs = await res.json();
        setPopupMsgs(msgs);
        const unseen = msgs.filter(m => m.sender_id !== user?.id && m.created_at > lastSeen).length;
        setUnreadChat(unseen);
      }
    } catch (e) {}
  }, [token, lastSeen, user?.id]);

  useEffect(() => {
    loadPopupChat();
    const t = setInterval(loadPopupChat, POLL_MS);
    return () => clearInterval(t);
  }, [loadPopupChat]);

  useEffect(() => {
    if (showChatPopup) popupBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [popupMsgs, showChatPopup]);

  const sendPopupMessage = async (e) => {
    e.preventDefault();
    if (!popupText.trim() || !token) return;
    setPopupSending(true);
    try {
      await fetch(`${API_BASE}/api/chat/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: popupText.trim(), room: "general" }),
      });
      setPopupText("");
      await loadPopupChat();
    } catch (e) {}
    setPopupSending(false);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setTranslateLoading(true);
    setTranslatedText("");
    try {
      const langPair = targetMode === "english" ? "hi|en" : "en|hi";
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText.trim())}&langpair=${langPair}`);
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.responseData.translatedText || "Translation failed.");
      } else {
        setTranslatedText("Service unavailable. Try again.");
      }
    } catch {
      setTranslatedText("Network error.");
    }
    setTranslateLoading(false);
  };

  const isMobile = window.innerWidth <= 768;
  const profilePath = isAdmin ? "/portal/admin" : "/portal/employee/profile";
  const salaryPath = isAdmin ? "/portal/admin/salary" : "/portal/employee/salary";
  const idCardPath = "/portal/employee/id-card";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .portal-wrapper { min-height: 100vh; background: #F5F1EB; display: flex; flex-direction: column; }

        /* HEADER */
        .portal-header { position: fixed; top: 0; left: 0; right: 0; height: 52px; background: #0E1B2C; display: flex; align-items: center; padding: 0 14px; gap: 10px; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
        .ph-brand { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; }
        .ph-role { font-size: 10px; color: rgba(255,255,255,0.4); }
        .ph-spacer { flex: 1; }
        .ph-uname { font-size: 13px; font-weight: 600; color: #fff; }
        .ph-urole { font-size: 10px; color: rgba(255,255,255,0.4); }
        .ph-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#024396,#0356c4); color: #fff; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; border: none; }
        .ph-dropdown { position: absolute; top: 42px; right: 0; background: #fff; border: 1px solid rgba(14,27,44,0.1); border-radius: 10px; width: 180px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 1000; overflow: hidden; }
        .dd-item { display: block; width: 100%; text-align: left; padding: 10px 14px; font-size: 13px; color: #2A364B; background: none; border: none; cursor: pointer; }
        .dd-item:hover { background: #F3F7FB; color: #024396; }
        .translate-btn { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 7px; padding: 4px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .translate-btn:hover { background: rgba(255,255,255,0.2); }
        .hamburger { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 2px 4px; line-height: 1; }

        /* BODY */
        .portal-body { display: flex; flex: 1; padding-top: 52px; min-height: calc(100vh - 84px); }

        /* SIDEBAR */
        .portal-sidebar {
          width: 210px; flex-shrink: 0; background: #fff;
          border-right: 1px solid rgba(14,27,44,0.07);
          position: fixed; top: 52px; left: 0; bottom: 32px;
          overflow-y: auto; overflow-x: hidden;
          z-index: 80; padding: 12px 8px 16px;
          display: flex; flex-direction: column; justify-content: space-between;
          transition: transform 0.26s ease;
        }
        .portal-sidebar.closed { transform: translateX(-210px); }
        .sb-brand { font-size: 12px; font-weight: 700; color: #0E1B2C; padding: 2px 8px 10px; border-bottom: 1px solid rgba(14,27,44,0.06); margin-bottom: 8px; }
        .nav-btn { display: flex; align-items: center; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; margin-bottom: 1px; background: none; border: none; color: #2A364B; font-size: 13px; cursor: pointer; transition: background 0.15s; position: relative; }
        .nav-btn:hover { background: #F3F7FB; }
        .nav-btn.active { background: #EAF1FB; color: #024396; font-weight: 600; }
        .nav-badge { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #dc2626; color: #fff; font-size: 9px; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }
        .sb-logout { display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; background: #FFF5F5; border: 1px solid #FFE3E3; color: #C53030; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 8px; }
        .sb-logout:hover { background: #FFE3E3; }

        /* BACKDROP */
        .sb-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 79; }

        /* MAIN */
        .portal-main { flex: 1; padding: 20px; min-width: 0; padding-bottom: 48px; transition: margin-left 0.26s ease; }

        /* FOOTER */
        .portal-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 32px; background: #024396; display: flex; align-items: center; justify-content: center; z-index: 90; }
        .portal-footer span { color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 500; }

        /* LOGOUT MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .modal-box { background: #fff; padding: 24px; border-radius: 14px; width: 300px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .modal-box h3 { margin: 0 0 8px; color: #0E1B2C; font-size: 16px; }
        .modal-box p { font-size: 13px; color: #5C677D; margin: 0 0 20px; }
        .modal-btns { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 9px; background: #F5F1EB; color: #2A364B; border: none; border-radius: 9px; font-size: 13px; cursor: pointer; }
        .btn-logout-confirm { flex: 1; padding: 9px; background: #dc2626; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; }

        /* TRANSLATOR */
        .translator-panel { position: fixed; top: 58px; right: 14px; background: #fff; border: 1px solid rgba(14,27,44,0.1); border-radius: 12px; padding: 14px; z-index: 500; width: 300px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }

        /* CHAT POPUP */
        .chat-fab { position: fixed; bottom: 50px; right: 20px; width: 52px; height: 52px; background: linear-gradient(135deg,#024396,#0356c4); color: #fff; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; box-shadow: 0 4px 16px rgba(2,67,150,0.4); z-index: 500; transition: transform 0.15s; }
        .chat-fab:hover { transform: scale(1.08); }
        .chat-fab-badge { position: absolute; top: -2px; right: -2px; background: #dc2626; color: #fff; font-size: 9px; font-weight: 700; min-width: 17px; height: 17px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #fff; }
        .chat-popup { position: fixed; bottom: 112px; right: 20px; width: 320px; height: 420px; background: #fff; border: 1px solid rgba(14,27,44,0.12); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); z-index: 500; display: flex; flex-direction: column; overflow: hidden; }
        .cp-header { background: #0E1B2C; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .cp-body { flex: 1; overflow-y: auto; padding: 10px 12px; background: #F8FAFC; display: flex; flex-direction: column; gap: 8px; }
        .cp-form { padding: 8px 10px; background: #fff; border-top: 1px solid #E2E8F0; display: flex; gap: 6px; flex-shrink: 0; }
        .cp-input { flex: 1; font-size: 12px; padding: 7px 10px; background: #F5F1EB; border: none; border-radius: 8px; outline: none; color: #0E1B2C; }
        .cp-send { background: #024396; color: #fff; border: none; border-radius: 8px; padding: 0 14px; cursor: pointer; font-size: 12px; font-weight: 700; }
        .cp-send:disabled { opacity: 0.5; }
        .cp-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; line-height: 1; }

        /* NOTIFICATION BADGE */
        .notif-wrapper { position: relative; }
        .notif-badge { position: absolute; top: -4px; right: -4px; background: #dc2626; color: #fff; font-size: 9px; min-width: 15px; height: 15px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 2px; border: 1.5px solid #0E1B2C; }

        @media (max-width: 768px) {
          .portal-sidebar { transform: translateX(-210px); }
          .portal-sidebar.mobile-open { transform: translateX(0) !important; }
          .portal-main { margin-left: 0 !important; padding: 14px !important; padding-bottom: 48px !important; }
          .ph-uname, .ph-urole { display: none; }
          .chat-popup { width: calc(100vw - 24px); right: 12px; }
        }
      `}</style>

      <div className="portal-wrapper">

        {/* Logout Modal */}
        {showLogoutConfirm && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout from TFD WorkSpace?</p>
              <div className="modal-btns">
                <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                <button className="btn-logout-confirm" onClick={() => { setShowLogoutConfirm(false); logout(); }}>Logout</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="portal-header">
          <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
          <div>
            <div className="ph-brand">TFD WorkSpace</div>
            <div className="ph-role">{isAdmin ? "Admin Control Panel" : "Employee Portal"}</div>
          </div>
          <div className="ph-spacer" />

          {/* Translator button */}
          <button className="translate-btn" onClick={() => setShowTranslator(v => !v)}>🔤 Translate</button>

          {/* Notification Bell */}
          <div className="notif-wrapper">
            <NotificationBell />
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="ph-uname">{user?.name}</div>
            <div className="ph-urole">{user?.designation || user?.role}</div>
          </div>

          {/* Avatar with dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button className="ph-avatar" onClick={() => setProfileMenuOpen(v => !v)}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </button>
            {profileMenuOpen && (
              <div className="ph-dropdown">
                <button className="dd-item" onClick={() => { navigate(profilePath); setProfileMenuOpen(false); }}>👤 My Profile</button>
                <button className="dd-item" onClick={() => { navigate(salaryPath); setProfileMenuOpen(false); }}>💰 Salary</button>
                {!isAdmin && <button className="dd-item" onClick={() => { navigate(idCardPath); setProfileMenuOpen(false); }}>🪪 ID Card</button>}
                <button className="dd-item" onClick={() => { navigate(isAdmin ? "/portal/admin/settings" : "/portal/employee/settings"); setProfileMenuOpen(false); }}>⚙️ Settings</button>
                <button className="dd-item" style={{ color: "#dc2626", borderTop: "1px solid #F5F1EB" }} onClick={() => { setProfileMenuOpen(false); setShowLogoutConfirm(true); }}>🚪 Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* Translator Panel */}
        {showTranslator && (
          <div className="translator-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0E1B2C" }}>🔤 Smart Translator</span>
              <button onClick={() => setShowTranslator(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#5C677D" }}>×</button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message here..."
              rows={3}
              style={{ width: "100%", border: "1px solid #E2D8C2", borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none", resize: "none", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <select value={targetMode} onChange={(e) => setTargetMode(e.target.value)}
                style={{ flex: 1, border: "1px solid #E2D8C2", borderRadius: 7, padding: "5px 8px", fontSize: 12, outline: "none" }}>
                <option value="english">Hindi → English</option>
                <option value="hinglish">English → Hindi</option>
              </select>
              <button onClick={handleTranslate} disabled={translateLoading}
                style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: translateLoading ? 0.7 : 1 }}>
                {translateLoading ? "..." : "Translate"}
              </button>
            </div>
            {translatedText && (
              <div style={{ background: "#F5F1EB", borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ fontSize: 12, color: "#0E1B2C", margin: "0 0 6px" }}>{translatedText}</p>
                <button onClick={() => { navigator.clipboard.writeText(translatedText); }} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                  📋 Copy
                </button>
              </div>
            )}
          </div>
        )}

        <div className="portal-body">
          {/* Mobile backdrop */}
          {isMobile && sidebarOpen && (
            <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <aside className={`portal-sidebar ${!sidebarOpen ? "closed" : ""} ${isMobile && sidebarOpen ? "mobile-open" : ""}`}>
            <div>
              <div className="sb-brand">TFD WorkSpace</div>
              {items.map((item) => {
                const active = location.pathname === item.path;
                const isChat = item.key === "chat";
                return (
                  <button key={item.key} className={`nav-btn ${active ? "active" : ""}`}
                    onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false); }}>
                    {item.label}
                    {isChat && unreadChat > 0 && <span className="nav-badge">{unreadChat > 9 ? "9+" : unreadChat}</span>}
                  </button>
                );
              })}
            </div>
            <button className="sb-logout" onClick={() => setShowLogoutConfirm(true)}>🚪 Logout</button>
          </aside>

          {/* Main content */}
          <main className="portal-main" style={{ marginLeft: !isMobile && sidebarOpen ? "210px" : "0px" }}>
            {children}
          </main>
        </div>

        {/* Floating Chat FAB */}
        <button className="chat-fab" onClick={() => setShowChatPopup(v => !v)} title="Team Chat">
          💬
          {unreadChat > 0 && <span className="chat-fab-badge">{unreadChat > 9 ? "9+" : unreadChat}</span>}
        </button>

        {/* Chat Popup */}
        {showChatPopup && (
          <div className="chat-popup">
            <div className="cp-header">
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>💬 Team Chat</span>
              <button className="cp-close" onClick={() => setShowChatPopup(false)}>×</button>
            </div>
            <div className="cp-body">
              {popupMsgs.length === 0 && <p style={{ textAlign: "center", fontSize: 12, color: "#9AA5B4", paddingTop: 20 }}>No messages yet</p>}
              {popupMsgs.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    {!isMe && <span style={{ fontSize: 10, color: "#5C677D", fontWeight: 600, marginBottom: 2, paddingLeft: 2 }}>{m.sender_name}</span>}
                    <div style={{
                      maxWidth: "82%", borderRadius: 12, padding: "7px 10px", fontSize: 12,
                      background: isMe ? "#024396" : "#fff",
                      color: isMe ? "#fff" : "#0E1B2C",
                      borderTopRightRadius: isMe ? 3 : 12,
                      borderTopLeftRadius: isMe ? 12 : 3,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      {m.text}
                    </div>
                    <span style={{ fontSize: 9, color: "#9AA5B4", marginTop: 2, paddingRight: 2 }}>
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={popupBottomRef} />
            </div>
            <form onSubmit={sendPopupMessage} className="cp-form">
              <input className="cp-input" value={popupText} onChange={(e) => setPopupText(e.target.value)}
                placeholder="Type a message..." disabled={popupSending} />
              <button type="submit" className="cp-send" disabled={popupSending || !popupText.trim()}>Send</button>
            </form>
          </div>
        )}

        {/* Footer */}
        <footer className="portal-footer">
          <span>Powered by The Financial Doctor</span>
        </footer>

      </div>
      <InstallPrompt />
    </>
  );
}
