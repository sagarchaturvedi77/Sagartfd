import React from "react";
import Navbar from "@/components/Navbar";
import TopFunds from "@/components/TopFunds";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import CompareFunds from "@/components/CompareFunds";

const categories = [
  { title: "Large Cap Funds", text: "Invest in well-established, financially strong companies. Lower volatility, suited for conservative long-term investors." },
  { title: "Mid & Small Cap Funds", text: "Higher growth potential from emerging companies, but with higher volatility — best for longer investment horizons." },
  { title: "Flexi Cap & Multi Cap Funds", text: "Diversified across market caps, giving fund managers flexibility to shift allocation based on market conditions." },
  { title: "ELSS (Tax Saving) Funds", text: "Equity funds with a 3-year lock-in that also qualify for tax deduction under Section 80C." },
  { title: "Debt Funds", text: "Lower-risk funds investing in bonds and fixed-income instruments — suited for short-term goals and capital preservation." },
  { title: "Hybrid Funds", text: "A mix of equity and debt to balance growth potential with relative stability." },
];

const fundsFAQ = {
  en: [
    { q: "How do you select the 'top' funds shown here?", a: "We shortlist funds based on consistency of returns, fund manager track record, expense ratio, and how well they fit common investor goals." },
    { q: "Should I always pick the fund with the highest returns?", a: "No — past returns don't guarantee future performance. Risk level, consistency, and your own goal matter just as much." },
    { q: "What does expense ratio mean?", a: "It's the annual fee charged by the fund house to manage your money, expressed as a percentage of your investment." },
    { q: "Can I compare funds across categories?", a: "Yes, but comparing a small cap fund to a debt fund isn't apples-to-apples — it's better to compare within the same category." },
    { q: "How often should I review my fund picks?", a: "A review every 6-12 months is usually enough, unless there's a major life change or consistent underperformance." },
  ],
  hi: [
    { q: "यहाँ दिखाए गए 'टॉप' फंड्स कैसे चुने जाते हैं?", a: "हम फंड्स को रिटर्न की निरंतरता, फंड मैनेजर के ट्रैक रिकॉर्ड, एक्सपेंस रेशियो और निवेशक के गोल के हिसाब से शॉर्टलिस्ट करते हैं।" },
    { q: "क्या मुझे हमेशा सबसे ज्यादा रिटर्न वाला फंड चुनना चाहिए?", a: "नहीं — पुराना रिटर्न भविष्य की गारंटी नहीं देता। रिस्क लेवल और निरंतरता भी उतनी ही महत्वपूर्ण है।" },
    { q: "एक्सपेंस रेशियो का मतलब क्या है?", a: "यह वह सालाना फीस है जो फंड हाउस आपके पैसे को मैनेज करने के लिए लेता है, आपके निवेश के प्रतिशत के रूप में।" },
    { q: "क्या मैं अलग-अलग कैटेगरी के फंड्स compare कर सकता हूँ?", a: "हाँ, लेकिन स्मॉल कैप और डेट फंड की तुलना करना सही नहीं है — एक ही कैटेगरी में compare करना बेहतर है।" },
    { q: "मुझे अपने फंड्स कितनी बार review करना चाहिए?", a: "हर 6-12 महीने में review करना काफी है, जब तक कोई बड़ा बदलाव या लगातार खराब परफॉरमेंस न हो।" },
  ],
  hinglish: [
    { q: "Yaha dikhaye gaye 'top' funds kaise select kiye jaate hain?", a: "Hum funds ko returns ki consistency, fund manager ke track record, expense ratio aur investor goals ke hisaab se shortlist karte hain." },
    { q: "Kya mujhe hamesha highest return wala fund choose karna chahiye?", a: "Nahi — past returns future performance guarantee nahi karte. Risk level aur consistency bhi equally important hai." },
    { q: "Expense ratio ka matlab kya hota hai?", a: "Yeh wo annual fee hai jo fund house aapke paise manage karne ke liye charge karta hai, aapke investment ke percentage mein." },
    { q: "Kya main different category ke funds compare kar sakta hoon?", a: "Haan, lekin small cap aur debt fund ko compare karna fair nahi hai — same category mein compare karna better hai." },
    { q: "Mujhe apne funds kitni baar review karna chahiye?", a: "Har 6-12 mahine mein review karna kaafi hai, jab tak koi bada life change ya consistent underperformance na ho." },
  ],
};

export default function TopFundsPage() {
  return (
    <div className="relative" data-testid="top-funds-page-root">
      <Navbar />
      <main className="pt-24">
        <TopFunds />

        {/* FUND CATEGORIES */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Fund Categories Explained
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-10">
              Not sure which type of fund fits your goal? Here's a quick breakdown.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {categories.map((c) => (
                <div key={c.title} className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-display text-[#024396] mb-2">{c.title}</h3>
                  <p className="text-sm text-[#2A364B]/80 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#2A364B]/60 text-center">
              Mutual fund investments are subject to market risks. Past performance
              is not indicative of future returns. Please read scheme documents carefully.
            </p>
          </div>
        </section>

        {/* COMPARE FUNDS TOOL */}
        <CompareFunds />

        <FAQSection title="Top Funds — Frequently Asked Questions" data={fundsFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
