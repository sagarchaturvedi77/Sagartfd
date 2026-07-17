import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminWebsiteContent() {
  const { token } = useAuth();
  const [content, setContent] = useState({ top_banner: null, popup: null });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ text: "", link: "", enabled: false });
  const [popup, setPopup] = useState({ title: "", body: "", link: "", enabled: false });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/website-content`, { headers });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
        if (data.top_banner) setBanner(data.top_banner);
        if (data.popup) setPopup(data.popup);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const [saveBanner, savingBanner] = useSubmitOnce(async () => {
    await fetch(`${API_BASE}/api/website-content`, {
      method: "PUT", headers,
      body: JSON.stringify({ top_banner: banner }),
    });
    load();
  });

  const [savePopup, savingPopup] = useSubmitOnce(async () => {
    await fetch(`${API_BASE}/api/website-content`, {
      method: "PUT", headers,
      body: JSON.stringify({ popup }),
    });
    load();
  });

  const saving = savingBanner || savingPopup;

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30 bg-white dark:bg-white/5 dark:text-[#F1EDE3]";

  if (loading) {
    return <PortalLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" /></div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-8">
        <PageHeader icon="🖥️" title="Website Content Control" subtitle="Manage website popups, top banner/marquee from here" />

        {/* Top Banner / Marquee */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Top Banner / Marquee</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={banner.enabled} onChange={e => setBanner({ ...banner, enabled: e.target.checked })}
                className="rounded border-[#E2D8C2] dark:border-white/15" />
              <span className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{banner.enabled ? "Active" : "Disabled"}</span>
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Banner Text (marquee)</label>
              <input value={banner.text} onChange={e => setBanner({ ...banner, text: e.target.value })} className={field} placeholder="e.g. Special offer: Free financial consultation this month!" />
            </div>
            <div>
              <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Link (optional, click to open)</label>
              <input value={banner.link} onChange={e => setBanner({ ...banner, link: e.target.value })} className={field} placeholder="https://thefinancialdoctor.in/contact" />
            </div>
          </div>
          {banner.enabled && banner.text && (
            <div className="bg-[#024396] dark:bg-[#4C8DFF] text-white text-xs py-2 px-4 rounded-xl overflow-hidden">
              <div className="animate-marquee whitespace-nowrap">{banner.text}</div>
            </div>
          )}
          <Button onClick={saveBanner} disabled={saving} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
            {saving ? "Saving..." : "Save Banner"}
          </Button>
        </div>

        {/* Popup */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">Website Popup</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={popup.enabled} onChange={e => setPopup({ ...popup, enabled: e.target.checked })}
                className="rounded border-[#E2D8C2] dark:border-white/15" />
              <span className="text-xs text-[#2A364B]/60 dark:text-[#8E99AC]">{popup.enabled ? "Active" : "Disabled"}</span>
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Popup Title</label>
              <input value={popup.title} onChange={e => setPopup({ ...popup, title: e.target.value })} className={field} placeholder="e.g. Welcome to TFD!" />
            </div>
            <div>
              <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Popup Body / Message</label>
              <textarea rows={3} value={popup.body} onChange={e => setPopup({ ...popup, body: e.target.value })} className={`${field} resize-none`} placeholder="Your popup message here..." />
            </div>
            <div>
              <label className="block text-xs text-[#2A364B]/60 dark:text-[#8E99AC] mb-1">Link / CTA URL (optional)</label>
              <input value={popup.link} onChange={e => setPopup({ ...popup, link: e.target.value })} className={field} placeholder="https://thefinancialdoctor.in/..." />
            </div>
          </div>
          {popup.enabled && popup.title && (
            <div className="bg-[#FBF7EE] dark:bg-white/5 rounded-xl p-4 border border-[#E2D8C2] dark:border-white/10">
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70 mb-1">Preview:</p>
              <p className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3]">{popup.title}</p>
              <p className="text-xs text-[#2A364B]/70 dark:text-[#8E99AC] mt-1">{popup.body}</p>
              {popup.link && <p className="text-xs text-[#024396] dark:text-[#7CB0FF] mt-1">{popup.link}</p>}
            </div>
          )}
          <Button onClick={savePopup} disabled={saving} className="bg-gradient-to-r from-[#024396] to-[#0356c4]">
            {saving ? "Saving..." : "Save Popup"}
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
}
