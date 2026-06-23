import React from "react";
import { Instagram, Youtube, Linkedin, MessageCircle, Sparkles } from "lucide-react";

const LOGO_URL =
    "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

export default function Footer() {
    return (
        <footer className="bg-[#0E1B2C] text-[#F6F1E8]/80">
            <div className="container-x px-6 py-14 grid md:grid-cols-3 gap-10">
                <div>
                    <div className="flex items-center gap-3">
                        <img
                            src={LOGO_URL}
                            alt="The Financial Doctor"
                            className="h-14 w-auto object-contain bg-[#F6F1E8] rounded-lg p-1.5"
                        />
                        <div>
                            <div className="font-display text-[#F6F1E8] text-lg leading-none">
                                The Financial Doctor
                            </div>
                            <div className="text-[10px] tracking-[0.2em] uppercase text-[#F6F1E8]/60">
                                ARN-290298 · Sehore, MP
                            </div>
                        </div>
                    </div>
                    <p className="text-sm mt-5 leading-relaxed max-w-sm">
                        Personalised mutual fund advisory and insurance, led by Sagar Chaturvedi.
                        Empowering 1000+ families across Madhya Pradesh with goal-based planning.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        <Social href="https://www.instagram.com/the_financial.doctor" icon={Instagram} label="Instagram" />
                        <Social href="https://youtube.com/@the_financial_doctor" icon={Youtube} label="YouTube" />
                        <Social href="https://www.linkedin.com/in/sagarchaturvedisehore" icon={Linkedin} label="LinkedIn" />
                        <Social href="https://chat.whatsapp.com/KTs87c2XR2I0JwYpU8dDEE" icon={MessageCircle} label="WhatsApp Community" />
                    </div>
                    <a
                        href="#ai-chat"
                        onClick={(e) => {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent("tfd:open-ai-chat"));
                        }}
                        className="inline-flex items-center gap-2 mt-5 text-sm text-[#C9802A] hover:text-[#F6F1E8]"
                        data-testid="footer-ai-chat-link"
                    >
                        <Sparkles size={14} /> Ask TFD-AI anything
                    </a>
                </div>

                <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C9802A] font-semibold">
                        Quick links
                    </div>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        <li><a href="#about" className="hover:text-[#F6F1E8]">About Sagar</a></li>
                        <li><a href="#calc" className="hover:text-[#F6F1E8]">Calculators</a></li>
                        <li><a href="#funds" className="hover:text-[#F6F1E8]">Top Funds</a></li>
                        <li><a href="#services" className="hover:text-[#F6F1E8]">Services</a></li>
                        <li><a href="#reviews" className="hover:text-[#F6F1E8]">Reviews</a></li>
                        <li><a href="#contact" className="hover:text-[#F6F1E8]">Contact</a></li>
                    </ul>
                </div>

                <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#C9802A] font-semibold">
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

            <div className="border-t border-[#2A364B] py-5 text-center text-xs text-[#F6F1E8]/50">
                © {new Date().getFullYear()} The Financial Doctor. Built with care in Sehore, MP.
            </div>
        </footer>
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
