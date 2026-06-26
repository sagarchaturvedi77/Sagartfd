import React, { useMemo, useRef, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Download, ArrowUpRight, Calculator as CalcIcon, Sparkles, Lightbulb } from "lucide-react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { IDS } from "@/constants/testIds";
import { CALC_RECOMMENDATIONS } from "@/lib/recommendations";
// 🛠️ Step 1: Hook Import bina kisi space ke
import { useModal } from "../context/ModalContext";

const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";

const fmtINR = (n) => {
    if (!isFinite(n)) return "₹0";
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

// ---------- Calculations ----------
function sipCalc(monthly, years, rateAnnual, stepUpPct = 0) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const series = [];
    let invested = 0;
    let fv = 0;
    let currentMonthly = monthly;
    for (let m = 1; m <= months; m++) {
        if (m > 1 && (m - 1) % 12 === 0 && stepUpPct > 0) {
            currentMonthly = currentMonthly * (1 + stepUpPct / 100);
        }
        invested += currentMonthly;
        fv = (fv + currentMonthly) * (1 + r);
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(invested),
                value: Math.round(fv),
            });
        }
    }
    return { invested, fv, gains: fv - invested, series };
}

function dailySipCalc(daily, years, rateAnnual) {
    const monthly = daily * 22;
    const result = sipCalc(monthly, years, rateAnnual);
    return { ...result, monthly };
}

function lumpsumCalc(amount, years, rateAnnual) {
    const r = rateAnnual / 100;
    const series = [];
    let fv = amount;
    for (let y = 1; y <= years; y++) {
        fv = amount * Math.pow(1 + r, y);
        series.push({
            label: `Yr ${y}`,
            invested: Math.round(amount),
            value: Math.round(fv),
        });
    }
    return { invested: amount, fv, gains: fv - amount, series };
}

function swpCalc(corpus, monthly, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const series = [];
    let balance = corpus;
    let totalWithdrawn = 0;
    for (let m = 1; m <= months; m++) {
        balance = balance * (1 + r) - monthly;
        totalWithdrawn += monthly;
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(totalWithdrawn),
                value: Math.max(0, Math.round(balance)),
            });
        }
        if (balance <= 0) break;
    }
    return { invested: corpus, fv: Math.max(0, balance), gains: totalWithdrawn, series };
}

function goalCalc(goal, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const monthly = goal / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
    const result = sipCalc(monthly, years, rateAnnual);
    return { ...result, requiredSip: monthly, target: goal };
}

function emiCalc(principal, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const total = emi * months;
    const interest = total - principal;
    const series = [];
    let bal = principal;
    let paid = 0;
    for (let m = 1; m <= months; m++) {
        const int = bal * r;
        const prin = emi - int;
        bal -= prin;
        paid += emi;
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(paid),
                value: Math.max(0, Math.round(bal)),
            });
        }
    }
    return { emi, total, interest, series };
}

// ---------- Slider ----------
function Slider({ value, onChange, min, max, step = 1, label, format, testid }) {
    const pct = ((value - min) / (max - min)) * 100;
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const commitValue = () => {
        let v = Number(tempValue);
        if (isNaN(v)) v = value;
        if (v < min) v = min;
        if (v > max) v = max;
        onChange(v);
        setEditing(false);
    };

    return (
        <div>
            <div className="flex items-baseline justify-between mb-2">
                <label className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] text-[#5C677D]">
                    {label}
                </label>
                {editing ? (
                    <input
                        type="number"
                        autoFocus
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={commitValue}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commitValue();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        className="font-display text-lg md:text-xl text-[#0E1B2C] w-28 text-right border-b border-[#024396] outline-none bg-transparent"
                    />
                ) : (
                    <div
                        className="font-display text-lg md:text-xl text-[#0E1B2C] cursor-pointer hover:text-[#024396]"
                        onClick={() => {
                            setTempValue(value);
                            setEditing(true);
                        }}
                        title="Click to type a custom value"
                    >
                        {format ? format(value) : value}
                    </div>
                )}
            </div>
            <input
                type="range"
                className="brand"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ "--p": `${pct}%` }}
                data-testid={testid}
            />
            <div className="flex justify-between mt-1 text-[11px] text-[#5C677D]">
                <span>{format ? format(min) : min}</span>
                <span>{format ? format(max) : max}</span>
            </div>
        </div>
    );
}

const TABS = [
    { id: "sip", label: "SIP", testid: IDS.calc.tabSip },
    { id: "daily", label: "Daily SIP", testid: IDS.calc.tabDaily },
    { id: "lumpsum", label: "Lumpsum", testid: IDS.calc.tabLumpsum },
    { id: "swp", label: "SWP", testid: IDS.calc.tabSwp },
    { id: "goal", label: "Goal", testid: IDS.calc.tabGoal },
    { id: "emi", label: "EMI", testid: IDS.calc.tabEmi },
];

export default function Calculators() {
    const [tab, setTab] = useState("sip");

    const [sipAmount, setSipAmount] = useState(10000);
    const [sipDailyAddon, setSipDailyAddon] = useState(0);
    const [sipStepUp, setSipStepUp] = useState(0);
    const [sipYears, setSipYears] = useState(15);
    const [sipRate, setSipRate] = useState(12);

    const [dailyAmount, setDailyAmount] = useState(200);
    const [dailyYears, setDailyYears] = useState(15);
    const [dailyRate, setDailyRate] = useState(12);

    const [lump, setLump] = useState(100000);
    const [lumpYears, setLumpYears] = useState(10);
    const [lumpRate, setLumpRate] = useState(12);

    const [swpCorpus, setSwpCorpus] = useState(2500000);
    const [swpMonthly, setSwpMonthly] = useState(20000);
    const [swpYears, setSwpYears] = useState(15);
    const [swpRate, setSwpRate] = useState(8);

    const [goal, setGoal] = useState(5000000);
    const [goalYears, setGoalYears] = useState(15);
    const [goalRate, setGoalRate] = useState(12);

    const [loan, setLoan] = useState(2500000);
    const [loanYears, setLoanYears] = useState(20);
    const [loanRate, setLoanRate] = useState(9);

    // 🛠️ Step 2: Extract open trigger hook
    const { openGateway } = useModal();

    const result = useMemo(() => {
        switch (tab) {
            case "sip": {
                const effectiveMonthly = sipAmount + sipDailyAddon * 22;
                return { kind: "sip", ...sipCalc(effectiveMonthly, sipYears, sipRate, sipStepUp) };
            }
            case "daily":
                return { kind: "daily", ...dailySipCalc(dailyAmount, dailyYears, dailyRate) };
            case "lumpsum":
                return { kind: "lumpsum", ...lumpsumCalc(lump, lumpYears, lumpRate) };
            case "swp":
                return { kind: "swp", ...swpCalc(swpCorpus, swpMonthly, swpYears, swpRate) };
            case "goal":
                return { kind: "goal", ...goalCalc(goal, goalYears, goalRate) };
            case "emi":
                return { kind: "emi", ...emiCalc(loan, loanYears, loanRate) };
            default:
                return null;
        }
    }, [
        tab,
        sipAmount, sipDailyAddon, sipStepUp, sipYears, sipRate,
        dailyAmount, dailyYears, dailyRate,
        lump, lumpYears, lumpRate,
        swpCorpus, swpMonthly, swpYears, swpRate,
        goal, goalYears, goalRate,
        loan, loanYears, loanRate,
    ]);

    const snapRef = useRef(null);

    const downloadSnapshot = async () => {
        if (!snapRef.current) return;
        try {
            toast.loading("Generating your snapshot…", { id: "snap" });
            await new Promise((r) => setTimeout(r, 150));
            const canvas = await html2canvas(snapRef.current, {
                backgroundColor: "#F6F1E8",
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement("a");
            link.download = `TFD-${tab}-calculator.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("Snapshot downloaded — share it on WhatsApp!", { id: "snap" });
        } catch (e) {
            console.error(e);
            toast.error("Could not generate snapshot. Try again.", { id: "snap" });
        }
    };

    return (
        <section id="calc" className="py-12 md:py-20 bg-[#F6F1E8]/20">
            <div className="container-x px-4 md:px-6">
                <div className="flex items-end justify-between flex-wrap gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="eyebrow text-xs md:text-sm">Plan · Visualise · Act</div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#0E1B2C] mt-2">
                            Money math, <span className="font-italic-serif text-[#024396]">made visual.</span>
                        </h2>
                        <p className="mt-3 text-xs md:text-sm text-[#2A364B] max-w-2xl">
                            See exactly how your wealth compounds. Try SIP, Daily SIP, Lumpsum, SWP, Goal &
                            EMI scenarios — then download a personalised snapshot to share or onboard via
                            AssetPlus.
                        </p>
                    </div>
                    <div className="hidden md:inline-flex items-center gap-2 text-xs text-[#5C677D] bg-[#FBF7EE] border border-[#E2D8C2] rounded-full px-3 py-2">
                        <Sparkles size={14} className="text-[#C7102E]" />
                        Daily SIP uses <strong className="text-[#0E1B2C] mx-1">22 working days</strong> / month
                    </div>
                </div>

                {/* Tabs Grid */}
                <div className="mb-6">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                data-testid={t.testid}
                                onClick={() => setTab(t.id)}
                                className={`tab-pill text-center justify-center text-xs py-2 ${tab === t.id ? "active" : ""}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-4 md:gap-6">
                    {/* Inputs Card — Compressed mobile layouts spaces */}
                    <div className="lg:col-span-4 card-cream p-4 sm:p-6 md:p-7 space-y-6">
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D] font-bold mb-4">
                            Inputs
                        </div>
                        {tab === "sip" && (
                            <div className="space-y-6">
                                <Slider label="Monthly Investment" value={sipAmount} onChange={setSipAmount} min={500} max={200000} step={500} format={fmtINR} testid={IDS.calc.amount} />
                                <Slider label="Add Daily SIP (optional)" value={sipDailyAddon} onChange={setSipDailyAddon} min={0} max={2000} step={50} format={fmtINR} />
                                <Slider label="Annual Step-up % — har saal SIP badhao" value={sipStepUp} onChange={setSipStepUp} min={0} max={20} step={1} format={(v) => `${v}%`} />
                                <Slider label="Investment Period" value={sipYears} onChange={setSipYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} testid={IDS.calc.years} />
                                <Slider label="Expected Return (p.a.)" value={sipRate} onChange={setSipRate} min={1} max={30} step={0.5} format={(v) => `${v}%`} testid={IDS.calc.rate} />
                                {sipDailyAddon > 0 && (
                                    <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3">
                                        Note: Daily SIP uses 22 working days/month
                                    </div>
                                )}
                                {(sipDailyAddon > 0 || sipStepUp > 0) && (
                                    <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                        Effective starting monthly: <strong className="text-[#0E1B2C]">{fmtINR(sipAmount + sipDailyAddon * 22)}</strong>
                                        {sipStepUp > 0 && ` — increasing ${sipStepUp}% every year`}
                                    </div>
                                )}
                            </div>
                        )}
                        {tab === "daily" && (
                            <div className="space-y-6">
                                <Slider label="Daily Investment" value={dailyAmount} onChange={setDailyAmount} min={50} max={5000} step={50} format={fmtINR} testid={IDS.calc.dailyAmount} />
                                <Slider label="Investment Period" value={dailyYears} onChange={setDailyYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={dailyRate} onChange={setDailyRate} min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                                <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                    Effective monthly SIP equivalent: <strong className="text-[#0E1B2C]">{fmtINR(result?.monthly || 0)}</strong>{" "}— calculated using 22 working days × ₹{dailyAmount}.
                                </div>
                            </div>
                        )}
                        {tab === "lumpsum" && (
                            <div className="space-y-6">
                                <Slider label="Investment Amount" value={lump} onChange={setLump} min={10000} max={10000000} step={10000} format={fmtINR} />
                                <Slider label="Investment Period" value={lumpYears} onChange={setLumpYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={lumpRate} onChange={setLumpRate} min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "swp" && (
                            <div className="space-y-6">
                                <Slider label="Initial Corpus" value={swpCorpus} onChange={setSwpCorpus} min={100000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Monthly Withdrawal" value={swpMonthly} onChange={setSwpMonthly} min={1000} max={500000} step={1000} format={fmtINR} />
                                <Slider label="Period" value={swpYears} onChange={setSwpYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={swpRate} onChange={setSwpRate} min={1} max={20} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "goal" && (
                            <div className="space-y-6">
                                <Slider label="Target Corpus" value={goal} onChange={setGoal} min={100000} max={100000000} step={100000} format={fmtINR} />
                                <Slider label="Years to Goal" value={goalYears} onChange={setGoalYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={goalRate} onChange={setGoalRate} min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "emi" && (
                            <div className="space-y-6">
                                <Slider label="Loan Amount" value={loan} onChange={setLoan} min={100000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Tenure" value={loanYears} onChange={setLoanYears} min={1} max={30} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Interest (p.a.)" value={loanRate} onChange={setLoanRate} min={5} max={20} step={0.1} format={(v) => `${v}%`} />
                            </div>
                        )}
                    </div>

                    {/* Chart + Result Column */}
                    <div className="lg:col-span-8 grid grid-rows-[1fr_auto] gap-4 md:gap-6">
                        {/* 🛠️ GRAPH WRAPPER: Hidden completely on mobile using hidden md:block */}
                        <div className="hidden md:block card-cream p-4 sm:p-5 md:p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D]">
                                    Projection
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-[#5C677D]">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#C7102E]" />
                                        Invested
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#024396]" />
                                        {tab === "emi" ? "Outstanding" : "Value"}
                                    </span>
                                </div>
                            </div>
                            <div className="h-[220px] sm:h-[260px] md:h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={result?.series || []}>
                                        <defs>
                                            <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#024396" stopOpacity={0.45} />
                                                <stop offset="100%" stopColor="#024396" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#C7102E" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#C7102E" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2D8C2" />
                                        <XAxis dataKey="label" stroke="#5C677D" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#5C677D" tick={{ fontSize: 10 }} tickFormatter={fmtINR} width={56} />
                                        <Tooltip contentStyle={{background: "#0E1B2C", border: "none", borderRadius: 12, color: "#F6F1E8", fontSize: 12}} formatter={(v) => fmtINR(v)} />
                                        <Area type="monotone" dataKey="invested" stroke="#C7102E" strokeWidth={2} fill="url(#gi)" />
                                        <Area type="monotone" dataKey="value" stroke="#024396" strokeWidth={2.4} fill="url(#gv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <ResultCard
                            data-testid={IDS.calc.result}
                            tab={tab}
                            result={result}
                            onDownload={downloadSnapshot}
                            onStart={openGateway}
                        />
                    </div>
                </div>

                {/* Hidden snapshot card for PNG export */}
                <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
                    <div ref={snapRef} data-testid={IDS.calc.snapshot}>
                        <SnapshotCard
                            tab={tab}
                            result={result}
                            state={{
                                sipAmount, sipDailyAddon, sipStepUp, sipYears, sipRate,
                                dailyAmount, dailyYears, dailyRate,
                                lump, lumpYears, lumpRate,
                                swpCorpus, swpMonthly, swpYears, swpRate,
                                goal, goalYears, goalRate,
                                loan, loanYears, loanRate,
                                result,
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ResultCard({ tab, result, onDownload, onStart }) {
    if (!result) return null;
    return (
        <div className="card-ink p-4 sm:p-6 md:p-7" data-testid={IDS.calc.result}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 md:gap-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-5 md:gap-8 flex-1 min-w-0">
                    {tab === "emi" ? (
                        <>
                            <Metric label="Monthly EMI" value={fmtINR(result.emi)} />
                            <Metric label="Total Interest" value={fmtINR(result.interest)} />
                            <Metric label="Total Payable" value={fmtINR(result.total)} primary />
                        </>
                    ) : tab === "swp" ? (
                        <>
                            <Metric label="Initial Corpus" value={fmtINR(result.invested)} />
                            <Metric label="Withdrawn" value={fmtINR(result.gains)} />
                            <Metric label="Balance Left" value={fmtINR(result.fv)} primary />
                        </>
                    ) : tab === "goal" ? (
                        <>
                            <Metric label="Required SIP" value={fmtINR(result.requiredSip)} primary />
                            <Metric label="Total Invested" value={fmtINR(result.invested)} />
                            <Metric label="Target" value={fmtINR(result.target)} />
                        </>
                    ) : (
                        <>
                            <Metric label="Invested" value={fmtINR(result.invested)} />
                            <Metric label="Returns" value={fmtINR(result.gains)} />
                            <Metric label="Future Value" value={fmtINR(result.fv)} primary />
                        </>
                    )}
                </div>
                <div className="flex flex-row md:flex-col gap-2 md:ml-auto w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={onDownload} className="btn-pill flex-1 md:flex-none justify-center py-2.5 text-xs font-bold bg-[#C7102E] text-white shadow-sm" data-testid={IDS.calc.download}>
                        <Download size={15} /> <span className="hidden sm:inline">Download</span> Proposal
                    </button>
                    {/* 🎯 POPUP INJECTED: Attached onClick trigger directly */}
                    <button onClick={onStart} className="btn-pill flex-1 md:flex-none justify-center py-2.5 text-xs font-bold bg-[#F6F1E8] text-[#0E1B2C] shadow-sm cursor-pointer" data-testid={IDS.calc.startPlan}>
                        Start <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value, primary }) {
    return (
        <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.18em] opacity-60 truncate font-semibold">
                {label}
            </div>
            <div className={`font-display mt-1 tracking-tight break-words font-bold ${primary ? "text-base sm:text-xl md:text-2xl text-[#F6F1E8]" : "text-xs sm:text-base md:text-lg text-[#F6F1E8]/85"}`}>
                {value}
            </div>
        </div>
    );
}

const SAGAR_PHOTO = "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";
const TFD_LOGO = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

function projectExtended(tab, baseState, extraYears) {
    switch (tab) {
        case "sip": {
            const effectiveMonthly = baseState.sipAmount + (baseState.sipDailyAddon || 0) * 22;
            const r = sipCalc(effectiveMonthly, baseState.sipYears + extraYears, baseState.sipRate, baseState.sipStepUp || 0);
            return { invested: r.invested, fv: r.fv, gains: r.gains };
        }
        case "daily": {
            const r = dailySipCalc(baseState.dailyAmount, baseState.dailyYears + extraYears, baseState.dailyRate);
            return { invested: r.invested, fv: r.fv, gains: r.gains };
        }
        case "lumpsum": {
            const r = lumpsumCalc(baseState.lump, baseState.lumpYears + extraYears, baseState.lumpRate);
            return { invested: r.invested, fv: r.fv, gains: r.gains };
        }
        case "goal": {
            const r = sipCalc(baseState.result.requiredSip, baseState.goalYears + extraYears, baseState.goalRate);
            return { invested: r.invested, fv: r.fv, gains: r.gains };
        }
        default:
            return null;
    }
}

function upsellScenarios(tab, state, result) {
    if (!result || !["sip", "daily", "lumpsum", "goal"].includes(tab)) return [];
    const out = [];
    try {
        if (tab === "sip") {
            const baseFv = result.fv;
            const baseEffective = state.sipAmount + (state.sipDailyAddon || 0) * 22;
            const topup = sipCalc(baseEffective * 1.1, state.sipYears, state.sipRate, state.sipStepUp || 0);
            out.push({
                title: "10% topup karein",
                titleHi: "हर साल 10% बढ़ाएँ",
                extra: topup.fv - baseFv,
                detail: `Just increase monthly SIP by ${Math.round(baseEffective * 0.1)} = ₹${Math.round(baseEffective * 1.1).toLocaleString("en-IN")}/mo`,
            });
            const daily100 = sipCalc(baseEffective + 100 * 22, state.sipYears, state.sipRate, state.sipStepUp || 0);
            out.push({
                title: "Add ₹100/day SIP",
                titleHi: "रोज़ ₹100 और जोड़ें",
                extra: daily100.fv - baseFv,
                detail: "Equivalent to +₹2,200/month — coffee money turns into wealth",
            });
            const longer5 = sipCalc(baseEffective, state.sipYears + 5, state.sipRate, state.sipStepUp || 0);
            out.push({
                title: "5 saal aur invest karein",
                titleHi: "5 साल और जारी रखें",
                extra: longer5.fv - baseFv,
                detail: `Same SIP, ${state.sipYears + 5} years instead of ${state.sipYears}`,
            });
        } else if (tab === "daily") {
            const baseFv = result.fv;
            const dailyPlus50 = dailySipCalc(state.dailyAmount + 50, state.dailyYears, state.dailyRate);
            out.push({
                title: "₹50/day aur badhayein",
                titleHi: "रोज़ ₹50 और जोड़ें",
                extra: dailyPlus50.fv - baseFv,
                detail: `Just ₹${state.dailyAmount + 50}/day instead of ₹${state.dailyAmount}/day`,
            });
            const stepup = dailySipCalc(state.dailyAmount * 1.1, state.dailyYears, state.dailyRate);
            out.push({
                title: "10% step-up karein",
                titleHi: "10% step-up करें",
                extra: stepup.fv - baseFv,
                detail: "Every year increase daily SIP by 10%",
            });
            const longer = dailySipCalc(state.dailyAmount, state.dailyYears + 5, state.dailyRate);
            out.push({
                title: "5 saal aur",
                titleHi: "5 साल और",
                extra: longer.fv - baseFv,
                detail: `Continue for ${state.dailyYears + 5} years total`,
            });
        } else if (tab === "lumpsum") {
            const baseFv = result.fv;
            const withSip = sipCalc(2000, state.lumpYears, state.lumpRate);
            out.push({
                title: "Add ₹2000/mo SIP",
                titleHi: "साथ में ₹2000/mo SIP",
                extra: withSip.fv,
                detail: "Lumpsum + monthly SIP = compounding squared",
            });
            const daily100 = sipCalc(100 * 22, state.lumpYears, state.lumpRate);
            out.push({
                title: "Add ₹100/day SIP",
                titleHi: "रोज़ ₹100 SIP जोड़ें",
                extra: daily100.fv,
                detail: "Lumpsum ke saath daily habit",
            });
            const longer = lumpsumCalc(state.lump, state.lumpYears + 5, state.lumpRate);
            out.push({
                title: "5 saal aur hold karein",
                titleHi: "5 साल और रखें",
                extra: longer.fv - baseFv,
                detail: `Hold for ${state.lumpYears + 5} years instead`,
            });
        } else if (tab === "goal") {
            const baseSip = result.requiredSip;
            const stepup = baseSip * 0.8;
            out.push({
                title: "Step-up SIP shuru karein",
                titleHi: "Step-up SIP चलाएँ",
                extra: (baseSip - stepup) * state.goalYears * 12,
                detail: `Start with only ₹${Math.round(stepup).toLocaleString("en-IN")}/mo and step up 10% yearly`,
            });
            out.push({
                title: "₹100/day daily SIP add",
                titleHi: "रोज़ ₹100 SIP जोड़ें",
                extra: state.goal * 0.15,
                detail: "Add a daily SIP — reach goal 2-3 years earlier",
            });
        }
    } catch (e) {
        console.warn(e);
    }
    return out.slice(0, 3);
}

function SnapshotCard({ tab, result, state }) {
    if (!result) return null;
    const labels = {
        sip: "SIP Calculator",
        daily: "Daily SIP Calculator",
        lumpsum: "Lumpsum Calculator",
        swp: "SWP Calculator",
        goal: "Goal Planner",
        emi: "EMI Calculator",
    };

    const extendable = ["sip", "daily", "lumpsum", "goal"].includes(tab);
    const periods = extendable ? [2, 5, 10] : [];
    const projections = periods.map((y) => ({ y, p: projectExtended(tab, state, y) }));
    const baseYears = (() => {
        switch (tab) {
            case "sip": return state.sipYears;
            case "daily": return state.dailyYears;
            case "lumpsum": return state.lumpYears;
            case "swp": return state.swpYears;
            case "goal": return state.goalYears;
            case "emi": return state.loanYears;
            default: return 0;
        }
    })();

    const rateUsed = (() => {
        switch (tab) {
            case "sip": return state.sipRate;
            case "daily": return state.dailyRate;
            case "lumpsum": return state.lumpRate;
            case "swp": return state.swpRate;
            case "goal": return state.goalRate;
            case "emi": return state.loanRate;
            default: return 12;
        }
    })();

    const headlineMetric = (() => {
        if (tab === "emi") return { label: "Monthly EMI", value: fmtINR(result.emi) };
        if (tab === "swp") return { label: "Balance left", value: fmtINR(result.fv) };
        if (tab === "goal") return { label: "Monthly SIP needed", value: fmtINR(result.requiredSip) };
        return { label: "Future Value", value: fmtINR(result.fv) };
    })();

    const investedLine = (() => {
        if (tab === "sip") {
            let s = `Monthly SIP: ${fmtINR(state.sipAmount)}`;
            if (state.sipDailyAddon > 0) s += ` + Daily top-up ${fmtINR(state.sipDailyAddon)}/day`;
            if (state.sipStepUp > 0) s += ` · ${state.sipStepUp}% annual step-up`;
            return s;
        }
        if (tab === "daily") return `Daily SIP: ${fmtINR(state.dailyAmount)}/day (22 working days/month)`;
        if (tab === "lumpsum") return `Lumpsum Amount: ${fmtINR(state.lump}`;
        if (tab === "swp") return `Monthly Withdrawal: ${fmtINR(state.swpMonthly)} from ${fmtINR(state.swpCorpus)} corpus`;
        if (tab === "goal") return `Target Corpus: ${fmtINR(state.goal}`;
        if (tab === "emi") return `Loan Amount: ${fmtINR(state.loan}`;
        return "";
    })();

    return (
        <div className="snap-card">
            <div aria-hidden style={{position: "absolute", top: -120, right: -120, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(2, 67, 150,0.18) 0%, transparent 70%)"}} />
            <div aria-hidden style={{position: "absolute", bottom: -140, left: -140, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(199, 16, 46,0.15) 0%, transparent 70%)"}} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={TFD_LOGO} crossOrigin="anonymous" alt="TFD" style={{height: 72, width: "auto", objectFit: "contain", background: "#F6F1E8", borderRadius: 12, padding: 6, border: "1px solid #E2D8C2"}} />
                    <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#0E1B2C", lineHeight: 1 }}>The Financial Doctor</div>
                        <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D", marginTop: 6 }}>Treating Your Financial Health</div>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D" }}>AMFI · ARN-290298</div>
                    <div style={{ fontSize: 11, color: "#024396", marginTop: 4, fontWeight: 600 }}>Sehore · MP</div>
                </div>
            </div>
            <div style={{position: "relative", background: "#0E1B2C", color: "#F6F1E8", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18}}>
                <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7102E", fontWeight: 600 }}>{labels[tab]}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, marginTop: 6, lineHeight: 1 }}>{headlineMetric.value}</div>
                    <div style={{ fontSize: 11, color: "#F6F1E8", opacity: 0.7, marginTop: 4 }}>{headlineMetric.label} · over {baseYears} years @ {rateUsed}% p.a.</div>
                    <div style={{ fontSize: 12, color: "#F6F1E8", marginTop: 6, fontWeight: 600 }}>{investedLine}</div>
                </div>
                <div style={{background: "#C7102E", color: "#fff", borderRadius: 999, padding: "5px 12px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700}}>Snapshot</div>
            </div>
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {tab === "emi" ? (
                    <>
                        <BigStat label="Loan Amount" value={fmtINR(state.loan)} />
                        <BigStat label="Total Interest" value={fmtINR(result.interest)} />
                        <BigStat label="Total Payable" value={fmtINR(result.total)} accent />
                    </>
                ) : tab === "swp" ? (
                    <>
                        <BigStat label="Initial Corpus" value={fmtINR(result.invested)} />
                        <BigStat label="Total Withdrawn" value={fmtINR(result.gains)} />
                        <BigStat label="Balance Left" value={fmtINR(result.fv)} accent />
                    </>
                ) : tab === "goal" ? (
                    <>
                        <BigStat label="Target" value={fmtINR(result.target)} />
                        <BigStat label="You Invest" value={fmtINR(result.invested)} />
                        <BigStat label="Required SIP" value={fmtINR(result.requiredSip)} accent />
                    </>
                ) : (
                    <>
                        <BigStat label="Total Invested" value={fmtINR(result.invested)} />
                        <BigStat label="Est. Returns" value={fmtINR(result.gains)} />
                        <BigStat label="Future Value" value={fmtINR(result.fv)} accent />
                    </>
                )}
            </div>
            {extendable && (
                <div style={{ position: "relative", marginBottom: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#024396", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 18, height: 1, background: "#024396" }} />What if you stay invested longer?</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {projections.map(({ y, p }) => {
                            const extraGains = p ? p.fv - result.fv : 0;
                            return (
                                <div key={y} style={{background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 16, padding: "14px 12px", textAlign: "left"}}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ background: "#024396", color: "#F6F1E8", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>+{y}Y</span><span style={{ fontSize: 10, color: "#5C677D" }}>({baseYears + y} yrs total)</span></div>
                                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: "#0E1B2C", lineHeight: 1.1 }}>{p ? fmtINR(p.fv) : "—"}</div>
                                    <div style={{ fontSize: 10, color: "#024396", marginTop: 4, fontWeight: 600 }}>+{fmtINR(extraGains)} extra</div>
                                    {p && <div style={{ fontSize: 9, color: "#5C677D", marginTop: 3 }}>Invested {fmtINR(p.invested)}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <div style={{ position: "relative", marginBottom: 18 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D", marginBottom: 8 }}>Year-on-year growth</div>
                <div style={{ background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 12, padding: 12 }}><SnapshotChart series={result.series || []} tab={tab} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#5C677D" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#C7102E" }} />Invested</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#024396" }} />{tab === "emi" ? "Outstanding" : "Value"}</span></div>
            </div>
            <div style={{ position: "relative", marginBottom: 18 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7102E", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 18, height: 18, borderRadius: 999, background: "#C7102E", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>💡</span>Boost your wealth · Smart suggestions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {upsellScenarios(tab, state, result).map((s, idx) => (
                        <div key={`upsell-${idx}-${(s.label || "").slice(0, 12)}`} style={{background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 12, padding: "9px 12px", borderLeft: "3px solid #024396", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10}}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, color: "#0E1B2C", fontWeight: 600, lineHeight: 1.3 }}>{s.title} · <span style={{ color: "#5C677D", fontWeight: 400 }}>{s.titleHi}</span></div>
                                <div style={{ fontSize: 10.5, color: "#5C677D", marginTop: 2, lineHeight: 1.3 }}>{s.detail}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 9, color: "#024396", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Extra gain</div><div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: "#024396", lineHeight: 1.1, marginTop: 2 }}>+{fmtINR(s.extra)}</div></div>
                        </div>
                    ))}
                    {(CALC_RECOMMENDATIONS[tab] || []).slice(0, 1).map((tip, idx) => (
                        <div key={`tip-${idx}`} style={{background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 12, padding: "9px 12px", borderLeft: "3px solid #C7102E"}}>
                            <div style={{ fontSize: 11.5, color: "#0E1B2C", lineHeight: 1.4 }}><strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#024396" }}>EN:</strong>{tip.en}</div>
                            <div style={{ fontSize: 11.5, color: "#2A364B", lineHeight: 1.4, marginTop: 3 }}><strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#C7102E" }}>HI:</strong>{tip.hi}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{position: "relative", background: "#0E1B2C", color: "#F6F1E8", borderRadius: 18, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", marginBottom: 14}}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={SAGAR_PHOTO} crossOrigin="anonymous" alt="Sagar" style={{width: 70, height: 88, borderRadius: 12, objectFit: "cover", border: "2px solid #C7102E"}} />
                    <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.1 }}>Sagar Chaturvedi</div>
                        <div style={{ fontSize: 10, color: "#F6F1E8", opacity: 0.7, marginTop: 3, letterSpacing: "0.12em", textTransform: "uppercase" }}>Founder · MFD (AMFI Certified)</div>
                        <div style={{ fontSize: 11, marginTop: 6, opacity: 0.9 }}>📱 +91 77738 05794</div>
                        <div style={{ fontSize: 11, opacity: 0.9 }}>✉ wecare@thefinancialdoctor.in</div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: 5, borderRadius: 10 }}><QRCodeCanvas value={TFD_BRAND_URL} size={88} bgColor="#FFFFFF" fgColor="#0E1B2C" level="M" includeMargin={false} /></div>
                    <div style={{ fontSize: 9, marginTop: 5, color: "#C7102E", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Scan to invest</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>AssetPlus · ARN-290298</div>
                </div>
            </div>
            <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#0E1B2C", fontWeight: 600, marginBottom: 4 }}>thefinancialdoctor.in</div>
                <div style={{ fontSize: 9, color: "#5C677D", fontStyle: "italic", lineHeight: 1.4 }}>Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Calculations are illustrative; actual returns may vary.</div>
            </div>
        </div>
    );
}

function BigStat({ label, value, accent }) {
    return (
        <div style={{background: accent ? "#024396" : "#FBF7EE", border: accent ? "none" : "1px solid #E2D8C2", borderRadius: 16, padding: "12px 12px", textAlign: "left", color: accent ? "#F6F1E8" : "#0E1B2C"}}>
            <div style={{fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: accent ? "rgba(246,241,232,0.75)" : "#5C677D", marginBottom: 6}}>{label}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, lineHeight: 1.1 }}>{value}</div>
        </div>
    );
}

function SnapshotChart({ series, tab }) {
    const w = 540;
    const h = 150;
    const pad = { l: 40, r: 8, t: 8, b: 22 };
    if (!series || series.length === 0) {
        return <div style={{ height: h, color: "#5C677D", fontSize: 11 }}>No data</div>;
    }
    const max = Math.max(...series.map((p) => Math.max(p.invested, p.value, 1)));
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const step = innerW / Math.max(1, series.length - 1);
    const toXY = (p, i, key) => {
        const x = pad.l + step * i;
        const y = pad.t + innerH - (p[key] / max) * innerH;
        return [x, y];
    };
    const buildPath = (key) => series.map((p, i) => { const [x, y] = toXY(p, i, key); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
    const buildArea = (key) => {
        const top = buildPath(key);
        const [x0] = toXY(series[0], 0, key);
        const [xn] = toXY(series[series.length - 1], series.length - 1, key);
        return `${top} L${xn.toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x0.toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;
    };
    const yTicks = [0, max / 2, max];
    const fmtTick = (v) => {
        if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
        if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
        return String(Math.round(v));
    };
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gv-snap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#024396" stopOpacity="0.4" /><stop offset="100%" stopColor="#024396" stopOpacity="0" /></linearGradient>
                <linearGradient id="gi-snap" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C7102E" stopOpacity="0.35" /><stop offset="100%" stopColor="#C7102E" stopOpacity="0" /></linearGradient>
            </defs>
            {yTicks.map((t, i) => {
                const y = pad.t + innerH - (t / max) * innerH;
                return (
                    <g key={`y${i}`}>
                        <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#E2D8C2" strokeDasharray="3 3" strokeWidth={1} />
                        <text x={pad.l - 6} y={y + 3} fontSize="9" fill="#5C677D" textAnchor="end" fontFamily="DM Sans, sans-serif">₹{fmtTick(t)}</text>
                    </g>
                );
            })}
            {series.map((p, i) => {
                if (series.length > 8 && i % 2 !== 0 && i !== series.length - 1) return null;
                const x = pad.l + step * i;
                return (<text key={`x${i}`} x={x} y={h - 6} fontSize="9" fill="#5C677D" textAnchor="middle" fontFamily="DM Sans, sans-serif">{p.label}</text>);
            })}
            <path d={buildArea("invested")} fill="url(#gi-snap)" /><path d={buildArea("value")} fill="url(#gv-snap)" />
            <path d={buildPath("invested")} fill="none" stroke="#C7102E" strokeWidth="2" /><path d={buildPath("value")} fill="none" stroke="#024396" strokeWidth="2.4" />
            {(() => {
                const last = series[series.length - 1];
                const [x, y] = toXY(last, series.length - 1, "value");
                return (<g><circle cx={x} cy={y} r="4" fill="#024396" stroke="#FBF7EE" strokeWidth="2" /></g>);
            })()}
        </svg>
    );
}
