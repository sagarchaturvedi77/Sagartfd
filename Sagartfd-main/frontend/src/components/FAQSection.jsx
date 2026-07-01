import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

// 📋 Reusable FAQ block used at the bottom of every page.
// `data` shape: { en: [{q,a}], hi: [{q,a}], hinglish: [{q,a}] }
// Each page passes its own questions — this component just renders + toggles language.
export default function FAQSection({ title = "Frequently Asked Questions", data }) {
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);
  const items = data?.[lang] || data?.en || [];

  return (
    <section className="bg-white py-16 px-6 border-t border-[#E2D8C2]">
      <div className="container-x max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-serif text-[#0E1B2C] text-center">{title}</h2>
          <LanguageToggle />
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-[#E2D8C2] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between text-left px-5 py-4 bg-[#FBF7EE] hover:bg-[#F2EAD8] transition-colors"
              >
                <span className="font-display text-[#0E1B2C] text-sm md:text-base pr-4">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-[#024396] transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 py-4 text-sm text-[#2A364B]/80 leading-relaxed bg-white">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
