import React, { useState, useMemo } from "react";

// 📈 Step-up SIP Calculator — assumes investor increases their SIP amount
// every year by a fixed %, which is more realistic than a flat SIP as income grows.
export default function StepUpSipCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [stepUp, setStepUp] = useState(10);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const result = useMemo(() => {
    let invested = 0;
    let value = 0;
    let currentSip = monthly;
    const monthlyRate = rate / 100 / 12;

    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        invested += currentSip;
        value = (value + currentSip) * (1 + monthlyRate);
      }
      currentSip = currentSip * (1 + stepUp / 100);
    }
    return { invested: Math.round(invested), value: Math.round(value) };
  }, [monthly, stepUp, years, rate]);

  return (
    <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-display text-[#024396] mb-1">Step-up SIP Calculator</h3>
      <p className="text-sm text-[#2A364B]/70 mb-5">
        Increase your SIP every year as your income grows — see how it compares
        to a flat SIP over time.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="text-sm text-[#2A364B]">
          Starting Monthly SIP (₹)
          <input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          Annual Step-up (%)
          <input type="number" value={stepUp} onChange={(e) => setStepUp(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          Duration (years)
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          Expected Annual Return (%)
          <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 bg-[#FBF7EE] rounded-xl p-4">
        <div>
          <p className="text-xs text-[#2A364B]/60">Total Invested</p>
          <p className="text-xl font-display text-[#0E1B2C]">₹{result.invested.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">Estimated Future Value</p>
          <p className="text-xl font-display text-[#024396]">₹{result.value.toLocaleString("en-IN")}</p>
        </div>
      </div>
      <p className="text-xs text-[#2A364B]/50 mt-3">
        Estimates only, based on assumed constant returns — actual market returns will vary.
      </p>
    </div>
  );
}
