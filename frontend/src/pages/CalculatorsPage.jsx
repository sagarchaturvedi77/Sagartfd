import React, { useEffect } from "react";
import { useParams } from "react-router-dom"; // 👈 useParams ko import kiya
import Navbar from "@/components/Navbar";
import Calculators from "@/components/Calculators";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import LanguageToggle from "@/components/LanguageToggle";

const calcInfo = [
  { title: "SIP Calculator", text: "Estimate the future value of your monthly SIP investments based on expected annual returns and investment duration." },
  { title: "Lumpsum Calculator", text: "See how a one-time investment can grow over the years with the power of compounding." },
  { title: "Retirement Calculator", text: "Find out how much corpus you'll need to maintain your lifestyle after retirement, adjusted for inflation." },
  { title: "EMI Calculator", text: "Calculate your monthly loan EMI for home, car, or personal loans before you commit." },
  { title: "Goal Planning Calculator", text: "Reverse-calculate the monthly SIP needed to hit a specific future goal amount, like a child's education fund." },
  { title: "Tax Saving Calculator", text: "Compare old vs new tax regime and estimate potential savings through 80C investments." },
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

export default function CalculatorsPage() {
  // 1. URL parameter ko read karega (jaise 'sip', 'gst', 'loan-emi')
  const { calculatorType } = useParams(); 

  // 2. Dynamic SEO Title Setup: Jaise hi URL badlega, browser ka title badal jayega!
  useEffect(() => {
    if (calculatorType) {
      // Slugs ko clean karke achha dikhane ke liye (e.g. loan-emi -> Loan Emi)
      const cleanTitle = calculatorType
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      document.title = `${cleanTitle} Calculator - The Financial Doctor`;
    } else {
      document.title = "Online Financial Calculators - The Financial Doctor";
    }
  }, [calculatorType]);

  return (
    <div className="relative" data-testid="calculators-page-root">
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
