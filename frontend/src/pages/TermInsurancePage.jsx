import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { LINKS } from "@/lib/links";

export default function TermInsurancePage() {
  return (
    <div className="relative min-h-screen bg-[#FBF7EE]">
      <SEO
        title="The Financial Doctor | Term Insurance Plan Advisor"
        description="Term insurance plan guidance from The Financial Doctor — find the right life insurance cover for your family, at the right premium, with expert advisory."
        keywords="term insurance plan, life insurance, best insurance advisor"
        path="/term-insurance"
      />
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E1B2C] mb-4">Term Insurance Advisory</h1>
          <p className="text-[#2A364B]/80 leading-relaxed mb-2">
            Our dedicated term insurance plan comparison tool is coming soon. In the meantime, talk to us
            directly for personalised term life insurance guidance — the right cover, at the right premium,
            for your family's financial security.
          </p>
          <a
            href={LINKS.whatsappDM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-[#024396] hover:bg-[#012E6B] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Talk to Us About Term Insurance
          </a>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
