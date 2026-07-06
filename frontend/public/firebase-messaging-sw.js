/* eslint-disable no-restricted-globals */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, link } = payload.data || payload.notification || {};
  self.registration.showNotification(title || "TFD Workspace", {
    body: body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    data: { url: link || "/portal/employee" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/portal/employee";
  event.waitUntil(clients.openWindow(url));
});
