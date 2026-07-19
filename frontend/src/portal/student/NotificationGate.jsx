import React, { useEffect, useState } from "react";
import { Bell, Settings2 } from "lucide-react";
import { useInternshipAuth } from "./InternshipAuthContext";
import { pushSupported, enablePush } from "./push";

// A real gate, not a dismissible nag — the portal's content underneath
// doesn't render until permission is granted (or the browser genuinely
// can't support push at all, which is a real dead-end no button can fix,
// not a loophole for "not now"). "denied" (previously blocked) can't be
// re-prompted by JS per the Notification spec, so that state gets its own
// instructions + a "check again" retry instead of a permission button.
export default function NotificationGate({ children }) {
    const { token } = useInternshipAuth();
    const [status, setStatus] = useState(() => (pushSupported() ? Notification.permission : "unsupported"));
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "granted") enablePush(token).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    if (status === "granted" || status === "unsupported") return children;

    const requestPermission = async () => {
        setWorking(true);
        setError("");
        try {
            const result = await Notification.requestPermission();
            setStatus(result);
            if (result === "granted") {
                const res = await enablePush(token);
                if (!res.ok) setError("Permission granted, but we couldn't finish setting up push — you can retry below.");
            }
        } catch {
            setError("Something went wrong requesting permission — please try again.");
        }
        setWorking(false);
    };

    return (
        <div className="min-h-screen bg-[#050B16] text-white flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#14E0A0]/10 border border-[#14E0A0]/25 flex items-center justify-center mx-auto mb-5">
                    <Bell size={24} className="text-[#14E0A0]" />
                </div>
                <h1 className="font-display text-xl font-bold mb-2">Enable Notifications to Continue</h1>
                <p className="text-white/55 text-sm leading-relaxed mb-6">
                    Task updates, your manager's messages, and certificate alerts all come through here — the
                    internship portal needs notifications turned on to work properly.
                </p>

                {status === "denied" ? (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left mb-4">
                        <p className="text-amber-200 text-xs font-bold mb-1.5 flex items-center gap-1.5">
                            <Settings2 size={13} /> Notifications are blocked for this site
                        </p>
                        <p className="text-amber-200/70 text-xs leading-relaxed">
                            Your browser previously blocked this. Open your browser's site settings for this page,
                            set Notifications to "Allow", then tap the button below.
                        </p>
                    </div>
                ) : null}

                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                <button
                    onClick={requestPermission}
                    disabled={working}
                    className="w-full flex items-center justify-center gap-2 bg-[#14E0A0] hover:bg-[#0FCB8F] disabled:opacity-50 text-[#050B16] font-bold text-sm py-3 rounded-xl shadow-[0_8px_24px_rgba(20,224,160,0.3)] transition-all"
                >
                    <Bell size={16} /> {working ? "Checking..." : status === "denied" ? "I've enabled it — check again" : "Enable Notifications"}
                </button>
            </div>
        </div>
    );
}
