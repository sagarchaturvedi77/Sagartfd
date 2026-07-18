import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Calculators from "@/components/Calculators";
import TopFunds from "@/components/TopFunds";
import Services from "@/components/Services";
import Education from "@/components/Education";
import Partners from "@/components/Partners";
import Reviews from "@/components/Reviews";
import Partnership from "@/components/Partnership";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import AIChat from "@/components/AIChat";
import LeadPopup from "@/components/LeadPopup";
import WhatsAppCommunityPopup from "@/components/WhatsAppCommunityPopup";

export default function Home() {
    return (
        <div className="relative" data-testid="home-root">
            <SEO
                title="The Financial Doctor | Mutual Fund, SIP & Insurance Plans"
                description="Grow your wealth with expert-guided Mutual Fund investments, SIP & Lumpsum planning, Term, Health & Motor Insurance, and complete financial planning — trusted, AMFI-registered advisory led by Sagar Chaturvedi."
                keywords="mutual fund advisor near me, SIP calculator, best SIP plan, term insurance, health insurance plan, financial advisor India, AMFI registered advisor"
                path="/"
            />
            <Navbar />
            <main>
                <Hero />
                <About />
                <Calculators />
                <TopFunds />
                <Services />
                <Education />
                <Partners />
                <Reviews />
                <Partnership />
                <Contact />
            </main>
            <Footer />
            <FloatingActions />
            <AIChat />
            <LeadPopup />
            <WhatsAppCommunityPopup />
        </div>
    );
}
