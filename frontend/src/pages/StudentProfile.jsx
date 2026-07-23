import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Phone, Mail, GraduationCap, Briefcase, CalendarDays, BadgeCheck, Cake, Camera, IdCard, ArrowUpRight } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const TRACK_LABELS = {
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  hr: "HR",
};

const STATUS_LABELS = {
  pending_payment: "Payment Pending",
  active: "Active",
  graduated: "Graduated",
  banned: "Suspended",
  dropped: "Dropped",
};

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#14E0A0] shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-white/40 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { student, loading, token, refreshMe } = useInternshipAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [editingDob, setEditingDob] = useState(false);
  const [dobInput, setDobInput] = useState("");

  // useSubmitOnce's ref guard stops a rapid double-click/laggy re-render
  // from firing two concurrent requests, same pattern as CallFlowPopup /
  // EmployeeAgreement / EmployeeAttendance.
  const [handlePhotoChange, uploading] = useSubmitOnce(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`${API_BASE}/api/internship/me/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Upload failed");
      toast.success("Photo updated!");
      await refreshMe();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    }
  });

  const [saveDob, savingDob] = useSubmitOnce(async () => {
    if (!dobInput) return;
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/dob`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dob: dobInput }),
      });
      if (!res.ok) throw new Error("Could not save date of birth");
      toast.success("Date of birth saved!");
      setEditingDob(false);
      await refreshMe();
    } catch (err) {
      toast.error(err.message);
    }
  });

  if (loading) {
    return (
      <StudentLayout activeKey="profile">
        <div className="text-white/50 text-sm">Loading your profile...</div>
      </StudentLayout>
    );
  }
  if (!student) return null;

  const startEditDob = () => {
    setDobInput(student.dob || "");
    setEditingDob(true);
  };

  return (
    <StudentLayout activeKey="profile">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className="relative shrink-0 group" title="Change photo">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover border border-[#14E0A0]/30" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14E0A0]/20 to-[#5EEAD4]/10 border border-[#14E0A0]/30 flex items-center justify-center text-[#14E0A0] text-2xl font-bold">
                {(student.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handlePhotoChange} className="hidden" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold">{student.name}</h1>
            <p className="text-white/45 text-sm mt-0.5">
              {TRACK_LABELS[student.track] || "Track not selected"} &middot; {student.duration_days}-Day Program
            </p>
            {uploading && <p className="text-[#14E0A0] text-xs mt-0.5">Uploading...</p>}
          </div>
        </div>

        <button
          onClick={() => navigate("/portal/student/id-card")}
          className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[#14E0A0]/30 bg-gradient-to-r from-[#14E0A0]/10 to-transparent p-4 hover:border-[#14E0A0]/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0] shrink-0">
              <IdCard size={16} />
            </div>
            <div>
              <p className="text-sm font-bold">View My Intern ID Card</p>
              <p className="text-[11px] text-white/40">{student.intern_id}</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-[#14E0A0] shrink-0" />
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-1">Contact Details</p>
          <Row icon={User} label="Full Name" value={student.name} />
          <Row icon={Phone} label="Mobile Number" value={student.phone} />
          <Row icon={Mail} label="Email" value={student.email} />
          <Row icon={GraduationCap} label="College" value={student.college} />
          <Row icon={Briefcase} label="Course & Year" value={student.course_year} />

          {!editingDob ? (
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#14E0A0] shrink-0">
                  <Cake size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-white/40 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-sm font-medium text-white truncate">{student.dob || "Not set"}</p>
                </div>
              </div>
              <button onClick={startEditDob} className="text-xs font-semibold text-[#14E0A0] hover:underline shrink-0">
                {student.dob ? "Change" : "Add"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-3">
              <input
                type="date"
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#14E0A0]/60"
              />
              <button onClick={saveDob} disabled={savingDob || !dobInput} className="text-xs font-semibold text-[#050B16] bg-[#14E0A0] hover:bg-[#0FCB8F] rounded-lg px-3 py-1.5 disabled:opacity-50">
                {savingDob ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingDob(false)} className="text-xs text-white/40 px-2">Cancel</button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-1">Program Status</p>
          <Row icon={IdCard} label="Intern ID" value={student.intern_id} />
          <Row icon={BadgeCheck} label="Status" value={STATUS_LABELS[student.status] || student.status} />
          <Row icon={CalendarDays} label="Progress" value={student.current_day ? `Day ${student.current_day} of ${student.duration_days}` : "Not started yet"} />
          <Row icon={CalendarDays} label="Joined" value={student.created_at ? new Date(student.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
        </div>

        <p className="text-center text-white/25 text-[11px]">To update other details, please contact your program coordinator.</p>
      </div>
    </StudentLayout>
  );
}
