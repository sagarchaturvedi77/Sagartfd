import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import EmptyState from "../components/portal/EmptyState";

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
    return (
      <PortalLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  if (!profile || !profile.full_name) {
    return (
      <PortalLayout>
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10">
          <EmptyState icon="👤" title="Profile not yet completed." subtitle="Please complete your onboarding first." />
        </div>
      </PortalLayout>
    );
  }

  const photoSrc = uploads?.photo?.data;

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader icon="👤" title="My Profile" subtitle="Your personal, bank, and document details" />

        {/* Profile header */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm overflow-hidden">
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
            <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-6 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">You are on training period — {status.training_days} days total</span>
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
                    {val.content_type?.startsWith("image/") ? (
                      <img src={val.data} alt={key} className="h-20 mx-auto rounded-xl object-contain border border-[#E2D8C2] dark:border-white/10" />
                    ) : (
                      <div className="h-20 bg-[#FBF7EE] dark:bg-white/5 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#024396]/40 dark:text-[#7CB0FF]/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-[10px] text-[#2A364B]/50 dark:text-[#8E99AC] mt-1 capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Agreement */}
            <Section title="Employment Agreement">
              <Link to="/portal/employee/agreement"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#024396] dark:bg-[#4C8DFF] text-white rounded-xl text-sm hover:bg-[#023580] dark:hover:bg-[#3a7de0] transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View / Print Agreement
              </Link>
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
      <h4 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3 pb-2 border-b border-[#E2D8C2] dark:border-white/10">{title}</h4>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      {items.map(([label, value]) => (
        <div key={label}>
          <span className="text-[#2A364B]/50 dark:text-[#8E99AC]">{label}</span>
          <p className="font-medium text-[#0E1B2C] dark:text-[#F1EDE3] mt-0.5">{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}
