import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";
import PageHeader from "../components/portal/PageHeader";
import StatCard from "../components/portal/StatCard";
import { Button } from "../components/ui/button";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminWebsite() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // broadcast form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sendMsg, setSendMsg] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // useSubmitOnce's ref guard is critical here — this pushes a notification
  // to every subscribed website visitor, so a rapid double-click/laggy
  // re-render must never be able to send it twice.
  const [sendBroadcast, sending] = useSubmitOnce(async (e) => {
    e.preventDefault();
    setSendMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/web-push/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, body, url: url || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Failed");
      const data = await res.json();
      setSendMsg({ type: "ok", text: `Sent to ${data.sent} subscriber(s).` });
      setTitle(""); setBody(""); setUrl("");
      loadStats();
    } catch (err) {
      setSendMsg({ type: "err", text: err.message });
    }
  });

  const field = "w-full border border-[#E2D8C2] dark:border-white/15 dark:bg-white/5 dark:text-[#F1EDE3] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#024396] dark:border-[#7CB0FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <PageHeader icon="🌐" title="Website Updates" subtitle="Analytics, visitor data & push notifications for website visitors" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👁" label="Total Page Views" value={stats?.total_visitors?.toLocaleString() || 0} trend={`Today: ${stats?.today_visitors || 0}`} color="navy" />
          <StatCard icon="🔔" label="Push Subscribers" value={stats?.push_subscribers?.toLocaleString() || 0} trend="Website visitors" color="purple" />
          <StatCard icon="🧮" label="Calculator Uses" value={stats?.calculator_uses?.total?.toLocaleString() || 0} trend={`Today: ${stats?.calculator_uses?.today || 0}`} color="amber" />
          <StatCard icon="📄" label="Proposals Generated" value={stats?.proposals_generated?.total?.toLocaleString() || 0} trend={`Today: ${stats?.proposals_generated?.today || 0}`} color="green" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top cities */}
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Top Cities</h3>
            {stats?.top_cities?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_cities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B] dark:text-[#C7CEDA]">{c.city}</span>
                    <span className="text-xs font-semibold text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/5 px-2 py-0.5 rounded-full">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No city data yet</p>
            )}
          </div>

          {/* Top calculators */}
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Most Used Calculators</h3>
            {stats?.top_calculators?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_calculators.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B] dark:text-[#C7CEDA]">{c.name}</span>
                    <span className="text-xs font-semibold text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/5 px-2 py-0.5 rounded-full">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No calculator usage yet</p>
            )}
          </div>

          {/* Top pages */}
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Top Pages</h3>
            {stats?.top_pages?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_pages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B] dark:text-[#C7CEDA] truncate max-w-[200px]">{p.page}</span>
                    <span className="text-xs font-semibold text-[#024396] dark:text-[#7CB0FF] bg-[#024396]/5 dark:bg-white/5 px-2 py-0.5 rounded-full">{p.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No page view data yet</p>
            )}
          </div>

          {/* Daily visitors */}
          <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-3">Last 7 Days</h3>
            {stats?.daily_visitors?.length > 0 ? (
              <div className="space-y-2">
                {stats.daily_visitors.map((d, i) => {
                  const maxCount = Math.max(...stats.daily_visitors.map(x => x.count), 1);
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-[#2A364B]/70 dark:text-[#8E99AC] mb-0.5">
                        <span>{d.date}</span>
                        <span className="font-semibold">{d.count}</span>
                      </div>
                      <div className="h-2 bg-[#F5F1EB] dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#024396] to-[#0356c4] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40 dark:text-[#8E99AC]/70">No daily data yet</p>
            )}
          </div>
        </div>

        {/* Send notification to website visitors */}
        <div className="bg-white dark:bg-[#101D2E] rounded-2xl border border-[#E2D8C2] dark:border-white/10 shadow-sm p-6 max-w-lg">
          <h3 className="text-sm font-semibold text-[#0E1B2C] dark:text-[#F1EDE3] mb-1">Send Website Notification</h3>
          <p className="text-xs text-[#2A364B]/50 dark:text-[#8E99AC] mb-4">Push notification to all subscribed website visitors</p>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] mb-1">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New SIP Scheme Available!" className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] mb-1">Message</label>
              <textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Details about the update..." className={`${field} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 dark:text-[#8E99AC] mb-1">Link (optional)</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://thefinancialdoctor.in/calculators" className={field} />
            </div>
            {sendMsg && (
              <p className={`text-sm ${sendMsg.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{sendMsg.text}</p>
            )}
            <Button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-[#024396] to-[#0356c4]">
              {sending ? "Sending..." : `Send to ${stats?.push_subscribers || 0} Subscriber(s)`}
            </Button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
