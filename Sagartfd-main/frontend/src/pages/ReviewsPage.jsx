import React from "react";
import Navbar from "@/components/Navbar";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

// 🔗 Replace with your actual Google Business review link
const GOOGLE_REVIEW_LINK = "https://g.page/r/your-business-id/review";

const reviewsFAQ = {
  en: [
    { q: "How are reviews collected?", a: "Reviews are collected directly from clients after their onboarding and review sessions, with their consent to share feedback publicly." },
    { q: "Can I speak to an existing client before deciding?", a: "Yes, on request we can connect you with existing clients (with their permission) who've used similar services to yours." },
    { q: "What if I'm not satisfied with the advice?", a: "We offer a free re-evaluation of your plan at any time — our goal is your financial well-being, not a one-time sale." },
    { q: "Where can I leave a review?", a: "You can leave a review directly on our Google Business profile using the button on this page — it takes less than a minute." },
  ],
  hi: [
    { q: "रिव्यू कैसे लिए जाते हैं?", a: "रिव्यू सीधे क्लाइंट्स से उनके ऑनबोर्डिंग और रिव्यू सेशन के बाद, उनकी सहमति से लिए जाते हैं।" },
    { q: "क्या मैं डिसीजन लेने से पहले किसी क्लाइंट से बात कर सकता हूँ?", a: "हाँ, अनुरोध पर हम आपको (उनकी अनुमति से) मौजूदा क्लाइंट्स से जोड़ सकते हैं।" },
    { q: "अगर मैं सलाह से संतुष्ट नहीं हूँ तो क्या होगा?", a: "हम कभी भी आपकी प्लान का फ्री रीइवैल्यूएशन देते हैं — हमारा लक्ष्य आपकी फाइनेंशियल भलाई है, सिर्फ एक बार की बिक्री नहीं।" },
    { q: "मैं रिव्यू कहाँ दे सकता हूँ?", a: "आप इस पेज पर दिए बटन से हमारे Google Business प्रोफाइल पर सीधे रिव्यू दे सकते हैं — इसमें एक मिनट से कम समय लगता है।" },
  ],
  hinglish: [
    { q: "Reviews kaise collect kiye jaate hain?", a: "Reviews directly clients se unke onboarding aur review session ke baad, unki consent se liye jaate hain." },
    { q: "Kya main decision lene se pehle kisi client se baat kar sakta hoon?", a: "Haan, request pe hum aapko (unki permission se) existing clients se connect kar sakte hain." },
    { q: "Agar main advice se satisfied nahi hoon to kya hoga?", a: "Hum kabhi bhi aapke plan ka free re-evaluation dete hain — hamara goal aapki financial well-being hai, sirf one-time sale nahi." },
    { q: "Main review kaha de sakta hoon?", a: "Aap is page pe diye button se hamare Google Business profile pe directly review de sakte ho — ismein ek minute se kam time lagta hai." },
  ],
};

export default function ReviewsPage() {
  return (
    <div className="relative" data-testid="reviews-page-root">
      <Navbar />
      <main className="pt-24">
        <Reviews />

        {/* REVIEW CTA — encourages happy clients to leave a review */}
        <section className="bg-[#0E1B2C] py-14 px-6 text-center">
          <div className="container-x max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-[#F6F1E8] mb-3">
              Loved working with us?
            </h2>
            <p className="text-[#F6F1E8]/80 mb-6">
              Your experience could be exactly what helps another family take the
              first step towards better financial planning. It takes less than a
              minute to share yours.
            </p>
            <a
              href={GOOGLE_REVIEW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#024396] text-white px-8 py-3 rounded-full font-display hover:bg-[#0356c4] transition-colors"
            >
              Leave a Google Review
            </a>
          </div>
        </section>

        <FAQSection title="Reviews — Frequently Asked Questions" data={reviewsFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
