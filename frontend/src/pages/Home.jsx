import React, { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Calculators from "@/components/Calculators";
import TopFunds from "@/components/TopFunds";
import Services from "@/components/Services";
import Partners from "@/components/Partners";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import LeadPopup from "@/components/LeadPopup";
import WhatsAppCommunityPopup from "@/components/WhatsAppCommunityPopup";

// AIChat pulls in jsPDF/html2canvas/qrcode.react (heavy) but renders
// nothing visible until the user opens it via a global event dispatched
// from FloatingActions — safe to defer entirely off the initial homepage
// bundle, no loading fallback needed since there's nothing to show yet.
const AIChat = lazy(() => import("@/components/AIChat"));

export default function Home() {
    // AIChat is meant to open only when the user explicitly triggers it via
    // the "tfd:open-ai-chat" event (fired from FloatingActions). Gate the
    // component's mount on that same event so the lazy import (plus its
    // heavy jsPDF/html2canvas static imports) never downloads on a plain
    // homepage visit that never opens the chat. Once opened, keep it
    // mounted (don't unmount on close) so re-opening is instant.
    const [chatEverOpened, setChatEverOpened] = useState(false);

    useEffect(() => {
        let redispatched = false;
        const onOpen = () => {
            setChatEverOpened(true);
            // AIChat only mounts (lazily) after this state flip, so its own
            // "tfd:open-ai-chat" listener — which sets its internal
            // open/closed visual state — isn't attached yet to catch this
            // same event. Redispatch a couple of times shortly after so
            // AIChat still opens itself as soon as it finishes mounting,
            // without needing to change AIChat.jsx itself.
            if (!redispatched) {
                redispatched = true;
                [250, 700, 1500].forEach((delay) => {
                    window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("tfd:open-ai-chat"));
                    }, delay);
                });
            }
        };
        window.addEventListener("tfd:open-ai-chat", onOpen);
        return () => window.removeEventListener("tfd:open-ai-chat", onOpen);
    }, []);

    return (
        <div className="relative" data-testid="home-root">
            <SEO
                title="The Financial Doctor | Mutual Fund, SIP & Insurance Plans"
                description="Grow your wealth with expert-guided Mutual Fund investments, SIP & Lumpsum planning, Term, Health & Motor Insurance, and complete financial planning — trusted, AMFI-registered advisory led by Sagar Chaturvedi."
                keywords="mutual fund advisor near me, SIP calculator, best SIP plan, term insurance, health insurance plan, financial advisor India, AMFI registered advisor"
                path="/"
            />
            <Navbar />
            {/* Clears the fixed navbar (~80px) with room to spare — Hero's
                own pt-32/md:pt-40 below adds the rest of the breathing room
                before its headline. */}
            <div className="pt-24 px-6 flex justify-center">
                <Link
                    to="/locations"
                    className="fund-animate-in inline-flex items-center gap-2 bg-[#0E1B2C] text-[#F6F1E8] text-xs sm:text-sm font-medium px-4 py-2 rounded-full border border-[#2A364B] hover:border-[#D8B98A]/60 hover:bg-[#152238] transition-colors"
                    data-testid="home-pan-india-banner"
                >
                    <span aria-hidden>🇮🇳</span>
                    <span>Pan-India Digital Presence — now serving investors in 35+ cities</span>
                    <span className="text-[#D8B98A] font-semibold">Explore →</span>
                </Link>
            </div>
            <main>
                <Hero />
                <About />
                <Calculators />
                <TopFunds showViewAllLink />
                <Services />

                {/* Compact teasers — full content lives on /learn and
                    /partner-with-us so the homepage doesn't have to carry
                    two more full sections' worth of scroll on mobile. */}
                <section className="section bg-[#EFE7D6]">
                    <div className="container-x grid sm:grid-cols-2 gap-5">
                        <Link
                            to="/learn"
                            className="card-cream p-7 group hover:border-[#024396] transition-colors block"
                            data-testid="home-learn-teaser"
                        >
                            <div className="eyebrow">Financial Education</div>
                            <h2 className="h3 mt-3 text-[#0E1B2C]">Learn before you invest</h2>
                            <p className="mt-2 text-sm text-[#2A364B]">
                                Mutual funds, SIP, lumpsum vs SWP — explained simply in English, Hindi &amp; Hinglish.
                            </p>
                            <span className="inline-flex items-center gap-1.5 mt-4 text-[#024396] font-medium text-sm">
                                Start learning <span aria-hidden>→</span>
                            </span>
                        </Link>
                        <Link
                            to="/partner-with-us"
                            className="card-cream p-7 group hover:border-[#024396] transition-colors block"
                            data-testid="home-partner-teaser"
                        >
                            <div className="eyebrow">Partner with us</div>
                            <h2 className="h3 mt-3 text-[#0E1B2C]">Build a distribution business with us</h2>
                            <p className="mt-2 text-sm text-[#2A364B]">
                                Industry-best commissions, training &amp; certification, dedicated back-office support.
                            </p>
                            <span className="inline-flex items-center gap-1.5 mt-4 text-[#024396] font-medium text-sm">
                                Explore partnership <span aria-hidden>→</span>
                            </span>
                        </Link>
                    </div>
                </section>

                <Partners />
                <Reviews />
                <Contact />
            </main>
            <Footer />
            <FloatingActions />
            {chatEverOpened && (
                <Suspense fallback={null}>
                    <AIChat />
                </Suspense>
            )}
            <LeadPopup />
            <WhatsAppCommunityPopup />
        </div>
    );
}
