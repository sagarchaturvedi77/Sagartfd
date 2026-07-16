import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Download, Share2, Lock, Video, Send, CheckCircle2, FileText, NotebookText, Eye } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function downloadBlob(res, filename) {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function VideoReviewCard({ student, token, refreshMe }) {
  const [videoUrl, setVideoUrl] = useState(student?.video_review_url || "");
  const [consent, setConsent] = useState(!!student?.video_consent);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!student?.video_review_url);

  const submit = async () => {
    if (!videoUrl.trim() || !/^https?:\/\//i.test(videoUrl.trim())) {
      toast.error("Please paste a valid video link (starting with http:// or https://).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/video-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_url: videoUrl.trim(), consent }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Could not save");
      toast.success("Thanks — your video review has been submitted!");
      setEditing(false);
      await refreshMe();
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-1">
        <Video size={16} className="text-[#14E0A0]" />
        <p className="text-sm font-bold">Share Your Internship Experience</p>
      </div>
      <p className="text-xs text-white/45 mb-3.5 leading-relaxed">
        A short review video of your internship — feel free to include small clips from wherever you were working.
        Just paste a link to wherever you've already uploaded it (YouTube, Instagram, Google Drive, etc).
      </p>

      {!editing && student?.video_review_url ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-[#14E0A0] bg-[#14E0A0]/10 rounded-xl px-3 py-2.5">
            <CheckCircle2 size={14} className="shrink-0" />
            <a href={student.video_review_url} target="_blank" rel="noreferrer" className="truncate hover:underline">{student.video_review_url}</a>
          </div>
          <p className="text-[11px] text-white/40">
            {student.video_consent ? "You've allowed TFD to feature this on social media." : "You've asked to keep this private — not used on social media."}
          </p>
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-white/50 hover:text-white transition-colors">
            Edit / resubmit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/... or https://drive.google.com/..."
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#14E0A0]/60"
          />
          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-2">Can TFD feature this on social media?</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConsent(true)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${consent ? "bg-[#14E0A0]/15 border-[#14E0A0] text-[#14E0A0]" : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"}`}
              >
                Yes, feature it
              </button>
              <button
                type="button"
                onClick={() => setConsent(false)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${!consent ? "bg-white/10 border-white/30 text-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25"}`}
              >
                No, keep private
              </button>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-2.5 rounded-xl transition-colors"
          >
            <Send size={14} /> {saving ? "Submitting..." : "Submit Video Review"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudentCertificate() {
  const { token, student, refreshMe } = useInternshipAuth();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(null); // "letter" | "report" | null

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/certificate`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCert(await res.json());
    } catch {
      // best-effort
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/certificate/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) await downloadBlob(res, `TFD_Internship_Certificate_${(student?.name || "Certificate").replace(/\s+/g, "_")}.pdf`);
      else toast.error("Certificate not available yet.");
    } catch {
      toast.error("Download failed. Please try again.");
    }
    setDownloading(false);
  };

  const handleDownloadDoc = async (kind) => {
    setDownloadingDoc(kind);
    try {
      const res = await fetch(`${API_BASE}/api/internship/me/${kind}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) await downloadBlob(res, `TFD_Internship_${kind === "letter" ? "Letter" : "Report"}_${(student?.name || kind).replace(/\s+/g, "_")}.pdf`);
      else toast.error("Not available yet.");
    } catch {
      toast.error("Download failed. Please try again.");
    }
    setDownloadingDoc(null);
  };

  const handleShare = async () => {
    if (!cert?.certificate_number) return;
    const verifyUrl = `${window.location.origin}/verify?certificate=${cert.certificate_number.replace(/\//g, "-")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My TFD Internship Certificate", url: verifyUrl });
        return;
      } catch {
        // user cancelled — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(verifyUrl);
    toast.success("Verify link copied!");
  };

  if (loading || !cert) {
    return (
      <StudentLayout activeKey="certificate">
        <div className="text-white/50 text-sm">Loading...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeKey="certificate">
      <div className="max-w-lg mx-auto space-y-5 pb-10">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold flex items-center justify-center gap-2">
            <Award size={20} className="text-[#14E0A0]" /> Certificate Hub
          </h1>
          <p className="text-white/45 text-sm mt-1">
            {cert.graduated ? "Your official TFD Internship certificate" : "Your progress toward certificate eligibility"}
          </p>
        </div>

        {cert.graduated ? (
          <div className="rounded-3xl border border-[#14E0A0]/30 bg-gradient-to-br from-[#14E0A0]/10 to-transparent p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#14E0A0]/15 flex items-center justify-center mx-auto mb-4">
              <Award size={30} className="text-[#14E0A0]" />
            </div>
            <p className="text-lg font-bold">Congratulations, {student?.name?.split(" ")[0] || "Intern"}! 🎉</p>
            <p className="text-white/50 text-sm mt-1">You've successfully completed the TFD Internship Program.</p>

            <div className="grid grid-cols-2 gap-3 mt-5 text-left">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Certificate No.</p>
                <p className="text-sm font-semibold mt-0.5 break-all">{cert.certificate_number}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Issued On</p>
                <p className="text-sm font-semibold mt-0.5">{fmtDate(cert.issue_date)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 col-span-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Program Score</p>
                <p className="text-sm font-semibold mt-0.5">{cert.percentage}% <span className="text-white/35 font-normal">({cert.earned_points} / {cert.total_points} points)</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                <Download size={15} /> {downloading ? "Downloading..." : "Download PDF"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
              >
                <Share2 size={15} />
              </button>
            </div>

            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mt-6 mb-2 text-left">Also Unlocked</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDownloadDoc("letter")}
                disabled={downloadingDoc === "letter"}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 font-semibold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <FileText size={14} /> {downloadingDoc === "letter" ? "Downloading..." : "Internship Letter"}
              </button>
              <button
                onClick={() => handleDownloadDoc("report")}
                disabled={downloadingDoc === "report"}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 font-semibold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <NotebookText size={14} /> {downloadingDoc === "report" ? "Downloading..." : "Internship Report"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-white/30">
                <Lock size={24} />
              </div>
              <p className="text-sm font-bold text-white/70">Certificate Not Yet Issued</p>
              {cert.reason && <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{cert.reason}</p>}
              <a
                href={`${API_BASE}/api/internship/certificate/sample`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3.5 text-xs font-semibold text-[#14E0A0] hover:text-[#5EEAD4] transition-colors"
              >
                <Eye size={14} /> View Sample Certificate
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-end justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/45 uppercase tracking-wide">Program Score</span>
                <span className="text-sm font-bold">{cert.percentage}% <span className="text-white/30 font-normal text-xs">/ {cert.threshold}% needed</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${cert.percentage >= cert.threshold ? "bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4]" : "bg-amber-400"}`}
                  style={{ width: `${Math.min(100, cert.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2">{cert.earned_points} / {cert.total_points} points earned across the full program</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide">Program Duration</p>
                <p className="text-sm font-bold mt-0.5">Day {cert.current_day} of {cert.duration_days}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cert.days_completed ? "bg-[#14E0A0]/15 text-[#14E0A0]" : "bg-white/5 text-white/40"}`}>
                {cert.days_completed ? "Duration Complete" : "In Progress"}
              </span>
            </div>

            <p className="text-center text-xs text-white/35 leading-relaxed px-4">
              Complete tasks to raise your score — a missed task can always be completed later.
              Once your program duration ends with a score of {cert.threshold}% or higher, your certificate is issued automatically.
            </p>
          </>
        )}

        <VideoReviewCard student={student} token={token} refreshMe={refreshMe} />
      </div>
    </StudentLayout>
  );
}
