import React, { createContext, useContext, useState } from "react";

// 🌐 Global language preference for knowledge content (FAQs, explainers).
// Default is English as per requirement — user can switch to Hindi or Hinglish.
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en"); // "en" | "hi" | "hinglish"
  const value = React.useMemo(() => ({ lang, setLang }), [lang]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
