import React from "react";
import PageLayout from "@/components/PageLayout";
import Services from "@/components/Services";
import FAQSection from "@/components/FAQSection";

const IMG_HEALTH = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80";
const IMG_MOTOR = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80";
const IMG_LIFE = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80";
const IMG_TERM = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80";

const insuranceTypes = [
  {
    title: "Health Insurance",
    img: IMG_HEALTH,
    why: "Medical costs in India have risen sharply, and a single hospitalization can wipe out years of savings. Health insurance ensures treatment doesn't come at the cost of your financial goals.",
    points: [
      "Cashless treatment at network hospitals",
      "Covers pre and post hospitalization expenses",
      "Tax benefit under Section 80D",
    ],
  },
  {
    title: "Motor Insurance",
    img: IMG_MOTOR,
    why: "Motor insurance is mandatory by law in India, but beyond compliance, it protects you from heavy repair costs, third-party liability, and theft.",
    points: [
      "Third-party liability is legally required",
      "Comprehensive cover protects your own vehicle too",
      "Add-ons like zero depreciation reduce out-of-pocket cost",
    ],
  },
  {
    title: "Life Insurance",
    img: IMG_LIFE,
    why: "Life insurance ensures your family's financial stability — loan repayments, daily expenses, and future goals — continues uninterrupted if something happens to you.",
    points: [
      "Replaces lost income for dependents",
      "Can be combined with savings/investment components",
      "Tax benefits under Section 80C and 10(10D)",
    ],
  },
  {
    title: "Term Insurance",
    img: IMG_TERM,
    why: "Term insurance gives the highest life cover at the lowest premium — pure protection without any investment component, ideal for young earners and breadwinners.",
    points: [
      "Highest sum assured for the lowest premium",
      "Simple, no-frills financial protection",
      "Critical illness and accidental riders available",
    ],
  },
];

const servicesFAQ = {
  en: [
    { q: "Which insurance should I buy first?", a: "Term insurance and health insurance are usually the first two priorities, since they protect against the biggest financial risks — death and medical emergencies." },
    { q: "Can I buy insurance and mutual funds together through you?", a: "Yes, we help you plan both protection (insurance) and growth (mutual funds) as part of one cohesive financial plan." },
    { q: "Do you charge a fee for insurance advice?", a: "Insurance advisory is typically commission-based through the insurer, so there's no separate advisory fee for standard policy guidance." },
    { q: "How much life cover do I need?", a: "A common guideline is 10-15 times your annual income, but it depends on your loans, dependents, and existing savings — we calculate this for you." },
    { q: "Is term insurance better than a regular life policy?", a: "For pure protection, term insurance offers more cover per rupee. Regular/endowment plans combine insurance with investment but usually at lower returns." },
    { q: "Does motor insurance cover natural disasters?", a: "A comprehensive (own-damage) motor policy typically covers flood, fire, and storm damage, while a third-party-only policy does not." },
  ],
  hi: [
    { q: "मुझे पहले कौन सा इंश्योरेंस लेना चाहिए?", a: "टर्म इंश्योरेंस और हेल्थ इंश्योरेंस आमतौर पर पहली प्राथमिकता होती है, क्योंकि ये सबसे बड़े फाइनेंशियल रिस्क — मृत्यु और मेडिकल इमरजेंसी — से बचाते हैं।" },
    { q: "क्या मैं आपके through इंश्योरेंस और म्यूचुअल फंड दोनों ले सकता हूँ?", a: "हाँ, हम प्रोटेक्शन (इंश्योरेंस) और ग्रोथ (म्यूचुअल फंड) दोनों को एक साथ प्लान करने में मदद करते हैं।" },
    { q: "क्या इंश्योरेंस सलाह के लिए कोई फीस लगती है?", a: "इंश्योरेंस एडवाइजरी आमतौर पर इंश्योरर के कमीशन पर आधारित होती है, इसलिए सामान्य पॉलिसी गाइडेंस के लिए अलग से फीस नहीं लगती।" },
    { q: "मुझे कितना लाइफ कवर लेना चाहिए?", a: "सामान्य नियम है आपकी सालाना इनकम का 10-15 गुना, लेकिन यह आपके लोन, डिपेंडेंट्स और सेविंग्स पर निर्भर करता है — यह हम कैलकुलेट करते हैं।" },
    { q: "क्या टर्म इंश्योरेंस रेगुलर लाइफ पॉलिसी से बेहतर है?", a: "सिर्फ प्रोटेक्शन के लिए टर्म इंश्योरेंस ज्यादा कवर देता है कम प्रीमियम में। एंडोमेंट प्लान इंश्योरेंस और निवेश दोनों मिलाते हैं पर रिटर्न कम होता है।" },
    { q: "क्या मोटर इंश्योरेंस प्राकृतिक आपदा को कवर करता है?", a: "कॉम्प्रिहेंसिव (ओन-डैमेज) मोटर पॉलिसी में फ्लड, फायर और स्टॉर्म डैमेज कवर होता है, जबकि सिर्फ थर्ड-पार्टी पॉलिसी में नहीं।" },
  ],
  hinglish: [
    { q: "Mujhe pehle kaunsa insurance lena chahiye?", a: "Term insurance aur health insurance usually pehli priority hoti hai, kyunki yeh sabse bade financial risk — death aur medical emergency — se bachate hain." },
    { q: "Kya main aapke through insurance aur mutual funds dono le sakta hoon?", a: "Haan, hum protection (insurance) aur growth (mutual funds) dono ko ek saath plan karne mein help karte hain." },
    { q: "Kya insurance advice ke liye koi fee lagti hai?", a: "Insurance advisory generally insurer ke commission pe based hoti hai, isliye normal policy guidance ke liye alag se fee nahi lagti." },
    { q: "Mujhe kitna life cover lena chahiye?", a: "Common rule hai aapki annual income ka 10-15 times, lekin yeh aapke loans, dependents aur savings pe depend karta hai — yeh hum calculate karte hain." },
    { q: "Kya term insurance regular life policy se better hai?", a: "Sirf protection ke liye term insurance zyada cover deta hai kam premium mein. Endowment plans insurance aur investment dono combine karte hain par return kam hota hai." },
    { q: "Kya motor insurance natural disaster cover karta hai?", a: "Comprehensive (own-damage) motor policy mein flood, fire aur storm damage cover hota hai, jabki sirf third-party policy mein nahi." },
  ],
};

export default function ServicesPage() {
  return (
    <PageLayout testId="services-page-root">
        <Services />

        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Why These Insurance Covers Matter
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-10">
              Each type of insurance protects a different part of your life — here's
              why we recommend reviewing all of them.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {insuranceTypes.map((t) => (
                <div key={t.title} className="bg-white border border-[#E2D8C2] rounded-2xl overflow-hidden shadow-sm">
                  <img src={t.img} alt={t.title} className="w-full h-44 object-cover" />
                  <div className="p-6">
                    <h3 className="text-lg font-display text-[#024396] mb-2">{t.title}</h3>
                    <p className="text-sm text-[#2A364B]/80 leading-relaxed mb-3">{t.why}</p>
                    <ul className="space-y-1.5">
                      {t.points.map((p) => (
                        <li key={p} className="text-sm text-[#2A364B]/80 flex gap-2">
                          <span className="text-[#024396] mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection title="Services — Frequently Asked Questions" data={servicesFAQ} />
    </PageLayout>
  );
}
