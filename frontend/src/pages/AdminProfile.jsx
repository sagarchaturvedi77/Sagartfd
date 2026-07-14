import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

const FIELDS = [
  ["full_name", "Full Name"],
  ["contact_no", "Contact Number"],
  ["email", "Email"],
  ["father_name", "Father's Name"],
  ["aadhar_number", "Aadhaar Number"],
  ["pan_number", "PAN Number"],
];

export default function AdminProfile() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.ok ? await res.json() : {};
      setForm({
        full_name: data.full_name || user?.name || "",
        contact_no: data.contact_no || user?.phone || "",
        email: data.email || user?.email || "",
        father_name: data.father_name || "",
        aadhar_number: data.aadhar_number || "",
        pan_number: data.pan_number || "",
      });
    } catch { /* silent */ }
    setLoading(false);
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => { setForm((prev) => ({ ...prev, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
    } catch { /* silent */ }
    setSaving(false);
  };

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white dark:bg-white/5 dark:text-[#F1EDE3]";

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader icon="👤" title="My Profile" subtitle="Your personal details" />

        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(([key, label]) => (
              <div key={key} className={key === "full_name" ? "sm:col-span-2" : ""}>
                <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">{label}</label>
                <input
                  value={form[key] || ""}
                  onChange={(e) => set(key, e.target.value)}
                  className={field}
                  placeholder={label}
                />
              </div>
            ))}
          </div>

          {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved.</p>}

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
