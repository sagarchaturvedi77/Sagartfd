import React from "react";
import { ArrowUpRight, MessageCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { IDS } from "@/constants/testIds";

const SAGAR_PHOTO = "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24">
      <div aria-hidden className="absolute -top-32 -right-40 w-[700px] h-[700px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle at center, rgba(2, 67, 150,0.35) 0%, transparent 60%)" }} />
      <div aria-hidden className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle at center, rgba(199, 16, 46,0.35) 0%, transparent 60%)" }} />
      
      <div className="container-x px-6 grid md:grid-cols-12 gap-10 items-center relative">
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E2D8C2] bg-[#FBF7EE]/60 text-xs tracking-[0.18em] uppercase text-[#024396] font-semibold">
            <ShieldCheck size={14} /> AMFI Registered · ARN-290298
          </div>
          <h1 className="h1 mt-6 text-[#0E1B2C]"> Treating <span className="font-italic-serif text-[#024396]">your</span> <br /> financial <span className="font-italic-serif text-[#C7102E]">health</span>. </h1>
          <p className="mt-6 text-[1.05rem] md:text-lg text-[#2A364B] max-w-xl leading-relaxed">
            Trusted by <strong>1000+ families</strong> in Sehore and across MP. Personalised mutual fund advisory, SIP planning, and end-to-end insurance — all under one roof, led by <strong>Sagar Chaturvedi</strong>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="https://www.assetplus.in/mfd/ARN-290298" target="_blank" rel="noreferrer" data-testid={IDS?.hero?.startInvesting || "hero-cta"} className="btn-pill btn-primary">
              Start Investing <ArrowUpRight size={16} />
            </a>
            <a href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20know%20more%20about%20mutual%20fund%20investments." target="_blank" rel="noreferrer" data-testid={IDS?.hero?.whatsapp || "hero-wa"} className="btn-pill btn-ghost">
              <MessageCircle size={16} /> Talk on WhatsApp
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <div className="font-display text-3xl text-[#0E1B2C]">1000+</div>
              <div className="text-xs uppercase tracking-wider text-[#5C677D] mt-1">Happy Clients</div>
            </div>
            <div>
              <div className="font-display text-3xl text-[#0E1B2C]">4.9</div>
              <div className="text-xs uppercase tracking-wider text-[#5C677D] mt-1">Google Rated</div>
            </div>
            <div>
              <div className="font-display text-3xl text-[#0E1B2C]">40+</div>
              <div className="text-xs uppercase tracking-wider text-[#5C677D] mt-1">AMC Partners</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="relative w-full max-w-[460px] mx-auto">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-[#024396]/10 -rotate-2" />
            <div className="absolute -inset-4 rounded-[2.5rem] bg-[#C7102E]/10 rotate-1" />
            <div className="relative rounded-[2.5rem] overflow-hidden border border-[#E2D8C2] bg-[#FBF7EE]">
              <img src={SAGAR_PHOTO} alt="Sagar Chaturvedi — Founder, The Financial Doctor" className="w-full h-auto object-cover" loading="eager" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-[#0E1B2C]/85 backdrop-blur text-[#F6F1E8] px-3 py-1.5 rounded-full text-xs">
                <Stethoscope size={12} /> Founder
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#0E1B2C] text-[#F6F1E8] rounded-2xl px-5 py-4 max-w-[220px] shadow-xl">
              <div className="font-display text-xl">Sagar Chaturvedi</div>
              <div className="text-[11px] tracking-[0.18em] uppercase opacity-70 mt-1">MFD · AMFI Certified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
