import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, ShieldCheck, MapPinned, FileCheck2,
  TrendingUp, Landmark, Megaphone, Heart, Star, Users2,
  ClipboardCheck, GraduationCap, BadgeCheck, Sparkles, Briefcase, Smartphone,
  MessageSquare, Calculator, HandCoins, PenTool, Mic2, Puzzle,
  FileText, ThumbsUp, Network, Video,
} from "lucide-react";

const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

const STATS = [
  { value: "45-90", label: "Days, Your Choice" },
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
  { icon: ClipboardCheck, title: "Apply & Secure Your Slot", text: "Sign up, pick your track and duration (45, 60, or 90 days), and reserve your seat for the next batch." },
  { icon: Users2, title: "Get Matched With Real Work", text: "Every intern gets their own set of practical, domain-specific tasks — no two journeys are identical." },
  { icon: GraduationCap, title: "Learn, Execute, Get Evaluated", text: "Short practical lessons, real fieldwork, and weekly quizzes keep you progressing day by day." },
  { icon: BadgeCheck, title: "Graduate With a Verified Certificate", text: "Finish Day 45 and receive a certificate with a public QR audit trail employers can verify instantly." },
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

const DURATIONS = [
  { days: 45, price: 2000, tagline: "A focused sprint — perfect if you're testing the waters." },
  { days: 60, price: 3000, tagline: "The sweet spot — enough time to go from tasks to real ownership.", popular: true },
  { days: 90, price: 5000, tagline: "Maximum depth — the strongest resume line and certificate weight." },
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
  { day: 15, label: "Week 1-2: Core Fundamentals" },
  { day: 30, label: "Week 3-4: Live Field Missions" },
  { day: 45, label: "Graduation & Certificate" },
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

export default function InternshipLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050B16] text-white overflow-x-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-[#050B16]/85 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-5 py-3.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <img src={MAIN_LOGO_URL} alt="The Financial Doctor" className="h-8 sm:h-9 bg-white rounded-lg p-1 object-contain shrink-0" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

      {/* Hero */}
      <section className="relative px-5 pt-14 pb-16 sm:pt-24 sm:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#14E0A0]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#024396]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-5"
          >
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-12 sm:h-14 object-contain" />
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
            TFD Internship &middot; 45 / 60 / 90-Day Programs
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl font-bold leading-tight mb-5"
          >
            Stop Collecting Plain Papers.
            <br />
            <span className="bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] bg-clip-text text-transparent">
              Earn a Corporate Baptism.
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
            <span className="text-white/85 font-semibold"> This is India's toughest — and most rewarding — internship.</span>
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
              Claim Your Seat — ₹2,000 <ArrowUpRight size={18} />
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
                  generic template borrowed from anywhere else.
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
            <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">From sign-up to certificate, here's exactly what your 45 days look like.</p>
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

      {/* Duration timeline */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Your Journey, Mapped Out</h2>
            <p className="text-white/45 text-xs sm:text-sm">Shown for the 45-day track — the same structure scales up for 60 and 90 days.</p>
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

      {/* Choose your duration */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Choose Your Duration</h2>
            <p className="text-white/45 text-xs sm:text-sm max-w-xl mx-auto">Whatever fits your semester — go deeper the longer you stay.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

      {/* Mobile app teaser */}
      <Section>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-[#14E0A0] text-xs font-bold uppercase tracking-wider mb-3">
            <Smartphone size={14} /> Built Mobile-First
          </div>
          <p className="text-white/55 text-sm max-w-lg mx-auto leading-relaxed">
            Track your program journey from your phone — weekly missions with instant auto-verified feedback,
            quizzes, a skill radar chart, and an All-India leaderboard.
          </p>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">Ready to Start Your Internship?</h2>
          <p className="text-white/50 text-sm mb-7">Seats are limited per batch. Pick your track and secure your slot today.</p>
          <button
            onClick={() => navigate("/internship/apply")}
            className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-sm px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all hover:scale-[1.03]"
          >
            Apply Now <ArrowUpRight size={16} />
          </button>
        </div>
      </Section>

      {/* Footer */}
      <footer className="px-5 py-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" className="h-8 object-contain" />
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-white">TFD Internship</div>
              <div className="text-[9px] text-[#14E0A0] font-semibold">Learn. Build. Launch.</div>
            </div>
            <div className="w-px h-6 bg-white/15" />
            <img src={MAIN_LOGO_URL} alt="The Financial Doctor" className="h-8 bg-white rounded-md p-1 object-contain" />
          </div>
          <p className="text-white/35 text-[11px]">Powered by The Financial Doctor &middot; AMFI Registered &middot; ARN-290298</p>
        </div>
      </footer>
    </div>
  );
}
