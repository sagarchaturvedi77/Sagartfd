import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalLayout from "../components/PortalLayout";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#024396]/10 to-[#0356c4]/10 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <p className="text-[10px] text-[#2A364B]/50 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-[#0E1B2C]">{value}</p>
          {sub && <p className="text-[10px] text-[#2A364B]/50">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminWebsite() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // broadcast form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
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

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSendMsg(null);
    setSending(true);
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
    } finally {
      setSending(false);
    }
  };

  const field = "w-full border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#024396]/30";

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#024396] border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-serif text-[#0E1B2C]">Website Updates</h2>
          <p className="text-xs text-[#2A364B]/50">Analytics, visitor data & push notifications for website visitors</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👁" label="Total Page Views" value={stats?.total_visitors?.toLocaleString() || 0} sub={`Today: ${stats?.today_visitors || 0}`} />
          <StatCard icon="🔔" label="Push Subscribers" value={stats?.push_subscribers?.toLocaleString() || 0} sub="Website visitors" />
          <StatCard icon="🧮" label="Calculator Uses" value={stats?.calculator_uses?.total?.toLocaleString() || 0} sub={`Today: ${stats?.calculator_uses?.today || 0}`} />
          <StatCard icon="📄" label="Proposals Generated" value={stats?.proposals_generated?.total?.toLocaleString() || 0} sub={`Today: ${stats?.proposals_generated?.today || 0}`} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top cities */}
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Top Cities</h3>
            {stats?.top_cities?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_cities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B]">{c.city}</span>
                    <span className="text-xs font-semibold text-[#024396] bg-[#024396]/5 px-2 py-0.5 rounded-full">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40">No city data yet</p>
            )}
          </div>

          {/* Top calculators */}
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Most Used Calculators</h3>
            {stats?.top_calculators?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_calculators.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B]">{c.name}</span>
                    <span className="text-xs font-semibold text-[#024396] bg-[#024396]/5 px-2 py-0.5 rounded-full">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40">No calculator usage yet</p>
            )}
          </div>

          {/* Top pages */}
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Top Pages</h3>
            {stats?.top_pages?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_pages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A364B] truncate max-w-[200px]">{p.page}</span>
                    <span className="text-xs font-semibold text-[#024396] bg-[#024396]/5 px-2 py-0.5 rounded-full">{p.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40">No page view data yet</p>
            )}
          </div>

          {/* Daily visitors */}
          <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#0E1B2C] mb-3">Last 7 Days</h3>
            {stats?.daily_visitors?.length > 0 ? (
              <div className="space-y-2">
                {stats.daily_visitors.map((d, i) => {
                  const maxCount = Math.max(...stats.daily_visitors.map(x => x.count), 1);
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-[#2A364B]/70 mb-0.5">
                        <span>{d.date}</span>
                        <span className="font-semibold">{d.count}</span>
                      </div>
                      <div className="h-2 bg-[#F5F1EB] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#024396] to-[#0356c4] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#2A364B]/40">No daily data yet</p>
            )}
          </div>
        </div>

        {/* Send notification to website visitors */}
        <div className="bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6 max-w-lg">
          <h3 className="text-sm font-semibold text-[#0E1B2C] mb-1">Send Website Notification</h3>
          <p className="text-xs text-[#2A364B]/50 mb-4">Push notification to all subscribed website visitors</p>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New SIP Scheme Available!" className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Message</label>
              <textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Details about the update..." className={`${field} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2A364B]/70 mb-1">Link (optional)</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://thefinancialdoctor.in/calculators" className={field} />
            </div>
            {sendMsg && (
              <p className={`text-sm ${sendMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{sendMsg.text}</p>
            )}
            <button type="submit" disabled={sending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25 disabled:opacity-60">
              {sending ? "Sending..." : `Send to ${stats?.push_subscribers || 0} Subscriber(s)`}
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
