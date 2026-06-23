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

const rightActions = [
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
                aria-label="Ask TFD-AI"
                data-testid="fab-ai-chat"
                className="fixed left-4 md:left-6 bottom-6 z-[55] group"
            >
                <span
                    className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full shadow-2xl text-[#F6F1E8] hover:scale-105 transition-transform"
                    style={{ background: "linear-gradient(135deg, #0E5E48 0%, #0A4838 100%)" }}
                >
                    <span
                        className="w-12 h-12 rounded-full grid place-items-center"
                        style={{ background: "linear-gradient(135deg, #C9802A 0%, #B66B1B 100%)" }}
                    >
                        <Sparkles size={20} />
                    </span>
                    <span className="hidden sm:flex flex-col items-start leading-none pr-1">
                        <span className="text-[10px] tracking-[0.18em] uppercase opacity-80">
                            Ask
                        </span>
                        <span className="font-display text-[15px] mt-0.5">TFD-AI</span>
                    </span>
                </span>
            </button>

            {/* RIGHT — WhatsApp + expandable stack of socials */}
            <div className="fixed right-4 md:right-6 bottom-6 z-[55] flex flex-col items-end gap-2.5">
                {/* expandable stack (reverse so closest to WA is the first social) */}
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
                                className="flex items-center gap-3 hover:scale-105 transition-transform"
                                style={{ transitionDelay: open ? `${idx * 35}ms` : "0ms" }}
                            >
                                <span className="bg-[#0E1B2C] text-[#F6F1E8] rounded-full px-3.5 py-1.5 text-[12px] shadow-lg whitespace-nowrap hidden sm:block">
                                    <span className="font-medium leading-tight block">{a.label}</span>
                                    <span className="text-[10px] opacity-70">{a.sub}</span>
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
                    className="w-10 h-10 rounded-full grid place-items-center text-[#F6F1E8] shadow-lg hover:scale-105 transition-transform"
                    style={{ background: "#0E1B2C" }}
                >
                    {open ? <X size={16} /> : <Plus size={18} />}
                </button>

                {/* WhatsApp main button */}
                <a
                    href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20know%20more%20about%20mutual%20fund%20investments."
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Sagar ji"
                    data-testid="fab-whatsapp"
                    className="group"
                >
                    <span
                        className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full shadow-2xl text-white hover:scale-105 transition-transform"
                        style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                    >
                        <span className="w-12 h-12 rounded-full grid place-items-center bg-white/15">
                            <MessageCircle size={20} />
                        </span>
                        <span className="hidden sm:flex flex-col items-start leading-none pr-1">
                            <span className="text-[10px] tracking-[0.18em] uppercase opacity-90">
                                Chat
                            </span>
                            <span className="font-display text-[15px] mt-0.5">WhatsApp</span>
                        </span>
                    </span>
                </a>
            </div>
        </>
    );
}
