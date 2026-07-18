import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import About from "@/components/About";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

// 📸 Placeholder professional images — replace with your own branded/licensed
// photography before going live (these are temporary stock placeholders).
const IMG_TEAM = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80";
const IMG_CLIENT = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80";
const IMG_PARTNER = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900&q=80";

const partners = [
  { name: "Asset Plus", role: "Mutual Fund Digital Execution Partner" },
  { name: "AMFI (ARN-290298)", role: "Registered Mutual Fund Distributor" },
  { name: "Leading Insurers", role: "Life, Health & Motor Insurance Partners" },
];

const aboutFAQ = {
  en: [
    { q: "What does The Financial Doctor do?", a: "We help individuals and families plan their mutual fund investments and insurance coverage with a goal-first, transparent approach — no hidden charges, no jargon." },
    { q: "Is The Financial Doctor AMFI registered?", a: "Yes, we are a registered Mutual Fund Distributor (ARN-290298) under AMFI, which means our recommendations follow regulatory guidelines." },
    { q: "Who runs The Financial Doctor?", a: "The Financial Doctor is led by Sagar Chaturvedi along with a growing team of advisors, supported by digital partners like Asset Plus for seamless execution." },
    { q: "Do you only deal with mutual funds?", a: "No — we also advise on life, health, term, and motor insurance, along with tax planning and goal-based financial planning." },
    { q: "How do you make recommendations?", a: "We assess your goals, income, risk appetite, and time horizon before suggesting any product — nothing is generic or one-size-fits-all." },
    { q: "Can I track my investments online?", a: "Yes, through our digital partner Asset Plus, you get a dashboard to track your portfolio anytime, anywhere." },
    { q: "Do you charge for the first consultation?", a: "No, your first consultation with us is completely free with no obligation to invest." },
    { q: "Is my data and money safe with you?", a: "Your investments stay directly with the AMC/insurer in your name — we never hold your money. We only facilitate and advise." },
  ],
  hi: [
    { q: "The Financial Doctor क्या काम करती है?", a: "हम परिवारों और व्यक्तियों को म्यूचुअल फंड निवेश और इंश्योरेंस की सही प्लानिंग में मदद करते हैं — बिना किसी छुपे चार्ज और कठिन भाषा के।" },
    { q: "क्या The Financial Doctor AMFI रजिस्टर्ड है?", a: "हाँ, हम AMFI के अंतर्गत रजिस्टर्ड म्यूचुअल फंड डिस्ट्रीब्यूटर हैं (ARN-290298), यानी हमारी सलाह नियमों के अनुसार होती है।" },
    { q: "The Financial Doctor को कौन चलाता है?", a: "इसे सागर चतुर्वेदी लीड करते हैं, साथ में एडवाइजर्स की टीम और Asset Plus जैसे डिजिटल पार्टनर का सहयोग है।" },
    { q: "क्या आप सिर्फ म्यूचुअल फंड में ही सलाह देते हैं?", a: "नहीं — हम लाइफ, हेल्थ, टर्म और मोटर इंश्योरेंस के साथ-साथ टैक्स प्लानिंग में भी मदद करते हैं।" },
    { q: "आप सलाह कैसे देते हैं?", a: "हम आपके गोल, इनकम, रिस्क और समय सीमा को समझकर ही कोई प्रोडक्ट सुझाते हैं, कोई भी सलाह सामान्य नहीं होती।" },
    { q: "क्या मैं अपने निवेश को ऑनलाइन ट्रैक कर सकता हूँ?", a: "हाँ, Asset Plus के माध्यम से आपको एक डैशबोर्ड मिलता है जहाँ से आप कभी भी अपना पोर्टफोलियो देख सकते हैं।" },
    { q: "क्या पहली कंसल्टेशन फ्री है?", a: "हाँ, पहली कंसल्टेशन पूरी तरह फ्री है और इसमें निवेश करने की कोई बाध्यता नहीं है।" },
    { q: "क्या मेरा पैसा आपके पास सुरक्षित रहता है?", a: "आपका निवेश सीधे AMC/इंश्योरर के पास आपके नाम पर रहता है — हम कभी आपका पैसा नहीं रखते, सिर्फ सलाह और सुविधा देते हैं।" },
  ],
  hinglish: [
    { q: "The Financial Doctor kya karti hai?", a: "Hum families aur individuals ko mutual fund investment aur insurance planning mein help karte hain — bina kisi hidden charge ya mushkil language ke." },
    { q: "Kya The Financial Doctor AMFI registered hai?", a: "Haan, hum AMFI ke under registered Mutual Fund Distributor hain (ARN-290298), iska matlab hamari advice regulations follow karti hai." },
    { q: "The Financial Doctor ko kaun lead karta hai?", a: "Isko Sagar Chaturvedi lead karte hain, saath mein advisors ki team aur Asset Plus jaisa digital partner support karta hai." },
    { q: "Kya aap sirf mutual funds mein hi advice dete ho?", a: "Nahi — hum life, health, term aur motor insurance ke saath tax planning mein bhi help karte hain." },
    { q: "Aap recommendation kaise dete ho?", a: "Hum aapke goals, income, risk aur time horizon ko samajhkar hi koi product suggest karte hain, kuch bhi generic nahi hota." },
    { q: "Kya main apna investment online track kar sakta hoon?", a: "Haan, Asset Plus ke through aapko ek dashboard milta hai jaha se aap kabhi bhi apna portfolio dekh sakte ho." },
    { q: "Kya first consultation free hai?", a: "Haan, pehli consultation bilkul free hai aur usme invest karne ki koi obligation nahi hai." },
    { q: "Kya mera paisa aapke paas safe rehta hai?", a: "Aapka investment directly AMC/insurer ke paas aapke naam pe rehta hai — hum kabhi aapka paisa nahi rakhte, sirf advice aur facility dete hain." },
  ],
};

export default function AboutPage() {
  return (
    <div className="relative" data-testid="about-page-root">
      <SEO
        title="The Financial Doctor | About Us - Financial Advisory"
        description="Meet The Financial Doctor — an AMFI-registered mutual fund and insurance advisory led by Sagar Chaturvedi, built on transparent, goal-based financial planning."
        keywords="financial advisor India, mutual fund advisor, about The Financial Doctor"
        path="/about"
      />
      <Navbar />
      <main className="pt-24">
        <About />

        {/* COMPANY STORY — focus on the company & where it's headed, not personal stats */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center mb-16">
            <div>
              <h2 className="text-3xl font-serif text-[#0E1B2C] mb-4">
                A Team Building Financial Confidence, One Family at a Time
              </h2>
              <p className="text-[#2A364B]/80 leading-relaxed mb-4">
                The Financial Doctor is an AMFI-registered mutual fund distribution and
                insurance advisory practice, founded with one belief — financial
                planning should be simple, honest, and built around real life goals,
                not just product targets.
              </p>
              <p className="text-[#2A364B]/80 leading-relaxed">
                What started as one advisor's mission to bring clarity to investing has
                grown into a team-driven practice, backed by trusted partners and
                digital infrastructure that makes investing seamless wherever you are.
                The next success story we're building? It could be yours.
              </p>
            </div>
            <img
              src={IMG_TEAM}
              alt="The Financial Doctor advisory team"
              className="rounded-2xl shadow-lg w-full h-80 object-cover"
            />
          </div>

          {/* PARTNERS */}
          <div className="container-x max-w-5xl mx-auto mb-16">
            <h3 className="text-2xl font-serif text-[#0E1B2C] mb-8 text-center">
              Backed by Trusted Partners
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {partners.map((p) => (
                <div key={p.name} className="bg-white border border-[#E2D8C2] rounded-2xl p-6 text-center shadow-sm">
                  <h4 className="font-display text-[#024396] mb-1">{p.name}</h4>
                  <p className="text-sm text-[#2A364B]/80">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PHOTO STRIP */}
          <div className="container-x max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <img src={IMG_CLIENT} alt="Client consultation" className="rounded-2xl shadow-sm w-full h-64 object-cover" />
            <img src={IMG_PARTNER} alt="Partnership and growth" className="rounded-2xl shadow-sm w-full h-64 object-cover" />
          </div>
        </section>

        <FAQSection title="About Us — Frequently Asked Questions" data={aboutFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
