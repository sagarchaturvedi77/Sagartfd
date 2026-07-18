import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import {
  ArrowLeft, ArrowUpRight, ShieldCheck, MapPinned, FileCheck2,
  TrendingUp, Landmark, Megaphone, Heart, Star, Users2,
  ClipboardCheck, GraduationCap, BadgeCheck, Sparkles, Briefcase, Smartphone,
  MessageSquare, Calculator, HandCoins, PenTool, Mic2, Puzzle,
  FileText, ThumbsUp, Network, Video, LayoutDashboard, Rocket,
  Trophy, Award, QrCode, CheckCircle2, Flame, Target,
} from "lucide-react";

const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

// Floating labels for the background network — our own tracks/program
// values, not generic buzzwords.
const NETWORK_KEYWORDS = [
  "FINANCE", "HR", "MARKETING", "SALES", "INDIA'S BEST INTERNSHIP", "VERIFIED", "REAL WORK", "GROWTH",
  "TRUSTED", "SAFE", "SECURE", "INDIAN", "BEST", "GENUINE", "STUDENT-FIRST",
  "NO COPY-PASTE", "GPS VERIFIED", "QR CERTIFICATE", "REAL TASKS", "WEEKLY QUIZZES",
  "SKILL RADAR", "LEADERBOARD", "MENTORSHIP", "RECOMMENDATION LETTER", "CORPORATE EXPOSURE",
  "INSTANT FEEDBACK", "90 DAYS",
];

// A drifting particle network (spiderweb effect), viewport-anchored so the
// same ~65 particles stay dense wherever you scroll — rendered via a portal
// straight into document.body so it's completely outside InternshipLandingPage's
// own DOM subtree. That matters because this page's root wrapper has both
// `overflow-x-hidden` and `position:relative`, and a position:relative +
// overflow-hidden ancestor clips `position:fixed` descendants in every major
// browser (a well-known CSS gotcha) — escaping to body via a portal sidesteps
// it entirely rather than fighting it with different positioning schemes.
function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, animationFrame;
    let particles = [];
    let labels = [];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
      }
      step() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
    }
    class Label {
      constructor() {
        this.text = NETWORK_KEYWORDS[Math.floor(Math.random() * NETWORK_KEYWORDS.length)];
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = (Math.random() - 0.5) * 0.15;
        this.opacity = Math.random() * 0.1 + 0.22;
        this.size = Math.floor(Math.random() * 6) + 15;
      }
      step() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
    }

    function resize() {
      // Fixed-position + portal to body = the canvas's CSS box is always
      // exactly the viewport, so the backing store should match that, not
      // the (much taller) scrolled document.
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    function init() {
      resize();
      particles = Array.from({ length: 65 }, () => new Particle());
      labels = Array.from({ length: 15 }, () => new Label());
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const l of labels) {
        l.step();
        ctx.fillStyle = `rgba(20, 224, 160, ${l.opacity})`;
        ctx.font = `bold ${l.size}px monospace`;
        ctx.fillText(l.text, l.x, l.y);
      }
      const maxDist = 150;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            // Dynamic opacity — lines fade out as the two particles drift apart.
            ctx.strokeStyle = `rgba(20, 224, 160, ${(1 - dist / maxDist) * 0.6})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        p.step();
        ctx.fillStyle = "rgba(20, 224, 160, 0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      animationFrame = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#061626] to-[#020b14]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.38]" />
      <div className="absolute top-1/4 left-[10%] w-80 h-80 sm:w-96 sm:h-96 bg-[#14E0A0]/10 rounded-full blur-[110px] animate-pulse" />
      <div className="absolute bottom-1/4 right-[8%] w-[420px] h-[420px] bg-[#024396]/25 rounded-full blur-[130px] animate-float-slow" />
    </div>,
    document.body
  );
}

const STATS = [
  { value: "90", label: "Day Program" },
  { value: "4", label: "Career Tracks" },
  { value: "100%", label: "Verified, Not Just Printed" },
  { value: "0", label: "Chances to Fake It" },
];

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "No ChatGPT Copy-Paste Allowed",
    text: "Every submission is typed live in our anti-cheat workspace — no pasting, no shortcuts. What you submit is genuinely yours.",
  },
  {
    icon: MapPinned,
    title: "100% Geotagged Fieldwork Verification",
    text: "Field tasks are submitted with live camera capture, GPS location, and a timestamp — real work, verifiably done.",
  },
  {
    icon: FileCheck2,
    title: "Corporate-Ready Resume via Public Audit Trails",
    text: "A verifiable certificate with a public QR audit trail — employers can confirm your work is real, not just claimed.",
  },
];

const HOW_WE_WORK = [
  { icon: ClipboardCheck, title: "Apply & Secure Your Slot", text: "Sign up, pick your track, and reserve your seat for the next 90-day batch." },
  { icon: Users2, title: "Get Matched With Real Work", text: "Every intern gets their own set of practical, domain-specific tasks — no two journeys are identical." },
  { icon: GraduationCap, title: "Learn, Execute, Get Evaluated", text: "Short practical lessons, real fieldwork, and weekly quizzes keep you progressing day by day." },
  { icon: BadgeCheck, title: "Graduate With a Verified Certificate", text: "Finish your program and receive a certificate with a public QR audit trail employers can verify instantly." },
  { icon: Video, title: "Share a Video Review at the End", text: "Near the end of your internship, share a short review video of your experience — small clips from wherever you were working are welcome. Just a link, no big upload." },
];

const WHY_JOIN = [
  { icon: Briefcase, title: "Real Corporate Exposure", text: "Work on genuine client-facing and field tasks, not busywork — the kind of experience that actually shows up on a resume." },
  { icon: ClipboardCheck, title: "Instant, Automatic Feedback", text: "Every task is auto-verified the moment you submit — no waiting days for a reviewer to get back to you." },
  { icon: Star, title: "Mentorship That Matters", text: "Guidance from people who actually work in mutual funds, insurance, marketing, and finance — not generic course content." },
  { icon: Sparkles, title: "A Certificate Employers Trust", text: "Publicly verifiable via QR — no more \"is this internship even real?\" doubts from recruiters." },
];

const TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

// One program length now (90 days, ₹5,000) — kept as an array since the
// pricing card below still maps over it.
const DURATIONS = [
  { days: 90, price: 5000, tagline: "Guided fundamentals, independent execution, and a real capstone project — the full arc, not a shortened preview.", popular: true },
];

const SKILLS = [
  { icon: MessageSquare, label: "Professional Communication" },
  { icon: Calculator, label: "Financial & Market Literacy" },
  { icon: HandCoins, label: "Sales & Client Handling" },
  { icon: Users2, label: "Team Coordination" },
  { icon: PenTool, label: "MS Excel & Reporting" },
  { icon: Mic2, label: "Public Speaking & Pitching" },
  { icon: Puzzle, label: "Real-World Problem Solving" },
  { icon: FileText, label: "Business Email Writing" },
];

const GROWTH_BENEFITS = [
  { icon: FileText, title: "A Resume That Actually Stands Out", text: "Not \"attended internship\" — a verifiable record of real tasks completed, gradeable and QR-checkable by any recruiter or college placement cell." },
  { icon: ThumbsUp, title: "Letter of Recommendation", text: "Consistently strong performers can earn a personal recommendation letter — genuinely useful for higher studies or your first job application." },
  { icon: Briefcase, title: "A Shot at Working With TFD", text: "Standout interns are considered first when we hire for Sales, Marketing, HR, or Finance roles at The Financial Doctor." },
  { icon: Network, title: "A Professional Network, Early", text: "Direct interaction with working professionals and mentors — the kind of network most students only start building after college." },
];

const TIMELINE_MARKERS = [
  { day: 1, label: "Onboarding & Track Selection" },
  { day: 30, label: "Phase 1 Complete: Guided Fundamentals" },
  { day: 60, label: "Phase 2 Complete: Independent Execution" },
  { day: 90, label: "Capstone Project, Graduation & Certificate" },
];

const MOBILE_SCREENS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "missions", label: "Missions", icon: Rocket },
  { key: "leaderboard", label: "Radar", icon: Trophy },
  { key: "certificate", label: "Certificate", icon: Award },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

function Section({ children, className = "" }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`px-5 py-14 border-t border-white/5 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function TrackVisual({ track }) {
  if (track === "hr") {
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Employee Onboarding Tracker</p>
          <span className="text-[9px] text-[#14E0A0] font-semibold">Excel</span>
        </div>
        {[["Riya Sharma", "12 Jul"], ["Aman Verma", "13 Jul"], ["Neha Gupta", "14 Jul"]].map(([n, d]) => (
          <div key={n} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[10px] text-white/70">{n}</span>
            <span className="text-[9px] text-white/35">{d}</span>
            <span className="text-[9px] font-semibold text-[#14E0A0] bg-[#14E0A0]/10 rounded-full px-2 py-0.5">Onboarded</span>
          </div>
        ))}
      </div>
    );
  }
  if (track === "marketing") {
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide mb-2.5">Weekly Content Calendar</p>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
            <div key={d} className={`rounded-lg py-2 text-center text-[9px] font-semibold ${i === 2 ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/5 text-white/45"}`}>{d}</div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[9px] text-white/45">
          <span className="flex items-center gap-1"><Star size={10} className="text-[#14E0A0]" /> 1.2k reach</span>
          <span className="flex items-center gap-1"><ThumbsUp size={10} className="text-[#14E0A0]" /> 96 likes</span>
        </div>
      </div>
    );
  }
  if (track === "sales") {
    const stages = [["Leads", 120, 100], ["Contacted", 78, 65], ["Converted", 24, 20]];
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide mb-3">Client Pipeline Funnel</p>
        <div className="space-y-2.5">
          {stages.map(([label, val, pct]) => (
            <div key={label}>
              <div className="flex justify-between text-[9px] text-white/50 mb-1"><span>{label}</span><span className="text-white/70 font-semibold">{val}</span></div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" style={{ width: `${pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wide mb-2.5">Balance Sheet Snapshot</p>
      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <p className="text-white/40 mb-1.5">Assets</p>
          {[["Cash", "1,20,000"], ["Investments", "3,40,000"]].map(([l, v]) => (
            <div key={l} className="flex justify-between text-white/65 py-0.5"><span>{l}</span><span>₹{v}</span></div>
          ))}
        </div>
        <div>
          <p className="text-white/40 mb-1.5">Liabilities</p>
          {[["Loans", "80,000"], ["Payables", "40,000"]].map(([l, v]) => (
            <div key={l} className="flex justify-between text-white/65 py-0.5"><span>{l}</span><span>₹{v}</span></div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] font-bold text-[#14E0A0] mt-2 pt-2 border-t border-white/10">
        <span>Total</span><span>₹4,60,000</span>
      </div>
    </div>
  );
}

const TRACK_VISUAL_META = {
  hr: { title: "HR Track — Real Onboarding Work", text: "Build attendance trackers, onboarding checklists, and employee records in live spreadsheet-style tasks." },
  marketing: { title: "Marketing Track — Content That Ships", text: "Plan content calendars, draft real social posts, and track engagement like an actual marketing team does." },
  sales: { title: "Sales Track — Pipeline You Can See", text: "Manage a real client pipeline from lead to conversion, and pitch like you're closing an actual deal." },
  finance: { title: "Finance Track — Numbers That Balance", text: "Work with balance sheets, portfolios, and financial statements the way a real advisory desk does." },
};

function MobileScreenContent({ screen }) {
  if (screen === "overview") {
    return (
      <div className="p-3.5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-[#14E0A0]/15 to-transparent border border-[#14E0A0]/20 p-3">
          <p className="text-[9px] text-white/50">Program Progress</p>
          <p className="text-lg font-bold text-white">Day 36 <span className="text-[10px] text-white/40 font-normal">of 90</span></p>
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full w-[40%] bg-[#14E0A0] rounded-full" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2.5 text-center"><Flame size={13} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-[11px] font-bold text-white">6-Day</p><p className="text-[8px] text-white/40">Streak</p></div>
          <div className="rounded-lg bg-white/5 p-2.5 text-center"><Target size={13} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-[11px] font-bold text-white">560 pts</p><p className="text-[8px] text-white/40">Earned</p></div>
        </div>
      </div>
    );
  }
  if (screen === "missions") {
    return (
      <div className="p-3.5 space-y-2">
        {["Draft a client email", "Build an Excel tracker", "Record a pitch clip"].map((t, i) => (
          <div key={t} className="rounded-lg bg-white/5 p-2.5 flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${i === 0 ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/10 text-white/40"}`}>
              {i === 0 ? <CheckCircle2 size={13} /> : <Rocket size={11} />}
            </div>
            <p className="text-[10px] text-white/75 leading-tight">{t}</p>
          </div>
        ))}
      </div>
    );
  }
  if (screen === "leaderboard") {
    const axes = ["Comm", "Finance", "Tech", "Integrity", "Speed"];
    return (
      <div className="p-3.5">
        <p className="text-[9px] text-white/50 mb-2">Your Skill Radar</p>
        <div className="rounded-xl bg-white/5 p-3 flex items-center justify-center h-28 mb-2.5">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <polygon points="50,8 90,35 76,88 24,88 10,35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="50,30 74,42 66,78 34,78 26,42" fill="#14E0A0" fillOpacity="0.35" stroke="#14E0A0" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1">
          {axes.map((a) => <span key={a} className="text-[8px] text-white/40 bg-white/5 rounded-full px-1.5 py-0.5">{a}</span>)}
        </div>
      </div>
    );
  }
  return (
    <div className="p-3.5">
      <div className="rounded-xl bg-gradient-to-br from-[#14E0A0]/15 to-transparent border border-[#14E0A0]/25 p-3.5 text-center">
        <Award size={22} className="text-[#14E0A0] mx-auto mb-2" />
        <p className="text-[11px] font-bold text-white">Program Score: 88.2%</p>
        <p className="text-[8px] text-white/40 mt-1">TFD/INTP/2026/851840</p>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[8px] text-[#14E0A0] font-semibold">
          <QrCode size={11} /> QR-Verifiable Certificate
        </div>
      </div>
    </div>
  );
}

export default function InternshipLandingPage() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState("overview");

  return (
    <div className="min-h-screen bg-[#050B16] text-white overflow-x-hidden relative">
      <SEO
        title="The Financial Doctor | Internship Program - Finance, HR, Marketing, Sales"
        description="90-day gamified internship program — real corporate experience in Finance, HR, Marketing, and Sales. Certificate + Letter of Recommendation."
        keywords="internship finance, internship near me, summer internship, internship certificate, internship in mutual fund company, HR internship, sales internship, marketing internship"
        path="/internship"
        ogImage={`https://thefinancialdoctor.in${INTERNSHIP_LOGO_URL}`}
      />
      <NetworkBackground />

      <div className="relative z-10">
        {/* Top bar — fixed so it always stays pinned while scrolling; the
            spacer div right after it reserves the same height in normal
            flow so content doesn't jump underneath it. */}
        <div className="fixed top-0 left-0 right-0 z-30 h-16 flex items-center backdrop-blur-md bg-[#050B16]/85 border-b border-white/10">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-[#14E0A0] font-bold text-sm sm:text-base tracking-wider border border-[#14E0A0]/30 px-2.5 py-1 rounded-lg bg-[#14E0A0]/5">
                TFD <span className="text-white text-[10px] sm:text-xs font-semibold border-l border-[#14E0A0]/30 pl-1.5 ml-1">INTERNSHIP</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[#14E0A0]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14E0A0] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14E0A0]" />
                </span>
                Applications Open
              </span>
              <button
                onClick={() => navigate("/internship/login")}
                className="text-[11px] sm:text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                Student Login
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>
        <div className="h-16" aria-hidden="true" />

        {/* Hero */}
        <section className="relative px-5 pt-14 pb-16 sm:pt-24 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <motion.div
                animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white rounded-2xl p-2 shadow-[0_0_35px_rgba(20,224,160,0.3)] shrink-0"
              >
                <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-10 sm:h-12 object-contain" />
              </motion.div>
              <div className="text-left leading-tight">
                <div className="text-lg sm:text-xl font-bold text-white">TFD Internship</div>
                <div className="text-[11px] sm:text-xs text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
              </div>
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#14E0A0] bg-[#14E0A0]/10 border border-[#14E0A0]/30 rounded-full px-4 py-1.5 mb-6"
            >
              India's Best Internship Program &middot; 90-Day Program
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl sm:text-5xl font-bold leading-tight mb-5"
            >
              Internship Karo, Seekho,
              <br />
              <span className="bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] bg-clip-text text-transparent">
                Aur Aage Badho.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed"
            >
              No filler tasks. No copy-paste certificates. Just real client-facing work, GPS-verified fieldwork,
              and a certificate that actually stands up when someone checks it.
              <span className="text-white/85 font-semibold"> Proudly built for Indian students, by people who work in Indian business every day.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <button
                onClick={() => navigate("/internship/apply")}
                className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm sm:text-base px-7 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(20,224,160,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Apply Now — Starting ₹2,000 <ArrowUpRight size={18} />
              </button>
              <p className="text-white/35 text-[11px] mt-3">Seats fill up every batch — our team personally confirms yours within hours.</p>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto mt-12"
            >
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] py-3 sm:py-4 px-1.5">
                  <div className="text-lg sm:text-2xl font-bold text-[#14E0A0]">{s.value}</div>
                  <div className="text-[9px] sm:text-[11px] text-white/45 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Made in India strip */}
        <Section className="pt-4 border-t-0">
          <div className="max-w-3xl mx-auto">
            <motion.div
              variants={fadeUp}
              className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03]"
            >
              <div className="h-1.5 w-full flex">
                <div className="flex-1 bg-[#FF9933]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#138808]" />
              </div>
              <div className="px-6 py-7 sm:py-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-[#14E0A0]/10 border border-[#14E0A0]/25 flex items-center justify-center text-[#14E0A0] text-2xl font-bold shrink-0">
                  ₹
                </div>
                <div>
                  <p className="font-display text-base sm:text-lg font-bold">Proudly Built for Indian Students</p>
                  <p className="text-white/50 text-xs sm:text-sm mt-1 leading-relaxed">
                    Designed in India, priced in rupees, mentored by people who work in Indian finance and business — not a
                    generic template borrowed from anywhere else. This is India's internship program, built the way it should be.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Why India's Best Internship */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Why This Is India's Most Credible Internship</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                Most internships hand out a certificate for showing up. Ours is built so every claim on it can be checked.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {VALUE_PROPS.map((v, i) => (
                <motion.div
                  key={v.title}
                  custom={i}
                  variants={fadeUp}
                  className="rounded-2xl p-6 bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#14E0A0]/40 hover:-translate-y-1 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-4">
                    <v.icon size={20} />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{v.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* How We Work */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">How We Work</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">From sign-up to certificate, here's exactly what your program looks like.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {HOW_WE_WORK.map((step, i) => (
                <motion.div key={step.title} custom={i} variants={fadeUp} className="relative rounded-2xl p-5 bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10">
                  <div className="absolute -top-3 -left-1 text-[11px] font-bold text-[#050B16] bg-[#14E0A0] w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</div>
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-3 mt-2">
                    <step.icon size={18} />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">{step.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Real work previews, by track */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Real Work, Not Busywork</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                A glimpse of the kind of tasks each track actually works on — the same tools professionals use every day.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {TRACKS.map((t, i) => (
                <motion.div key={t.value} custom={i} variants={fadeUp} className="rounded-2xl p-5 bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                      <t.icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm">{TRACK_VISUAL_META[t.value].title}</h3>
                    </div>
                  </div>
                  <p className="text-white/45 text-xs leading-relaxed mb-3">{TRACK_VISUAL_META[t.value].text}</p>
                  <TrackVisual track={t.value} />
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Duration timeline */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Your Journey, Mapped Out</h2>
              <p className="text-white/45 text-xs sm:text-sm">Guided fundamentals, independent execution, then a real capstone project — the full 90-day arc.</p>
            </motion.div>
            <div className="relative">
              <div className="absolute left-0 right-0 top-4 h-[3px] bg-white/10 rounded-full hidden sm:block" />
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
                className="absolute left-0 top-4 h-[3px] w-full bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full hidden sm:block"
              />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-4 relative">
                {TIMELINE_MARKERS.map((m, i) => (
                  <motion.div key={m.day} custom={i} variants={fadeUp} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-3 sm:text-center">
                    <div className="w-9 h-9 rounded-full bg-[#050B16] border-2 border-[#14E0A0] flex items-center justify-center text-[11px] font-bold text-[#14E0A0] shrink-0">
                      {m.day}
                    </div>
                    <p className="text-xs text-white/60 leading-snug">{m.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Program duration */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">One Program, Done Properly</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">90 days — enough time to go from guided basics to a real, capstone-level project.</p>
            </motion.div>
            <div className="grid grid-cols-1 max-w-xs mx-auto gap-5">
              {DURATIONS.map((d, i) => (
                <motion.div
                  key={d.days}
                  custom={i}
                  variants={fadeUp}
                  className={`relative rounded-2xl p-6 border transition-all ${
                    d.popular
                      ? "bg-gradient-to-b from-[#14E0A0]/10 to-white/[0.02] border-[#14E0A0]/50 shadow-[0_10px_30px_rgba(20,224,160,0.15)]"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  }`}
                >
                  {d.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide bg-[#14E0A0] text-[#050B16] px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <p className="text-3xl font-bold">{d.days} <span className="text-base font-medium text-white/50">Days</span></p>
                  <p className="text-2xl font-bold text-[#14E0A0] mt-2">₹{d.price.toLocaleString("en-IN")}</p>
                  <p className="text-white/45 text-xs mt-3 leading-relaxed">{d.tagline}</p>
                  <button
                    onClick={() => navigate("/internship/apply")}
                    className={`w-full mt-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      d.popular ? "bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16]" : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                  >
                    Choose {d.days} Days
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Why join us */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Why You Should Join TFD Internship</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">Not just a certificate — real skills, real proof, and feedback you can act on immediately.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHY_JOIN.map((w, i) => (
                <motion.div key={w.title} custom={i} variants={fadeUp} className="flex gap-4 rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:border-[#14E0A0]/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                    <w.icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">{w.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{w.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Skills you'll build */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Skills You'll Actually Build</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                Beyond your college syllabus — the practical, job-ready skills recruiters look for.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SKILLS.map((s, i) => (
                <motion.div
                  key={s.label}
                  custom={i}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center gap-2.5 rounded-2xl p-4 bg-white/[0.03] border border-white/10 hover:border-[#14E0A0]/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0]">
                    <s.icon size={18} />
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold leading-snug">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Growth after the internship */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Your Growth After This Internship</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                This is built to actually move your career forward — not just fill a summer.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {GROWTH_BENEFITS.map((g, i) => (
                <motion.div key={g.title} custom={i} variants={fadeUp} className="flex gap-4 rounded-2xl p-5 bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-[#14E0A0]/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                    <g.icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">{g.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{g.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Mobile interface preview */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-[#14E0A0] text-xs font-bold uppercase tracking-wider mb-3">
                <Smartphone size={14} /> Built Mobile-First
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Your Whole Internship, In Your Pocket</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                Log in after signing up and here's exactly what you'll see — your real progress, missions, skill radar, and certificate, live.
              </p>
            </motion.div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <motion.div variants={fadeUp} className="relative w-[220px] shrink-0">
                <div className="rounded-[2rem] border-[6px] border-[#1A2740] bg-[#0B1424] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="h-5 bg-[#1A2740] flex items-center justify-center">
                    <div className="w-14 h-2.5 rounded-full bg-[#0B1424]" />
                  </div>
                  <div className="min-h-[280px]">
                    <MobileScreenContent screen={activeScreen} />
                  </div>
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="flex sm:flex-col gap-2 flex-wrap justify-center max-w-xs">
                {MOBILE_SCREENS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setActiveScreen(s.key)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                      activeScreen === s.key ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <s.icon size={15} /> {s.label}
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        </Section>

        {/* Sample verification preview */}
        <Section>
          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-8">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">See What a Verified Certificate Looks Like</h2>
              <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">
                Anyone — a recruiter, a college, or you yourself — can search your certificate number and see the full, real story behind it.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden border border-[#14E0A0]/25 bg-gradient-to-b from-[#14E0A0]/[0.06] to-white/[0.02]">
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#14E0A0] text-[#050B16] text-[9px] font-bold px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} /> VERIFIED
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0] font-bold text-sm">AS</div>
                  <div>
                    <p className="font-bold text-sm">Aditya Sharma</p>
                    <p className="text-white/40 text-[11px]">HR Track &middot; 90-Day Program &middot; TFD/INTP/2026/851840</p>
                  </div>
                </div>
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-white/50">Program Score</span><span className="text-[#14E0A0] font-bold">88.2%</span></div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4"><div className="h-full w-[88%] bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" /></div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-xs font-bold">42</p><p className="text-[8px] text-white/40">Tasks Done</p></div>
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-xs font-bold">6</p><p className="text-[8px] text-white/40">Quizzes Passed</p></div>
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-xs font-bold">College ID</p><p className="text-[8px] text-white/40">On File</p></div>
                </div>
                <button
                  onClick={() => navigate("/verify")}
                  className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <QrCode size={13} /> Open the Real Verification Page
                </button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Domain grid */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Choose Your Track</h2>
              <p className="text-white/45 text-xs sm:text-sm">Four specialisations, each with real, domain-specific fieldwork.</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {TRACKS.map((t, i) => (
                <motion.div
                  key={t.value}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-2xl p-5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-[#14E0A0]/50 hover:shadow-[0_10px_30px_rgba(20,224,160,0.15)] transition-all cursor-pointer"
                  onClick={() => navigate("/internship/apply")}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-3">
                    <t.icon size={18} />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold leading-snug">{t.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <Section className="border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Ready to Start Your Internship?</h2>
            <p className="text-white/50 text-sm mb-7">India ka best internship program — seats are limited per batch. Pick your track and secure your slot today.</p>
            <button
              onClick={() => navigate("/internship/apply")}
              className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all hover:scale-[1.03]"
            >
              Apply Now <ArrowUpRight size={16} />
            </button>
            <p className="text-white/35 text-[11px] mt-4">Already have an account? <button onClick={() => navigate("/internship/login")} className="text-[#14E0A0] font-semibold hover:underline">Log in here</button></p>
            <div>
              <button
                onClick={() => navigate("/verify")}
                className="inline-flex items-center gap-1.5 text-white/45 hover:text-[#14E0A0] text-xs font-semibold mt-5 transition-colors"
              >
                <ShieldCheck size={13} /> Verify Your Certificate
              </button>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="px-5 py-10 border-t border-white/10">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-1.5">
                <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-6 object-contain" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-white">TFD Internship</div>
                <div className="text-[9px] text-[#14E0A0] font-semibold">Learn. Build. Launch.</div>
              </div>
            </div>
            <p className="text-white/35 text-[11px] max-w-md leading-relaxed">
              India ka best internship program &middot; Proudly built for Indian students &middot; Internship karo, seekho, aur aage badho.
            </p>
            <p className="text-white/25 text-[10px]">Powered by The Financial Doctor</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
