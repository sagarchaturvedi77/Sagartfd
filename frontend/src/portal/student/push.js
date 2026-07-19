// Service worker registration + Web Push subscription helpers for the
// internship student portal — same pattern as portal/push.js (staff), just
// using the student's own token/endpoints since students carry a completely
// separate JWT/role from staff and can't use the staff apiGet/apiSend client.
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

export function pushSupported() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
        // Same generic service worker every push audience uses (staff,
        // website visitors) — title/body/url payload, no Firebase involved.
        return await navigator.serviceWorker.register("/web-push-sw.js");
    } catch {
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

// Subscribes the current browser to push and persists it on the server —
// does NOT itself prompt for permission (call Notification.requestPermission()
// first; see NotificationGate.jsx, which owns the actual permission prompt).
export async function enablePush(token) {
    if (!pushSupported()) return { ok: false, reason: "unsupported" };
    if (Notification.permission !== "granted") return { ok: false, reason: "not-granted" };

    let vapid;
    try {
        const res = await fetch(`${API_BASE}/api/internship/notifications/vapid-public-key`);
        vapid = await res.json();
    } catch {
        return { ok: false, reason: "no-vapid" };
    }
    if (!vapid || !vapid.enabled || !vapid.key) return { ok: false, reason: "no-vapid" };

    const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
    if (!reg) return { ok: false, reason: "no-sw" };

    try {
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (sub) {
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
        await fetch(`${API_BASE}/api/internship/notifications/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: "subscribe-failed", error: e?.message || String(e) };
    }
}
