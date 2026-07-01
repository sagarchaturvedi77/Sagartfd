import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

// 💰 Income Tax Calculator — Old vs New regime (simplified, FY 2025-26 style slabs)
// with an ELSS tax-saving suggestion. For estimation only — not tax/legal advice.
const T = {
  en: {
    title: "Income Tax Calculator",
    subtitle: "Compare Old vs New tax regime and see how much ELSS can save you.",
    income: "Annual Income (₹)",
    deductions: "80C Investments (₹) — old regime only",
    oldRegime: "Old Regime",
    newRegime: "New Regime",
    taxPayable: "Tax Payable",
    betterChoice: "Better Choice For You",
    elssTitle: "💡 Save More with ELSS",
    elssText: (saving) =>
      `If you haven't used your full ₹1,50,000 limit under Section 80C, investing the remaining amount in an ELSS mutual fund (under the Old Regime) could save you up to ₹${saving.toLocaleString("en-IN")} in tax — while your money also grows with equity exposure.`,
    startElss: "Explore ELSS Funds With Us",
    note: "Estimates are simplified and for planning purposes only. Please consult a tax professional for exact filing figures.",
  },
  hinglish: {
    title: "Income Tax Calculator",
    subtitle: "Old vs New tax regime compare karein aur dekhein ELSS se kitna bachat ho sakti hai.",
    income: "Annual Income (₹)",
    deductions: "80C Investments (₹) — sirf old regime mein",
    oldRegime: "Old Regime",
    newRegime: "New Regime",
    taxPayable: "Tax Payable",
    betterChoice: "Aapke Liye Behtar Option",
    elssTitle: "💡 ELSS Se Aur Bachat Karein",
    elssText: (saving) =>
      `Agar aapne Section 80C ki ₹1,50,000 limit pura use nahi ki, to baaki amount ELSS mutual fund mein invest karke (Old Regime mein) aap ₹${saving.toLocaleString("en-IN")} tak tax bacha sakte hain — saath mein aapka paisa equity mein grow bhi hota hai.`,
    startElss: "Hamare Saath ELSS Funds Explore Karein",
    note: "Yeh estimates simplified hain aur sirf planning ke liye hain. Exact filing figures ke liye tax professional se consult karein.",
  },
};

function calcOldRegime(income, deductions) {
  const standardDeduction = 50000;
  const taxableIncome = Math.max(0, income - standardDeduction - Math.min(deductions, 150000));
  let tax = 0;
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
  if (taxableIncome > 500000) tax += (Math.min(taxableIncome, 1000000) - 500000) * 0.2;
  if (taxableIncome > 250000) tax += (Math.min(taxableIncome, 500000) - 250000) * 0.05;
  return Math.round(tax * 1.04); // 4% cess
}

function calcNewRegime(income) {
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, income - standardDeduction);
  let tax = 0;
  if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.3;
  if (taxableIncome > 1200000) tax += (Math.min(taxableIncome, 1500000) - 1200000) * 0.2;
  if (taxableIncome > 1000000) tax += (Math.min(taxableIncome, 1200000) - 1000000) * 0.15;
  if (taxableIncome > 700000) tax += (Math.min(taxableIncome, 1000000) - 700000) * 0.1;
  if (taxableIncome > 300000) tax += (Math.min(taxableIncome, 700000) - 300000) * 0.05;
  if (taxableIncome <= 700000) tax = 0; // rebate under new regime
  return Math.round(tax * 1.04);
}

export default function IncomeTaxCalculator({ onExploreElss }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;

  const [income, setIncome] = useState(1200000);
  const [deductions, setDeductions] = useState(50000);

  const result = useMemo(() => {
    const oldTax = calcOldRegime(income, deductions);
    const newTax = calcNewRegime(income);
    const remainingElssRoom = Math.max(0, 150000 - deductions);
    const elssSaving = Math.round(remainingElssRoom * 0.3 * 1.04); // assumes 30% slab benefit
    return { oldTax, newTax, elssSaving, better: oldTax <= newTax ? t.oldRegime : t.newRegime };
  }, [income, deductions, t]);

  return (
    <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-display text-[#024396] mb-1">{t.title}</h3>
      <p className="text-sm text-[#2A364B]/70 mb-5">{t.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="text-sm text-[#2A364B]">
          {t.income}
          <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.deductions}
          <input type="number" value={deductions} onChange={(e) => setDeductions(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 bg-[#FBF7EE] rounded-xl p-4 mb-3">
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.oldRegime} — {t.taxPayable}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.oldTax.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.newRegime} — {t.taxPayable}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.newTax.toLocaleString("en-IN")}</p>
        </div>
      </div>
      <p className="text-sm font-display text-[#024396] mb-5">{t.betterChoice}: {result.better}</p>

      {result.elssSaving > 0 && (
        <div className="bg-[#0E1B2C] text-[#F6F1E8] rounded-xl p-5">
          <h4 className="font-display mb-2">{t.elssTitle}</h4>
          <p className="text-sm text-[#F6F1E8]/85 leading-relaxed mb-4">{t.elssText(result.elssSaving)}</p>
          <button
            onClick={onExploreElss}
            className="bg-[#024396] text-white px-5 py-2 rounded-full text-sm font-display hover:bg-[#0356c4] transition-colors"
          >
            {t.startElss}
          </button>
        </div>
      )}

      <p className="text-xs text-[#2A364B]/50 mt-4">{t.note}</p>
    </div>
  );
}
