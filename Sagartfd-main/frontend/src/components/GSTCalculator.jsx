import React, { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

const T = {
  en: {
    title: "GST Calculator",
    subtitle: "Quickly break up GST from any amount.",
    amount: "Amount (₹)",
    rate: "GST Rate",
    type: "Amount Type",
    exclusive: "Exclusive (GST to be added)",
    inclusive: "Inclusive (GST already included)",
    baseAmount: "Base Amount",
    gstAmount: "GST Amount",
    cgst: "CGST",
    sgst: "SGST",
    totalAmount: "Total Amount",
  },
  hinglish: {
    title: "GST Calculator",
    subtitle: "Kisi bhi amount ka GST breakup turant nikalein.",
    amount: "Amount (₹)",
    rate: "GST Rate",
    type: "Amount Type",
    exclusive: "Exclusive (GST add hoga)",
    inclusive: "Inclusive (GST already included hai)",
    baseAmount: "Base Amount",
    gstAmount: "GST Amount",
    cgst: "CGST",
    sgst: "SGST",
    totalAmount: "Total Amount",
  },
};

const RATES = [5, 12, 18, 28];

export default function GSTCalculator() {
  const { lang } = useLanguage();
  const t = T[lang] || T.en;

  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(18);
  const [type, setType] = useState("exclusive");

  const result = useMemo(() => {
    let base, gst, total;
    if (type === "exclusive") {
      base = amount;
      gst = (amount * rate) / 100;
      total = base + gst;
    } else {
      total = amount;
      base = (amount * 100) / (100 + rate);
      gst = total - base;
    }
    return {
      base: Math.round(base),
      gst: Math.round(gst),
      total: Math.round(total),
      half: Math.round(gst / 2),
    };
  }, [amount, rate, type]);

  return (
    <div className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-display text-[#024396] mb-1">{t.title}</h3>
      <p className="text-sm text-[#2A364B]/70 mb-5">{t.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="text-sm text-[#2A364B]">
          {t.amount}
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm text-[#2A364B]">
          {t.type}
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full border border-[#E2D8C2] rounded-lg px-3 py-2">
            <option value="exclusive">{t.exclusive}</option>
            <option value="inclusive">{t.inclusive}</option>
          </select>
        </label>
      </div>

      <div className="mb-5">
        <p className="text-sm text-[#2A364B] mb-2">{t.rate}</p>
        <div className="flex gap-2 flex-wrap">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                rate === r ? "bg-[#024396] text-white border-[#024396]" : "bg-[#FBF7EE] border-[#E2D8C2] text-[#2A364B]"
              }`}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 bg-[#FBF7EE] rounded-xl p-4">
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.baseAmount}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.base.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.gstAmount}</p>
          <p className="text-lg font-display text-[#024396]">₹{result.gst.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.cgst} ({rate / 2}%)</p>
          <p className="text-sm text-[#2A364B]">₹{result.half.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-xs text-[#2A364B]/60">{t.sgst} ({rate / 2}%)</p>
          <p className="text-sm text-[#2A364B]">₹{result.half.toLocaleString("en-IN")}</p>
        </div>
        <div className="sm:col-span-2 border-t border-[#E2D8C2] pt-3">
          <p className="text-xs text-[#2A364B]/60">{t.totalAmount}</p>
          <p className="text-lg font-display text-[#0E1B2C]">₹{result.total.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}
