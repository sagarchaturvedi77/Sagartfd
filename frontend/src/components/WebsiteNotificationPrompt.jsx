import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function subscribeWebPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const res = await fetch(`${API_BASE}/api/analytics/vapid-public-key`);
    const data = await res.json();
    if (!data.enabled || !data.key) return false;

    // "/service-worker.js" doesn't exist in this project — that registration
    // always failed silently, so Notification.permission showed "granted" in
    // the visitor's browser but no subscription was ever actually created,
    // and the admin's Push Subscribers count never moved.
    let reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) reg = await navigator.serviceWorker.register("/web-push-sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });
    }
    const json = sub.toJSON();
    await fetch(`${API_BASE}/api/analytics/web-push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export default function WebsiteNotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("tfd_web_notif_dismissed") === "1") return;

    const timer = setTimeout(() => setShow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const allow = async () => {
    setShow(false);
    localStorage.setItem("tfd_web_notif_dismissed", "1");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      await subscribeWebPush();
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("tfd_web_notif_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm animate-[slideUp_0.3s_ease]">
      <div className="bg-[#0E1B2C] text-white rounded-2xl shadow-2xl p-5 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Stay Updated!</p>
            <p className="text-xs text-white/60 mt-1">
              Get alerts on new schemes, market updates & exclusive offers from The Financial Doctor.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={dismiss}
            className="flex-1 py-2 rounded-xl text-xs font-medium text-white/50 border border-white/20 hover:bg-white/5 transition-all">
            Not now
          </button>
          <button onClick={allow}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#024396] to-[#0356c4] hover:from-[#023580] transition-all shadow-lg shadow-[#024396]/25">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
