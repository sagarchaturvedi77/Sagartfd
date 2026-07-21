import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { LINKS } from "../lib/links";
import {
  ArrowLeft, ArrowUpRight, ShieldCheck, Languages, XCircle, CheckCircle,
  TrendingUp, Landmark, Megaphone, Heart, Star, Users2,
  ClipboardCheck, GraduationCap, BadgeCheck, Sparkles, Briefcase, Smartphone,
  MessageSquare, Calculator, HandCoins, PenTool, Mic2, Puzzle,
  FileText, ThumbsUp, Network, Video, LayoutDashboard, Rocket,
  Trophy, Award, QrCode, CheckCircle2, Flame, Target,
  Instagram, Youtube, Linkedin, Mail,
} from "lucide-react";

const FOOTER_TRACKS = [
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
];

const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";

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

    // Users with "reduce motion" set at the OS level get a single static
    // frame instead of a continuously animating canvas — no rAF loop is
    // ever started for them, so there's nothing to drain battery.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function drawStaticFrame() {
      ctx.clearRect(0, 0, width, height);
      for (const l of labels) {
        ctx.fillStyle = `rgba(20, 224, 160, ${l.opacity})`;
        ctx.font = `bold ${l.size}px monospace`;
        ctx.fillText(l.text, l.x, l.y);
      }
      for (const p of particles) {
        ctx.fillStyle = "rgba(20, 224, 160, 0.85)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function handleVisibilityChange() {
      if (reducedMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      } else if (!animationFrame) {
        draw();
      }
    }

    init();
    if (reducedMotion) {
      drawStaticFrame();
    } else if (!document.hidden) {
      draw();
    }
    window.addEventListener("resize", init);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("resize", init);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

// Every card array below carries both an English and a Hinglish copy of
// its title/text (title_hi/text_hi/label_hi) so the header's EN/Hinglish
// toggle can swap 100% of the page, not just the hero/comparison/pricing
// blocks — picked at render time via `pick(item, "title", lang)` below.
function pick(item, field, lang) {
  if (lang === "hinglish" && item[`${field}_hi`]) return item[`${field}_hi`];
  return item[field];
}

const HOW_WE_WORK = [
  { icon: ClipboardCheck, title: "Apply & Secure Your Slot", text: "Sign up, pick your track, and reserve your seat for the next 90-day batch.",
    title_hi: "Apply Karo & Apna Slot Secure Karo", text_hi: "Sign up karo, apna track pick karo, aur agle 90-din ke batch mein apni seat reserve karo." },
  { icon: Users2, title: "Get Matched With Real Work", text: "Every intern gets their own set of practical, domain-specific tasks — no two journeys are identical.",
    title_hi: "Real Work Ke Saath Match Ho Jao", text_hi: "Har intern ko apne practical, domain-specific tasks milte hain — koi do journeys ek jaisi nahi hoti." },
  { icon: GraduationCap, title: "Learn, Execute, Get Evaluated", text: "Short practical lessons, real tasks, and weekly quizzes keep you progressing day by day.",
    title_hi: "Sikho, Karo, Evaluate Ho Jao", text_hi: "Short practical lessons, real tasks, aur weekly quizzes se aap din-ba-din aage badhte ho." },
  { icon: BadgeCheck, title: "Graduate With a Verified Certificate", text: "Finish your program and receive a certificate with a public QR audit trail employers can verify instantly.",
    title_hi: "Verified Certificate Ke Saath Graduate Karo", text_hi: "Apna program finish karo aur ek aisa certificate paao jise employers QR code se instantly verify kar sakein." },
  { icon: Video, title: "Share a Video Review at the End", text: "Near the end of your internship, share a short review video of your experience — small clips from wherever you were working are welcome. Just a link, no big upload.",
    title_hi: "Aakhir Mein Ek Video Review Do", text_hi: "Internship khatam hone ke kareeb, apne experience ka ek chhota video review share karo — jahan se bhi kaam kiya wahan ke clips chalenge. Bas ek link, koi bada upload nahi." },
];

const WHY_JOIN = [
  { icon: Briefcase, title: "Real Corporate Exposure", text: "Work on genuine client-facing and hands-on tasks, not busywork — the kind of experience that actually shows up on a resume.",
    title_hi: "Real Corporate Exposure", text_hi: "Genuine client-facing aur hands-on tasks pe kaam karo, busywork nahi — waisa experience jo resume mein actually dikhta hai." },
  { icon: ClipboardCheck, title: "Instant, Automatic Feedback", text: "Every task is auto-verified the moment you submit — no waiting days for a reviewer to get back to you.",
    title_hi: "Instant, Automatic Feedback", text_hi: "Submit karte hi har task auto-verify ho jaata hai — kisi reviewer ka din-din intezaar nahi karna padta." },
  { icon: Star, title: "Mentorship That Matters", text: "Guidance from people who actually work in mutual funds, insurance, marketing, and finance — not generic course content.",
    title_hi: "Mentorship Jo Matter Karti Hai", text_hi: "Un logon se guidance jo actually mutual funds, insurance, marketing, aur finance mein kaam karte hain — generic course content nahi." },
  { icon: Sparkles, title: "A Certificate Employers Trust", text: "Publicly verifiable via QR — no more \"is this internship even real?\" doubts from recruiters.",
    title_hi: "Ek Certificate Jispe Employers Trust Karte Hain", text_hi: "QR se publicly verifiable — recruiters ke \"kya ye internship real bhi hai?\" wale doubts khatam." },
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
  { icon: MessageSquare, label: "Professional Communication", label_hi: "Professional Communication" },
  { icon: Calculator, label: "Financial & Market Literacy", label_hi: "Financial & Market Literacy" },
  { icon: HandCoins, label: "Sales & Client Handling", label_hi: "Sales & Client Handling" },
  { icon: Users2, label: "Team Coordination", label_hi: "Team Coordination" },
  { icon: PenTool, label: "MS Excel & Reporting", label_hi: "MS Excel & Reporting" },
  { icon: Mic2, label: "Public Speaking & Pitching", label_hi: "Public Speaking & Pitching" },
  { icon: Puzzle, label: "Real-World Problem Solving", label_hi: "Real-World Problem Solving" },
  { icon: FileText, label: "Business Email Writing", label_hi: "Business Email Writing" },
];

const GROWTH_BENEFITS = [
  { icon: FileText, title: "A Resume That Actually Stands Out", text: "Not \"attended internship\" — a verifiable record of real tasks completed, gradeable and QR-checkable by any recruiter or college placement cell.",
    title_hi: "Ek Resume Jo Actually Stand Out Kare", text_hi: "\"Internship attend ki\" nahi — real tasks completed ka verifiable record, jise koi bhi recruiter ya college placement cell QR se check kar sake." },
  { icon: ThumbsUp, title: "Letter of Recommendation", text: "Consistently strong performers can earn a personal recommendation letter — genuinely useful for higher studies or your first job application.",
    title_hi: "Letter of Recommendation", text_hi: "Consistently strong performers ek personal recommendation letter earn kar sakte hain — higher studies ya first job application ke liye genuinely useful." },
  { icon: Briefcase, title: "A Shot at Working With TFD", text: "Standout interns are considered first when we hire for Sales, Marketing, HR, or Finance roles at The Financial Doctor.",
    title_hi: "TFD Ke Saath Kaam Karne Ka Mauka", text_hi: "Jab TFD Sales, Marketing, HR, ya Finance roles ke liye hire karta hai, standout interns ko sabse pehle consider kiya jaata hai." },
  { icon: Network, title: "A Professional Network, Early", text: "Direct interaction with working professionals and mentors — the kind of network most students only start building after college.",
    title_hi: "Ek Professional Network, Jaldi", text_hi: "Working professionals aur mentors se direct interaction — waisa network jo zyada tar students college ke baad hi banana shuru karte hain." },
];

// Tabs for the merged "Program Highlights" section — combines what used to
// be three separate full-width sections (Why Join / Skills / Growth) behind
// one tab switcher, so the page reads shorter without cutting any content.
const HIGHLIGHT_TABS = [
  { key: "why", label: "Why Join", label_hi: "Kyun Join Karein" },
  { key: "skills", label: "Skills You'll Build", label_hi: "Skills Jo Banoge" },
  { key: "growth", label: "Your Growth", label_hi: "Aapki Growth" },
];

const MOBILE_SCREENS = [
  { key: "overview", label: "Overview", label_hi: "Overview", icon: LayoutDashboard },
  { key: "missions", label: "Missions", label_hi: "Missions", icon: Rocket },
  { key: "leaderboard", label: "Radar", label_hi: "Radar", icon: Trophy },
  { key: "certificate", label: "Certificate", label_hi: "Certificate", icon: Award },
];

// Every static section heading/label/button on the page (everything that
// ISN'T already one of the per-lang content dicts above) lives here, so
// the EN/Hinglish toggle switches the whole page, not just hero/comparison/
// pricing — that was the reported bug (only half the page used to switch).
const UI_TEXT = {
  english: {
    applicationsOpen: "Applications Open",
    studentLogin: "Student Login",
    home: "Home",
    chooseTrackTitle: "Choose Your Track",
    chooseTrackSub: "Four specialisations, four different 90-day roadmaps. Open one to see exactly what you'll work on, day by day.",
    openSeeDetails: "Open & See Details",
    swipeTracks: "Swipe to see all 4 tracks →",
    madeInIndiaTitle: "Proudly Built for Indian Students",
    madeInIndiaBody: "Designed in India, priced in rupees, mentored by people who work in Indian finance and business — not a generic template borrowed from anywhere else. This is India's internship program, built the way it should be.",
    swipePoints: "Swipe for all 10 points →",
    howWeWorkTitle: "How We Work",
    howWeWorkSub: "From sign-up to certificate, here's exactly what your program looks like.",
    swipeSteps: "Swipe through all 5 steps →",
    highlightsTitle: "Program Highlights",
    highlightsSub: "Why you should join, what you'll actually learn, and where it takes you next.",
    swipeMore: "Swipe to see more →",
    mobileFirstTag: "Built Mobile-First",
    mobilePreviewTitle: "Your Whole Internship, In Your Pocket",
    mobilePreviewSub: "Log in after signing up and here's exactly what you'll see — your real progress, missions, skill radar, and certificate, live.",
    certTitle: "See What a Verified Certificate Looks Like",
    certSub: "Anyone — a recruiter, a college, or you yourself — can search your certificate number and see the full, real story behind it.",
    certButton: "Open the Real Verification Page",
    programScore: "Program Score",
    tasksDone: "Tasks Done",
    quizzesPassed: "Quizzes Passed",
    collegeIdOnFile: "College ID",
    onFile: "On File",
    finalCtaTitle: "Ready to Start Your Internship?",
    finalCtaSub: "India ka best internship program — seats are limited per batch. Pick your track and secure your slot today.",
    applyNow: "Apply Now",
    alreadyWithUs: "Already With Us?",
    alreadyHaveAccount: "Already have an account?",
    logInHere: "Log in here",
    verifyCert: "Verify Your Certificate",
    footerTagline: "India ka best internship program — proudly built for Indian students. Internship karo, seekho, aur aage badho.",
    footerTracks: "Tracks",
    footerProgram: "Program",
    footerContact: "Contact",
    footerVerify: "Verify Certificate",
    footerMainSite: "TFD Main Site",
    poweredBy: "Powered by The Financial Doctor · ARN-290298",
    allRightsReserved: "All rights reserved.",
  },
  hinglish: {
    applicationsOpen: "Applications Open Hain",
    studentLogin: "Student Login",
    home: "Home",
    chooseTrackTitle: "Apna Track Choose Karo",
    chooseTrackSub: "Chaar specialisations, chaar alag 90-din ke roadmaps. Ek kholo aur dekho ki din-ba-din exactly kya kaam karoge.",
    openSeeDetails: "Kholo & Details Dekho",
    swipeTracks: "Sabhi 4 tracks dekhne ke liye swipe karo →",
    madeInIndiaTitle: "Proudly Built for Indian Students",
    madeInIndiaBody: "India mein design kiya gaya, rupaye mein priced, aur un logon se mentor kiya jaata hai jo Indian finance aur business mein kaam karte hain — kahin se copy kiya gaya generic template nahi. Yeh India ka internship program hai, jaisa hona chahiye waisa banaya gaya.",
    swipePoints: "Sabhi 10 points ke liye swipe karo →",
    howWeWorkTitle: "Hum Kaise Kaam Karte Hain",
    howWeWorkSub: "Sign-up se lekar certificate tak, yeh hai aapka program bilkul exactly kaisa dikhega.",
    swipeSteps: "Sabhi 5 steps ke liye swipe karo →",
    highlightsTitle: "Program Highlights",
    highlightsSub: "Kyun join karna chahiye, kya actually seekhoge, aur aage kahan le jaayega.",
    swipeMore: "Aur dekhne ke liye swipe karo →",
    mobileFirstTag: "Mobile-First Banaya Gaya",
    mobilePreviewTitle: "Aapki Poori Internship, Aapki Jeb Mein",
    mobilePreviewSub: "Sign up karne ke baad login karo aur yeh hai bilkul jo dikhega — aapki real progress, missions, skill radar, aur certificate, live.",
    certTitle: "Dekho Ek Verified Certificate Kaisa Dikhta Hai",
    certSub: "Koi bhi — recruiter, college, ya khud aap — apna certificate number search karke iske peeche ki poori, real story dekh sakte hain.",
    certButton: "Real Verification Page Kholo",
    programScore: "Program Score",
    tasksDone: "Tasks Complete",
    quizzesPassed: "Quizzes Pass Kiye",
    collegeIdOnFile: "College ID",
    onFile: "File Mein Hai",
    finalCtaTitle: "Apni Internship Shuru Karne Ke Liye Ready Ho?",
    finalCtaSub: "India ka best internship program — seats har batch mein limited hain. Apna track pick karo aur aaj hi apni slot secure karo.",
    applyNow: "Apply Karo",
    alreadyWithUs: "Pehle Se Hamare Saath Ho?",
    alreadyHaveAccount: "Pehle se account hai?",
    logInHere: "Yahan login karo",
    verifyCert: "Apna Certificate Verify Karo",
    footerTagline: "India ka best internship program — proudly built for Indian students. Internship karo, seekho, aur aage badho.",
    footerTracks: "Tracks",
    footerProgram: "Program",
    footerContact: "Contact",
    footerVerify: "Certificate Verify Karo",
    footerMainSite: "TFD Main Site",
    poweredBy: "Powered by The Financial Doctor · ARN-290298",
    allRightsReserved: "Sabhi rights reserved.",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

// Full-page EN/Hinglish language toggle — both versions are pre-written
// below and the toggle just switches which one renders, no translation
// API involved. Keep every {LANG}_CONTENT dictionary keyed "english" /
// "hinglish" so the lookup pattern stays identical everywhere it's used.
const HERO_CONTENT = {
  english: {
    headline: "Don't Just Get a Certificate. Build Your Ultimate Corporate Value.",
    subheadline: "Strict 90-Day High-Impact Management Residency",
    body: [
      "Every company today wants Trained Employees — they don't have the time to train you from zero. Walk into the corporate world unprepared, and you'll be left behind.",
      "The TFD Internship isn't a time-pass program — it's your professional launchpad. Here, you'll learn how work actually happens in the corporate world, how to communicate with seniors, and how to build your value from Day 1.",
      "Our simple rule: Learn first → Then try → If it doesn't work, learn again and become the best in your field.",
      "When you walk out after 90 days, you won't be a raw student — you'll walk out corporate-ready, knowing your worth and how to grow it.",
    ],
  },
  hinglish: {
    headline: "Sirf Certificate Nahi - Apni Corporate Value Banao",
    subheadline: "Strict 90-Din Ka High-Impact Management Residency",
    body: [
      "Har company ko aaj chahiye Trained Employees - unke paas aapko zero se sikhane ka waqt nahi hai. Bina preparation ke corporate world mein jaoge, toh peeche reh jaoge.",
      "TFD Internship koi time-pass nahi hai - yeh aapka professional launchpad hai. Yahan aap seekhoge ki corporate life mein kaam kaise hota hai, seniors se kaise baat ki jaati hai, aur din 1 se hi apni value kaise banayi jaati hai.",
      "Humara simple rule: Pehle sikho → Fir try karo → Agar nahi hota, fir se sikho aur apni field ka best bano.",
      "90 din baad jab nikaloge, ek raw student nahi - ek corporate-ready professional ban kar nikaloge, jo apni value pehchaanta hai aur usse badhana jaanta hai.",
    ],
  },
};

const COMPARISON_TABLE = {
  english: {
    heading: "Other Internships vs. TFD",
    subheading: "See the difference before you pick where to spend your 90 days.",
    otherLabel: "Other Internships",
    tfdLabel: "TFD Premium Internship",
    whyDifferent: [
      { icon: Sparkles, title: "Why We're Different", text: "Most internships are unpaid busywork with a certificate at the end. TFD is a structured residency — you're taught first, then made to actually execute, on tools real companies use." },
      { icon: Trophy, title: "Why We're the Best", text: "Instant AI-graded feedback, a public QR-verifiable certificate, and zero copy-paste — no other internship in this space checks all three boxes at once." },
      { icon: HandCoins, title: "What You Get Out of It", text: "A resume line any HR can verify in seconds, real corporate-communication skills, and — for standout performers — a shot at an actual role with TFD." },
    ],
    rows: [
      { feature: "Work Profile", other: "Boring desk tasks, data-entry, copy-paste", tfd: "Real corporate simulation — live dashboards, actual business tools" },
      { feature: "Learning Culture", other: "“Just give me a certificate” attitude", tfd: "Structured learning — taught first, then made to execute" },
      { feature: "Evaluation", other: "Generic certificate after 3 months", tfd: "AI-powered instant feedback + Skill Radar Chart — a live graph of communication, problem-solving, financial literacy" },
      { feature: "Market Value", other: "HR glances and ignores the resume", tfd: "Permanent public verification — any HR can verify via QR code (thefinancialdoctor.in/verify) for instant trust" },
      { feature: "Academic Integrity", other: "Copy-paste from ChatGPT is common and unchecked", tfd: "Anti-cheat workspace — every submission is typed live, no pasting allowed" },
      { feature: "Progress Tracking", other: "No visibility until the final week, if at all", tfd: "Daily progress report — you (and your college) can see exactly where you stand, every single day" },
      { feature: "Mentorship", other: "A generic coordinator who checks attendance", tfd: "Guidance from people who actually work in mutual funds, insurance, marketing, and finance" },
      { feature: "Structure", other: "One long, undifferentiated task dump", tfd: "A real 90-day arc — guided fundamentals, independent execution, then a capstone project" },
      { feature: "Career Impact", other: "Ends the day it ends — no further connection", tfd: "Standout interns are considered first when TFD hires for Sales, Marketing, HR, or Finance roles" },
      { feature: "Cost Transparency", other: "Vague \"registration fee\" with no breakdown", tfd: "Every rupee explained — workspace portal, dashboards, anti-cheat infra, and certificate verification network" },
    ],
  },
  hinglish: {
    heading: "Other Internships vs. TFD",
    subheading: "Apne 90 din kahan invest karne hain, decide karne se pehle fark dekho.",
    otherLabel: "Other Internships",
    tfdLabel: "TFD Premium Internship",
    whyDifferent: [
      { icon: Sparkles, title: "Hum Alag Kyun Hain", text: "Zyada tar internships unpaid busywork hoti hain, end mein bas ek certificate. TFD ek structured residency hai - pehle sikhaya jaata hai, phir asli tools pe execute karwaya jaata hai, jo real companies use karti hain." },
      { icon: Trophy, title: "Hum Best Kyun Hain", text: "Instant AI-graded feedback, public QR-verifiable certificate, aur zero copy-paste - is space mein koi aur internship teeno cheezein ek saath nahi deti." },
      { icon: HandCoins, title: "Aapko Kya Milta Hai", text: "Ek resume line jo koi bhi HR seconds mein verify kar sake, real corporate-communication skills, aur - standout performers ke liye - TFD mein actual role paane ka mauka." },
    ],
    rows: [
      { feature: "Work Profile", other: "Boring desk tasks, data-entry, copy-paste", tfd: "Real corporate simulation — live dashboards, actual business tools" },
      { feature: "Learning Culture", other: "“Bas certificate de do” wala attitude", tfd: "Structured learning — pehle sikhaya jaata hai, phir execute karwaya jaata hai" },
      { feature: "Evaluation", other: "3 mahine baad ek generic certificate", tfd: "AI-powered instant feedback + Skill Radar Chart — live graph" },
      { feature: "Market Value", other: "HR resume dekh ke ignore kar dete hain", tfd: "Permanent public verification — QR code se koi bhi HR verify kar sakta hai, instant trust" },
      { feature: "Academic Integrity", other: "ChatGPT se copy-paste common hai aur koi check nahi", tfd: "Anti-cheat workspace — har submission live typed hoti hai, paste allowed nahi" },
      { feature: "Progress Tracking", other: "Final week tak koi visibility nahi, agar milti bhi ho", tfd: "Daily progress report — aap (aur aapka college) roz dekh sakte ho aap kahan khade ho" },
      { feature: "Mentorship", other: "Ek generic coordinator jo bas attendance check karta hai", tfd: "Un logon se guidance jo actually mutual funds, insurance, marketing, aur finance mein kaam karte hain" },
      { feature: "Structure", other: "Ek lamba, bina structure ka task dump", tfd: "Ek real 90-din ka arc — guided fundamentals, independent execution, phir capstone project" },
      { feature: "Career Impact", other: "Jis din khatam, us din se koi connection nahi", tfd: "Standout interns ko TFD Sales, Marketing, HR, ya Finance roles ke liye hire karte waqt pehle consider karta hai" },
      { feature: "Cost Transparency", other: "Vague \"registration fee\" bina kisi breakdown ke", tfd: "Har rupaya explain kiya gaya — workspace portal, dashboards, anti-cheat infra, aur certificate verification network" },
    ],
  },
};

const PRICING_PITCH = {
  english: {
    heading: "What Does ₹5,000 Actually Cover?",
    copy: "TFD doesn't charge for training or mentorship — that's free. The ₹5,000 you pay covers your personalized secure workspace portal, live reporting dashboard access, anti-cheat technology infrastructure, and your certificate's permanent verification-network cost. This investment is what takes you into a premium corporate environment and elevates your market value.",
    cta: "Choose 90 Days",
  },
  hinglish: {
    heading: "₹5,000 Mein Kya Milta Hai?",
    copy: "TFD training ya mentorship ka koi charge nahi leta - yeh free hai. Jo ₹5,000 aap pay karte hain, woh hai: aapka personalized secure workspace portal, live reporting dashboard, anti-cheat infrastructure, aur certificate ki permanent verification-network cost. Yeh investment aapko premium corporate environment aur badhi hui market-value deta hai.",
    cta: "90 Din Choose Karo",
  },
};

function Section({ children, className = "" }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`px-5 py-8 sm:py-10 border-t border-white/5 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function MobileScreenContent({ screen }) {
  if (screen === "overview") {
    return (
      <div className="p-3.5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-[#14E0A0]/15 to-transparent border border-[#14E0A0]/20 p-3">
          <p className="text-[11px] text-white/50">Program Progress</p>
          <p className="text-xl font-bold text-white">Day 36 <span className="text-xs text-white/40 font-normal">of 90</span></p>
          <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full w-[40%] bg-[#14E0A0] rounded-full" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2.5 text-center"><Flame size={15} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-sm font-bold text-white">6-Day</p><p className="text-[10px] text-white/40">Streak</p></div>
          <div className="rounded-lg bg-white/5 p-2.5 text-center"><Target size={15} className="text-[#14E0A0] mx-auto mb-1" /><p className="text-sm font-bold text-white">560 pts</p><p className="text-[10px] text-white/40">Earned</p></div>
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
              {i === 0 ? <CheckCircle2 size={15} /> : <Rocket size={13} />}
            </div>
            <p className="text-xs text-white/75 leading-tight">{t}</p>
          </div>
        ))}
      </div>
    );
  }
  if (screen === "leaderboard") {
    const axes = ["Comm", "Finance", "Tech", "Integrity", "Speed"];
    return (
      <div className="p-3.5">
        <p className="text-[11px] text-white/50 mb-2">Your Skill Radar</p>
        <div className="rounded-xl bg-white/5 p-3 flex items-center justify-center h-28 mb-2.5">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <polygon points="50,8 90,35 76,88 24,88 10,35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="50,30 74,42 66,78 34,78 26,42" fill="#14E0A0" fillOpacity="0.35" stroke="#14E0A0" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1">
          {axes.map((a) => <span key={a} className="text-[10px] text-white/40 bg-white/5 rounded-full px-1.5 py-0.5">{a}</span>)}
        </div>
      </div>
    );
  }
  return (
    <div className="p-3.5">
      <div className="rounded-xl bg-gradient-to-br from-[#14E0A0]/15 to-transparent border border-[#14E0A0]/25 p-3.5 text-center">
        <Award size={24} className="text-[#14E0A0] mx-auto mb-2" />
        <p className="text-sm font-bold text-white">Program Score: 88.2%</p>
        <p className="text-[10px] text-white/40 mt-1">TFD/INTP/2026/851840</p>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-[#14E0A0] font-semibold">
          <QrCode size={13} /> QR-Verifiable Certificate
        </div>
      </div>
    </div>
  );
}

export default function InternshipLandingPage() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState("overview");
  const [lang, setLang] = useState("english");
  const [highlightTab, setHighlightTab] = useState("why");
  const hero = HERO_CONTENT[lang];
  const comparison = COMPARISON_TABLE[lang];
  const pricingPitch = PRICING_PITCH[lang];
  const t = UI_TEXT[lang];

  return (
    <div className="min-h-screen bg-[#050B16] text-white overflow-x-hidden relative">
      <SEO
        title="TFD Internship 2026 | 90-Day Finance, HR, Marketing & Sales Internship with Certificate"
        description="India's most verified 90-day internship program — real corporate tasks in Finance, HR, Marketing & Sales, weekly evaluation, mentorship, and a QR-verifiable certificate employers trust."
        keywords="internship 2026, online internship with certificate, finance internship, HR internship, marketing internship, sales internship, internship near me, summer internship India, internship in mutual fund company, verified internship certificate, internship with stipend, internship for college students, best internship program India, corporate internship program, work from home internship, internship in Madhya Pradesh, internship in Sehore"
        path="/internship"
        ogImage={`https://thefinancialdoctor.in${INTERNSHIP_LOGO_URL}`}
      />
      <NetworkBackground />

      <div className="relative z-10">
        {/* Top bar — fixed so it always stays pinned while scrolling; the
            spacer div right after it reserves the same height in normal
            flow so content doesn't jump underneath it. Rendered via a portal
            straight into document.body — same reason as NetworkBackground
            above: this page's root wrapper is `position:relative` +
            `overflow-x-hidden`, which clips `position:fixed` descendants on
            iOS Safari, so the nav has to escape that subtree entirely. */}
        {createPortal(
          <div className="fixed top-0 left-0 right-0 z-30 h-16 flex items-center backdrop-blur-md bg-[#050B16]/85 border-b border-white/10">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-[#14E0A0] font-bold text-base sm:text-lg tracking-wider border border-[#14E0A0]/30 px-2.5 py-1 rounded-lg bg-[#14E0A0]/5">
                  TFD <span className="text-white text-xs sm:text-sm font-semibold border-l border-[#14E0A0]/30 pl-1.5 ml-1">INTERNSHIP</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-[#14E0A0]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14E0A0] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14E0A0]" />
                  </span>
                  {t.applicationsOpen}
                </span>

                {/* Full-page EN/Hinglish toggle — switches every pre-written
                    text block on this page at once, no translation API. */}
                <div
                  role="group"
                  aria-label="Page language"
                  className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5"
                >
                  <button
                    onClick={() => setLang("english")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors ${
                      lang === "english" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"
                    }`}
                  >
                    <Languages size={13} className="hidden sm:inline" /> EN
                  </button>
                  <button
                    onClick={() => setLang("hinglish")}
                    className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors ${
                      lang === "hinglish" ? "bg-[#14E0A0] text-[#050B16]" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Hinglish
                  </button>
                </div>

                <button
                  onClick={() => navigate("/internship/login")}
                  className="text-sm sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
                >
                  {t.studentLogin}
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-1.5 text-sm sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} /> <span className="hidden sm:inline">{t.home}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        <div className="h-16" aria-hidden="true" />

        {/* Hero — left-aligned split-grid (~65/35), the same asymmetric
            pattern Stripe/Notion-style SaaS pages use: strict left-aligned
            headline/motivation copy on the wide side, a pinned action card
            on the narrow side. Not an even 50/50 split, and not centered —
            the container runs edge-to-edge (no mx-auto max-width squeeze)
            so the asymmetry actually reads on a real desktop screen. */}
        <section className="relative px-5 sm:px-10 lg:px-16 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-16 items-start relative">
            <div className="text-left max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-start gap-3 mb-5"
              >
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.03, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white rounded-2xl p-2 shadow-[0_0_35px_rgba(20,224,160,0.3)] shrink-0"
                >
                  <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-10 sm:h-12 w-auto object-contain" />
                </motion.div>
                <div className="text-left leading-tight">
                  <div className="text-xl sm:text-2xl font-bold text-white">TFD Internship</div>
                  <div className="text-sm sm:text-sm text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
                </div>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-[#14E0A0] bg-[#14E0A0]/10 border border-[#14E0A0]/30 rounded-full px-4 py-1.5 mb-6"
              >
                {hero.subheadline}
              </motion.span>
              <motion.h1
                key={`headline-${lang}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-sans text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6"
              >
                {hero.headline}
              </motion.h1>
              <motion.div
                key={`body-${lang}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/60 text-base sm:text-lg mb-8 leading-relaxed space-y-4 text-left"
              >
                {hero.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-2 text-[#14E0A0] text-base font-semibold"
              >
                <ArrowUpRight size={18} />
                <span>Seats fill up every batch — apply on the right, our team confirms within hours.</span>
              </motion.div>
            </div>

            {/* Right column — pinned action card. This is the conversion
                element (price + Apply CTA up top), not just decoration —
                sticky on desktop so it stays in view as the left column's
                longer copy scrolls past it. */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 lg:mt-0 lg:sticky lg:top-24"
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-[#14E0A0]/10 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-3xl border border-[#14E0A0]/30 bg-white/[0.04] backdrop-blur-md p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wide text-white/45 mb-3">90-Day Program</p>
                <p className="text-4xl font-bold text-white mb-1">₹5,000</p>
                <p className="text-white/40 text-sm mb-5">One-time, all-inclusive</p>
                <button
                  onClick={() => navigate("/internship/apply")}
                  className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-base px-6 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(20,224,160,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
                >
                  Apply Now <ArrowUpRight size={18} />
                </button>

                <p className="text-xs font-bold uppercase tracking-wide text-white/45 mb-3">Live Program Snapshot</p>
                <div className="rounded-2xl bg-gradient-to-br from-[#14E0A0]/15 to-transparent border border-[#14E0A0]/20 p-4 mb-4">
                  <p className="text-[11px] text-white/50">Program Progress</p>
                  <p className="text-2xl font-bold text-white">Day 36 <span className="text-sm text-white/40 font-normal">of 90</span></p>
                  <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <div className="h-full w-[40%] bg-[#14E0A0] rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <Flame size={17} className="text-[#14E0A0] mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">6-Day Streak</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <Target size={17} className="text-[#14E0A0] mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">560 pts Earned</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {STATS.map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] py-2.5 px-2 text-center">
                      <div className="text-lg font-bold text-[#14E0A0]">{s.value}</div>
                      <div className="text-[11px] text-white/45 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Choose Your Track — moved up right after the hero. Each card
            links to its own dedicated department page (full breakdown,
            roadmap, market-gap pitch, chart, and its own Apply Now), not an
            inline panel — click straight through, no in-page tab state. */}
        <Section className="pt-4 border-t-0">
          <div className="max-w-5xl mx-auto">
            <motion.div key={`track-head-${lang}`} variants={fadeUp} className="text-center mb-5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.chooseTrackTitle}</h2>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">
                {t.chooseTrackSub}
              </p>
            </motion.div>
            {/* Mobile: horizontal snap-scroll carousel (swipe through tracks).
                Desktop (sm+): plain 4-up grid — the same data, two distinct
                interaction patterns rather than one squeezed layout. */}
            <div className="flex sm:grid sm:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
              {TRACKS.map((track, i) => (
                <motion.div
                  key={track.value}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-full sm:w-auto shrink-0 sm:shrink snap-start rounded-2xl p-5 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-[#14E0A0]/50 hover:shadow-[0_10px_30px_rgba(20,224,160,0.15)] transition-all cursor-pointer"
                  onClick={() => navigate(`/internship/tracks/${track.value}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-3">
                    <track.icon size={20} />
                  </div>
                  <p className="text-sm sm:text-base font-semibold leading-snug mb-1.5">{track.label}</p>
                  <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#14E0A0]">
                    {t.openSeeDetails} <ArrowUpRight size={13} />
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="sm:hidden text-center text-[11px] text-white/40 mt-2">{t.swipeTracks}</p>
          </div>
        </Section>

        {/* Made in India strip */}
        <Section className="pt-4 border-t-0">
          <div className="max-w-3xl mx-auto">
            <motion.div
              key={`made-in-india-${lang}`}
              variants={fadeUp}
              className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03]"
            >
              <div className="h-1.5 w-full flex">
                <div className="flex-1 bg-[#FF9933]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#138808]" />
              </div>
              <div className="px-6 py-7 sm:py-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-[#14E0A0]/10 border border-[#14E0A0]/25 flex items-center justify-center text-[#14E0A0] text-3xl font-bold shrink-0">
                  ₹
                </div>
                <div>
                  <p className="font-display text-lg sm:text-xl font-bold">{t.madeInIndiaTitle}</p>
                  <p className="text-white/50 text-sm sm:text-base mt-1 leading-relaxed">
                    {t.madeInIndiaBody}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Why we're different / best / your benefit */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div key={`why-head-${lang}`} variants={fadeUp} className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{comparison.heading}</h2>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">{comparison.subheading}</p>
            </motion.div>
            <div key={`why-cards-${lang}`} className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0 mb-8">
              {comparison.whyDifferent.map((w, i) => (
                <motion.div key={w.title} custom={i} variants={fadeUp} className="w-full sm:w-auto shrink-0 sm:shrink snap-start rounded-2xl p-6 bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#14E0A0]/40 hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-4">
                    <w.icon size={22} />
                  </div>
                  <h3 className="font-bold text-base mb-2">{w.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{w.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Comparison grid — mobile: swipe carousel (one card per
                feature); desktop: 2 cards per row so 10 points fit in 5
                rows of height instead of 10. Each card contrasts Other
                (muted) vs TFD (highlighted) side by side inside itself. */}
            <div key={`cmp-rows-${lang}`} className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
              {comparison.rows.map((row, i) => (
                <motion.div
                  key={row.feature}
                  custom={i}
                  variants={fadeUp}
                  className="w-full sm:w-auto shrink-0 sm:shrink snap-start rounded-2xl border border-white/10 overflow-hidden bg-[#0B1424]"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-white/60 px-4 pt-3 pb-2 border-b border-white/10">{row.feature}</p>
                  <div className="grid grid-cols-2 divide-x divide-white/10">
                    <div className="p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/45 mb-1 flex items-center gap-1"><XCircle size={13} /> Other</p>
                      <p className="text-sm text-white/60 leading-snug">{row.other}</p>
                    </div>
                    <div className="p-3.5 border-l-2 border-[#14E0A0]/40">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#14E0A0] mb-1 flex items-center gap-1"><CheckCircle size={13} /> TFD</p>
                      <p className="text-sm text-white/85 leading-snug">{row.tfd}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="sm:hidden text-center text-[11px] text-white/40 mt-2">Swipe for all 10 points →</p>
          </div>
        </Section>

        {/* How We Work */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div key={`how-head-${lang}`} variants={fadeUp} className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.howWeWorkTitle}</h2>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">{t.howWeWorkSub}</p>
            </motion.div>
            {/* Mobile: swipeable step carousel. Desktop: 3-up grid so all 5
                steps read as a connected sequence rather than a long
                two-column stack. */}
            <div key={`how-steps-${lang}`} className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
              {HOW_WE_WORK.map((step, i) => (
                <motion.div key={step.title} custom={i} variants={fadeUp} className="w-full sm:w-auto shrink-0 sm:shrink snap-start relative rounded-2xl p-5 bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10">
                  <div className="absolute -top-3 -left-1 text-sm font-bold text-[#050B16] bg-[#14E0A0] w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</div>
                  <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] mb-3 mt-2">
                    <step.icon size={20} />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">{pick(step, "title", lang)}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{pick(step, "text", lang)}</p>
                </motion.div>
              ))}
            </div>
            <p className="sm:hidden text-center text-[11px] text-white/40 mt-2">{t.swipeSteps}</p>
          </div>
        </Section>


        {/* Pricing / value transparency pitch — split-screen: copy on the
            left, price/CTA card on the right */}
        <Section>
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div key={`pricing-${lang}`} variants={fadeUp} className="text-center lg:text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">{pricingPitch.heading}</h2>
              <p className="text-white/55 text-sm sm:text-base leading-relaxed">{pricingPitch.copy}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center rounded-2xl border border-[#14E0A0]/40 bg-gradient-to-b from-[#14E0A0]/10 to-white/[0.02] px-8 py-6 shadow-[0_10px_30px_rgba(20,224,160,0.15)] max-w-xs mx-auto lg:mx-0">
              <p className="text-4xl font-bold">{DURATIONS[0].days} <span className="text-lg font-medium text-white/50">Days</span></p>
              <p className="text-3xl font-bold text-[#14E0A0] mt-1">₹{DURATIONS[0].price.toLocaleString("en-IN")}</p>
              <button
                onClick={() => navigate("/internship/apply")}
                className="w-full mt-5 px-8 py-2.5 rounded-xl text-base font-bold bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] transition-colors"
              >
                {pricingPitch.cta}
              </button>
            </motion.div>
          </div>
        </Section>

        {/* Program Highlights — Why Join / Skills / Growth merged behind one
            tab switcher instead of three stacked full-width sections. Same
            content, a fraction of the scroll height. */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div key={`highlights-head-${lang}`} variants={fadeUp} className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.highlightsTitle}</h2>
              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
                {t.highlightsSub}
              </p>
            </motion.div>

            <div className="flex justify-center mb-7">
              <div
                role="tablist"
                aria-label="Program highlights"
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 overflow-x-auto no-scrollbar max-w-full"
              >
                {HIGHLIGHT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={highlightTab === tab.key}
                    onClick={() => setHighlightTab(tab.key)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${
                      highlightTab === tab.key ? "bg-[#14E0A0] text-[#050B16]" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {pick(tab, "label", lang)}
                  </button>
                ))}
              </div>
            </div>

            {highlightTab === "why" && (
              <div key={`why-${lang}`} className="flex sm:grid sm:grid-cols-2 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
                {WHY_JOIN.map((w, i) => (
                  <motion.div key={w.title} custom={i} initial="hidden" animate="visible" variants={fadeUp} className="w-full sm:w-auto shrink-0 sm:shrink snap-start flex gap-4 rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:border-[#14E0A0]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                      <w.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-1">{pick(w, "title", lang)}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{pick(w, "text", lang)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {highlightTab === "skills" && (
              <div key={`skills-${lang}`} className="flex sm:grid sm:grid-cols-4 gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
                {SKILLS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="w-[47%] sm:w-auto shrink-0 sm:shrink snap-start flex flex-col items-center text-center gap-2.5 rounded-2xl p-4 bg-white/[0.03] border border-white/10 hover:border-[#14E0A0]/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0]">
                      <s.icon size={20} />
                    </div>
                    <p className="text-sm font-semibold leading-snug">{pick(s, "label", lang)}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {highlightTab === "growth" && (
              <div key={`growth-${lang}`} className="flex sm:grid sm:grid-cols-2 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
                {GROWTH_BENEFITS.map((g, i) => (
                  <motion.div key={g.title} custom={i} initial="hidden" animate="visible" variants={fadeUp} className="w-full sm:w-auto shrink-0 sm:shrink snap-start flex gap-4 rounded-2xl p-5 bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-[#14E0A0]/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                      <g.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-1">{pick(g, "title", lang)}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{pick(g, "text", lang)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <p className="sm:hidden text-center text-[11px] text-white/40 mt-2">{t.swipeMore}</p>
          </div>
        </Section>

        {/* Mobile interface preview */}
        <Section>
          <div className="max-w-5xl mx-auto">
            <motion.div key={`mobile-head-${lang}`} variants={fadeUp} className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-[#14E0A0] text-sm font-bold uppercase tracking-wider mb-3">
                <Smartphone size={16} /> {t.mobileFirstTag}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.mobilePreviewTitle}</h2>
              <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto">
                {t.mobilePreviewSub}
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
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeScreen === s.key ? "bg-[#14E0A0] text-[#050B16]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <s.icon size={17} /> {pick(s, "label", lang)}
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        </Section>

        {/* Sample verification preview — split-screen: explanation on the
            left, live certificate-card preview on the right */}
        <Section>
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div key={`cert-head-${lang}`} variants={fadeUp} className="text-center lg:text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t.certTitle}</h2>
              <p className="text-white/45 text-sm sm:text-base">
                {t.certSub}
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden border border-[#14E0A0]/25 bg-gradient-to-b from-[#14E0A0]/[0.06] to-white/[0.02] max-w-md mx-auto lg:mx-0 w-full">
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#14E0A0] text-[#050B16] text-[11px] font-bold px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} /> VERIFIED
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0] font-bold text-base">AS</div>
                  <div>
                    <p className="font-bold text-base">Aditya Sharma</p>
                    <p className="text-white/40 text-sm">HR Track &middot; 90-Day Program &middot; TFD/INTP/2026/851840</p>
                  </div>
                </div>
                <div className="mb-1 flex justify-between text-sm"><span className="text-white/50">{t.programScore}</span><span className="text-[#14E0A0] font-bold">88.2%</span></div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4"><div className="h-full w-[88%] bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full" /></div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-sm font-bold">42</p><p className="text-[10px] text-white/40">{t.tasksDone}</p></div>
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-sm font-bold">6</p><p className="text-[10px] text-white/40">{t.quizzesPassed}</p></div>
                  <div className="rounded-lg bg-white/5 py-2"><p className="text-sm font-bold">{t.collegeIdOnFile}</p><p className="text-[10px] text-white/40">{t.onFile}</p></div>
                </div>
                <button
                  onClick={() => navigate("/verify")}
                  className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <QrCode size={15} /> {t.certButton}
                </button>
              </div>
            </motion.div>
          </div>
        </Section>


        {/* Final CTA — split-screen: pitch + primary CTA on the left,
            secondary actions (login/verify) on the right */}
        <Section className="border-t border-white/5">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div key={`final-cta-${lang}`} className="text-center lg:text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">{t.finalCtaTitle}</h2>
              <p className="text-white/50 text-base mb-7">{t.finalCtaSub}</p>
              <button
                onClick={() => navigate("/internship/apply")}
                className="inline-flex items-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] text-[#050B16] font-bold text-base px-6 py-3 rounded-2xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all hover:scale-[1.03]"
              >
                {t.applyNow} <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-white/50 mb-3">{t.alreadyWithUs}</p>
              <button onClick={() => navigate("/internship/login")} className="block text-white/70 hover:text-white text-base font-semibold mb-3 transition-colors">
                {t.alreadyHaveAccount} <span className="text-[#14E0A0]">{t.logInHere}</span>
              </button>
              <button
                onClick={() => navigate("/verify")}
                className="inline-flex items-center gap-1.5 text-white/55 hover:text-[#14E0A0] text-sm font-semibold transition-colors"
              >
                <ShieldCheck size={15} /> {t.verifyCert}
              </button>
            </div>
          </div>
        </Section>

        {/* Footer — richer than a single centered line: brand block, quick
            links (tracks, apply, login, verify), and socials, all still on
            the internship's own dark/green theme (distinct from the main
            site's navy footer). Grid on desktop, stacked on mobile. */}
        <footer className="px-5 sm:px-10 lg:px-16 pt-12 pb-8 border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr_1fr] gap-8 sm:gap-6 text-center sm:text-left">
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-1.5 shrink-0">
                  <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-7 w-auto object-contain" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold text-white">TFD Internship</div>
                  <div className="text-[11px] text-[#14E0A0] font-semibold">Learn. Build. Launch.</div>
                </div>
              </div>
              <p className="text-white/45 text-sm max-w-xs leading-relaxed mt-4">
                {t.footerTagline}
              </p>
              <div className="flex items-center gap-2 mt-4">
                {[
                  { href: LINKS.instagram, icon: Instagram },
                  { href: LINKS.youtube, icon: Youtube },
                  { href: LINKS.linkedin, icon: Linkedin },
                ].map(({ href, icon: Icon }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-[#14E0A0] hover:border-[#14E0A0]/40 transition-colors"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#14E0A0] mb-3">{t.footerTracks}</p>
              <ul className="space-y-2 text-sm">
                {FOOTER_TRACKS.map((track) => (
                  <li key={track.value}>
                    <button onClick={() => navigate(`/internship/tracks/${track.value}`)} className="text-white/55 hover:text-white transition-colors">
                      {track.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#14E0A0] mb-3">{t.footerProgram}</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/internship/apply")} className="text-white/55 hover:text-white transition-colors">{t.applyNow}</button></li>
                <li><button onClick={() => navigate("/internship/login")} className="text-white/55 hover:text-white transition-colors">{t.studentLogin}</button></li>
                <li><button onClick={() => navigate("/verify")} className="text-white/55 hover:text-white transition-colors">{t.footerVerify}</button></li>
                <li><button onClick={() => navigate("/")} className="text-white/55 hover:text-white transition-colors">{t.footerMainSite}</button></li>
              </ul>
            </div>

            {/* Contact: email only — phone number intentionally left off
                this page per request, to avoid displaying it to every
                internship applicant (WhatsApp/email already cover contact
                elsewhere on the main site). */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#14E0A0] mb-3">{t.footerContact}</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={`mailto:${LINKS.email}`} className="text-white/55 hover:text-white transition-colors inline-flex items-center gap-1.5 justify-center sm:justify-start">
                    <Mail size={13} className="shrink-0" /> <span className="truncate">{LINKS.email}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-5xl mx-auto border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-white/45 text-xs">{t.poweredBy}</p>
            <p className="text-white/45 text-xs">&copy; {new Date().getFullYear()} TFD Internship. {t.allRightsReserved}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
