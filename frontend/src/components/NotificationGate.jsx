import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { registerServiceWorker, enablePush } from "../portal/push";

/**
 * NotificationGate — shows full-screen overlay blocking portal until notifications are enabled.
 * Renders as overlay only when permission is not "granted".
 */
export default function NotificationGate() {
  const [blocked, setBlocked] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      // Browser doesn't support notifications
      return;
    }
    if (Notification.permission !== "granted") {
      setBlocked(true);
    }
  }, []);

  const requestPermission = async () => {
    setAsking(true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        // Permission alone doesn't create a push subscription — without this,
        // the gate would clear but push_subscriptions would stay empty until
        // the next full page load (when PortalLayout's mount-time check
        // re-runs), so this device would silently miss every notification
        // until then.
        await registerServiceWorker();
        const r = await enablePush();
        console.log("[push] enablePush result:", r);
        setBlocked(false);
      }
    } catch {
      // denied
    }
    setAsking(false);
  };

  if (!blocked) return null;

  const isDenied = typeof Notification !== "undefined" && Notification.permission === "denied";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-b from-[#0E1B2C] to-[#162d4a] px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
          {isDenied ? <AlertTriangle size={32} className="text-orange-500" /> : <Bell size={32} className="text-[#024396]" />}
        </div>
        <h2 className="text-lg font-semibold text-[#0E1B2C] mb-2">
          {isDenied ? "Notifications Blocked" : "Enable Notifications"}
        </h2>
        {isDenied ? (
          <p className="text-sm text-[#2A364B]/70 mb-5">
            Aapne notifications block kar diye hain. App use karne ke liye browser settings mein jaake
            notifications allow karein, phir page refresh karein.
          </p>
        ) : (
          <p className="text-sm text-[#2A364B]/70 mb-5">
            TFD WorkSpace ko chalane ke liye notifications allow karna zaruri hai.
            Follow-up reminders, new lead alerts aur important updates aapke phone pe aayenge.
          </p>
        )}

        {!isDenied && (
          <button
            onClick={requestPermission}
            disabled={asking}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580] transition-all disabled:opacity-50"
          >
            {asking ? "Requesting..." : "Allow Notifications"}
          </button>
        )}

        {isDenied && (
          <div className="space-y-3">
            <p className="text-xs text-[#2A364B]/50">
              Steps: Browser address bar ke left side mein lock icon pe click karein →
              Notifications → Allow select karein → Page refresh karein
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#024396] hover:bg-[#023580] transition-all"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
