import React, { useState } from "react";
import { Upload, CheckCircle, Briefcase, Award, ArrowUpRight, ArrowLeft, Users, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";

// 🩺 Exact Branded Logo pairing from your main Navbar layout
const LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

export default function CareerPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "", fatherName: "", motherName: "", dob: "", gender: "", maritalStatus: "",
    mobile: "", altMobile: "", email: "", city: "", state: "", address: "",
    position: "", experience: "", currentCompany: "", currentDesignation: "",
    currentSalary: "", expectedSalary: "", qualification: "", college: "", passingYear: "",
    skills: [], otherSkills: "", refName: "", whyJoin: "", additionalInfo: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.declaration1 || !formData.declaration2) {
      toast.error("Kripya dono declaration conditions ko agree karein.");
      return;
    }

    setSubmitting(true);
    toast.loading("Submitting your application to TFD team...", { id: "career-page-submit" });

    const submissionBody = new FormData();
    submissionBody.append("access_key", "c9710201-be15-4e3f-853d-2e0c734746af");
    submissionBody.append("subject", `New Career Application for ${formData.position} - ${formData.fullName}`);
    submissionBody.append("from_name", "TFD Career Portal");

    Object.keys(formData).forEach(key => {
      if (key === "skills") {
        submissionBody.append("Selected Skills", formData.skills.join(", "));
      } else {
        submissionBody.append(key, formData[key]);
      }
    });

    const photoFileInput = e.target.querySelector('input[type="file"][accept="image/*"]');
    if (photoFileInput && photoFileInput.files[0]) {
      submissionBody.append("Candidate Photo", photoFileInput.files[0]);
    }

    const resumeFileInput = e.target.querySelector('input[type="file"][accept=".pdf,.doc,.docx"]');
    if (resumeFileInput && resumeFileInput.files[0]) {
      submissionBody.append("Uploaded Resume", resumeFileInput.files[0]);
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: submissionBody
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Application submitted successfully!", { id: "career-page-submit" });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.message || "Web3Forms submission failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Submission fail ho gaya. Kripya baad me dobara try karein.", { id: "career-page-submit" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* 🩺 BRAND HEADER INTEGRATION WITH EXACT NAVBAR PAIRING */}
        <div className="flex items-center justify-between border-b border-[#E2D8C2] pb-5 mb-8">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src={LOGO_URL}
              alt="The Financial Doctor"
              className="h-12 sm:h-14 w-auto object-contain shrink-0 bg-white p-1 rounded-xl border border-[#E2D8C2]"
            />
            <div>
              <span className="font-display text-lg sm:text-xl text-[#0E1B2C] block font-bold leading-none tracking-tight">The Financial Doctor</span>
              <span className="text-[9px] tracking-[0.18em] uppercase text-[#5C677D] font-medium block mt-1">ARN-290298 · SEHORE</span>
            </div>
          </a>
          
          <button 
            onClick={() => window.location.href = "/"} 
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5C677D] hover:text-[#0E1B2C] transition-colors cursor-pointer bg-white px-3 py-2 rounded-xl border border-[#E2D8C2]"
          >
            <ArrowLeft size={14} /> Home
          </button>
        </div>

        {/* 🏢 WORK CULTURE & BENEFITS HEADER CARD */}
        <div className="bg-white border border-[#E2D8C2] rounded-3xl p-6 sm:p-8 mb-8 shadow-sm space-y-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#0E1B2C] font-bold">Work with The Financial Doctor (TFD)</h1>
            <p className="text-sm text-[#2A364B] mt-2 leading-relaxed">
              Hum ek fast-growing financial tech-distribution platform hain jo families ko target-based regular mutual funds aur complete protection planning provide karte hain. TFD me hum professional integrity, constant learning aur ek support-oriented system me believe karte hain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex gap-3 bg-[#FBF7EE]/60 border border-[#E2D8C2]/60 p-4 rounded-2xl">
              <Users className="text-[#024396] shrink-0" size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#0E1B2C]">Great Work Culture</h3>
                <p className="text-xs text-[#5C677D] mt-1 leading-normal">Friendly, supportive aur execution-oriented workspace jahan har core ideas ko prioritize kiya jata hai.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-[#FBF7EE]/60 border border-[#E2D8C2]/60 p-4 rounded-2xl">
              <TrendingUp className="text-[#C7102E] shrink-0" size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#0E1B2C]">Growth & Incentives</h3>
                <p className="text-xs text-[#5C677D] mt-1 leading-normal">Industry-best compensation benchmarks, performances tracking aur transparent payout setups.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-[#FBF7EE]/60 border border-[#E2D8C2]/60 p-4 rounded-2xl">
              <ShieldCheck className="text-[#024396] shrink-0" size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#0E1B2C]">Training & Certification</h3>
                <p className="text-xs text-[#5C677D] mt-1 leading-normal">NISM/AMFI guidance support start-to-finish, taaki aap real capital advisor ban sakein.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-[#FBF7EE]/60 border border-[#E2D8C2]/60 p-4 rounded-2xl">
              <Clock className="text-[#C7102E] shrink-0" size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#0E1B2C]">Work-Life Flexibility</h3>
                <p className="text-xs text-[#5C677D] mt-1 leading-normal">Discipline framework ke sath flexibility taaki aap apna best productivity render kar sakein.</p>
              </div>
            </div>
          </div>
        </div>

        {/* APPLICATION FORM CARD CONTAINER */}
        <div className="bg-white border border-[#E2D8C2] rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-6 sm:px-8 bg-[#0E1B2C] text-[#F6F1E8] flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-2xl text-[#C7102E]">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Career Application Form</h2>
              <p className="text-xs text-[#F6F1E8]/70 mt-0.5">Neeche di gayi sabhi details ko dhyanpurvak fill karein.</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
                
                {/* SECTION 1: Personal Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4">1. Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#5C677D] mb-1.5">Candidate Photo *</label>
                      <div className="border border-dashed border-[#E2D8C2] bg-[#FBF7EE]/40 rounded-xl p-4 text-center hover:border-[#024396] transition-colors cursor-pointer relative">
                        <input type="file" accept="image/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload size={20} className="mx-auto text-[#5C677D] mb-1" />
                        <span className="text-xs text-[#2A364B]">Upload Profile Photo (Max 2MB)</span>
                      </div>
                    </div>
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
                </div>

                {/* SECTION 2: Contact Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4">2. Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* SECTION 3: Professional Info */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4">3. Position & Professional Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* SECTION 4: Education */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4">4. Education Parameters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* SECTION 5: Skills */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#024396] border-b border-[#E2D8C2] pb-1.5 mb-4">5. Skill Repository Selection</h4>
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
                    <input type="text" placeholder="Anya skills yahan likhein..." value={formData.otherSkills} onChange={e => setFormData({...formData, otherSkills: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                  </div>
                </div>

                {/* SECTION 6: Files Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C677D] mb-1.5">Upload Resume (PDF/DOC/DOCX) *</label>
                    <div className="border border-dashed border-[#E2D8C2] bg-white rounded-xl p-3 text-center hover:border-[#024396] transition-colors cursor-pointer relative">
                      <input type="file" accept=".pdf,.doc,.docx" required className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="flex items-center justify-center gap-2 text-xs text-[#2A364B]">
                        <Upload size={16} className="text-[#5C677D]" /> Choose Resume File
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C677D] mb-1">Reference Name (Optional)</label>
                    <input type="text" placeholder="Kiske reference se aaye hain" value={formData.refName} onChange={e => setFormData({...formData, refName: e.target.value})} className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2 text-sm focus:border-[#024396] outline-none" />
                  </div>
                </div>

                {/* SECTION 7: Motivations */}
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

                {/* Declarations */}
                <div className="bg-[#FBF7EE]/60 border border-[#E2D8C2] p-4 rounded-2xl space-y-3">
                  <label className="flex items-start gap-2.5 text-xs text-[#2A364B] cursor-pointer select-none">
                    <input type="checkbox" required checked={formData.declaration1} onChange={e => setFormData({...formData, declaration1: e.target.checked})} className="mt-0.5 rounded text-[#024396] focus:ring-[#024396]" />
                    <span>I hereby declare that all the information provided by me is true and correct.</span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-[#2A364B] cursor-pointer select-none">
                    <input type="checkbox" required checked={formData.declaration2} onChange={e => setFormData({...formData, declaration2: e.target.checked})} className="mt-0.5 rounded text-[#024396] focus:ring-[#024396]" />
                    <span>I agree that The Financial Doctor may contact me regarding this job application.</span>
                  </label>
                </div>

                {/* Action Button */}
                <button type="submit" disabled={submitting} className="w-full bg-[#024396] hover:bg-[#012E6B] disabled:opacity-50 text-[#F6F1E8] font-display font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  {submitting ? "Submitting Application..." : "Submit Application"} <ArrowUpRight size={16} />
                </button>
              </form>
            ) : (
              
              /* SUCCESS THANK YOU CARD */
              <div className="text-center py-12 px-4 space-y-6 max-w-md mx-auto animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500/20 grid place-items-center mx-auto text-emerald-500">
                  <CheckCircle size={44} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl text-[#0E1B2C]">Thank You, Application Received!</h3>
                  <p className="text-sm text-[#5C677D] leading-relaxed">
                    Aapki details successfully **TFD Team** ke paas safe pahunch gayi hain. Humari hiring aur management team aapke credentials aur verification files review karke jald hi direct mail ya contact number par aapse संपर्क karegi.
                  </p>
                </div>
                <div className="bg-[#FBF7EE] border border-[#E2D8C2] p-4 rounded-2xl flex items-center gap-3 text-left">
                  <Award size={24} className="text-[#024396] shrink-0" />
                  <div className="text-xs text-[#2A364B] leading-normal">
                    Aap tab tak home panel par back jaakar calculators ya active investment matrices check kar sakte hain.
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
    </div>
  );
}
