import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import SEO from "@/components/SEO";

/* ============================================================
   TFD RESEARCH LEARNING HUB — Educational Subscription Page
   - Fully SEBI-style non-advisory educational disclaimers
   - 3 plans: ₹1,999 / ₹4,999 / ₹9,999
   - Registration form -> Agreement -> PDF download -> Payment (coming soon UI only)
   - NO backend / payment API calls yet — everything is frontend-only on purpose.
   ============================================================ */

const TFD_LOGO =
    "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";

const PLANS = [
    {
        id: "basic",
        title: "Basic Learner",
        tagline: "Start your market education journey",
        price: 1999,
        accent: "#3B82F6",
        features: [
            "Foundations of Indian Stock Market (NSE/BSE)",
            "How to read price charts & candlesticks",
            "Daily market observation sheets (educational)",
            "Basics of order types & paper-trading practice",
            "Weekly recorded learning sessions",
            "WhatsApp community access (read-only updates)",
        ],
    },
    {
        id: "pro",
        title: "Pro Optionist",
        tagline: "Understand derivatives the structured way",
        price: 4999,
        accent: "#C7102E",
        popular: true,
        features: [
            "Everything in Basic Learner",
            "Options & Futures — concepts explained simply",
            "Live strategy breakdown sessions (educational)",
            "Weekly Nifty / Bank Nifty case-study sheets",
            "Risk management & position-sizing concepts",
            "Priority WhatsApp doubt-clearing slot",
        ],
    },
    {
        id: "elite",
        title: "Elite Masterclass",
        tagline: "Institutional-style research training",
        price: 9999,
        accent: "#B8860B",
        features: [
            "Everything in Pro Optionist",
            "Institutional-grade research methodology",
            "Portfolio hedging concepts (educational)",
            "1:1 educational Q&A session (monthly)",
            "Advanced risk-management blueprints",
            "Certificate of Completion",
        ],
    },
];

function fmtINR(n) {
    return `₹${n.toLocaleString("en-IN")}`;
}

export default function EducationPortal() {
    const [step, setStep] = useState("plans"); // plans -> form -> agreement -> payment
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", email: "", whatsapp: "" });
    const [agreed, setAgreed] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const docRef = useRef(null);

    const refNo = useRef(
        "TFD-EDU-" + Math.floor(100000 + Math.random() * 900000)
    ).current;

    const openPlan = (plan) => {
        setSelectedPlan(plan);
        setStep("form");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFormChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submitForm = (e) => {
        e.preventDefault();
        setStep("agreement");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const generatePdf = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const W = doc.internal.pageSize.getWidth();
        let y = 50;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("THE FINANCIAL DOCTOR", W / 2, y, { align: "center" });
        y += 20;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Educational Subscription & Risk Disclosure Agreement", W / 2, y, {
            align: "center",
        });
        y += 14;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Document Ref: ${refNo}  |  Date: ${new Date().toLocaleDateString("en-IN")}`, W / 2, y, {
            align: "center",
        });
        doc.setTextColor(0);
        y += 30;

        doc.setFontSize(10);
        const line = (txt) => {
            const split = doc.splitTextToSize(txt, W - 100);
            doc.text(split, 50, y);
            y += split.length * 13 + 6;
        };

        doc.setFont("helvetica", "bold");
        line("Subscriber Details");
        doc.setFont("helvetica", "normal");
        line(`Name: ${form.name}`);
        line(`Phone: ${form.phone}`);
        line(`Email: ${form.email}`);
        line(`WhatsApp: ${form.whatsapp}`);
        line(`Selected Program: ${selectedPlan.title} — ${fmtINR(selectedPlan.price)} (one-time educational fee)`);

        y += 8;
        doc.setFont("helvetica", "bold");
        line("Mandatory Declarations — Educational / Non-Advisory Nature");
        doc.setFont("helvetica", "normal");
        line(
            "1. Strictly Educational Content: All charts, strategies, technical analysis sessions and observation sheets shared under this program are exclusively for educational purposes and paper-trading (virtual) practice. Nothing herein constitutes investment advice."
        );
        line(
            "2. No Buy/Sell Recommendations: The Financial Doctor does not provide investment advisory services, stock tips, or buy/sell/hold recommendations under this program. Any market examples used are purely illustrative and for learning purposes only."
        );
        line(
            "3. No Guarantee of Profit: Past performance, simulations or examples discussed do not guarantee or imply any future returns. Stock market investments are subject to market risk."
        );
        line(
            "4. Subscriber's Sole Responsibility: The subscriber acknowledges that any real-money trading or investment decision taken by them, whether based on learnings from this program or otherwise, is taken at their own discretion and sole risk. The Financial Doctor, its founder, and associates bear no responsibility or liability whatsoever for any financial loss, damage, or consequence arising from the subscriber's independent trading/investment decisions."
        );
        line(
            "5. Not a SEBI Registered Investment Adviser: This program is an educational subscription only. The Financial Doctor is not acting as a SEBI-registered Research Analyst or Investment Adviser under this program, and no personalised investment advice is being rendered."
        );
        line(
            "6. Voluntary Participation: The subscriber is voluntarily enrolling in this educational program for the purpose of learning and skill development in market analysis and paper trading."
        );

        y += 10;
        doc.setFont("helvetica", "bold");
        line("Acknowledgement");
        doc.setFont("helvetica", "normal");
        line(
            `I, ${form.name}, holding contact number ${form.phone}, confirm that I have read and understood the above declarations in full. I agree that the content shared under the "${selectedPlan.title}" program is strictly for educational and paper-trading purposes, and that I alone am responsible for any real financial decisions I may take.`
        );

        y += 20;
        doc.text("Subscriber Signature (Digital Acceptance): " + form.name, 50, y);
        y += 16;
        doc.text("Date: " + new Date().toLocaleString("en-IN"), 50, y);

        doc.save(`TFD-Education-Agreement-${refNo}.pdf`);
        setPdfReady(true);
    };

    const proceedToPayment = () => {
        if (!agreed) return;
        if (!pdfReady) generatePdf();
        setStep("payment");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-[#0A0F1E] text-[#E9ECF1]">
            <SEO
                title="The Financial Doctor | Research & Learning Hub"
                description="Stock market research and learning resources from The Financial Doctor — educational content on investing, financial planning, and market fundamentals."
                keywords="stock market learning, financial education India, investing basics"
                path="/research-learning-hub"
            />
            {/* ===== Top SEBI strip ===== */}
            <div className="bg-[#C7102E] text-white text-center text-[12px] sm:text-[13px] font-medium py-2 px-4">
                Educational content only — Not investment advice. Stock market investments are subject to market risk.
            </div>

            {/* ===== Header ===== */}
            <header className="border-b border-white/10">
                <div className="max-w-6xl mx-auto px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={TFD_LOGO} alt="TFD" className="h-10 w-auto bg-white rounded-md p-1" />
                        <div>
                            <div className="font-semibold text-lg leading-tight">The Financial Doctor</div>
                            <div className="text-[11px] tracking-[0.18em] uppercase text-[#9AA4B2]">
                                Research Learning Hub
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#9AA4B2] border border-white/15 rounded-full px-3 py-1.5">
                        🇮🇳 For Indian Stock Market Learners
                    </div>
                </div>
            </header>

            {step === "plans" && <PlansView onSelect={openPlan} />}

            {step === "form" && (
                <FormView
                    plan={selectedPlan}
                    form={form}
                    onChange={handleFormChange}
                    onSubmit={submitForm}
                    onBack={() => setStep("plans")}
                />
            )}

            {step === "agreement" && (
                <AgreementView
                    plan={selectedPlan}
                    form={form}
                    refNo={refNo}
                    agreed={agreed}
                    setAgreed={setAgreed}
                    onBack={() => setStep("form")}
                    onDownload={generatePdf}
                    pdfReady={pdfReady}
                    onProceed={proceedToPayment}
                />
            )}

            {step === "payment" && (
                <PaymentView plan={selectedPlan} refNo={refNo} onBack={() => setStep("agreement")} />
            )}

            <Footer />
        </div>
    );
}

/* ================= PLANS VIEW ================= */
function PlansView({ onSelect }) {
    return (
        <main>
            {/* Hero */}
            <section className="max-w-6xl mx-auto px-5 pt-14 pb-10 text-center">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#C7102E] font-semibold border border-[#C7102E]/40 rounded-full px-3 py-1 mb-5">
                    Strictly Educational · Paper-Trading Focused
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
                    Learn the Indian Stock Market,
                    <br />
                    <span className="text-[#D4AF37]">the structured way.</span>
                </h1>
                <p className="mt-5 text-[#AEB6C2] max-w-2xl mx-auto text-[15px] leading-relaxed">
                    Structured research-based learning programs to help you understand NSE/BSE
                    markets, technical analysis, and options concepts — purely for education and
                    virtual (paper) trading practice. We do not provide investment advice or
                    trading calls.
                </p>
                <MarketGraphic />
            </section>

            {/* Plans */}
            <section className="max-w-6xl mx-auto px-5 pb-16">
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className="relative rounded-2xl border bg-[#10172A] p-7 flex flex-col"
                            style={{ borderColor: plan.popular ? plan.accent : "rgba(255,255,255,0.1)" }}
                        >
                            {plan.popular && (
                                <span
                                    className="absolute -top-3 right-6 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                                    style={{ background: plan.accent }}
                                >
                                    Most Popular
                                </span>
                            )}
                            <div className="text-[11px] uppercase tracking-[0.18em] text-[#9AA4B2] mb-2">
                                {plan.tagline}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{plan.title}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-extrabold">{fmtINR(plan.price)}</span>
                                <span className="text-[#9AA4B2] text-sm">/ one-time</span>
                            </div>
                            <ul className="space-y-3 flex-1 mb-7">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#C9CFDA]">
                                        <CheckIcon color={plan.accent} />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onSelect(plan)}
                                className="w-full py-3 rounded-xl font-semibold text-[14px] transition-opacity hover:opacity-90"
                                style={{ background: plan.accent, color: "#fff" }}
                            >
                                Enroll for Learning
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* SEBI Guidelines block */}
            <SebiNotice />
        </main>
    );
}

function CheckIcon({ color }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" />
            <path d="M7 12.5l3 3 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* A simple generic candlestick + line chart drawn in pure SVG — no external images, no copyright issues */
function MarketGraphic() {
    const candles = [40, 60, 35, 70, 55, 80, 45, 90, 65, 100, 75, 110];
    return (
        <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0E1526] p-6">
            <svg viewBox="0 0 600 160" className="w-full h-[140px]">
                <polyline
                    points={candles.map((v, i) => `${i * 50 + 10},${150 - v}`).join(" ")}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2"
                />
                {candles.map((v, i) => (
                    <g key={i}>
                        <rect
                            x={i * 50 + 5}
                            y={150 - v}
                            width="10"
                            height={v}
                            fill={i % 2 === 0 ? "#1FAE6A" : "#C7102E"}
                            opacity="0.85"
                            rx="1"
                        />
                    </g>
                ))}
            </svg>
            <div className="flex justify-between mt-3 text-[10px] text-[#7C8595] uppercase tracking-wider">
                <span>NIFTY · Illustrative chart for learning purposes only</span>
                <span>Not real-time data</span>
            </div>
        </div>
    );
}

function SebiNotice() {
    return (
        <section className="max-w-6xl mx-auto px-5 pb-16">
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#10172A] p-7 sm:p-9">
                <h3 className="text-lg font-bold mb-4 text-[#D4AF37]">
                    Important Disclosures (Please Read Carefully)
                </h3>
                <ul className="space-y-3 text-[13.5px] text-[#C9CFDA] leading-relaxed list-disc pl-5">
                    <li>
                        This program is <strong>strictly educational</strong>. The Financial Doctor is not a SEBI
                        Registered Investment Adviser or Research Analyst under this program, and does not provide
                        personalised investment advice, stock tips, or buy/sell/hold recommendations.
                    </li>
                    <li>
                        All charts, strategies, and case studies shared are intended solely to help subscribers learn
                        market concepts and practice on <strong>virtual / paper trading</strong>. They do not constitute
                        a recommendation to trade with real money.
                    </li>
                    <li>
                        Stock market and derivatives trading involves substantial risk of loss. Any decision to trade
                        or invest with real money, taken independently by the subscriber, is entirely at their own
                        risk and discretion.
                    </li>
                    <li>
                        <strong>The Financial Doctor bears no responsibility or financial liability</strong> for any
                        loss, damage, or consequence arising from a subscriber's independent trading or investment
                        decisions, whether based on this educational content or otherwise.
                    </li>
                    <li>
                        Past examples, simulations, or theoretical performance discussed during the program do not
                        guarantee or imply any future returns.
                    </li>
                    <li>
                        By enrolling, the subscriber confirms they are joining voluntarily for educational and
                        skill-development purposes only.
                    </li>
                </ul>
            </div>
        </section>
    );
}

/* ================= FORM VIEW ================= */
function FormView({ plan, form, onChange, onSubmit, onBack }) {
    return (
        <main className="max-w-xl mx-auto px-5 py-14">
            <button onClick={onBack} className="text-[#9AA4B2] text-sm mb-6">
                ← Back to plans
            </button>
            <div className="rounded-2xl border border-white/10 bg-[#10172A] p-7 sm:p-9">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#9AA4B2] mb-1">
                    Selected Program
                </div>
                <h2 className="text-2xl font-bold mb-1">{plan.title}</h2>
                <div className="text-[#D4AF37] font-semibold mb-7">{fmtINR(plan.price)} · one-time educational fee</div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <Field label="Full Name" required>
                        <input required name="name" value={form.name} onChange={onChange} className="field" />
                    </Field>
                    <Field label="Contact Number" required>
                        <input required type="tel" name="phone" value={form.phone} onChange={onChange} className="field" />
                    </Field>
                    <Field label="Email Address" required>
                        <input required type="email" name="email" value={form.email} onChange={onChange} className="field" />
                    </Field>
                    <Field label="WhatsApp Number" required>
                        <input required type="tel" name="whatsapp" value={form.whatsapp} onChange={onChange} className="field" />
                    </Field>
                    <button
                        type="submit"
                        className="w-full mt-3 py-3.5 rounded-xl font-semibold bg-[#D4AF37] text-[#0A0F1E] hover:opacity-90"
                    >
                        Continue to Agreement
                    </button>
                    <p className="text-[11px] text-[#7C8595] text-center pt-1">
                        Your details are used only to generate your educational subscription agreement.
                    </p>
                </form>
            </div>

            <style>{`
                .field {
                    width: 100%;
                    background: #0E1526;
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 12px;
                    padding: 11px 16px;
                    font-size: 14px;
                    color: #E9ECF1;
                    outline: none;
                }
                .field:focus { border-color: #D4AF37; }
            `}</style>
        </main>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#9AA4B2] mb-1.5 block">
                {label} {required && <span className="text-[#C7102E]">*</span>}
            </label>
            {children}
        </div>
    );
}

/* ================= AGREEMENT VIEW ================= */
function AgreementView({ plan, form, refNo, agreed, setAgreed, onBack, onDownload, pdfReady, onProceed }) {
    return (
        <main className="max-w-2xl mx-auto px-5 py-14">
            <button onClick={onBack} className="text-[#9AA4B2] text-sm mb-6">
                ← Edit details
            </button>
            <div className="rounded-2xl border border-white/10 bg-[#10172A] p-7 sm:p-9">
                <div className="text-center border-b border-white/10 pb-5 mb-5">
                    <h2 className="text-xl font-bold uppercase tracking-wide">
                        Educational Subscription &amp; Risk Disclosure Agreement
                    </h2>
                    <p className="text-[11px] text-[#7C8595] mt-2">Document Ref: {refNo}</p>
                </div>

                <div className="space-y-4 text-[13.5px] text-[#C9CFDA] leading-relaxed max-h-[340px] overflow-y-auto pr-2">
                    <div className="bg-[#0E1526] rounded-xl p-4 grid grid-cols-2 gap-2 text-[12.5px] font-mono">
                        <div><strong>Name:</strong> {form.name}</div>
                        <div><strong>Phone:</strong> {form.phone}</div>
                        <div><strong>Email:</strong> {form.email}</div>
                        <div><strong>WhatsApp:</strong> {form.whatsapp}</div>
                        <div className="col-span-2"><strong>Program:</strong> {plan.title} ({fmtINR(plan.price)})</div>
                    </div>

                    <p>This framework constitutes a formal acknowledgment between <strong>The Financial Doctor</strong> and the subscriber named above.</p>

                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Strictly Educational Content:</strong> All charts, strategies, and case studies shared are exclusively for learning and paper-trading (virtual) practice. Nothing constitutes investment advice.</li>
                        <li><strong>No Buy/Sell Recommendations:</strong> The Financial Doctor does not provide investment advisory services or trading calls under this program.</li>
                        <li><strong>Subscriber's Sole Responsibility:</strong> Any real-money trading decision taken by the subscriber is at their own risk. The Financial Doctor bears no liability for any resulting loss.</li>
                        <li><strong>No Profit Guarantees:</strong> Past examples or simulations do not guarantee future performance.</li>
                        <li><strong>Not SEBI-Registered Advisory Service:</strong> This is an educational subscription only; no personalised investment advice is rendered.</li>
                    </ol>
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-5 h-5"
                    />
                    <span className="text-[12px] text-[#C9CFDA]">
                        I, {form.name || "the subscriber"}, confirm I have read and understood the above declarations.
                        I understand this program is for education and paper-trading practice only, and that I alone
                        am responsible for any real-money trading decisions.
                    </span>
                </label>

                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                    <button
                        onClick={onDownload}
                        className="flex-1 py-3 rounded-xl font-medium border border-white/15 text-[#E9ECF1] hover:bg-white/5"
                    >
                        {pdfReady ? "✓ Agreement PDF Downloaded" : "Download Agreement (PDF)"}
                    </button>
                    <button
                        onClick={onProceed}
                        disabled={!agreed}
                        className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "#D4AF37", color: "#0A0F1E" }}
                    >
                        Approve &amp; Continue to Payment
                    </button>
                </div>
            </div>
        </main>
    );
}

/* ================= PAYMENT VIEW (UI only — no live API yet) ================= */
function PaymentView({ plan, refNo, onBack }) {
    return (
        <main className="max-w-lg mx-auto px-5 py-14">
            <button onClick={onBack} className="text-[#9AA4B2] text-sm mb-6">
                ← Back to agreement
            </button>
            <div className="rounded-2xl border border-white/10 bg-[#10172A] p-7 sm:p-9">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#9AA4B2] mb-1">Order Summary</div>
                <h2 className="text-xl font-bold mb-1">{plan.title}</h2>
                <div className="text-2xl font-extrabold text-[#D4AF37] mb-6">{fmtINR(plan.price)}</div>

                <div className="space-y-3 mb-7">
                    {["UPI", "Credit / Debit Card", "Net Banking"].map((m) => (
                        <div
                            key={m}
                            className="flex items-center justify-between border border-white/10 rounded-xl px-4 py-3 text-[14px] opacity-60"
                        >
                            <span>{m}</span>
                            <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded-full">
                                Coming Soon
                            </span>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl bg-[#0E1526] border border-[#D4AF37]/30 p-4 text-[12.5px] text-[#C9CFDA] mb-6">
                    🔒 Secure payment gateway integration is being activated. Once live, you'll be able to pay
                    instantly via UPI, Card or Net Banking. For now, our team will contact you on your registered
                    WhatsApp number to confirm enrollment for Reference {refNo}.
                </div>

                <button
                    disabled
                    className="w-full py-3.5 rounded-xl font-semibold bg-white/10 text-[#9AA4B2] cursor-not-allowed"
                >
                    Pay {fmtINR(plan.price)} (Activating Soon)
                </button>
            </div>
        </main>
    );
}

function Footer() {
    return (
        <footer className="border-t border-white/10 py-8 text-center">
            <p className="text-[11px] text-[#7C8595] max-w-2xl mx-auto px-5 leading-relaxed">
                The Financial Doctor — Research Learning Hub. This page and all content within it are for
                <strong> educational purposes only</strong> and do not constitute investment advice. Stock market
                investments are subject to market risk. The Financial Doctor does not guarantee any returns and
                bears no liability for losses arising from independent trading decisions.
            </p>
        </footer>
    );
}
