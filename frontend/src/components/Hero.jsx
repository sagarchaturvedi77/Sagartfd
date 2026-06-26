import React from "react";
import { MessageCircle, Award, ShieldCheck, Users, Star } from "lucide-react";
import Reveal from "@/components/Reveal";
// 🛠️ Step 1: Hook Import
import { useModal } from "../context/ModalContext";

const SAGAR_PHOTO = "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";
const AWARD_PHOTO = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/mshasg7y_IMG_2874.JPG";

export default function Hero() {
  // 🛠️ Step 2: Extract Trigger
  const { openGateway } = useModal();

  return (
    <section id="top" className="relative min-h-[90vh] pt-32 pb-20 bg-[#F6F1E8] flex items-center overflow-hidden">
      <div className="container-x grid lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* LEFT TEXT CONTENT */}
        <div className="lg:col-span-7 max-w-2xl">
          <Reveal y={20}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#024396]/10 text-[#024396] text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck size={14} /> AMFI Registered · ARN-290298
            </div>
          </Reveal>
          
          <Reveal delay={100} y={30}>
            <h1 className="h1 text-[#0E1B2C] leading-[1.1]">
              Treating <span className="font-italic-serif text-[#024396]">your</span> <br />
              financial health.
            </h1>
          </Reveal>

          <Reveal delay={200} y={20}>
            <p className="mt-6 text-base sm:text-lg text-[#2A364B] leading-relaxed">
              Trusted by <b>1000+ families</b> in Sehore and across MP. Personalised mutual fund advisory, 
              SIP planning, and end-to-end insurance — led by <b>Sagar Chaturvedi</b>.
            </p>
          </Reveal>

          <Reveal delay={300} y={20}>
            <div className="mt-8 flex flex-wrap gap-4">
              {/* 🎯 TRIGGER FOR POPUP MODAL */}
              <button 
                onClick={openGateway}
                className="btn-pill btn-primary text-sm shadow-md cursor-pointer"
              >
                Start Investing ↗
              </button>
              
              <a 
                href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20consult%20regarding%20investments." 
                target="_blank" 
                rel="noreferrer" 
                className="btn-pill btn-ghost border border-[#E2D8C2] text-sm"
              >
                <MessageCircle size={16} /> Talk on WhatsApp
              </a>
            </div>
          </Reveal>

          {/* SOCIAL STATS TRACK */}
          <Reveal delay={400} y={15}>
            <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-[#E2D8C2] max-w-md">
              <div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0E1B2C]">1000+</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C677D] mt-1">Happy Clients</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0E1B2C] flex items-center gap-1">
                  4.9 <Star size={16} className="fill-[#C7102E] text-[#C7102E]" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C677D] mt-1">Google Rated</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0E1B2C]">40+</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#5C677D] mt-1">AMC Partners</div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* RIGHT PICTURE BRANDING STAGE */}
        <div className="lg:col-span-5 relative flex justify-center">
          <Reveal delay={200} scale={0.95}>
            <div className="relative w-[290px] sm:w-[340px] aspect-[4/5] bg-white rounded-3xl border border-[#E2D8C2] shadow-xl p-3 group">
              <div className="absolute top-6 left-6 z-20 bg-[#0E1B2C] text-[#F6F1E8] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Users size={12} className="text-[#C7102E]" /> Founder
              </div>
              <div className="w-full h-full rounded-2xl overflow-hidden bg-[#FBF7EE] relative border border-[#F0EAE1]">
                <img src={SAGAR_PHOTO} alt="Sagar Chaturvedi" className="w-full h-full object-cover object-top" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0E1B2C] to-transparent p-5 pt-20 text-center">
                  <div className="font-serif text-lg font-bold text-white">Sagar Chaturvedi</div>
                  <div className="text-[10px] tracking-widest text-[#F6F1E8]/70 uppercase font-bold mt-1">MFD · AMFI Certified</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* FLOATING EXCELLENCE AWARD CARD */}
          <div className="absolute -bottom-6 -left-6 sm:-left-12 max-w-[210px] bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-3 shadow-2xl flex gap-3 items-center animate-bounce-slow">
            <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E2D8C2] bg-white">
              <img src={AWARD_PHOTO} alt="Award" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[#C7102E] text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <Award size={10} /> Awarded
              </div>
              <div className="font-serif text-[11px] font-bold text-[#0E1B2C] leading-tight mt-1">Excellence in Investment Awareness</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
