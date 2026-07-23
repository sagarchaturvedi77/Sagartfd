import React from "react";
import { useLanguage } from "../context/LanguageContext";

// 🌐 Small pill toggle: English / Hindi / Hinglish — default English.
// Place this above any knowledge content (FAQs, explainers) so readers
// can pick the language they're most comfortable reading in.
const ALL_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "hinglish", label: "Hinglish" },
];

// `languages`: which of the 3 codes to actually show, in order — defaults
// to all three. Only pass a subset where the content next to the toggle
// genuinely doesn't have real per-language variants for one of them (e.g.
// PublicBlog.jsx's posts only ever have an English translation and a
// single Hinglish original — no separate Devanagari Hindi field — so
// showing "हिंदी" there silently rendered the exact same text as
// "Hinglish", which read as a broken toggle rather than a real language).
export default function LanguageToggle({ className = "", languages }) {
  const { lang, setLang } = useLanguage();
  const options = languages ? ALL_OPTIONS.filter((o) => languages.includes(o.code)) : ALL_OPTIONS;

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
