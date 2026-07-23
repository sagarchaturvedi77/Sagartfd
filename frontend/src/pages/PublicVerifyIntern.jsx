import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, XCircle, CalendarDays } from "lucide-react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.webp";
const MAIN_LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";

const STATUS_LABELS = {
  pending_payment: "Not Yet Active",
  active: "Active Intern",
  graduated: "Graduated",
  banned: "No Longer Active",
  dropped: "No Longer Active",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PublicVerifyIntern() {
  const { intern_id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/internship/verify/${intern_id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Not found");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [intern_id]);

  return (
    <div className="min-h-screen bg-[#050B16] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={INTERNSHIP_LOGO_URL} alt="TFD Internship" width={500} height={246} className="h-9 w-auto object-contain" />
          <div className="text-left leading-tight">
            <div className="text-base font-bold text-white">TFD Internship</div>
            <div className="text-[10px] text-[#14E0A0] font-semibold tracking-wide">Learn. Build. Launch.</div>
          </div>
        </div>

        {loading && <p className="text-center text-white/50 text-sm">Verifying...</p>}

        {error && (
          <div className="bg-white/[0.03] border border-red-500/30 rounded-3xl p-8 text-center">
            <XCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h1 className="font-display text-lg font-bold mb-1">Not Found</h1>
            <p className="text-white/45 text-sm">{error}</p>
          </div>
        )}

        {data && (
          <div className="bg-white/[0.03] border border-[#14E0A0]/25 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#14E0A0] to-[#5EEAD4] h-2" />
            <div className="p-6 text-center">
              {data.photo_url ? (
                <img src={data.photo_url} alt={data.name} width={80} height={80} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#14E0A0] mx-auto mb-4" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#14E0A0]/10 border-2 border-[#14E0A0] flex items-center justify-center text-[#14E0A0] text-2xl font-bold mx-auto mb-4">
                  {(data.name || "T").charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="font-display text-lg font-bold">{data.name}</h1>
              <p className="text-[#14E0A0] text-xs font-semibold uppercase tracking-wide mt-1">{data.track_label} Intern</p>

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <BadgeCheck size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">{STATUS_LABELS[data.status] || data.status}</span>
              </div>

              <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-left space-y-2">
                <Row label="Intern ID" value={data.intern_id} />
                <Row label="Duration" value={`${data.duration_days} Days`} />
                <Row label="Start Date" value={fmtDate(data.program_start_date)} />
                <Row label="End Date" value={fmtDate(data.program_end_date)} />
              </div>

              <p className="text-white/25 text-[10px] mt-6 flex items-center justify-center gap-1">
                <CalendarDays size={10} /> Verified against TFD Internship's official records
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8">
          <img src={MAIN_LOGO_URL} alt="The Financial Doctor" width={900} height={235} className="h-6 w-auto bg-white rounded-md p-0.5 object-contain" />
          <span className="text-white/30 text-[11px]">Powered by The Financial Doctor</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-white/40">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
