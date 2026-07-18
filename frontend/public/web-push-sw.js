/* Shared service worker for raw Web Push (VAPID) — covers both the public
 * website's anonymous visitors (components/WebsiteNotificationPrompt.jsx +
 * backend/analytics_routes.py) and the staff portal (src/portal/push.js +
 * backend/notification_service.py). One delivery mechanism, one handler,
 * for desktop Chrome/Edge, Android Chrome, and installed iOS Safari PWAs —
 * no Firebase/FCM involved anywhere in this app. */
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
      icon: "/assets/logos/TFD-WORKSPACE-ICON-192.png",
      badge: "/assets/logos/TFD-WORKSPACE-ICON-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
