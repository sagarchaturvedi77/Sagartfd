import React, { useEffect, useState } from "react";
import {
    MessageCircle,
    Instagram,
    Youtube,
    Linkedin,
    Star,
    Sparkles,
    X,
    Users,
    Plus,
} from "lucide-react";
import { LINKS } from "@/lib/links";

const rightActions = [
    {
        id: "wa-community",
        label: "WhatsApp Community",
        sub: "MF info — Daily",
        icon: Users,
        bg: "#128C7E",
        href: LINKS.whatsappCommunity,
        testid: "fab-whatsapp-community",
    },
    {
        id: "google",
        label: "Rate us on Google",
        sub: "Leave a 5★ review",
        icon: Star,
        bg: "#FBBC04",
        href: LINKS.googleReviews,
        testid: "fab-google",
    },
    {
        id: "ig",
        label: "Instagram",
        sub: "@the_financial.doctor",
        icon: Instagram,
        bg: "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
        href: LINKS.instagram,
        testid: "fab-instagram",
    },
    {
        id: "yt",
        label: "YouTube",
        sub: "@the_financial_doctor",
        icon: Youtube,
        bg: "#FF0000",
        href: LINKS.youtube,
        testid: "fab-youtube",
    },
    {
        id: "li",
        label: "LinkedIn",
        sub: "Connect with Sagar",
        icon: Linkedin,
        bg: "#0A66C2",
        href: LINKS.linkedin,
        testid: "fab-linkedin",
    },
];

export default function FloatingActions() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <>
            {/* LEFT — AI chat standalone */}
            <button
                onClick={() => window.dispatchEvent(new CustomEvent("tfd:open-ai-chat"))}
                aria-label="Ask TFD-AI — your AI financial guide"
                data-testid="fab-ai-chat"
                className="fixed left-3 md:left-6 bottom-5 md:bottom-6 z-[55] group"
            >
                <span
                    className="flex items-center gap-2 pl-1 pr-3 md:pr-4 py-1 rounded-full shadow-2xl text-[#F6F1E8] hover:scale-105 transition-transform"
                    style={{ background: "linear-gradient(135deg, #0E5E48 0%, #0A4838 100%)" }}
                >
                    <span
                        className="w-12 h-12 rounded-full grid place-items-center relative shrink-0"
                        style={{ background: "linear-gradient(135deg, #C9802A 0%, #B66B1B 100%)" }}
                    >
                        <Sparkles size={20} />
                        {/* AI pulse dot */}
                        <span
                            aria-hidden
                            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#0E5E48] animate-pulse"
                        />
                    </span>
                    <span className="flex flex-col items-start leading-none pr-1 max-w-[160px]">
                        <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase opacity-80 font-semibold">
                            <span className="px-1.5 py-0.5 rounded-sm bg-[#C9802A] text-white text-[8px]">
                                AI
                            </span>
                            Ask me anything
                        </span>
                        <span className="font-display text-[13px] mt-0.5 whitespace-nowrap">
                            Planning your future
                        </span>
                    </span>
                </span>
            </button>

            {/* RIGHT — WhatsApp + expandable stack of socials */}
            <div className="fixed right-3 md:right-6 bottom-5 md:bottom-6 z-[55] flex flex-col items-end gap-2.5">
                {/* expandable stack (closest to WhatsApp first) */}
                <div
                    className={`flex flex-col-reverse gap-2.5 transition-all duration-300 ${
                        open
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-3 pointer-events-none"
                    }`}
                >
                    {rightActions.map((a, idx) => {
                        const Icon = a.icon;
                        return (
                            <a
                                key={a.id}
                                href={a.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={a.label}
                                data-testid={a.testid}
                                className="flex items-center gap-2 hover:scale-105 transition-transform"
                                style={{ transitionDelay: open ? `${idx * 35}ms` : "0ms" }}
                            >
                                <span className="bg-[#0E1B2C] text-[#F6F1E8] rounded-full px-3 py-1.5 text-[11.5px] shadow-lg whitespace-nowrap">
                                    <span className="font-medium leading-tight block">
                                        {a.label}
                                    </span>
                                    <span className="text-[9.5px] opacity-70">{a.sub}</span>
                                </span>
                                <span
                                    className="w-11 h-11 rounded-full grid place-items-center text-white shadow-lg shrink-0"
                                    style={{ background: a.bg }}
                                >
                                    <Icon size={18} />
                                </span>
                            </a>
                        );
                    })}
                </div>

                {/* Plus toggle (above WhatsApp) */}
                <button
                    onClick={() => setOpen(!open)}
                    aria-label={open ? "Close socials" : "More links"}
                    data-testid="fab-toggle"
                    className="flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <span className="bg-[#0E1B2C]/85 text-[#F6F1E8] rounded-full px-3 py-1 text-[10.5px] shadow-md whitespace-nowrap font-medium">
                        {open ? "Close" : "More links"}
                    </span>
                    <span
                        className="w-10 h-10 rounded-full grid place-items-center text-[#F6F1E8] shadow-lg"
                        style={{ background: "#0E1B2C" }}
                    >
                        {open ? <X size={16} /> : <Plus size={18} />}
                    </span>
                </button>

                {/* WhatsApp main button */}
                <a
                    href={LINKS.whatsappDM}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Sagar ji directly"
                    data-testid="fab-whatsapp"
                    className="group"
                >
                    <span
                        className="flex items-center gap-2 pl-1 pr-3 md:pr-4 py-1 rounded-full shadow-2xl text-white hover:scale-105 transition-transform"
                        style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                    >
                        <span className="w-12 h-12 rounded-full grid place-items-center bg-white/15 shrink-0">
                            <MessageCircle size={20} />
                        </span>
                        <span className="flex flex-col items-start leading-none pr-1 max-w-[140px]">
                            <span className="text-[9px] tracking-[0.18em] uppercase opacity-90 font-semibold">
                                Chat with us
                            </span>
                            <span className="font-display text-[13px] mt-0.5 whitespace-nowrap">
                                WhatsApp Sagar ji
                            </span>
                        </span>
                    </span>
                </a>
            </div>
        </>
    );
}
