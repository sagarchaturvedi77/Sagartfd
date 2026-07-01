import React from "react";
import { useLanguage } from "../context/LanguageContext";

// 🌐 Small pill toggle: English / Hindi / Hinglish — default English.
// Place this above any knowledge content (FAQs, explainers) so readers
// can pick the language they're most comfortable reading in.
const options = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "hinglish", label: "Hinglish" },
];

export default function LanguageToggle({ className = "" }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`inline-flex bg-white border border-[#E2D8C2] rounded-full p-1 gap-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            lang === o.code
              ? "bg-[#024396] text-white"
              : "text-[#2A364B]/70 hover:text-[#024396]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
