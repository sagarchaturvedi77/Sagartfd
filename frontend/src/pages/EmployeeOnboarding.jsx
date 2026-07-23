import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const INITIAL = {
  full_name: "", dob: "", gender: "", marital_status: "", contact_no: "", email: "",
  address: "", father_name: "", mother_name: "", aadhar_number: "", pan_number: "",
  bank_name: "", bank_account_number: "", bank_ifsc: "", bank_branch: "",
  emergency_contact_name: "", emergency_contact_number: "",
};

export default function EmployeeOnboarding() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ ...INITIAL, full_name: user?.name || "", email: user?.email || "" });
  const [uploads, setUploads] = useState({});
  const [step, setStep] = useState(1); // 1=personal, 2=documents, 3=bank, 4=review+sign
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [saveError, setSaveError] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const [profileRes, uploadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/uploads/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.ok) {
        const p = await profileRes.json();
        if (p && p.full_name) setForm(prev => ({ ...prev, ...p }));
        if (p && p.profile_completed) setDone(true);
      }
      if (uploadsRes.ok) setUploads(await uploadsRes.json());
    } catch { /* silent */ }
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // useSubmitOnce's ref guard blocks a rapid double-fire of this same call
  // (e.g. a fast double-tap on the file picker); the per-field "which file is
  // uploading" label still comes from uploadingField below, set/cleared
  // manually inside the action since the hook only tracks one shared
  // in-flight flag, not which field it's for.
  const [handleUpload] = useSubmitOnce(async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("field", field);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (res.ok) {
      // re-fetch uploads
      const uRes = await fetch(`${API_BASE}/api/uploads/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (uRes.ok) setUploads(await uRes.json());
    }
    setUploadingField(null);
  });

  const [saveProfile, saving] = useSubmitOnce(async () => {
    setSaveError("");
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDone(true);
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.detail || "Could not save your profile. Please check your details and try again.");
      }
    } catch {
      setSaveError("Network error — could not save your profile. Please try again.");
    }
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const field = "w-full border border-[#E2D8C2] dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white dark:bg-white/5 dark:text-[#F1EDE3]";

  const FileUploadBox = ({ label, fieldName }) => {
    const existing = uploads[fieldName];
    return (
      <div className="border-2 border-dashed border-[#E2D8C2] dark:border-white/15 rounded-xl p-4 text-center hover:border-[#024396]/50 dark:hover:border-[#7CB0FF]/50 transition-all">
        <p className="text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] mb-2">{label}</p>
        {existing ? (
          <div className="space-y-2">
            {existing.content_type?.startsWith("image/") && (
              <img src={existing.data} alt={label} width={80} height={80} className="h-20 w-20 mx-auto rounded-lg object-contain" />
            )}
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Uploaded: {existing.filename}</p>
          </div>
        ) : null}
        <label className="mt-2 inline-block cursor-pointer">
          <span className="text-xs text-[#024396] dark:text-[#7CB0FF] hover:underline">
            {uploadingField === fieldName ? "Uploading..." : existing ? "Replace" : "Choose File"}
          </span>
          <input type="file" className="hidden" accept={fieldName === "resume" ? ".pdf,.doc,.docx" : "image/*"}
            onChange={(e) => handleUpload(fieldName, e.target.files[0])} />
        </label>
      </div>
    );
  };

  if (done) {
    return (
      <PortalLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Profile Submitted Successfully!</h2>
          <p className="text-sm text-[#2A364B]/60 dark:text-[#8E99AC]">Your details have been saved. You can now access all portal features.</p>
          <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 mt-4">Go to Dashboard to continue.</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-serif text-[#0E1B2C] dark:text-[#F1EDE3]">Welcome to TFD!</h2>
          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC]">Please complete your profile to continue</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {["Personal", "Documents", "Bank & Emergency", "Review & Submit"].map((s, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${step === i + 1 ? "bg-[#024396] dark:bg-[#4C8DFF] text-white" : "bg-white dark:bg-white/5 border border-[#E2D8C2] dark:border-white/15 text-[#2A364B]/50 dark:text-[#8E99AC]"}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Personal Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Full Name *</label><input required value={form.full_name} onChange={e => set("full_name", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Date of Birth *</label><input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Gender *</label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)} className={field}>
                  <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Marital Status *</label>
                <select value={form.marital_status} onChange={e => set("marital_status", e.target.value)} className={field}>
                  <option value="">Select</option><option value="unmarried">Unmarried</option><option value="married">Married</option>
                </select>
              </div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Contact Number *</label><input value={form.contact_no} onChange={e => set("contact_no", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Email</label><input value={form.email} onChange={e => set("email", e.target.value)} className={field} /></div>
              <div className="sm:col-span-2"><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Full Address *</label><textarea rows={2} value={form.address} onChange={e => set("address", e.target.value)} className={`${field} resize-none`} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Father's Name *</label><input value={form.father_name} onChange={e => set("father_name", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Mother's Name *</label><input value={form.mother_name} onChange={e => set("mother_name", e.target.value)} className={field} /></div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">Next: Documents</Button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Documents & Photos</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Aadhar Card Number *</label><input value={form.aadhar_number} onChange={e => set("aadhar_number", e.target.value)} className={field} placeholder="XXXX XXXX XXXX" /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">PAN Number (Optional)</label><input value={form.pan_number} onChange={e => set("pan_number", e.target.value)} className={field} placeholder="ABCDE1234F" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FileUploadBox label="Passport Size Photo *" fieldName="photo" />
              <FileUploadBox label="Aadhar Card (Front)" fieldName="aadhar_front" />
              <FileUploadBox label="Aadhar Card (Back)" fieldName="aadhar_back" />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">Next: Bank Details</Button>
            </div>
          </div>
        )}

        {/* Step 3: Bank & Emergency */}
        {step === 3 && (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Bank Details (for Salary)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Bank Name *</label><input value={form.bank_name} onChange={e => set("bank_name", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Account Number *</label><input value={form.bank_account_number} onChange={e => set("bank_account_number", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">IFSC Code *</label><input value={form.bank_ifsc} onChange={e => set("bank_ifsc", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Branch *</label><input value={form.bank_branch} onChange={e => set("bank_branch", e.target.value)} className={field} /></div>
            </div>
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] pt-2">Emergency Contact</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Name</label><input value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} className={field} /></div>
              <div><label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Phone</label><input value={form.emergency_contact_number} onChange={e => set("emergency_contact_number", e.target.value)} className={field} /></div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">Next: Review & Sign</Button>
            </div>
          </div>
        )}

        {/* Step 4: Review, Agreement & Signature */}
        {step === 4 && (
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Review Your Details</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {[["Name", form.full_name], ["DOB", form.dob], ["Gender", form.gender], ["Status", form.marital_status],
                ["Contact", form.contact_no], ["Email", form.email], ["Father", form.father_name], ["Mother", form.mother_name],
                ["Aadhar", form.aadhar_number], ["PAN", form.pan_number || "-"],
                ["Bank", `${form.bank_name} - ${form.bank_account_number}`], ["IFSC", form.bank_ifsc],
              ].map(([l, v]) => (
                <div key={l}><span className="text-[#2A364B]/50 dark:text-[#8E99AC]">{l}:</span> <span className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3]">{v || "-"}</span></div>
              ))}
            </div>

            <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-2">Employment Agreement / रोज़गार अनुबंध</h3>
              <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-xl p-4 max-h-60 overflow-y-auto text-xs text-[#2A364B]/80 dark:text-[#C7CEDA] space-y-2 leading-relaxed">
                <p className="font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">THE FINANCIAL DOCTOR — Employment Terms & Conditions</p>
                <p>1. <strong>Confidentiality & Data Use / गोपनीयता और डेटा उपयोग:</strong> You must not misuse any client or company data. Do not ask clients for their ID/password. आप किसी भी क्लाइंट या कंपनी के डेटा का दुरुपयोग नहीं कर सकते। क्लाइंट से उनका आईडी/पासवर्ड नहीं मांग सकते।</p>
                <p>2. <strong>Legal Action for Data/Fraud / डाटा या धोखाधड़ी पर कानूनी कार्रवाई:</strong> If you misuse data or commit any fraud, the company can remove you and take legal action. यदि आप किसी प्रकार का धोखा या डाटा का दुरुपयोग करते हैं, तो कंपनी आपको हटा सकती है और आपके खिलाफ कानूनी कार्रवाई कर सकती है।</p>
                <p>3. <strong>Client Rules / क्लाइंट से संबंधित नियम:</strong> You must not: (a) Collect money in your personal account. (b) Give any returns guarantee. (c) Ask for client&apos;s login details. आप अपने पर्सनल अकाउंट में पैसे नहीं ले सकते। क्लाइंट को मुनाफे की गारंटी नहीं दे सकते। क्लाइंट की लॉगिन डिटेल्स नहीं मांग सकते।</p>
                <p>4. <strong>Company Phone and SIM / कंपनी का फोन और सिम:</strong> The company will give you a phone and SIM. It will be in your name but used only for official work. You must return both when you leave. The SIM will be either closed or transferred by the company. कंपनी आपको एक फोन और सिम देगी। सिम आपके नाम पर होगी लेकिन सिर्फ ऑफिस के काम में ही उपयोग होगी। जॉब छोड़ते समय आपको फोन और सिम दोनों वापस करने होंगे। कंपनी उस सिम को बंद या ट्रांसफर करा सकती है।</p>
                <p>5. <strong>Discipline & Dress Code / अनुशासन और ड्रेस कोड:</strong> You must come on time, behave respectfully, and wear proper formal clothes. आपको समय पर आना होगा, सभी से अच्छा व्यवहार करना होगा और फॉर्मल ड्रेस पहननी होगी।</p>
                <p>6. <strong>Salary Rules / सैलरी से जुड़े नियम:</strong> Salary will be credited between 1st to 10th of each month. No advance salary will be given. Salary will only be credited to your personal bank account. Leave days will be deducted from your salary. If you leave mid-month, no salary will be given. सैलरी हर महीने की 1 से 10 तारीख के बीच आएगी। एडवांस सैलरी नहीं दी जाएगी। सैलरी सिर्फ आपके बैंक अकाउंट में आएगी। छुट्टी के पैसे सैलरी से काटे जाएंगे। यदि आप महीने के बीच में नौकरी छोड़ते हैं, तो उस महीने की सैलरी नहीं मिलेगी।</p>
                <p>7. <strong>Targets & Performance / लक्ष्य और प्रदर्शन:</strong> You must achieve monthly targets. For the first 2 months, some relaxation will be given. हर महीने के टारगेट पूरे करने होंगे। पहले 2 महीनों में थोड़ी छूट दी जाएगी।</p>
                <p>8. <strong>Notice Period / नोटिस पीरियड:</strong> If you want to leave the job, give 15 days or 1 month&apos;s notice. Leaving suddenly will cancel your salary. यदि आप नौकरी छोड़ना चाहते हैं, तो कम से कम 15 दिन या 1 महीने पहले बताना होगा। बिना बताए अचानक छोड़ने पर सैलरी नहीं मिलेगी।</p>
                <p>9. <strong>Non-Compete & Non-Solicitation / प्रतिस्पर्धा निषेध:</strong> During and 6 months after employment, you must not solicit company clients or share proprietary information with competitors. नौकरी के दौरान और 6 महीने बाद तक, आप कंपनी के ग्राहकों को नहीं भटकाएंगे और प्रतिस्पर्धियों को गोपनीय जानकारी नहीं देंगे।</p>
                <p>10. <strong>Legal Action (BNS & IT Act) / कानूनी कार्रवाई:</strong> If you break any company rule, the company may take legal action under: Bharatiya Nyaya Sanhita (BNS) 2023 — Section 316 (Fraud), Section 73 (Data Theft), Section 64 (Breach of Trust); IT Act 2000 — Section 43A (Data Negligence), Section 66 (Computer Misuse). अगर आप कंपनी के नियम तोड़ते हैं, तो आपके खिलाफ निम्न कानूनों के तहत कार्रवाई हो सकती है।</p>
              </div>
            </div>

            <div className="border-t border-[#E2D8C2] dark:border-white/10 pt-4">
              <p className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-2">Upload your signature below to accept the agreement</p>
              <FileUploadBox label="Your Signature *" fieldName="signature" />
            </div>

            {saveError && <p className="text-xs text-red-500 text-right">{saveError}</p>}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={saveProfile} disabled={saving || !uploads.signature}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                {saving ? "Submitting..." : "I Agree & Submit Profile"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
