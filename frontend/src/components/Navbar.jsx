import React, { useEffect, useState } from "react";
import { Menu, X, Briefcase } from "lucide-react";
import { IDS } from "../constants/testIds";
// 🛠️ Replaced absolute alias directly with clean relative folders pairing
import { useModal } from "../context/ModalContext"; 

const LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

const links = [
  { id: "about", label: "About" },
  { id: "calc", label: "Calculators" },
  { id: "funds", label: "Top Funds" },
  { id: "services", label: "Services" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
  { id: "career", label: "Career" }, // 🎯 Added Career right next to Contact
];

export default function Navbar({ onOpenCareer }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { openGateway } = useModal(); 

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-[#F6F1E8]/85 border-b border-[#E2D8C2]"
          : "bg-transparent"
      }`}
    >
      <div className="container-x flex items-center justify-between py-4 px-6">
        {/* LOGO LINK */}
        <a
          href="#top"
          data-testid={IDS?.nav?.logo || "nav-logo"}
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

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-7 text-[15px] text-[#2A364B]">
          {links.map((l) => {
            // Check if link is Career to invoke popup state trigger safely
            if (l.id === "career") {
              return (
                <button
                  key={l.id}
                  onClick={onOpenCareer}
                  className="hover:text-[#024396] transition-colors relative font-medium text-[15px]"
                >
                  {l.label}
                </button>
              );
            }
            return (
              <a
                key={l.id}
                href={`#${l.id}`}
                className="hover:text-[#024396] transition-colors relative"
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        {/* DESKTOP ACTION BUTTONS (WhatsApp Removed Perfectly) */}
        <div className="hidden md:flex items-center gap-6 ml-8">
          <button
            onClick={openGateway}
            data-testid={IDS?.nav?.cta || "nav-cta"}
            className="btn-pill btn-primary text-sm cursor-pointer"
          >
            Start Investing
          </button>
        </div>

        {/* MOBILE BURGER TOGGLE */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-[#0E1B2C] p-2"
          aria-label="Toggle menu"
          data-testid="nav-mobile-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE RESPONSIVE DRAWERS */}
      {open && (
        <div className="md:hidden bg-[#F6F1E8] border-t border-[#E2D8C2] px-6 py-4">
          <ul className="space-y-4">
            {links.map((l) => (
              <li key={l.id}>
                {l.id === "career" ? (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpenCareer();
                    }}
                    className="text-[#0E1B2C] text-lg font-display block text-left w-full"
                  >
                    {l.label}
                  </button>
                ) : (
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    className="text-[#0E1B2C] text-lg font-display block"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  setOpen(false);
                  openGateway();
                }}
                className="btn-pill btn-primary w-full justify-center mt-2 cursor-pointer text-center"
              >
                Start Investing
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
