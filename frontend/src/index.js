import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// One-time cleanup for orphaned service workers from earlier product
// iterations (public/sw.js — a since-deleted internship PWA cache-first
// worker that precached "/internship" itself; also covers the old FCM-era
// firebase-messaging-sw.js / service-worker.js). None of these files exist
// in the current build and nothing registers them anymore, but a service
// worker that a visitor's browser installed in the past stays active
// forever until something explicitly unregisters it — removing the
// registration call in code does NOT remove an already-installed worker.
// The old sw.js's cache-first fetch handler was still intercepting
// "/internship" specifically (the one path it precached) and serving that
// stale response, which is why only that route kept reverting to dead
// content while every other route loaded fine. Only /web-push-sw.js
// (current, active, used for push notifications) is left alone; every
// other registration and every Cache Storage entry is removed, since the
// current service worker never uses the Cache API itself.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
      if (!scriptURL.endsWith("/web-push-sw.js")) {
        reg.unregister();
      }
    }
  }).catch(() => {});
  if ("caches" in window) {
    caches.keys().then((names) => names.forEach((name) => caches.delete(name))).catch(() => {});
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
