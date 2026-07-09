import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || "";

export default function useFirebaseMessaging() {
  const { token: authToken, user } = useAuth();

  useEffect(() => {
    if (!authToken || !user) return;

    async function registerFCM() {
      try {
        const { messaging, getToken, onMessage } = await import("../firebaseConfig");
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!fcmToken) return;

        // Register token with backend
        await fetch(`${API_BASE}/api/notifications/register-fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token: fcmToken }),
        });

        // Handle foreground messages — payload is data-only (see
        // backend/notification_service.py), so read from payload.data.
        onMessage(messaging, (payload) => {
          const { title, body, link } = payload.data || payload.notification || {};
          if (title && Notification.permission === "granted") {
            const n = new Notification(title, {
              body: body || "",
              icon: "/tfd-workspace-logo.png",
              badge: "/tfd-workspace-logo.png",
            });
            n.onclick = () => {
              window.focus();
              if (link) window.location.href = link;
            };
          }
        });
      } catch (e) {
        // Firebase messaging not supported or blocked
        console.log("FCM registration skipped:", e.message);
      }
    }

    registerFCM();
  }, [authToken, user]);
}
