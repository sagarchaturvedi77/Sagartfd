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
import { Download, ArrowUpRight, Calculator as CalcIcon, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { IDS } from "@/constants/testIds";

const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";

const fmtINR = (n) => {
    if (!isFinite(n)) return "₹0";
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

// ---------- Calculations ----------
function sipCalc(monthly, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const series = [];
    let invested = 0;
    let fv = 0;
    for (let m = 1; m <= months; m++) {
        invested += monthly;
        fv = (fv + monthly) * (1 + r);
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
    // Convention: 22 working days per month
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
    // FV of SIP = P * [((1+r)^n - 1)/r] * (1+r)
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
    return (
        <div>
            <div className="flex items-baseline justify-between mb-2">
                <label className="text-[13px] uppercase tracking-[0.15em] text-[#5C677D]">
                    {label}
                </label>
                <div className="font-display text-xl text-[#0E1B2C]">
                    {format ? format(value) : value}
                </div>
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

    // Shared / per-tab states
    const [sipAmount, setSipAmount] = useState(10000);
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

    const result = useMemo(() => {
        switch (tab) {
            case "sip":
                return { kind: "sip", ...sipCalc(sipAmount, sipYears, sipRate) };
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
        sipAmount, sipYears, sipRate,
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
            // small delay to ensure QR canvas is painted
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
        <section id="calc" className="section">
            <div className="container-x">
                <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
                    <div>
                        <div className="eyebrow">Plan · Visualise · Act</div>
                        <h2 className="h2 mt-3 text-[#0E1B2C]">
                            Money math, <span className="font-italic-serif text-[#0E5E48]">made visual.</span>
                        </h2>
                        <p className="mt-3 text-[#2A364B] max-w-2xl">
                            See exactly how your wealth compounds. Try SIP, Daily SIP, Lumpsum, SWP, Goal &
                            EMI scenarios — then download a personalised snapshot to share or onboard via
                            AssetPlus.
                        </p>
                    </div>
                    <div className="hidden md:inline-flex items-center gap-2 text-xs text-[#5C677D] bg-[#FBF7EE] border border-[#E2D8C2] rounded-full px-3 py-2">
                        <Sparkles size={14} className="text-[#C9802A]" />
                        Daily SIP uses <strong className="text-[#0E1B2C] mx-1">22 working days</strong> / month
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            data-testid={t.testid}
                            onClick={() => setTab(t.id)}
                            className={`tab-pill ${tab === t.id ? "active" : ""}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Inputs */}
                    <div className="lg:col-span-4 card-cream p-7">
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D] mb-5">
                            Inputs
                        </div>
                        {tab === "sip" && (
                            <div className="space-y-7">
                                <Slider label="Monthly Investment" value={sipAmount} onChange={setSipAmount}
                                    min={500} max={200000} step={500} format={fmtINR}
                                    testid={IDS.calc.amount} />
                                <Slider label="Investment Period" value={sipYears} onChange={setSipYears}
                                    min={1} max={40} step={1} format={(v) => `${v} Yr`}
                                    testid={IDS.calc.years} />
                                <Slider label="Expected Return (p.a.)" value={sipRate} onChange={setSipRate}
                                    min={1} max={30} step={0.5} format={(v) => `${v}%`}
                                    testid={IDS.calc.rate} />
                            </div>
                        )}
                        {tab === "daily" && (
                            <div className="space-y-7">
                                <Slider label="Daily Investment" value={dailyAmount} onChange={setDailyAmount}
                                    min={50} max={5000} step={50} format={fmtINR}
                                    testid={IDS.calc.dailyAmount} />
                                <Slider label="Investment Period" value={dailyYears} onChange={setDailyYears}
                                    min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={dailyRate} onChange={setDailyRate}
                                    min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                                <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                    Effective monthly SIP equivalent: <strong className="text-[#0E1B2C]">{fmtINR(result?.monthly || 0)}</strong>
                                    {" "}— calculated using 22 working days × ₹{dailyAmount}.
                                </div>
                            </div>
                        )}
                        {tab === "lumpsum" && (
                            <div className="space-y-7">
                                <Slider label="Investment Amount" value={lump} onChange={setLump}
                                    min={10000} max={10000000} step={10000} format={fmtINR} />
                                <Slider label="Investment Period" value={lumpYears} onChange={setLumpYears}
                                    min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={lumpRate} onChange={setLumpRate}
                                    min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "swp" && (
                            <div className="space-y-7">
                                <Slider label="Initial Corpus" value={swpCorpus} onChange={setSwpCorpus}
                                    min={100000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Monthly Withdrawal" value={swpMonthly} onChange={setSwpMonthly}
                                    min={1000} max={500000} step={1000} format={fmtINR} />
                                <Slider label="Period" value={swpYears} onChange={setSwpYears}
                                    min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={swpRate} onChange={setSwpRate}
                                    min={1} max={20} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "goal" && (
                            <div className="space-y-7">
                                <Slider label="Target Corpus" value={goal} onChange={setGoal}
                                    min={100000} max={100000000} step={100000} format={fmtINR} />
                                <Slider label="Years to Goal" value={goalYears} onChange={setGoalYears}
                                    min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Return (p.a.)" value={goalRate} onChange={setGoalRate}
                                    min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "emi" && (
                            <div className="space-y-7">
                                <Slider label="Loan Amount" value={loan} onChange={setLoan}
                                    min={100000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Tenure" value={loanYears} onChange={setLoanYears}
                                    min={1} max={30} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Interest (p.a.)" value={loanRate} onChange={setLoanRate}
                                    min={5} max={20} step={0.1} format={(v) => `${v}%`} />
                            </div>
                        )}
                    </div>

                    {/* Chart + Result */}
                    <div className="lg:col-span-8 grid grid-rows-[1fr_auto] gap-6">
                        <div className="card-cream p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D]">
                                    Projection
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#5C677D]">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#C9802A]" />
                                        Invested
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#0E5E48]" />
                                        {tab === "emi" ? "Outstanding" : "Value"}
                                    </span>
                                </div>
                            </div>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={result?.series || []}>
                                        <defs>
                                            <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#0E5E48" stopOpacity={0.45} />
                                                <stop offset="100%" stopColor="#0E5E48" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#C9802A" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#C9802A" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2D8C2" />
                                        <XAxis dataKey="label" stroke="#5C677D" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#5C677D" tick={{ fontSize: 11 }} tickFormatter={fmtINR} width={70} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "#0E1B2C",
                                                border: "none",
                                                borderRadius: 12,
                                                color: "#F6F1E8",
                                                fontSize: 12,
                                            }}
                                            formatter={(v) => fmtINR(v)}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="invested"
                                            stroke="#C9802A"
                                            strokeWidth={2}
                                            fill="url(#gi)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#0E5E48"
                                            strokeWidth={2.4}
                                            fill="url(#gv)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <ResultCard
                            data-testid={IDS.calc.result}
                            tab={tab}
                            result={result}
                            onDownload={downloadSnapshot}
                        />
                    </div>
                </div>

                {/* Hidden snapshot card for PNG export */}
                <div
                    style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }}
                    aria-hidden
                >
                    <div ref={snapRef} data-testid={IDS.calc.snapshot}>
                        <SnapshotCard tab={tab} result={result} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ResultCard({ tab, result, onDownload }) {
    if (!result) return null;
    return (
        <div className="card-ink p-6 md:p-7" data-testid={IDS.calc.result}>
            <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="grid grid-cols-3 gap-6 md:gap-10 flex-1">
                    {tab === "emi" ? (
                        <>
                            <Metric label="Monthly EMI" value={fmtINR(result.emi)} />
                            <Metric label="Total Interest" value={fmtINR(result.interest)} />
                            <Metric label="Total Payable" value={fmtINR(result.total)} primary />
                        </>
                    ) : tab === "swp" ? (
                        <>
                            <Metric label="Initial Corpus" value={fmtINR(result.invested)} />
                            <Metric label="Total Withdrawn" value={fmtINR(result.gains)} />
                            <Metric label="Balance Left" value={fmtINR(result.fv)} primary />
                        </>
                    ) : tab === "goal" ? (
                        <>
                            <Metric label="Required Monthly SIP" value={fmtINR(result.requiredSip)} primary />
                            <Metric label="Total Invested" value={fmtINR(result.invested)} />
                            <Metric label="Target Corpus" value={fmtINR(result.target)} />
                        </>
                    ) : (
                        <>
                            <Metric label="Total Invested" value={fmtINR(result.invested)} />
                            <Metric label="Estimated Returns" value={fmtINR(result.gains)} />
                            <Metric label="Future Value" value={fmtINR(result.fv)} primary />
                        </>
                    )}
                </div>
                <div className="flex flex-col gap-2 ml-auto">
                    <button
                        onClick={onDownload}
                        className="btn-pill"
                        style={{ background: "#C9802A", color: "#fff" }}
                        data-testid={IDS.calc.download}
                    >
                        <Download size={16} /> Download PNG
                    </button>
                    <a
                        href={TFD_BRAND_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-pill"
                        style={{ background: "#F6F1E8", color: "#0E1B2C" }}
                        data-testid={IDS.calc.startPlan}
                    >
                        Start this Plan <ArrowUpRight size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value, primary }) {
    return (
        <div>
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">{label}</div>
            <div
                className={`font-display mt-2 ${
                    primary ? "text-[2rem] text-[#F6F1E8]" : "text-[1.5rem] text-[#F6F1E8]/85"
                }`}
            >
                {value}
            </div>
        </div>
    );
}

const SAGAR_PHOTO =
    "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";

function SnapshotCard({ tab, result }) {
    if (!result) return null;
    const labels = {
        sip: "SIP Calculator",
        daily: "Daily SIP Calculator",
        lumpsum: "Lumpsum Calculator",
        swp: "SWP Calculator",
        goal: "Goal Planner",
        emi: "EMI Calculator",
    };
    return (
        <div className="snap-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-[#0E5E48] grid place-items-center text-[#F6F1E8] font-display text-xl">
                        T
                    </span>
                    <div>
                        <div className="font-display text-[1.15rem] leading-none text-[#0E1B2C]">
                            The Financial Doctor
                        </div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-[#5C677D] mt-1">
                            ARN-290298 · Sehore, MP
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#5C677D]">
                        {labels[tab]}
                    </div>
                    <div className="font-display text-[#C9802A] text-base mt-1">
                        <CalcIcon size={14} className="inline mr-1" /> Snapshot
                    </div>
                </div>
            </div>

            {/* Body grid */}
            <div className="grid grid-cols-[1fr_auto] gap-5">
                <div>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        {tab === "emi" ? (
                            <>
                                <Stat label="Monthly EMI" value={fmtINR(result.emi)} />
                                <Stat label="Interest" value={fmtINR(result.interest)} />
                                <Stat label="Total Payable" value={fmtINR(result.total)} primary />
                            </>
                        ) : tab === "swp" ? (
                            <>
                                <Stat label="Corpus" value={fmtINR(result.invested)} />
                                <Stat label="Total Withdrawn" value={fmtINR(result.gains)} />
                                <Stat label="Balance Left" value={fmtINR(result.fv)} primary />
                            </>
                        ) : tab === "goal" ? (
                            <>
                                <Stat label="Monthly SIP" value={fmtINR(result.requiredSip)} primary />
                                <Stat label="Invested" value={fmtINR(result.invested)} />
                                <Stat label="Target" value={fmtINR(result.target)} />
                            </>
                        ) : (
                            <>
                                <Stat label="Invested" value={fmtINR(result.invested)} />
                                <Stat label="Returns" value={fmtINR(result.gains)} />
                                <Stat label="Future Value" value={fmtINR(result.fv)} primary />
                            </>
                        )}
                    </div>

                    {/* Mini bar visualisation */}
                    <div className="h-20 rounded-xl bg-[#F6F1E8] border border-[#E2D8C2] flex items-end gap-1 p-2">
                        {(result.series || []).map((p, idx) => {
                            const max = Math.max(
                                ...result.series.map((x) => Math.max(x.invested, x.value)),
                            );
                            const hi = (p.invested / max) * 100;
                            const hv = (p.value / max) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col-reverse gap-0.5">
                                    <div
                                        style={{ height: `${hi}%`, background: "#C9802A" }}
                                        className="rounded-sm"
                                    />
                                    <div
                                        style={{ height: `${hv}%`, background: "#0E5E48" }}
                                        className="rounded-sm"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <img
                            src={SAGAR_PHOTO}
                            crossOrigin="anonymous"
                            alt="Sagar Chaturvedi"
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#0E5E48]"
                        />
                        <div>
                            <div className="font-display text-[#0E1B2C] text-[1.05rem] leading-tight">
                                Sagar Chaturvedi
                            </div>
                            <div className="text-[11px] text-[#5C677D]">
                                Founder · MFD (AMFI Certified)
                            </div>
                            <div className="text-[11px] text-[#5C677D]">
                                +91 77738 05794 · wecare@thefinancialdoctor.in
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between">
                    <div className="bg-white border border-[#E2D8C2] rounded-xl p-2">
                        <QRCodeCanvas
                            value={TFD_BRAND_URL}
                            size={108}
                            bgColor="#FFFFFF"
                            fgColor="#0E1B2C"
                            level="M"
                            includeMargin={false}
                        />
                    </div>
                    <div className="text-center mt-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#5C677D]">
                            Scan to invest
                        </div>
                        <div className="font-display text-[#0E5E48] text-sm mt-0.5">
                            AssetPlus · ARN-290298
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-[#E2D8C2] flex items-center justify-between text-[10px] text-[#5C677D]">
                <span>thefinancialdoctor.in</span>
                <span className="italic">
                    Mutual fund investments are subject to market risks. Read all scheme-related
                    documents carefully.
                </span>
            </div>
        </div>
    );
}

function Stat({ label, value, primary }) {
    return (
        <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#5C677D]">{label}</div>
            <div
                className={`font-display mt-1 ${
                    primary ? "text-[1.5rem] text-[#0E5E48]" : "text-[1.05rem] text-[#0E1B2C]"
                }`}
            >
                {value}
            </div>
        </div>
    );
}
