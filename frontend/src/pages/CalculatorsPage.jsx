import React from "react";
import Navbar from "@/components/Navbar";
import Calculators from "@/components/Calculators";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import StepUpSipCalculator from "@/components/StepUpSipCalculator";

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
    { q: "Are these calculators accurate?", a: "They provide estimates based on the inputs and assumed rate of return you enter — actual market returns will vary and are never guaranteed." },
    { q: "Can I get a personalized calculation from an advisor?", a: "Yes, these calculators are a starting point — for a detailed, personalized plan, book a free consultation with our team." },
  ],
  hi: [
    { q: "Step-up SIP क्या है?", a: "यह एक SIP है जिसमें आप हर साल अपनी मासिक निवेश राशि को एक तय प्रतिशत से बढ़ाते हैं, जैसे-जैसे आपकी इनकम बढ़ती है।" },
    { q: "Step-up SIP फ्लैट SIP से बेहतर क्यों है?", a: "क्योंकि ज्यादातर लोगों की इनकम समय के साथ बढ़ती है, Step-up SIP आपको ज्यादा कमाने पर ज्यादा निवेश करने में मदद करता है, जिससे लंबे समय में बड़ा फंड बनता है।" },
    { q: "क्या ये कैलकुलेटर सटीक हैं?", a: "ये आपके दिए गए इनपुट और अनुमानित रिटर्न के आधार पर अनुमान देते हैं — असली मार्केट रिटर्न अलग हो सकता है और गारंटीड नहीं होता।" },
    { q: "क्या मुझे एडवाइजर से personalized calculation मिल सकती है?", a: "हाँ, ये कैलकुलेटर शुरुआत हैं — विस्तृत और personalized प्लान के लिए हमारी टीम से फ्री कंसल्टेशन बुक करें।" },
  ],
  hinglish: [
    { q: "Step-up SIP kya hota hai?", a: "Yeh ek SIP hai jisme aap har saal apni monthly investment amount ko ek fixed percentage se badhate ho, jaise jaise aapki income badhti hai." },
    { q: "Step-up SIP flat SIP se better kyu hai?", a: "Kyunki zyada tar logo ki income time ke saath badhti hai, Step-up SIP aapko zyada earn karne pe zyada invest karne mein help karta hai, jisse long term mein bada corpus banta hai." },
    { q: "Kya yeh calculators accurate hain?", a: "Yeh aapke diye gaye input aur assumed return ke base pe estimate dete hain — actual market returns vary kar sakte hain aur guaranteed nahi hote." },
    { q: "Kya mujhe advisor se personalized calculation mil sakti hai?", a: "Haan, yeh calculators ek starting point hain — detailed aur personalized plan ke liye hamari team se free consultation book karo." },
  ],
};

export default function CalculatorsPage() {
  return (
    <div className="relative" data-testid="calculators-page-root">
      <Navbar />
      <main className="pt-24">
        <Calculators />

        {/* EXTRA: STEP-UP SIP CALCULATOR */}
        <section className="bg-white py-16 px-6">
          <div className="container-x max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Plan Smarter: Step-up SIP
            </h2>
            <p className="text-[#2A364B]/80 text-center mb-8">
              See how increasing your SIP every year — instead of keeping it flat —
              can grow your final corpus.
            </p>
            <StepUpSipCalculator />
          </div>
        </section>

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
