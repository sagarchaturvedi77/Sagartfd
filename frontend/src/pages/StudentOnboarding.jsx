import React, { useState } from "react";
import { toast } from "sonner";
import {
  Camera, CheckCircle2, FileSignature, ShieldCheck, User, MapPin, Loader2,
} from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { getCurrentLocation } from "../portal/api";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const CLAUSE_SUMMARY = [
  ["Program Fee — Non-Refundable", "Once paid, your program fee cannot be refunded under any circumstances, including early withdrawal, suspension, or ban."],
  ["Genuine Work Only — No Plagiarism", "I confirm every task I submit is my own genuine work, typed/done by me. A rejected task can always be corrected and resubmitted with no penalty — but knowingly submitting copied, AI-generated-and-passed-off, or fake work is plagiarism, and if caught, my internship can be terminated immediately, without a refund."],
  ["Certificate — Full Duration + 75% Score", "Your certificate is issued only after you complete the full chosen duration AND score at least 75% overall. A missed task never permanently locks — it stays completable until the last day."],
  ["No Stipend — Points Are Internal Only", "This is a learning & certification program, not a paid position. Task/quiz points are purely internal (leaderboard/skill display) — never cash, never paid out."],
  ["Conduct & Warnings", "Dishonest submissions, abusive conduct, or platform misuse may lead to a formal warning, and repeated violations to suspension or a permanent ban — without a refund."],
  ["Confidentiality", "Any business information you're exposed to while completing tasks must be kept confidential."],
  ["End-of-Program Video Review", "Near the end, you'll be asked to share a short video review (a link, not a file). Whether TFD can feature it on social media is entirely your own choice."],
  ["Photo & Certificate Use", "Your photo and details are used to generate your official ID card and certificate, both carrying a public QR verification code."],
  ["Termination Without Refund", "TFD may suspend or terminate access for a serious violation of these terms, without any refund of fees already paid."],
  ["Governing Law", "This agreement is governed by Indian law, with exclusive jurisdiction of the courts at Sehore, Madhya Pradesh."],
];

const field = "w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60";
const readOnlyField = "w-full bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/50";

// Groups digits into the standard "XXXX XXXX XXXX" Aadhaar display format
// as the user types, and hard-caps at 12 digits — previously a plain text
// input let in any length/characters and the backend only checked
// min/max string length (12-14), so e.g. 14 digits of anything slipped through.
function formatAadhaar(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

// PAN is always exactly 10 uppercase alphanumeric characters (AAAAA9999A) —
// uppercases as you type and hard-caps the length instead of accepting
// free-form text.
function formatPan(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

export default function StudentOnboarding() {
  const { student, token, refreshMe } = useInternshipAuth();
  const [step, setStep] = useState(1);

  const [kyc, setKyc] = useState({
    dob: student?.dob || "", gender: student?.gender || "", aadhar_number: student?.aadhar_number || "",
    pan_number: student?.pan_number || "", no_pan: student?.no_pan || false,
    college_id_number: student?.college_id_number || "",
  });
  const [photoUploaded, setPhotoUploaded] = useState(!!student?.photo_url);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureUploaded, setSignatureUploaded] = useState(false);

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent onboarding-step requests, same pattern as
  // CallFlowPopup / EmployeeAgreement / EmployeeAttendance.
  const [saveKyc, saving] = useSubmitOnce(async () => {
    if (!kyc.dob || !kyc.gender || !kyc.aadhar_number || !kyc.college_id_number) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (kyc.aadhar_number.replace(/\D/g, "").length !== 12) {
      toast.error("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (!kyc.no_pan && !kyc.pan_number.trim()) {
      toast.error("Enter your PAN number, or check 'I don't have a PAN card'.");
      return;
    }
    if (!kyc.no_pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(kyc.pan_number.trim())) {
      toast.error("PAN must be in the format ABCDE1234F.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(kyc),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not save details");
      await refreshMe();
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    }
  });

  const [handlePhotoChange, uploadingPhoto] = useSubmitOnce(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`${API_BASE}/api/internship/me/photo`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Upload failed");
      toast.success("Photo uploaded!");
      setPhotoUploaded(true);
      await refreshMe();
    } catch (err) {
      toast.error(err.message);
    }
  });

  const [uploadSignature, uploadingSignature] = useSubmitOnce(async () => {
    if (!signatureFile) return;
    try {
      const form = new FormData();
      form.append("signature", signatureFile);
      const res = await fetch(`${API_BASE}/api/internship/me/agreement/signature`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Upload failed");
      toast.success("Signature uploaded!");
      setSignatureUploaded(true);
    } catch (err) {
      toast.error(err.message);
    }
  });

  const [signAndFinish, signing] = useSubmitOnce(async () => {
    if (!signatureUploaded) {
      toast.error("Please upload your signature first.");
      return;
    }
    const toastId = toast.loading("Getting your location — please allow access when prompted...");
    try {
      const loc = await getCurrentLocation(15000);
      if (!loc) {
        toast.error("Location access is required to sign the agreement. Please enable location and try again.", { id: toastId });
        return;
      }
      toast.loading("Signing agreement...", { id: toastId });
      const res = await fetch(`${API_BASE}/api/internship/me/agreement/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat: loc.lat, lng: loc.lng }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not sign agreement");
      toast.success("Agreement signed — welcome to TFD Internship!", { id: toastId });
      await refreshMe();
      window.location.href = "/portal/student";
    } catch (err) {
      toast.error(err.message || "Something went wrong", { id: toastId });
    }
  });

  if (!student) return null;

  const StepDot = ({ n, label }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
        step === n ? "bg-[#14E0A0] text-[#050B16]" : step > n ? "bg-[#14E0A0]/20 text-[#14E0A0]" : "bg-white/10 text-white/40"
      }`}>
        {step > n ? <CheckCircle2 size={13} /> : n}
      </div>
      <span className={`text-[11px] font-semibold hidden sm:inline ${step >= n ? "text-white/80" : "text-white/30"}`}>{label}</span>
    </div>
  );

  return (
    <StudentLayout activeKey="overview">
      <div className="max-w-xl mx-auto space-y-5 pb-10">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold flex items-center justify-center gap-2">
            <ShieldCheck size={20} className="text-[#14E0A0]" /> Complete Your Onboarding
          </h1>
          <p className="text-white/45 text-sm mt-1">One-time step before your internship portal unlocks.</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <StepDot n={1} label="KYC Details" />
          <div className="w-6 h-px bg-white/15" />
          <StepDot n={2} label="Photo" />
          <div className="w-6 h-px bg-white/15" />
          <StepDot n={3} label="Agreement" />
        </div>

        {step === 1 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Name</label>
                <input readOnly value={student.name} className={readOnlyField} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Mobile Number</label>
                <input readOnly value={student.phone} className={readOnlyField} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Email</label>
              <input readOnly value={student.email} className={readOnlyField} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Date of Birth *</label>
                <input type="date" value={kyc.dob} onChange={(e) => setKyc({ ...kyc, dob: e.target.value })} className={field} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Gender *</label>
                <select value={kyc.gender} onChange={(e) => setKyc({ ...kyc, gender: e.target.value })} className={field}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1.5">Aadhaar Number *</label>
              <input
                placeholder="XXXX XXXX XXXX" value={kyc.aadhar_number} inputMode="numeric" maxLength={14}
                onChange={(e) => setKyc({ ...kyc, aadhar_number: formatAadhaar(e.target.value) })}
                className={field}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1.5">PAN Number {!kyc.no_pan && "*"}</label>
              <input
                placeholder="ABCDE1234F" value={kyc.pan_number} disabled={kyc.no_pan} maxLength={10}
                onChange={(e) => setKyc({ ...kyc, pan_number: formatPan(e.target.value) })}
                className={`${field} ${kyc.no_pan ? "opacity-40" : ""}`}
              />
              <label className="flex items-center gap-1.5 text-xs text-white/50 mt-2">
                <input type="checkbox" checked={kyc.no_pan} onChange={(e) => setKyc({ ...kyc, no_pan: e.target.checked, pan_number: e.target.checked ? "" : kyc.pan_number })} />
                I don't have a PAN card
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1.5">College ID Number *</label>
              <input placeholder="Your college-issued ID number" value={kyc.college_id_number} onChange={(e) => setKyc({ ...kyc, college_id_number: e.target.value })} className={field} />
            </div>
            <button
              onClick={saveKyc} disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors mt-2"
            >
              {saving ? "Saving..." : "Continue"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 text-center">
            <div className="flex flex-col items-center gap-3">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.name} width={112} height={112} className="w-28 h-28 rounded-2xl object-cover border border-[#14E0A0]/40" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-white/25">
                  <User size={36} />
                </div>
              )}
              <p className="text-xs text-white/50 max-w-xs">
                This exact photo will be used on your official Intern ID Card and Certificate — pick a clear, recent photo.
              </p>
              <label className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                <Camera size={14} /> {uploadingPhoto ? "Uploading..." : photoUploaded ? "Change Photo" : "Upload Photo"}
                <input type="file" accept="image/*" capture="user" onChange={handlePhotoChange} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>
            <button
              onClick={() => setStep(3)} disabled={!photoUploaded}
              className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] font-bold text-sm py-3 rounded-xl transition-colors"
            >
              Continue
            </button>
            {!photoUploaded && <p className="text-[11px] text-white/30">Upload a photo to continue.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="flex items-center gap-1.5 text-sm font-bold mb-3">
                <FileSignature size={16} className="text-[#14E0A0]" /> TFD Internship Agreement
              </p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 border border-white/10 rounded-xl p-3.5 bg-black/20">
                {CLAUSE_SUMMARY.map(([title, body], i) => (
                  <div key={title}>
                    <p className="text-xs font-bold text-[#14E0A0]">{i + 1}. {title}</p>
                    <p className="text-[11px] text-white/55 leading-relaxed mt-0.5">{body}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/30 mt-2">The full formal agreement text (English + Hindi) is included in your signed PDF, downloadable anytime from your Certificate Hub.</p>
            </div>

            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
              <p className="text-xs font-bold text-amber-300 mb-1">Integrity Pledge</p>
              <p className="text-[11px] text-amber-100/70 leading-relaxed">
                "I confirm I will submit my own genuine work for every task, and will not plagiarize. I understand that if I'm
                found submitting copied or fake work, my internship can be terminated immediately."
              </p>
              <p className="text-[10px] text-amber-100/40 mt-1.5">Signing below (with your uploaded signature) counts as agreeing to this pledge — no separate signature needed.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label className="block text-[11px] font-semibold text-white/50 mb-2">Upload Your Signature *</label>
              <p className="text-[11px] text-white/35 mb-2">Sign on paper, photograph or scan it, and upload the image here.</p>
              <div className="flex items-center gap-2.5">
                <input type="file" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} className="flex-1 text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white" />
                <button
                  onClick={uploadSignature} disabled={!signatureFile || uploadingSignature}
                  className="shrink-0 text-xs font-bold bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white px-3.5 py-2 rounded-lg transition-colors"
                >
                  {uploadingSignature ? "..." : signatureUploaded ? "✓ Uploaded" : "Upload"}
                </button>
              </div>
            </div>

            <button
              onClick={signAndFinish}
              disabled={signing || !signatureUploaded}
              className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-40 text-[#050B16] font-bold text-sm py-3.5 rounded-xl transition-colors"
            >
              {signing ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
              {signing ? "Signing..." : "I Agree — Sign & Start My Internship"}
            </button>
            <p className="text-[10px] text-white/30 text-center">Signing requires your device's location — this is recorded once, alongside the agreement, and can't be changed afterward.</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
