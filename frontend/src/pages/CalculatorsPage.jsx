import React from "react";
import { useParams } from "react-router-dom"; // 👈 useParams ko import kiya
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Calculators from "@/components/Calculators";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import LanguageToggle from "@/components/LanguageToggle";

// Kept in sync with the real tab ids in components/Calculators.jsx (sip,
// daily, lumpsum, swp, goal, emi, tax, gst, inflation) — every H3 heading
// below is real, crawlable text naming the actual calculator, and each
// title/description pair also doubles as the per-type SEO copy so a search
// for any one of these calculators can land directly on this page.
const calcInfo = [
  { id: "sip", title: "SIP Calculator", text: "Estimate the future value of your monthly SIP investments based on expected annual returns and investment duration.", description: "Free SIP Calculator — estimate the future value of your monthly SIP investment with expected returns, powered by The Financial Doctor's mutual fund advisory." },
  { id: "daily", title: "Daily SIP Calculator", text: "See how small daily investments compound into a large corpus over time — a lighter alternative to a monthly SIP.", description: "Free Daily SIP Calculator — project how small daily mutual fund investments grow over time with compounding." },
  { id: "lumpsum", title: "Lumpsum Calculator", text: "See how a one-time investment can grow over the years with the power of compounding.", description: "Free Lumpsum Calculator — see how a one-time mutual fund investment can grow over the years with compounding." },
  { id: "swp", title: "SWP Calculator", text: "Plan a Systematic Withdrawal Plan — see how long your corpus lasts with regular withdrawals and expected returns.", description: "Free SWP (Systematic Withdrawal Plan) Calculator — plan regular withdrawals from your mutual fund corpus and see how long it lasts." },
  { id: "goal", title: "Goal Planning Calculator", text: "Reverse-calculate the monthly SIP needed to hit a specific future goal amount, like a child's education fund.", description: "Free Goal-Based Investment Calculator — work out the monthly SIP needed to reach any future financial goal." },
  { id: "emi", title: "EMI / Loan Calculator", text: "Calculate your monthly loan EMI for home, car, or personal loans before you commit.", description: "Free EMI Calculator — calculate your monthly loan EMI for home, car, or personal loans instantly." },
  { id: "tax", title: "Income Tax Calculator", text: "Compare old vs new tax regime and estimate potential savings through 80C investments.", description: "Free Income Tax Calculator — compare Old vs New tax regime and estimate your savings through 80C investments." },
  { id: "gst", title: "GST Calculator", text: "Quickly work out GST-inclusive or GST-exclusive amounts for any transaction.", description: "Free GST Calculator online — instantly calculate GST-inclusive or GST-exclusive amounts." },
  { id: "inflation", title: "Future Goal (Inflation) Calculator", text: "See what today's goal amount will really cost in the future once inflation is factored in.", description: "Free Future Goal Calculator — see what your financial goal will really cost after adjusting for inflation." },
];

const calcFAQ = {
  en: [
    { q: "What is a Step-up SIP?", a: "It's a SIP where you increase your monthly investment amount every year by a fixed percentage, matching your rising income over time." },
    { q: "Why is Step-up SIP better than a flat SIP?", a: "Since most people's income grows over time, a step-up SIP helps you invest more as you earn more, leading to a significantly larger corpus over the long run." },
    { q: "What's the difference between Reducing Balance and Fixed Rate EMI?", a: "Reducing Balance calculates interest only on the outstanding loan amount (most bank loans work this way). Fixed Rate charges interest on the full original amount throughout the tenure, making it costlier overall." },
    { q: "How does the Interest-Free SIP suggestion work?", a: "It calculates your total interest payable on the loan, then works out the monthly SIP (at an assumed 12% p.a. return) that could grow to roughly the same amount by the time your loan ends." },
    { q: "Which tax regime should I choose?", a: "If you have significant 80C investments, HRA, or other deductions, the Old Regime is often better. If you have few deductions, the New Regime's lower slabs usually work out cheaper. The calculator shows you both." },
    { q: "Are these calculators accurate?", a: "They provide estimates based on the inputs and assumed rates you enter — actual returns, inflation, and tax rules can vary and are never guaranteed." },
    { q: "Can I get a personalized calculation from an advisor?", a: "Yes, these calculators are a starting point — for a detailed, personalized plan, book a free consultation with our team." },
  ],
  hinglish: [
    { q: "Step-up SIP kya hota hai?", a: "Yeh ek SIP hai jisme aap har saal apni monthly investment amount ko ek fixed percentage se badhate ho, jaise jaise aapki income badhti hai." },
    { q: "Step-up SIP flat SIP se better kyu hai?", a: "Kyunki zyada tar logo ki income time ke saath badhti hai, Step-up SIP aapko zyada earn karne pe zyada invest karne mein help karta hai, jisse long term mein bada corpus banta hai." },
    { q: "Reducing Balance aur Fixed Rate EMI mein kya farak hai?", a: "Reducing Balance mein interest sirf bache hue loan amount pe lagta hai (zyada tar bank loans aise hote hain). Fixed Rate mein interest poore original amount pe lagta hai pure tenure tak, jisse total cost zyada ho jata hai." },
    { q: "Interest-Free SIP suggestion kaise kaam karta hai?", a: "Yeh aapke loan ka total interest calculate karta hai, phir batata hai ki kitni monthly SIP (12% p.a. return maan kar) se loan khatam hone tak roughly utna hi amount ban sakta hai." },
    { q: "Mujhe kaunsa tax regime choose karna chahiye?", a: "Agar aapke 80C investments, HRA ya doosri deductions zyada hain, to Old Regime often better hota hai. Kam deductions ho to New Regime ke lower slabs usually cheaper padte hain. Calculator dono dikhata hai." },
    { q: "Kya yeh calculators accurate hain?", a: "Yeh aapke diye gaye input aur assumed rates ke base pe estimate dete hain — actual returns, inflation aur tax rules vary kar sakte hain, guaranteed nahi hote." },
    { q: "Kya mujhe advisor se personalized calculation mil sakti hai?", a: "Haan, yeh calculators ek starting point hain — detailed aur personalized plan ke liye hamari team se free consultation book karo." },
  ],
};

const DEFAULT_SEO = {
  title: "The Financial Doctor | SIP, Tax, Loan & EMI Calculator - Free Online Tools",
  description: "Free online calculators — SIP Calculator, Income Tax Calculator, EMI/Loan Calculator, Lumpsum Calculator, SWP Calculator, GST Calculator, Goal Planner — all in one place, instant results.",
  keywords: "SIP calculator, EMI calculator, loan calculator, income tax calculator, lumpsum calculator, SWP calculator, GST calculator online, mutual fund calculator, goal based investment calculator",
};

export default function CalculatorsPage() {
  // 1. URL parameter ko read karega (jaise 'sip', 'gst', 'loan-emi')
  const { calculatorType } = useParams();
  const match = calcInfo.find((c) => c.id === calculatorType);
  const seo = match
    ? { title: `${match.title} - Free Online Tool | The Financial Doctor`, description: match.description, keywords: DEFAULT_SEO.keywords }
    : DEFAULT_SEO;

  return (
    <div className="relative" data-testid="calculators-page-root">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} path={`/calculators${calculatorType ? `/${calculatorType}` : ""}`} />
      <Navbar />
      <main className="pt-24">
        {/* 3. Hum activeType prop ke roop me calculatorType bhej rahe hain */}
       <Calculators variant="public" activeType={calculatorType} />

        <div className="flex justify-center pt-10">
          <LanguageToggle />
        </div>

        {/* CALCULATOR GUIDE */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Understanding Our Calculators
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-10">
              A quick guide on what each calculator does and when to use it.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {calcInfo.map((c) => (
                <div key={c.title} className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-display text-[#024396] mb-2">{c.title}</h3>
                  <p className="text-sm text-[#2A364B]/80 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#2A364B]/60 text-center mt-10">
              Note: These calculators provide estimates based on assumed rates of
              return and are meant for planning purposes only, not guaranteed returns.
            </p>
          </div>
        </section>

        <FAQSection title="Calculators — Frequently Asked Questions" data={calcFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
