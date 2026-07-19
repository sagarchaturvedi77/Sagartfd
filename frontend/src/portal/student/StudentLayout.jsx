import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInternshipAuth } from "./InternshipAuthContext";
import {
  LayoutDashboard, Rocket, PlayCircle, Trophy, Award, UserCircle, LogOut, Lock, LifeBuoy, X, Send,
  Sparkles, Landmark, Megaphone, TrendingUp, Heart, RefreshCw, PenSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useSubmitOnce } from "../../lib/useSubmitOnce";
import NotificationBell from "./NotificationBell";
import NotificationGate from "./NotificationGate";
import ManagerChatBubble from "./ManagerChatBubble";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard Overview", icon: LayoutDashboard, live: true, path: "/portal/student" },
  { key: "missions", label: "Active Missions", icon: Rocket, live: true, path: "/portal/student/missions" },
  { key: "content", label: "Content Studio", icon: PenSquare, live: true, path: "/portal/student/content-studio" },
  { key: "profile", label: "My Profile", icon: UserCircle, live: true, path: "/portal/student/profile" },
  { key: "videos", label: "Video Hub", icon: PlayCircle, live: false },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, live: true, path: "/portal/student/leaderboard" },
  { key: "certificate", label: "Certificate Hub", icon: Award, live: true, path: "/portal/student/certificate" },
];

// The mobile bottom nav has real width constraints (6+ equal-width tabs
// gets cramped on a narrow screen) — drop the still-locked/coming-soon
// Video Hub placeholder there specifically; the desktop sidebar has room
// to keep showing it as a "coming soon" preview.
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.key !== "videos");

function SupportWidget({ open, onClose }) {
  const { token } = useInternshipAuth();
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent requests, same pattern as CallFlowPopup /
  // EmployeeAgreement / EmployeeAttendance.
  const [ask, asking] = useSubmitOnce(async () => {
    if (!message.trim()) return;
    setAnswer("");
    try {
      const res = await fetch(`${API_BASE}/api/internship/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't get an answer right now.");
      setAnswer(data.answer);
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    }
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#0A0F1A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#14E0A0] font-bold text-sm">
            <LifeBuoy size={16} /> Support
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-white/45 text-xs mb-3">Type your question or problem — you'll get an instant answer.</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="e.g. My task got rejected, why? / When does Day 2 start? / How do I change my track?"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#14E0A0]/60 resize-none mb-3"
        />
        <button
          onClick={ask}
          disabled={asking || !message.trim()}
          className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-2.5 rounded-xl transition-colors"
        >
          {asking ? "Thinking..." : "Get Answer"} <Send size={14} />
        </button>

        {answer && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3.5">
            <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const DEMO_TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

const GUIDE_STEPS = [
  { title: "1. Dashboard Overview", body: "The first screen after login. Shows program progress (Day X of 45), payment status, and quick links to Missions, Report, and Certificate Hub." },
  { title: "2. Active Missions", body: "Weekly tasks, grouped by week. Tap any task to open its full detail — what to do, why it matters, how to submit, and why it might get rejected. Type an answer (and take a live photo for field tasks), then tap Confirm Submit — it's auto-verified by AI instantly, no waiting." },
  { title: "3. Save Draft", body: "Inside a task, you don't have to finish the answer in one go — type some, tap Save Draft, come back later and the text is still there." },
  { title: "4. Weekly Quiz", body: "After a week's tasks, a quiz unlocks. Passing it (80%+) unlocks the next week — this is the drip-lock system." },
  { title: "5. Leaderboard", body: "Shows ranking by points earned (approved tasks + quizzes passed) and a 5-category skill radar chart." },
  { title: "6. My Profile & ID Card", body: "Student uploads a photo, sets DOB, and can view/download their official Intern ID Card with a QR code." },
  { title: "7. My Internship Report", body: "A daily log — 'what did I learn today, what did I do today.' Builds into the student's final report automatically." },
  { title: "8. Certificate Hub", body: "Shows live progress toward the 75% score needed to graduate. Use the Instant Graduate button below to skip straight to the fully-graduated state — certificate, internship letter, and internship report all unlock together there, downloadable as PDFs." },
];

function DemoGuideWidget({ open, onClose }) {
  const { student, token, refreshMe } = useInternshipAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(null);

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent requests, same pattern as CallFlowPopup /
  // EmployeeAgreement / EmployeeAttendance. switchTrack keeps its own
  // `switching` state (which track is mid-switch) for the per-button label,
  // rather than the hook's single isSubmitting flag.
  const [switchTrack] = useSubmitOnce(async (track) => {
    if (track === student?.track) return;
    setSwitching(track);
    try {
      const res = await fetch(`${API_BASE}/api/internship/track`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ track }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not switch track");
      toast.success(`Switched to ${track} — reloading with fresh tasks...`);
      await refreshMe();
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err.message);
      setSwitching(null);
    }
  });

  const [advanceDays, advancing] = useSubmitOnce(async (days) => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/demo/advance?days=${days}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not advance");
      toast.success(`Jumped forward ${days} day${days > 1 ? "s" : ""} — reloading...`);
      await refreshMe();
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err.message);
    }
  });

  const [graduateNow, graduating] = useSubmitOnce(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/demo/graduate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not graduate");
      toast.success("Graduated! Opening Certificate Hub...");
      await refreshMe();
      onClose();
      navigate("/portal/student/certificate");
    } catch (err) {
      toast.error(err.message);
    }
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#0A0F1A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#14E0A0] font-bold text-sm">
            <Sparkles size={16} /> Demo Guide
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <div className="mb-5">
          <p className="text-white/70 text-xs font-semibold mb-2 flex items-center gap-1.5">
            <RefreshCw size={12} /> Switch Track — show any of the 4 tracks
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_TRACKS.map((t) => (
              <button
                key={t.value}
                onClick={() => switchTrack(t.value)}
                disabled={!!switching}
                className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${
                  student?.track === t.value
                    ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]"
                    : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"
                }`}
              >
                <t.icon size={14} className="shrink-0" /> {switching === t.value ? "Switching..." : t.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/50 mt-1.5">Switching resets this demo's tasks/quizzes to a fresh state for the new track.</p>
        </div>

        <div className="mb-5">
          <p className="text-white/70 text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Rocket size={12} /> Jump Ahead — see later weeks without waiting
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => advanceDays(1)}
              disabled={advancing}
              className="px-2 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/10 text-white/70 hover:border-white/25 disabled:opacity-50"
            >
              +1 Day
            </button>
            <button
              onClick={() => advanceDays(7)}
              disabled={advancing}
              className="px-2 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/10 text-white/70 hover:border-white/25 disabled:opacity-50"
            >
              +7 Days
            </button>
            <button
              onClick={() => advanceDays(45)}
              disabled={advancing}
              className="px-2 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/10 text-white/70 hover:border-white/25 disabled:opacity-50"
            >
              Final Day
            </button>
          </div>
          <p className="text-[10px] text-white/50 mt-1.5">All weeks unlock automatically here — no quiz needed to see the next week's tasks (real accounts still need to pass each quiz).</p>
        </div>

        <div className="mb-5">
          <button
            onClick={graduateNow}
            disabled={graduating || student?.status === "graduated"}
            className="w-full flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-[#050B16] font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            <Award size={15} /> {graduating ? "Generating..." : student?.status === "graduated" ? "Already Graduated This Session" : "Instant Graduate — Show Certificate"}
          </button>
          <p className="text-[10px] text-white/50 mt-1.5 text-center">Skips the score/duration requirement entirely — for demo purposes only.</p>
        </div>

        <p className="text-white/70 text-xs font-semibold mb-2">Walkthrough — what to show, in order</p>
        <div className="space-y-3">
          {GUIDE_STEPS.map((s) => (
            <div key={s.title} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-[#14E0A0] text-xs font-bold mb-0.5">{s.title}</p>
              <p className="text-white/60 text-xs leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/45 mt-4 text-center">
          This account resets to a clean Day-1 state every time anyone logs in — nothing you do here is ever permanent.
        </p>
      </div>
    </div>
  );
}

// Deliberately NOT PortalLayout — an immersive, game-like shell for the
// student-facing program, distinct from the internal staff CRM look.
export default function StudentLayout({ activeKey = "overview", children }) {
  const { student, token, logout } = useInternshipAuth();
  const navigate = useNavigate();
  const [supportOpen, setSupportOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Powers the little "something needs attention" badge on the Missions
  // nav item — never-submitted or rejected-and-waiting tasks for the
  // current week. Polled, not just loaded once, so finishing a task
  // clears the badge without needing a full page reload.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const loadPending = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/internship/tasks/pending-count`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setPendingCount(json.pending || 0);
      } catch { /* silent — non-critical polling */ }
    };
    loadPending();
    const id = setInterval(loadPending, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  return (
    <NotificationGate>
    <div className="min-h-screen bg-[#050B16] text-white flex">
      <aside className="hidden md:flex flex-col w-[230px] shrink-0 border-r border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-7 w-auto object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">TFD Internship</div>
            <div className="text-[9px] text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => item.live && navigate(item.path)}
                disabled={!item.live}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#14E0A0]/15 text-[#14E0A0]"
                    : item.live
                    ? "text-white/60 hover:bg-white/5 hover:text-white cursor-pointer"
                    : "text-white/25 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} /> {item.label}
                </span>
                {item.key === "missions" && pendingCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#C7102E] text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
                {!item.live && <Lock size={12} />}
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => setSupportOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#14E0A0]/90 hover:bg-[#14E0A0]/10 transition-colors mb-1"
        >
          <LifeBuoy size={16} /> Support
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex flex-row items-center justify-between gap-2 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 min-w-0 md:hidden">
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-6 w-auto object-contain shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-xs font-bold text-white truncate">TFD Internship</div>
              <div className="text-[8px] text-[#14E0A0] font-semibold truncate">Learn. Build. Launch.</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-white/50 min-w-0">
            <span className="truncate">Welcome back, <span className="text-white font-semibold">{student?.name || "Intern"}</span></span>
            {student?.is_demo && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">Demo Mode</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {student?.is_demo && (
              <button
                onClick={() => setGuideOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 sm:px-3 py-1.5 hover:bg-amber-400/15 transition-colors shrink-0"
              >
                <Sparkles size={13} /> <span className="hidden sm:inline">Demo Guide</span>
              </button>
            )}
            <NotificationBell />
            <button
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#14E0A0] bg-[#14E0A0]/10 border border-[#14E0A0]/25 rounded-full px-2.5 sm:px-3 py-1.5 hover:bg-[#14E0A0]/15 transition-colors shrink-0"
            >
              <LifeBuoy size={13} /> <span className="hidden sm:inline">Support</span>
            </button>
            {/* Text-only credit, not the old logo-in-a-white-box image — that
                fixed-size white graphic was what broke the responsive layout
                (crowded this same row on tablet/mobile widths, forcing
                overlap/clipping). Plain text scales with the wrapper instead
                of fighting it. */}
            <span className="hidden lg:inline text-[10px] text-white/30 whitespace-nowrap shrink-0">Powered by The Financial Doctor</span>
            <button onClick={logout} className="md:hidden text-red-400/80 shrink-0"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile bottom nav — the desktop sidebar (above) is hidden below
          the md breakpoint, so every nav item needs an equivalent here or
          mobile users have no way to move between sections at all. */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0F1A] border-t border-white/10 flex items-stretch shadow-[0_-4px_16px_rgba(0,0,0,0.35)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => item.live && navigate(item.path)}
              disabled={!item.live}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[9px] font-medium relative ${
                active ? "text-[#14E0A0]" : item.live ? "text-white/50" : "text-white/20"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span className="leading-tight text-center px-0.5">{item.label.split(" ")[0]}</span>
              {!item.live && <Lock size={8} className="absolute top-1.5 right-[18%]" />}
              {item.key === "missions" && pendingCount > 0 && (
                <span className="absolute top-1 right-[22%] min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#C7102E] text-white text-[8px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <SupportWidget open={supportOpen} onClose={() => setSupportOpen(false)} />
      {student?.is_demo && <DemoGuideWidget open={guideOpen} onClose={() => setGuideOpen(false)} />}
      <ManagerChatBubble />
    </div>
    </NotificationGate>
  );
}
