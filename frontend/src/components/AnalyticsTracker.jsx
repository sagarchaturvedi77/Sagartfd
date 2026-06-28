import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

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
