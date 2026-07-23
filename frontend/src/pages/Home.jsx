import React from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatCounter from "@/components/StatCounter";
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

export default function Home() {
    return (
        <div className="relative" data-testid="home-root">
            <SEO
                title="The Financial Doctor | Mutual Fund, SIP & Insurance Plans"
                description="Grow your wealth with expert-guided Mutual Fund investments, SIP & Lumpsum planning, Term, Health & Motor Insurance, and complete financial planning — trusted, AMFI-registered advisory led by Sagar Chaturvedi."
                keywords="mutual fund advisor near me, mutual fund distributor near me, best mutual fund advisor, SIP calculator, SIP advisor, best SIP plan, term insurance, health insurance plan, financial advisor India, AMFI registered advisor, mutual funds, mutual fund, mutal fund, mutualfund, HDFC Mutual Fund, ICICI Prudential Mutual Fund, SBI Mutual Fund, Axis Mutual Fund, Nippon India Mutual Fund, Kotak Mutual Fund, Aditya Birla Sun Life Mutual Fund, UTI Mutual Fund, DSP Mutual Fund, Franklin Templeton Mutual Fund, Tata Mutual Fund, Mirae Asset Mutual Fund, Motilal Oswal Mutual Fund, Invesco Mutual Fund, Sagar Chaturvedi, ARN-290298"
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
                {/* ADVANCED HOMEPAGE FEATURE — animated count-up stat strip,
                    a genuinely different structural element from anything
                    else on the site (no other page counts up on scroll).
                    Numbers are the same real figures already used in Hero/
                    About, just presented as a distinct proof-strip here. */}
                <StatCounter />
                <About />
                <Calculators />
                <TopFunds showViewAllLink />
                <Services />

                {/* "TWO PATHS" SPLIT PANEL — deliberately not the plain
                    card-grid teaser used elsewhere on the site. A single
                    dark banner with a center divider (desktop) so it reads
                    as one deliberate choice between two doors, not two
                    generic cards; on mobile the divider becomes a stacked
                    "or" break instead of the grid just collapsing. */}
                <section className="bg-[#0E1B2C] py-14 sm:py-16 px-6">
                    <div className="container-x">
                        <div className="text-center mb-8 sm:mb-10">
                            <div className="text-[11px] tracking-[0.2em] uppercase text-[#D8B98A] font-semibold">Where to next</div>
                            <h2 className="font-display text-2xl sm:text-3xl text-[#F6F1E8] mt-2">Two ways to go deeper.</h2>
                        </div>
                        <div className="relative flex flex-col sm:flex-row sm:items-stretch gap-0 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-[#2A364B]">
                            <Link
                                to="/learn"
                                className="flex-1 p-7 sm:p-9 bg-[#152238] hover:bg-[#1A2A45] transition-colors block"
                                data-testid="home-learn-teaser"
                            >
                                <div className="text-[11px] tracking-[0.18em] uppercase text-[#D8B98A] font-semibold">Financial Education</div>
                                <h3 className="font-display text-xl sm:text-2xl mt-3 text-[#F6F1E8]">Learn before you invest</h3>
                                <p className="mt-2.5 text-sm text-[#F6F1E8]/70 leading-relaxed">
                                    Mutual funds, SIP, lumpsum vs SWP — explained simply in English, Hindi &amp; Hinglish.
                                </p>
                                <span className="inline-flex items-center gap-1.5 mt-5 text-[#D8B98A] font-medium text-sm">
                                    Start learning <span aria-hidden>→</span>
                                </span>
                            </Link>
                            {/* Divider: vertical line + "OR" badge on desktop, horizontal break on mobile — not the same element just rotated, a different composition per breakpoint. */}
                            <div className="hidden sm:flex items-center justify-center w-px bg-[#2A364B] relative">
                                <span className="absolute bg-[#0E1B2C] border border-[#2A364B] text-[#8A93A6] text-[10px] tracking-[0.16em] uppercase w-8 h-8 rounded-full grid place-items-center">or</span>
                            </div>
                            <div className="sm:hidden flex items-center gap-3 px-7">
                                <span className="h-px flex-1 bg-[#2A364B]" />
                                <span className="text-[10px] tracking-[0.16em] uppercase text-[#8A93A6]">or</span>
                                <span className="h-px flex-1 bg-[#2A364B]" />
                            </div>
                            <Link
                                to="/partner-with-us"
                                className="flex-1 p-7 sm:p-9 bg-[#152238] hover:bg-[#1A2A45] transition-colors block"
                                data-testid="home-partner-teaser"
                            >
                                <div className="text-[11px] tracking-[0.18em] uppercase text-[#C7102E] font-semibold">Partner with us</div>
                                <h3 className="font-display text-xl sm:text-2xl mt-3 text-[#F6F1E8]">Build a distribution business with us</h3>
                                <p className="mt-2.5 text-sm text-[#F6F1E8]/70 leading-relaxed">
                                    Industry-best commissions, training &amp; certification, dedicated back-office support.
                                </p>
                                <span className="inline-flex items-center gap-1.5 mt-5 text-[#C7102E] font-medium text-sm">
                                    Explore partnership <span aria-hidden>→</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>

                <Partners />
                <Reviews />
                <Contact />
            </main>
            <Footer />
            <FloatingActions />
            <LeadPopup />
            <WhatsAppCommunityPopup />
        </div>
    );
}
