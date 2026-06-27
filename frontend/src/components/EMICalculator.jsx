import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

// 🏦 EMI Calculator with Reducing Balance / Fixed Rate toggle,
// plus an "Interest-Free Loan via SIP" suggestion engine.
const T = {
  en: {
    title: "EMI Calculator",
    subtitle: "Calculate your loan EMI and see how a SIP can offset the entire interest cost.",
    loanAmount: "Loan Amount (₹)",
    rate: "Interest Rate (% p.a.)",
    tenure: "Tenure (years)",
    reducing: "Reducing Balance",
    fixed: "Fixed Rate",
    monthlyEmi: "Monthly EMI",
    totalInterest: "Total Interest Payable",
    totalPayment: "Total Payment",
    sipTitle: "💡 Make This Loan Interest-Free",
    sipText: (sip, years) =>
      `Start a monthly SIP of ₹${sip.toLocaleString("en-IN")} for ${years} years (assuming 12% p.a. return). By the time your loan ends, this SIP could grow to roughly match your total interest cost — effectively making your loan interest-free.`,
    sipNote: "Estimate assumes a 12% p.a. compounded annual return on the SIP — actual market returns will vary and are not guaranteed.",
    startSip: "Start This SIP With Us",
  },
  hinglish: {
    title: "EMI Calculator",
    subtitle: "Apni loan EMI calculate karein aur dekhein SIP se interest cost kaise cover ho sakti hai.",
    loanAmount: "Loan Amount (₹)",
    rate: "Interest Rate (% p.a.)",
    tenure: "Tenure (years)",
    reducing: "Reducing Balance",
    fixed: "Fixed Rate",
    monthlyEmi: "Monthly EMI",
    totalInterest: "Total Interest Payable",
    totalPayment: "Total Payment",
    sipTitle: "💡 Is Loan Ko Interest-Free Banayein",
    sipText: (sip, years) =>
      `${years} saal ke liye ₹${sip.toLocaleString("en-IN")} monthly SIP shuru karein (12% p.a. return maan kar). Loan khatam hone tak, yeh SIP roughly aapke total interest cost ke barabar grow kar sakta hai — matlab aapka loan effectively interest-free ho jata hai.`,
    sipNote: "Yeh estimate 12% p.a. compounded annual return assume karta hai — actual market return alag ho sakta hai, guaranteed nahi hai.",
    startSip: "Hamare Saath Yeh SIP Shuru Karein",
  },
};

export default function EMICalculator({ onStartSip }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;

  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(10);
  const [mode, setMode] = useState("reducing"); // "reducing" | "fixed"

  const result = useMemo(() => {
    const n = years * 12;
    const monthlyRate = rate / 100 / 12;

    let emi, totalPayment, totalInterest;

    if (mode === "reducing") {
      emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - principal;
    } else {
      totalInterest = principal * (rate / 100) * years;
      totalPayment = principal + totalInterest;
      emi = totalPayment / n;
    }

    // SIP needed to accumulate `totalInterest` over same tenure at 12% p.a.
    const sipMonthlyRate = 0.12 / 12;
    const sipFactor = ((Math.pow(1 + sipMonthlyRate, n) - 1) / sipMonthlyRate) * (1 + sipMonthlyRate);
    const requiredSip = totalInterest / sipFactor;

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      requiredSip: Math.round(requiredSip),
    };
  }, [principal, rate, years, mode]);

  return (
    <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-display text-[#024396] mb-1">{t.title}</h3>
      <p className="text-sm text-[#2A364B]/70 mb-5">{t.subtitle}</p>

      {/* MODE TOGGLE */}
      <div className="inline-flex bg-[#FBF7EE] border border-[#E2D8C2] rounded-full p-1 gap-1 mb-5">
        {["reducing", "fixed"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? "bg-[#024396] text-white" : "text-[#2A364B]/70 hover:text-[#024396]"
            }`}
          >
            {m === "reducing" ? t.reducing : t.fixed}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <label className="text-sm text-[#2A364B]">
          {t.loanAmount}
          <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.rate}
          <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.tenure}
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 bg-[#FBF7EE] rounded-xl p-4 mb-5">
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.monthlyEmi}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.emi.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.totalInterest}</p>
          <p className="text-lg font-display text-[#024396]">₹{result.totalInterest.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.totalPayment}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.totalPayment.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* SIP SUGGESTION ENGINE */}
      <div className="bg-[#0E1B2C] text-[#F6F1E8] rounded-xl p-5">
        <h4 className="font-display mb-2">{t.sipTitle}</h4>
        <p className="text-sm text-[#F6F1E8]/85 leading-relaxed mb-3">
          {t.sipText(result.requiredSip, years)}
        </p>
        <p className="text-xs text-[#F6F1E8]/60 mb-4">{t.sipNote}</p>
        <button
          onClick={onStartSip}
          className="bg-[#024396] text-white px-5 py-2 rounded-full text-sm font-display hover:bg-[#0356c4] transition-colors"
        >
          {t.startSip}
        </button>
      </div>
    </div>
  );
}
