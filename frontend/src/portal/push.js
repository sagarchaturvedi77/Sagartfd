// Service worker registration + Web Push subscription helpers.
import { API_BASE, apiGet, apiSend } from "./api";

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Same service worker the public website's visitor push uses
    // (components/WebsiteNotificationPrompt.jsx) — one generic handler
    // (title/body/url payload) covers both audiences, no Firebase involved.
    return await navigator.serviceWorker.register("/web-push-sw.js");
  } catch (e) {
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Subscribe the current browser to push and persist the subscription on the server.
export async function enablePush() {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  let vapid;
  try {
    vapid = await apiGet("/api/notifications/vapid-public-key");
  } catch (e) {
    return { ok: false, reason: "no-vapid" };
  }
  if (!vapid || !vapid.enabled || !vapid.key) return { ok: false, reason: "no-vapid" };

  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
  if (!reg) return { ok: false, reason: "no-sw" };

  try {
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      // A subscription can be left over from before a VAPID key rotation —
      // its applicationServerKey no longer matches ours, and re-POSTing it
      // as-is would just create a subscription the server can never
      // actually push to. Compare against the current key and force a
      // fresh subscribe if it doesn't match, instead of silently reusing
      // a dead one forever.
      const currentKey = sub.options?.applicationServerKey
        ? btoa(String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey)))
        : null;
      const expectedKey = btoa(String.fromCharCode(...urlBase64ToUint8Array(vapid.key)));
      if (currentKey && currentKey !== expectedKey) {
        await sub.unsubscribe();
        sub = null;
      }
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.key),
      });
    }
    const json = sub.toJSON();
    await apiSend("/api/notifications/subscribe", "POST", {
      endpoint: json.endpoint,
      keys: json.keys,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "subscribe-failed", error: e?.message || String(e) };
  }
}

export { API_BASE };
