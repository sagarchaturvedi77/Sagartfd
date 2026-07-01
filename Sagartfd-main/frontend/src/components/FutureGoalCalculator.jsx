import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

const T = {
  en: {
    title: "Future Goal / Inflation Calculator",
    subtitle: "See what your goal will really cost in the future, and the SIP needed to get there.",
    currentCost: "Current Cost of Goal (₹)",
    years: "Years Until Goal",
    inflation: "Expected Inflation (% p.a.)",
    returnRate: "Expected Investment Return (% p.a.)",
    futureCost: "Future Cost of Your Goal",
    requiredSip: "Monthly SIP Needed",
    note: "Estimates only — actual inflation and market returns will vary.",
    startSip: "Plan This Goal With Us",
  },
  hinglish: {
    title: "Future Goal / Inflation Calculator",
    subtitle: "Dekhein aapka goal future mein kitna costly hoga, aur usko reach karne ke liye kitni SIP chahiye.",
    currentCost: "Goal Ka Current Cost (₹)",
    years: "Goal Tak Kitne Saal",
    inflation: "Expected Inflation (% p.a.)",
    returnRate: "Expected Investment Return (% p.a.)",
    futureCost: "Aapke Goal Ka Future Cost",
    requiredSip: "Monthly SIP Chahiye",
    note: "Yeh sirf estimates hain — actual inflation aur market return alag ho sakta hai.",
    startSip: "Hamare Saath Yeh Goal Plan Karein",
  },
};

export default function FutureGoalCalculator({ onPlanGoal }) {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;

  const [currentCost, setCurrentCost] = useState(1000000);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(7);
  const [returnRate, setReturnRate] = useState(12);

  const result = useMemo(() => {
    const futureCost = currentCost * Math.pow(1 + inflation / 100, years);
    const n = years * 12;
    const monthlyRate = returnRate / 100 / 12;
    const sipFactor = ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
    const requiredSip = futureCost / sipFactor;
    return { futureCost: Math.round(futureCost), requiredSip: Math.round(requiredSip) };
  }, [currentCost, years, inflation, returnRate]);

  return (
    <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-display text-[#024396] mb-1">{t.title}</h3>
      <p className="text-sm text-[#2A364B]/70 mb-5">{t.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="text-sm text-[#2A364B]">
          {t.currentCost}
          <input type="number" value={currentCost} onChange={(e) => setCurrentCost(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.years}
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.inflation}
          <input type="number" value={inflation} onChange={(e) => setInflation(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.returnRate}
          <input type="number" value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 bg-[#FBF7EE] rounded-xl p-4 mb-5">
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.futureCost}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.futureCost.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.requiredSip}</p>
          <p className="text-lg font-display text-[#024396]">₹{result.requiredSip.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <button
        onClick={onPlanGoal}
        className="bg-[#024396] text-white px-5 py-2 rounded-full text-sm font-display hover:bg-[#0356c4] transition-colors"
      >
        {t.startSip}
      </button>
      <p className="text-xs text-[#2A364B]/50 mt-3">{t.note}</p>
    </div>
  );
}
