import React, { useState } from "react";
import { Upload, CheckCircle, Briefcase, Award, ArrowUpRight, ChevronLeft, ChevronDown, Users, ShieldCheck, TrendingUp, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { useSubmitOnce } from "../lib/useSubmitOnce";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingActions from "../components/FloatingActions";
import ProblemSolution from "../components/ProblemSolution";

// Cloudinary config (unsigned upload preset — safe for client-side use)
const CLOUDINARY_CLOUD_NAME = "dq6g81hma";
const CLOUDINARY_UPLOAD_PRESET = "career_resumes";

const HEAR_ABOUT_OPTIONS = [
  "Instagram", "LinkedIn", "Facebook", "Google Search", "Friend/Family Referral",
  "College/Institute Notice", "Newspaper", "Walk-in", "Other",
];

const STEPS = [
  { key: "form", label: "Your Details" },
  { key: "review", label: "Review & Confirm" },
  { key: "done", label: "Submitted" },
];

// Moved out of the hero badge row into their own section below — same four
// benefits, now with a line of real substance instead of just a label.
const perks = [
  { icon: Users, title: "Great work culture", text: "A close-knit, collaborative team — not a call-centre floor." },
  { icon: TrendingUp, title: "Growth & incentives", text: "Performance-linked incentives on top of a fixed salary, with a clear path to senior roles." },
  { icon: ShieldCheck, title: "NISM/AMFI training", text: "We fund your certification and pair you with real client conversations from day one." },
  { icon: Clock, title: "Work-life balance", text: "Structured hours and genuine support — this isn't a burn-and-churn sales floor." },
];

// The hiring process, as a lead-in to the form below — sets expectations
// before asking someone to fill 25 fields.
const hiringSteps = [
  { n: "01", title: "Apply online", text: "Fill in your details and upload your resume and photo — takes about 5 minutes." },
  { n: "02", title: "Screening call", text: "Our HR team reviews your application and calls to understand your background and interest." },
  { n: "03", title: "Interview", text: "A conversation about the role, your experience, and what you're looking for — in person or over video." },
  { n: "04", title: "Offer & onboarding", text: "If it's a fit, you'll get an offer, certification support, and a structured onboarding into your role." },
];

async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(url, { method: "POST", body: data });
  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || "Cloudinary upload failed");
  }
  return json.secure_url;
}

function StepIndicator({ step }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < activeIndex
                  ? "bg-[#024396] border-[#024396] text-white"
                  : i === activeIndex
                  ? "bg-white border-[#024396] text-[#024396]"
                  : "bg-white border-[#E2D8C2] text-[#9AA5B4]"
              }`}
            >
              {i < activeIndex ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${i <= activeIndex ? "text-[#0E1B2C]" : "text-[#9AA5B4]"}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-10 sm:w-16 h-[2px] mb-4 mx-1.5 transition-colors ${i < activeIndex ? "bg-[#024396]" : "bg-[#E2D8C2]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Mobile-only accordion (one section open at a time) for the ~25-field
// application form — was one unbroken vertical stack of 7 sections on
// mobile. sm: and up always shows every section expanded, same as before;
// only the mobile behavior changes.
function AccordionSection({ index, title, openSection, setOpenSection, children }) {
  const isOpen = openSection === index;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? null : index)}
        className="w-full flex items-center justify-between text-left sm:pointer-events-none sm:cursor-default"
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4 flex-1">{title}</h4>
        <ChevronDown
          size={16}
          className={`sm:hidden text-[#024396] shrink-0 -mt-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`${isOpen ? "block" : "hidden"} sm:!block`}>{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#5C677D] shrink-0">{label}</span>
      <span className="text-[#0E1B2C] font-medium text-right">{value}</span>
    </div>
  );
}

export default function CareerPage() {
  const [step, setStep] = useState("form"); // "form" | "review" | "done"
  const [openSection, setOpenSection] = useState(1); // mobile-only accordion — which of the 7 form sections is expanded
  const [photoFile, setPhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "", fatherName: "", motherName: "", dob: "", gender: "", maritalStatus: "",
    mobile: "", altMobile: "", email: "", city: "", state: "", address: "",
    position: "", experience: "", currentCompany: "", currentDesignation: "",
    currentSalary: "", expectedSalary: "", qualification: "", college: "", passingYear: "",
    skills: [], otherSkills: "", refName: "", whyJoin: "", additionalInfo: "",
    hearAbout: "", hearAboutOther: "",
    declaration1: false, declaration2: false
  });

  const skillsList = [
    "MS Excel", "MS Office", "Mutual Fund Knowledge",
    "Stock Market Knowledge", "Sales", "Customer Handling"
  ];

  const handleCheckboxChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const goToReview = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.fatherName.trim() || !formData.dob || !formData.gender || !formData.maritalStatus) {
      toast.error("Please complete all required Personal Details fields.");
      return;
    }
    if (!formData.mobile.trim() || !formData.email.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast.error("Please complete all required Contact Details fields.");
      return;
    }
    if (!formData.position || !formData.experience) {
      toast.error("Please select the position and experience.");
      return;
    }
    if (!formData.qualification) {
      toast.error("Please select your highest qualification.");
      return;
    }
    if (!formData.whyJoin.trim()) {
      toast.error("Please tell us why you want to join The Financial Doctor.");
      return;
    }
    if (!formData.hearAbout) {
      toast.error("Please tell us how you heard about us.");
      return;
    }
    if (formData.hearAbout === "Other" && !formData.hearAboutOther.trim()) {
      toast.error("Please specify how you heard about us.");
      return;
    }
    if (!resumeFile) {
      toast.error("Please upload your resume.");
      return;
    }
    if (!photoFile) {
      toast.error("Please upload your candidate photo.");
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [handleConfirmSubmit, submitting] = useSubmitOnce(async () => {
    if (!formData.declaration1 || !formData.declaration2) return;

    const toastId = toast.loading("Uploading documents...");

    try {
      const [resumeUrl, photoUrl] = await Promise.all([
        uploadToCloudinary(resumeFile),
        uploadToCloudinary(photoFile)
      ]);

      toast.loading("Submitting your application to TFD team...", { id: toastId });

      const submissionBody = new FormData();
      submissionBody.append("access_key", "c9710201-be15-4e3f-853d-2e0c734746af");
      submissionBody.append("subject", `New Career Application for ${formData.position} - ${formData.fullName}`);
      submissionBody.append("from_name", "TFD Career Portal");

      Object.keys(formData).forEach(key => {
        if (key === "skills") {
          submissionBody.append("Selected Skills", formData.skills.join(", "));
        } else if (key !== "declaration1" && key !== "declaration2") {
          submissionBody.append(key, formData[key]);
        }
      });

      submissionBody.append("Resume Link", resumeUrl);
      submissionBody.append("Photo Link", photoUrl);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: submissionBody
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Save the full application into the backend so it shows up under
        // Admin Portal -> Leads -> Career Leads with complete details.
        try {
          await fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/leads/public/career`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: formData.fullName,
              phone: formData.mobile,
              email: formData.email || null,
              position: formData.position || null,
              experience: formData.experience || null,
              message: `City: ${formData.city || "-"}, Current: ${formData.currentDesignation || "-"} at ${formData.currentCompany || "-"}`,
              resume_url: resumeUrl,
              father_name: formData.fatherName || null,
              mother_name: formData.motherName || null,
              dob: formData.dob || null,
              gender: formData.gender || null,
              marital_status: formData.maritalStatus || null,
              alt_mobile: formData.altMobile || null,
              city: formData.city || null,
              state: formData.state || null,
              address: formData.address || null,
              current_company: formData.currentCompany || null,
              current_designation: formData.currentDesignation || null,
              current_salary: formData.currentSalary || null,
              expected_salary: formData.expectedSalary || null,
              qualification: formData.qualification || null,
              college: formData.college || null,
              passing_year: formData.passingYear || null,
              skills: formData.skills,
              other_skills: formData.otherSkills || null,
              ref_name: formData.refName || null,
              why_join: formData.whyJoin || null,
              additional_info: formData.additionalInfo || null,
              photo_url: photoUrl,
              hear_about_us: formData.hearAbout || null,
              hear_about_us_other: formData.hearAbout === "Other" ? (formData.hearAboutOther || null) : null,
            }),
          });
        } catch (backendErr) {
          // Non-blocking — application already went through via email above.
        }

        toast.success("Application submitted successfully!", { id: toastId });
        setStep("done");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.message || "Submission backend issue");
      }
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please check your data and try again.", { id: toastId });
    }
  });

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <SEO
        title="The Financial Doctor | Careers & Job Openings"
        description="Job opportunities at The Financial Doctor — Sales, Marketing, Finance, and HR roles in Sehore, MP. Apply for jobs in the financial services sector."
        keywords="jobs near me, financial services jobs, sales job, career opportunities, job openings finance sector"
        path="/career"
        ogImage="https://thefinancialdoctor.in/assets/logos/TFD-WORKSPACE-LOGO.webp"
      />
      <Navbar />

      {/* "OPEN ROLE" HERO — deep maroon-black instead of the amber-brown
          every other page's dark hero leans on (Reviews already owns that
          gold-on-brown combination), red glow instead of gold, headline-only
          with no badge strip — the four benefit badges now get a proper
          section of their own below instead of being crammed into the hero. */}
      <section className="relative overflow-hidden bg-[#280C0E] pt-28 pb-14 md:pt-32 md:pb-16 px-6">
        <div
          aria-hidden
          className="fund-animate-in absolute -top-16 -left-20 w-[340px] h-[340px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle at center, rgba(199,16,46,0.55) 0%, transparent 65%)" }}
        />
        <div className="container-x relative max-w-3xl">
          <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A1F22] bg-[#33161A] text-[11px] tracking-[0.2em] uppercase text-[#FF8A80] font-semibold">
            We're hiring
          </div>
          <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6ECEA] mt-5 leading-tight">
            Build a career, <span className="font-italic-serif" style={{ color: "#FF8A80" }}>not just a job.</span>
          </h1>
          <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#DCC1BF] text-[15px] sm:text-base max-w-xl leading-relaxed">
            A fast-growing financial-distribution platform in Sehore, MP — goal-based mutual funds and
            protection planning for real families, with real training and real growth.
          </p>
        </div>
      </section>

      {/* WHY JOIN — the four hero badges promoted into a real perks section
          with a line of substance each. Mobile: horizontal scroll-snap
          slider. Desktop: 4-column grid. */}
      <section className="bg-white py-14 md:py-16 px-6 border-b border-[#E2D8C2]">
        <div className="container-x max-w-5xl mx-auto">
          <div className="max-w-xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#C7102E] font-semibold uppercase tracking-wider">
              Why join us
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-[#0E1B2C] mt-2">
              Build your career the right way
            </h2>
          </div>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:overflow-visible sm:snap-none sm:mx-0 sm:px-0 sm:pb-0">
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="shrink-0 w-[80%] snap-center sm:w-auto sm:shrink bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#C7102E]/10 text-[#C7102E] grid place-items-center">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-display text-[15px] text-[#0E1B2C] mt-3.5 mb-1.5">{p.title}</h3>
                  <p className="text-[13px] text-[#2A364B]/80 leading-relaxed">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ProblemSolution
        accent="#C7102E"
        problemLabel="What job-seekers usually face"
        problem="Most entry-level finance roles offer no real training — you're handed a target and a phone, with no one explaining how mutual funds, insurance, or client conversations actually work."
        solutionLabel="How TFD is different"
        solution="We fund your NISM/AMFI certification, pair you with real client interactions from day one, and build your career path openly — from your first sale to running your own book."
      />

      {/* HOW IT WORKS — hiring-process timeline as a lead-in to the form
          below, so applicants know what to expect before filling 25 fields.
          Mobile: vertical stepped list with a connecting rail. Desktop:
          horizontal rail across a 4-column grid — a genuinely different
          layout, not the mobile list just widened. */}
      <section className="bg-[#FBF7EE] py-14 md:py-16 px-6">
        <div className="container-x max-w-5xl mx-auto">
          <div className="max-w-xl mb-9">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#C7102E] font-semibold uppercase tracking-wider">
              How it works
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-[#0E1B2C] mt-2">
              From application to offer
            </h2>
          </div>

          {/* mobile: vertical rail */}
          <div className="sm:hidden relative pl-8">
            <div className="absolute top-1 bottom-1 left-[13px] w-0.5 bg-[#E8C4C0]" aria-hidden />
            <div className="space-y-7">
              {hiringSteps.map((s) => (
                <div key={s.n} className="relative">
                  <div className="absolute -left-8 top-0 w-7 h-7 rounded-full bg-[#C7102E] text-white text-[11px] font-bold grid place-items-center ring-4 ring-[#FBF7EE]">
                    {s.n.replace("0", "")}
                  </div>
                  <h3 className="font-display text-[15px] text-[#0E1B2C]">{s.title}</h3>
                  <p className="text-[13px] text-[#2A364B]/80 mt-1 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* desktop: horizontal rail */}
          <div className="hidden sm:block relative pt-2">
            <div className="absolute top-[13px] left-0 right-0 h-0.5 bg-[#E8C4C0]" aria-hidden />
            <div className="grid grid-cols-4 gap-6">
              {hiringSteps.map((s) => (
                <div key={s.n} className="relative pt-7">
                  <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full bg-[#C7102E] border-2 border-[#FBF7EE] ring-2 ring-[#E8C4C0]" aria-hidden />
                  <h3 className="font-display text-[15px] text-[#0E1B2C]">{s.title}</h3>
                  <p className="text-[13px] text-[#2A364B]/80 mt-1.5 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#E2D8C2] rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-6 sm:px-8 bg-[#0E1B2C] text-[#F6F1E8] flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-2xl text-[#C7102E]">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Career Application Form</h2>
              <p className="text-xs text-[#F6F1E8]/70 mt-0.5">Please carefully fill in all the details below.</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {step !== "done" && <StepIndicator step={step} />}

            {step === "form" && (
              <form onSubmit={goToReview} className="space-y-8">
                <AccordionSection index={1} title="1. Personal Details" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Full Name *</label>
                      <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Father's Name *</label>
                      <input type="text" required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Mother's Name</label>
                      <input type="text" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Date of Birth *</label>
                      <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Gender *</label>
                      <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Marital Status *</label>
                      <select required value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]">
                        <option value="">Select Marital Status</option>
                        <option value="Married">Married</option>
                        <option value="Unmarried">Unmarried</option>
                      </select>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={2} title="2. Contact Details" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Mobile Number *</label>
                      <input type="tel" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Alternate Mobile Number</label>
                      <input type="tel" value={formData.altMobile} onChange={e => setFormData({...formData, altMobile: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Email ID *</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Current City *</label>
                      <input type="text" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Current State *</label>
                      <input type="text" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Current Address</label>
                      <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none resize-none"></textarea>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={3} title="3. Position & Professional Info" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Position Applying For *</label>
                      <select required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]">
                        <option value="">Select Position</option>
                        <option value="Relationship Manager">Relationship Manager</option>
                        <option value="Mutual Fund Advisor">Mutual Fund Advisor</option>
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="Telecaller">Telecaller</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Marketing Executive">Marketing Executive</option>
                        <option value="HR">HR</option>
                        <option value="Internship">Internship</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Total Experience *</label>
                      <select required value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]">
                        <option value="">Select Experience</option>
                        <option value="Fresher">Fresher</option>
                        <option value="Less than 1 Year">Less than 1 Year</option>
                        <option value="1–2 Years">1–2 Years</option>
                        <option value="2–5 Years">2–5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                    </div>
                    {formData.experience !== "Fresher" && formData.experience !== "" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-[#5C677D] mb-1">Current Company</label>
                          <input type="text" value={formData.currentCompany} onChange={e => setFormData({...formData, currentCompany: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#5C677D] mb-1">Current Designation</label>
                          <input type="text" value={formData.currentDesignation} onChange={e => setFormData({...formData, currentDesignation: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#5C677D] mb-1">Current Salary (Annual/Monthly)</label>
                          <input type="text" value={formData.currentSalary} onChange={e => setFormData({...formData, currentSalary: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Expected Salary</label>
                      <input type="text" value={formData.expectedSalary} onChange={e => setFormData({...formData, expectedSalary: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={4} title="4. Education Parameters" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Highest Qualification *</label>
                      <select required value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]">
                        <option value="">Select Qualification</option>
                        <option value="10th">10th</option>
                        <option value="12th">12th</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Post Graduation">Post Graduation</option>
                        <option value="MBA">MBA</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">College/University</label>
                      <input type="text" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Passing Year</label>
                      <input type="number" placeholder="YYYY" value={formData.passingYear} onChange={e => setFormData({...formData, passingYear: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={5} title="5. Skill Repository Selection" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {skillsList.map(skill => (
                      <label key={skill} className="flex items-center gap-2 bg-white border border-[#E2D8C2] px-3 py-2 rounded-xl text-xs text-[#2A364B] cursor-pointer select-none hover:border-[#024396]">
                        <input type="checkbox" checked={formData.skills.includes(skill)} onChange={() => handleCheckboxChange(skill)} className="rounded text-[#024396] focus:ring-[#024396]" />
                        {skill}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C677D] mb-1">Other Skills</label>
                    <input type="text" placeholder="Specify other skills here..." value={formData.otherSkills} onChange={e => setFormData({...formData, otherSkills: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                  </div>
                </AccordionSection>

                <AccordionSection index={6} title="6. Document Uploads" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1.5">Upload Resume (PDF/DOC/DOCX) *</label>
                      <div className={`border border-dashed rounded-xl p-3 text-center transition-colors relative cursor-pointer ${resumeFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#E2D8C2] bg-white hover:border-[#024396]'}`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          required
                          onChange={e => setResumeFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 text-xs text-[#2A364B]">
                          {resumeFile ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <CheckCircle size={16} /> Selected: {resumeFile.name}
                            </div>
                          ) : (
                            <>
                              <Upload size={16} className="text-[#5C677D]" /> Choose Resume File
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1.5">Candidate Photo *</label>
                      <div className={`border border-dashed rounded-xl p-3 text-center transition-colors relative cursor-pointer ${photoFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#E2D8C2] bg-white hover:border-[#024396]'}`}>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={e => setPhotoFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 text-xs text-[#2A364B]">
                          {photoFile ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <CheckCircle size={16} /> Photo Selected: {photoFile.name}
                            </div>
                          ) : (
                            <>
                              <Upload size={16} className="text-[#5C677D]" /> Upload Profile Photo (Max 2MB)
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">Reference Name (Optional)</label>
                      <input type="text" placeholder="Enter reference name if applicable" value={formData.refName} onChange={e => setFormData({...formData, refName: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection index={7} title="7. How Did You Hear About Us?" openSection={openSection} setOpenSection={setOpenSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C677D] mb-1">How did you hear about us? *</label>
                      <select
                        required
                        value={formData.hearAbout}
                        onChange={e => setFormData({...formData, hearAbout: e.target.value, hearAboutOther: e.target.value === "Other" ? formData.hearAboutOther : ""})}
                        className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none h-[38px]"
                      >
                        <option value="">Select an option</option>
                        {HEAR_ABOUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    {formData.hearAbout === "Other" && (
                      <div>
                        <label className="block text-xs font-medium text-[#5C677D] mb-1">Please specify *</label>
                        <input
                          type="text"
                          required
                          placeholder="Tell us where you heard about us"
                          value={formData.hearAboutOther}
                          onChange={e => setFormData({...formData, hearAboutOther: e.target.value})}
                          className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none"
                        />
                      </div>
                    )}
                  </div>
                </AccordionSection>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C677D] mb-1">Why do you want to join The Financial Doctor? *</label>
                    <textarea rows="3" required value={formData.whyJoin} onChange={e => setFormData({...formData, whyJoin: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C677D] mb-1">Anything else you'd like us to know?</label>
                    <textarea rows="2" value={formData.additionalInfo} onChange={e => setFormData({...formData, additionalInfo: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none resize-none"></textarea>
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#024396] hover:bg-[#012E6B] text-[#F6F1E8] font-display font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  Review Application <ArrowUpRight size={16} />
                </button>
              </form>
            )}

            {step === "review" && (
              <div className="space-y-6">
                <button onClick={() => setStep("form")} className="flex items-center gap-1 text-xs text-[#024396] font-semibold hover:underline">
                  <ChevronLeft size={14} /> Back to edit
                </button>
                <div>
                  <h3 className="font-serif text-xl text-[#0E1B2C] font-bold">Please review your application</h3>
                  <p className="text-xs text-[#5C677D] mt-0.5">Take a moment to check everything is correct before submitting.</p>
                </div>

                <div className="bg-[#FBF7EE]/60 border border-[#E2D8C2] rounded-2xl p-4 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Personal Details</p>
                    <Row label="Full Name" value={formData.fullName} />
                    <Row label="Father's Name" value={formData.fatherName} />
                    <Row label="Mother's Name" value={formData.motherName} />
                    <Row label="Date of Birth" value={formData.dob} />
                    <Row label="Gender" value={formData.gender} />
                    <Row label="Marital Status" value={formData.maritalStatus} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Contact Details</p>
                    <Row label="Mobile Number" value={formData.mobile} />
                    <Row label="Alternate Mobile" value={formData.altMobile} />
                    <Row label="Email ID" value={formData.email} />
                    <Row label="City" value={formData.city} />
                    <Row label="State" value={formData.state} />
                    <Row label="Address" value={formData.address} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Position & Professional Info</p>
                    <Row label="Position Applying For" value={formData.position} />
                    <Row label="Total Experience" value={formData.experience} />
                    <Row label="Current Company" value={formData.currentCompany} />
                    <Row label="Current Designation" value={formData.currentDesignation} />
                    <Row label="Current Salary" value={formData.currentSalary} />
                    <Row label="Expected Salary" value={formData.expectedSalary} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Education</p>
                    <Row label="Highest Qualification" value={formData.qualification} />
                    <Row label="College/University" value={formData.college} />
                    <Row label="Passing Year" value={formData.passingYear} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Skills</p>
                    <Row label="Selected Skills" value={formData.skills.join(", ") || "-"} />
                    <Row label="Other Skills" value={formData.otherSkills} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Documents & Reference</p>
                    <Row label="Resume" value={resumeFile?.name} />
                    <Row label="Photo" value={photoFile?.name} />
                    <Row label="Reference Name" value={formData.refName} />
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-[#E2D8C2]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#024396]">Additional Information</p>
                    <Row label="How did you hear about us?" value={formData.hearAbout === "Other" ? `Other — ${formData.hearAboutOther}` : formData.hearAbout} />
                    <Row label="Why join TFD?" value={formData.whyJoin} />
                    <Row label="Anything else?" value={formData.additionalInfo} />
                  </div>
                </div>

                <div className="bg-[#FBF7EE]/60 border border-[#E2D8C2] p-4 rounded-2xl space-y-3">
                  <label className="flex items-start gap-2.5 text-xs text-[#2A364B] cursor-pointer select-none">
                    <input type="checkbox" checked={formData.declaration1} onChange={e => setFormData({...formData, declaration1: e.target.checked})} className="mt-0.5 rounded text-[#024396] focus:ring-[#024396]" />
                    <span>I hereby declare that all the information provided by me is true and correct.</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-[#2A364B] cursor-pointer select-none">
                    <input type="checkbox" checked={formData.declaration2} onChange={e => setFormData({...formData, declaration2: e.target.checked})} className="mt-0.5 rounded text-[#024396] focus:ring-[#024396]" />
                    <span>I agree that The Financial Doctor may contact me regarding this job application.</span>
                  </label>
                </div>

                <button
                  onClick={handleConfirmSubmit}
                  disabled={!formData.declaration1 || !formData.declaration2 || submitting}
                  className="w-full bg-[#024396] hover:bg-[#012E6B] disabled:opacity-50 text-[#F6F1E8] font-display font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? "Submitting Application..." : "Confirm & Submit Application"} <ArrowUpRight size={16} />
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-12 px-4 space-y-6 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500/20 grid place-items-center mx-auto text-emerald-500">
                  <CheckCircle size={44} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl text-[#0E1B2C]">Thank You!</h3>
                  <p className="text-sm text-[#5C677D] leading-relaxed">
                    Your application details have been successfully submitted to the <strong>TFD HR Team</strong>. Our recruitment management panel will review your profile and credentials and contact you shortly via email or phone. A confirmation email has also been sent to <strong>{formData.email}</strong>.
                  </p>
                </div>
                <div className="bg-[#FBF7EE] border border-[#E2D8C2] p-4 rounded-2xl flex items-center gap-3 text-left">
                  <Award size={24} className="text-[#024396] shrink-0" />
                  <div className="text-xs text-[#2A364B] leading-normal">
                    In the meantime, feel free to navigate back to our homepage to explore our investment matrices and wealth diagnostics dashboards.
                  </div>
                </div>
                <button onClick={() => window.location.href = "/"} className="w-full bg-[#0E1B2C] text-white py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-colors hover:bg-black">
                  Go Back to Homepage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <FloatingActions />
    </div>
  );
}
