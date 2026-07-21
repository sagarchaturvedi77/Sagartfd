import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import {
  ArrowLeft, ArrowUpRight, Languages, XCircle, CheckCircle, Star, ThumbsUp,
  TrendingUp, Landmark, Megaphone, Heart, FileText, QrCode, Award, Target,
} from "lucide-react";

const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

const TRACKS = [
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "sales", label: "Sales", icon: TrendingUp },
  { value: "hr", label: "HR", icon: Heart },
];

function TrackVisual({ track }) {
  if (track === "hr") {
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Employee Onboarding Tracker</p>
          <span className="text-[11px] text-[#14E0A0] font-semibold">Excel</span>
        </div>
        {[["Riya Sharma", "12 Jul"], ["Aman Verma", "13 Jul"], ["Neha Gupta", "14 Jul"]].map(([n, d]) => (
          <div key={n} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-white/70">{n}</span>
            <span className="text-[11px] text-white/35">{d}</span>
            <span className="text-[11px] font-semibold text-[#14E0A0] bg-[#14E0A0]/10 rounded-full px-2 py-0.5">Onboarded</span>
          </div>
        ))}
      </div>
    );
  }
  if (track === "marketing") {
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2.5">Weekly Content Calendar</p>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
            <div key={d} className={`rounded-lg py-2 text-center text-[11px] font-semibold ${i === 2 ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/5 text-white/45"}`}>{d}</div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/45">
          <span className="flex items-center gap-1"><Star size={12} className="text-[#14E0A0]" /> 1.2k reach</span>
          <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-[#14E0A0]" /> 96 likes</span>
        </div>
      </div>
    );
  }
  if (track === "sales") {
    const stages = [["Leads", 120, 100], ["Contacted", 78, 65], ["Converted", 24, 20]];
    return (
      <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
        <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-3">Client Pipeline Funnel</p>
        <div className="space-y-2.5">
          {stages.map(([label, val, pct]) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] text-white/50 mb-1"><span>{label}</span><span className="text-white/70 font-semibold">{val}</span></div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" style={{ width: `${pct}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[#0B1424] border border-white/10 p-3.5">
      <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2.5">Balance Sheet Snapshot</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
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
      <div className="flex justify-between text-xs font-bold text-[#14E0A0] mt-2 pt-2 border-t border-white/10">
        <span>Total</span><span>₹4,60,000</span>
      </div>
    </div>
  );
}

// A small SVG radar chart, axes vary per department — pure decoration built
// from static points (matches the same radar-chart style already used in
// the landing page's mobile-preview section), not a real charting library.
function SkillRadar({ axes }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40">
        <polygon points="50,8 90,35 76,88 24,88 10,35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <polygon points="50,22 74,40 64,74 36,74 26,40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <polygon points="50,26 72,42 63,76 37,76 28,42" fill="#14E0A0" fillOpacity="0.35" stroke="#14E0A0" strokeWidth="1.5" />
      </svg>
      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {axes.map((a) => <span key={a} className="text-[11px] text-white/45 bg-white/5 rounded-full px-2 py-0.5">{a}</span>)}
      </div>
    </div>
  );
}

// Full bilingual content per department, pre-written EN/Hinglish pairs (no
// translation API) — same pattern as InternshipLandingPage.jsx.
const CONTENT = {
  english: {
    finance: {
      tagline: "Numbers That Balance",
      whatYoullDo: "You'll work with real balance sheets, GST invoices, bank reconciliations, and portfolio numbers on our live formula-engine spreadsheet workspace — the same kind of work a junior analyst at an advisory desk actually does, not textbook exercises.",
      whyNecessary: "Every business — from a two-person shop to a listed company — runs on numbers that have to tie out. Finance skills (reading a P&L, reconciling accounts, building a budget) are the one universal language every department eventually needs, and they're exactly what most fresh graduates arrive without.",
      benefits: [
        "Hands-on practice with the same spreadsheet formulas (SUM, AVERAGE, IF, cell references) real analysts use daily.",
        "Direct exposure to how a SEBI-registered advisory desk actually reads a balance sheet, not a simplified classroom version.",
        "A portfolio of 8 completed, gradeable financial tasks you can walk a recruiter through line by line.",
      ],
      differenceVsOthers: [
        { feature: "Finance Tasks", other: "Copy numbers into a template someone else built", tfd: "Build the trial balance, P&L, and reconciliation yourself, from scratch, on a live formula engine" },
        { feature: "Feedback", other: "\"Submitted\" with no correction", tfd: "Instant tolerance-based grading — see exactly which line item was off and why" },
        { feature: "Depth", other: "One generic \"finance basics\" module", tfd: "8 distinct tasks across GST, reconciliation, budgeting, and ratio analysis" },
      ],
      marketGap: "Commerce graduates walk out knowing accounting theory but have never actually built a trial balance under time pressure, reconciled a real bank statement with deliberate errors in it, or explained a ratio-analysis finding out loud.",
      howWeFillIt: "Every finance task on this track is built to force that exact gap closed — messy, realistic data (not clean textbook numbers), a real spreadsheet tool with formulas you write yourself, and instant feedback so you learn from the mistake immediately instead of finding out three months later.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Trial balances, GST invoices, and monthly P&L statements — taught step by step before you touch them solo." },
        { phase: "Day 31–60 · Independent Execution", text: "Bank reconciliation, expense audits, and budget-variance analysis, done entirely on your own." },
        { phase: "Day 61–90 · Capstone", text: "Build a full ratio-analysis report and a monthly financial dashboard from raw transaction data." },
      ],
      growth: [
        { skill: "Financial Statement Reading", how: "By building a P&L and balance sheet from raw entries, not just reading finished ones.", why: "Every finance/analyst interview tests whether you can actually read one under pressure." },
        { skill: "Spreadsheet Fluency", how: "Writing your own SUM/AVERAGE/IF formulas across 8 real tasks, not copy-pasting a template.", why: "It's the single most-used tool in any finance-adjacent job, and most graduates are shakier at it than they think." },
        { skill: "Attention to Detail", how: "Bank reconciliation tasks are seeded with deliberate mismatches you have to catch.", why: "In real finance work, a missed decimal or a wrong reference number is the whole job going wrong." },
      ],
      chartAxes: ["Excel/Formulas", "Accuracy", "Reporting", "Reconciliation", "Ratio Analysis"],
    },
    hr: {
      tagline: "Real Onboarding Work",
      whatYoullDo: "You'll build onboarding checklists, attendance trackers, and employee documentation in live spreadsheet-style tasks — exactly what an in-house HR desk handles for every new joiner, not a generic \"HR theory\" module.",
      whyNecessary: "Every company that hires anyone needs someone who can onboard them cleanly, track attendance accurately, and keep employee records audit-ready. It's unglamorous, high-stakes work — a messy onboarding process is often a new hire's first (and worst) impression of a company.",
      benefits: [
        "Real practice building the exact trackers and checklists used in an actual onboarding process.",
        "Direct exposure to how employee documentation is actually maintained and audited.",
        "A completed record of HR process work you can describe concretely in any interview.",
      ],
      differenceVsOthers: [
        { feature: "HR Tasks", other: "Read a PDF about HR policies", tfd: "Build a live onboarding tracker and attendance system yourself" },
        { feature: "Feedback", other: "No correction, just a completion tick", tfd: "Instant feedback on documentation accuracy and completeness" },
        { feature: "Depth", other: "Generic \"HR fundamentals\" overview", tfd: "8 distinct tasks across onboarding, attendance, and documentation" },
      ],
      marketGap: "Most HR-track students can recite onboarding theory but have never actually built the checklist a real HR desk uses on day one of a new joiner, or caught the kind of documentation gap that turns into a compliance problem months later.",
      howWeFillIt: "Every HR task here mirrors a real onboarding cycle with realistic (fictional) employee data — you build the actual tracker, catch the actual gaps, and get graded on whether the finished document would actually hold up.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Employee onboarding checklists and attendance trackers, built together with your mentor." },
        { phase: "Day 31–60 · Independent Execution", text: "Manage a live onboarding tracker and draft real HR documentation entirely on your own." },
        { phase: "Day 61–90 · Capstone", text: "Run a full onboarding simulation end-to-end and present your HR process improvements." },
      ],
      growth: [
        { skill: "Onboarding Process Design", how: "Building a real checklist and tracker from scratch across multiple tasks.", why: "It's the first thing any HR role actually tests you on — not policy trivia." },
        { skill: "Documentation Accuracy", how: "Attendance and record-keeping tasks that are graded on completeness, not just submission.", why: "Sloppy HR records become compliance and payroll problems down the line." },
        { skill: "People Coordination", how: "Simulated multi-employee onboarding scenarios with realistic scheduling conflicts.", why: "HR work is coordination work — this is the skill recruiters actually probe for." },
      ],
      chartAxes: ["Onboarding", "Documentation", "Coordination", "Accuracy", "Communication"],
    },
    marketing: {
      tagline: "Content That Ships",
      whatYoullDo: "You'll plan real content calendars, draft actual social posts, and track engagement numbers like reach and likes — the same weekly rhythm a working marketing team follows, not a one-off \"design a poster\" assignment.",
      whyNecessary: "Every brand today lives or dies by consistent, planned content — not sporadic posting. Marketing skills (calendar planning, writing for a platform, reading engagement data) are what separates someone who can \"be creative\" from someone who can actually run a channel.",
      benefits: [
        "Hands-on practice building a real weekly content calendar, not a mood board.",
        "Direct exposure to how campaign performance is actually tracked and reported.",
        "A portfolio of real drafted content and a presented strategy you can show any recruiter.",
      ],
      differenceVsOthers: [
        { feature: "Marketing Tasks", other: "Design one poster and call it done", tfd: "Plan a full weekly calendar, draft posts, and track real engagement metrics" },
        { feature: "Feedback", other: "No structured review", tfd: "Mentor-reviewed drafts with instant AI-graded feedback" },
        { feature: "Depth", other: "One generic \"intro to marketing\" task", tfd: "7 distinct tasks across planning, drafting, and campaign strategy" },
      ],
      marketGap: "Most marketing-track students can name the 4 Ps but have never actually planned a week's worth of content against a calendar, pitched a campaign concept, or explained why one post outperformed another using real numbers.",
      howWeFillIt: "Every marketing task here forces you to plan, draft, and justify your choices against realistic (fictional) engagement data — not just produce one piece of creative in isolation.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Weekly content calendars and your first drafted social posts, reviewed by a mentor." },
        { phase: "Day 31–60 · Independent Execution", text: "Plan and pitch a full campaign concept on your own, tracked against real engagement metrics." },
        { phase: "Day 61–90 · Capstone", text: "Present a complete content strategy with performance data, ready to show any recruiter." },
      ],
      growth: [
        { skill: "Content Calendar Planning", how: "Building real weekly calendars across multiple tasks, not a single mock-up.", why: "It's the actual day-to-day job of a marketing associate, more than any single creative piece." },
        { skill: "Copywriting for Platforms", how: "Drafting real post copy reviewed against platform-specific best practice.", why: "Generic essay-writing skills don't automatically translate — this does." },
        { skill: "Reading Engagement Data", how: "Tracking reach/likes on your own campaign concept and explaining the numbers.", why: "Any marketing interview will ask you to justify a decision with data, not instinct." },
      ],
      chartAxes: ["Planning", "Copywriting", "Analytics", "Strategy", "Consistency"],
    },
    sales: {
      tagline: "Pipeline You Can See",
      whatYoullDo: "You'll manage a real client pipeline from lead to conversion and pitch like you're closing an actual deal — funnel numbers, objection-handling, and follow-up, the full cycle, not a single role-play exercise.",
      whyNecessary: "Every company, no matter what it sells, needs revenue to come in the door — and that means someone has to manage a pipeline, handle objections, and close. Sales skills (structured follow-up, objection-handling, reading a funnel) transfer directly into client-facing roles in any industry.",
      benefits: [
        "Hands-on practice managing a real multi-stage pipeline, not a single cold-call script.",
        "Direct exposure to how a real advisory desk tracks leads through to conversion.",
        "A completed, presentable pipeline and pitch you can walk a recruiter through.",
      ],
      differenceVsOthers: [
        { feature: "Sales Tasks", other: "Practice one scripted pitch in isolation", tfd: "Run a full pipeline — Leads → Contacted → Converted — end to end" },
        { feature: "Feedback", other: "No objection-handling practice", tfd: "Structured objection-handling drills with instant feedback" },
        { feature: "Depth", other: "One generic \"intro to sales\" module", tfd: "8 distinct tasks across pipeline management, pitching, and closing" },
      ],
      marketGap: "Most sales-track students can deliver a memorised pitch but have never actually managed a pipeline with real drop-off at each stage, handled a genuine objection live, or explained why a deal stalled using funnel numbers.",
      howWeFillIt: "Every sales task here runs you through a realistic (fictional) pipeline with actual conversion drop-off built in — you don't just pitch once, you manage the whole cycle and get graded on the follow-through.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Learn the pipeline — Leads → Contacted → Converted — and shadow a real pitch." },
        { phase: "Day 31–60 · Independent Execution", text: "Run your own mock client pipeline and handle objections solo." },
        { phase: "Day 61–90 · Capstone", text: "Close a full simulated deal cycle and present your conversion numbers." },
      ],
      growth: [
        { skill: "Pipeline Management", how: "Running a real Leads → Contacted → Converted funnel across multiple tasks.", why: "Sales isn't one pitch — it's managing many leads at different stages at once." },
        { skill: "Objection-Handling", how: "Structured drills against realistic client pushback, not a scripted role-play.", why: "It's the single most-tested skill in any real sales interview." },
        { skill: "Client Communication", how: "Written and verbal follow-up tasks graded on clarity and persuasion.", why: "Most deals are lost to poor follow-up, not a bad pitch." },
      ],
      chartAxes: ["Pipeline Mgmt", "Objection-Handling", "Communication", "Closing", "Follow-up"],
    },
  },
  hinglish: {
    finance: {
      tagline: "Numbers That Balance",
      whatYoullDo: "Real balance sheets, GST invoices, bank reconciliations, aur portfolio numbers pe kaam karoge - hamare live formula-engine spreadsheet workspace pe. Bilkul waisa kaam jo ek advisory desk ka junior analyst karta hai, textbook exercises nahi.",
      whyNecessary: "Har business - do-log ki dukaan ho ya listed company - numbers pe chalta hai jo tie out karne hi hain. Finance skills (P&L padhna, accounts reconcile karna, budget banana) woh universal language hai jo har department ko eventually chahiye hoti hai, aur zyada tar fresh graduates isi ke bina aate hain.",
      benefits: [
        "Real analysts jo daily spreadsheet formulas (SUM, AVERAGE, IF, cell references) use karte hain, unki hands-on practice.",
        "Direct exposure ki ek SEBI-registered advisory desk balance sheet ko actually kaise padhti hai, classroom wala simplified version nahi.",
        "8 completed, gradeable financial tasks ka portfolio jo aap kisi bhi recruiter ko line-by-line explain kar sakte ho.",
      ],
      differenceVsOthers: [
        { feature: "Finance Tasks", other: "Kisi aur ke bane template mein numbers copy karo", tfd: "Trial balance, P&L, aur reconciliation khud, scratch se, live formula engine pe banao" },
        { feature: "Feedback", other: "\"Submitted\" ho gaya, koi correction nahi", tfd: "Instant tolerance-based grading - exactly dekho kaun sa line item galat tha aur kyun" },
        { feature: "Depth", other: "Ek generic \"finance basics\" module", tfd: "GST, reconciliation, budgeting, aur ratio analysis ke across 8 alag tasks" },
      ],
      marketGap: "Commerce graduates accounting theory jaante hue nikalte hain lekin kabhi actually time-pressure mein trial balance nahi banaya, deliberate errors wale real bank statement ko reconcile nahi kiya, ya ratio-analysis finding ko zubaani explain nahi kiya.",
      howWeFillIt: "Is track ka har finance task exactly yehi gap band karne ke liye banaya gaya hai - messy, realistic data (clean textbook numbers nahi), khud likhe formulas wala real spreadsheet tool, aur instant feedback taaki galti se turant seekho, 3 mahine baad nahi.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Trial balances, GST invoices, aur monthly P&L statements - pehle step-by-step sikhaya jaata hai, phir solo karte ho." },
        { phase: "Day 31–60 · Independent Execution", text: "Bank reconciliation, expense audits, aur budget-variance analysis - pura apne dam pe." },
        { phase: "Day 61–90 · Capstone", text: "Raw transaction data se pura ratio-analysis report aur monthly financial dashboard banao." },
      ],
      growth: [
        { skill: "Financial Statement Reading", how: "Raw entries se P&L aur balance sheet khud banake, sirf finished cheez padh ke nahi.", why: "Har finance/analyst interview test karta hai ki aap pressure mein isse actually padh sakte ho ya nahi." },
        { skill: "Spreadsheet Fluency", how: "8 real tasks mein khud SUM/AVERAGE/IF formulas likh ke, template copy-paste nahi kar ke.", why: "Kisi bhi finance-adjacent job mein sabse zyada use hone wala tool hai, aur zyada tar graduates isme sochte hue se kamzor hote hain." },
        { skill: "Attention to Detail", how: "Bank reconciliation tasks mein deliberate mismatches diye jaate hain jo aapko pakadne hain.", why: "Real finance work mein, ek missed decimal ya galat reference number pura kaam bigaad deta hai." },
      ],
      chartAxes: ["Excel/Formulas", "Accuracy", "Reporting", "Reconciliation", "Ratio Analysis"],
    },
    hr: {
      tagline: "Real Onboarding Work",
      whatYoullDo: "Onboarding checklists, attendance trackers, aur employee documentation live spreadsheet-style tasks mein banaoge - bilkul woh jo ek in-house HR desk har naye joiner ke liye handle karti hai, generic \"HR theory\" module nahi.",
      whyNecessary: "Har company jo kisi ko bhi hire karti hai, usse chahiye koi jo unhe cleanly onboard kar sake, attendance accurately track kar sake, aur employee records audit-ready rakh sake. Yeh unglamorous, high-stakes kaam hai - messy onboarding process aksar naye hire ka pehla (aur sabse bura) impression hoti hai.",
      benefits: [
        "Exact trackers aur checklists banane ki real practice jo actual onboarding process mein use hoti hain.",
        "Direct exposure ki employee documentation actually kaise maintain aur audit hoti hai.",
        "HR process work ka completed record jo aap kisi bhi interview mein concretely describe kar sakte ho.",
      ],
      differenceVsOthers: [
        { feature: "HR Tasks", other: "HR policies ke baare mein ek PDF padho", tfd: "Khud ek live onboarding tracker aur attendance system banao" },
        { feature: "Feedback", other: "Koi correction nahi, bas completion tick", tfd: "Documentation accuracy aur completeness pe instant feedback" },
        { feature: "Depth", other: "Generic \"HR fundamentals\" overview", tfd: "Onboarding, attendance, aur documentation ke across 8 alag tasks" },
      ],
      marketGap: "Zyada tar HR-track students onboarding theory recite kar sakte hain lekin kabhi wo checklist actually nahi banayi jo ek real HR desk naye joiner ke pehle din use karti hai, ya woh documentation gap nahi pakda jo mahino baad compliance problem ban jaata hai.",
      howWeFillIt: "Yahan har HR task ek real onboarding cycle ko realistic (fictional) employee data ke saath mirror karta hai - aap actual tracker banate ho, actual gaps pakadte ho, aur graded hote ho ki finished document actually kaam karega ya nahi.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Employee onboarding checklists aur attendance trackers, apne mentor ke saath milkar banaye jaate hain." },
        { phase: "Day 31–60 · Independent Execution", text: "Ek live onboarding tracker manage karo aur real HR documentation pura apne dam pe likho." },
        { phase: "Day 61–90 · Capstone", text: "Ek pura onboarding simulation end-to-end chalao aur apne HR process improvements present karo." },
      ],
      growth: [
        { skill: "Onboarding Process Design", how: "Multiple tasks ke across ek real checklist aur tracker scratch se banake.", why: "Kisi bhi HR role mein pehli cheez yehi test hoti hai - policy trivia nahi." },
        { skill: "Documentation Accuracy", how: "Attendance aur record-keeping tasks jo completeness pe graded hote hain, sirf submission pe nahi.", why: "Sloppy HR records aage jaake compliance aur payroll problems ban jaate hain." },
        { skill: "People Coordination", how: "Realistic scheduling conflicts wale simulated multi-employee onboarding scenarios.", why: "HR work coordination work hai - yehi skill recruiters actually probe karte hain." },
      ],
      chartAxes: ["Onboarding", "Documentation", "Coordination", "Accuracy", "Communication"],
    },
    marketing: {
      tagline: "Content That Ships",
      whatYoullDo: "Real content calendars plan karoge, actual social posts draft karoge, aur reach/likes jaise engagement numbers track karoge - bilkul woh weekly rhythm jo ek working marketing team follow karti hai, ek-baar-wala \"poster design karo\" assignment nahi.",
      whyNecessary: "Aaj har brand consistent, planned content pe jeeti hai - sporadic posting pe nahi. Marketing skills (calendar planning, platform ke liye likhna, engagement data padhna) yehi decide karte hain ki koi \"creative ho sakta hai\" ya actually ek channel run kar sakta hai.",
      benefits: [
        "Ek real weekly content calendar banane ki hands-on practice, mood board nahi.",
        "Direct exposure ki campaign performance actually kaise track aur report hoti hai.",
        "Real drafted content aur ek presented strategy ka portfolio jo aap kisi bhi recruiter ko dikha sakte ho.",
      ],
      differenceVsOthers: [
        { feature: "Marketing Tasks", other: "Ek poster design karo aur khatam samjho", tfd: "Ek poora weekly calendar plan karo, posts draft karo, aur real engagement metrics track karo" },
        { feature: "Feedback", other: "Koi structured review nahi", tfd: "Mentor-reviewed drafts, instant AI-graded feedback ke saath" },
        { feature: "Depth", other: "Ek generic \"intro to marketing\" task", tfd: "Planning, drafting, aur campaign strategy ke across 7 alag tasks" },
      ],
      marketGap: "Zyada tar marketing-track students 4 Ps naam bata sakte hain lekin kabhi ek hafte ka content calendar ke against plan nahi kiya, campaign concept pitch nahi kiya, ya real numbers use karke explain nahi kiya ki ek post doosre se better kyun perform kiya.",
      howWeFillIt: "Yahan har marketing task aapko apne choices ko realistic (fictional) engagement data ke against plan, draft, aur justify karne pe majboor karta hai - sirf isolation mein ek creative piece produce karna nahi.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Weekly content calendars aur aapke pehle drafted social posts, mentor dwara reviewed." },
        { phase: "Day 31–60 · Independent Execution", text: "Ek poora campaign concept khud plan aur pitch karo, real engagement metrics ke against track kiya jaata hai." },
        { phase: "Day 61–90 · Capstone", text: "Performance data ke saath ek complete content strategy present karo, kisi bhi recruiter ko dikhane layak." },
      ],
      growth: [
        { skill: "Content Calendar Planning", how: "Multiple tasks ke across real weekly calendars banake, ek single mock-up nahi.", why: "Yehi marketing associate ka actual din-pratidin kaam hai, kisi ek creative piece se zyada." },
        { skill: "Copywriting for Platforms", how: "Platform-specific best practice ke against reviewed real post copy draft karke.", why: "Generic essay-writing skills automatically translate nahi hoti - yeh hoti hai." },
        { skill: "Reading Engagement Data", how: "Apne campaign concept pe reach/likes track karke aur numbers explain karke.", why: "Koi bhi marketing interview aapse ek decision ko data se justify karne ko kahega, instinct se nahi." },
      ],
      chartAxes: ["Planning", "Copywriting", "Analytics", "Strategy", "Consistency"],
    },
    sales: {
      tagline: "Pipeline You Can See",
      whatYoullDo: "Lead se conversion tak ek real client pipeline manage karoge aur aise pitch karoge jaise ek asli deal close kar rahe ho - funnel numbers, objection-handling, aur follow-up, poora cycle, ek single role-play exercise nahi.",
      whyNecessary: "Har company, chahe kuch bhi beche, revenue chahiye - aur iska matlab hai koi pipeline manage kare, objections handle kare, aur close kare. Sales skills (structured follow-up, objection-handling, funnel padhna) kisi bhi industry ke client-facing roles mein directly transfer hoti hain.",
      benefits: [
        "Ek real multi-stage pipeline manage karne ki hands-on practice, ek cold-call script nahi.",
        "Direct exposure ki ek real advisory desk leads ko conversion tak kaise track karti hai.",
        "Ek completed, presentable pipeline aur pitch jo aap kisi recruiter ko walk-through kar sakte ho.",
      ],
      differenceVsOthers: [
        { feature: "Sales Tasks", other: "Isolation mein ek scripted pitch practice karo", tfd: "Poora pipeline chalao - Leads → Contacted → Converted - end to end" },
        { feature: "Feedback", other: "Koi objection-handling practice nahi", tfd: "Structured objection-handling drills, instant feedback ke saath" },
        { feature: "Depth", other: "Ek generic \"intro to sales\" module", tfd: "Pipeline management, pitching, aur closing ke across 8 alag tasks" },
      ],
      marketGap: "Zyada tar sales-track students ek yaad kiya hua pitch de sakte hain lekin kabhi real drop-off wali pipeline manage nahi ki, live mein genuine objection handle nahi kiya, ya funnel numbers use karke explain nahi kiya ki deal kyun ruk gayi.",
      howWeFillIt: "Yahan har sales task aapko ek realistic (fictional) pipeline se guzarta hai jisme actual conversion drop-off built-in hai - aap sirf ek baar pitch nahi karte, poora cycle manage karte ho aur follow-through pe graded hote ho.",
      roadmap: [
        { phase: "Day 1–30 · Guided Fundamentals", text: "Pipeline sikho - Leads → Contacted → Converted - aur ek real pitch shadow karo." },
        { phase: "Day 31–60 · Independent Execution", text: "Apna khud ka mock client pipeline chalao aur objections solo handle karo." },
        { phase: "Day 61–90 · Capstone", text: "Ek poora simulated deal cycle close karo aur apne conversion numbers present karo." },
      ],
      growth: [
        { skill: "Pipeline Management", how: "Multiple tasks ke across ek real Leads → Contacted → Converted funnel chalake.", why: "Sales ek pitch nahi hai - ek saath alag stages pe kayi leads manage karna hai." },
        { skill: "Objection-Handling", how: "Realistic client pushback ke against structured drills, ek scripted role-play nahi.", why: "Kisi bhi real sales interview mein sabse zyada test hone wali skill yehi hai." },
        { skill: "Client Communication", how: "Written aur verbal follow-up tasks jo clarity aur persuasion pe graded hote hain.", why: "Zyada tar deals bure pitch se nahi, poor follow-up se lost hoti hain." },
      ],
      chartAxes: ["Pipeline Mgmt", "Objection-Handling", "Communication", "Closing", "Follow-up"],
    },
  },
};

function Split({ left, right, reverse, className = "" }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${className}`}>
      <div className={reverse ? "lg:order-2" : ""}>{left}</div>
      <div className={reverse ? "lg:order-1" : ""}>{right}</div>
    </div>
  );
}

function Section({ children, className = "" }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
      className={`px-5 py-8 sm:py-10 border-t border-white/5 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function InternshipTrackPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [lang, setLang] = useState("english");

  const track = TRACKS.find((t) => t.value === trackId);
  if (!track) return <Navigate to="/internship" replace />;
  const c = CONTENT[lang][trackId];

  return (
    <div className="min-h-screen bg-[#050B16] text-white overflow-x-hidden relative">
      <SEO
        title={`The Financial Doctor | ${track.label} Internship — 90-Day Program`}
        description={`What you'll actually do in TFD's ${track.label} internship track — real tasks, a 90-day roadmap, and a QR-verifiable certificate.`}
        keywords={`${track.label.toLowerCase()} internship, ${track.label.toLowerCase()} internship certificate, internship near me`}
        path={`/internship/tracks/${track.value}`}
        ogImage={`https://thefinancialdoctor.in${INTERNSHIP_LOGO_URL}`}
      />

      <div className="relative z-10">
        {/* Rendered via a portal straight into document.body — this page's
            root wrapper is `position:relative` + `overflow-x-hidden`, and
            that combination clips `position:fixed` descendants on iOS
            Safari, so the fixed nav has to escape that subtree entirely
            (same fix InternshipLandingPage's top nav and NetworkBackground
            use). */}
        {createPortal(
          <div className="fixed top-0 left-0 right-0 z-30 h-16 flex items-center backdrop-blur-md bg-[#050B16]/85 border-b border-white/10">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-5">
              <button onClick={() => navigate("/internship")} className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={16} /> All Tracks
              </button>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div role="group" aria-label="Page language" className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5">
                  <button onClick={() => setLang("english")} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors ${lang === "english" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"}`}>
                    <Languages size={13} className="hidden sm:inline" /> EN
                  </button>
                  <button onClick={() => setLang("hinglish")} className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors ${lang === "hinglish" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"}`}>
                    Hinglish
                  </button>
                </div>
                <button onClick={() => navigate(`/internship/apply?track=${track.value}`)} className="hidden sm:inline-flex items-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] text-sm font-bold px-4 py-2 rounded-full transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        <div className="h-16" aria-hidden="true" />

        {/* Header + track switcher */}
        <div className="px-5 pt-8 pb-2">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-2.5">
            {TRACKS.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate(`/internship/tracks/${t.value}`)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  t.value === track.value ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero — split, left text / right sample-work visual */}
        <Section className="border-t-0">
          <div className="max-w-5xl mx-auto">
            <Split
              left={
                <div key={`hero-${lang}-${trackId}`}>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#14E0A0] mb-3">{track.label} Track</p>
                  <h1 className="font-display text-4xl sm:text-4xl font-bold leading-tight mb-4">{c.tagline}</h1>
                  <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-7">{c.whatYoullDo}</p>
                  <button
                    onClick={() => navigate(`/internship/apply?track=${track.value}`)}
                    className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-base px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all hover:scale-[1.03]"
                  >
                    Apply for {track.label} <ArrowUpRight size={18} />
                  </button>
                </div>
              }
              right={
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/35 mb-2.5">A sample task, live</p>
                  <TrackVisual track={track.value} />
                </div>
              }
            />
          </div>
        </Section>

        {/* Why necessary + benefits — split, alternating side */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <Split
              key={`why-${lang}`}
              left={
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Why {track.label} Skills Matter</h2>
                  <p className="text-white/55 text-base leading-relaxed">{c.whyNecessary}</p>
                </div>
              }
              right={
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-3">What You Get Out Of It</p>
                  <ul className="space-y-3">
                    {c.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-white/70 text-sm sm:text-base leading-relaxed">
                        <CheckCircle size={16} className="text-[#14E0A0] shrink-0 mt-0.5" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />
          </div>
        </Section>

        {/* Dept-specific difference vs other internships — dark zigzag rows */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Other Internships vs. TFD — {track.label} Specifically</h2>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">Exactly what's different about how {track.label.toLowerCase()} work is taught here.</p>
            </motion.div>
            <div key={`diff-${lang}`} className="space-y-4">
              {c.differenceVsOthers.map((row, i) => {
                const reversed = i % 2 === 1;
                return (
                  <div key={row.feature} className={`flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0 rounded-2xl border border-white/10 overflow-hidden ${reversed ? "sm:flex-row-reverse" : ""}`}>
                    <div className="sm:w-2/5 p-4 bg-[#0B1424] flex flex-col justify-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/35 mb-1.5 flex items-center gap-1.5"><XCircle size={13} /> Other Internships</p>
                      <p className="text-sm text-white/50 leading-relaxed">{row.other}</p>
                    </div>
                    <div className="sm:w-1/5 flex items-center justify-center py-2 sm:py-0 bg-[#050B16]">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-white/50 text-center px-2">{row.feature}</p>
                    </div>
                    <div className="sm:w-2/5 p-4 bg-[#0B1424] border-l-2 border-[#14E0A0]/40 flex flex-col justify-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-1.5 flex items-center gap-1.5"><CheckCircle size={13} /> TFD</p>
                      <p className="text-sm text-white/85 leading-relaxed">{row.tfd}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Market gap + how we fill it — split */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <Split
              key={`gap-${lang}`}
              left={
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/40 mb-2">The Gap In The Market</p>
                  <p className="text-white/60 text-base leading-relaxed">{c.marketGap}</p>
                </div>
              }
              right={
                <div className="rounded-2xl border border-[#14E0A0]/25 bg-[#14E0A0]/[0.06] p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-2">How TFD Fills It</p>
                  <p className="text-white/80 text-base leading-relaxed">{c.howWeFillIt}</p>
                </div>
              }
            />
          </div>
        </Section>

        {/* Daily report / scorecard / certificate — split */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <Split
              left={
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Track Your Own Progress, Every Day</h2>
                  <p className="text-white/55 text-base leading-relaxed mb-3">
                    Your dashboard shows a live daily report — what's done, what's pending, and your running score — so you (and your college, if needed) always know exactly where you stand, not just at the end.
                  </p>
                  <p className="text-white/55 text-base leading-relaxed">
                    Graduate, and your final scorecard becomes your official Report of Progress, a Letter/Certificate, and a permanent QR-verifiable record any recruiter can check in seconds.
                  </p>
                </div>
              }
              reverse
              right={
                <div className="relative rounded-2xl overflow-hidden border border-[#14E0A0]/25 bg-gradient-to-b from-[#14E0A0]/[0.06] to-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0]"><Award size={20} /></div>
                    <div>
                      <p className="font-bold text-base">{track.label} Track Certificate</p>
                      <p className="text-white/40 text-sm">90-Day Program · QR-Verified</p>
                    </div>
                  </div>
                  <div className="mb-1 flex justify-between text-sm"><span className="text-white/50">Program Score</span><span className="text-[#14E0A0] font-bold">88.2%</span></div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4"><div className="h-full w-[88%] bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" /></div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-white/5 py-2.5"><FileText size={15} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-[11px] text-white/40">Daily Report</p></div>
                    <div className="rounded-lg bg-white/5 py-2.5"><QrCode size={15} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-[11px] text-white/40">QR Certificate</p></div>
                  </div>
                </div>
              }
            />
          </div>
        </Section>

        {/* 90-day roadmap */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Your {track.label} Roadmap, Day By Day</h2>
            </motion.div>
            <div key={`roadmap-${lang}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {c.roadmap.map((r) => (
                <div key={r.phase} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-2">{r.phase}</p>
                  <p className="text-white/60 text-sm leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Growth after 90 days + skill radar — split */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <Split
              key={`growth-${lang}`}
              left={
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">What Grows In 90 Days</h2>
                  <div className="space-y-4">
                    {c.growth.map((g) => (
                      <div key={g.skill} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-base font-bold text-[#14E0A0] mb-1">{g.skill}</p>
                        <p className="text-white/55 text-sm leading-relaxed mb-1"><span className="text-white/35 font-semibold">How: </span>{g.how}</p>
                        <p className="text-white/55 text-sm leading-relaxed"><span className="text-white/35 font-semibold">Why it matters: </span>{g.why}</p>
                      </div>
                    ))}
                  </div>
                </div>
              }
              right={<SkillRadar axes={c.chartAxes} />}
            />
          </div>
        </Section>

        {/* Apply now */}
        <Section className="border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Ready for the {track.label} Track?</h2>
            <p className="text-white/50 text-base mb-7">₹5,000 for 90 days — seats are limited per batch.</p>
            <button
              onClick={() => navigate(`/internship/apply?track=${track.value}`)}
              className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-base px-7 py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all hover:scale-[1.03]"
            >
              Apply for {track.label} <ArrowUpRight size={18} />
            </button>
          </div>
        </Section>

        <footer className="px-5 py-10 border-t border-white/10 text-center">
          <p className="text-white/25 text-xs">Powered by The Financial Doctor</p>
        </footer>
      </div>
    </div>
  );
}
