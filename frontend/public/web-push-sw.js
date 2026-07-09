/* Minimal service worker for the public website's raw Web Push subscriptions
 * (anonymous visitors — see components/WebsiteNotificationPrompt.jsx and
 * backend/analytics_routes.py). Deliberately separate from
 * firebase-messaging-sw.js (staff portal FCM) — Firebase's SDK claims the
 * `push` event internally for its own messages, so sharing one file risks
 * either silently dropping these plain pywebpush payloads or double-firing. */
/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "The Financial Doctor", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "The Financial Doctor";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/tfd-workspace-logo.png",
      badge: "/tfd-workspace-logo.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
