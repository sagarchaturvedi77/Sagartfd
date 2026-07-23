import React from "react";
import { TrendingUp, ShieldCheck, GraduationCap } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Partnership from "@/components/Partnership";
import ProblemSolution from "@/components/ProblemSolution";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

export const partnerFAQ = {
  en: [
    { q: "What is The Financial Doctor's Partner Program?", a: "It's a program for CAs, insurance agents, freelancers, and aspiring MFDs to build a mutual fund and insurance advisory business using TFD's existing AMC network, compliance handling, and back-office support. For example, a CA with 50 existing tax clients could refer them for SIPs and insurance without setting up their own AMC empanelment from scratch." },
    { q: "Who can become a partner with The Financial Doctor?", a: "CAs, insurance agents, freelancers, and anyone with client relationships who wants to start or grow a financial advisory business can apply." },
    { q: "Do I need to be AMFI certified to join as a partner?", a: "It helps to be AMFI/NISM certified, but if you're not yet certified we can guide you through the certification process to get started." },
    { q: "Can insurance agents join as partners?", a: "Yes, insurance agents are a natural fit, since many of their clients also need mutual fund and broader financial planning support." },
    { q: "Can Chartered Accountants (CAs) join as partners?", a: "Yes, CAs often already have trusted client relationships and can add mutual fund and insurance referrals as an additional service line through this partnership." },
    { q: "Can I be a partner part-time alongside my current job?", a: "Yes, many partners start part-time alongside their existing work and scale up as their client base and AUM grow." },
    { q: "Do I need previous mutual fund distribution experience?", a: "No, prior experience helps but isn't mandatory — we provide guidance to help you get started." },
    { q: "How does the commission structure work?", a: "Partners earn a share of the distributor commission TFD receives from AMCs/insurers when their referred clients invest or buy a policy, with the exact split discussed during onboarding. For example, if a referred client starts a ₹10,000/month SIP, the partner earns an agreed share of the small trail commission TFD receives on that investment, for as long as it continues." },
    { q: "Who pays the commission — TFD or the client?", a: "The commission comes from the AMC or insurer, the same way it does for any mutual fund distributor — the client is never charged an additional fee for this." },
    { q: "Does becoming a partner cost anything upfront?", a: "There is no upfront program fee to join as a partner; any certification exam fees (like NISM) are standard industry costs, not charged by us." },
    { q: "How is commission split between me and The Financial Doctor?", a: "The split depends on the type of partnership and the back-office services used, and is clearly discussed and agreed before you start referring clients. For instance, a referral-only partner might get a smaller share than a fully AMFI/NISM-certified partner who handles more of the client servicing themselves." },
    { q: "When do I receive my commission payouts?", a: "Payouts are processed on a regular cycle after TFD receives the corresponding commission from the AMC or insurer — exact timelines are shared during onboarding." },
    { q: "Is there a minimum client base required to become a partner?", a: "No strict minimum — some partners start with a handful of relationships and grow steadily over time." },
    { q: "What training do partners receive?", a: "Partners receive guidance on product knowledge, compliance basics, and effective client conversations, building on the AMFI/NISM certification track." },
    { q: "Do I need NISM certification to become a partner?", a: "For full mutual fund distribution activity, NISM certification is required per AMFI/SEBI norms; we help guide you through this if you're not yet certified." },
    { q: "Does The Financial Doctor help me get AMFI/NISM certified?", a: "Yes, we provide guidance on the certification process as part of your onboarding as a partner." },
    { q: "What happens if I'm not yet AMFI certified but want to start?", a: "You can begin as a referral partner while working towards certification, and transition to fuller advisory responsibilities once certified." },
    { q: "What compliance work does TFD handle on my behalf?", a: "We handle AMC empanelment paperwork, KYC processing, and regulatory reporting, so you can focus on client relationships rather than back-office compliance. For example, when you bring in a new client, our team runs their e-KYC and folio setup in the background while you continue the relationship conversation." },
    { q: "Do I need to manage KYC for my clients myself?", a: "No, KYC is processed through our digital partner platform — you help bring the client in, and the compliance machinery is already built." },
    { q: "Who handles regulatory reporting for the business I bring in?", a: "The Financial Doctor's back office handles regulatory reporting so partners aren't burdened with paperwork." },
    { q: "Can I operate under my own brand name as a partner?", a: "This depends on the specific partnership structure — some partners operate under their own client-facing identity while TFD handles the regulatory backend; we can discuss what fits your situation. For example, a partner might present themselves under their own advisory name to clients while all transactions flow through TFD's AMFI registration behind the scenes." },
    { q: "Will my clients know they're working with The Financial Doctor or with me?", a: "Typically both — you remain the primary relationship contact for your clients, while TFD's registration and infrastructure power the execution behind the scenes." },
    { q: "What products can I refer or sell as a partner?", a: "Depending on your certification level, partners can refer clients for mutual funds, SIPs, and various insurance products (term, health, motor, life)." },
    { q: "Can partners sell insurance too, or only mutual funds?", a: "Yes, both — TFD's partnership isn't limited to mutual funds; insurance referrals are also part of the program." },
    { q: "What's the difference between a referral partner and a full MFD partner?", a: "A referral partner introduces clients and earns a referral-based commission, while a full MFD partner (with AMFI/NISM certification) can independently advise and service clients under the broader compliance umbrella. For example, a referral partner might simply introduce a client and step back, while a certified full partner would sit through the goal discussion and fund selection themselves." },
    { q: "Can I grow from a referral partner into a full advisor over time?", a: "Yes, that growth path — from your first referral to running your own book of clients under AMFI/NISM certification — is a core part of how the program is designed." },
    { q: "What kind of back-office support do partners get?", a: "Partners get support with KYC, transaction processing, portfolio tracking dashboards, and regulatory paperwork through our digital partner infrastructure." },
    { q: "Does TFD provide a portfolio tracking dashboard for my clients?", a: "Yes, clients get access to a portfolio tracking dashboard through our digital execution partner, Asset Plus." },
    { q: "Can I track my own commission and client portfolio online?", a: "Yes, partners get visibility into their referred clients' portfolios and their own commission tracking through the same digital infrastructure." },
    { q: "What happens to my clients if I stop being a partner?", a: "Your clients' investments remain safely in their own name with the AMC/insurer regardless of your partner status — we'll discuss a smooth handover of servicing if you choose to step back." },
    { q: "Is there a written agreement for the partnership?", a: "Yes, partnership terms including commission structure and responsibilities are documented in a written agreement before you start referring clients." },
    { q: "Can I bring my existing client base into the partnership?", a: "Yes, many partners start by bringing their existing relationships into the program rather than starting from scratch." },
    { q: "Do I need to relocate to Sehore to become a partner?", a: "No, partners can operate remotely from their own city — our systems and communication are built to support that." },
    { q: "Can I be a partner from another city or state?", a: "Yes, we work with partners across India, not just in Sehore or Madhya Pradesh." },
    { q: "Is the Partner Program open to NRIs?", a: "This depends on specific regulatory eligibility for the role; reach out to discuss your situation and what's possible." },
    { q: "What ongoing support do partners get after onboarding?", a: "Ongoing support includes compliance handling, product updates, back-office assistance, and access to our AMC/insurer network as you grow your business." },
    { q: "Will I get leads from The Financial Doctor, or do I bring my own?", a: "The partnership is primarily built around the relationships and leads you bring, though there may be opportunities to collaborate on broader outreach as the partnership grows." },
    { q: "How is a partner different from an employee of The Financial Doctor?", a: "Partners typically work independently or part-time, building their own client relationships and earning commission-based income, rather than being on TFD's payroll as staff. For example, a partner might run their own CA practice full-time and refer mutual fund clients on the side, unlike a salaried in-house advisor." },
    { q: "Can freelancers or independent professionals join as partners?", a: "Yes, freelancers and independent professionals with client relationships are a good fit for the program." },
    { q: "What if I only want to refer occasional clients, not build a full business?", a: "That's fine — some partners refer clients occasionally rather than building a full-time practice, and the arrangement can flex to that level of involvement. For example, a freelancer might refer just two or three clients a year from their existing network without ever treating it as a full business line." },
    { q: "Is there a target or quota I need to meet as a partner?", a: "No fixed quota is imposed — the program is designed around organic growth of your own client relationships rather than sales targets." },
    { q: "How long does it take to get started as a partner after applying?", a: "After an initial conversation and paperwork, most partners can start referring clients within a couple of weeks, depending on certification status. For example, an already NISM-certified CA could complete onboarding and refer their first client within a week or two." },
    { q: "What documents are needed to become a partner?", a: "Basic KYC documents, PAN, and relevant certification proof (like NISM, if applicable) are typically needed to formalise the partnership." },
    { q: "Does The Financial Doctor provide marketing material for partners?", a: "Yes, partners get access to shared marketing and educational material to support client conversations." },
    { q: "Can I use The Financial Doctor's brand name in my own marketing?", a: "This is discussed as part of the partnership agreement, since brand usage needs to stay consistent with our regulatory registration." },
    { q: "What happens if a client I referred has a complaint?", a: "Complaints are handled through TFD's standard service and compliance process, since the underlying registration and regulatory responsibility sits with us. For example, if a referred client raises a concern about a transaction, TFD's compliance team investigates and resolves it directly, keeping the partner informed throughout." },
    { q: "How does TFD ensure compliance stays intact across all partners?", a: "All partner activity flows through TFD's AMFI-registered infrastructure and compliance processes, ensuring consistent regulatory adherence across the network." },
    { q: "Can I eventually run my own book of clients independently under this program?", a: "Yes, that's the built-in career ladder — growing from referrals to independently running your own client book under AMFI/NISM certification." },
    { q: "Is the Partner Program only for mutual funds, or insurance too?", a: "It covers both mutual funds and insurance, reflecting the full range of services The Financial Doctor offers." },
    { q: "How do I apply to become a partner?", a: "Reach out through our Partner page contact option or WhatsApp — we'll set up an introductory conversation to understand your background and next steps." },
  ],
  hi: [
    { q: "The Financial Doctor का Partner Program क्या है?", a: "यह CAs, इंश्योरेंस एजेंट्स, फ्रीलांसर्स और aspiring MFDs के लिए एक प्रोग्राम है ताकि वे TFD के मौजूदा AMC नेटवर्क, कंप्लायंस हैंडलिंग और बैक-ऑफिस सपोर्ट का इस्तेमाल करके म्यूचुअल फंड और इंश्योरेंस एडवाइजरी बिजनेस बना सकें। उदाहरण के लिए, 50 मौजूदा टैक्स क्लाइंट्स वाला कोई CA, बिना खुद की AMC एम्पैनलमेंट शुरू से बनाए, उन्हें SIP और इंश्योरेंस के लिए रेफर कर सकता है।" },
    { q: "The Financial Doctor के साथ पार्टनर कौन बन सकता है?", a: "CAs, इंश्योरेंस एजेंट्स, फ्रीलांसर्स, और कोई भी जिसके पास क्लाइंट रिलेशनशिप हैं और जो फाइनेंशियल एडवाइजरी बिजनेस शुरू या बड़ा करना चाहता है, अप्लाई कर सकता है।" },
    { q: "क्या पार्टनर बनने के लिए मुझे AMFI सर्टिफाइड होना जरूरी है?", a: "AMFI/NISM सर्टिफाइड होना मददगार है, पर अगर आप अभी सर्टिफाइड नहीं हैं तो हम आपको सर्टिफिकेशन प्रोसेस में गाइड कर सकते हैं ताकि आप शुरुआत कर सकें।" },
    { q: "क्या इंश्योरेंस एजेंट्स पार्टनर बन सकते हैं?", a: "हाँ, इंश्योरेंस एजेंट्स एक नेचुरल फिट हैं, क्योंकि उनके कई क्लाइंट्स को म्यूचुअल फंड और बड़ी फाइनेंशियल प्लानिंग सपोर्ट की भी जरूरत होती है।" },
    { q: "क्या Chartered Accountants (CAs) पार्टनर बन सकते हैं?", a: "हाँ, CAs के पास अक्सर पहले से ही भरोसेमंद क्लाइंट रिलेशनशिप होते हैं और वे इस पार्टनरशिप के जरिए म्यूचुअल फंड और इंश्योरेंस रेफरल को एक अतिरिक्त सर्विस लाइन के रूप में जोड़ सकते हैं।" },
    { q: "क्या मैं अपनी मौजूदा जॉब के साथ पार्ट-टाइम पार्टनर बन सकता हूं?", a: "हाँ, कई पार्टनर्स अपनी मौजूदा जॉब के साथ पार्ट-टाइम शुरुआत करते हैं और उनका क्लाइंट बेस और AUM बढ़ने के साथ स्केल करते हैं।" },
    { q: "क्या मुझे पहले से म्यूचुअल फंड डिस्ट्रीब्यूशन का अनुभव चाहिए?", a: "नहीं, पिछला अनुभव मदद करता है पर अनिवार्य नहीं है — हम आपको शुरुआत करने में गाइडेंस देते हैं।" },
    { q: "कमीशन स्ट्रक्चर कैसे काम करता है?", a: "पार्टनर्स को उस डिस्ट्रीब्यूटर कमीशन का हिस्सा मिलता है जो TFD को AMCs/इंश्योरर से मिलता है जब उनके रेफर किए गए क्लाइंट निवेश करते हैं या पॉलिसी खरीदते हैं, एग्जैक्ट स्प्लिट ऑनबोर्डिंग के दौरान तय होता है। उदाहरण के लिए, अगर कोई रेफर किया गया क्लाइंट ₹10,000/माह की SIP शुरू करता है, तो पार्टनर को उस निवेश पर TFD को मिलने वाले छोटे ट्रेल कमीशन का एक तय हिस्सा मिलता है, जब तक वह SIP चलती रहती है।" },
    { q: "कमीशन कौन देता है — TFD या क्लाइंट?", a: "कमीशन AMC या इंश्योरर से आता है, जैसे किसी भी म्यूचुअल फंड डिस्ट्रीब्यूटर के लिए होता है — क्लाइंट से इसके लिए कभी अतिरिक्त फीस नहीं ली जाती।" },
    { q: "क्या पार्टनर बनने के लिए कोई अपफ्रंट खर्च है?", a: "पार्टनर के रूप में जुड़ने के लिए कोई अपफ्रंट प्रोग्राम फीस नहीं है; कोई भी सर्टिफिकेशन एग्जाम फीस (जैसे NISM) स्टैंडर्ड इंडस्ट्री कॉस्ट है, हमारे द्वारा चार्ज नहीं की जाती।" },
    { q: "मेरे और The Financial Doctor के बीच कमीशन कैसे बंटता है?", a: "यह पार्टनरशिप के प्रकार और इस्तेमाल की गई बैक-ऑफिस सर्विसेज पर निर्भर करता है, और आपके क्लाइंट्स रेफर करना शुरू करने से पहले साफ तौर पर डिस्कस और तय किया जाता है। उदाहरण के लिए, एक सिर्फ-रेफरल पार्टनर को एक पूरी तरह AMFI/NISM-सर्टिफाइड पार्टनर से कम हिस्सा मिल सकता है जो खुद ज्यादा क्लाइंट सर्विसिंग संभालता है।" },
    { q: "मुझे मेरे कमीशन पेआउट कब मिलते हैं?", a: "TFD को AMC या इंश्योरर से संबंधित कमीशन मिलने के बाद पेआउट एक नियमित साइकल पर प्रोसेस होते हैं — सटीक टाइमलाइन ऑनबोर्डिंग के दौरान शेयर की जाती है।" },
    { q: "क्या पार्टनर बनने के लिए न्यूनतम क्लाइंट बेस जरूरी है?", a: "कोई सख्त न्यूनतम नहीं है — कुछ पार्टनर्स मुट्ठी भर रिलेशनशिप से शुरू करते हैं और समय के साथ लगातार बढ़ते हैं।" },
    { q: "पार्टनर्स को कौन सी ट्रेनिंग मिलती है?", a: "पार्टनर्स को प्रोडक्ट नॉलेज, कंप्लायंस बेसिक्स और असरदार क्लाइंट बातचीत पर गाइडेंस मिलती है, जो AMFI/NISM सर्टिफिकेशन ट्रैक पर आधारित है।" },
    { q: "क्या पार्टनर बनने के लिए NISM सर्टिफिकेशन जरूरी है?", a: "पूरी म्यूचुअल फंड डिस्ट्रीब्यूशन एक्टिविटी के लिए, AMFI/SEBI नॉर्म्स के अनुसार NISM सर्टिफिकेशन जरूरी है; अगर आप अभी सर्टिफाइड नहीं हैं तो हम इसमें गाइड करते हैं।" },
    { q: "क्या The Financial Doctor मुझे AMFI/NISM सर्टिफाइड होने में मदद करती है?", a: "हाँ, हम पार्टनर के रूप में आपकी ऑनबोर्डिंग के हिस्से के तौर पर सर्टिफिकेशन प्रोसेस पर गाइडेंस देते हैं।" },
    { q: "अगर मैं अभी AMFI सर्टिफाइड नहीं हूं पर शुरू करना चाहता हूं तो?", a: "आप सर्टिफिकेशन की दिशा में काम करते हुए एक रेफरल पार्टनर के रूप में शुरुआत कर सकते हैं, और सर्टिफाइड होने के बाद पूरी एडवाइजरी जिम्मेदारियों में ट्रांजिशन कर सकते हैं।" },
    { q: "TFD मेरी ओर से कौन सा कंप्लायंस काम संभालती है?", a: "हम AMC empanelment पेपरवर्क, KYC प्रोसेसिंग और रेगुलेटरी रिपोर्टिंग संभालते हैं, ताकि आप बैक-ऑफिस कंप्लायंस की बजाय क्लाइंट रिलेशनशिप पर फोकस कर सकें। उदाहरण के लिए, जब आप कोई नया क्लाइंट लाते हैं, तो हमारी टीम बैकग्राउंड में उनका e-KYC और फोलियो सेटअप कर देती है जबकि आप रिलेशनशिप बातचीत जारी रखते हैं।" },
    { q: "क्या मुझे अपने क्लाइंट्स का KYC खुद मैनेज करना होगा?", a: "नहीं, KYC हमारे डिजिटल पार्टनर प्लेटफॉर्म के जरिए प्रोसेस होता है — आप क्लाइंट को लाने में मदद करते हैं, और कंप्लायंस मशीनरी पहले से बनी है।" },
    { q: "मेरे लाए गए बिजनेस के लिए रेगुलेटरी रिपोर्टिंग कौन संभालता है?", a: "The Financial Doctor का बैक ऑफिस रेगुलेटरी रिपोर्टिंग संभालता है ताकि पार्टनर्स पर पेपरवर्क का बोझ न पड़े।" },
    { q: "क्या मैं पार्टनर के रूप में अपने ब्रांड नाम के तहत काम कर सकता हूं?", a: "यह खास पार्टनरशिप स्ट्रक्चर पर निर्भर करता है — कुछ पार्टनर्स अपनी खुद की क्लाइंट-फेसिंग पहचान के तहत काम करते हैं जबकि TFD रेगुलेटरी बैकएंड संभालती है; हम आपकी स्थिति के हिसाब से डिस्कस कर सकते हैं। उदाहरण के लिए, कोई पार्टनर क्लाइंट्स के सामने अपने खुद के एडवाइजरी नाम से पेश हो सकता है, जबकि सभी ट्रांजैक्शन पीछे से TFD की AMFI रजिस्ट्रेशन के जरिए होते हैं।" },
    { q: "क्या मेरे क्लाइंट्स को पता चलेगा कि वे The Financial Doctor के साथ काम कर रहे हैं या मेरे साथ?", a: "आमतौर पर दोनों — आप अपने क्लाइंट्स के लिए मुख्य रिलेशनशिप कॉन्टेक्ट बने रहते हैं, जबकि TFD की रजिस्ट्रेशन और इंफ्रास्ट्रक्चर पीछे से एग्जीक्यूशन को पावर देता है।" },
    { q: "पार्टनर के रूप में मैं कौन से प्रोडक्ट रेफर या बेच सकता हूं?", a: "आपके सर्टिफिकेशन लेवल के हिसाब से, पार्टनर्स म्यूचुअल फंड, SIP और कई इंश्योरेंस प्रोडक्ट्स (टर्म, हेल्थ, मोटर, लाइफ) के लिए क्लाइंट रेफर कर सकते हैं।" },
    { q: "क्या पार्टनर्स इंश्योरेंस भी बेच सकते हैं, या सिर्फ म्यूचुअल फंड?", a: "हाँ, दोनों — TFD की पार्टनरशिप सिर्फ म्यूचुअल फंड तक सीमित नहीं है; इंश्योरेंस रेफरल भी प्रोग्राम का हिस्सा हैं।" },
    { q: "रेफरल पार्टनर और फुल MFD पार्टनर में क्या फर्क है?", a: "एक रेफरल पार्टनर क्लाइंट्स को इंट्रोड्यूस करता है और रेफरल-बेस्ड कमीशन कमाता है, जबकि एक फुल MFD पार्टनर (AMFI/NISM सर्टिफिकेशन के साथ) बड़े कंप्लायंस अंब्रेला के तहत स्वतंत्र रूप से क्लाइंट्स को सलाह और सर्विस दे सकता है। उदाहरण के लिए, एक रेफरल पार्टनर सिर्फ क्लाइंट इंट्रोड्यूस करके पीछे हट सकता है, जबकि एक सर्टिफाइड फुल पार्टनर खुद गोल डिस्कशन और फंड सिलेक्शन में शामिल रहेगा।" },
    { q: "क्या मैं समय के साथ रेफरल पार्टनर से फुल एडवाइजर बन सकता हूं?", a: "हाँ, यह ग्रोथ पाथ — आपके पहले रेफरल से लेकर AMFI/NISM सर्टिफिकेशन के तहत अपना खुद का क्लाइंट बुक चलाने तक — प्रोग्राम के डिजाइन का मुख्य हिस्सा है।" },
    { q: "पार्टनर्स को किस तरह का बैक-ऑफिस सपोर्ट मिलता है?", a: "पार्टनर्स को हमारे डिजिटल पार्टनर इंफ्रास्ट्रक्चर के जरिए KYC, ट्रांजैक्शन प्रोसेसिंग, पोर्टफोलियो ट्रैकिंग डैशबोर्ड और रेगुलेटरी पेपरवर्क में सपोर्ट मिलता है।" },
    { q: "क्या TFD मेरे क्लाइंट्स के लिए पोर्टफोलियो ट्रैकिंग डैशबोर्ड देती है?", a: "हाँ, क्लाइंट्स को हमारे डिजिटल एग्जीक्यूशन पार्टनर, Asset Plus के जरिए एक पोर्टफोलियो ट्रैकिंग डैशबोर्ड मिलता है।" },
    { q: "क्या मैं अपना कमीशन और क्लाइंट पोर्टफोलियो ऑनलाइन ट्रैक कर सकता हूं?", a: "हाँ, पार्टनर्स को उसी डिजिटल इंफ्रास्ट्रक्चर के जरिए अपने रेफर किए गए क्लाइंट्स के पोर्टफोलियो और अपने खुद के कमीशन ट्रैकिंग की विजिबिलिटी मिलती है।" },
    { q: "अगर मैं पार्टनर बनना बंद कर दूं तो मेरे क्लाइंट्स का क्या होगा?", a: "आपके पार्टनर स्टेटस की परवाह किए बिना आपके क्लाइंट्स का निवेश सुरक्षित रूप से उनके अपने नाम पर AMC/इंश्योरर के पास रहता है — अगर आप पीछे हटना चुनते हैं तो हम सर्विसिंग की स्मूथ हैंडओवर पर चर्चा करेंगे।" },
    { q: "क्या पार्टनरशिप के लिए कोई लिखित एग्रीमेंट है?", a: "हाँ, कमीशन स्ट्रक्चर और जिम्मेदारियों सहित पार्टनरशिप की शर्तें आपके क्लाइंट्स रेफर करना शुरू करने से पहले एक लिखित एग्रीमेंट में डॉक्यूमेंट की जाती हैं।" },
    { q: "क्या मैं अपना मौजूदा क्लाइंट बेस पार्टनरशिप में ला सकता हूं?", a: "हाँ, कई पार्टनर्स शुरू से शुरुआत करने के बजाय अपनी मौजूदा रिलेशनशिप को प्रोग्राम में लाकर शुरुआत करते हैं।" },
    { q: "क्या पार्टनर बनने के लिए मुझे सीहोर शिफ्ट होना होगा?", a: "नहीं, पार्टनर्स अपने ही शहर से रिमोटली काम कर सकते हैं — हमारे सिस्टम और कम्युनिकेशन इसे सपोर्ट करने के लिए बनाए गए हैं।" },
    { q: "क्या मैं किसी दूसरे शहर या राज्य से पार्टनर बन सकता हूं?", a: "हाँ, हम सिर्फ सीहोर या मध्य प्रदेश में ही नहीं बल्कि पूरे भारत में पार्टनर्स के साथ काम करते हैं।" },
    { q: "क्या Partner Program NRI के लिए भी खुला है?", a: "यह इस भूमिका के लिए खास रेगुलेटरी योग्यता पर निर्भर करता है; अपनी स्थिति और संभावनाओं पर चर्चा करने के लिए संपर्क करें।" },
    { q: "ऑनबोर्डिंग के बाद पार्टनर्स को कौन सा चल रहा सपोर्ट मिलता है?", a: "चल रहे सपोर्ट में कंप्लायंस हैंडलिंग, प्रोडक्ट अपडेट, बैक-ऑफिस असिस्टेंस, और आपके बिजनेस के बढ़ने के साथ हमारे AMC/इंश्योरर नेटवर्क तक एक्सेस शामिल है।" },
    { q: "क्या मुझे The Financial Doctor से लीड्स मिलेंगी, या मुझे अपनी लानी होंगी?", a: "पार्टनरशिप मुख्य रूप से आपके द्वारा लाई गई रिलेशनशिप और लीड्स के इर्द-गिर्द बनी है, हालांकि पार्टनरशिप बढ़ने के साथ बड़े आउटरीच पर सहयोग के मौके भी हो सकते हैं।" },
    { q: "पार्टनर, The Financial Doctor के एम्प्लॉयी से कैसे अलग है?", a: "पार्टनर्स आमतौर पर स्वतंत्र रूप से या पार्ट-टाइम काम करते हैं, अपनी खुद की क्लाइंट रिलेशनशिप बनाते हैं और कमीशन-बेस्ड इनकम कमाते हैं, न कि TFD के स्टाफ के तौर पर पेरोल पर। उदाहरण के लिए, कोई पार्टनर अपनी खुद की CA प्रैक्टिस फुल-टाइम चला सकता है और साथ में म्यूचुअल फंड क्लाइंट्स रेफर कर सकता है, एक सैलरीड इन-हाउस एडवाइजर के उलट।" },
    { q: "क्या फ्रीलांसर या स्वतंत्र प्रोफेशनल्स पार्टनर के रूप में जुड़ सकते हैं?", a: "हाँ, क्लाइंट रिलेशनशिप वाले फ्रीलांसर और स्वतंत्र प्रोफेशनल्स इस प्रोग्राम के लिए अच्छा फिट हैं।" },
    { q: "अगर मैं सिर्फ कभी-कभार क्लाइंट रेफर करना चाहता हूं, पूरा बिजनेस नहीं बनाना चाहता तो?", a: "यह ठीक है — कुछ पार्टनर्स फुल-टाइम प्रैक्टिस बनाने के बजाय कभी-कभार क्लाइंट रेफर करते हैं, और व्यवस्था उस लेवल की भागीदारी के हिसाब से फ्लेक्सिबल हो सकती है। उदाहरण के लिए, कोई फ्रीलांसर अपने मौजूदा नेटवर्क से साल में सिर्फ दो-तीन क्लाइंट्स रेफर कर सकता है, इसे कभी पूरा बिजनेस माने बिना।" },
    { q: "क्या पार्टनर के रूप में मुझे कोई टारगेट या कोटा पूरा करना होगा?", a: "कोई फिक्स्ड कोटा नहीं थोपा जाता — प्रोग्राम सेल्स टारगेट्स की बजाय आपकी खुद की क्लाइंट रिलेशनशिप की ऑर्गेनिक ग्रोथ के आस-पास डिजाइन किया गया है।" },
    { q: "अप्लाई करने के बाद पार्टनर के रूप में शुरुआत करने में कितना समय लगता है?", a: "शुरुआती बातचीत और पेपरवर्क के बाद, ज्यादातर पार्टनर्स सर्टिफिकेशन स्टेटस के आधार पर कुछ हफ्तों के अंदर क्लाइंट रेफर करना शुरू कर सकते हैं। उदाहरण के लिए, पहले से NISM-सर्टिफाइड कोई CA एक-दो हफ्तों के अंदर ऑनबोर्डिंग पूरी करके अपना पहला क्लाइंट रेफर कर सकता है।" },
    { q: "पार्टनर बनने के लिए कौन से डॉक्यूमेंट चाहिए?", a: "बेसिक KYC डॉक्यूमेंट्स, PAN, और संबंधित सर्टिफिकेशन प्रूफ (जैसे NISM, अगर लागू हो) आमतौर पर पार्टनरशिप को फॉर्मलाइज करने के लिए चाहिए होते हैं।" },
    { q: "क्या The Financial Doctor पार्टनर्स के लिए मार्केटिंग मटेरियल देती है?", a: "हाँ, पार्टनर्स को क्लाइंट बातचीत में मदद के लिए शेयर्ड मार्केटिंग और एजुकेशनल मटेरियल का एक्सेस मिलता है।" },
    { q: "क्या मैं अपनी खुद की मार्केटिंग में The Financial Doctor के ब्रांड नाम का इस्तेमाल कर सकता हूं?", a: "यह पार्टनरशिप एग्रीमेंट के हिस्से के रूप में डिस्कस होता है, क्योंकि ब्रांड इस्तेमाल हमारी रेगुलेटरी रजिस्ट्रेशन के साथ consistent रहना चाहिए।" },
    { q: "अगर मेरे रेफर किए क्लाइंट की कोई शिकायत हो तो क्या होगा?", a: "शिकायतें TFD की स्टैंडर्ड सर्विस और कंप्लायंस प्रोसेस के जरिए हैंडल की जाती हैं, क्योंकि अंतर्निहित रजिस्ट्रेशन और रेगुलेटरी जिम्मेदारी हमारे पास होती है। उदाहरण के लिए, अगर कोई रेफर किया गया क्लाइंट किसी ट्रांजैक्शन को लेकर चिंता जताता है, तो TFD की कंप्लायंस टीम सीधे उसकी जांच और समाधान करती है, पार्टनर को पूरी प्रक्रिया में अपडेट रखते हुए।" },
    { q: "TFD कैसे सुनिश्चित करती है कि सभी पार्टनर्स में कंप्लायंस बरकरार रहे?", a: "सभी पार्टनर एक्टिविटी TFD के AMFI-रजिस्टर्ड इंफ्रास्ट्रक्चर और कंप्लायंस प्रोसेस से गुजरती है, जिससे पूरे नेटवर्क में निरंतर रेगुलेटरी पालन सुनिश्चित होता है।" },
    { q: "क्या मैं आखिरकार इस प्रोग्राम के तहत स्वतंत्र रूप से अपना खुद का क्लाइंट बुक चला सकता हूं?", a: "हाँ, यह बिल्ट-इन करियर लैडर है — रेफरल से लेकर AMFI/NISM सर्टिफिकेशन के तहत स्वतंत्र रूप से अपना क्लाइंट बुक चलाने तक बढ़ना।" },
    { q: "क्या Partner Program सिर्फ म्यूचुअल फंड के लिए है, या इंश्योरेंस के लिए भी?", a: "यह म्यूचुअल फंड और इंश्योरेंस दोनों को कवर करता है, जो The Financial Doctor की पूरी सर्विस रेंज को दर्शाता है।" },
    { q: "मैं पार्टनर बनने के लिए कैसे अप्लाई करूं?", a: "हमारे Partner पेज के कॉन्टेक्ट ऑप्शन या WhatsApp के जरिए संपर्क करें — हम आपके बैकग्राउंड और अगले कदम समझने के लिए एक इंट्रोडक्टरी बातचीत सेट करेंगे।" },
  ],
  hinglish: [
    { q: "The Financial Doctor ka Partner Program kya hai?", a: "Yeh CAs, insurance agents, freelancers aur aspiring MFDs ke liye ek program hai taaki woh TFD ke existing AMC network, compliance handling aur back-office support use karke mutual fund aur insurance advisory business bana sakein. Jaise, 50 existing tax clients wala koi CA, apni khud ki AMC empanelment scratch se banaye bina, unhe SIP aur insurance ke liye refer kar sakta hai." },
    { q: "The Financial Doctor ke saath partner kaun ban sakta hai?", a: "CAs, insurance agents, freelancers, aur koi bhi jiske paas client relationships hain aur jo financial advisory business shuru ya bada karna chahta hai, apply kar sakta hai." },
    { q: "Kya partner banne ke liye mujhe AMFI certified hona zaroori hai?", a: "AMFI/NISM certified hona helpful hai, par agar aap abhi certified nahi hain to hum aapko certification process mein guide kar sakte hain taaki aap shuruaat kar sakein." },
    { q: "Kya insurance agents partner ban sakte hain?", a: "Haan, insurance agents ek natural fit hain, kyunki unke kai clients ko mutual fund aur bigger financial planning support ki bhi zaroorat hoti hai." },
    { q: "Kya Chartered Accountants (CAs) partner ban sakte hain?", a: "Haan, CAs ke paas often pehle se hi trusted client relationships hote hain aur woh is partnership ke through mutual fund aur insurance referrals ko ek additional service line ke roop mein jod sakte hain." },
    { q: "Kya main apni current job ke saath part-time partner ban sakta hoon?", a: "Haan, kai partners apni existing job ke saath part-time start karte hain aur unka client base aur AUM badhne ke saath scale karte hain." },
    { q: "Kya mujhe pehle se mutual fund distribution ka experience chahiye?", a: "Nahi, pehle ka experience help karta hai par mandatory nahi hai — hum aapko shuruaat karne mein guidance dete hain." },
    { q: "Commission structure kaise kaam karta hai?", a: "Partners ko us distributor commission ka hissa milta hai jo TFD ko AMCs/insurers se milta hai jab unke referred clients invest karte hain ya policy kharidte hain, exact split onboarding ke dauran decide hota hai. Jaise, agar koi referred client ₹10,000/month ki SIP shuru karta hai, to partner ko us investment pe TFD ko milne wale chhote trail commission ka ek tay hissa milta hai, jab tak wo SIP chalti rehti hai." },
    { q: "Commission kaun deta hai — TFD ya client?", a: "Commission AMC ya insurer se aata hai, jaise kisi bhi mutual fund distributor ke liye hota hai — client se iske liye kabhi extra fee nahi li jaati." },
    { q: "Kya partner banne ke liye koi upfront cost hai?", a: "Partner ke roop mein join karne ke liye koi upfront program fee nahi hai; koi bhi certification exam fee (jaise NISM) standard industry cost hai, hum charge nahi karte." },
    { q: "Mere aur The Financial Doctor ke beech commission kaise split hota hai?", a: "Yeh partnership ke type aur use ki gayi back-office services pe depend karta hai, aur aapke clients refer karna shuru karne se pehle clearly discuss aur agree kiya jaata hai. Jaise, ek sirf-referral partner ko ek pura AMFI/NISM-certified partner se kam hissa mil sakta hai jo khud zyada client servicing sambhalta hai." },
    { q: "Mujhe mere commission payouts kab milte hain?", a: "TFD ko AMC ya insurer se corresponding commission milne ke baad payouts ek regular cycle pe process hote hain — exact timelines onboarding ke dauran share ki jaati hain." },
    { q: "Kya partner banne ke liye minimum client base zaroori hai?", a: "Koi strict minimum nahi hai — kuch partners mutthi bhar relationships se start karte hain aur time ke saath steadily badhte hain." },
    { q: "Partners ko kaunsi training milti hai?", a: "Partners ko product knowledge, compliance basics aur effective client conversations pe guidance milti hai, jo AMFI/NISM certification track pe based hai." },
    { q: "Kya partner banne ke liye NISM certification zaroori hai?", a: "Full mutual fund distribution activity ke liye, AMFI/SEBI norms ke according NISM certification zaroori hai; agar aap abhi certified nahi hain to hum isme guide karte hain." },
    { q: "Kya The Financial Doctor mujhe AMFI/NISM certified hone mein help karti hai?", a: "Haan, hum partner ke roop mein aapki onboarding ke hisse ke taur pe certification process pe guidance dete hain." },
    { q: "Agar main abhi AMFI certified nahi hoon par shuru karna chahta hoon to?", a: "Aap certification ki taraf kaam karte hue ek referral partner ke roop mein shuru kar sakte ho, aur certified hone ke baad fuller advisory responsibilities mein transition kar sakte ho." },
    { q: "TFD meri taraf se kaunsa compliance kaam sambhalti hai?", a: "Hum AMC empanelment paperwork, KYC processing aur regulatory reporting sambhalte hain, taaki aap back-office compliance ke bajaye client relationships pe focus kar sakein. Jaise, jab aap koi naya client laate ho, to hamari team background mein unka e-KYC aur folio setup kar deti hai jabki aap relationship baatcheet jaari rakhte ho." },
    { q: "Kya mujhe apne clients ka KYC khud manage karna hoga?", a: "Nahi, KYC hamare digital partner platform ke through process hota hai — aap client ko laane mein help karte ho, aur compliance machinery pehle se bani hai." },
    { q: "Mere laaye gaye business ke liye regulatory reporting kaun sambhalta hai?", a: "The Financial Doctor ka back office regulatory reporting sambhalta hai taaki partners pe paperwork ka bojh na pade." },
    { q: "Kya main partner ke roop mein apne khud ke brand naam ke under kaam kar sakta hoon?", a: "Yeh specific partnership structure pe depend karta hai — kuch partners apni khud ki client-facing identity ke under kaam karte hain jabki TFD regulatory backend sambhalti hai; hum aapki situation ke hisaab se discuss kar sakte hain. Jaise, koi partner clients ke saamne apne khud ke advisory naam se present ho sakta hai, jabki sabhi transactions peeche se TFD ki AMFI registration ke through hote hain." },
    { q: "Kya mere clients ko pata chalega ki woh The Financial Doctor ke saath kaam kar rahe hain ya mere saath?", a: "Usually dono — aap apne clients ke liye primary relationship contact bane rehte ho, jabki TFD ki registration aur infrastructure peeche se execution ko power deta hai." },
    { q: "Partner ke roop mein main kaunse products refer ya bech sakta hoon?", a: "Aapke certification level ke hisaab se, partners mutual funds, SIP aur kai insurance products (term, health, motor, life) ke liye clients refer kar sakte hain." },
    { q: "Kya partners insurance bhi bech sakte hain, ya sirf mutual funds?", a: "Haan, dono — TFD ki partnership sirf mutual funds tak limited nahi hai; insurance referrals bhi program ka hissa hain." },
    { q: "Referral partner aur full MFD partner mein kya farak hai?", a: "Ek referral partner clients ko introduce karta hai aur referral-based commission kamata hai, jabki ek full MFD partner (AMFI/NISM certification ke saath) bigger compliance umbrella ke under independently clients ko advise aur service kar sakta hai. Jaise, ek referral partner sirf client introduce karke peeche hat sakta hai, jabki ek certified full partner khud goal discussion aur fund selection mein shamil rahega." },
    { q: "Kya main time ke saath referral partner se full advisor ban sakta hoon?", a: "Haan, yeh growth path — aapke pehle referral se lekar AMFI/NISM certification ke under apna khud ka client book chalane tak — program ke design ka core part hai." },
    { q: "Partners ko kis tarah ka back-office support milta hai?", a: "Partners ko hamare digital partner infrastructure ke through KYC, transaction processing, portfolio tracking dashboards aur regulatory paperwork mein support milta hai." },
    { q: "Kya TFD mere clients ke liye portfolio tracking dashboard deti hai?", a: "Haan, clients ko hamare digital execution partner, Asset Plus ke through ek portfolio tracking dashboard milta hai." },
    { q: "Kya main apna commission aur client portfolio online track kar sakta hoon?", a: "Haan, partners ko usi digital infrastructure ke through apne referred clients ke portfolios aur apne khud ke commission tracking ki visibility milti hai." },
    { q: "Agar main partner banna band kar doon to mere clients ka kya hoga?", a: "Aapke partner status ki parwa kiye bina aapke clients ka investment safely unke apne naam pe AMC/insurer ke paas rehta hai — agar aap step back karna choose karte ho to hum servicing ki smooth handover pe discuss karenge." },
    { q: "Kya partnership ke liye koi written agreement hai?", a: "Haan, commission structure aur responsibilities samet partnership ki terms aapke clients refer karna shuru karne se pehle ek written agreement mein documented ki jaati hain." },
    { q: "Kya main apna existing client base partnership mein la sakta hoon?", a: "Haan, kai partners scratch se shuruaat karne ke bajaye apni existing relationships ko program mein laakar shuruaat karte hain." },
    { q: "Kya partner banne ke liye mujhe Sehore shift hona hoga?", a: "Nahi, partners apne hi city se remotely kaam kar sakte hain — hamare systems aur communication ise support karne ke liye bane hain." },
    { q: "Kya main kisi doosre city ya state se partner ban sakta hoon?", a: "Haan, hum sirf Sehore ya Madhya Pradesh mein hi nahi balki poore India mein partners ke saath kaam karte hain." },
    { q: "Kya Partner Program NRIs ke liye bhi open hai?", a: "Yeh is role ke liye specific regulatory eligibility pe depend karta hai; apni situation aur possibilities discuss karne ke liye contact karo." },
    { q: "Onboarding ke baad partners ko kaunsa ongoing support milta hai?", a: "Ongoing support mein compliance handling, product updates, back-office assistance, aur aapke business badhne ke saath hamare AMC/insurer network tak access shamil hai." },
    { q: "Kya mujhe The Financial Doctor se leads milengi, ya mujhe apni laani hongi?", a: "Partnership primarily aapke laaye gaye relationships aur leads ke around bani hai, halanki partnership badhne ke saath bade outreach pe collaborate karne ke opportunities bhi ho sakte hain." },
    { q: "Partner, The Financial Doctor ke employee se kaise different hai?", a: "Partners usually independently ya part-time kaam karte hain, apni khud ki client relationships banate hain aur commission-based income kamate hain, na ki TFD ke staff ke taur pe payroll pe. Jaise, koi partner apni khud ki CA practice full-time chala sakta hai aur saath mein mutual fund clients refer kar sakta hai, ek salaried in-house advisor ke ulat." },
    { q: "Kya freelancers ya independent professionals partner ke roop mein jud sakte hain?", a: "Haan, client relationships wale freelancers aur independent professionals is program ke liye achha fit hain." },
    { q: "Agar main sirf kabhi-kabhar clients refer karna chahta hoon, poora business nahi banana chahta to?", a: "Yeh theek hai — kuch partners full-time practice banane ke bajaye kabhi-kabhar clients refer karte hain, aur arrangement us level ki involvement ke hisaab se flexible ho sakta hai. Jaise, koi freelancer apne existing network se saal mein sirf do-teen clients refer kar sakta hai, ise kabhi pura business maane bina." },
    { q: "Kya partner ke roop mein mujhe koi target ya quota pura karna hoga?", a: "Koi fixed quota impose nahi kiya jaata — program sales targets ke bajaye aapki khud ki client relationships ki organic growth ke around design kiya gaya hai." },
    { q: "Apply karne ke baad partner ke roop mein shuruaat karne mein kitna time lagta hai?", a: "Initial baatcheet aur paperwork ke baad, zyada tar partners certification status ke aadhar pe kuch hafton ke andar clients refer karna shuru kar sakte hain. Jaise, pehle se NISM-certified koi CA ek-do hafton ke andar onboarding complete karke apna pehla client refer kar sakta hai." },
    { q: "Partner banne ke liye kaunse documents chahiye?", a: "Basic KYC documents, PAN, aur relevant certification proof (jaise NISM, agar applicable ho) usually partnership ko formalise karne ke liye chahiye hote hain." },
    { q: "Kya The Financial Doctor partners ke liye marketing material deti hai?", a: "Haan, partners ko client conversations mein help ke liye shared marketing aur educational material ka access milta hai." },
    { q: "Kya main apni khud ki marketing mein The Financial Doctor ke brand naam ka use kar sakta hoon?", a: "Yeh partnership agreement ke hisse ke roop mein discuss hota hai, kyunki brand usage hamari regulatory registration ke saath consistent rehna chahiye." },
    { q: "Agar mere refer kiye gaye client ki koi complaint ho to kya hoga?", a: "Complaints TFD ke standard service aur compliance process ke through handle ki jaati hain, kyunki underlying registration aur regulatory responsibility hamare paas hoti hai. Jaise, agar koi referred client kisi transaction ko lekar concern raise karta hai, to TFD ki compliance team directly uski investigation aur resolution karti hai, partner ko pure process mein updated rakhte hue." },
    { q: "TFD kaise ensure karti hai ki sabhi partners mein compliance intact rahe?", a: "Sabhi partner activity TFD ke AMFI-registered infrastructure aur compliance processes se guzarti hai, jisse poore network mein consistent regulatory adherence ensure hota hai." },
    { q: "Kya main aakhirkar is program ke under independently apna khud ka client book chala sakta hoon?", a: "Haan, yeh built-in career ladder hai — referrals se lekar AMFI/NISM certification ke under independently apna client book chalane tak badhna." },
    { q: "Kya Partner Program sirf mutual funds ke liye hai, ya insurance ke liye bhi?", a: "Yeh mutual funds aur insurance dono ko cover karta hai, jo The Financial Doctor ki puri service range ko reflect karta hai." },
    { q: "Main partner banne ke liye kaise apply karoon?", a: "Hamare Partner page ke contact option ya WhatsApp ke through reach out karo — hum aapka background aur next steps samajhne ke liye ek introductory baatcheet set karenge." },
  ],
};

const growth = [
  {
    icon: TrendingUp,
    step: "01",
    title: "Grow at your own pace",
    text: "Start part-time alongside your current work as a CA, insurance agent, or freelancer — scale to full-time as your client base and AUM grow.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "Zero compliance headache",
    text: "We handle KYC, empanelment paperwork, and regulatory reporting so you can focus purely on client relationships and referrals.",
  },
  {
    icon: GraduationCap,
    step: "03",
    title: "Built-in career ladder",
    text: "From your first referral to running your own book of clients under AMFI/NISM certification — the same track our internal team has grown through.",
  },
];

export default function PartnerPage() {
  return (
    <div className="relative min-h-screen bg-[#FBF7EE]">
      <SEO
        title="The Financial Doctor | Partner With Us"
        description="Partner with The Financial Doctor — collaborate with an AMFI-registered mutual fund and insurance advisory to grow your client base and referrals."
        keywords="mutual fund partner, insurance referral partner, financial advisor partnership, mutual fund distributor partner program India, become a mutual fund agent, TFD PartnerHub, Sagar Chaturvedi, The Financial Doctor Sehore, mutual fund distributor Madhya Pradesh, AMFI registered mutual fund distributor, ARN-290298"
        path="/partner-with-us"
        ogImage="https://thefinancialdoctor.in/assets/logos/TFD-PARTNERHUB-LOGO.png"
      />
      <Navbar />
      <main>
        {/* "AMBITION LADDER" HERO — plum/violet instead of navy or green, a
            big stacked stat-ladder as the visual anchor (climbing/growth
            metaphor) instead of a photo, chart, or checklist. */}
        <section className="relative overflow-hidden bg-[#241539] pt-28 pb-16 md:pt-32 md:pb-20 px-6">
          <div
            aria-hidden
            className="fund-animate-in absolute -top-10 -right-16 w-[320px] h-[320px] rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle at center, rgba(168,85,247,0.55) 0%, transparent 65%)" }}
          />
          <div className="container-x relative grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
            <div>
              <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A2F6B] bg-[#2E1B47] text-[11px] tracking-[0.2em] uppercase text-[#C9A3F0] font-semibold">
                Partner Program
              </div>
              <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F3EDF8] mt-5 leading-tight">
                Build a business with India's <span className="font-italic-serif" style={{ color: "#C9A3F0" }}>most-loved doctor.</span>
              </h1>
              <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#D4C3E5] text-[15px] sm:text-base max-w-xl leading-relaxed">
                Whether you're a CA, insurance agent, or aspiring MFD — tap into 8 years of trust,
                40+ AMC relationships, and a back-office that handles everything except the client smile.
              </p>
            </div>
            <div className="fund-animate-in fund-animate-in-delay-2 flex flex-col gap-2.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {[
                { value: "40+", label: "AMC partnerships", indent: "" },
                { value: "8 yrs", label: "Track record", indent: "sm:ml-[18px]" },
                { value: "1000+", label: "Families served", indent: "sm:ml-[36px]" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`bg-[#2E1B47] border border-[#4A2F6B] rounded-xl p-4 flex items-center justify-between ${s.indent}`}
                >
                  <span className="text-[13px] text-[#D4C3E5]">{s.label}</span>
                  <span className="font-display text-xl text-[#F3EDF8]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GROWTH STORY — numbered steps instead of a plain icon grid */}
        <section className="bg-white py-14 md:py-16 px-6 border-b border-[#E2D8C2]">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              A growth path, not just a referral fee
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-10">
              Partners don't just earn commissions here — they build a real, compounding book of business.
            </p>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
              {growth.map((g) => {
                const Icon = g.icon;
                return (
                  <div key={g.title} className="shrink-0 w-[82%] snap-center md:w-auto md:shrink bg-[#FBF7EE] border border-[#E2D8C2] rounded-2xl p-6 relative">
                    <div className="absolute top-4 right-5 font-display text-3xl text-[#241539]/10">{g.step}</div>
                    <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] grid place-items-center">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display text-lg text-[#0E1B2C] mt-4 mb-2">{g.title}</h3>
                    <p className="text-sm text-[#2A364B]/80 leading-relaxed">{g.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ProblemSolution
          accent="#8B5CF6"
          problem="Independent CAs, insurance agents, and aspiring MFDs often have the client relationships but not the AMC empanelment, compliance machinery, or back-office to actually service mutual fund business at scale."
          solution="Partner with TFD and use our existing 40+ AMC network, compliance handling, and back-office — you keep the relationship, we handle everything behind it."
        />
        <FAQSection title="Partner Program — Frequently Asked Questions" data={partnerFAQ} />
        <Partnership />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
