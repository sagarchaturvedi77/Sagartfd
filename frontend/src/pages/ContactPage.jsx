import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

const info = [
  { title: "Response Time", text: "We typically respond to enquiries within 24 working hours over call, WhatsApp, or email." },
  { title: "Free First Consultation", text: "Your first consultation with our advisors is completely free, with no obligation to invest." },
  { title: "Service Availability", text: "We currently assist clients across India remotely via video calls, in addition to in-person meetings where available." },
];

const contactFAQ = {
  en: [
    { q: "How quickly will I get a response?", a: "We aim to respond within 24 working hours over call, WhatsApp, or email." },
    { q: "Is the first consultation really free?", a: "Yes, completely free with no obligation to invest or buy any policy." },
    { q: "Can I have a video consultation instead of meeting in person?", a: "Yes, most of our clients across India are served through video consultations for convenience." },
    { q: "What should I keep ready before the call?", a: "A rough idea of your monthly income, existing investments/insurance, and your financial goals helps us advise you faster." },
  ],
  hi: [
    { q: "मुझे जवाब कितनी जल्दी मिलेगा?", a: "हम कॉल, WhatsApp या ईमेल पर 24 कार्य घंटों के अंदर जवाब देने की कोशिश करते हैं।" },
    { q: "क्या पहली कंसल्टेशन सच में फ्री है?", a: "हाँ, पूरी तरह फ्री है और इसमें निवेश या पॉलिसी खरीदने की कोई बाध्यता नहीं है।" },
    { q: "क्या मैं आमने-सामने मिलने के बजाय वीडियो कंसल्टेशन ले सकता हूँ?", a: "हाँ, भारत भर के हमारे ज्यादातर क्लाइंट्स की सुविधा के लिए वीडियो कंसल्टेशन से सेवा दी जाती है।" },
    { q: "कॉल से पहले मुझे क्या तैयार रखना चाहिए?", a: "आपकी मासिक इनकम, मौजूदा निवेश/इंश्योरेंस और फाइनेंशियल गोल्स का एक अंदाज़ा हमें तेजी से सलाह देने में मदद करता है।" },
  ],
  hinglish: [
    { q: "Mujhe response kitni jaldi milega?", a: "Hum call, WhatsApp ya email pe 24 working hours ke andar respond karne ki koshish karte hain." },
    { q: "Kya pehli consultation sach mein free hai?", a: "Haan, bilkul free hai aur usme invest karne ya policy lene ki koi obligation nahi hai." },
    { q: "Kya main face-to-face meeting ke bajaye video consultation le sakta hoon?", a: "Haan, India bhar ke hamare zyada tar clients ko convenience ke liye video consultation se serve kiya jaata hai." },
    { q: "Call se pehle mujhe kya ready rakhna chahiye?", a: "Aapki monthly income, existing investment/insurance aur financial goals ka thoda idea hone se hum jaldi advice de paate hain." },
  ],
};

export default function ContactPage() {
  return (
    <div className="relative" data-testid="contact-page-root">
      <SEO
        title="The Financial Doctor | Contact Us"
        description="Get in touch with The Financial Doctor for mutual fund, SIP, and insurance advisory — free first consultation, quick response over call, WhatsApp, or email."
        keywords="contact financial advisor, mutual fund advisor near me, free consultation"
        path="/contact"
      />
      <Navbar />
      <main className="pt-24">
        <Contact />

        {/* EXTRA DETAILED CONTENT */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif text-[#0E1B2C] mb-8 text-center">
              Before You Reach Out
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {info.map((i) => (
                <div key={i.title} className="bg-white border border-[#E2D8C2] rounded-2xl p-6 shadow-sm">
                  <h3 className="font-display text-[#024396] mb-2">{i.title}</h3>
                  <p className="text-sm text-[#2A364B]/80 leading-relaxed">{i.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQSection title="Contact — Frequently Asked Questions" data={contactFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
