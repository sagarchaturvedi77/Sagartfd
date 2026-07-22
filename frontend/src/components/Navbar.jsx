import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { IDS } from "../constants/testIds";
import { useModal } from "../context/ModalContext";

const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";

// 🎯 Every section now has its own dedicated page + URL
const links = [
  { id: "about", label: "About", path: "/about" },
  { id: "calc", label: "Calculators", path: "/calculators" },
  { id: "funds", label: "Top Funds", path: "/top-funds" },
  { id: "services", label: "Services", path: "/services" },
  { id: "reviews", label: "Reviews", path: "/reviews" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "career", label: "Career", path: "/career" },
  { id: "internship", label: "Internship 🎓", path: "/internship", badge: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { openGateway } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // SPA navigation: no full page reload, instant route change
  const handleNavClick = (link, isMobile = false) => {
    if (isMobile) setOpen(false);
    navigate(link.path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          href="/"
          data-testid={IDS?.nav?.logo || "nav-logo"}
          className="flex items-center gap-3 group"
        >
          <img
            src={LOGO_URL}
            alt="The Financial Doctor"
            className="h-12 sm:h-14 w-auto object-contain shrink-0"
            width={900}
            height={235}
            fetchpriority="high"
          />
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-7 text-[15px] text-[#2A364B]">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => handleNavClick(l)}
              className="hover:text-[#024396] transition-colors relative font-medium text-[15px] cursor-pointer bg-transparent border-none outline-none"
            >
              {l.label}
              {l.badge && (
                <span className="absolute -top-1 -right-2.5 w-2 h-2 rounded-full bg-[#14E0A0] shadow-[0_0_6px_#14E0A0] animate-nav-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* DESKTOP ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-5 ml-8">
          <button
            onClick={() => navigate("/search")}
            aria-label="Search"
            data-testid="nav-search"
            className="text-[#2A364B] hover:text-[#024396] transition-colors cursor-pointer"
          >
            <Search size={19} />
          </button>
          <button
            onClick={openGateway}
            data-testid={IDS?.nav?.cta || "nav-cta"}
            className="btn-pill btn-primary text-sm cursor-pointer"
          >
            Start Investing
          </button>
        </div>

        {/* MOBILE: search + burger */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => navigate("/search")}
            aria-label="Search"
            data-testid="nav-search-mobile"
            className="text-[#0E1B2C] p-2"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="text-[#0E1B2C] p-2"
            aria-label="Toggle menu"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWERS */}
      {open && (
        <div className="md:hidden bg-[#F6F1E8] border-t border-[#E2D8C2] px-6 py-4">
          <ul className="space-y-4">
            {links.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => handleNavClick(l, true)}
                  className="text-[#0E1B2C] text-lg font-display block text-left w-full cursor-pointer relative"
                >
                  {l.label}
                  {l.badge && (
                    <span className="inline-block ml-2 w-2 h-2 rounded-full bg-[#14E0A0] shadow-[0_0_6px_#14E0A0] animate-nav-pulse align-middle" />
                  )}
                </button>
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
