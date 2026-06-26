import React from "react";
import { TrendingUp, Shield, HeartPulse, ShieldAlert, Car, Award } from "lucide-react";
// 🛠️ Hook import kiya bina kisi space ke
import { useModal } from "../context/ModalContext";

export default function Services() {
  const { openGateway } = useModal();

  return (
    <section id="services" className="py-20 bg-white border-b border-[#E2D8C2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-[#5C677D] uppercase">What We Treat</span>
          <h2 className="text-4xl font-serif text-[#0E1B2C] mt-2">One doctor for all your financial prescriptions.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* CARD 1: MUTUAL FUNDS & SIP (POPUP TRIGGER LOCKED) */}
          <div className="bg-[#FBF7EE] border border-[#E2D8C2] p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#C7102E]/10 flex items-center justify-center text-[#C7102E] mb-6">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0E1B2C]">Mutual Funds & SIP</h3>
              <p className="text-sm text-[#5C677D] mt-3 leading-relaxed">
                Goal-based investing across equity, debt, hybrid and ELSS funds. Onboarding in under 5 minutes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2D8C2]/60">
              {/* 🎯 CONNECTED TO GATEWAY MODAL */}
              <button 
                onClick={openGateway}
                className="text-[#C7102E] font-bold text-sm hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
              >
                Start SIP →
              </button>
            </div>
          </div>

          {/* Baki cards (Insurance etc.) vaise hi chalte rahenge... */}
          
        </div>
      </div>
    </section>
  );
}
