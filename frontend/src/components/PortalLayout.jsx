import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import usePortalTheme from "../hooks/usePortalTheme";
import NotificationBell from "./NotificationBell";
import InstallPrompt from "./InstallPrompt";
import NotificationGate from "./NotificationGate";
import BirthdayBanner from "./portal/BirthdayBanner";
import { registerServiceWorker, enablePush } from "../portal/push";
import useIsMobile from "../hooks/useIsMobile";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import PortalModal from "./portal/PortalModal";
import { Button } from "./ui/button";
import {
  LayoutDashboard, Clock, Users, Briefcase, GitBranch, Landmark, BarChart3,
  FolderOpen, Palmtree, KeyRound, Megaphone, Globe, Settings, Calculator,
  UserCircle, LogOut, Menu, Languages, MessageCircle, Sun, Moon, MoreHorizontal,
  Wallet, IdCard, Download, Smartphone, X, Send, HardDrive, GraduationCap, Receipt, FileText, Search,
} from "lucide-react";

// Salary, ID Card and Team Chat are intentionally not top-level sidebar items —
// Salary/ID Card live in the profile dropdown (see the avatar menu below) and
// Team Chat is always reachable via the floating chat FAB. Targets absorbed
// Tasks as a tab (see AdminTargets.jsx / EmployeeTargets.jsx) and is surfaced
// from the Dashboard instead of its own sidebar entry.
const adminItems = [
  { key: "dashboard",  label: "Dashboard",         path: "/portal/admin", icon: LayoutDashboard },
  { key: "attendance", label: "Attendance",        path: "/portal/admin/attendance", icon: Clock },
  { key: "leads",      label: "Leads",             path: "/portal/admin/leads", icon: Users },
  { key: "calculators", label: "Calculators",      path: "/portal/admin/calculators", icon: Calculator },
  { key: "services",   label: "Services",          path: "/portal/admin/services", icon: Briefcase },
  { key: "pipelines",  label: "Pipelines",         path: "/portal/admin/pipelines", icon: GitBranch },
  { key: "accounts",   label: "Accounts",          path: "/portal/admin/accounts", icon: Landmark },
  { key: "reports",    label: "Reports",           path: "/portal/admin/reports", icon: BarChart3 },
  { key: "documents",  label: "Documents",         path: "/portal/admin/documents", icon: FolderOpen },
  { key: "leaves",     label: "Leave Requests",    path: "/portal/admin/leaves", icon: Palmtree },
  { key: "certificates", label: "Certificates",     path: "/portal/admin/certificates", icon: GraduationCap },
  { key: "letterheads", label: "Blank Letterhead",  path: "/portal/admin/letterheads", icon: FileText },
  { key: "invoices",   label: "Billing / Invoices", path: "/portal/admin/invoices", icon: Receipt },
  { key: "document-search", label: "Document Search", path: "/portal/admin/document-search", icon: Search },
  { key: "access",     label: "Access Control",    path: "/portal/admin/access", icon: KeyRound },
  { key: "announce",   label: "Announcements",     path: "/portal/admin/announce", icon: Megaphone },
  { key: "website",    label: "Website / Content", path: "/portal/admin/website", icon: Globe },
  { key: "storage",    label: "Storage Status",    path: "/portal/admin/storage", icon: HardDrive },
  { key: "settings",   label: "Settings",          path: "/portal/admin/settings", icon: Settings },
];

const employeeItems = [
  { key: "dashboard",   label: "Dashboard",    path: "/portal/employee", icon: LayoutDashboard },
  { key: "attendance",  label: "Attendance",   path: "/portal/employee/attendance", icon: Clock },
  { key: "leads",       label: "My Leads",     path: "/portal/employee/leads", icon: Users },
  { key: "calculators", label: "Calculators",  path: "/portal/employee/calculators", icon: Calculator },
  { key: "leaves",      label: "My Leaves",    path: "/portal/employee/leaves", icon: Palmtree },
  { key: "achievements", label: "Achievements", path: "/portal/employee/achievements", icon: GraduationCap },
  { key: "profile",     label: "My Profile",   path: "/portal/employee/profile", icon: UserCircle },
  { key: "settings",    label: "Settings",     path: "/portal/employee/settings", icon: Settings },
];

// The 4 highest-traffic items per role, surfaced in the mobile bottom tab
// bar (banking-app pattern); everything else lives behind "More". The
// single most-used action (Leads — the core daily workflow for both
// roles) sits in the center slot, the position users reach for most.
const MOBILE_PRIMARY_KEYS = {
  admin: ["dashboard", "attendance", "leads", "reports"],
  employee: ["dashboard", "attendance", "leads", "calculators"],
};

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 5000;

export default function PortalLayout({ children }) {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  usePortalTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminItems : employeeItems;
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem("chat_last_seen") || "");
  const [showTranslator, setShowTranslator] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetMode, setTargetMode] = useState("english");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [popupMsgs, setPopupMsgs] = useState([]);
  const [popupText, setPopupText] = useState("");
  const [popupSending, setPopupSending] = useState(false);
  const popupBottomRef = useRef(null);

  useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      enablePush().then((r) => console.log("[push] enablePush result:", r));
    }
  }, []);

  // Close sidebar on mobile route change
  useEffect(() => {
    if (isMobile) { setSidebarOpen(false); setMoreOpen(false); }
  }, [location.pathname, isMobile]);

  // Mark chat as seen when on chat page
  useEffect(() => {
    if (location.pathname.includes("/chat")) {
      const now = new Date().toISOString();
      localStorage.setItem("chat_last_seen", now);
      setLastSeen(now);
      setUnreadChat(0);
    }
  }, [location.pathname]);

  // Mark chat as seen when the floating popup is opened (the primary way
  // most users read Team Chat, per the FAB comment above)
  useEffect(() => {
    if (showChatPopup) {
      const now = new Date().toISOString();
      localStorage.setItem("chat_last_seen", now);
      setLastSeen(now);
      setUnreadChat(0);
    }
  }, [showChatPopup]);

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

  const profilePath = isAdmin ? "/portal/admin/profile" : "/portal/employee/profile";
  const salaryPath = isAdmin ? "/portal/admin/salary" : "/portal/employee/salary";
  const idCardPath = "/portal/employee/id-card";
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  const primaryKeys = MOBILE_PRIMARY_KEYS[isAdmin ? "admin" : "employee"];
  const primaryItems = primaryKeys.map((k) => items.find((i) => i.key === k)).filter(Boolean);

  const SidebarNav = ({ onNavigate }) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="text-xs font-bold text-[#0E1B2C] dark:text-[#F1EDE3] px-2 pb-2.5 mb-2 border-b border-[#0E1B2C]/[0.06] dark:border-white/10">TFD WorkSpace</div>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { navigate(item.path); onNavigate?.(); }}
                className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                  active
                    ? "bg-[#EAF1FB] dark:bg-white/10 text-[#024396] dark:text-[#7CB0FF] font-semibold"
                    : "text-[#2A364B] dark:text-[#C7CEDA] hover:bg-[#F3F7FB] dark:hover:bg-white/5"
                }`}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Download App — only in browser, not in PWA/native */}
      {!isStandalone && (
        <div className="pt-2 mt-2 border-t border-[#E2D8C2] dark:border-white/10 space-y-1.5">
          <a
            href="/TFD-Workspace.apk"
            download
            className="flex items-center justify-center gap-1.5 text-center px-3 py-2 rounded-lg text-[11px] font-semibold bg-[#024396] text-white hover:bg-[#023580] transition-colors"
          >
            <Download size={13} /> Download APK
          </a>
          <button
            onClick={() => { if (window.deferredPrompt) window.deferredPrompt.prompt(); else alert("Use browser menu > Add to Home Screen"); }}
            className="flex items-center justify-center gap-1.5 w-full text-center px-3 py-2 rounded-lg text-[11px] font-semibold bg-[#0E1B2C] text-white hover:bg-[#0E1B2C]/90 transition-colors"
          >
            <Smartphone size={13} /> Install Web App
          </button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setShowLogoutConfirm(true)}
        className="mt-2 w-full justify-start gap-1.5 border-[#FFE3E3] bg-[#FFF5F5] text-[#C53030] hover:bg-[#FFE3E3] hover:text-[#C53030] text-[13px] font-semibold dark:border-red-900/40 dark:bg-red-950/30 dark:hover:bg-red-950/50"
      >
        <LogOut size={15} /> Logout
      </Button>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#F5F1EB] dark:bg-[#0B1420] flex flex-col transition-colors">

        {/* Logout confirm */}
        <PortalModal
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          title="Confirm Logout"
          maxWidth="max-w-xs"
        >
          <p className="text-sm text-[#5C677D] dark:text-[#8E99AC] -mt-2">Are you sure you want to logout from TFD WorkSpace?</p>
          <div className="flex gap-2.5 mt-1">
            <Button variant="secondary" className="flex-1 bg-[#F5F1EB] text-[#2A364B] hover:bg-[#E2D8C2]" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => { setShowLogoutConfirm(false); logout(); }}>Logout</Button>
          </div>
        </PortalModal>

        {/* More menu (mobile bottom-tab overflow) */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-3 pb-6 bg-white dark:bg-[#101D2E] max-h-[75vh] overflow-y-auto">
            <SheetTitle className="text-sm font-bold text-[#0E1B2C] dark:text-[#F1EDE3] px-1 pb-2">More</SheetTitle>
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.key}
                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-[11px] font-medium ${
                      active ? "bg-[#EAF1FB] dark:bg-white/10 text-[#024396] dark:text-[#7CB0FF]" : "text-[#2A364B] dark:text-[#C7CEDA] hover:bg-[#F3F7FB] dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                    <span className="text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Header — birthday gradient replaces the flat navy on the user's birthday, no extra vertical space needed */}
        <header className={`fixed top-0 inset-x-0 h-[52px] flex items-center px-3.5 gap-2.5 z-[100] shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${user?.is_birthday_today ? "bg-gradient-to-r from-[#C7102E] via-[#024396] to-[#C7102E]" : "bg-[#0E1B2C]"}`}>
          {!isMobile && (
            <button className="text-white p-1 -ml-1" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
              <Menu size={20} />
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-white whitespace-nowrap">TFD WorkSpace</div>
            <div className="text-[10px] text-white/40">{isAdmin ? "Admin Control Panel" : "Employee Portal"}</div>
          </div>
          <div className="flex-1" />

          <button
            className="bg-white/10 text-white border border-white/20 rounded-md px-2.5 py-1 text-xs hover:bg-white/20 transition-colors whitespace-nowrap flex items-center gap-1.5"
            onClick={() => setShowTranslator(v => !v)}
          >
            <Languages size={13} /> <span className="hidden sm:inline">Translate</span>
          </button>

          <NotificationBell />

          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-semibold text-white">{user?.name}</div>
            <div className="text-[10px] text-white/40">{user?.designation || user?.role}</div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] text-white font-bold text-[13px] flex items-center justify-center shrink-0">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(profilePath)}><UserCircle size={15} className="mr-2" /> My Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(salaryPath)}><Wallet size={15} className="mr-2" /> Salary</DropdownMenuItem>
              {!isAdmin && <DropdownMenuItem onClick={() => navigate(idCardPath)}><IdCard size={15} className="mr-2" /> ID Card</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => navigate(isAdmin ? "/portal/admin/settings" : "/portal/employee/settings")}><Settings size={15} className="mr-2" /> Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={15} className="mr-2" /> : <Moon size={15} className="mr-2" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowLogoutConfirm(true)}><LogOut size={15} className="mr-2" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Translator Panel */}
        {showTranslator && (
          <div className="fixed top-[58px] right-3.5 bg-white dark:bg-[#101D2E] border border-[#0E1B2C]/10 dark:border-white/10 rounded-xl p-3.5 z-[500] w-[300px] shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[13px] font-bold text-[#0E1B2C] dark:text-[#F1EDE3] flex items-center gap-1.5"><Languages size={14} /> Smart Translator</span>
              <button onClick={() => setShowTranslator(false)} className="text-lg text-[#5C677D] dark:text-[#8E99AC] leading-none">×</button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message here..."
              rows={3}
              className="w-full border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg px-2.5 py-2 text-xs outline-none resize-none mb-2 focus:border-[#024396]"
            />
            <div className="flex gap-1.5 mb-2">
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value)}
                className="flex-1 border border-[#E2D8C2] dark:border-white/10 dark:bg-white/5 dark:text-[#F1EDE3] rounded-md px-2 py-1 text-xs outline-none"
              >
                <option value="english">Hindi → English</option>
                <option value="hinglish">English → Hindi</option>
              </select>
              <Button size="sm" onClick={handleTranslate} disabled={translateLoading} className="text-xs">
                {translateLoading ? "..." : "Translate"}
              </Button>
            </div>
            {translatedText && (
              <div className="bg-[#F5F1EB] dark:bg-white/5 rounded-lg px-2.5 py-2">
                <p className="text-xs text-[#0E1B2C] dark:text-[#F1EDE3] mb-1.5">{translatedText}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(translatedText)}
                  className="bg-[#024396] text-white rounded px-2.5 py-1 text-[11px]"
                >
                  📋 Copy
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-1 pt-[52px] min-h-[calc(100vh-84px)] ${isMobile ? "pb-16" : ""}`}>
          {/* Desktop sidebar — permanent push panel */}
          {!isMobile && (
            <aside
              className={`fixed top-[52px] left-0 bottom-8 w-[210px] bg-white dark:bg-[#101D2E] border-r border-[#0E1B2C]/[0.07] dark:border-white/10 overflow-y-auto z-[80] p-2.5 pb-4 transition-transform duration-200 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <SidebarNav />
            </aside>
          )}

          {/* Main content */}
          <main
            className="flex-1 min-w-0 p-3.5 md:p-5 pb-12 transition-[margin] duration-200"
            style={{ marginLeft: !isMobile && sidebarOpen ? "210px" : "0px" }}
          >
            {children}
          </main>
        </div>

        {/* Mobile bottom tab bar — banking-app style primary nav */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-[#101D2E] border-t border-[#E2D8C2] dark:border-white/10 z-[95] flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                    active ? "text-[#024396] dark:text-[#7CB0FF]" : "text-[#2A364B]/60 dark:text-[#8E99AC]"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[#2A364B]/60 dark:text-[#8E99AC]"
            >
              <MoreHorizontal size={20} strokeWidth={1.8} />
              More
            </button>
          </nav>
        )}

        {/* Floating Chat FAB — hidden on the full Team Chat page itself (redundant there, and it overlapped the page's own Send button) */}
        {!location.pathname.includes("/chat") && (
        <button
          className={`fixed right-5 w-[52px] h-[52px] bg-gradient-to-br from-[#024396] to-[#0356c4] text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(2,67,150,0.4)] hover:scale-105 transition-transform z-[500] ${isMobile ? "bottom-[76px]" : "bottom-[50px]"}`}
          onClick={() => setShowChatPopup(v => !v)}
          title="Team Chat"
        >
          <MessageCircle size={22} />
          {unreadChat > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-bold min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1 border-2 border-white">
              {unreadChat > 9 ? "9+" : unreadChat}
            </span>
          )}
        </button>
        )}

        {/* Chat Popup */}
        {showChatPopup && !location.pathname.includes("/chat") && (
          <div className={`fixed right-3 w-[calc(100vw-24px)] md:w-80 h-[420px] bg-white dark:bg-[#101D2E] border border-[#0E1B2C]/[0.12] dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] z-[500] flex flex-col overflow-hidden ${isMobile ? "bottom-[138px]" : "bottom-[112px]"}`}>
            <div className="bg-[#0E1B2C] px-3.5 py-3 flex items-center justify-between shrink-0">
              <span className="text-white font-bold text-[13px] flex items-center gap-1.5"><MessageCircle size={14} /> Team Chat</span>
              <button className="text-white" onClick={() => setShowChatPopup(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2.5 bg-[#F8FAFC] dark:bg-[#0B1420] flex flex-col gap-2">
              {popupMsgs.length === 0 && <p className="text-center text-xs text-[#9AA5B4] pt-5">No messages yet</p>}
              {popupMsgs.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && <span className="text-[10px] text-[#5C677D] dark:text-[#8E99AC] font-semibold mb-0.5 pl-0.5">{m.sender_name}</span>}
                    <div
                      className={`max-w-[82%] rounded-xl px-2.5 py-1.5 text-xs shadow-sm ${
                        isMe ? "bg-[#024396] text-white rounded-tr-[3px]" : "bg-white dark:bg-[#101D2E] text-[#0E1B2C] dark:text-[#F1EDE3] rounded-tl-[3px]"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-[#9AA5B4] mt-0.5 pr-0.5">
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
              <div ref={popupBottomRef} />
            </div>
            <form onSubmit={sendPopupMessage} className="px-2.5 py-2 bg-white dark:bg-[#101D2E] border-t border-slate-200 dark:border-white/10 flex gap-1.5 shrink-0">
              <input
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#F5F1EB] dark:bg-white/5 dark:text-[#F1EDE3] rounded-lg outline-none text-[#0E1B2C]"
                value={popupText}
                onChange={(e) => setPopupText(e.target.value)}
                placeholder="Type a message..."
                disabled={popupSending}
              />
              <button type="submit" className="bg-[#024396] text-white rounded-lg px-3.5 flex items-center justify-center disabled:opacity-50" disabled={popupSending || !popupText.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Footer — desktop only; mobile uses the bottom tab bar instead */}
        {!isMobile && (
          <footer className="fixed bottom-0 inset-x-0 h-8 bg-[#024396] flex items-center justify-center z-[90]">
            <span className="text-white/85 text-[11px] font-medium">Powered by The Financial Doctor</span>
          </footer>
        )}

      </div>
      <InstallPrompt />
      <NotificationGate />
      <BirthdayBanner />
    </>
  );
}
