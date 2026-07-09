import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const VISITOR_ID_KEY = "tfd_visitor_id";

// Anonymous, persistent per-browser ID — lets the backend correlate "this
// visitor used the SIP calculator" with "this visitor's push subscription"
// so behavioral follow-up notifications (calculator-use nudge, proposal
// download follow-up) can target the right person. Not tied to any account.
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return null; // localStorage unavailable (private mode etc.) — degrade gracefully
  }
}

async function getCityInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return {};
    const data = await res.json();
    return { city: data.city || null, region: data.region || null, country: data.country_name || null };
  } catch {
    return {};
  }
}

let _geoCache = null;

async function trackPageView(page) {
  try {
    if (!_geoCache) _geoCache = await getCityInfo();
    await fetch(`${API_BASE}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page,
        referrer: document.referrer || null,
        visitor_id: getVisitorId(),
        ..._geoCache,
      }),
    });
  } catch { /* silent */ }
}

export async function trackEvent(event, label, page) {
  try {
    if (!_geoCache) _geoCache = await getCityInfo();
    await fetch(`${API_BASE}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        label: label || null,
        page: page || window.location.pathname,
        visitor_id: getVisitorId(),
        ..._geoCache,
      }),
    });
  } catch { /* silent */ }
}

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/portal")) return;
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
