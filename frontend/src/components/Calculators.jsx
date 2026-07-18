import React, { useMemo, useRef, useState, useEffect, useContext, createContext } from "react";
import { useNavigate } from "react-router-dom";
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
// html2canvas/jsPDF are dynamically imported at their call sites below (only
// needed when a user actually clicks Download/Generate Proposal) — keeping
// them out of the static import graph saves ~150KB from every calculator
// page load, whether or not that visitor ever downloads anything.
import { toast } from "sonner";
import { IDS } from "@/constants/testIds";
import { CALC_RECOMMENDATIONS } from "@/lib/recommendations";
// 🛠️ Step 1: Hook Import bina kisi space ke
import { useModal } from "../context/ModalContext";
import { trackEvent } from "./AnalyticsTracker";
import { QRCodeCanvas } from "qrcode.react";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";
const TFD_WEBSITE_URL = "https://thefinancialdoctor.in/";

const qrImageUrl = (url, size = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;


const fmtINR = (n) => {
    if (!isFinite(n)) return "₹0";
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
    
};
const fmtINRFull = (n) => {
    if (!isFinite(n)) return "₹0";
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
                label: `Year ${m / 12}`,
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
            label: `Year ${y}`,
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
                label: `Year ${m / 12}`,
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

function emiCalc(principal, years, rateAnnual, mode = "reducing") {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;

    let emi, total, interest;

    if (mode === "fixed") {
        // Fixed/Flat Interest: interest charged on the full original principal
        // for the entire tenure, regardless of how much has been repaid.
        interest = principal * (rateAnnual / 100) * years;
        total = principal + interest;
        emi = total / months;
    } else {
        // Reducing Balance: interest charged only on the outstanding amount.
        emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        total = emi * months;
        interest = total - principal;
    }

    const series = [];
    let bal = principal;
    let paid = 0;
    for (let m = 1; m <= months; m++) {
        const int = mode === "fixed" ? interest / months : bal * r;
        const prin = emi - int;
        bal -= prin;
        paid += emi;
        if (m % 12 === 0) {
            series.push({
                label: `Year ${m / 12}`,
                invested: Math.round(paid),
                value: Math.max(0, Math.round(bal)),
            });
        }
    }
    // 💡 Interest-Free Loan via SIP — monthly SIP (at 12% p.a.) needed to
    // accumulate an amount roughly equal to the total interest payable.
    const sipR = 0.12 / 12;
    const sipFactor = ((Math.pow(1 + sipR, months) - 1) / sipR) * (1 + sipR);
    const interestFreeSip = interest / sipFactor;

    return { emi, total, interest, series, interestFreeSip };
}

// 💰 Income Tax — simplified Old vs New regime comparison (FY 2025-26 style slabs)
function incomeTaxCalc(income, deductions80C) {
    const oldStdDeduction = 50000;
    const oldTaxable = Math.max(0, income - oldStdDeduction - Math.min(deductions80C, 150000));
    let oldTax = 0;
    if (oldTaxable > 1000000) oldTax += (oldTaxable - 1000000) * 0.3;
    if (oldTaxable > 500000) oldTax += (Math.min(oldTaxable, 1000000) - 500000) * 0.2;
    if (oldTaxable > 250000) oldTax += (Math.min(oldTaxable, 500000) - 250000) * 0.05;
    oldTax = Math.round(oldTax * 1.04);

    const newStdDeduction = 75000;
    const newTaxable = Math.max(0, income - newStdDeduction);
    let newTax = 0;
    if (newTaxable > 1500000) newTax += (newTaxable - 1500000) * 0.3;
    if (newTaxable > 1200000) newTax += (Math.min(newTaxable, 1500000) - 1200000) * 0.2;
    if (newTaxable > 1000000) newTax += (Math.min(newTaxable, 1200000) - 1000000) * 0.15;
    if (newTaxable > 700000) newTax += (Math.min(newTaxable, 1000000) - 700000) * 0.1;
    if (newTaxable > 300000) newTax += (Math.min(newTaxable, 700000) - 300000) * 0.05;
    if (newTaxable <= 700000) newTax = 0; // rebate
    newTax = Math.round(newTax * 1.04);

    const remainingElssRoom = Math.max(0, 150000 - deductions80C);
    const elssSaving = Math.round(remainingElssRoom * 0.3 * 1.04);

    return { oldTax, newTax, elssSaving, better: oldTax <= newTax ? "Old Regime" : "New Regime" };
}

// 🧾 GST breakup
function gstCalc(amount, rate, type) {
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
    return { base: Math.round(base), gst: Math.round(gst), total: Math.round(total), half: Math.round(gst / 2) };
}

// 🎯 Future Goal / Inflation
function inflationGoalCalc(currentCost, years, inflationRate, returnRate) {
    const futureCost = currentCost * Math.pow(1 + inflationRate / 100, years);
    const months = years * 12;
    const r = returnRate / 100 / 12;
    const sipFactor = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
    const requiredSip = futureCost / sipFactor;
    return { futureCost: Math.round(futureCost), requiredSip: Math.round(requiredSip), currentCost };
}

// ---------- Slider ----------
// Lets <Slider> know which variant it's rendering inside without having to
// thread a `variant` prop through every one of its ~30 call sites across
// all 9 calculator tabs.
const CalcVariantContext = createContext("public");

function Slider({ value, onChange, min, max, label, format, testid }) {
    const variant = useContext(CalcVariantContext);
    const numberInput = (
        <input
            type="number"
            value={value}
            onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { onChange(0); return; }
                const v = Number(raw);
                if (!isNaN(v)) onChange(v);
            }}
            onBlur={(e) => {
                let v = Number(e.target.value);
                if (isNaN(v)) v = min ?? 0;
                if (min !== undefined && v < min) v = min;
                if (max !== undefined && v > max) v = max;
                onChange(v);
            }}
            data-testid={testid}
        />
    );

    // Compact label-left / input-right row for the employee portal — the
    // public site keeps the original stacked layout untouched.
    if (variant === "employee") {
        return (
            <div className="flex items-start justify-between gap-3">
                <label className="text-xs text-[#5C677D] pt-2 flex-1 min-w-0">{label}</label>
                <div className="shrink-0 flex flex-col items-end">
                    {React.cloneElement(numberInput, {
                        className: "w-28 border border-[#E2D8C2] rounded-lg px-2.5 py-1.5 text-sm font-semibold text-right text-[#0E1B2C] outline-none focus:border-[#024396] bg-white",
                    })}
                    {format && <div className="text-[10px] text-[#5C677D] mt-1">{format(value)}</div>}
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] text-[#5C677D] block mb-2">
                {label}
            </label>
            {React.cloneElement(numberInput, {
                className: "w-full border border-[#E2D8C2] rounded-xl px-3 py-2.5 text-base font-semibold text-[#0E1B2C] outline-none focus:border-[#024396] bg-white",
            })}
            {format && (
                <div className="text-xs text-[#5C677D] mt-1">{format(value)}</div>
            )}
        </div>
    );
}

const TABS = [
    { id: "sip", label: "SIP", testid: IDS.calc.tabSip },
    { id: "daily", label: "Daily SIP", testid: IDS.calc.tabDaily },
    { id: "lumpsum", label: "Lumpsum", testid: IDS.calc.tabLumpsum },
    { id: "swp", label: "SWP", testid: IDS.calc.tabSwp },
    { id: "goal", label: "Goal", testid: IDS.calc.tabGoal },
    { id: "emi", label: "Loan EMI", testid: IDS.calc.tabEmi },
    { id: "tax", label: "Income Tax" },
    { id: "gst", label: "GST" },
    { id: "inflation", label: "Future Goal" },
];

// Tabs that have a time-series growth chart (SIP/lumpsum style)
const CHART_TABS = ["sip", "daily", "lumpsum", "swp", "goal", "emi"];

export default function Calculators({ variant = "public", employeeInfo = null, activeType = null }) {
    const navigate = useNavigate();

    // Yahan humne default state me hi activeType daal diya hai
    const [tab, setTabRaw] = useState(activeType || "sip");

    useEffect(() => {
        if (activeType) {
            setTabRaw(activeType);
        }
    }, [activeType]);

    const setTab = (t) => {
        setTabRaw(t);
        if (variant !== "employee") {
            navigate(`/calculators/${t}`);
        }
        if (typeof trackEvent === "function") {
            trackEvent("calculator_use", TABS.find(x => x.id === t)?.label || t);
        }
    };

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
    const [loanMode, setLoanMode] = useState("reducing"); // "reducing" | "fixed"

    // 🆕 Income Tax
    const [taxIncome, setTaxIncome] = useState(1200000);
    const [taxDeductions, setTaxDeductions] = useState(50000);

    // 🆕 GST
    const [gstAmount, setGstAmount] = useState(10000);
    const [gstRate, setGstRate] = useState(18);
    const [gstType, setGstType] = useState("exclusive");

    // 🆕 Future Goal / Inflation
    const [inflCost, setInflCost] = useState(1000000);
    const [inflYears, setInflYears] = useState(10);
    const [inflRate, setInflRate] = useState(7);
    const [inflReturn, setInflReturn] = useState(12);

    // 🛠️ Step 2: Extract open trigger hook
    const { openGateway } = useModal();

    // 🆕 Employee-mode proposal flow: client details, generated image, share message
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientInfo, setClientInfo] = useState(() => {
    if (typeof window !== "undefined") {
        try {
            const saved = JSON.parse(localStorage.getItem("tfd_lead_info") || "null");
            if (saved && saved.name && saved.phone) return saved;
        } catch { /* ignore */ }
    }
    return { name: "", phone: "" };
});
const [showReturningModal, setShowReturningModal] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [proposalLang, setProposalLang] = useState("english"); // "english" | "hindi" | "hinglish" — language of the PDF itself
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null); // { dataUrl, blob }
    const [msgTemplate, setMsgTemplate] = useState("english"); // "english" | "hinglish"
    const [shareMessage, setShareMessage] = useState("");


const calcSummaryLine = (t) => {
    const labels = { sip: "SIP Calculator", daily: "Daily SIP Calculator", lumpsum: "Lumpsum Calculator", swp: "SWP Calculator", goal: "Goal Planner", emi: "EMI Calculator", tax: "Income Tax Calculator", gst: "GST Calculator", inflation: "Future Goal Calculator" };
    if (t === "sip") return `${labels.sip} — ₹${sipAmount.toLocaleString("en-IN")}/month @ ${sipRate}% p.a.`;
    if (t === "daily") return `${labels.daily} — ₹${dailyAmount}/day @ ${dailyRate}% p.a.`;
    if (t === "lumpsum") return `${labels.lumpsum} — ₹${lump.toLocaleString("en-IN")} @ ${lumpRate}% p.a.`;
    if (t === "swp") return `${labels.swp} — ₹${swpCorpus.toLocaleString("en-IN")} corpus, ₹${swpMonthly.toLocaleString("en-IN")}/month withdrawal`;
    if (t === "goal") return `${labels.goal} — Target ₹${goal.toLocaleString("en-IN")} in ${goalYears} yrs @ ${goalRate}% p.a.`;
    if (t === "emi") return `${labels.emi} — Loan ₹${loan.toLocaleString("en-IN")} @ ${loanRate}% p.a.`;
    if (t === "gst") return `${labels.gst} — @ ${gstRate}% GST`;
    if (t === "inflation") return `${labels.inflation} — ₹${inflCost.toLocaleString("en-IN")} today @ ${inflRate}% inflation`;
    return labels[t] || "";
};

const buildShareMessage = (template, client, employee) => {
    const clientName = client?.name?.trim();
    const empName = employee?.name || "TFD Team";
    const calcLine = calcSummaryLine(tab);
    if (template === "hinglish") {
        return `Namaste${clientName ? " " + clientName : ""} ji,\n\nAapke liye ek personalised financial proposal taiyar kiya hai *The Financial Doctor* ki taraf se 📊\n\n📌 ${calcLine}\n\nEk baar dekh lijiye — koi bhi sawaal ho to bejhijhak puchiye.\n\nDhanyawad,\n${empName}\nThe Financial Doctor`;
    }
    return `Hi${clientName ? " " + clientName : ""},\n\nHere's your personalised financial proposal from *The Financial Doctor* 📊\n\n📌 ${calcLine}\n\nTake a look, and feel free to reach out if you have any questions.\n\nRegards,\n${empName}\nThe Financial Doctor`;
};
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Bakes the QR + gold-frame badge into ONE flat PNG instead of nesting
// border-radius/overflow:hidden divs around a live <img>. html2canvas
// reliably rasterizes a single flat image; it was silently painting the
// frame over the QR whenever it was built from nested clipped divs
// (confirmed: the live DOM always had a valid, loaded QR image — only the
// html2canvas-captured output lost it). The frame is a SQUARE, not a
// circle — a circular crop cuts off the QR's corner finder patterns,
// which makes it unscannable even though it displays fine. The QR itself
// is drawn at its full square size with a clean quiet-zone margin, never
// clipped; only the decorative outer frame gets a small corner radius.
function buildQrBadgeDataUrl(qrCanvasEl) {
    const SCALE = 4; // exported at 4x, displayed at 76px — stays crisp
    const OUTER = 76 * SCALE;
    const INNER = 68 * SCALE;
    const QR = 56 * SCALE;
    const BORDER = 2 * SCALE;
    const RADIUS = 8 * SCALE;

    const canvas = document.createElement("canvas");
    canvas.width = OUTER;
    canvas.height = OUTER;
    const ctx = canvas.getContext("2d");

    roundRectPath(ctx, 0, 0, OUTER, OUTER, RADIUS);
    ctx.fillStyle = "#D9A928";
    ctx.fill();

    const innerOffset = (OUTER - INNER) / 2;
    roundRectPath(ctx, innerOffset, innerOffset, INNER, INNER, RADIUS * 0.6);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = BORDER;
    ctx.strokeStyle = "#0E1B2C";
    ctx.stroke();

    // Full, uncropped, square QR — this is what actually needs to scan.
    const qrOffset = (OUTER - QR) / 2;
    ctx.drawImage(qrCanvasEl, qrOffset, qrOffset, QR, QR);

    return canvas.toDataURL("image/png");
}

function isCanvasActuallyDrawn(canvasEl) {
    try {
        const ctx = canvasEl.getContext("2d");
        const { data } = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) return true;
        }
        return false;
    } catch {
        return false;
    }
}

useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const wrapper = qrCanvasWrapRef.current;
        const canvasEl = wrapper ? wrapper.querySelector("canvas") : null;
        if (canvasEl && isCanvasActuallyDrawn(canvasEl)) {
            const url = buildQrBadgeDataUrl(canvasEl);
            qrDataUrlRef.current = url;
            setQrDataUrl(url);
            clearInterval(interval);
            return;
        }
        if (attempts >= 25) {
            clearInterval(interval);
        }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
    if (showSharePopup) {
        setShareMessage(buildShareMessage(msgTemplate, clientInfo, employeeInfo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [showSharePopup, msgTemplate]);

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
                return { kind: "emi", ...emiCalc(loan, loanYears, loanRate, loanMode) };
            case "tax":
                return { kind: "tax", ...incomeTaxCalc(taxIncome, taxDeductions) };
            case "gst":
                return { kind: "gst", ...gstCalc(gstAmount, gstRate, gstType) };
            case "inflation":
                return { kind: "inflation", ...inflationGoalCalc(inflCost, inflYears, inflRate, inflReturn) };
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
        loan, loanYears, loanRate, loanMode,
        taxIncome, taxDeductions,
        gstAmount, gstRate, gstType,
        inflCost, inflYears, inflRate, inflReturn,
    ]);

    const snapRef = useRef(null);
const page1Ref = useRef(null);
const page2Ref = useRef(null);
const qrCanvasWrapRef = useRef(null);
const [qrDataUrl, setQrDataUrl] = useState(null);
const qrDataUrlRef = useRef(null);

    // downloadSnapshot/downloadingSnapshot: no button currently calls this legacy function,
    // but it's kept wrapped as a double-click-safe pair per the useSubmitOnce rollout.
    // eslint-disable-next-line no-unused-vars
    const [downloadSnapshot, downloadingSnapshot] = useSubmitOnce(async () => {
        if (!snapRef.current) return;
        try {
            toast.loading("Generating your snapshot…", { id: "snap" });
            const { default: html2canvas } = await import("html2canvas");
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
            trackEvent("proposal_generate", TABS.find(x => x.id === tab)?.label || tab);
        } catch (e) {
            console.error(e);
            toast.error("Could not generate snapshot. Try again.", { id: "snap" });
        }
    });

    // 🆕 Employee-mode: generate proposal image, then show a Download/Share popup
    const [generateSnapshot, generatingProposal] = useSubmitOnce(async () => {
    try {
        toast.loading("Generating your proposal…", { id: "snap" });
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
            import("html2canvas"),
            import("jspdf"),
        ]);
        // Ensure QR data URL is ready before capturing pages
        let waitAttempts = 0;
        while (!qrDataUrlRef.current && waitAttempts < 30) {
            await new Promise((r) => setTimeout(r, 150));
            waitAttempts++;
        }
        // Give React a moment to flush the re-render with the new QR image
        // into the actual DOM before html2canvas captures the pages.
        await new Promise((r) => setTimeout(r, 250));

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const refs = [page1Ref, page2Ref].filter((r) => r.current);
        let firstDataUrl = null;

        for (let i = 0; i < refs.length; i++) {
    const pageEl = refs[i].current;
    await waitForImagesToLoad(pageEl);
    const canvas = await html2canvas(pageEl, { backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    if (i === 0) firstDataUrl = dataUrl;
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, 0, pageWidth, pageHeight);

    // Pixel-perfect clickable overlays: read actual DOM position of QR + website link,
    // convert px -> mm using this page's real rendered width, then place jsPDF link there.
    const pageRect = pageEl.getBoundingClientRect();
    const mmPerPx = pageWidth / pageRect.width;

    const qrEl = pageEl.querySelector('[data-pdf-link="qr"]');
    if (qrEl) {
        const r = qrEl.getBoundingClientRect();
        pdf.link(
            (r.left - pageRect.left) * mmPerPx,
            (r.top - pageRect.top) * mmPerPx,
            r.width * mmPerPx,
            r.height * mmPerPx,
            { url: TFD_BRAND_URL }
        );
    }

    const siteEl = pageEl.querySelector('[data-pdf-link="website"]');
    if (siteEl) {
        const r = siteEl.getBoundingClientRect();
        pdf.link(
            (r.left - pageRect.left) * mmPerPx,
            (r.top - pageRect.top) * mmPerPx,
            r.width * mmPerPx,
            r.height * mmPerPx,
            { url: TFD_WEBSITE_URL }
        );
    }

    // Click-to-call / click-to-WhatsApp — dials/messages whichever employee
    // ("Prepared By") actually generated this proposal, not a generic
    // company number, so the client reaches the right person in one tap.
    const preparedByPhone = normalizePhoneForLink(employeeInfo?.phone);
    if (preparedByPhone) {
        const callEl = pageEl.querySelector('[data-pdf-link="call"]');
        if (callEl) {
            const r = callEl.getBoundingClientRect();
            pdf.link(
                (r.left - pageRect.left) * mmPerPx,
                (r.top - pageRect.top) * mmPerPx,
                r.width * mmPerPx,
                r.height * mmPerPx,
                { url: `tel:+${preparedByPhone}` }
            );
        }
        const waEl = pageEl.querySelector('[data-pdf-link="whatsapp"]');
        if (waEl) {
            const r = waEl.getBoundingClientRect();
            // Names the specific proposal (calculator + figures) so whoever
            // gets this WhatsApp immediately knows what the client means —
            // not just a generic "I have a question" with no context.
            const calcLine = calcSummaryLine(tab);
            const waText = encodeURIComponent(
                proposalLang === "hindi" ? `नमस्ते! मैंने "${calcLine}" प्रपोजल बनाया था The Financial Doctor से — इसके बारे में मुझे थोड़ी और जानकारी चाहिए।`
                : proposalLang === "hinglish" ? `Namaste! Maine "${calcLine}" proposal banaya tha The Financial Doctor se — iske baare mein mujhe thodi aur jaankari chahiye.`
                : `Hi! I made a "${calcLine}" proposal with The Financial Doctor — I'd like to know more about it.`
            );
            pdf.link(
                (r.left - pageRect.left) * mmPerPx,
                (r.top - pageRect.top) * mmPerPx,
                r.width * mmPerPx,
                r.height * mmPerPx,
                { url: `https://wa.me/${preparedByPhone}?text=${waText}` }
            );
        }
    }
}

        const pdfBlob = pdf.output("blob");
        setGeneratedImage({ dataUrl: firstDataUrl, blob: pdfBlob, isPdf: true });
        setShowSharePopup(true);
        toast.success("Proposal ready!", { id: "snap" });
        trackEvent("proposal_generate", TABS.find(x => x.id === tab)?.label || tab);
    } catch (e) {
        console.error(e);
        toast.error("Could not generate proposal. Try again.", { id: "snap" });
    }
});

    const handleDownloadClick = () => {
    const hasSavedLead = variant !== "employee" && clientInfo.name && clientInfo.phone;
    if (hasSavedLead) {
        setShowReturningModal(true);
    } else {
        setShowClientModal(true);
    }
};

    const [handleDownloadImage, downloadingImage] = useSubmitOnce(async () => {
        if (!generatedImage) return;
        const safeName = (clientInfo.name || tab).replace(/[^a-zA-Z0-9]+/g, "-");
        const ext = generatedImage.isPdf ? "pdf" : "png";
        const mime = generatedImage.isPdf ? "application/pdf" : "image/png";
        const link = document.createElement("a");
        link.download = `TFD-Proposal-${safeName}.${ext}`;
        link.href = generatedImage.isPdf ? URL.createObjectURL(new Blob([generatedImage.blob], { type: mime })) : generatedImage.dataUrl;
        link.click();
    });

    const [handleShareImage, sharingImage] = useSubmitOnce(async () => {
        if (!generatedImage) return;
        try {
            const isPdf = !!generatedImage.isPdf;
            const fileName = isPdf ? "TFD-Proposal.pdf" : "TFD-Proposal.png";
            const mime = isPdf ? "application/pdf" : "image/png";
            if (navigator.share) {
                const file = new File([generatedImage.blob], fileName, { type: mime });
                const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
                if (canShareFiles) {
                    await navigator.share({ files: [file], text: shareMessage, title: "Financial Proposal" });
                    return;
                }
                await navigator.share({ text: shareMessage, title: "Financial Proposal" });
                await handleDownloadImage();
                return;
            }
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareMessage);
                toast.info("Message copied — file downloading, paste the message while sharing.");
            }
            await handleDownloadImage();
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <CalcVariantContext.Provider value={variant}>
        <section id="calc" className={variant === "employee" ? "py-2 md:py-4 bg-[#F6F1E8]/20" : "py-12 md:py-20 bg-[#F6F1E8]/20"}>
            <div className="container-x px-4 md:px-6">
                {variant !== "employee" && (
                <div className="flex items-end justify-between flex-wrap gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="eyebrow text-xs md:text-sm">Plan · Visualise · Act</div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#0E1B2C] mt-2">
                            Money math, <span className="font-italic-serif text-[#024396]">made visual.</span>
                        </h2>
                        <p className="mt-3 text-xs md:text-sm text-[#2A364B] max-w-2xl">
                            See exactly how your wealth compounds. Try SIP, Daily SIP, Lumpsum, SWP, Goal,
                            EMI, Income Tax, GST & Future Goal scenarios — then download a personalised
                            snapshot to share or onboard via AssetPlus.
                        </p>
                    </div>
                    <div className="hidden md:inline-flex items-center gap-2 text-xs text-[#5C677D] bg-[#FBF7EE] border border-[#E2D8C2] rounded-full px-3 py-2">
                        <Sparkles size={14} className="text-[#C7102E]" />
                        Daily SIP uses <strong className="text-[#0E1B2C] mx-1">22 working days</strong> / month
                    </div>
                </div>
                )}

                {/* Tabs — a clean single-row scroll for the employee portal (avoids
                    the 9-tab grid awkwardly wrapping a label onto two lines);
                    the public site keeps its original responsive grid. */}
                <div className="mb-6">
                    {variant === "employee" ? (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    data-testid={t.testid}
                                    onClick={() => setTab(t.id)}
                                    className={`tab-pill shrink-0 whitespace-nowrap text-center justify-center text-xs py-2 ${tab === t.id ? "active" : ""}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
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
                    )}
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
                                <div>
                                    <label className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] text-[#5C677D] block mb-2">
                                        Interest Type
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLoanMode("reducing")}
                                            className={`flex-1 text-xs sm:text-sm py-2 rounded-lg border transition-colors ${loanMode === "reducing" ? "bg-[#024396] text-white border-[#024396]" : "bg-white text-[#0E1B2C] border-[#E2D8C2]"}`}
                                        >
                                            Reducing Balance
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLoanMode("fixed")}
                                            className={`flex-1 text-xs sm:text-sm py-2 rounded-lg border transition-colors ${loanMode === "fixed" ? "bg-[#024396] text-white border-[#024396]" : "bg-white text-[#0E1B2C] border-[#E2D8C2]"}`}
                                        >
                                            Fixed Interest
                                        </button>
                                    </div>
                                </div>
                                <Slider label="Loan Amount" value={loan} onChange={setLoan} min={100000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Tenure" value={loanYears} onChange={setLoanYears} min={1} max={30} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Interest (p.a.)" value={loanRate} onChange={setLoanRate} min={5} max={20} step={0.1} format={(v) => `${v}%`} />
                            </div>
                        )}
                        {tab === "tax" && (
                            <div className="space-y-6">
                                <Slider label="Annual Income" value={taxIncome} onChange={setTaxIncome} min={300000} max={10000000} step={50000} format={fmtINR} />
                                <Slider label="80C Investments (Old Regime only)" value={taxDeductions} onChange={setTaxDeductions} min={0} max={150000} step={5000} format={fmtINR} />
                                <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                    Income Tax · Income Tax — Old vs New regime ka comparison. Estimates simplified hain, exact filing ke liye CA se consult karein.
                                </div>
                            </div>
                        )}
                        {tab === "gst" && (
                            <div className="space-y-6">
                                <Slider label="Amount" value={gstAmount} onChange={setGstAmount} min={100} max={10000000} step={100} format={fmtINR} />
                                <div>
                                    <label className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] text-[#5C677D] block mb-2">GST Rate</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[5, 12, 18, 28].map((r) => (
                                            <button key={r} onClick={() => setGstRate(r)}
                                                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${gstRate === r ? "bg-[#024396] text-white border-[#024396]" : "bg-white border-[#E2D8C2] text-[#2A364B]"}`}>
                                                {r}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] text-[#5C677D] block mb-2">Amount Type</label>
                                    <select value={gstType} onChange={(e) => setGstType(e.target.value)} className="w-full border border-[#E2D8C2] rounded-lg px-3 py-2 bg-white">
                                        <option value="exclusive">Exclusive (GST to be added)</option>
                                        <option value="inclusive">Inclusive (GST already included)</option>
                                    </select>
                                </div>
                                <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                    GST · GST Calculator — kisi bhi amount ka quick breakup nikalein.
                                </div>
                            </div>
                        )}
                        {tab === "inflation" && (
                            <div className="space-y-6">
                                <Slider label="Current Cost of Goal" value={inflCost} onChange={setInflCost} min={50000} max={50000000} step={50000} format={fmtINR} />
                                <Slider label="Years Until Goal" value={inflYears} onChange={setInflYears} min={1} max={40} step={1} format={(v) => `${v} Yr`} />
                                <Slider label="Expected Inflation (p.a.)" value={inflRate} onChange={setInflRate} min={3} max={15} step={0.5} format={(v) => `${v}%`} />
                                <Slider label="Expected Investment Return (p.a.)" value={inflReturn} onChange={setInflReturn} min={1} max={30} step={0.5} format={(v) => `${v}%`} />
                                <div className="text-xs text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-lg p-3 leading-relaxed">
                                    Future Goal · Inflation-adjusted future cost aur required monthly SIP dekhein.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chart + Result Column */}
                    <div className={`lg:col-span-8 grid self-start content-start ${variant === "employee" ? "" : "grid-rows-[1fr_auto]"} gap-4 md:gap-6`}>
                        {/* 🛠️ GRAPH WRAPPER: only for tabs with a growth series; hidden on mobile too; hidden entirely for employee portal (simple calculator mode) */}
                        {variant !== "employee" && CHART_TABS.includes(tab) && (
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
                        )}

                        {/* Non-chart comparison panels for Tax / GST / Future Goal */}
                        {variant !== "employee" && tab === "tax" && result && (
                            <div className="hidden md:block card-cream p-4 sm:p-5 md:p-6">
                                <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D] mb-4">Old vs New Regime</div>
                                <div className="grid grid-cols-2 gap-6">
                                    {[{ label: "Old Regime", value: result.oldTax }, { label: "New Regime", value: result.newTax }].map((b) => {
                                        const maxVal = Math.max(result.oldTax, result.newTax, 1);
                                        const heightPct = Math.max(6, (b.value / maxVal) * 100);
                                        return (
                                            <div key={b.label} className="flex flex-col items-center justify-end h-[220px]">
                                                <div className="font-display text-[#0E1B2C] mb-2">{fmtINR(b.value)}</div>
                                                <div className="w-20 rounded-t-xl bg-[#024396]" style={{ height: `${heightPct}%` }} />
                                                <div className="text-xs text-[#5C677D] mt-2 uppercase tracking-wide">{b.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-[#5C677D] mt-4 text-center">Better choice for you: <strong className="text-[#024396]">{result.better}</strong></div>
                            </div>
                        )}
                        {variant !== "employee" && tab === "gst" && result && (
                            <div className="hidden md:block card-cream p-4 sm:p-5 md:p-6">
                                <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D] mb-4">GST Breakup</div>
                                <div className="space-y-3">
                                    {[{ label: "Base Amount", value: result.base, color: "#5C677D" }, { label: "CGST", value: result.half, color: "#024396" }, { label: "SGST", value: result.half, color: "#024396" }, { label: "Total Amount", value: result.total, color: "#0E1B2C" }].map((row) => (
                                        <div key={row.label} className="flex items-center justify-between border-b border-[#E2D8C2] pb-2">
                                            <span className="text-sm text-[#2A364B]">{row.label}</span>
                                            <span className="font-display" style={{ color: row.color }}>{fmtINR(row.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {variant !== "employee" && tab === "inflation" && result && (
                            <div className="hidden md:block card-cream p-4 sm:p-5 md:p-6">
                                <div className="text-[11px] tracking-[0.2em] uppercase text-[#5C677D] mb-4">Today vs Future Cost</div>
                                <div className="grid grid-cols-2 gap-6">
                                    {[{ label: "Today", value: result.currentCost }, { label: `In ${inflYears} Yrs`, value: result.futureCost }].map((b) => {
                                        const maxVal = Math.max(result.currentCost, result.futureCost, 1);
                                        const heightPct = Math.max(6, (b.value / maxVal) * 100);
                                        return (
                                            <div key={b.label} className="flex flex-col items-center justify-end h-[220px]">
                                                <div className="font-display text-[#0E1B2C] mb-2">{fmtINR(b.value)}</div>
                                                <div className="w-20 rounded-t-xl bg-[#C7102E]" style={{ height: `${heightPct}%` }} />
                                                <div className="text-xs text-[#5C677D] mt-2 uppercase tracking-wide">{b.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <ResultCard
                            data-testid={IDS.calc.result}
                            tab={tab}
                            result={result}
                            onDownload={handleDownloadClick}
                            onStart={openGateway}
                            variant={variant}
                        />
                    </div>
                </div>

                {/* Hidden snapshot/proposal card for export (PNG for public site, A4 PDF for employee portal) */}
                <div ref={qrCanvasWrapRef} style={{ position: "fixed", left: -10000, top: 0 }} aria-hidden>
    <QRCodeCanvas value={TFD_BRAND_URL} size={300} bgColor="#FFFFFF" fgColor="#0E1B2C" level="M" includeMargin={false} />
</div>
                <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
    <div data-testid={IDS.calc.snapshot}>
        <ProposalDocument
    page1Ref={page1Ref}
    page2Ref={page2Ref}
    qrDataUrl={qrDataUrl}
    tab={tab}
            result={result}
            employeeInfo={variant === "employee" ? employeeInfo : TFD_TEAM_INFO}
            clientInfo={clientInfo}
            lang={proposalLang}
            state={{
                sipAmount, sipDailyAddon, sipStepUp, sipYears, sipRate,
                dailyAmount, dailyYears, dailyRate,
                lump, lumpYears, lumpRate,
                swpCorpus, swpMonthly, swpYears, swpRate,
                goal, goalYears, goalRate,
                loan, loanYears, loanRate, loanMode,
                taxIncome, taxDeductions,
                gstAmount, gstRate, gstType,
                inflCost, inflYears, inflRate, inflReturn,
                result,
            }}
        />
    </div>
</div>
                {/* Client details modal (name + phone only, no coupon) */}
                {showClientModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowClientModal(false)}>
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-serif text-lg text-[#0E1B2C]">
    {variant === "employee" ? "Client Details" : "Your Personalised Proposal is Ready 🎯"}
</h3>
{variant !== "employee" && (
    <p className="text-xs text-[#5C677D] leading-relaxed">
        Get a detailed report with growth projections, smart charts and money-saving tips — made just for you.
        <br />
        <span className="italic">Apna naam aur number daalein, taaki proposal khaas aapke liye ban sake.</span>
    </p>
)}
                            <div>
                                <label className="text-xs text-[#5C677D] block mb-1">{variant === "employee" ? "Client Name" : "Your Name · Aapka Naam"}</label>
<input
    autoFocus
    value={clientInfo.name}
    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
    placeholder="Enter your name"
    className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
/>
                            </div>
                            <div>
    <label className="text-xs text-[#5C677D] block mb-1">{variant === "employee" ? "Client Phone (optional)" : "Contact Number · Contact No."}</label>
    <input
        value={clientInfo.phone}
        onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
        placeholder="Enter your mobile number"
        className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#024396]"
    />
</div>
                            <div>
                                <label className="text-xs text-[#5C677D] block mb-1">Proposal Language</label>
                                <div className="flex gap-2">
                                    {[["english", "English"], ["hindi", "हिंदी"], ["hinglish", "Hinglish"]].map(([val, lbl]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setProposalLang(val)}
                                            className={`flex-1 text-xs py-2 rounded-lg border ${proposalLang === val ? "bg-[#024396] text-white border-[#024396]" : "bg-white border-[#E2D8C2] text-[#0E1B2C]"}`}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {phoneError && <p className="text-[11px] text-[#C7102E]">{phoneError}</p>}
                            <div className="flex gap-2">
                                {variant === "employee" && (
                                    <button
                                        onClick={() => { setShowClientModal(false); setClientInfo({ name: "", phone: "" }); generateSnapshot(); }}
                                        disabled={generatingProposal}
                                        className="flex-1 py-2.5 rounded-xl bg-[#F6F1E8] text-[#0E1B2C] text-xs font-semibold disabled:opacity-60"
                                    >
                                        {generatingProposal ? "Generating…" : "Skip"}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const rawPhone = clientInfo.phone.replace(/\D/g, "");
                                        const isPublic = variant !== "employee";
                                        if (isPublic) {
                                            if (!clientInfo.name.trim()) { setPhoneError("Apna naam bata dijiye."); return; }
                                            if (!/^[6-9]\d{9}$/.test(rawPhone.slice(-10)) || rawPhone.length < 10) {
                                                setPhoneError("Sahi 10 digit ka mobile number daalein (jaise 9876543210).");
                                                return;
                                            }
                                        } else if (clientInfo.phone.trim() && (!/^[6-9]\d{9}$/.test(rawPhone.slice(-10)) || rawPhone.length < 10)) {
                                            setPhoneError("Sahi 10 digit ka mobile number daalein (jaise 9876543210).");
                                            return;
                                        }
                                        setPhoneError("");
                                        if (variant !== "employee") {
                                            try { localStorage.setItem("tfd_lead_info", JSON.stringify(clientInfo)); } catch { /* ignore */ }
                                            trackProposalWithBackend({ name: clientInfo.name, phone: clientInfo.phone });
                                        }
                                        setShowClientModal(false);
                                        generateSnapshot();
                                    }}
                                    disabled={generatingProposal}
                                    className="flex-1 py-2.5 rounded-xl bg-[#024396] text-white text-sm font-semibold disabled:opacity-60"
                                >
                                    {generatingProposal ? "Generating…" : "Generate Proposal"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showReturningModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReturningModal(false)}>
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-serif text-lg text-[#0E1B2C]">Welcome Back, {clientInfo.name}!</h3>
                            <div className="text-xs text-[#5C677D] leading-relaxed space-y-2">
                                <p>
                                    Your details are already saved — no need to fill them again.
                                </p>
                                <p className="italic">
                                    Aapki details already saved hain — dobara bharne ki zaroorat nahi.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-[#5C677D] block mb-1">Proposal Language</label>
                                <div className="flex gap-2">
                                    {[["english", "English"], ["hindi", "हिंदी"], ["hinglish", "Hinglish"]].map(([val, lbl]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setProposalLang(val)}
                                            className={`flex-1 text-xs py-2 rounded-lg border ${proposalLang === val ? "bg-[#024396] text-white border-[#024396]" : "bg-white border-[#E2D8C2] text-[#0E1B2C]"}`}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowReturningModal(false); setShowClientModal(true); }}
                                    className="flex-1 py-2.5 rounded-xl bg-[#F6F1E8] text-[#0E1B2C] text-xs font-semibold"
                                >
                                    Edit Details
                                </button>
                                <button
                                    onClick={() => {
    trackProposalWithBackend({ name: clientInfo.name, phone: clientInfo.phone });
    setShowReturningModal(false);
    generateSnapshot();
}}
                                    disabled={generatingProposal}
                                    className="flex-1 py-2.5 rounded-xl bg-[#024396] text-white text-sm font-semibold disabled:opacity-60"
                                >
                                    {generatingProposal ? "Generating…" : "Generate Proposal"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🆕 Employee-mode: Download / Share popup with English & Hinglish message templates */}
                {showSharePopup && generatedImage && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSharePopup(false)}>
                        <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-serif text-lg text-[#0E1B2C]">Proposal Ready!</h3>
                            <p className="text-[10px] text-[#5C677D] -mt-2">Preview below — actual file downloads/shares as an A4 PDF.</p>
                            <div className="relative">
                                <img
                                    src={generatedImage.dataUrl}
                                    alt="Proposal preview"
                                    className="w-full rounded-xl border border-[#E2D8C2]"
                                />
                            </div>

                            {variant === "employee" && (
                                <>
                                    <div>
                                        <label className="text-xs text-[#5C677D] block mb-1">Message Template</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setMsgTemplate("english")}
                                                className={`flex-1 text-xs py-2 rounded-lg border ${msgTemplate === "english" ? "bg-[#024396] text-white border-[#024396]" : "bg-white border-[#E2D8C2] text-[#0E1B2C]"}`}
                                            >
                                                English
                                            </button>
                                            <button
                                                onClick={() => setMsgTemplate("hinglish")}
                                                className={`flex-1 text-xs py-2 rounded-lg border ${msgTemplate === "hinglish" ? "bg-[#024396] text-white border-[#024396]" : "bg-white border-[#E2D8C2] text-[#0E1B2C]"}`}
                                            >
                                                Hinglish
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-[#5C677D] mt-1">Apna custom template banane ka option jald aa raha hai</p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-[#5C677D] block mb-1">Message (edit karke bhi bhej sakte hain)</label>
                                        <textarea
                                            value={shareMessage}
                                            onChange={(e) => setShareMessage(e.target.value)}
                                            rows={6}
                                            className="w-full border border-[#E2D8C2] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#024396]"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3">
                                <button onClick={handleDownloadImage} disabled={downloadingImage} className="flex-1 py-2.5 rounded-xl bg-[#0E1B2C] text-white text-sm font-semibold disabled:opacity-60">{downloadingImage ? "Downloading…" : "⬇️ Download"}</button>
                                <button onClick={handleShareImage} disabled={sharingImage} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60">{sharingImage ? "Sharing…" : "📤 Share"}</button>
                            </div>
                            <button onClick={() => setShowSharePopup(false)} className="w-full text-xs text-[#5C677D] text-center pt-1">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
        </CalcVariantContext.Provider>
    );
}

function ResultCard({ tab, result, onDownload, onStart, variant }) {
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
                    ) : tab === "tax" ? (
                        <>
                            <Metric label="Old Regime Tax" value={fmtINR(result.oldTax)} />
                            <Metric label="New Regime Tax" value={fmtINR(result.newTax)} />
                            <Metric label="Better Choice" value={result.better} primary />
                        </>
                    ) : tab === "gst" ? (
                        <>
                            <Metric label="Base Amount" value={fmtINR(result.base)} />
                            <Metric label="GST Amount" value={fmtINR(result.gst)} />
                            <Metric label="Total Amount" value={fmtINR(result.total)} primary />
                        </>
                    ) : tab === "inflation" ? (
                        <>
                            <Metric label="Today's Cost" value={fmtINR(result.currentCost)} />
                            <Metric label="Future Cost" value={fmtINR(result.futureCost)} />
                            <Metric label="Monthly SIP Needed" value={fmtINR(result.requiredSip)} primary />
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
                        <Download size={15} /> {variant === "employee" ? "Generate Proposal" : (<><span className="hidden sm:inline">Download</span> Proposal</>)}
                    </button>
                    {/* "Start Investing" gateway CTA is for public visitors only — an
                        employee building a client proposal isn't the one investing. */}
                    {variant !== "employee" && (
                        <button onClick={onStart} className="btn-pill flex-1 md:flex-none justify-center py-2.5 text-xs font-bold bg-[#F6F1E8] text-[#0E1B2C] shadow-sm cursor-pointer" data-testid={IDS.calc.startPlan}>
                            Start <ArrowUpRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* 💡 Interest-Free Loan via SIP suggestion — EMI tab only */}
            {tab === "emi" && result.interestFreeSip > 0 && (
                <div className="mt-5 pt-5 border-t border-[#F6F1E8]/15">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#C7102E] font-bold mb-1.5">
                        💡 Make This Loan Interest-Free · Is Loan Ko Interest-Free Banayein
                    </div>
                    <p className="text-xs sm:text-sm text-[#F6F1E8]/85 leading-relaxed">
                        Start a monthly SIP of <strong className="text-[#F6F1E8]">{fmtINR(result.interestFreeSip)}</strong> alongside
                        this loan (assuming 12% p.a. return). By the time your loan ends, it could grow to roughly
                        offset your total interest cost — effectively making this loan interest-free.
                        <br className="hidden sm:block" />
                        <span className="text-[#F6F1E8]/60 text-[11px]">Estimate only — actual market returns are not guaranteed.</span>
                    </p>
                </div>
            )}
            {/* 💡 ELSS suggestion — Income Tax tab only */}
            {tab === "tax" && result.elssSaving > 0 && (
                <div className="mt-5 pt-5 border-t border-[#F6F1E8]/15">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#C7102E] font-bold mb-1.5">
                        💡 Save More with ELSS · ELSS Se Aur Bachat Karein
                    </div>
                    <p className="text-xs sm:text-sm text-[#F6F1E8]/85 leading-relaxed">
                        If you haven't used your full ₹1,50,000 limit under Section 80C, investing the remaining
                        amount in an ELSS mutual fund (Old Regime) could save you up to{" "}
                        <strong className="text-[#F6F1E8]">{fmtINR(result.elssSaving)}</strong> in tax — while
                        your money also grows with equity exposure.
                    </p>
                </div>
            )}
        </div>
    );
}

function Metric({ label, value, primary }) {
    return (
        <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.18em] opacity-60 font-semibold leading-tight">
                {label}
            </div>
            <div className={`font-display mt-1 tracking-tight break-words font-bold ${primary ? "text-base sm:text-xl md:text-2xl text-[#F6F1E8]" : "text-xs sm:text-base md:text-lg text-[#F6F1E8]/85"}`}>
                {value}
            </div>
        </div>
    );
}
function InsuranceBanner({ lang }) {
    const msg = {
        english: "Before you invest, protect what matters. Term Insurance secures your family's future, and Health Insurance shields your hard-earned savings from medical emergencies. Connect with The Financial Doctor (TFD) Team today to find the right cover for your goals.",
        hindi: "निवेश शुरू करने से पहले अपनी सुरक्षा पक्की करें। टर्म इंश्योरेंस आपके परिवार के आने वाले कल को सुरक्षित रखता है, और हेल्थ इंश्योरेंस अचानक आई बीमारी के खर्चों से आपकी मेहनत की कमाई को बचाता है। अपने लिए सही इंश्योरेंस प्लान चुनने के लिए आज ही The Financial Doctor (TFD) टीम से बात करें।",
        hinglish: "Invest karne se pehle protection zaroor lein! Term Insurance aapke parivaar ke future ko secure karta hai, aur Health Insurance kisi bhi medical emergency mein aapki savings ko doobne se bachata hai. Sahi cover aur right planning ke liye aaj hi The Financial Doctor (TFD) Team se consult karein.",
    };
    return (
        <div style={{ background: "#FBE4E4", border: "1px solid #C7102E", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 15 }}>🛡️</span>
            <div style={{ fontSize: 10, color: "#7A1420", lineHeight: 1.5 }}>
                <strong>Health &amp; Term Insurance First · </strong>{msg[lang] || msg.english}
            </div>
        </div>
    );
}
// Per-tab methodology explainer, in all three proposal languages.
const CALC_METHODOLOGY = {
  sip: {
    hinglish: {
      highlights: [
        "Compounding ka fayda — returns par bhi returns milte hain",
        "Rupee-cost averaging se market ke ups-downs smooth ho jaate hain",
        "Chhoti monthly amount lambe samay mein bada corpus bana deti hai",
      ],
      how: "Har mahine fixed amount invest hota hai, jo expected annual return par compound hota hai. Formula: FV = P × [(1+r)^n − 1] / r × (1+r). Step-up diya ho to har 12 mahine baad SIP amount us % se badh jaati hai. Daily SIP ka calculation 22 working days/month par based hai — Saturday, Sunday aur market holidays par debit nahi hota, isliye 22 din se multiply kiya jaata hai.",
    },
    english: {
      highlights: [
        "The power of compounding — you earn returns on your returns",
        "Rupee-cost averaging smooths out market ups and downs",
        "A small monthly amount builds a large corpus over time",
      ],
      how: "A fixed amount is invested every month, which compounds at the expected annual return. Formula: FV = P × [(1+r)^n − 1] / r × (1+r). If a step-up is set, the SIP amount increases by that % every 12 months. Daily SIP is calculated on 22 working days/month — no debit happens on Saturdays, Sundays and market holidays, so the daily amount is multiplied by 22.",
    },
    hindi: {
      highlights: [
        "चक्रवृद्धि (कंपाउंडिंग) का फायदा — रिटर्न पर भी रिटर्न मिलता है",
        "रुपी-कॉस्ट एवरेजिंग से मार्केट के उतार-चढ़ाव संतुलित हो जाते हैं",
        "छोटी मासिक राशि लंबे समय में बड़ा कोष बना देती है",
      ],
      how: "हर महीने एक निश्चित राशि निवेश होती है, जो अपेक्षित वार्षिक रिटर्न पर चक्रवृद्धि होती है। फॉर्मूला: FV = P × [(1+r)^n − 1] / r × (1+r)। स्टेप-अप सेट होने पर हर 12 महीने बाद SIP राशि उस % से बढ़ जाती है। डेली SIP की गणना 22 कार्य दिवस/माह पर आधारित है — शनिवार, रविवार और बाजार अवकाश पर डेबिट नहीं होता, इसलिए 22 दिनों से गुणा किया जाता है।",
    },
  },
  daily: {
    hinglish: {
      highlights: [
        "Daily habit se investing zindagi ka hissa ban jaata hai",
        "22 working days/month ka calculation use hota hai",
        "Chhoti daily amount bhi lambe samay mein badi ban jaati hai",
      ],
      how: "Daily amount ko monthly SIP mein convert kiya jaata hai (daily × 22), phir SIP wala hi formula lagta hai.",
    },
    english: {
      highlights: [
        "A daily habit makes investing part of everyday life",
        "Calculated on 22 working days per month",
        "Even a small daily amount grows large over time",
      ],
      how: "The daily amount is converted into a monthly SIP (daily × 22), then the same SIP formula is applied.",
    },
    hindi: {
      highlights: [
        "रोज़ की आदत से निवेश करना जीवन का हिस्सा बन जाता है",
        "गणना 22 कार्य दिवस प्रति माह पर आधारित है",
        "छोटी दैनिक राशि भी लंबे समय में बड़ी बन जाती है",
      ],
      how: "दैनिक राशि को मासिक SIP में बदला जाता है (दैनिक × 22), फिर वही SIP फॉर्मूला लागू होता है।",
    },
  },
  lumpsum: {
    hinglish: {
      highlights: [
        "Ek baar ka bada investment compounding ka poora fayda leta hai",
        "Jitna lamba tenure, utna zyada exponential growth",
        "Market timing chhodkar time-in-market par focus karein",
      ],
      how: "Compound interest formula: FV = P × (1+r)^n, jaha P = invested amount, r = annual return, n = years.",
    },
    english: {
      highlights: [
        "A one-time large investment gets the full benefit of compounding",
        "The longer the tenure, the greater the exponential growth",
        "Focus on time-in-market rather than market timing",
      ],
      how: "Compound interest formula: FV = P × (1+r)^n, where P = invested amount, r = annual return, n = years.",
    },
    hindi: {
      highlights: [
        "एक बार का बड़ा निवेश चक्रवृद्धि का पूरा फायदा लेता है",
        "जितनी लंबी अवधि, उतनी अधिक तीव्र वृद्धि",
        "मार्केट टाइमिंग छोड़कर टाइम-इन-मार्केट पर ध्यान दें",
      ],
      how: "चक्रवृद्धि ब्याज फॉर्मूला: FV = P × (1+r)^n, जहाँ P = निवेशित राशि, r = वार्षिक रिटर्न, n = वर्ष।",
    },
  },
  swp: {
    hinglish: {
      highlights: [
        "Retirement/regular income ke liye corpus se fixed withdrawal",
        "Balance invested rehta hai, tab tak grow bhi karta hai",
        "Withdrawal rate corpus ki life decide karta hai",
      ],
      how: "Har mahine corpus par return credit hota hai, phir fixed withdrawal minus hota hai — ye process tenure khatam hone tak ya balance zero hone tak chalta hai.",
    },
    english: {
      highlights: [
        "Fixed withdrawal from your corpus for retirement/regular income",
        "The remaining balance stays invested and keeps growing",
        "The withdrawal rate decides how long the corpus lasts",
      ],
      how: "Every month, return is credited on the corpus, then the fixed withdrawal is deducted — this continues until the tenure ends or the balance reaches zero.",
    },
    hindi: {
      highlights: [
        "रिटायरमेंट/नियमित आय के लिए कोष से निश्चित निकासी",
        "शेष राशि निवेशित रहती है और तब तक बढ़ती भी है",
        "निकासी दर तय करती है कि कोष कितने समय तक चलेगा",
      ],
      how: "हर महीने कोष पर रिटर्न जमा होता है, फिर निश्चित निकासी घटाई जाती है — यह प्रक्रिया अवधि समाप्त होने तक या शेष राशि शून्य होने तक चलती है।",
    },
  },
  goal: {
    hinglish: {
      highlights: [
        "Target corpus ke liye exact zaroori monthly SIP jaanein",
        "Jitna early start, utna kam monthly SIP chahiye",
        "Goal-based investing se planning clear hoti hai",
      ],
      how: "Target corpus ko future value annuity factor se divide karke zaroori monthly SIP nikala jaata hai.",
    },
    english: {
      highlights: [
        "Know the exact monthly SIP required for your target corpus",
        "The earlier you start, the smaller the monthly SIP required",
        "Goal-based investing makes your planning clear",
      ],
      how: "The target corpus is divided by the future-value annuity factor to arrive at the required monthly SIP.",
    },
    hindi: {
      highlights: [
        "लक्ष्य कोष के लिए आवश्यक सटीक मासिक SIP जानें",
        "जितनी जल्दी शुरुआत, उतनी कम मासिक SIP चाहिए",
        "लक्ष्य-आधारित निवेश से योजना स्पष्ट होती है",
      ],
      how: "लक्ष्य कोष को फ्यूचर वैल्यू एन्युटी फैक्टर से विभाजित करके आवश्यक मासिक SIP निकाली जाती है।",
    },
  },
  emi: {
    hinglish: {
      highlights: [
        "Reducing balance mein interest sirf outstanding principal par lagta hai",
        "Jaldi prepay karne se total interest kaafi kam ho sakta hai",
        "EMI jitna hi parallel SIP loan ko 'interest-free' bana sakta hai",
      ],
      how: "Reducing balance EMI: EMI = P × r × (1+r)^n / [(1+r)^n − 1]. Fixed mode mein interest poore tenure ke original principal par flat lagta hai.",
      interestFreeExplain: "Aapke loan ka jitna total interest hai (Total Interest), agar aap usi amount ki ek parallel Mutual Fund SIP shuru karein (12% p.a. assumed return), to loan tenure khatam hote-hote wo SIP itni badh chuki hogi ki wo aapke total interest cost ko roughly cover kar de — yaani loan effectively 'interest-free' ban jaata hai. Ye sirf ek estimate hai; actual mutual fund returns guaranteed nahi hote.",
    },
    english: {
      highlights: [
        "In reducing balance, interest is charged only on the outstanding principal",
        "Prepaying early can significantly cut your total interest",
        "A parallel SIP equal to your EMI can effectively make the loan 'interest-free'",
      ],
      how: "Reducing balance EMI: EMI = P × r × (1+r)^n / [(1+r)^n − 1]. In fixed mode, interest is charged flat on the original principal for the full tenure.",
      interestFreeExplain: "If you start a parallel Mutual Fund SIP of the same amount as your loan's Total Interest (assuming a 12% p.a. return), by the time the loan tenure ends that SIP will likely have grown enough to roughly cover your total interest cost — effectively making the loan 'interest-free'. This is only an estimate; actual mutual fund returns are not guaranteed.",
    },
    hindi: {
      highlights: [
        "रिड्यूसिंग बैलेंस में ब्याज केवल बकाया मूलधन पर लगता है",
        "जल्दी प्रीपे करने से कुल ब्याज काफी कम हो सकता है",
        "EMI जितनी ही समानांतर SIP लोन को 'ब्याज-मुक्त' बना सकती है",
      ],
      how: "रिड्यूसिंग बैलेंस EMI: EMI = P × r × (1+r)^n / [(1+r)^n − 1]। फिक्स्ड मोड में पूरी अवधि के मूल मूलधन पर फ्लैट ब्याज लगता है।",
      interestFreeExplain: "अगर आप अपने लोन के कुल ब्याज (Total Interest) जितनी ही एक समानांतर म्यूचुअल फंड SIP शुरू करें (12% वार्षिक अनुमानित रिटर्न), तो लोन अवधि समाप्त होने तक वह SIP इतनी बढ़ चुकी होगी कि वह आपकी कुल ब्याज लागत को लगभग कवर कर दे — यानी लोन प्रभावी रूप से 'ब्याज-मुक्त' बन जाता है। यह केवल एक अनुमान है; वास्तविक म्यूचुअल फंड रिटर्न की गारंटी नहीं होती।",
    },
  },
  tax: {
    hinglish: {
      highlights: [
        "Old aur New regime dono ka comparison ek saath dekhein",
        "80C investments sirf Old Regime mein tax benefit dete hain",
        "Regime choice har saal badal sakte hain",
      ],
      how: "Dono regimes ke slabs par income ko tax kiya jaata hai, standard deduction/80C minus karke, phir 4% cess add hota hai.",
    },
    english: {
      highlights: [
        "See a side-by-side comparison of the Old and New tax regimes",
        "80C investments only give a tax benefit under the Old Regime",
        "You can switch your regime choice every year",
      ],
      how: "Income is taxed as per both regimes' slabs after deducting standard deduction/80C, then 4% cess is added.",
    },
    hindi: {
      highlights: [
        "पुरानी और नई व्यवस्था दोनों की तुलना एक साथ देखें",
        "80C निवेश केवल पुरानी व्यवस्था में टैक्स लाभ देते हैं",
        "व्यवस्था का चुनाव हर साल बदला जा सकता है",
      ],
      how: "दोनों व्यवस्थाओं के स्लैब पर आय पर टैक्स लगाया जाता है, स्टैंडर्ड डिडक्शन/80C घटाकर, फिर 4% सेस जोड़ा जाता है।",
    },
  },
  gst: {
    hinglish: {
      highlights: [
        "Business billing mein sahi GST breakup zaroori hai",
        "CGST + SGST milkar total GST banate hain",
        "Inclusive vs Exclusive samajhna invoicing ke liye zaroori hai",
      ],
      how: "Exclusive amount par GST add hota hai. Inclusive amount se GST reverse-calculate hota hai: Base = Total × 100/(100+rate).",
    },
    english: {
      highlights: [
        "An accurate GST breakup is essential for business billing",
        "CGST + SGST together make up the total GST",
        "Understanding Inclusive vs Exclusive is essential for invoicing",
      ],
      how: "GST is added on top of the exclusive amount. For an inclusive amount, GST is reverse-calculated: Base = Total × 100/(100+rate).",
    },
    hindi: {
      highlights: [
        "बिजनेस बिलिंग में सही GST ब्रेकअप जरूरी है",
        "CGST + SGST मिलकर कुल GST बनाते हैं",
        "इनवॉइसिंग के लिए इनक्लूसिव बनाम एक्सक्लूसिव समझना जरूरी है",
      ],
      how: "एक्सक्लूसिव राशि पर GST जोड़ा जाता है। इनक्लूसिव राशि से GST रिवर्स-कैलकुलेट होता है: Base = Total × 100/(100+rate)।",
    },
  },
  inflation: {
    hinglish: {
      highlights: [
        "Aaj ka goal kal mehenga ho jaata hai — inflation ignore na karein",
        "Sahi planning se inflation-adjusted target achieve karna aasan hota hai",
        "Return inflation se zyada ho to hi real wealth banta hai",
      ],
      how: "Current cost inflation rate se future value mein convert hota hai: Future Cost = Current Cost × (1+inflation)^years, phir uske liye zaroori SIP nikalta hai.",
    },
    english: {
      highlights: [
        "Today's goal gets costlier tomorrow — don't ignore inflation",
        "The right planning makes an inflation-adjusted target achievable",
        "Real wealth is created only when returns beat inflation",
      ],
      how: "The current cost is converted to a future value using the inflation rate: Future Cost = Current Cost × (1+inflation)^years, and the required SIP is then calculated for that.",
    },
    hindi: {
      highlights: [
        "आज का लक्ष्य कल महंगा हो जाता है — महंगाई को नज़रअंदाज़ न करें",
        "सही योजना से महंगाई-समायोजित लक्ष्य हासिल करना आसान होता है",
        "असली संपत्ति तभी बनती है जब रिटर्न महंगाई से ज्यादा हो",
      ],
      how: "वर्तमान लागत को महंगाई दर से भविष्य मूल्य में बदला जाता है: Future Cost = Current Cost × (1+inflation)^years, फिर उसके लिए आवश्यक SIP निकाली जाती है।",
    },
  },
};
const MF_EDUCATION = {
    hinglish: {
        heading: "Mutual Fund Kaise Kaam Karta Hai?",
        points: [
            "Aap jab bhi SIP ya Lumpsum invest karte hain, aapka paisa ek Mutual Fund scheme mein jaata hai — jo AMC (Asset Management Company) manage karti hai, jaise HDFC, SBI, ICICI Prudential, etc.",
            "AMC ka fund manager aapke aur hazaaro dusre investors ka paisa milakar shares, bonds, ya dono mein invest karta hai — isse aapko diversification aur professional management milta hai.",
            "Aapka return fund ke underlying investments (shares/bonds) ki performance se aata hai — jab wo assets badhte hain, aapke fund ki NAV (Net Asset Value) badhti hai, aur wahi aapka gain hai.",
            "Aap directly kisi company ko paisa nahi dete — aap fund ke 'units' kharidte hain, aur AMC us paisa ko professionally invest karti hai on your behalf.",
            "SEBI (regulator) aur AMFI in sab funds ko regulate karte hain, taaki investor ka paisa surakshit rahe — lekin market risk phir bhi rehta hai, returns guaranteed nahi hote.",
        ],
    },
    english: {
        heading: "How Does a Mutual Fund Work?",
        points: [
            "Whenever you invest via SIP or Lumpsum, your money goes into a Mutual Fund scheme — managed by an AMC (Asset Management Company) such as HDFC, SBI, ICICI Prudential, etc.",
            "The AMC's fund manager pools your money with thousands of other investors and invests it in shares, bonds, or both — giving you diversification and professional management.",
            "Your return comes from the performance of the fund's underlying investments (shares/bonds) — when those assets rise, your fund's NAV (Net Asset Value) rises, and that is your gain.",
            "You don't give money directly to any company — you buy 'units' of the fund, and the AMC invests that money professionally on your behalf.",
            "SEBI (the regulator) and AMFI regulate all these funds to keep investor money safe — but market risk still remains, and returns are not guaranteed.",
        ],
    },
    hindi: {
        heading: "म्यूचुअल फंड कैसे काम करता है?",
        points: [
            "जब भी आप SIP या लम्पसम निवेश करते हैं, आपका पैसा एक म्यूचुअल फंड स्कीम में जाता है — जिसे AMC (एसेट मैनेजमेंट कंपनी) मैनेज करती है, जैसे HDFC, SBI, ICICI Prudential आदि।",
            "AMC का फंड मैनेजर आपके और हज़ारों अन्य निवेशकों के पैसे को मिलाकर शेयर, बॉन्ड, या दोनों में निवेश करता है — इससे आपको विविधीकरण और प्रोफेशनल मैनेजमेंट मिलता है।",
            "आपका रिटर्न फंड के अंतर्निहित निवेशों (शेयर/बॉन्ड) के प्रदर्शन से आता है — जब वे एसेट बढ़ते हैं, तो आपके फंड की NAV (नेट एसेट वैल्यू) बढ़ती है, और वही आपका लाभ है।",
            "आप सीधे किसी कंपनी को पैसा नहीं देते — आप फंड की 'यूनिट्स' खरीदते हैं, और AMC उस पैसे को आपकी ओर से प्रोफेशनल तरीके से निवेश करती है।",
            "SEBI (नियामक) और AMFI इन सभी फंड्स को नियंत्रित करते हैं, ताकि निवेशक का पैसा सुरक्षित रहे — लेकिन बाजार जोखिम फिर भी बना रहता है, रिटर्न की गारंटी नहीं होती।",
        ],
    },
};
async function waitForImagesToLoad(containerEl, timeoutMs = 3000) {
    if (!containerEl) return;
    const imgs = Array.from(containerEl.querySelectorAll("img"));
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const allLoaded = imgs.every((img) => img.complete && img.naturalWidth > 0);
        if (allLoaded) return;
        await new Promise((r) => setTimeout(r, 100));
    }
}
async function trackProposalWithBackend({ name, phone }) {
    try {
        const API = process.env.REACT_APP_BACKEND_URL || "";
        await fetch(`${API}/api/leads/public/proposal-track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, source: "website_proposal", created_at: new Date().toISOString() }),
        });
    } catch (e) {
        console.log("[proposal-track] error:", e);
    }
}

const TFD_TEAM_INFO = { name: "The Financial Doctor", phone: "+91 77738 05794" };
const SAGAR_PHOTO = "/assets/founder/sagar-photo.webp";
const TFD_LOGO = "/assets/logos/TFD-MAIN-LOGO.webp";

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
            if (!state.sipStepUp || state.sipStepUp === 0) {
    const topup = sipCalc(baseEffective * 1.1, state.sipYears, state.sipRate, 0);
    out.push({
        title: "10% zyada SIP karein",
        titleHi: "10% ज़्यादा SIP करें",
        extra: topup.fv - baseFv,
        detail: `Monthly SIP ko ${Math.round(baseEffective)} se ${Math.round(baseEffective * 1.1)} kar dein`,
    });
}
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

// 🆕 A4 classic PDF proposal (employee portal) — no charts, everything in clean tables.
const TD = (children, extra = {}) => {
    const { colSpan, ...styleExtra } = extra;
    return (
        <td colSpan={colSpan} style={{ padding: "7px 10px", fontSize: 11.5, color: "#0E1B2C", border: "1px solid #E2D8C2", textAlign: "center", ...styleExtra }}>{children}</td>
    );
};
const TH = (children, extra = {}) => (
    <th style={{ padding: "7px 10px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5C677D", background: "#FBF7EE", border: "1px solid #E2D8C2", textAlign: "center", ...extra }}>{children}</th>
);

// 🆕 Proposal document text, in three languages. Structural/UI strings only —
// figures and the client/employee's own names are inserted as-is.
const PROPOSAL_UI = {
    english: {
        suffix: "— Financial Proposal", subtitle: "Illustrative proposal prepared for review. Figures are projections, not guarantees of future returns.",
        preparedFor: "Prepared For", preparedBy: "Prepared By", valuedClient: "Valued Client", tfdTeam: "TFD Team",
        calculatorType: "Calculator", tenure: "Tenure", expectedReturn: "Expected Return (p.a.)",
        whatIfLonger: "What If You Stay Invested Longer?", extension: "Extension", totalTenure: "Total Tenure",
        totalInvestedCol: "Total Invested", futureValueCol: "Future Value", extraGain: "Extra Gain",
        yearOnYear: "Year-on-Year Growth", year: "Year", invested: "Invested", value: "Value", outstanding: "Outstanding",
        suggestions: "Suggestions to Boost Your Wealth", footerBrand: "The Financial Doctor · thefinancialdoctor.in",
        amfiLine: "AMFI Registered Mutual Fund Distributor · ARN-290298", dateLabel: "Date", scanToInvest: "Scan to Invest", digitalBadge: "Digital Proposal: Click QR to Invest", callNow: "Call Now", whatsappNow: "WhatsApp",
        disclaimer: "This document is an illustrative proposal only and does not constitute investment advice. Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Future returns are not guaranteed — actual returns may vary. Generated on",
        years: "Years", yrs: "Yrs", plusYears: "Years", withdrawn: "Withdrawn",
        calcNames: { sip: "SIP Calculator", daily: "Daily SIP Calculator", lumpsum: "Lumpsum Calculator", swp: "SWP Calculator", goal: "Goal Planner", emi: "EMI Calculator", tax: "Income Tax Calculator", gst: "GST Calculator", inflation: "Future Goal Calculator" },
        howHeading: "How Is This Calculation Done?", interestFreeHeading: "How Can This Loan Become Interest-Free?",
        totalInterestLoan: "Total Interest (Loan)", zarooriSip: "Required Monthly SIP", assumedSipReturn: "Assumed SIP Return", loanTenureLabel: "Loan Tenure",
        totalInterestShort: "Total Interest", assumedReturnShort: "Assumed Return", tenureShort: "Tenure",
        mfEducationHeading: "How Does a Mutual Fund Work?",
        yoyDesc: (col) => `This table shows how your invested amount and its growth increase each year — the longer the duration, the bigger the gap between "Invested" and "${col}".`,
        swpWarning: (pct) => `⚠️ You are currently withdrawing ${pct}% of your corpus annually, which is high. A 6-7% annual withdrawal rate is recommended so the corpus lasts longer.`,
        investedLine: (tab, state) => {
            if (tab === "sip") {
                let s = `Monthly SIP: ${fmtINR(state.sipAmount)}`;
                if (state.sipDailyAddon > 0) s += ` + Additional Daily SIP ${fmtINRFull(state.sipDailyAddon)}/day (22 working days/month)`;
                if (state.sipStepUp > 0) s += ` · ${state.sipStepUp}% annual step-up`;
                return s;
            }
            if (tab === "daily") return `Daily SIP: ${fmtINR(state.dailyAmount)}/day (22 working days/month)`;
            if (tab === "lumpsum") return `Lumpsum Amount: ${fmtINR(state.lump)}`;
            if (tab === "swp") return `Monthly Withdrawal: ${fmtINR(state.swpMonthly)} from ${fmtINR(state.swpCorpus)} corpus`;
            if (tab === "goal") return `Target Corpus: ${fmtINR(state.goal)}`;
            if (tab === "emi") return `Loan Amount: ${fmtINR(state.loan)}`;
            if (tab === "tax") return `Annual Income: ${fmtINR(state.taxIncome)} · 80C: ${fmtINR(state.taxDeductions)}`;
            if (tab === "gst") return `Amount: ${fmtINR(state.gstAmount)} (${state.gstType}) @ ${state.gstRate}% GST`;
            if (tab === "inflation") return `Current Cost: ${fmtINR(state.inflCost)} · Inflation: ${state.inflRate}% p.a.`;
            return "";
        },
    },

    hindi: {
        suffix: "— वित्तीय प्रस्ताव", subtitle: "समीक्षा हेतु तैयार किया गया अनुमानित प्रस्ताव। आंकड़े अनुमान हैं, भविष्य के रिटर्न की गारंटी नहीं।",
        preparedFor: "किसके लिए", preparedBy: "किसके द्वारा तैयार", valuedClient: "सम्मानित ग्राहक", tfdTeam: "TFD टीम",
        calculatorType: "कैलकुलेटर", tenure: "अवधि", expectedReturn: "अपेक्षित रिटर्न (वार्षिक)",
        whatIfLonger: "अगर और लंबे समय तक निवेश करें तो?", extension: "अतिरिक्त वर्ष", totalTenure: "कुल अवधि",
        totalInvestedCol: "कुल निवेश", futureValueCol: "भविष्य मूल्य", extraGain: "अतिरिक्त लाभ",
        yearOnYear: "वर्ष-दर-वर्ष वृद्धि", year: "वर्ष", invested: "निवेश", value: "मूल्य", outstanding: "शेष राशि",
        suggestions: "अपनी संपत्ति बढ़ाने के सुझाव", footerBrand: "द फाइनेंशियल डॉक्टर · thefinancialdoctor.in",
        amfiLine: "एएमएफआई पंजीकृत म्यूचुअल फंड वितरक · ARN-290298", dateLabel: "दिनांक", scanToInvest: "निवेश हेतु स्कैन करें", digitalBadge: "डिजिटल प्रपोजल: सीधे निवेश के लिए QR पर क्लिक करें", callNow: "कॉल करें", whatsappNow: "व्हाट्सएप",
        disclaimer: "यह दस्तावेज़ केवल एक उदाहरणात्मक प्रस्ताव है और निवेश सलाह नहीं है। म्यूचुअल फंड निवेश बाज़ार जोखिमों के अधीन हैं। सभी स्कीम संबंधी दस्तावेज़ ध्यान से पढ़ें। भविष्य के रिटर्न की कोई गारंटी नहीं है — वास्तविक रिटर्न भिन्न हो सकते हैं। तैयार करने की तारीख:",
        years: "वर्ष", yrs: "वर्ष", plusYears: "वर्ष", withdrawn: "निकासी",
        calcNames: { sip: "एसआईपी कैलकुलेटर", daily: "डेली एसआईपी कैलकुलेटर", lumpsum: "लम्पसम कैलकुलेटर", swp: "एसडब्ल्यूपी कैलकुलेटर", goal: "गोल प्लानर", emi: "ईएमआई कैलकुलेटर", tax: "आयकर कैलकुलेटर", gst: "जीएसटी कैलकुलेटर", inflation: "फ्यूचर गोल कैलकुलेटर" },
        howHeading: "यह गणना कैसे होती है?", interestFreeHeading: "यह लोन ब्याज-मुक्त कैसे बन सकता है?",
        totalInterestLoan: "कुल ब्याज (लोन)", zarooriSip: "आवश्यक मासिक एसआईपी", assumedSipReturn: "अनुमानित एसआईपी रिटर्न", loanTenureLabel: "लोन अवधि",
        totalInterestShort: "कुल ब्याज", assumedReturnShort: "अनुमानित रिटर्न", tenureShort: "अवधि",
        mfEducationHeading: "म्यूचुअल फंड कैसे काम करता है?",
        yoyDesc: (col) => `यह तालिका दिखाती है कि हर साल आपकी निवेशित राशि और उसकी वृद्धि कैसे बढ़ती है — जितना लंबा समय, उतना बड़ा अंतर "निवेश" और "${col}" के बीच।`,
        swpWarning: (pct) => `⚠️ आप वर्तमान में अपने कोष का ${pct}% सालाना निकाल रहे हैं, जो अधिक है। कोष को लंबे समय तक चलाने के लिए 6-7% वार्षिक निकासी दर की सलाह दी जाती है।`,
        investedLine: (tab, state) => {
            if (tab === "sip") {
                let s = `मासिक SIP: ${fmtINR(state.sipAmount)}`;
                if (state.sipDailyAddon > 0) s += ` + अतिरिक्त डेली SIP ${fmtINRFull(state.sipDailyAddon)}/दिन (22 कार्य दिवस/माह)`;
                if (state.sipStepUp > 0) s += ` · ${state.sipStepUp}% वार्षिक स्टेप-अप`;
                return s;
            }
            if (tab === "daily") return `डेली SIP: ${fmtINR(state.dailyAmount)}/दिन (22 कार्य दिवस/माह)`;
            if (tab === "lumpsum") return `लम्पसम राशि: ${fmtINR(state.lump)}`;
            if (tab === "swp") return `मासिक निकासी: ${fmtINR(state.swpMonthly)}, ${fmtINR(state.swpCorpus)} कोष से`;
            if (tab === "goal") return `लक्ष्य कोष: ${fmtINR(state.goal)}`;
            if (tab === "emi") return `ऋण राशि: ${fmtINR(state.loan)}`;
            if (tab === "tax") return `वार्षिक आय: ${fmtINR(state.taxIncome)} · 80C: ${fmtINR(state.taxDeductions)}`;
            if (tab === "gst") return `राशि: ${fmtINR(state.gstAmount)} (${state.gstType}) @ ${state.gstRate}% GST`;
            if (tab === "inflation") return `वर्तमान लागत: ${fmtINR(state.inflCost)} · महंगाई: ${state.inflRate}% वार्षिक`;
            return "";
        },
    },
    hinglish: {
        suffix: "— Financial Proposal", subtitle: "Review ke liye taiyar kiya gaya illustrative proposal. Figures anumaan hain, future returns ki guarantee nahi hai.",
        preparedFor: "Kiske Liye", preparedBy: "Kisne Banaya", valuedClient: "Valued Client", tfdTeam: "TFD Team",
        calculatorType: "Calculator", tenure: "Tenure", expectedReturn: "Expected Return (p.a.)",
        whatIfLonger: "Agar Aur Lambe Samay Tak Invest Karein Toh?", extension: "Extra Saal", totalTenure: "Total Tenure",
        totalInvestedCol: "Total Invested", futureValueCol: "Future Value", extraGain: "Extra Gain",
        yearOnYear: "Year-on-Year Growth", year: "Saal", invested: "Invested", value: "Value", outstanding: "Outstanding",
        suggestions: "Apni Wealth Badhane Ke Suggestions", footerBrand: "The Financial Doctor · thefinancialdoctor.in",
        amfiLine: "AMFI Registered Mutual Fund Distributor · ARN-290298", dateLabel: "Date", scanToInvest: "Invest Karne Ke Liye Scan Karein", digitalBadge: "Digital Proposal: QR par Click karein aur invest karein", callNow: "Call Karein", whatsappNow: "WhatsApp Karein",
        disclaimer: "Yeh document sirf ek illustrative proposal hai, investment advice nahi. Mutual fund investments market risks ke adhin hain. Sabhi scheme-related documents dhyan se padhein. Future returns ki guarantee nahi hai — actual returns alag ho sakte hain. Generate hone ki date:",
        years: "Saal", yrs: "Saal", plusYears: "Saal", withdrawn: "Withdrawn",
        calcNames: { sip: "SIP Calculator", daily: "Daily SIP Calculator", lumpsum: "Lumpsum Calculator", swp: "SWP Calculator", goal: "Goal Planner", emi: "EMI Calculator", tax: "Income Tax Calculator", gst: "GST Calculator", inflation: "Future Goal Calculator" },
        howHeading: "Kaise Kaam Karta Hai Ye Calculation?", interestFreeHeading: "Ye Loan Interest-Free Kaise Ban Sakta Hai?",
        totalInterestLoan: "Total Interest (Loan)", zarooriSip: "Zaroori Monthly SIP", assumedSipReturn: "Assumed SIP Return", loanTenureLabel: "Loan Tenure",
        totalInterestShort: "Total Interest", assumedReturnShort: "Assumed Return", tenureShort: "Tenure",
        mfEducationHeading: "Mutual Fund Kaise Kaam Karta Hai?",
        yoyDesc: (col) => `Ye table dikhata hai har saal aapka invested amount aur uski growth kaise badhti hai — jitna lamba time, utna badi difference "Invested" aur "${col}" ke beech.`,
        swpWarning: (pct) => `⚠️ Aap abhi apne corpus ka ${pct}% saalana withdraw kar rahe hain, jo high hai. Corpus ko lambe samay tak chalane ke liye 6-7% annual withdrawal rate recommend kiya jaata hai.`,
        investedLine: (tab, state) => {
            if (tab === "sip") {
                let s = `Monthly SIP: ${fmtINR(state.sipAmount)}`;
                if (state.sipDailyAddon > 0) s += ` + Extra Daily SIP ${fmtINRFull(state.sipDailyAddon)}/din (22 working days/month)`;
                if (state.sipStepUp > 0) s += ` · ${state.sipStepUp}% saalana step-up`;
                return s;
            }
            if (tab === "daily") return `Daily SIP: ${fmtINR(state.dailyAmount)}/din (22 working days/month)`;
            if (tab === "lumpsum") return `Lumpsum Amount: ${fmtINR(state.lump)}`;
            if (tab === "swp") return `Monthly Withdrawal: ${fmtINR(state.swpMonthly)}, ${fmtINR(state.swpCorpus)} corpus se`;
            if (tab === "goal") return `Target Corpus: ${fmtINR(state.goal)}`;
            if (tab === "emi") return `Loan Amount: ${fmtINR(state.loan)}`;
            if (tab === "tax") return `Annual Income: ${fmtINR(state.taxIncome)} · 80C: ${fmtINR(state.taxDeductions)}`;
            if (tab === "gst") return `Amount: ${fmtINR(state.gstAmount)} (${state.gstType}) @ ${state.gstRate}% GST`;
            if (tab === "inflation") return `Current Cost: ${fmtINR(state.inflCost)} · Inflation: ${state.inflRate}% saalana`;
            return "";
        },
    },
};

// Common result-label translations (English label -> localized label)
const LABEL_TR = {
    hindi: {
        "Total Invested": "कुल निवेश", "Est. Returns": "अनुमानित रिटर्न", "Future Value": "भविष्य मूल्य",
        "Monthly EMI": "मासिक ईएमआई", "Total Interest": "कुल ब्याज", "Total Payable": "कुल देय राशि",
        "Loan Amount": "ऋण राशि", "Initial Corpus": "प्रारंभिक कोष", "Total Withdrawn": "कुल निकासी",
        "Balance Left": "शेष राशि", "Balance left": "शेष राशि", "Target": "लक्ष्य", "You Invest": "आप निवेश करेंगे",
        "Required SIP": "आवश्यक एसआईपी", "Old Regime Tax": "पुरानी व्यवस्था कर", "New Regime Tax": "नई व्यवस्था कर",
        "ELSS Saving": "ईएलएसएस बचत", "Base Amount": "मूल राशि", "GST Amount": "जीएसटी राशि", "Total Amount": "कुल राशि",
        "Today's Cost": "आज की लागत", "Future Cost": "भविष्य की लागत", "Monthly SIP Needed": "आवश्यक मासिक एसआईपी",
        "Monthly SIP needed": "आवश्यक मासिक एसआईपी", "Better Regime": "बेहतर व्यवस्था",
    },
    hinglish: {
        "Initial Corpus": "Shuruaati Corpus", "Total Withdrawn": "Total Nikaasi", "Balance Left": "Bacha Balance",
        "Balance left": "Bacha Balance", "You Invest": "Aap Invest Karenge", "Required SIP": "Zaroori SIP",
        "ELSS Saving": "ELSS Bachat", "Today's Cost": "Aaj Ki Cost", "Future Cost": "Future Ki Cost",
        "Monthly SIP Needed": "Zaroori Monthly SIP", "Monthly SIP needed": "Zaroori Monthly SIP", "Better Regime": "Behtar Regime",
    },
};
const trLabel = (lang, s) => (LABEL_TR[lang] && LABEL_TR[lang][s]) || s;
function ProposalHeader({ T, genDate, lang }) {
    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #024396", paddingBottom: 10, marginBottom: 14 }}>
                <img src={TFD_LOGO} crossOrigin="anonymous" alt="TFD" style={{ height: 46, objectFit: "contain" }} />
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9.5, color: "#5C677D" }}>{T.amfiLine}</div>
                    <div style={{ fontSize: 10, color: "#5C677D", marginTop: 2 }}>{T.dateLabel}: {genDate}</div>
                </div>
            </div>
            <InsuranceBanner lang={lang} />
        </>
    );
}

// Digits + country code only — what tel:/wa.me both need. Assumes a plain
// 10-digit Indian mobile number if no country code is already present.
function normalizePhoneForLink(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    if (!digits) return null;
    return digits.length === 10 ? `91${digits}` : digits;
}

function ProposalFooter({ T, genDate, qrDataUrl, employeeInfo }) {
    // The actual tel:/wa.me links only get attached at PDF-export time (see
    // generateSnapshot's pdf.link() calls) — these on-screen divs are just
    // the visual placeholder whose position gets read for that, same as the
    // QR and website links above.
    const preparedByPhone = normalizePhoneForLink(employeeInfo?.phone);
    return (
        <div style={{ borderTop: "1px solid #E2D8C2", paddingTop: 10, marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                    <div data-pdf-link="website" style={{ fontSize: 11, fontWeight: 700, color: "#024396", textDecoration: "underline", display: "inline-block" }}>{T.footerBrand} <span style={{ fontSize: 8, color: "#C7102E" }}>👉 One-click visit</span></div>
                    <div style={{ fontSize: 8.5, color: "#5C677D", fontStyle: "italic", marginTop: 4, lineHeight: 1.4 }}>
                        {T.disclaimer} {genDate}.
                    </div>
                </div>

                {preparedByPhone && (
                    <div style={{ textAlign: "center", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                        <div data-pdf-link="call" style={{ background: "#024396", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                            📞 {T.callNow}
                        </div>
                        <div data-pdf-link="whatsapp" style={{ background: "#25D366", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                            💬 {T.whatsappNow}
                        </div>
                    </div>
                )}

                <div style={{ textAlign: "center", flexShrink: 0, width: 74 }}>
                    {qrDataUrl ? (
                        <img data-pdf-link="qr" src={qrDataUrl} alt="QR" width={76} height={76} style={{ display: "inline-block" }} />
                    ) : (
                        <div data-pdf-link="qr" style={{ width: 76, height: 76, display: "inline-block", borderRadius: 10, background: "#D9A928" }} />
                    )}
                    <div style={{ fontSize: 7.5, marginTop: 4, color: "#C9A227", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>⭐ {T.scanToInvest} ⭐</div>
                </div>
            </div>
            <div style={{ textAlign: "center", borderTop: "1px solid #F0EAD8", paddingTop: 6 }}>
                <span style={{ fontSize: 8, color: "#5C677D", letterSpacing: "0.04em", fontWeight: 600 }}>Powered by The Financial Doctor</span>
            </div>
        </div>
    );
}
function ProposalDocument({ tab, result, state, employeeInfo = null, clientInfo = null, lang = "english", page1Ref, page2Ref, qrDataUrl }) {
    if (!result) return null;
    const T = PROPOSAL_UI[lang] || PROPOSAL_UI.english;
    const labels = T.calcNames;

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
            case "inflation": return state.inflYears;
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
            case "inflation": return state.inflReturn;
            default: return 12;
        }
    })();

    const headlineMetric = (() => {
        if (tab === "emi") return { label: "Monthly EMI", value: fmtINR(result.emi) };
        if (tab === "swp") return { label: "Balance left", value: fmtINR(result.fv) };
        if (tab === "goal") return { label: "Monthly SIP needed", value: fmtINR(result.requiredSip) };
        if (tab === "tax") return { label: "Better Regime", value: result.better };
        if (tab === "gst") return { label: "Total Amount", value: fmtINR(result.total) };
        if (tab === "inflation") return { label: "Future Cost", value: fmtINR(result.futureCost) };
        return { label: "Future Value", value: fmtINR(result.fv) };
    })();

    const investedLine = T.investedLine(tab, state);
    const mfEd = MF_EDUCATION[lang] || MF_EDUCATION.hinglish;

    const bigStats = (() => {
        if (tab === "emi") return [["Loan Amount", fmtINR(state.loan)], ["Total Interest", fmtINR(result.interest)], ["Total Payable", fmtINR(result.total)]];
        if (tab === "swp") {
    const withdrawalPct = ((state.swpMonthly * 12) / state.swpCorpus * 100).toFixed(1);
    return [["Initial Corpus", fmtINRFull(result.invested)], ["Annual Withdrawal Rate", `${withdrawalPct}%`], ["Balance Left", fmtINRFull(result.fv)]];
}
        if (tab === "goal") return [["Target", fmtINR(result.target)], ["You Invest", fmtINR(result.invested)], ["Required SIP", fmtINR(result.requiredSip)]];
        if (tab === "tax") return [["Old Regime Tax", fmtINR(result.oldTax)], ["New Regime Tax", fmtINR(result.newTax)], ["ELSS Saving", fmtINR(result.elssSaving)]];
        if (tab === "gst") return [["Base Amount", fmtINR(result.base)], ["GST Amount", fmtINR(result.gst)], ["Total Amount", fmtINR(result.total)]];
        if (tab === "inflation") return [["Today's Cost", fmtINR(result.currentCost)], ["Future Cost", fmtINR(result.futureCost)], ["Monthly SIP Needed", fmtINR(result.requiredSip)]];
        return [["Total Invested", fmtINR(result.invested)], ["Est. Returns", fmtINR(result.gains)], ["Future Value", fmtINR(result.fv)]];
    })();

    // Cap year-on-year rows so a long tenure still reads cleanly
    const fullSeries = result.series || [];
    let yearRows = fullSeries;
    if (fullSeries.length > 12) {
        const step = Math.ceil(fullSeries.length / 12);
        yearRows = fullSeries.filter((_, i) => i % step === 0 || i === fullSeries.length - 1);
    }

    const suggestions = upsellScenarios(tab, state, result);
    const suggestionText = (s) => (lang === "hindi" ? s.titleHi : lang === "hinglish" ? s.title : s.detail);
    const tip = (CALC_RECOMMENDATIONS[tab] || [])[0];
    const tipText = tip ? (lang === "hindi" ? tip.hi : lang === "hinglish" ? tip.hinglish : tip.en) : null;
    const genDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    return (
        <>
            {/* ===== PAGE 1 ===== */}
            <div ref={page1Ref} style={{
                width: 794, height: 1123, background: "#fff", position: "relative",
                fontFamily: "'DM Sans', Arial, sans-serif", color: "#0E1B2C",
                padding: "30px 40px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column",
            }}>
                <div aria-hidden style={{ position: "absolute", top: "48%", left: "50%", transform: "translate(-50%,-50%) rotate(-28deg)", fontSize: 60, color: "rgba(2,67,150,0.05)", fontWeight: 800, whiteSpace: "nowrap", letterSpacing: 6, pointerEvents: "none" }}>THE FINANCIAL DOCTOR</div>

                <ProposalHeader T={T} genDate={genDate} lang={lang} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>{labels[tab]} {T.suffix}</h1>
                        <p style={{ fontSize: 10, color: "#5C677D", margin: 0 }}>{T.subtitle}</p>
                    </div>
                    <div style={{
                        background: "linear-gradient(155deg, #1a2440 0%, #0E1B2C 55%, #1a1030 100%)",
                        border: "2px solid transparent",
                        backgroundImage: "linear-gradient(155deg, #1a2440 0%, #0E1B2C 55%, #1a1030 100%), linear-gradient(150deg, #FFF9E0, #FFD700 30%, #B8860B 60%, #FFD700 85%, #FFF6D5)",
                        backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box",
                        borderRadius: 14, padding: "8px 14px", textAlign: "center",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,215,0,0.15)",
                        width: 145, flexShrink: 0,
                    }}>
                        <div style={{ fontSize: 8.5, color: "#FFD700", fontWeight: 900, letterSpacing: "0.12em", marginBottom: 3 }}>⭐ PREMIUM ⭐</div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 11.5, color: "#fff", fontWeight: 800, lineHeight: 1.3 }}>
                            India's Smartest
                        </div>
                        <div style={{ fontSize: 8.5, color: "#FFD700", fontWeight: 700, lineHeight: 1.3, marginTop: 2 }}>{T.digitalBadge}</div>
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ border: "1px solid #E2D8C2", borderRadius: 8, padding: 9, textAlign: "center" }}>
                            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#024396", fontWeight: 700, marginBottom: 3 }}>{T.preparedFor}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{clientInfo?.name || T.valuedClient}</div>
                            {clientInfo?.phone && <div style={{ fontSize: 10, color: "#5C677D", marginTop: 2 }}>📱 {clientInfo.phone}</div>}
                        </div>
                        <div style={{ border: "1px solid #E2D8C2", borderRadius: 8, padding: 9, textAlign: "center" }}>
                            <div style={{ fontSize: 9, textTransform: "uppercase", color: "#024396", fontWeight: 700, marginBottom: 3 }}>{T.preparedBy}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{employeeInfo?.name || "The Financial Doctor"}</div>
                            {employeeInfo?.phone && <div style={{ fontSize: 10, color: "#5C677D", marginTop: 2 }}>📱 {employeeInfo.phone}</div>}
                    </div>
                </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
                    <thead><tr>{TH(T.calculatorType)}{baseYears ? TH(T.tenure) : null}{rateUsed ? TH(T.expectedReturn) : null}{TH(trLabel(lang, headlineMetric.label))}</tr></thead>
                    <tbody><tr>
                        {TD(labels[tab])}
                        {baseYears ? TD(`${baseYears} ${T.years}`) : null}
                        {rateUsed ? TD(`${rateUsed}%`) : null}
                        {TD(<strong style={{ fontSize: 13, color: "#024396" }}>{headlineMetric.value}</strong>)}
                    </tr></tbody>
                </table>
                <div style={{ fontSize: 10.5, color: "#2A364B", marginBottom: 14, textAlign: "center", fontWeight: 600 }}>{investedLine}</div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
                    <thead><tr>{bigStats.map(([l]) => TH(trLabel(lang, l)))}</tr></thead>
                    <tbody><tr>{bigStats.map(([, v], i) => TD(<strong style={{ fontSize: 12.5 }}>{v}</strong>, i === bigStats.length - 1 ? { color: "#024396" } : {}))}</tr></tbody>
                </table>

                {CALC_METHODOLOGY[tab] && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#024396", marginBottom: 6, textAlign: "center" }}>{T.howHeading}</div>
                        <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontSize: 9.5, color: "#2A364B", lineHeight: 1.55 }}>
                            {(CALC_METHODOLOGY[tab][lang] || CALC_METHODOLOGY[tab].hinglish).highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                        <div style={{ fontSize: 9, color: "#5C677D", background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 8, padding: "7px 10px", lineHeight: 1.5 }}>
                            {(CALC_METHODOLOGY[tab][lang] || CALC_METHODOLOGY[tab].hinglish).how}
                        </div>
                    </div>
                )}

                {tab === "emi" && result.interestFreeSip > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#C7102E", marginBottom: 6, textAlign: "center" }}>💡 {T.interestFreeHeading}</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
                            <thead><tr>{TH(T.totalInterestLoan)}{TH(T.zarooriSip)}{TH(T.assumedSipReturn)}{TH(T.loanTenureLabel)}</tr></thead>
                            <tbody><tr>
                                {TD(fmtINRFull(result.interest))}
                                {TD(<strong style={{ color: "#024396" }}>{fmtINRFull(result.interestFreeSip)}/mo</strong>)}
                                {TD("12% p.a.")}
                                {TD(`${baseYears} ${T.years}`)}
                            </tr></tbody>
                        </table>
                        <div style={{ fontSize: 9, color: "#5C677D", background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 8, padding: "7px 10px", lineHeight: 1.5 }}>
                            {(CALC_METHODOLOGY.emi[lang] || CALC_METHODOLOGY.emi.hinglish).interestFreeExplain}
                        </div>
                    </div>
                )}
                {extendable && (
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#024396", marginBottom: 6, textAlign: "center" }}>{T.whatIfLonger}</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr>{TH(T.extension)}{TH(T.totalTenure)}{TH(T.totalInvestedCol)}{TH(T.futureValueCol)}{TH(T.extraGain)}</tr></thead>
                            <tbody>
                                {projections.map(({ y, p }) => (
                                    <tr key={y}>
                                        {TD(`+${y} ${T.plusYears}`)}
                                        {TD(`${baseYears + y} ${T.years}`)}
                                        {TD(p ? fmtINRFull(p.invested) : "—")}
                                        {TD(p ? fmtINRFull(p.fv) : "—", { fontWeight: 700 })}
                                        {TD(p ? `+${fmtINRFull(p.fv - result.fv)}` : "—", { color: "#024396", fontWeight: 700 })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
{tab === "swp" && (() => {
    const annualWithdrawalPct = (state.swpMonthly * 12) / state.swpCorpus * 100;
    if (annualWithdrawalPct > 7) {
        return (
            <div style={{ background: "#FBE4E4", border: "1px solid #C7102E", borderRadius: 8, padding: "9px 12px", marginBottom: 14, fontSize: 9.5, color: "#7A1420", lineHeight: 1.5 }}>
                {T.swpWarning(annualWithdrawalPct.toFixed(1))}
            </div>
        );
    }
    return null;
})()}

        {["sip", "daily", "lumpsum", "swp", "goal"].includes(tab) && (
    <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#024396", marginBottom: 6, textAlign: "center" }}>{mfEd.heading}</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 9, color: "#2A364B", lineHeight: 1.55 }}>
            {mfEd.points.map((p, i) => <li key={i} style={{ marginBottom: 3 }}>{p}</li>)}
        </ul>
    </div>
)}
                <ProposalFooter T={T} genDate={genDate} qrDataUrl={qrDataUrl} employeeInfo={employeeInfo} lang={lang} />
            </div>

            {/* ===== PAGE 2 ===== */}
            <div ref={page2Ref} style={{
                width: 794, height: 1123, background: "#fff", position: "relative",
                fontFamily: "'DM Sans', Arial, sans-serif", color: "#0E1B2C",
                padding: "30px 40px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column",
            }}>
                <div aria-hidden style={{ position: "absolute", top: "48%", left: "50%", transform: "translate(-50%,-50%) rotate(-28deg)", fontSize: 60, color: "rgba(2,67,150,0.05)", fontWeight: 800, whiteSpace: "nowrap", letterSpacing: 6, pointerEvents: "none" }}>THE FINANCIAL DOCTOR</div>
                <ProposalHeader T={T} genDate={genDate} lang={lang} />

                {yearRows.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#024396", marginBottom: 6, textAlign: "center" }}>{T.yearOnYear}</div>
                        <p style={{ fontSize: 9.5, color: "#5C677D", textAlign: "center", marginBottom: 8 }}>
                            {T.yoyDesc(tab === "emi" ? T.outstanding : T.value)}
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr>{TH(T.year)}{TH(tab === "swp" ? T.withdrawn : T.invested)}{TH(tab === "emi" ? T.outstanding : T.value)}</tr></thead>
                            <tbody>
                                {yearRows.map((r) => (
                                    <tr key={r.label}>
                                        {TD(r.label)}
                                        {TD(fmtINRFull(r.invested))}
                                        {TD(fmtINRFull(r.value), { fontWeight: 700 })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {(suggestions.length > 0 || tipText) && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#C7102E", marginBottom: 6, textAlign: "center" }}>💡 {T.suggestions}</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                {suggestions.map((s, idx) => (
                                    <tr key={`sg-${idx}`}>
                                        {TD(suggestionText(s), { textAlign: "left" })}
                                        {TD(<strong style={{ color: "#024396" }}>+{fmtINRFull(s.extra)}</strong>, { whiteSpace: "nowrap" })}
                                    </tr>
                                ))}
                                {tipText && <tr>{TD(tipText, { colSpan: 2, textAlign: "left" })}</tr>}
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === "emi" && result.interestFreeSip > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#C7102E", marginBottom: 5, textAlign: "center" }}>💡 {T.interestFreeHeading}</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 5 }}>
                            <thead><tr>{TH(T.totalInterestShort)}{TH(T.zarooriSip)}{TH(T.assumedReturnShort)}{TH(T.tenureShort)}</tr></thead>
                            <tbody><tr>
                                {TD(fmtINRFull(result.interest))}
                                {TD(<strong style={{ color: "#024396" }}>{fmtINRFull(result.interestFreeSip)}/mo</strong>)}
                                {TD("12% p.a.")}
                                {TD(`${baseYears} ${T.years}`)}
                            </tr></tbody>
                        </table>
                        <div style={{ fontSize: 8.5, color: "#5C677D", background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 6, padding: "6px 9px", lineHeight: 1.45 }}>
                            {(CALC_METHODOLOGY.emi[lang] || CALC_METHODOLOGY.emi.hinglish).interestFreeExplain}
                        </div>
                    </div>
                )}

                {["sip", "daily", "lumpsum", "swp", "goal"].includes(tab) && (
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#024396", marginBottom: 5, textAlign: "center" }}>{mfEd.heading}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 8.5, color: "#2A364B", lineHeight: 1.45 }}>
                            {mfEd.points.map((p, i) => <li key={i} style={{ marginBottom: 2 }}>{p}</li>)}
                        </ul>
                    </div>
                )}

                <div style={{ flex: 1 }} />
                <ProposalFooter T={T} genDate={genDate} qrDataUrl={qrDataUrl} employeeInfo={employeeInfo} lang={lang} />
            </div>
        </>
    );
}

function SnapshotCard({ tab, result, state, variant = "public", employeeInfo = null, clientInfo = null }) {
    const labels = {
        sip: "SIP Calculator",
        daily: "Daily SIP Calculator",
        lumpsum: "Lumpsum Calculator",
        swp: "SWP Calculator",
        goal: "Goal Planner",
        emi: "EMI Calculator",
        tax: "Income Tax Calculator",
        gst: "GST Calculator",
        inflation: "Future Goal Calculator",
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
            case "inflation": return state.inflYears;
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
            case "inflation": return state.inflReturn;
            default: return 12;
        }
    })();

    const headlineMetric = (() => {
        if (tab === "emi") return { label: "Monthly EMI", value: fmtINR(result.emi) };
        if (tab === "swp") return { label: "Balance left", value: fmtINR(result.fv) };
        if (tab === "goal") return { label: "Monthly SIP needed", value: fmtINR(result.requiredSip) };
        if (tab === "tax") return { label: "Better Regime", value: result.better };
        if (tab === "gst") return { label: "Total Amount", value: fmtINR(result.total) };
        if (tab === "inflation") return { label: "Future Cost", value: fmtINR(result.futureCost) };
        return { label: "Future Value", value: fmtINR(result.fv) };
    })();

    const investedLine = (() => {
        if (tab === "sip") {
            let s = `Monthly SIP: ${fmtINR(state.sipAmount)}`;
            if (state.sipDailyAddon > 0) s += ` + Additional Daily SIP ${fmtINRFull(state.sipDailyAddon)}/day (22 working days/month)`;
            if (state.sipStepUp > 0) s += ` · ${state.sipStepUp}% annual step-up`;
            return s;
        }
        if (tab === "daily") return `Daily SIP: ${fmtINR(state.dailyAmount)}/day (22 working days/month)`;
        if (tab === "lumpsum") return `Lumpsum Amount: ${fmtINR(state.lump)}`;
        if (tab === "swp") return `Monthly Withdrawal: ${fmtINR(state.swpMonthly)} from ${fmtINR(state.swpCorpus)} corpus`;
        if (tab === "goal") return `Target Corpus: ${fmtINR(state.goal)}`;
        if (tab === "emi") return `Loan Amount: ${fmtINR(state.loan)}`;
        if (tab === "tax") return `Annual Income: ${fmtINR(state.taxIncome)} · 80C: ${fmtINR(state.taxDeductions)}`;
        if (tab === "gst") return `Amount: ${fmtINR(state.gstAmount)} (${state.gstType}) @ ${state.gstRate}% GST`;
        if (tab === "inflation") return `Current Cost: ${fmtINR(state.inflCost)} · Inflation: ${state.inflRate}% p.a.`;
        return "";
    })();

    return (
        <div className="snap-card">
            <div aria-hidden style={{position: "absolute", top: -120, right: -120, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(2, 67, 150,0.18) 0%, transparent 70%)"}} />
            <div aria-hidden style={{position: "absolute", bottom: -140, left: -140, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(199, 16, 46,0.15) 0%, transparent 70%)"}} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <img src={TFD_LOGO} crossOrigin="anonymous" alt="TFD" style={{height: 72, width: "auto", objectFit: "contain", background: "#F6F1E8", borderRadius: 12, padding: 6, border: "1px solid #E2D8C2"}} />
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5C677D", whiteSpace: "nowrap" }}>AMFI · ARN-290298</div>
                </div>
            </div>
            <div style={{position: "relative", background: "#0E1B2C", color: "#F6F1E8", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18}}>
                <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7102E", fontWeight: 600 }}>{labels[tab]}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, marginTop: 6, lineHeight: 1 }}>{headlineMetric.value}</div>
                    <div style={{ fontSize: 11, color: "#F6F1E8", opacity: 0.7, marginTop: 4 }}>{headlineMetric.label}{baseYears ? ` · over ${baseYears} years @ ${rateUsed}% p.a.` : ""}</div>
                    <div style={{ fontSize: 12, color: "#F6F1E8", marginTop: 6, fontWeight: 600 }}>{investedLine}</div>
                </div>
                <div style={{background: "#C7102E", color: "#fff", borderRadius: 999, padding: "5px 12px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, maxWidth: 170, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{clientInfo?.name ? clientInfo.name : "Snapshot"}</div>
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
                ) : tab === "tax" ? (
                    <>
                        <BigStat label="Old Regime Tax" value={fmtINR(result.oldTax)} />
                        <BigStat label="New Regime Tax" value={fmtINR(result.newTax)} />
                        <BigStat label="ELSS Saving" value={fmtINR(result.elssSaving)} accent />
                    </>
                ) : tab === "gst" ? (
                    <>
                        <BigStat label="Base Amount" value={fmtINR(result.base)} />
                        <BigStat label="GST Amount" value={fmtINR(result.gst)} />
                        <BigStat label="Total Amount" value={fmtINR(result.total)} accent />
                    </>
                ) : tab === "inflation" ? (
                    <>
                        <BigStat label="Today's Cost" value={fmtINR(result.currentCost)} />
                        <BigStat label="Future Cost" value={fmtINR(result.futureCost)} />
                        <BigStat label="Monthly SIP Needed" value={fmtINR(result.requiredSip)} accent />
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
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ background: "#024396", color: "#F6F1E8", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 999, lineHeight: 1, display: "inline-block" }}>+{y}Y</span><span style={{ fontSize: 10, color: "#5C677D", lineHeight: 1 }}>({baseYears + y} yrs total)</span></div>
                                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: "#0E1B2C", lineHeight: 1.1 }}>{p ? fmtINR(p.fv) : "—"}</div>
                                    <div style={{ fontSize: 10, color: "#024396", marginTop: 4, fontBold: 600 }}>+{fmtINR(extraGains)} extra</div>
                                    {p && <div style={{ fontSize: 9, color: "#5C677D", marginTop: 3 }}>Invested {fmtINR(p.invested)}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {result.series && result.series.length > 0 && (
                <div style={{ position: "relative", marginBottom: 18 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D", marginBottom: 8 }}>Year-on-year growth</div>
                    <div style={{ background: "#FBF7EE", border: "1px solid #E2D8C2", borderRadius: 12, padding: 12 }}><SnapshotChart series={result.series || []} tab={tab} /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#5C677D" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#C7102E" }} />Invested</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#024396" }} />{tab === "emi" ? "Outstanding" : "Value"}</span></div>
                </div>
            )}
            {tab === "emi" && result.interestFreeSip > 0 && (
                <div style={{background: "#FBF7EE", border: "1px solid #E2D8C2", borderLeft: "3px solid #C7102E", borderRadius: 12, padding: "12px 14px", marginBottom: 18}}>
                    <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C7102E", fontWeight: 700, marginBottom: 6 }}>💡 Make This Loan Interest-Free</div>
                    <div style={{ fontSize: 11.5, color: "#0E1B2C", lineHeight: 1.4 }}>Start a SIP of <strong>{fmtINR(result.interestFreeSip)}/month</strong> (12% p.a. assumed) to roughly offset your total interest of {fmtINR(result.interest)}.</div>
                </div>
            )}
            {tab === "tax" && result.elssSaving > 0 && (
                <div style={{background: "#FBF7EE", border: "1px solid #E2D8C2", borderLeft: "3px solid #C7102E", borderRadius: 12, padding: "12px 14px", marginBottom: 18}}>
                    <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C7102E", fontWeight: 700, marginBottom: 6 }}>💡 Save More with ELSS</div>
                    <div style={{ fontSize: 11.5, color: "#0E1B2C", lineHeight: 1.4 }}>Investing your remaining 80C room in ELSS could save up to <strong>{fmtINR(result.elssSaving)}</strong> in tax.</div>
                </div>
            )}
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
                    {variant === "employee" ? (
                        <div style={{width: 56, height: 56, borderRadius: 999, background: "#024396", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #C7102E", flexShrink: 0}}>
                            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#F6F1E8" }}>{(employeeInfo?.name || "T").charAt(0).toUpperCase()}</span>
                        </div>
                    ) : (
                        <img src={SAGAR_PHOTO} crossOrigin="anonymous" alt="Sagar" style={{width: 70, height: 88, borderRadius: 12, objectFit: "cover", border: "2px solid #C7102E"}} />
                    )}
                    <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.1 }}>{variant === "employee" ? (employeeInfo?.name || "TFD Team") : "Sagar Chaturvedi"}</div>
                        <div style={{ fontSize: 10, color: "#F6F1E8", opacity: 0.7, marginTop: 3, letterSpacing: "0.12em", textTransform: "uppercase" }}>{variant === "employee" ? "Financial Advisor · TFD" : "Founder · MFD (AMFI Certified)"}</div>
                        {variant === "employee" ? (
                            employeeInfo?.phone && <div style={{ fontSize: 11, marginTop: 6, opacity: 0.9 }}>📱 {employeeInfo.phone}</div>
                        ) : (
                            <>
                                <div style={{ fontSize: 11, marginTop: 6, opacity: 0.9 }}>📱 +91 77738 05794</div>
                                <div style={{ fontSize: 11, opacity: 0.9 }}>✉ wecare@thefinancialdoctor.in</div>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: 5, borderRadius: 10 }}>
                        <img src={qrImageUrl(TFD_BRAND_URL, 220)} crossOrigin="anonymous" alt="QR" style={{ width: 88, height: 88, display: "block" }} />
                    </div>
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