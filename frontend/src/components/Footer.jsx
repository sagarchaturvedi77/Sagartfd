import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Linkedin, MessageCircle, Sparkles, ShieldCheck, MapPin, Star } from "lucide-react";
import { LINKS } from "@/lib/links";

const LOGO_URL = "/assets/logos/TFD-MAIN-LOGO.webp";
const WORKSPACE_LOGO_URL = "/assets/logos/TFD-WORKSPACE-LOGO.webp";
const PARTNER_LOGO_URL = "/assets/logos/TFD-PARTNERHUB-LOGO.png";
const INTERNSHIP_LOGO_URL = "/assets/logos/TFD-INTERNSHIP-LOGO.png";

export default function Footer() {
    return (
        <footer className="bg-[#0E1B2C] text-[#F6F1E8]/80">
            <div className="container-x px-6 py-14 grid md:grid-cols-4 gap-10">
                <div>
                    <img
                        src={LOGO_URL}
                        alt="The Financial Doctor"
                        className="h-14 w-auto object-contain bg-[#F6F1E8] rounded-lg p-1.5"
                        width={900}
                        height={235}
                        loading="lazy"
                    />
                    <p className="text-sm mt-5 leading-relaxed max-w-sm">
                        Personalised mutual fund advisory and insurance, led by Sagar Chaturvedi.
                        Empowering 1000+ families across Madhya Pradesh with goal-based planning.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        <Social href="https://www.instagram.com/the_financial.doctor" icon={Instagram} label="Instagram" />
                        <Social href="https://youtube.com/@the_financial_doctor" icon={Youtube} label="YouTube" />
                        <Social href="https://www.linkedin.com/in/sagarchaturvedisehore" icon={Linkedin} label="LinkedIn" />
                        <Social href="https://chat.whatsapp.com/JEb2Ilngiq45oqyUQDMFSX" icon={MessageCircle} label="WhatsApp Community" />
                        <Social href={LINKS.googleBusiness} icon={Star} label="Google Business Profile" />
                    </div>
                    <a
                        href={LINKS.googleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 mt-5 text-sm text-[#F6F1E8]/70 hover:text-[#F6F1E8]"
                        data-testid="footer-map-link"
                    >
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span>
                            1st Floor, above SK Finance, Sekdakhedi Road, New Bus Stand,
                            Sehore, MP – 466001
                        </span>
                    </a>
                    <a
                        href="#ai-chat"
                        onClick={(e) => {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent("tfd:open-ai-chat"));
                        }}
                        className="inline-flex items-center gap-2 mt-5 text-sm text-[#C7102E] hover:text-[#F6F1E8]"
                        data-testid="footer-ai-chat-link"
                    >
                        <Sparkles size={14} /> Ask TFD-AI anything
                    </a>
                </div>

                <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C7102E] font-semibold">
                        Explore
                    </div>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        <li><Link to="/about" className="hover:text-[#F6F1E8]">About Sagar</Link></li>
                        <li><Link to="/calculators" className="hover:text-[#F6F1E8]">Calculators</Link></li>
                        <li><Link to="/top-funds" className="hover:text-[#F6F1E8]">Top Funds</Link></li>
                        <li><Link to="/services" className="hover:text-[#F6F1E8]">Services</Link></li>
                        <li><Link to="/reviews" className="hover:text-[#F6F1E8]">Reviews</Link></li>
                        <li><Link to="/learn" className="hover:text-[#F6F1E8]">Learn</Link></li>
                        <li><Link to="/blog" className="hover:text-[#F6F1E8]">Blog</Link></li>
                        <li><Link to="/faq" className="hover:text-[#F6F1E8]">FAQ</Link></li>
                    </ul>
                </div>

                <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C7102E] font-semibold">
                        Company
                    </div>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        <li><Link to="/contact" className="hover:text-[#F6F1E8]">Contact</Link></li>
                        <li><Link to="/partner-with-us" className="hover:text-[#F6F1E8]">Partner With Us</Link></li>
                        <li><Link to="/career" className="hover:text-[#F6F1E8]">Career</Link></li>
                        <li><Link to="/internship" className="hover:text-[#F6F1E8]">Internship</Link></li>
                        <li><a href="/portal/login" className="hover:text-[#F6F1E8]">Employee Login</a></li>
                    </ul>

                    <a
                        href="/verify"
                        className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-[#0E1B2C] bg-[#F6F1E8] hover:bg-white px-3.5 py-2 rounded-full transition-colors"
                    >
                        <ShieldCheck size={14} className="text-[#C7102E]" /> Verify Certificate / Employee
                    </a>

                </div>

                <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C7102E] font-semibold">
                        Disclosure
                    </div>
                    <p className="text-xs mt-4 leading-relaxed">
                        AMFI Registered Mutual Fund Distributor — ARN-290298. The Financial Doctor
                        receives commissions from AMCs as per regulations. Mutual fund investments are
                        subject to market risks. Read all scheme-related documents carefully. Insurance
                        products distributed via licensed POSP/IRDAI partners.
                    </p>
                </div>
            </div>

            {/* Platform showcase — its own full-width strip below the
                disclaimer, not squeezed into a grid column, so each logo
                can run bigger with its name clearly labelled underneath. */}
            <div className="border-t border-[#2A364B]">
                <div className="container-x px-6 py-8">
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C7102E] font-semibold mb-5 text-center md:text-left">
                        Our Platforms
                    </div>
                    <div className="flex flex-wrap items-start gap-8 justify-center md:justify-start">
                        <FooterLogoBox href="/partner-with-us" src={PARTNER_LOGO_URL} name="TFD Partner" label="TFD PartnerHub" />
                        <FooterLogoBox href="/portal/login" src={WORKSPACE_LOGO_URL} name="TFD WorkSpace" label="TFD WorkSpace — staff portal" />
                        <FooterLogoBox href="/internship" src={INTERNSHIP_LOGO_URL} name="TFD Internship" label="TFD Internship — student portal" />
                    </div>
                </div>
            </div>

            <div className="border-t border-[#2A364B] py-5 text-center text-xs text-[#F6F1E8]/50">
                © {new Date().getFullYear()} The Financial Doctor. Built with care in Sehore, MP.
            </div>
        </footer>
    );
}

function FooterLogoBox({ href, src, name, label }) {
    return (
        <Link
            to={href}
            title={label}
            aria-label={label}
            className="flex flex-col items-center gap-2 group shrink-0"
        >
            <span className="w-24 h-24 rounded-xl bg-[#F6F1E8] border border-[#2A364B] flex items-center justify-center p-3 group-hover:border-[#C7102E] group-hover:scale-105 transition-all">
                <img src={src} alt={name} className="w-full h-full object-contain" />
            </span>
            <span className="text-xs font-medium text-[#F6F1E8]/80 group-hover:text-[#F6F1E8]">{name}</span>
        </Link>
    );
}

function Social({ href, icon: Icon, label }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className="w-10 h-10 rounded-full border border-[#2A364B] grid place-items-center text-[#F6F1E8]/80 hover:bg-[#F6F1E8] hover:text-[#0E1B2C] transition-colors"
        >
            <Icon size={16} />
        </a>
    );
}
