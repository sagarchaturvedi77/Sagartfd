import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, PlayCircle, Award, CheckCircle2, Clock3, ArrowUpRight, NotebookPen, CreditCard } from "lucide-react";
import StudentLayout from "../portal/student/StudentLayout";
import { useInternshipAuth } from "../portal/student/InternshipAuthContext";
import { openCashfreeCheckout } from "../lib/cashfree";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const TRACK_LABELS = {
  finance: "Finance",
  marketing: "Marketing",
  sales: "Sales",
  hr: "HR",
};

const GRADUATION_THRESHOLD = 75;

function LockedCard({ icon: Icon, title, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/70">{title}</p>
        <p className="text-xs text-white/35 mt-0.5">{note}</p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { student, token, loading, refreshMe } = useInternshipAuth();
  const [error] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [checkingPayment, setCheckingPayment] = useState(!!orderId);

  // One extra refresh on mount so a just-confirmed payment (marked paid by
  // an admin in a different tab/session) shows up without a manual reload.
  useEffect(() => { refreshMe(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Returning from Cashfree checkout lands back here with ?order_id=... —
  // the webhook (server-to-server) is what actually confirms payment, so
  // this just polls a few times for it to land, rather than trusting the
  // redirect itself as proof of success.
  useEffect(() => {
    if (!orderId || !token) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(`${API_BASE}/api/internship/payment/status/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.payment_status === "paid") {
          toast.success("Payment confirmed — your internship has started!");
          await refreshMe();
          setCheckingPayment(false);
          setSearchParams({}, { replace: true });
          return;
        }
        if (res.ok && data.order_status === "failed") {
          toast.error("Payment didn't go through — you can retry below.");
          setCheckingPayment(false);
          setSearchParams({}, { replace: true });
          return;
        }
      } catch {
        // network hiccup — just retry on the next tick
      }
      if (attempts < 7 && !cancelled) {
        setTimeout(poll, 3000);
      } else if (!cancelled) {
        setCheckingPayment(false);
        setSearchParams({}, { replace: true });
      }
    };
    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  // useSubmitOnce's ref guard is critical here — this creates a Cashfree
  // payment order, so a double-click firing two concurrent requests would
  // mean duplicate pending orders (and a real risk of a duplicate charge),
  // not just a duplicate no-op like most other guarded handlers.
  const [startPayment, startingPayment] = useSubmitOnce(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/payment/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not start payment");
      await openCashfreeCheckout(data.payment_session_id, data.cashfree_env);
    } catch (err) {
      toast.error(err.message || "Could not start payment — please try again.");
    }
  });

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-white/50 text-sm">Loading your dashboard...</div>
      </StudentLayout>
    );
  }

  if (error || !student) {
    return (
      <StudentLayout>
        <div className="text-red-400 text-sm">{error || "Something went wrong."}</div>
      </StudentLayout>
    );
  }

  const pendingPayment = student.payment_status !== "paid" && student.payment_status !== "waived";
  const programDays = student.duration_days || 90;
  const progressPct = Math.round((student.current_day / programDays) * 100);

  return (
    <StudentLayout activeKey="overview">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-white/45 text-sm mt-1">
            Track: <span className="text-[#14E0A0] font-semibold">{TRACK_LABELS[student.track] || "Not selected"}</span>
            <span className="text-white/25 mx-1.5">&middot;</span>
            {programDays}-Day Program
          </p>
        </div>

        {checkingPayment && (
          <div className="rounded-2xl border border-[#14E0A0]/30 bg-[#14E0A0]/10 p-5 flex items-start gap-3">
            <Clock3 size={20} className="text-[#14E0A0] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-[#14E0A0]">Confirming your payment...</p>
              <p className="text-xs text-[#14E0A0]/70 mt-1 leading-relaxed">This usually takes a few seconds.</p>
            </div>
          </div>
        )}

        {pendingPayment && !checkingPayment && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 flex items-start gap-3">
            <Clock3 size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">Payment: Pending</p>
              <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                Your seat (₹{student.payment_amount}) is reserved but not paid yet. Pay now to start Day 1 of your
                {" "}{programDays}-day program immediately.
              </p>
              <button
                onClick={startPayment}
                disabled={startingPayment}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-[#050B16] px-3.5 py-2 rounded-xl transition-colors"
              >
                <CreditCard size={13} /> {startingPayment ? "Starting..." : `Pay ₹${student.payment_amount} Now`}
              </button>
            </div>
          </div>
        )}

        {!pendingPayment && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Seat Confirmed — Program Active</p>
              <p className="text-xs text-emerald-200/70 mt-1">Your {programDays}-day internship is underway.</p>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-2">Program Progress</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold">Day {student.current_day || 0}<span className="text-white/30 text-base">/{programDays}</span></span>
            <span className="text-xs text-white/40">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {!pendingPayment && (
          <button
            onClick={() => navigate("/portal/student/missions")}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[#14E0A0]/30 bg-gradient-to-r from-[#14E0A0]/10 to-transparent p-5 hover:border-[#14E0A0]/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/15 flex items-center justify-center text-[#14E0A0] shrink-0">
                <Rocket size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Your Active Missions Are Ready</p>
                <p className="text-xs text-white/45 mt-0.5">This week's tasks are waiting — submit and get instantly auto-verified.</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-[#14E0A0] shrink-0" />
          </button>
        )}

        {!pendingPayment && (
          <button
            onClick={() => navigate("/portal/student/report")}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#14E0A0]/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                <NotebookPen size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">My Internship Report</p>
                <p className="text-xs text-white/45 mt-0.5">Log what you learned and did each day.</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-[#14E0A0] shrink-0" />
          </button>
        )}

        {!pendingPayment && (
          <button
            onClick={() => navigate("/portal/student/certificate")}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#14E0A0]/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14E0A0]/10 flex items-center justify-center text-[#14E0A0] shrink-0">
                <Award size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">{student.status === "graduated" ? "Your Certificate is Ready" : "Certificate Hub"}</p>
                <p className="text-xs text-white/45 mt-0.5">
                  {student.status === "graduated" ? "View and download your official certificate." : `${GRADUATION_THRESHOLD}% score needed by Day ${programDays} to graduate.`}
                </p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-[#14E0A0] shrink-0" />
          </button>
        )}

        {/* Locked sections preview */}
        <div>
          <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wide mb-3">Coming Soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LockedCard icon={PlayCircle} title="Video Hub" note="Short practical lecture modules — coming in a future update." />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
