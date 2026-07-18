import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { LINKS } from "@/lib/links";

export default function MotorInsurancePage() {
  return (
    <div className="relative min-h-screen bg-[#FBF7EE]">
      <SEO
        title="The Financial Doctor | Motor & Car Insurance"
        description="Motor insurance guidance from The Financial Doctor — car insurance and two wheeler insurance advisory to get you the right cover at the right price."
        keywords="motor insurance, car insurance, two wheeler insurance, best insurance advisor"
        path="/motor-insurance"
      />
      <Navbar />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E1B2C] mb-4">Motor Insurance Advisory</h1>
          <p className="text-[#2A364B]/80 leading-relaxed mb-2">
            Our dedicated motor insurance comparison tool is coming soon. In the meantime, talk to us directly
            for personalised car insurance and two wheeler insurance guidance — the right cover, at the right
            price.
          </p>
          <a
            href={LINKS.whatsappDM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-[#024396] hover:bg-[#012E6B] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Talk to Us About Motor Insurance
          </a>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
