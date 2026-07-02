import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import InstallPrompt from "./InstallPrompt";
import { registerServiceWorker, enablePush } from "../portal/push";

const adminItems = [
  { key: "dashboard",  label: "📊 Dashboard",          path: "/portal/admin" },
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
];

const employeeItems = [
  { key: "dashboard",   label: "📊 Dashboard",          path: "/portal/employee" },
  { key: "attendance",  label: "🕐 Attendance",         path: "/portal/employee/attendance" },
  { key: "leads",       label: "📋 My Leads",           path: "/portal/employee/leads" },
  { key: "calculators", label: "🧮 Calculators",        path: "/portal/employee/calculators" },
  { key: "tasks",       label: "✅ Tasks",              path: "/portal/employee/tasks" },
  { key: "targets",     label: "🎯 Targets",            path: "/portal/employee/targets" },
  { key: "leaves",      label: "🌴 My Leaves",          path: "/portal/employee/leaves" },
  { key: "chat",        label: "💬 Team Chat",          path: "/portal/employee/chat" },
  { key: "settings",    label: "⚙️ Settings",           path: "/portal/employee/settings" },
];

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 4000;

export default function PortalLayout({ children }) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminItems : employeeItems;
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem("chat_last_seen") || "");

  // Real Translator Engine States
  const [showTranslator, setShowTranslator] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetMode, setTargetMode] = useState("english"); // Defaulted to Hinglish se English
  const [translateLoading, setTranslateLoading] = useState(false);

  // ── 📊 NEW FLOATING POPUP CHAT STATES ──
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [popupMsgs, setPopupMsgs] = useState([]);
  const [popupText, setPopupText] = useState("");
  const [popupSending, setPopupSending] = useState(false);
  const popupBottomRef = useRef(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      enablePush();
    }
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // ── 💬 ENGINE TO FETCH MESSAGES FOR THE POPUP WINDOW ──
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
    if (showChatPopup) {
      popupBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [popupMsgs, showChatPopup]);

  const sendPopupMessage = async (e) => {
    e.preventDefault();
    if (!popupText.trim() || !token) return;
    setPopupSending(true);
    try {
      await fetch(`${API_BASE}/api/chat/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: popupText.trim(), room: "general" })
      });
      setPopupText("");
      await loadPopupChat();
    } catch (e) {}
    setPopupSending(false);
  };

  const handleRealTranslate = async () => {
    if (!inputText.trim()) return;
    setTranslateLoading(true);
    setTranslatedText("");

    let txt = inputText.trim().toLowerCase();

    if (targetMode === "english") {
      if (txt.includes("kese ho") || txt.includes("kaise ho")) {
        setTranslatedText("Hello, how are you?");
        setTranslateLoading(false);
        return;
      }
      if (txt.includes("lead mil gayi") || txt.includes("lead receive")) {
        setTranslatedText("The lead has been successfully received.");
        setTranslateLoading(false);
        return;
      }
      if (txt.includes("salary kab")) {
        setTranslatedText("When will the salary be processed?");
        setTranslateLoading(false);
        return;
      }
    } else {
      if (txt.includes("how are you")) {
        setTranslatedText("Aap kaise ho?");
        setTranslateLoading(false);
        return;
      }
      if (txt.includes("lead received")) {
        setTranslatedText("Lead receive ho gayi hai.");
        setTranslateLoading(false);
        return;
      }
    }

    try {
      const langPair = targetMode === "hinglish" ? "en|hi" : "hi|en";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${langPair}`
      );
      
      if (res.ok) {
        const data = await res.json();
        let result = data.responseData.translatedText;
        
        if (targetMode === "hinglish") {
          result = result
            .replace(/प्राप्त/g, "receive ho gaya")
            .replace(/वेतन/g, "salary")
            .replace(/कार्य/g, "task")
            .replace(/अनुमोदित/g, "approve");
        }
        setTranslatedText(result);
      } else {
        setTranslatedText("Service busy hai. Please try again.");
      }
    } catch (error) {
      setTranslatedText("Network error. Sync failed.");
    } finally {
      setTranslateLoading(false);
    }
  };

  const profilePath = isAdmin ? "/portal/admin/profile" : "/portal/employee/profile";
  const salaryPath = isAdmin ? "/portal/admin/salary" : "/portal/employee/salary";
  const idCardPath = isAdmin ? "/portal/admin/id-card" : "/portal/employee/id-card";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .portal-wrapper { min-height: 100vh; background: #F5F1EB; display: flex; flex-direction: column; }
        .portal-header { position: fixed; top: 0; left: 0; right: 0; height: 52px; background: #0E1B2C; display: flex; align-items: center; padding: 0 16px; gap: 12px; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
        .ph-brand { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; }
        .ph-role { font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.2; }
        .ph-empid-text { font-size: 9px; color: rgba(255,255,255,0.45); }
        .ph-spacer { flex: 1; }
        .ph-uname { font-size: 13px; font-weight: 600; color: #fff; }
        .ph-urole { font-size: 10px; color: rgba(255,255,255,0.45); }
        
        .ph-avatar-clickable { background: none; border: none; padding: 0; cursor: pointer; border-radius: 50%; outline: none; }
        .ph-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#024396,#0356c4); color: #fff; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        
        .ph-profile-dropdown { position: absolute; top: 40px; right: 0; background: #fff; border: 1px solid rgba(14,27,44,0.1); border-radius: 8px; width: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; overflow: hidden; display: flex; flex-direction: column; text-align: left; }
        .dropdown-item { padding: 10px 14px; font-size: 13px; color: #2A364B; background: none; border: none; cursor: pointer; text-align: left; width: 100%; transition: background 0.15s; }
        .dropdown-item:hover { background: #F3F7FB; color: #024396; font-weight: 500; }
        
        .translate-trigger-btn { background: #024396; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 7px; padding: 4px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .hamburger-btn { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; display: block; padding: 2px 4px; line-height: 1; outline: none; }
        .portal-body { display: flex; flex: 1; padding-top: 52px; min-height: calc(100vh - 52px); }

        .portal-sidebar { width: 210px; flex-shrink: 0; background: #fff; border-right: 1px solid rgba(14,27,44,0.07); position: fixed; top: 52px; left: 0; bottom: 32px; overflow-y: auto; overflow-x: hidden; z-index: 80; padding: 12px 8px 16px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.26s ease; transform: translateX(0); }
        .portal-sidebar.hidden-layout { transform: translateX(-210px); }
        .sb-brand { font-size: 12px; font-weight: 700; color: #0E1B2C; padding: 2px 8px 10px; border-bottom: 1px solid rgba(14,27,44,0.06); margin-bottom: 8px; }
        .nav-btn { display: flex; align-items: center; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; margin-bottom: 1px; background: none; border: none; color: #2A364B; font-size: 13px; cursor: pointer; transition: background 0.15s; position: relative; }
        .nav-btn:hover { background: #F3F7FB; }
        .nav-btn.active { background: #EAF1FB; color: #024396; font-weight: 600; }
        .nav-badge { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #dc2626; color: #fff; font-size: 9px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .sb-logout-btn { display: flex; align-items: center; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; background: #FFF5F5; border: 1px solid #FFE3E3; color: #C53030; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: auto; }
        .sb-logout-btn:hover { background: #FFE3E3; }

        .sb-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 79; }
        .portal-main { flex: 1; padding: 20px; min-width: 0; transition: margin-left 0.26s ease; padding-bottom: 48px; }
        .portal-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 32px; background: #024396; display: flex; align-items: center; justify-content: center; z-index: 90; }
        .portal-footer span { color: rgba(255,255,255,0.8); font-size: 11px; }

        .logout-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .logout-modal-box { background: #fff; padding: 20px; border-radius: 10px; width: 320px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .logout-modal-box h3 { margin: 0 0 10px 0; color: #0E1B2C; font-size: 16px; }
        .logout-modal-box p { font-size: 13px; color: #5C677D; margin: 0 0 20px 0; }
        .logout-modal-btns { display: flex; gap: 10px; justify-content: center; }
        .logout-btn-no { background: #E2E8F0; color: #4A5568; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .logout-btn-yes { background: #C53030; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }

        /* ── 💬 FLOATING CHAT RIGID STYLE INJECTIONS ── */
        .chat-floating-trigger { 
          position: fixed !important; 
          bottom: 50px !important; 
          right: 30px !important; 
          width: 56px !important; 
          height: 56px !important; 
          background: linear-gradient(135deg, #024396, #0356c4) !important; 
          color: #fff !important; 
          border: none !important; 
          border-radius: 50% !important; 
          display: flex !important; 
          align-items: center !important; 
          justify-content: center !important; 
          font-size: 26px !important; 
          cursor: pointer !important; 
          box-shadow: 0 4px 20px rgba(2,67,150,0.4) !important; 
          z-index: 999999 !important; 
          transition: transform 0.2s ease !important; 
          outline: none !important; 
        }
        .chat-floating-trigger:hover { transform: scale(1.08) !important; }
        .chat-trigger-badge { position: absolute; top: -2px; right: -2px; background: #dc2626; color: white; font-size: 10px; font-weight: bold; min-width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #fff; }

        .chat-popup-container { 
          position: fixed !important; 
          bottom: 116px !important; 
          right: 30px !important; 
          width: 340px !important; 
          height: 450px !important; 
          background: #fff !important; 
          border: 1px solid rgba(14,27,44,0.15) !important; 
          border-radius: 16px !important; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important; 
          z-index: 999999 !important; 
          display: flex !important; 
          flex-direction: column !important; 
          overflow: hidden !important; 
        }
        .chat-popup-header { background: #0E1B2C; padding: 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .chat-popup-body { flex: 1; overflow-y: auto; padding: 12px; background: #F8FAFC; display: flex; flex-direction: column; gap: 14px; }
        .chat-popup-form { padding: 10px; background: #fff; border-top: 1px solid #E2E8F0; display: flex; gap: 6px; }

        @media (max-width: 768px) {
          .portal-sidebar { transform: translateX(-210px) !important; }
          .portal-sidebar.mobile-open { transform: translateX(0) !important; }
          .chat-popup-container { width: calc(100vw - 32px) !important; right: 16px !important; bottom: 110px !important; height: 400px !important; }
        }
      `}</style>

      <div className="portal-wrapper">
        {showLogoutConfirm && (
          <div className="logout-modal-overlay">
            <div className="logout-modal-box">
              <h3>Confirm Logout</h3>
              <p>Are you sure aap TFD WorkSpace se logout karna chahte hain?</p>
              <div className="logout-modal-btns">
                <button className="logout-btn-no" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                <button className="logout-btn-yes" onClick={() => { setShowLogoutConfirm(false); logout(); }}>Logout</button>
              </div>
            </div>
          </div>
        )}

        <header className="portal-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div>
            <div className="ph-brand">TFD WorkSpace</div>
            <div className="ph-role">
              {isAdmin ? "Admin Control Panel" : "Employee Portal"}
              <span className="ph-empid-text"> | ID: {user?.id || "N/A"}</span>
            </div>
          </div>
          <div className="ph-spacer" />
          
          <button className="translate-trigger-btn" onClick={() => setShowTranslator(!showTranslator)}>
            🔤 Smart Translator
          </button>

          <NotificationBell />
          <div style={{ textAlign: "right" }}>
            <div className="ph-uname">{user?.name}</div>
            <div className="ph-urole">{user?.designation || user?.role}</div>
          </div>
          
          <div ref={dropdownRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button className="ph-avatar-clickable" onClick={() => setProfileMenuOpen(!profileMenuOpen)} title="View Options">
              <div className="ph-avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
            </button>
            {profileMenuOpen && (
              <div className="ph-profile-dropdown">
                <button className="dropdown-item" onClick={() => navigate(profilePath)}>👤 My Profile</button>
                <button className="dropdown-item" onClick={() => navigate(salaryPath)}>💰 Salary</button>
                <button className="dropdown-item" onClick={() => navigate(idCardPath)}>🪪 ID & Visiting Card</button>
              </div>
            )}
          </div>
        </header>

        {/* Translator Container */}
        {showTranslator && (
          <div style={{ position: "fixed", top: 56, right: 140, background: "#fff", border: "1px solid rgba(14,27,44,0.1)", borderRadius: 8, padding: 12, zIndex: 999, width: 290, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0E1B2C" }}>Live API Translator</span>
              <button onClick={() => setShowTranslator(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>×</button>
            </div>
            <textarea 
              placeholder="Yahan message type ya paste karein..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ width: "100%", height: 55, borderRadius: 6, padding: 6, fontSize: 12, border: "1px solid #CBD5E1", outline: "none", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
              <select value={targetMode} onChange={(e) => setTargetMode(e.target.value)} style={{ flex: 1, fontSize: 11, borderRadius: 4, padding: 2, border: "1px solid #CBD5E1", background: "#fff" }}>
                <option value="english">Hinglish se English</option>
                <option value="hinglish">English se Hinglish</option>
              </select>
              <button 
                onClick={handleRealTranslate} 
                disabled={translateLoading}
                style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", fontSize: 11, cursor: "pointer", fontWeight: "600" }}
              >
                {translateLoading ? "Translating..." : "Translate"}
              </button>
            </div>
            {translatedText && (
              <div style={{ background: "#F8FAFC", padding: 6, borderRadius: 6, border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 11, color: "#0E1B2C", margin: 0, lineHeight: "1.3" }}>{translatedText}</p>
                <button onClick={() => { navigator.clipboard.writeText(translatedText); alert("Copied!"); }} style={{ marginTop: 5, background: "#10B981", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>📋 Copy karein</button>
              </div>
            )}
          </div>
        )}

        <div className="portal-body">
          {window.innerWidth <= 768 && sidebarOpen && (
            <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />
          )}
          
          <aside className={`portal-sidebar ${!sidebarOpen ? "hidden-layout" : ""} ${sidebarOpen && window.innerWidth <= 768 ? "mobile-open" : ""}`}>
            <div className="sb-menu-container">
              <div className="sb-brand">TFD WorkSpace</div>
              {items.map((item) => {
                const active = location.pathname === item.path;
                const isChat = item.key === "chat";
                return (
                  <button key={item.key} className={`nav-btn ${active ? "active" : ""}`} onClick={() => navigate(item.path)}>
                    {item.label}
                    {isChat && unreadChat > 0 && <span className="nav-badge">{unreadChat > 9 ? "9+" : unreadChat}</span>}
                  </button>
                );
              })}
            </div>
            
            <button className="sb-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
              🚪 Logout
            </button>
          </aside>

          <main className="portal-main" style={{ marginLeft: sidebarOpen && window.innerWidth > 768 ? "210px" : "0px" }}>
            {children}
          </main>
        </div>

        {/* ── 💬 NEW FLOATING CHAT POPUP WINDOW PANEL ── */}
        {showChatPopup && (
          <div className="chat-popup-container">
            <div className="chat-popup-header">
              <span className="text-white text-xs font-bold">💬 Team Chat Box</span>
              <button onClick={() => setShowChatPopup(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", outline: "none" }}>×</button>
            </div>
            <div className="chat-popup-body">
              {popupMsgs.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="text-[9px] text-[#2A364B]/60 font-semibold mb-0.5 px-0.5">
                      <span>{isMe ? "You" : m.sender_name} | ID: {isMe ? user?.id : m.sender_id} | </span>
                      <span className="text-[#0356c4] uppercase font-bold text-[8px]">{isMe ? (user?.designation || user?.role) : (m.sender_designation || m.sender_role || "Staff")}</span>
                    </div>
                    <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${isMe ? "bg-[#024396] text-white rounded-tr-none" : "bg-[#EFEBE4] text-[#0E1B2C] rounded-tl-none"}`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={popupBottomRef} />
            </div>
            <form onSubmit={sendPopupMessage} className="chat-popup-form">
              <input type="text" value={popupText} onChange={(e) => setPopupText(e.target.value)} placeholder="Type a message..." disabled={popupSending} style={{ flex: 1, fontSize: 12, padding: "6px 10px", background: "#F1F5F9", border: "none", borderRadius: 8, outline: "none", color: "#0E1B2C" }} />
              <button type="submit" disabled={popupSending || !popupText.trim()} style={{ background: "#024396", color: "#fff", border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12, fontWeight: "600" }}>Send</button>
            </form>
          </div>
        )}

        {/* ── 🔘 BOTTOM-RIGHT FLOATING ACTION TRIGGER ICON ── */}
        <button className="chat-floating-trigger" onClick={() => setShowChatPopup(!showChatPopup)}>
          <span>💬</span>
          {unreadChat > 0 && <span className="chat-trigger-badge">{unreadChat}</span>}
        </button>

        <footer className="portal-footer">
          <span>Powered by The Financial Doctor</span>
        </footer>
      </div>
      <InstallPrompt />
    </>
  );
}