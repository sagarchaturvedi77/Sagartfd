import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Linkedin, MapPin, ChevronDown, ShieldOff, Languages, Video } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import About from "@/components/About";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import ProblemSolution from "@/components/ProblemSolution";
import { LINKS } from "@/lib/links";

const SAGAR_PHOTO = "/assets/founder/sagar-photo.webp";

// Pan-India reach, told through how differently each region actually
// relates to money — not a generic "we serve everywhere" coverage map.
// Each note echoes the same regional voice used on the city landing
// pages (see cityPages.js's cultureLine), and links there for anyone
// who wants their own city's page specifically.
const regions = [
  { name: "Madhya Pradesh", href: "/mutual-fund-distributor-in-madhya-pradesh", note: "Where we started — Sehore, Bhopal, Indore and the smaller towns between them, often met in person." },
  { name: "Gujarat", href: "/mutual-fund-distributor-in-gujarat", note: "Ahmedabad to Surat to Dwarka — a culture of business instinct, matched with a written plan behind it." },
  { name: "Maharashtra", href: "/mutual-fund-distributor-in-maharashtra", note: "Mumbai's speed, Pune's precision, Nagpur's calm — three tempos, the same underlying discipline." },
  { name: "Delhi NCR", href: "/mutual-fund-distributor-in-delhi", note: "Delhi, Gurgaon, Noida — ambition that gets loud; SIPs are the one habit here built to stay quiet." },
  { name: "Rajasthan", href: "/mutual-fund-distributor-in-rajasthan", note: "Jaipur's forts were built to outlast centuries — we ask the same patience of a portfolio." },
  { name: "South India", href: "/mutual-fund-distributor-in-bangalore", note: "Bengaluru, Hyderabad, Chennai — from RSU-heavy tech income to a gold-and-FD-first savings culture, met without judgment either way." },
  { name: "West Bengal", href: "/mutual-fund-distributor-in-kolkata", note: "Kolkata's centuries of trading culture — market-literate clients, just missing one written plan." },
  { name: "Punjab, UP & Bihar", href: "/mutual-fund-distributor-in-punjab", note: "Ludhiana's karobaris, Lucknow's tehzeeb, Patna's next generation abroad — different stories, same goal-first process." },
];

// The journey, as milestones — replaces generic Western stock photography
// with something that's actually TFD's own story and reads as authentically
// local (Sehore, MP) rather than a stock "team meeting" photo of strangers.
const journey = [
  { year: "2021", text: "Started as a single advisor's mission — bring honest, jargon-free financial guidance to Sehore." },
  { year: "2022", text: "Crossed 250 families served; began building the AMC and insurer partner network that now spans 40+ partners." },
  { year: "2023", text: "Received the Investment Awareness Excellence Award for outreach and financial-literacy workshops." },
  { year: "2024", text: "Digitised the practice end-to-end — live portfolio tracking, online proposals, and a dedicated staff team." },
  { year: "Today", text: "1000+ families across Madhya Pradesh, still built on the same one-family-at-a-time approach." },
];

const partners = [
  { name: "Asset Plus", role: "Mutual Fund Digital Execution Partner" },
  { name: "AMFI (ARN-290298)", role: "Registered Mutual Fund Distributor" },
  { name: "Leading Insurers", role: "Life, Health & Motor Insurance Partners" },
];

export const aboutFAQ = {
  en: [
    { q: "What does The Financial Doctor do?", a: "We help individuals and families plan their mutual fund investments and insurance coverage with a goal-first, transparent approach — no hidden charges, no jargon. For example, a client saving for a child's college fund gets a mix of equity and debt mutual funds mapped to that 10-15 year goal, not a generic one-size product." },
    { q: "Is The Financial Doctor AMFI registered?", a: "Yes, we are a registered Mutual Fund Distributor (ARN-290298) under AMFI, which means our recommendations follow regulatory guidelines — you can verify this ARN yourself on AMFI's official website before investing a rupee." },
    { q: "Who runs The Financial Doctor?", a: "The Financial Doctor is led by Sagar Chaturvedi along with a growing team of advisors, supported by digital partners like Asset Plus for seamless execution." },
    { q: "Do you only deal with mutual funds?", a: "No — we also advise on life, health, term, and motor insurance, along with tax planning and goal-based financial planning. For instance, a client already running SIPs with us might also get a ₹50 lakh term cover reviewed and an ELSS fund suggested each tax season." },
    { q: "How do you make recommendations?", a: "We assess your goals, income, risk appetite, and time horizon before suggesting any product — nothing is generic or one-size-fits-all. For example, a 30-year-old with a 20-year horizon may get a higher equity allocation, while someone five years from retirement gets a more debt-heavy mix." },
    { q: "Can I track my investments online?", a: "Yes, through our digital partner Asset Plus, you get a dashboard to track your portfolio anytime, anywhere — for example, checking your SIP's current value or latest NAV update on your phone at 11pm on a Sunday." },
    { q: "Do you charge for the first consultation?", a: "No, your first consultation with us is completely free with no obligation to invest." },
    { q: "Is my data and money safe with you?", a: "Your investments stay directly with the AMC/insurer in your name — we never hold your money. We only facilitate and advise. For example, when you start an SIP, the folio is created in your name with the fund house, and we simply view the same dashboard you do." },
    { q: "What does ARN-290298 mean?", a: "ARN stands for AMFI Registration Number — the unique ID AMFI issues to certified mutual fund distributors, and ARN-290298 is ours." },
    { q: "What is AMFI?", a: "AMFI (Association of Mutual Funds in India) is the industry body that regulates and certifies mutual fund distributors like us across the country." },
    { q: "Is The Financial Doctor a SEBI-registered Investment Adviser?", a: "No, we are an AMFI-registered Mutual Fund Distributor, not a SEBI-registered Investment Adviser — we earn commission from AMCs/insurers rather than charging advisory fees, and we're upfront about that distinction. For example, we can guide you on which fund category suits your goal, but we wouldn't bill you a flat yearly advisory fee the way a fee-only RIA does." },
    { q: "What's the difference between a mutual fund distributor and an investment adviser?", a: "A distributor like us helps you select and execute suitable products and earns commission from the fund house/insurer, while a SEBI Registered Investment Adviser typically charges a fee for pure advice — both are regulated, but under different frameworks. For instance, an RIA might charge a flat ₹15,000/year regardless of your portfolio size, while our earning is a small trail commission built into the fund's own expense ratio." },
    { q: "Where is The Financial Doctor based?", a: "We're based in Sehore, Madhya Pradesh, and serve clients across India through in-person meetings and video consultations." },
    { q: "Do you serve clients outside Madhya Pradesh?", a: "Yes, we work with clients across India remotely via video calls, in addition to in-person meetings for those nearby. For example, we regularly onboard clients from cities like Mumbai, Bengaluru, or Delhi entirely through video consultations and digital KYC." },
    { q: "How many years has The Financial Doctor been operating?", a: "We've been advising clients for 8+ years, building long-term relationships rather than one-time transactions." },
    { q: "How many families has TFD helped so far?", a: "We've worked with 1000+ families across Madhya Pradesh and beyond on their mutual fund and insurance planning." },
    { q: "Who is Sagar Chaturvedi?", a: "Sagar Chaturvedi is the founder of The Financial Doctor, an AMFI-certified Mutual Fund Distributor (ARN-290298) with 8+ years of advisory experience." },
    { q: "What are Sagar Chaturvedi's qualifications?", a: "Sagar is AMFI-certified as a Mutual Fund Distributor and has built his practice around goal-based, transparent financial planning over 8+ years." },
    { q: "Is The Financial Doctor a company or an individual practice?", a: "It's an advisory practice founded by Sagar Chaturvedi that has grown into a team-driven operation, backed by digital infrastructure and trusted partners." },
    { q: "Does The Financial Doctor have a physical office I can visit?", a: "Yes, we're based in Sehore, MP, and welcome in-person meetings where available, alongside video consultations for clients elsewhere." },
    { q: "Can I meet Sagar Chaturvedi in person?", a: "Yes, in-person meetings can be arranged in and around Sehore, MP — for clients elsewhere, we offer video consultations instead." },
    { q: "Does The Financial Doctor work alone or with a team?", a: "Sagar Chaturvedi leads a growing team of advisors, so you're supported by more than one person as your needs grow." },
    { q: "What is Asset Plus and how is it connected to TFD?", a: "Asset Plus is our digital execution partner — it powers the portfolio tracking dashboard and backend infrastructure that makes investing with us seamless. For example, you can log in anytime to see your SIP's current value, past transactions, and capital gains statement." },
    { q: "Is The Financial Doctor tied to just one mutual fund company?", a: "No, we work across 40+ AMC and insurer partners, so recommendations are based on what suits you, not a single fund house's products. For instance, if a fund from one AMC fits your goal better than another this year, that's what we'll suggest — not whichever pays more." },
    { q: "How does The Financial Doctor make money if the consultation is free?", a: "We earn a commission from the AMC or insurer when you invest through us — this is standard for mutual fund distributors and doesn't add any extra cost to you. For example, on a ₹10,000/month SIP, our trail commission is typically a small annual percentage built into the fund's expense ratio, not billed to you separately." },
    { q: "Do you charge any direct fees to clients?", a: "For most standard mutual fund and insurance guidance, we don't charge a separate advisory fee — our earning comes from distributor commission built into the product, not an added cost to you." },
    { q: "Isn't there a conflict of interest since you earn commission?", a: "We're upfront that we earn commission — that's exactly why we always start with your goals and risk profile first, and we never guarantee returns or push products that don't fit your needs. For example, we'd never suggest switching a well-performing fund just to earn a fresh commission — that kind of churn is exactly what we avoid." },
    { q: "How can I trust your recommendations aren't biased towards higher commission?", a: "We work across 40+ AMC and insurer partners rather than pushing one company's products, and every suggestion starts with your goals, not a sales target. For instance, two clients with the same investment amount but different risk appetites will walk away with two different fund recommendations, not the same 'featured' product." },
    { q: "What happens to my investments if The Financial Doctor shuts down?", a: "Your money is never with us — it sits directly with the AMC or insurer in your own name via folios/policies, so it stays completely unaffected by anything happening to our firm. For example, even if we closed down tomorrow, your existing SIPs would simply continue running exactly as they are with the fund house." },
    { q: "Can The Financial Doctor access my bank account or withdraw my money?", a: "No, we never hold or have access to your funds — all transactions happen directly between you and the AMC/insurer through secure, regulated channels." },
    { q: "Is The Financial Doctor licensed to sell insurance too?", a: "Yes, alongside our AMFI mutual fund distribution registration, we're authorised to advise on and facilitate life, health, term, and motor insurance." },
    { q: "Which insurance companies does The Financial Doctor work with?", a: "We partner with leading insurers across life, health, and motor insurance categories so you have real choice, not just one company's plans." },
    { q: "How does The Financial Doctor verify my identity (KYC)?", a: "KYC is completed digitally through our partner platform using your PAN, Aadhaar-linked details, and standard regulatory verification — a one-time process for most investors." },
    { q: "Is The Financial Doctor registered with any government or regulatory authority?", a: "Yes, we're registered with AMFI as a Mutual Fund Distributor under ARN-290298, the regulatory body overseeing mutual fund distribution in India." },
    { q: "How can I verify The Financial Doctor's ARN number?", a: "You can verify ARN-290298 on AMFI's official website or check our AssetPlus distributor profile, both of which confirm our registered distributor status." },
    { q: "How long does it take to become a client of The Financial Doctor?", a: "After your free first consultation, KYC and onboarding onto our digital platform usually takes just a day or two for most clients. For example, someone who completes e-KYC in the morning can often start their first SIP by the next day." },
    { q: "Do I need to sign physical documents to start investing?", a: "Most onboarding today is fully digital — e-KYC and e-signatures — though physical documentation can be arranged if you prefer or if a specific product requires it." },
    { q: "Can I switch from my current advisor or bank to The Financial Doctor?", a: "Yes, we regularly help clients transition their existing mutual fund and insurance portfolios over to us, with no disruption to your holdings. For example, we can take over servicing of an existing SIP folio without you having to redeem a single unit." },
    { q: "Does The Financial Doctor offer service in Hindi?", a: "Yes, our team communicates comfortably in Hindi, English, and Hinglish, whichever you're most comfortable with." },
    { q: "What languages does the team speak?", a: "We converse in Hindi, English, and Hinglish so explanations always feel clear, not textbook-technical." },
    { q: "Is The Financial Doctor suitable for someone who knows nothing about investing?", a: "Yes, we specialise in explaining things in plain language for first-time investors — no prior investment knowledge is assumed or required. For example, we'll walk through what a SIP or NAV actually means in everyday terms before ever suggesting one." },
    { q: "Do you only work with high-net-worth clients?", a: "No, we work with clients across income levels, from someone starting a ₹500 SIP to families planning larger portfolios." },
    { q: "Is there a minimum investment amount to work with The Financial Doctor?", a: "There's no strict minimum — many clients start with SIPs as small as a few hundred rupees a month and grow from there." },
    { q: "Does The Financial Doctor help NRIs invest in India?", a: "Yes, we assist NRI clients with NRE/NRO-linked mutual fund and insurance investments, subject to the applicable regulatory documentation. For example, an NRI based in Dubai can start an NRE-linked SIP and review their portfolio entirely over video calls." },
    { q: "How does The Financial Doctor stay updated on market and regulatory changes?", a: "Ongoing AMFI-mandated training, continuous learning, and staying closely connected with our AMC and insurer partners keeps our guidance current." },
    { q: "What makes The Financial Doctor different from a bank relationship manager?", a: "Unlike a bank RM who often has product targets tied to that one bank, we work across 40+ AMC and insurer partners and build long-term, goal-first relationships. For instance, a bank RM may lean toward that bank's own fund house, while we can freely compare options across 40+ AMCs for the same goal." },
    { q: "What makes The Financial Doctor different from investing directly through an app?", a: "An app leaves you to research and decide alone; we add a human advisor who understands your full financial picture, answers questions, and reviews your plan as life changes — all through Regular Plans with ongoing support." },
    { q: "Do you review my portfolio after the first investment, or is it a one-time interaction?", a: "We stay engaged with periodic portfolio reviews — our goal is a long-term relationship, not a single transaction. For example, if markets fall sharply, we'd proactively reach out to reassure or rebalance rather than leaving you to wonder whether to panic-sell." },
    { q: "Can I stop working with The Financial Doctor whenever I want?", a: "Yes, there's no lock-in on our advisory relationship — your investments remain yours, and you're free to manage or move them anytime." },
    { q: "How do I get started with The Financial Doctor?", a: "Simply book your free first consultation through our Contact page or WhatsApp — we'll understand your goals and take it from there." },
  ],
  hi: [
    { q: "The Financial Doctor क्या काम करती है?", a: "हम परिवारों और व्यक्तियों को म्यूचुअल फंड निवेश और इंश्योरेंस की सही प्लानिंग में मदद करते हैं — बिना किसी छुपे चार्ज और कठिन भाषा के। उदाहरण के लिए, बच्चे की कॉलेज फीस के लिए बचत करने वाले क्लाइंट को 10-15 साल के गोल के हिसाब से इक्विटी और डेट फंड का मिक्स सुझाया जाता है, कोई एक जैसा सामान्य प्रोडक्ट नहीं।" },
    { q: "क्या The Financial Doctor AMFI रजिस्टर्ड है?", a: "हाँ, हम AMFI के अंतर्गत रजिस्टर्ड म्यूचुअल फंड डिस्ट्रीब्यूटर हैं (ARN-290298), यानी हमारी सलाह नियमों के अनुसार होती है — आप निवेश करने से पहले AMFI की ऑफिशियल वेबसाइट पर यह ARN खुद वेरीफाई कर सकते हैं।" },
    { q: "The Financial Doctor को कौन चलाता है?", a: "इसे सागर चतुर्वेदी लीड करते हैं, साथ में एडवाइजर्स की टीम और Asset Plus जैसे डिजिटल पार्टनर का सहयोग है।" },
    { q: "क्या आप सिर्फ म्यूचुअल फंड में ही सलाह देते हैं?", a: "नहीं — हम लाइफ, हेल्थ, टर्म और मोटर इंश्योरेंस के साथ-साथ टैक्स प्लानिंग में भी मदद करते हैं। उदाहरण के लिए, हमारे साथ SIP चला रहे किसी क्लाइंट का ₹50 लाख का टर्म कवर भी रिव्यू हो सकता है और हर टैक्स सीजन में ELSS फंड का सुझाव भी।" },
    { q: "आप सलाह कैसे देते हैं?", a: "हम आपके गोल, इनकम, रिस्क और समय सीमा को समझकर ही कोई प्रोडक्ट सुझाते हैं, कोई भी सलाह सामान्य नहीं होती। उदाहरण के लिए, 20 साल के लक्ष्य वाले 30 साल के व्यक्ति को ज्यादा इक्विटी एलोकेशन मिल सकता है, जबकि रिटायरमेंट के करीब किसी को ज्यादा डेट-हैवी मिक्स।" },
    { q: "क्या मैं अपने निवेश को ऑनलाइन ट्रैक कर सकता हूँ?", a: "हाँ, Asset Plus के माध्यम से आपको एक डैशबोर्ड मिलता है जहाँ से आप कभी भी अपना पोर्टफोलियो देख सकते हैं — जैसे रविवार रात 11 बजे भी अपने फोन पर SIP की मौजूदा वैल्यू या नया NAV चेक करना।" },
    { q: "क्या पहली कंसल्टेशन फ्री है?", a: "हाँ, पहली कंसल्टेशन पूरी तरह फ्री है और इसमें निवेश करने की कोई बाध्यता नहीं है।" },
    { q: "क्या मेरा पैसा आपके पास सुरक्षित रहता है?", a: "आपका निवेश सीधे AMC/इंश्योरर के पास आपके नाम पर रहता है — हम कभी आपका पैसा नहीं रखते, सिर्फ सलाह और सुविधा देते हैं। उदाहरण के लिए, जब आप SIP शुरू करते हैं, तो फोलियो सीधे आपके नाम पर फंड हाउस के पास बनता है, हम बस वही डैशबोर्ड देखते हैं जो आप देखते हैं।" },
    { q: "ARN-290298 का क्या मतलब है?", a: "ARN का मतलब है AMFI Registration Number — यह वह यूनीक आईडी है जो AMFI सर्टिफाइड म्यूचुअल फंड डिस्ट्रीब्यूटर्स को देता है, और ARN-290298 हमारी है।" },
    { q: "AMFI क्या है?", a: "AMFI (Association of Mutual Funds in India) वह इंडस्ट्री बॉडी है जो हमारे जैसे म्यूचुअल फंड डिस्ट्रीब्यूटर्स को रेगुलेट और सर्टिफाई करती है।" },
    { q: "क्या The Financial Doctor SEBI-रजिस्टर्ड इन्वेस्टमेंट एडवाइजर है?", a: "नहीं, हम AMFI-रजिस्टर्ड म्यूचुअल फंड डिस्ट्रीब्यूटर हैं, SEBI-रजिस्टर्ड इन्वेस्टमेंट एडवाइजर नहीं — हम AMC/इंश्योरर से कमीशन कमाते हैं, फीस नहीं लेते, और इस अंतर के बारे में पूरी तरह पारदर्शी हैं। उदाहरण के लिए, हम आपके गोल के हिसाब से सही फंड कैटेगरी बता सकते हैं, पर फीस-ओनली RIA की तरह सालाना फ्लैट एडवाइजरी फीस नहीं लेते।" },
    { q: "म्यूचुअल फंड डिस्ट्रीब्यूटर और इन्वेस्टमेंट एडवाइजर में क्या फर्क है?", a: "हमारे जैसा डिस्ट्रीब्यूटर सही प्रोडक्ट चुनने और एग्जीक्यूट करने में मदद करता है और फंड हाउस/इंश्योरर से कमीशन कमाता है, जबकि SEBI रजिस्टर्ड इन्वेस्टमेंट एडवाइजर आमतौर पर सिर्फ सलाह के लिए फीस लेता है — दोनों रेगुलेटेड हैं पर अलग फ्रेमवर्क में। उदाहरण के लिए, एक RIA पोर्टफोलियो साइज़ चाहे जो भी हो, सालाना ₹15,000 फ्लैट फीस ले सकता है, जबकि हमारी कमाई फंड की एक्सपेंस रेशियो में शामिल एक छोटा ट्रेल कमीशन होती है।" },
    { q: "The Financial Doctor कहाँ स्थित है?", a: "हम सीहोर, मध्य प्रदेश में स्थित हैं और पूरे भारत में क्लाइंट्स को इन-पर्सन मीटिंग और वीडियो कंसल्टेशन के जरिए सेवा देते हैं।" },
    { q: "क्या आप मध्य प्रदेश के बाहर भी क्लाइंट्स को सेवा देते हैं?", a: "हाँ, हम पूरे भारत में क्लाइंट्स के साथ वीडियो कॉल के जरिए काम करते हैं, और पास के क्लाइंट्स के लिए इन-पर्सन मीटिंग भी उपलब्ध है। उदाहरण के लिए, हम मुंबई, बेंगलुरु या दिल्ली जैसे शहरों के क्लाइंट्स को पूरी तरह वीडियो कंसल्टेशन और डिजिटल KYC से ऑनबोर्ड करते हैं।" },
    { q: "The Financial Doctor कितने सालों से काम कर रही है?", a: "हम 8+ सालों से क्लाइंट्स को सलाह दे रहे हैं, एक बार की डील नहीं बल्कि लंबे समय के रिश्ते बनाते हुए।" },
    { q: "अब तक कितने परिवारों की मदद की है?", a: "हमने मध्य प्रदेश और उससे आगे 1000+ परिवारों के साथ उनकी म्यूचुअल फंड और इंश्योरेंस प्लानिंग पर काम किया है।" },
    { q: "सागर चतुर्वेदी कौन हैं?", a: "सागर चतुर्वेदी The Financial Doctor के फाउंडर हैं, एक AMFI-सर्टिफाइड म्यूचुअल फंड डिस्ट्रीब्यूटर (ARN-290298) जिनके पास 8+ साल का एडवाइजरी अनुभव है।" },
    { q: "सागर चतुर्वेदी की क्वालिफिकेशन क्या है?", a: "सागर AMFI-सर्टिफाइड म्यूचुअल फंड डिस्ट्रीब्यूटर हैं और उन्होंने 8+ सालों में गोल-बेस्ड, पारदर्शी फाइनेंशियल प्लानिंग पर अपनी प्रैक्टिस बनाई है।" },
    { q: "क्या The Financial Doctor एक कंपनी है या individual practice?", a: "यह सागर चतुर्वेदी द्वारा शुरू की गई एडवाइजरी प्रैक्टिस है जो अब एक टीम-आधारित ऑपरेशन बन चुकी है, डिजिटल इंफ्रास्ट्रक्चर और भरोसेमंद पार्टनर्स के साथ।" },
    { q: "क्या आपका कोई फिजिकल ऑफिस है जहाँ मैं जा सकता हूँ?", a: "हाँ, हम सीहोर, MP में स्थित हैं और वहाँ इन-पर्सन मीटिंग के साथ-साथ बाकी जगहों के क्लाइंट्स के लिए वीडियो कंसल्टेशन भी देते हैं।" },
    { q: "क्या मैं सागर चतुर्वेदी से व्यक्तिगत रूप से मिल सकता हूँ?", a: "हाँ, सीहोर, MP में और आस-पास इन-पर्सन मीटिंग हो सकती है — बाकी जगहों के क्लाइंट्स के लिए हम वीडियो कंसल्टेशन देते हैं।" },
    { q: "क्या The Financial Doctor अकेले काम करती है या टीम के साथ?", a: "सागर चतुर्वेदी एक बढ़ती हुई एडवाइजर्स की टीम को लीड करते हैं, इसलिए आपकी जरूरतों के बढ़ने के साथ आपको एक से ज्यादा लोगों का सपोर्ट मिलता है।" },
    { q: "Asset Plus क्या है और यह TFD से कैसे जुड़ा है?", a: "Asset Plus हमारा डिजिटल एग्जीक्यूशन पार्टनर है — यह वह पोर्टफोलियो ट्रैकिंग डैशबोर्ड और बैकएंड इंफ्रास्ट्रक्चर देता है जो हमारे साथ निवेश करना आसान बनाता है। उदाहरण के लिए, आप कभी भी लॉगिन करके अपनी SIP की मौजूदा वैल्यू, पिछले ट्रांजैक्शन और कैपिटल गेन्स स्टेटमेंट देख सकते हैं।" },
    { q: "क्या The Financial Doctor सिर्फ एक म्यूचुअल फंड कंपनी से जुड़ी है?", a: "नहीं, हम 40+ AMC और इंश्योरर पार्टनर्स के साथ काम करते हैं, इसलिए सलाह आपके लिए सही प्रोडक्ट पर आधारित होती है, किसी एक फंड हाउस पर नहीं। उदाहरण के लिए, अगर इस साल किसी एक AMC का फंड आपके गोल के लिए दूसरे से बेहतर है, तो वही सुझाया जाएगा — जो ज्यादा कमीशन दे वह नहीं।" },
    { q: "अगर पहली कंसल्टेशन फ्री है तो The Financial Doctor पैसे कैसे कमाती है?", a: "जब आप हमारे through निवेश करते हैं तो हमें AMC या इंश्योरर से कमीशन मिलता है — यह म्यूचुअल फंड डिस्ट्रीब्यूटर्स के लिए सामान्य है और आपको इससे कोई अतिरिक्त खर्च नहीं होता। उदाहरण के लिए, ₹10,000/माह की SIP पर हमारा ट्रेल कमीशन आमतौर पर फंड की एक्सपेंस रेशियो में शामिल एक छोटा सालाना प्रतिशत होता है, आपसे अलग से नहीं लिया जाता।" },
    { q: "क्या आप क्लाइंट्स से सीधे कोई फीस लेते हैं?", a: "ज्यादातर सामान्य म्यूचुअल फंड और इंश्योरेंस गाइडेंस के लिए हम अलग एडवाइजरी फीस नहीं लेते — हमारी कमाई प्रोडक्ट में शामिल डिस्ट्रीब्यूटर कमीशन से होती है, आपकी जेब से नहीं।" },
    { q: "कमीशन कमाने से क्या कॉन्फ्लिक्ट ऑफ इंटरेस्ट नहीं होता?", a: "हम खुलकर बताते हैं कि हम कमीशन कमाते हैं — इसीलिए हम हमेशा पहले आपके गोल्स और रिस्क प्रोफाइल से शुरुआत करते हैं, और कभी रिटर्न की गारंटी नहीं देते या ऐसे प्रोडक्ट नहीं थोपते जो आपके लिए सही न हों। उदाहरण के लिए, हम कभी भी अच्छा परफॉर्म कर रहे फंड को सिर्फ नया कमीशन कमाने के लिए बदलने की सलाह नहीं देंगे।" },
    { q: "मुझे कैसे भरोसा हो कि आपकी सलाह ज्यादा कमीशन के लिए biased नहीं है?", a: "हम किसी एक कंपनी के प्रोडक्ट थोपने के बजाय 40+ AMC और इंश्योरर पार्टनर्स के साथ काम करते हैं, और हर सुझाव आपके गोल्स से शुरू होता है, सेल्स टारगेट से नहीं। उदाहरण के लिए, समान निवेश राशि पर भी अलग-अलग रिस्क प्रोफाइल वाले दो क्लाइंट्स को अलग-अलग फंड सुझाए जाएंगे, एक जैसा 'फीचर्ड' प्रोडक्ट नहीं।" },
    { q: "अगर The Financial Doctor बंद हो जाए तो मेरे निवेश का क्या होगा?", a: "आपका पैसा कभी हमारे पास नहीं होता — यह सीधे AMC या इंश्योरर के पास आपके अपने नाम पर फोलियो/पॉलिसी में रहता है, इसलिए हमारी फर्म को कुछ भी होने पर यह पूरी तरह सुरक्षित रहता है। उदाहरण के लिए, अगर हम कल बंद भी हो जाएं, तो आपकी मौजूदा SIP फंड हाउस के साथ बिल्कुल वैसे ही चलती रहेगी।" },
    { q: "क्या The Financial Doctor मेरे बैंक अकाउंट या पैसे तक पहुँच सकती है?", a: "नहीं, हम कभी आपके फंड्स को होल्ड या एक्सेस नहीं करते — सभी ट्रांजैक्शन सीधे आपके और AMC/इंश्योरर के बीच सुरक्षित, रेगुलेटेड चैनलों से होते हैं।" },
    { q: "क्या The Financial Doctor इंश्योरेंस बेचने के लिए भी लाइसेंस्ड है?", a: "हाँ, हमारे AMFI म्यूचुअल फंड डिस्ट्रीब्यूशन रजिस्ट्रेशन के साथ-साथ, हम लाइफ, हेल्थ, टर्म और मोटर इंश्योरेंस पर सलाह देने और सुविधा देने के लिए अधिकृत हैं।" },
    { q: "The Financial Doctor किन इंश्योरेंस कंपनियों के साथ काम करती है?", a: "हम लाइफ, हेल्थ और मोटर इंश्योरेंस कैटेगरी की लीडिंग इंश्योरेंस कंपनियों के साथ पार्टनरशिप में हैं ताकि आपके पास सिर्फ एक कंपनी का नहीं बल्कि असली विकल्प हो।" },
    { q: "The Financial Doctor मेरी पहचान (KYC) कैसे वेरीफाई करती है?", a: "KYC हमारे पार्टनर प्लेटफॉर्म के जरिए डिजिटली पूरा होता है, आपके PAN, आधार-लिंक्ड डिटेल्स और स्टैंडर्ड रेगुलेटरी वेरिफिकेशन का उपयोग करके — ज्यादातर निवेशकों के लिए यह एक बार की प्रोसेस है।" },
    { q: "क्या The Financial Doctor किसी सरकारी या रेगुलेटरी अथॉरिटी के साथ रजिस्टर्ड है?", a: "हाँ, हम AMFI के साथ ARN-290298 के तहत म्यूचुअल फंड डिस्ट्रीब्यूटर के रूप में रजिस्टर्ड हैं, जो भारत में म्यूचुअल फंड डिस्ट्रीब्यूशन की देखरेख करने वाली रेगुलेटरी बॉडी है।" },
    { q: "मैं The Financial Doctor का ARN नंबर कैसे वेरीफाई कर सकता हूँ?", a: "आप AMFI की ऑफिशियल वेबसाइट पर ARN-290298 वेरीफाई कर सकते हैं, या हमारी AssetPlus डिस्ट्रीब्यूटर प्रोफाइल भी देख सकते हैं, दोनों हमारी रजिस्टर्ड डिस्ट्रीब्यूटर स्थिति की पुष्टि करते हैं।" },
    { q: "The Financial Doctor का क्लाइंट बनने में कितना समय लगता है?", a: "फ्री पहली कंसल्टेशन के बाद, KYC और हमारे डिजिटल प्लेटफॉर्म पर ऑनबोर्डिंग में ज्यादातर क्लाइंट्स के लिए सिर्फ एक-दो दिन लगते हैं। उदाहरण के लिए, सुबह e-KYC पूरा करने वाला क्लाइंट अक्सर अगले दिन तक अपनी पहली SIP शुरू कर सकता है।" },
    { q: "क्या निवेश शुरू करने के लिए मुझे फिजिकल डॉक्यूमेंट्स साइन करने होंगे?", a: "आजकल ज्यादातर ऑनबोर्डिंग पूरी तरह डिजिटल है — e-KYC और e-signature — फिर भी अगर आप चाहें या कोई खास प्रोडक्ट मांगे तो फिजिकल डॉक्यूमेंटेशन भी हो सकता है।" },
    { q: "क्या मैं अपने मौजूदा एडवाइजर या बैंक से The Financial Doctor में शिफ्ट हो सकता हूँ?", a: "हाँ, हम अक्सर क्लाइंट्स को उनके मौजूदा म्यूचुअल फंड और इंश्योरेंस पोर्टफोलियो को हमारे पास ट्रांजिशन करने में मदद करते हैं, बिना आपकी होल्डिंग्स में किसी रुकावट के। उदाहरण के लिए, हम बिना एक भी यूनिट रिडीम किए, आपकी मौजूदा SIP फोलियो की सर्विसिंग अपने पास ले सकते हैं।" },
    { q: "क्या The Financial Doctor हिंदी में सेवा देती है?", a: "हाँ, हमारी टीम हिंदी, इंग्लिश और हिंग्लिश में सहजता से बात करती है, जो भी आपको सबसे सुविधाजनक लगे।" },
    { q: "टीम कौन सी भाषाएं बोलती है?", a: "हम हिंदी, इंग्लिश और हिंग्लिश में बात करते हैं ताकि समझाना हमेशा साफ लगे, किताबी-तकनीकी नहीं।" },
    { q: "क्या The Financial Doctor उस व्यक्ति के लिए सही है जिसे निवेश के बारे में कुछ नहीं पता?", a: "हाँ, हम पहली बार निवेश करने वालों को आसान भाषा में समझाने में माहिर हैं — पहले से कोई निवेश ज्ञान जरूरी नहीं है। उदाहरण के लिए, कोई फंड सुझाने से पहले हम आसान शब्दों में समझाएंगे कि SIP या NAV असल में होता क्या है।" },
    { q: "क्या आप सिर्फ हाई-नेट-वर्थ क्लाइंट्स के साथ काम करते हैं?", a: "नहीं, हम हर इनकम लेवल के क्लाइंट्स के साथ काम करते हैं, ₹500 की SIP शुरू करने वाले से लेकर बड़ा पोर्टफोलियो प्लान करने वाले परिवारों तक।" },
    { q: "The Financial Doctor के साथ काम करने के लिए कोई न्यूनतम निवेश राशि है?", a: "कोई सख्त न्यूनतम राशि नहीं है — कई क्लाइंट्स कुछ सौ रुपये मासिक SIP से शुरू करते हैं और वहाँ से आगे बढ़ते हैं।" },
    { q: "क्या The Financial Doctor NRI को भारत में निवेश करने में मदद करती है?", a: "हाँ, हम NRE/NRO-लिंक्ड म्यूचुअल फंड और इंश्योरेंस निवेश में NRI क्लाइंट्स की मदद करते हैं, लागू रेगुलेटरी डॉक्यूमेंटेशन के अनुसार। उदाहरण के लिए, दुबई में रहने वाला कोई NRI क्लाइंट NRE-लिंक्ड SIP शुरू कर सकता है और पूरा पोर्टफोलियो वीडियो कॉल से ही रिव्यू कर सकता है।" },
    { q: "The Financial Doctor मार्केट और रेगुलेटरी बदलावों के साथ कैसे अपडेट रहती है?", a: "लगातार AMFI-अनिवार्य ट्रेनिंग, निरंतर सीखना, और हमारे AMC व इंश्योरर पार्टनर्स के साथ करीबी जुड़ाव हमारी सलाह को हमेशा अपडेटेड रखता है।" },
    { q: "बैंक रिलेशनशिप मैनेजर से The Financial Doctor कैसे अलग है?", a: "बैंक RM के पास अक्सर सिर्फ उस एक बैंक के प्रोडक्ट टारगेट होते हैं, जबकि हम 40+ AMC और इंश्योरर पार्टनर्स के साथ काम करते हैं और लॉन्ग-टर्म, गोल-फर्स्ट रिश्ता बनाते हैं। उदाहरण के लिए, बैंक RM अक्सर उसी बैंक के फंड हाउस की ओर झुका होता है, जबकि हम एक ही गोल के लिए 40+ AMC में से आजादी से तुलना कर सकते हैं।" },
    { q: "ऐप से सीधे निवेश करने से The Financial Doctor कैसे अलग है?", a: "ऐप आपको खुद रिसर्च और डिसीजन लेने के लिए छोड़ देता है; हम एक ह्यूमन एडवाइजर जोड़ते हैं जो आपकी पूरी फाइनेंशियल तस्वीर समझता है, सवालों के जवाब देता है, और जीवन बदलने पर आपकी प्लान रिव्यू करता है — यह सब Regular Plan और चल रहे सपोर्ट के साथ।" },
    { q: "क्या आप पहले निवेश के बाद भी मेरा पोर्टफोलियो रिव्यू करते हैं, या यह सिर्फ एक बार का इंटरैक्शन है?", a: "हम पीरियोडिक पोर्टफोलियो रिव्यू के साथ जुड़े रहते हैं — हमारा लक्ष्य लॉन्ग-टर्म रिश्ता है, एक बार का ट्रांजैक्शन नहीं। उदाहरण के लिए, अगर मार्केट तेजी से गिरता है, तो हम खुद आपसे संपर्क करेंगे न कि आपको यह सोचने के लिए छोड़ देंगे कि पैनिक में बेचें या नहीं।" },
    { q: "क्या मैं जब चाहूं The Financial Doctor के साथ काम करना बंद कर सकता हूँ?", a: "हाँ, हमारे एडवाइजरी रिश्ते में कोई लॉक-इन नहीं है — आपके निवेश हमेशा आपके ही रहते हैं, और आप कभी भी उन्हें मैनेज या ट्रांसफर करने के लिए स्वतंत्र हैं।" },
    { q: "मैं The Financial Doctor के साथ कैसे शुरुआत करूं?", a: "बस हमारे Contact पेज या WhatsApp के जरिए अपनी फ्री पहली कंसल्टेशन बुक करें — हम आपके गोल्स समझेंगे और वहाँ से आगे बढ़ेंगे।" },
  ],
  hinglish: [
    { q: "The Financial Doctor kya karti hai?", a: "Hum families aur individuals ko mutual fund investment aur insurance planning mein help karte hain — bina kisi hidden charge ya mushkil language ke. Jaise, bachche ki college fees ke liye save kar rahe client ko 10-15 saal ke goal ke hisaab se equity aur debt fund ka mix suggest kiya jata hai, koi generic ek-jaisa product nahi." },
    { q: "Kya The Financial Doctor AMFI registered hai?", a: "Haan, hum AMFI ke under registered Mutual Fund Distributor hain (ARN-290298), iska matlab hamari advice regulations follow karti hai — aap invest karne se pehle yeh ARN AMFI ki official website pe khud verify kar sakte ho." },
    { q: "The Financial Doctor ko kaun lead karta hai?", a: "Isko Sagar Chaturvedi lead karte hain, saath mein advisors ki team aur Asset Plus jaisa digital partner support karta hai." },
    { q: "Kya aap sirf mutual funds mein hi advice dete ho?", a: "Nahi — hum life, health, term aur motor insurance ke saath tax planning mein bhi help karte hain. Jaise, hamare saath SIP chala rahe kisi client ka ₹50 lakh ka term cover bhi review ho sakta hai aur har tax season mein ELSS fund ka suggestion bhi." },
    { q: "Aap recommendation kaise dete ho?", a: "Hum aapke goals, income, risk aur time horizon ko samajhkar hi koi product suggest karte hain, kuch bhi generic nahi hota. Jaise, 20 saal ke goal wale 30 saal ke insaan ko zyada equity allocation mil sakta hai, jabki retirement ke kareeb kisi ko zyada debt-heavy mix." },
    { q: "Kya main apna investment online track kar sakta hoon?", a: "Haan, Asset Plus ke through aapko ek dashboard milta hai jaha se aap kabhi bhi apna portfolio dekh sakte ho — jaise Sunday raat 11 baje bhi apne phone pe SIP ki current value ya naya NAV check karna." },
    { q: "Kya first consultation free hai?", a: "Haan, pehli consultation bilkul free hai aur usme invest karne ki koi obligation nahi hai." },
    { q: "Kya mera paisa aapke paas safe rehta hai?", a: "Aapka investment directly AMC/insurer ke paas aapke naam pe rehta hai — hum kabhi aapka paisa nahi rakhte, sirf advice aur facility dete hain. Jaise, jab aap SIP start karte ho, folio directly aapke naam pe fund house ke paas banta hai, hum bas wahi dashboard dekhte hain jo aap dekhte ho." },
    { q: "ARN-290298 ka kya matlab hai?", a: "ARN matlab AMFI Registration Number — yeh wo unique ID hai jo AMFI certified mutual fund distributors ko deta hai, aur ARN-290298 hamari hai." },
    { q: "AMFI kya hai?", a: "AMFI (Association of Mutual Funds in India) wo industry body hai jo hamare jaise mutual fund distributors ko regulate aur certify karti hai." },
    { q: "Kya The Financial Doctor SEBI-registered Investment Adviser hai?", a: "Nahi, hum AMFI-registered Mutual Fund Distributor hain, SEBI-registered Investment Adviser nahi — hum AMC/insurer se commission kamate hain, fee nahi lete, aur is difference ke baare mein pura transparent hain. Jaise, hum aapke goal ke hisaab se sahi fund category bata sakte hain, par fee-only RIA ki tarah saalana flat advisory fee nahi lete." },
    { q: "Mutual fund distributor aur investment adviser mein kya farak hai?", a: "Hamare jaisa distributor sahi product choose aur execute karne mein help karta hai aur fund house/insurer se commission kamata hai, jabki SEBI registered Investment Adviser usually sirf advice ke liye fee leta hai — dono regulated hain par alag framework mein. Jaise, ek RIA portfolio size chahe jo bhi ho, saalana ₹15,000 flat fee le sakta hai, jabki hamari earning fund ki expense ratio mein included ek chhota trail commission hoti hai." },
    { q: "The Financial Doctor kaha based hai?", a: "Hum Sehore, Madhya Pradesh mein based hain aur poore India mein clients ko in-person meeting aur video consultation ke through serve karte hain." },
    { q: "Kya aap Madhya Pradesh ke bahar bhi clients serve karte ho?", a: "Haan, hum poore India mein clients ke saath video call ke through kaam karte hain, aur paas ke clients ke liye in-person meeting bhi available hai. Jaise, hum Mumbai, Bengaluru ya Delhi jaise cities ke clients ko pura video consultation aur digital KYC se onboard karte hain." },
    { q: "The Financial Doctor kitne saalon se kaam kar rahi hai?", a: "Hum 8+ saal se clients ko advise kar rahe hain, ek baar ki deal nahi balki long-term relationships banate hue." },
    { q: "Ab tak kitne families ki help ki hai?", a: "Humne Madhya Pradesh aur usse aage 1000+ families ke saath unki mutual fund aur insurance planning pe kaam kiya hai." },
    { q: "Sagar Chaturvedi kaun hain?", a: "Sagar Chaturvedi The Financial Doctor ke founder hain, ek AMFI-certified Mutual Fund Distributor (ARN-290298) jinke paas 8+ saal ka advisory experience hai." },
    { q: "Sagar Chaturvedi ki qualification kya hai?", a: "Sagar AMFI-certified Mutual Fund Distributor hain aur unhone 8+ saalon mein goal-based, transparent financial planning pe apni practice banayi hai." },
    { q: "Kya The Financial Doctor ek company hai ya individual practice?", a: "Yeh Sagar Chaturvedi dwara shuru ki gayi advisory practice hai jo ab ek team-driven operation ban chuki hai, digital infrastructure aur trusted partners ke saath." },
    { q: "Kya aapka koi physical office hai jaha main ja sakta hoon?", a: "Haan, hum Sehore, MP mein based hain aur wahan in-person meeting ke saath-saath baaki jagah ke clients ke liye video consultation bhi dete hain." },
    { q: "Kya main Sagar Chaturvedi se personally mil sakta hoon?", a: "Haan, Sehore, MP mein aur aas-paas in-person meeting ho sakti hai — baaki jagah ke clients ke liye hum video consultation dete hain." },
    { q: "Kya The Financial Doctor akele kaam karti hai ya team ke saath?", a: "Sagar Chaturvedi ek badhti hui advisors ki team lead karte hain, isliye aapki needs badhne ke saath aapko ek se zyada logo ka support milta hai." },
    { q: "Asset Plus kya hai aur yeh TFD se kaise connected hai?", a: "Asset Plus hamara digital execution partner hai — yeh wo portfolio tracking dashboard aur backend infrastructure deta hai jo hamare saath invest karna seamless banata hai. Jaise, aap kabhi bhi login karke apni SIP ki current value, past transactions aur capital gains statement dekh sakte ho." },
    { q: "Kya The Financial Doctor sirf ek mutual fund company se juda hai?", a: "Nahi, hum 40+ AMC aur insurer partners ke saath kaam karte hain, isliye advice aapke liye sahi product pe based hoti hai, kisi ek fund house pe nahi. Jaise, agar is saal kisi ek AMC ka fund aapke goal ke liye dusre se better hai, to wahi suggest hoga — jo zyada commission de wo nahi." },
    { q: "Agar pehli consultation free hai to The Financial Doctor paise kaise kamati hai?", a: "Jab aap hamare through invest karte ho to hume AMC ya insurer se commission milta hai — yeh mutual fund distributors ke liye normal hai aur aapko isse koi extra cost nahi hota. Jaise, ₹10,000/month ki SIP pe hamara trail commission usually fund ki expense ratio mein included ek chhota saalana percentage hota hai, aapse alag se nahi liya jata." },
    { q: "Kya aap clients se directly koi fee lete ho?", a: "Zyada tar normal mutual fund aur insurance guidance ke liye hum alag advisory fee nahi lete — hamari earning product mein included distributor commission se hoti hai, aapki jeb se nahi." },
    { q: "Commission kamane se conflict of interest nahi hota?", a: "Hum openly batate hain ki hum commission kamate hain — isiliye hum hamesha pehle aapke goals aur risk profile se start karte hain, aur kabhi return ki guarantee nahi dete ya aise products push nahi karte jo aapke liye sahi na ho. Jaise, hum kabhi bhi accha perform kar raha fund sirf naya commission kamane ke liye switch karne ki advice nahi denge." },
    { q: "Mujhe kaise trust ho ki aapki advice zyada commission ke liye biased nahi hai?", a: "Hum kisi ek company ke products push karne ke bajaye 40+ AMC aur insurer partners ke saath kaam karte hain, aur har suggestion aapke goals se start hota hai, sales target se nahi. Jaise, same investment amount pe bhi alag-alag risk profile wale do clients ko alag-alag fund suggest honge, ek jaisa 'featured' product nahi." },
    { q: "Agar The Financial Doctor band ho jaaye to mere investments ka kya hoga?", a: "Aapka paisa kabhi hamare paas nahi hota — yeh directly AMC ya insurer ke paas aapke apne naam pe folio/policy mein rehta hai, isliye hamari firm ko kuch bhi hone pe yeh pura safe rehta hai. Jaise, agar hum kal band bhi ho jaayen, to aapki existing SIP fund house ke saath bilkul waise hi chalti rahegi." },
    { q: "Kya The Financial Doctor mere bank account ya paise tak access kar sakti hai?", a: "Nahi, hum kabhi bhi aapke funds ko hold ya access nahi karte — sabhi transactions directly aapke aur AMC/insurer ke beech secure, regulated channels se hote hain." },
    { q: "Kya The Financial Doctor insurance bechne ke liye bhi licensed hai?", a: "Haan, hamare AMFI mutual fund distribution registration ke saath-saath, hum life, health, term aur motor insurance pe advice dene aur facilitate karne ke liye authorised hain." },
    { q: "The Financial Doctor kaunsi insurance companies ke saath kaam karti hai?", a: "Hum life, health aur motor insurance category ki leading insurance companies ke saath partnership mein hain taaki aapke paas sirf ek company ka nahi balki real choice ho." },
    { q: "The Financial Doctor meri identity (KYC) kaise verify karti hai?", a: "KYC hamare partner platform ke through digitally complete hota hai, aapke PAN, Aadhaar-linked details aur standard regulatory verification use karke — zyada tar investors ke liye yeh ek baar ka process hai." },
    { q: "Kya The Financial Doctor kisi government ya regulatory authority ke saath registered hai?", a: "Haan, hum AMFI ke saath ARN-290298 ke under Mutual Fund Distributor ke roop mein registered hain, jo India mein mutual fund distribution ko oversee karne wali regulatory body hai." },
    { q: "Main The Financial Doctor ka ARN number kaise verify kar sakta hoon?", a: "Aap AMFI ki official website pe ARN-290298 verify kar sakte ho, ya hamari AssetPlus distributor profile bhi dekh sakte ho, dono hamari registered distributor status confirm karte hain." },
    { q: "The Financial Doctor ka client banne mein kitna time lagta hai?", a: "Free pehli consultation ke baad, KYC aur hamare digital platform pe onboarding mein zyada tar clients ke liye sirf ek-do din lagte hain. Jaise, subah e-KYC complete karne wala client often agle din tak apni pehli SIP start kar sakta hai." },
    { q: "Kya invest shuru karne ke liye mujhe physical documents sign karne honge?", a: "Aajkal zyada tar onboarding pura digital hai — e-KYC aur e-signature — phir bhi agar aap chahen ya koi specific product maange to physical documentation bhi ho sakta hai." },
    { q: "Kya main apne current advisor ya bank se The Financial Doctor mein shift ho sakta hoon?", a: "Haan, hum often clients ko unke existing mutual fund aur insurance portfolio ko hamare paas transition karne mein help karte hain, bina aapki holdings mein kisi disruption ke. Jaise, hum bina ek bhi unit redeem kiye, aapki existing SIP folio ki servicing apne paas le sakte hain." },
    { q: "Kya The Financial Doctor Hindi mein service deti hai?", a: "Haan, hamari team Hindi, English aur Hinglish mein comfortably baat karti hai, jo bhi aapko sabse convenient lage." },
    { q: "Team kaunsi languages bolti hai?", a: "Hum Hindi, English aur Hinglish mein baat karte hain taaki explanation hamesha clear lage, textbook-technical nahi." },
    { q: "Kya The Financial Doctor us insaan ke liye sahi hai jise investing ke baare mein kuch nahi pata?", a: "Haan, hum first-time investors ko simple language mein samjhane mein specialize karte hain — pehle se koi investment knowledge zaroori nahi hai. Jaise, koi fund suggest karne se pehle hum simple words mein samjhayenge ki SIP ya NAV actually hota kya hai." },
    { q: "Kya aap sirf high-net-worth clients ke saath kaam karte ho?", a: "Nahi, hum har income level ke clients ke saath kaam karte hain, ₹500 ki SIP shuru karne wale se lekar bada portfolio plan karne wale families tak." },
    { q: "The Financial Doctor ke saath kaam karne ke liye koi minimum investment amount hai?", a: "Koi strict minimum nahi hai — kai clients kuch sau rupaye ki monthly SIP se start karte hain aur wahan se aage badhte hain." },
    { q: "Kya The Financial Doctor NRIs ko India mein invest karne mein help karti hai?", a: "Haan, hum NRE/NRO-linked mutual fund aur insurance investment mein NRI clients ki help karte hain, applicable regulatory documentation ke saath. Jaise, Dubai mein rehne wala koi NRI client NRE-linked SIP start kar sakta hai aur pura portfolio video call se hi review kar sakta hai." },
    { q: "The Financial Doctor market aur regulatory changes ke saath kaise updated rehti hai?", a: "Ongoing AMFI-mandated training, continuous learning, aur hamare AMC aur insurer partners ke saath close connection hamari advice ko hamesha updated rakhta hai." },
    { q: "Bank relationship manager se The Financial Doctor kaise different hai?", a: "Bank RM ke paas often sirf us ek bank ke product targets hote hain, jabki hum 40+ AMC aur insurer partners ke saath kaam karte hain aur long-term, goal-first relationship banate hain. Jaise, bank RM often usi bank ke fund house ki taraf leaning hota hai, jabki hum ek hi goal ke liye 40+ AMC mein se freely compare kar sakte hain." },
    { q: "App se directly invest karne se The Financial Doctor kaise different hai?", a: "App aapko khud research aur decision lene ke liye chhod deta hai; hum ek human advisor add karte hain jo aapki puri financial picture samajhta hai, questions ke jawab deta hai, aur life change hone pe aapki plan review karta hai — yeh sab Regular Plan aur ongoing support ke saath." },
    { q: "Kya aap pehle investment ke baad bhi mera portfolio review karte ho, ya yeh sirf ek baar ka interaction hai?", a: "Hum periodic portfolio reviews ke saath engaged rehte hain — hamara goal long-term relationship hai, ek baar ka transaction nahi. Jaise, agar market sharply girta hai, to hum khud aapse contact karenge, aapko yeh sochne ke liye nahi chhodenge ki panic mein bechna hai ya nahi." },
    { q: "Kya main jab chahoon The Financial Doctor ke saath kaam karna band kar sakta hoon?", a: "Haan, hamare advisory relationship mein koi lock-in nahi hai — aapke investments hamesha aapke hi rehte hain, aur aap kabhi bhi unhe manage ya move karne ke liye free ho." },
    { q: "Main The Financial Doctor ke saath kaise start karoon?", a: "Bas hamare Contact page ya WhatsApp ke through apni free pehli consultation book karo — hum aapke goals samjhenge aur wahan se aage badhenge." },
  ],
};

export default function AboutPage() {
  const [openRegion, setOpenRegion] = useState(-1);
  return (
    <div className="relative" data-testid="about-page-root">
      <SEO
        title="The Financial Doctor | About Us"
        description="Meet The Financial Doctor — an AMFI-registered mutual fund and insurance advisory led by Sagar Chaturvedi, built on transparent, goal-based financial planning."
        keywords="Sagar Chaturvedi, Sagar Chaturvedi Financial Doctor, Sagar Chaturvedi ARN-290298, Sagar Chaturvedi Sehore, Sagar Chaturvedi mutual fund distributor, financial advisor India, mutual fund advisor, mutual fund distributor, best mutual fund advisor, AMFI registered mutual fund distributor, about The Financial Doctor, mutual funds, mutual fund, mutal fund, HDFC Mutual Fund, ICICI Prudential Mutual Fund, SBI Mutual Fund, Axis Mutual Fund, Nippon India Mutual Fund, Kotak Mutual Fund, Aditya Birla Sun Life Mutual Fund, UTI Mutual Fund, DSP Mutual Fund, Franklin Templeton Mutual Fund, Tata Mutual Fund, Mirae Asset Mutual Fund, Motilal Oswal Mutual Fund, Invesco Mutual Fund"
        path="/about"
      />
      <Navbar />
      <main>
        {/* EDITORIAL / MOTIVATIONAL HERO — warm parchment instead of navy,
            a real portrait leading the page (not a 44px byline avatar) paired
            with a left-aligned pull-quote, terracotta accent instead of
            brand blue. Photo-left/quote-right on desktop; on mobile the
            portrait leads full-width above the quote instead of shrinking
            into a tiny circle, so it reads as a proper editorial spread at
            both sizes, not a scaled-down badge. */}
        <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-20 px-6" style={{ background: "#F1E6D3" }}>
          <div className="container-x relative max-w-5xl mx-auto">
            <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D8B98A] text-[11px] tracking-[0.2em] uppercase text-[#8A5A22] font-semibold">
              About Sagar
            </div>
            <h1 className="sr-only">
              About The Financial Doctor — Sagar Chaturvedi, AMFI-Registered Advisor
            </h1>
            <div className="mt-8 grid md:grid-cols-[280px,1fr] lg:grid-cols-[320px,1fr] gap-8 md:gap-12 items-center">
              <div className="fund-animate-in fund-animate-in-delay-1 relative mx-auto md:mx-0 w-[220px] sm:w-[260px] md:w-full">
                <div className="absolute -inset-3 rounded-[2.5rem] border-2 border-[#D8B98A] -rotate-3" aria-hidden />
                <div className="relative rounded-[2.5rem] overflow-hidden border border-[#D8B98A] rotate-1 shadow-lg">
                  <img
                    src={SAGAR_PHOTO}
                    alt="Sagar Chaturvedi — Founder, The Financial Doctor"
                    width={640}
                    height={880}
                    className="w-full h-auto object-cover"
                    loading="eager"
                    fetchpriority="high"
                  />
                </div>
                <div className="absolute -bottom-4 -right-3 sm:-right-5 bg-[#0E1B2C] text-[#F6F1E8] rounded-2xl px-4 py-2.5 shadow-lg">
                  <div className="font-display text-sm leading-tight">Sagar Chaturvedi</div>
                  <div className="text-[9.5px] uppercase tracking-[0.16em] text-[#D8B98A] mt-0.5">Founder · ARN-290298</div>
                </div>
              </div>

              <div className="fund-animate-in fund-animate-in-delay-2 text-center md:text-left mt-6 md:mt-0">
                <blockquote aria-hidden="true">
                  <p className="font-display italic text-[24px] sm:text-[30px] md:text-[34px] leading-[1.25] text-[#3A2E1D]">
                    "Every rupee has a job. Ours is to make sure it's doing the right one — for
                    your goals, not for someone else's targets."
                  </p>
                </blockquote>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-2 mt-7 text-sm text-[#6B5636]">
                  <span><b className="text-[#3A2E1D]">8+ years</b> advisory experience</span>
                  <span className="hidden sm:inline">·</span>
                  <span><b className="text-[#3A2E1D]">1000+</b> families empowered</span>
                  <span className="hidden sm:inline">·</span>
                  <span><b className="text-[#3A2E1D]">Goal-first</b>, not product-first</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <ProblemSolution
          accent="#B8722E"
          problem="Most financial advice online is either generic ('just start a SIP') or so full of jargon that it's easier to just do nothing — and doing nothing is how most people miss 10+ years of compounding."
          solution="We sit with you, understand your actual goals and income, and explain every recommendation in plain Hindi/English/Hinglish — no product is suggested until it's clear why it fits you specifically."
        />
        <About hideHeading />

        {/* PAN-INDIA REACH — told through how differently each region
            actually relates to money, not a generic coverage map. Keeps
            the hero's warm-parchment palette instead of switching to navy. */}
        <section className="py-16 px-6" style={{ background: "#F1E6D3" }}>
          <div className="container-x max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D8B98A] text-[11px] tracking-[0.2em] uppercase text-[#8A5A22] font-semibold">
                India-Wide, Not Just Sehore
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#3A2E1D] mt-4">
                Every region trusts money differently — <span className="italic">we don't flatten that into one template.</span>
              </h2>
              <p className="mt-4 text-[#6B5636] leading-relaxed text-[15px]">
                Gold in the south, business reinvestment in Gujarat, government-salary discipline in MP, ambition in the metros —
                we meet every family exactly where their own culture already trusts money to grow, then add the one thing
                usually missing: a written, goal-based plan.
              </p>
            </div>
            {/* Mobile: single-open accordion list (tap a region to read its
                note) instead of a horizontal card slider; desktop: full
                4-col grid, since all 8 regions read well at a glance on a
                wider screen. Genuinely different interaction per
                breakpoint, not the same cards reflowed. */}
            <div className="sm:hidden mt-10 space-y-2.5">
              {regions.map((r, idx) => {
                const isOpen = openRegion === idx;
                return (
                  <div key={r.name} className="bg-white/60 border border-[#D8B98A]/50 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenRegion(isOpen ? -1 : idx)}
                      className="w-full flex items-center gap-2 px-4 py-3.5 text-left"
                    >
                      <MapPin size={14} className="text-[#8A5A22] shrink-0" />
                      <span className="flex-1 font-display text-[#8A5A22] text-[15px]">{r.name}</span>
                      <ChevronDown size={15} className={`shrink-0 text-[#B8722E] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-[#6B5636] leading-relaxed">{r.note}</p>
                        <Link to={r.href} className="inline-flex items-center gap-1 mt-2.5 text-xs font-medium text-[#B8722E]">
                          View {r.name} page <span aria-hidden>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 mt-10">
              {regions.map((r) => (
                <Link
                  key={r.name}
                  to={r.href}
                  className="block bg-white/60 border border-[#D8B98A]/50 rounded-2xl p-5 hover:bg-white hover:border-[#B8722E]/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-[#8A5A22] font-display text-[15px]">
                    <MapPin size={14} /> {r.name}
                  </div>
                  <p className="text-sm text-[#6B5636] leading-relaxed mt-2">{r.note}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* OUR STORY — journey timeline instead of a stock photo */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto mb-16">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#8A5A22] font-semibold uppercase tracking-wider">
                <MapPin size={13} /> Sehore, Madhya Pradesh
              </div>
              <h2 className="text-3xl font-serif text-[#0E1B2C] mt-3 mb-4">
                Our Story
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
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-[#0A66C2]"
              >
                <Linkedin size={16} /> Connect with Sagar on LinkedIn
              </a>
            </div>

            {/* JOURNEY — mobile: vertical stacked slider (swipe); desktop:
                genuinely different structure, a landscape roadmap with a
                connecting rail running left-to-right, not just the mobile
                layout stretched wider. */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:hidden">
              {journey.map((j) => (
                <div key={j.year} className="shrink-0 w-[78%] snap-center bg-white border border-[#E2D8C2] rounded-2xl p-5">
                  <div className="font-display text-lg" style={{ color: "#B8722E" }}>{j.year}</div>
                  <p className="text-sm text-[#2A364B]/80 mt-1 leading-relaxed">{j.text}</p>
                </div>
              ))}
            </div>
            <div className="hidden md:block relative pt-2">
              <div className="absolute top-[13px] left-0 right-0 h-0.5 bg-[#D8B98A]" aria-hidden />
              <div className="grid grid-cols-5 gap-6">
                {journey.map((j) => (
                  <div key={j.year} className="relative pt-7">
                    <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full bg-[#B8722E] border-2 border-[#FBF7EE] ring-2 ring-[#D8B98A]" aria-hidden />
                    <div className="font-display text-lg" style={{ color: "#B8722E" }}>{j.year}</div>
                    <p className="text-sm text-[#2A364B]/80 mt-1.5 leading-relaxed">{j.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PARTNERS */}
          <div className="container-x max-w-5xl mx-auto mb-16">
            <h3 className="text-2xl font-serif text-[#0E1B2C] mb-8 text-center">
              Backed by Trusted Partners
            </h3>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
              {partners.map((p) => (
                <div key={p.name} className="shrink-0 w-[75%] snap-center md:w-auto md:shrink bg-white border border-[#E2D8C2] rounded-2xl p-6 text-center shadow-sm">
                  <h4 className="font-display text-[#024396] mb-1">{p.name}</h4>
                  <p className="text-sm text-[#2A364B]/80">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OUR PROMISE — one unified band instead of two matching
              trust-badge cards: a single centered pull-quote carries the
              non-custody promise, then a fact-strip beneath (not a second
              card) carries the "rooted locally" details as individual
              tags. Breaks the symmetric 2-card pattern used for similar
              blocks elsewhere on the site. */}
          <div className="container-x max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-[#0E1B2C] px-6 py-10 md:px-14 md:py-12 text-center">
              <div
                aria-hidden
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-[120px] leading-none font-display select-none pointer-events-none opacity-[0.08]"
                style={{ color: "#D8B98A" }}
              >
                &ldquo;
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D8B98A] font-semibold">
                  <ShieldOff size={12} /> Our promise
                </div>
                <p className="font-display text-xl sm:text-2xl md:text-[26px] leading-snug text-[#F6F1E8] mt-4 max-w-2xl mx-auto">
                  We never hold your money — it stays in your name, with the AMC or insurer
                  directly. We only advise and facilitate.
                </p>
              </div>
              <div className="relative flex flex-wrap items-center justify-center gap-3 mt-8 pt-7 border-t border-[#2A364B]">
                <span className="inline-flex items-center gap-1.5 bg-[#152238] border border-[#2A364B] rounded-full px-3.5 py-1.5 text-xs text-[#F6F1E8]/85">
                  <MapPin size={13} className="text-[#D8B98A]" /> Sehore, Madhya Pradesh
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#152238] border border-[#2A364B] rounded-full px-3.5 py-1.5 text-xs text-[#F6F1E8]/85">
                  <Video size={13} className="text-[#D8B98A]" /> In-person or over video
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#152238] border border-[#2A364B] rounded-full px-3.5 py-1.5 text-xs text-[#F6F1E8]/85">
                  <Languages size={13} className="text-[#D8B98A]" /> Hindi · English · Hinglish
                </span>
              </div>
            </div>
          </div>
        </section>

        <FAQSection title="About Us — Frequently Asked Questions" data={aboutFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
