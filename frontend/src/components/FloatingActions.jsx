import React, { useState, useEffect } from "react";
import {
    MessageCircle,
    Instagram,
    Youtube,
    Linkedin,
    Star,
    Sparkles,
    X,
    Users,
} from "lucide-react";

const actions = [
    {
        id: "ai",
        label: "Ask TFD-AI",
        sub: "Sagar ji's AI assistant",
        icon: Sparkles,
        bg: "#0E5E48",
        kind: "custom-event",
        event: "tfd:open-ai-chat",
        testid: "fab-ai-chat",
    },
    {
        id: "wa",
        label: "Chat on WhatsApp",
        sub: "+91 77738 05794",
        icon: MessageCircle,
        bg: "#25D366",
        href: "https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20know%20more%20about%20mutual%20fund%20investments.",
        testid: "fab-whatsapp",
    },
    {
        id: "wa-community",
        label: "WhatsApp Community",
        sub: "Daily finance tips",
        icon: Users,
        bg: "#128C7E",
        href: "https://chat.whatsapp.com/KTs87c2XR2I0JwYpU8dDEE",
        testid: "fab-whatsapp-community",
    },
    {
        id: "google",
        label: "Rate us on Google",
        sub: "Leave a 5★ review",
        icon: Star,
        bg: "#FBBC04",
        href: "https://share.google/8w0NsnnohM2bqqk0y",
        testid: "fab-google",
    },
    {
        id: "ig",
        label: "Instagram",
        sub: "@the_financial.doctor",
        icon: Instagram,
        bg: "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
        href: "https://www.instagram.com/the_financial.doctor",
        testid: "fab-instagram",
    },
    {
        id: "yt",
        label: "YouTube",
        sub: "@the_financial_doctor",
        icon: Youtube,
        bg: "#FF0000",
        href: "https://youtube.com/@the_financial_doctor",
        testid: "fab-youtube",
    },
    {
        id: "li",
        label: "LinkedIn",
        sub: "Connect with Sagar",
        icon: Linkedin,
        bg: "#0A66C2",
        href: "https://www.linkedin.com/in/sagarchaturvedisehore",
        testid: "fab-linkedin",
    },
];

export default function FloatingActions() {
    const [open, setOpen] = useState(false);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handle = (a) => {
        if (a.kind === "custom-event") {
            window.dispatchEvent(new CustomEvent(a.event));
            setOpen(false);
        }
    };

    return (
        <div
            className="fixed left-4 md:left-6 bottom-6 z-[55] flex flex-col items-start gap-3"
            data-testid="floating-actions"
        >
            {/* Expanding action list */}
            <div
                className={`flex flex-col-reverse gap-2.5 transition-all duration-300 ${
                    open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
                }`}
            >
                {actions.map((a, idx) => {
                    const Icon = a.icon;
                    const inner = (
                        <span
                            className="w-12 h-12 rounded-full grid place-items-center text-white shadow-lg shrink-0"
                            style={{ background: a.bg }}
                        >
                            <Icon size={20} />
                        </span>
                    );
                    return (
                        <div
                            key={a.id}
                            className="flex items-center gap-3 group"
                            style={{ transitionDelay: open ? `${idx * 40}ms` : "0ms" }}
                        >
                            {a.href ? (
                                <a
                                    href={a.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={a.label}
                                    data-testid={a.testid}
                                    className="flex items-center gap-3 hover:scale-105 transition-transform"
                                >
                                    {inner}
                                </a>
                            ) : (
                                <button
                                    onClick={() => handle(a)}
                                    aria-label={a.label}
                                    data-testid={a.testid}
                                    className="flex items-center gap-3 hover:scale-105 transition-transform"
                                >
                                    {inner}
                                </button>
                            )}
                            <div className="bg-[#0E1B2C] text-[#F6F1E8] rounded-full px-3.5 py-1.5 text-[12px] shadow-lg whitespace-nowrap hidden sm:block">
                                <div className="font-medium leading-tight">{a.label}</div>
                                <div className="text-[10px] opacity-70">{a.sub}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main toggle */}
            <button
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close menu" : "Open quick actions"}
                data-testid="fab-toggle"
                className="w-14 h-14 rounded-full grid place-items-center text-[#F6F1E8] shadow-2xl transition-transform hover:scale-105"
                style={{
                    background: open
                        ? "#0E1B2C"
                        : "linear-gradient(135deg, #0E5E48 0%, #0A4838 100%)",
                }}
            >
                {open ? <X size={22} /> : <Sparkles size={22} />}
            </button>
        </div>
    );
}
