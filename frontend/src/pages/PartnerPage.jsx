import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { LINKS } from "@/lib/links";

export default function PartnerPage() {
  return (
    <div className="relative min-h-screen bg-[#FBF7EE]">
      <SEO
        title="The Financial Doctor | Partner With Us"
        description="Partner with The Financial Doctor — collaborate with an AMFI-registered mutual fund and insurance advisory to grow your client base and referrals."
        keywords="mutual fund partner, insurance referral partner, financial advisor partnership"
        path="/partner-with-us"
        ogImage="https://thefinancialdoctor.in/assets/logos/TFD-PARTNERHUB-LOGO.png"
      />
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E1B2C] mb-4">Partner With TFD</h1>
          <p className="text-[#2A364B]/80 leading-relaxed mb-2">
            Our dedicated partner program page is coming soon. In the meantime, reach out to us directly to
            discuss a referral or business partnership.
          </p>
          <a
            href={LINKS.whatsappDM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-[#024396] hover:bg-[#012E6B] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Talk to Us About Partnering
          </a>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
