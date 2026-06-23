import React, { useEffect, useState } from "react";
import { X, MessageCircle, Sparkles, TrendingUp, Bell, Lightbulb } from "lucide-react";

const STORAGE_KEY = "tfd_wa_community_popup_v1";
const SHOW_AFTER_MS = 10000;
const COMMUNITY_LINK = "https://chat.whatsapp.com/JEb2Ilngiq45oqyUQDMFSX";

const perks = [
    { icon: TrendingUp, text: "Daily MF picks & NAV updates" },
    { icon: Lightbulb, text: "Free SIP & ELSS strategies" },
    { icon: Bell, text: "Tax-saving alerts & market briefs" },
    { icon: Sparkles, text: "Direct Q&A with Sagar ji" },
];

export default function WhatsAppCommunityPopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY)) return;

        let cancelled = false;
        const tryShow = (delay) => {
            setTimeout(() => {
                if (cancelled) return;
                // If LeadPopup is currently visible, defer by 6s
                if (document.querySelector("[data-testid='lead-popup']")) {
                    tryShow(6000);
                    return;
                }
                setOpen(true);
            }, delay);
        };
        tryShow(SHOW_AFTER_MS);
        return () => {
            cancelled = true;
        };
    }, []);

    const dismiss = (reason = "dismissed") => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ reason, at: Date.now() }));
        setOpen(false);
    };

    const join = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ reason: "joined", at: Date.now() }));
        window.open(COMMUNITY_LINK, "_blank", "noopener,noreferrer");
        setOpen(false);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[78] grid place-items-center bg-[#0E1B2C]/55 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease]"
            onClick={() => dismiss("backdrop")}
            data-testid="wa-community-popup"
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popInWA { from { opacity: 0; transform: translateY(20px) scale(0.96) } to { opacity: 1; transform: none } }
            `}</style>
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-[popInWA_0.4s_ease]"
                style={{ background: "#FBF7EE" }}
            >
                <button
                    onClick={() => dismiss("close")}
                    aria-label="Close popup"
                    data-testid="wa-community-popup-close"
                    className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/90 hover:bg-white text-[#0E1B2C] z-10"
                >
                    <X size={16} />
                </button>

                {/* WhatsApp green header */}
                <div
                    className="px-6 py-7 text-white relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                >
                    <div
                        aria-hidden
                        className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"
                    />
                    <div
                        aria-hidden
                        className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-white/5"
                    />
                    <div className="relative flex items-center gap-3">
                        <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
                            <MessageCircle size={26} />
                        </span>
                        <div>
                            <div className="text-[10px] tracking-[0.22em] uppercase opacity-90 font-semibold">
                                The Financial Doctor · MF Community
                            </div>
                            <div className="font-display text-2xl mt-1.5 leading-tight">
                                Join 500+ smart investors
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6">
                    <p className="text-[14px] text-[#2A364B] leading-relaxed">
                        Free <strong>mutual fund information</strong> directly on WhatsApp — daily picks,
                        NAV alerts, tax-saving tips and live Q&amp;A with{" "}
                        <strong>Sagar Chaturvedi</strong> (AMFI ARN-290298).
                    </p>

                    <ul className="mt-5 space-y-3">
                        {perks.map((p, idx) => {
                            const Icon = p.icon;
                            return (
                                <li key={idx} className="flex items-center gap-3 text-[13.5px] text-[#0E1B2C]">
                                    <span className="w-8 h-8 rounded-full bg-[#25D366]/15 text-[#128C7E] grid place-items-center shrink-0">
                                        <Icon size={15} />
                                    </span>
                                    {p.text}
                                </li>
                            );
                        })}
                    </ul>

                    <button
                        onClick={join}
                        data-testid="wa-community-popup-join"
                        className="btn-pill w-full justify-center mt-6 text-white"
                        style={{
                            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                            boxShadow: "0 10px 24px -10px rgba(37,211,102,0.7)",
                        }}
                    >
                        <MessageCircle size={16} /> Join WhatsApp Community — Free
                    </button>

                    <button
                        type="button"
                        onClick={() => dismiss("maybe-later")}
                        data-testid="wa-community-popup-skip"
                        className="block mx-auto mt-4 text-[12px] text-[#5C677D] hover:text-[#0E1B2C] underline-offset-2 hover:underline"
                    >
                        Maybe later
                    </button>

                    <p className="text-[10px] text-[#5C677D] text-center mt-4 leading-relaxed">
                        Educational content only. No spam, no calls. Mutual fund investments are subject
                        to market risks — read all scheme-related documents carefully.
                    </p>
                </div>
            </div>
        </div>
    );
}
