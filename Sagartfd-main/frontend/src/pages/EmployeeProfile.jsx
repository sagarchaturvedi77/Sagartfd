import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function EmployeeProfile() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    try {
      const [pRes, uRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/api/profile/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/uploads/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/profile-status`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (uRes.ok) setUploads(await uRes.json());
      if (sRes.ok) setStatus(await sRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <PortalLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" /></div></PortalLayout>;
  }

  if (!profile || !profile.full_name) {
    return (
      <PortalLayout>
        <div className="text-center py-16">
          <p className="text-[#2A364B]/50 text-sm">Profile not yet completed. Please complete your onboarding first.</p>
        </div>
      </PortalLayout>
    );
  }

  const photoSrc = uploads?.photo?.data;

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-serif text-[#0E1B2C]">My Profile</h2>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E1B2C] to-[#162d4a] p-6 flex items-center gap-5">
            {photoSrc ? (
              <img src={photoSrc} alt="Photo" className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                {profile.full_name?.charAt(0)}
              </div>
            )}
            <div className="text-white">
              <h3 className="text-lg font-bold">{profile.full_name}</h3>
              <p className="text-sm text-white/70">{user?.designation || "Employee"}</p>
              {status?.join_date && <p className="text-xs text-white/50 mt-1">Joined: {status.join_date}</p>}
            </div>
          </div>

          {/* Training banner */}
          {status?.training_days > 0 && (
            <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-orange-700 font-medium">You are on training period — {status.training_days} days total</span>
            </div>
          )}

          {/* Personal Details */}
          <div className="p-6 space-y-6">
            <Section title="Personal Details">
              <InfoGrid items={[
                ["Full Name", profile.full_name],
                ["Date of Birth", profile.dob],
                ["Gender", profile.gender],
                ["Marital Status", profile.marital_status],
                ["Contact", profile.contact_no],
                ["Email", profile.email],
                ["Father", profile.father_name],
                ["Mother", profile.mother_name],
                ["Address", profile.address],
              ]} />
            </Section>

            <Section title="Bank Details">
              <InfoGrid items={[
                ["Bank Name", profile.bank_name],
                ["Account No.", profile.bank_account_number],
                ["IFSC Code", profile.bank_ifsc],
                ["Branch", profile.bank_branch],
              ]} />
            </Section>

            <Section title="Emergency Contact">
              <InfoGrid items={[
                ["Name", profile.emergency_contact_name],
                ["Phone", profile.emergency_contact_number],
              ]} />
            </Section>

            {/* Documents */}
            <Section title="Uploaded Documents">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(uploads).map(([key, val]) => (
                  <div key={key} className="text-center">
                    {val.data?.startsWith("data:image") ? (
                      <img src={val.data} alt={key} className="h-20 mx-auto rounded-xl object-contain border border-[#E2D8C2]" />
                    ) : (
                      <div className="h-20 bg-[#FBF7EE] rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#024396]/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-[10px] text-[#2A364B]/50 mt-1 capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#0E1B2C] mb-3 pb-2 border-b border-[#E2D8C2]">{title}</h4>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      {items.map(([label, value]) => (
        <div key={label}>
          <span className="text-[#2A364B]/50">{label}</span>
          <p className="font-medium text-[#0E1B2C] mt-0.5">{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}
