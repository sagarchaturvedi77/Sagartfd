import React, { useEffect, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { IDS } from "@/constants/testIds";

const LOGO_URL =
    "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

const links = [
    { id: "about", label: "About" },
    { id: "calc", label: "Calculators" },
    { id: "funds", label: "Top Funds" },
    { id: "services", label: "Services" },
    { id: "reviews", label: "Reviews" },
    { id: "contact", label: "Contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed top-[40px] left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "backdrop-blur-md bg-[#F6F1E8]/85 border-b border-[#E2D8C2]"
                    : "bg-transparent"
            }`}
        >
            <div className="container-x flex items-center justify-between py-4 px-6">
                <a
                    href="#top"
                    data-testid={IDS.nav.logo}
                    className="flex items-center gap-3 group"
                >
                    <img
                        src={LOGO_URL}
                        alt="The Financial Doctor"
                        className="h-12 sm:h-14 w-auto object-contain shrink-0"
                    />
                    <span className="hidden lg:inline-flex items-center border-l border-[#E2D8C2] pl-3 text-[10px] tracking-[0.2em] text-[#5C677D] uppercase">
                        ARN-290298 · Sehore
                    </span>
                </a>

                <nav className="hidden md:flex items-center gap-7 text-[15px] text-[#2A364B]">
                    {links.map((l) => (
                        <a
                            key={l.id}
                            href={`#${l.id}`}
                            className="hover:text-[#024396] transition-colors relative"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-6 ml-8">
                    <a
                        href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20know%20more%20about%20mutual%20fund%20investments."
                        target="_blank"
                        rel="noreferrer"
                        data-testid={IDS.nav.whatsapp}
                        className="btn-pill btn-ghost text-sm"
                    >
                        <MessageCircle size={16} />
                        WhatsApp
                    </a>
                    <a
                        href="https://www.assetplus.in/mfd/ARN-290298"
                        target="_blank"
                        rel="noreferrer"
                        data-testid={IDS.nav.cta}
                        className="btn-pill btn-primary text-sm"
                    >
                        Start Investing
                    </a>
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden text-[#0E1B2C] p-2"
                    aria-label="Toggle menu"
                    data-testid="nav-mobile-toggle"
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {open && (
                <div className="md:hidden bg-[#F6F1E8] border-t border-[#E2D8C2] px-6 py-4">
                    <ul className="space-y-4">
                        {links.map((l) => (
                            <li key={l.id}>
                                <a
                                    href={`#${l.id}`}
                                    onClick={() => setOpen(false)}
                                    className="text-[#0E1B2C] text-lg font-display"
                                >
                                    {l.label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <a
                                href="https://www.assetplus.in/mfd/ARN-290298"
                                target="_blank"
                                rel="noreferrer"
                                className="btn-pill btn-primary w-full justify-center mt-2"
                            >
                                Start Investing
                            </a>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}
