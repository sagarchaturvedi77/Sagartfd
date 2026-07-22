import React from "react";
import { Check, HeartPulse, Car, Users2, ShieldCheck } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import ProblemSolution from "@/components/ProblemSolution";

// Icon-driven cards instead of generic Western stock photography — no
// external image hotlinks (removes an Unsplash dependency and its
// render-blocking-adjacent cost on mobile), and the icon+brand-colour
// treatment reads as intentional design rather than mismatched stock photos.
const insuranceTypes = [
  {
    title: "Health Insurance",
    icon: HeartPulse,
    color: "#C7102E",
    why: "Medical costs in India have risen sharply, and a single hospitalization can wipe out years of savings. Health insurance ensures treatment doesn't come at the cost of your financial goals.",
    points: [
      "Cashless treatment at network hospitals",
      "Covers pre and post hospitalization expenses",
      "Tax benefit under Section 80D",
    ],
  },
  {
    title: "Motor Insurance",
    icon: Car,
    color: "#024396",
    why: "Motor insurance is mandatory by law in India, but beyond compliance, it protects you from heavy repair costs, third-party liability, and theft.",
    points: [
      "Third-party liability is legally required",
      "Comprehensive cover protects your own vehicle too",
      "Add-ons like zero depreciation reduce out-of-pocket cost",
    ],
  },
  {
    title: "Life Insurance",
    icon: Users2,
    color: "#0F6E5C",
    why: "Life insurance ensures your family's financial stability — loan repayments, daily expenses, and future goals — continues uninterrupted if something happens to you.",
    points: [
      "Replaces lost income for dependents",
      "Can be combined with savings/investment components",
      "Tax benefits under Section 80C and 10(10D)",
    ],
  },
  {
    title: "Term Insurance",
    icon: ShieldCheck,
    color: "#8B5CF6",
    why: "Term insurance gives the highest life cover at the lowest premium — pure protection without any investment component, ideal for young earners and breadwinners.",
    points: [
      "Highest sum assured for the lowest premium",
      "Simple, no-frills financial protection",
      "Critical illness and accidental riders available",
    ],
  },
];

export const servicesFAQ = {
  en: [
    { q: "Which insurance should I buy first?", a: "Term insurance and health insurance are usually the first two priorities, since they protect against the biggest financial risks — death and medical emergencies. For example, a ₹1 crore term cover and a ₹10 lakh family health policy together might cost under ₹1,500/month for a young, healthy earner." },
    { q: "Can I buy insurance and mutual funds together through you?", a: "Yes, we help you plan both protection (insurance) and growth (mutual funds) as part of one cohesive financial plan." },
    { q: "Do you charge a fee for insurance advice?", a: "Insurance advisory is typically commission-based through the insurer, so there's no separate advisory fee for standard policy guidance." },
    { q: "How much life cover do I need?", a: "A common guideline is 10-15 times your annual income, but it depends on your loans, dependents, and existing savings — we calculate this for you. For example, someone earning ₹8 lakh a year with a home loan and two dependents might work out to roughly ₹80 lakh-₹1.2 crore of cover once loans and future goals are factored in." },
    { q: "Is term insurance better than a regular life policy?", a: "For pure protection, term insurance offers more cover per rupee. Regular/endowment plans combine insurance with investment but usually at lower returns. For example, a ₹1 crore term cover might cost a healthy 30-year-old around ₹800-1,200/month, while a similar-value endowment plan can cost several times more for the same protection, with an investment component mixed in." },
    { q: "Does motor insurance cover natural disasters?", a: "A comprehensive (own-damage) motor policy typically covers flood, fire, and storm damage, while a third-party-only policy does not." },
    { q: "What is a SIP?", a: "A SIP (Systematic Investment Plan) lets you invest a fixed amount in a mutual fund every month, building a corpus gradually through disciplined, rupee-cost-averaged investing. For example, a ₹5,000/month SIP continued for 15 years at an assumed 12% return could grow to roughly ₹25 lakh — the calculator on this site shows your own numbers." },
    { q: "What's the minimum amount to start a SIP?", a: "Many mutual funds allow SIPs starting as low as ₹500 a month, making it accessible for almost any budget." },
    { q: "How is a SIP different from a Recurring Deposit?", a: "A Recurring Deposit gives fixed, guaranteed bank interest, while a SIP invests in market-linked mutual funds with potentially higher but variable returns over the long term. For instance, a 5-year RD might guarantee around 6-7% annually, while an equity SIP over the same period could return more or less depending on markets — there's no fixed promise either way." },
    { q: "Which mutual fund category should a beginner start with?", a: "Beginners often start with large-cap or flexi-cap equity funds for relative stability, or hybrid funds for a mix of equity and debt — we tailor this to your goals and risk appetite." },
    { q: "Do you sell Direct Plan mutual funds?", a: "No, as a Mutual Fund Distributor we offer Regular Plans, which include ongoing advisory support and servicing bundled into the expense ratio." },
    { q: "What's the difference between Regular Plan and Direct Plan?", a: "A Direct Plan is bought straight from the AMC with no distributor involved and a slightly lower expense ratio; a Regular Plan, which we offer, includes an advisor's guidance, service, and support at a marginally higher expense ratio. For example, on a ₹5 lakh investment, a 0.5% expense ratio difference works out to roughly ₹2,500 a year — which is what funds the ongoing advice and service that comes with a Regular Plan." },
    { q: "Can I start a SIP for my child's education?", a: "Yes, we help you calculate the goal amount needed and set up a dedicated SIP aligned to your child's education timeline. For instance, if you need ₹15 lakh in 12 years for their higher education, we work backward to tell you the monthly SIP required to reach that target." },
    { q: "What is an ELSS fund?", a: "ELSS (Equity Linked Savings Scheme) is an equity mutual fund with a 3-year lock-in that also qualifies for tax deduction up to ₹1.5 lakh under Section 80C. For example, investing ₹1.5 lakh in ELSS within a year could lower your taxable income by that amount, depending on your tax slab." },
    { q: "Is ELSS better than PPF for tax saving?", a: "ELSS has market-linked, potentially higher returns with only a 3-year lock-in, while PPF is government-backed with fixed returns and a 15-year lock-in — the right choice depends on your risk appetite and time horizon." },
    { q: "What is STP and when should I use it?", a: "A Systematic Transfer Plan moves a lump sum gradually from one fund (usually debt) into another (usually equity) at regular intervals, reducing the risk of investing all at once at a market high. For example, moving ₹6 lakh from a debt fund into an equity fund via a ₹1 lakh/month STP over six months smooths out your average entry price instead of investing it all on a single day." },
    { q: "What is an SWP?", a: "A Systematic Withdrawal Plan lets you withdraw a fixed amount regularly from your mutual fund investment, useful for generating a regular income post-retirement. For example, withdrawing ₹10,000 a month from a ₹20 lakh corpus gives a retiree a regular income stream while the remaining amount stays invested." },
    { q: "Can I invest in mutual funds for retirement planning?", a: "Yes, a mix of equity and hybrid mutual funds, combined with SIPs over the long term, is a common way to build a retirement corpus alongside options like NPS and PPF." },
    { q: "Do you help with tax planning beyond ELSS?", a: "Yes, we look at your full picture — 80C investments, insurance premiums under 80D, and applicable deductions — to help you plan efficiently; final filing should always be confirmed with a qualified tax professional." },
    { q: "What's the difference between Old and New tax regime?", a: "The Old Regime allows deductions like 80C and HRA but has higher slab rates; the New Regime has lower slab rates but fewer deductions — which is better depends on your specific deductions, and we can help you compare." },
    { q: "Is mutual fund investment safe?", a: "Mutual funds are market-linked and carry risk — they are not guaranteed like a fixed deposit — but they're professionally managed and regulated by SEBI, and risk can be managed through diversification and the right fund category for your horizon." },
    { q: "Can I lose money in a SIP?", a: "Yes, since SIPs invest in market-linked mutual funds, short-term value can go down; however, staying invested over a longer horizon has historically helped average out volatility." },
    { q: "How do I choose between equity and debt mutual funds?", a: "Equity funds suit longer-term goals (5+ years) with higher growth potential and higher risk; debt funds suit shorter-term goals needing more stability — we help you split based on your goal timeline." },
    { q: "What documents do I need to start investing?", a: "You typically need PAN, Aadhaar-linked KYC, a bank account, and a mobile number/email for e-KYC — we guide you through the entire digital process." },
    { q: "Can I redeem my mutual fund investment anytime?", a: "Most open-ended mutual funds (except ELSS during its lock-in) can be redeemed anytime, though equity funds may attract exit load if redeemed very early and short-term capital gains tax may apply." },
    { q: "What is health insurance co-payment?", a: "Co-payment is the percentage of a medical claim you agree to pay yourself, with the insurer covering the rest — policies with co-payment usually have lower premiums. For example, a 10% co-payment on a ₹2 lakh claim means you pay ₹20,000 and the insurer settles the remaining ₹1.8 lakh." },
    { q: "Does health insurance cover pre-existing diseases?", a: "Most policies cover pre-existing diseases after a waiting period, typically 2-4 years, which varies by insurer and plan — we help you compare this before you buy." },
    { q: "What is a family floater health plan?", a: "A family floater covers your entire family under a single sum insured that any member can use, usually working out cheaper than separate individual policies. For example, a family of four sharing a single ₹10 lakh sum insured usually costs less than buying four separate ₹5 lakh individual policies." },
    { q: "How much health cover should I buy?", a: "For a family in a Tier-2/3 city, ₹5-10 lakh is often a reasonable starting cover, though metro-city families or those wanting extra protection may consider ₹10-25 lakh, ideally topped up further." },
    { q: "What is a top-up health insurance plan?", a: "A top-up plan adds extra cover above a deductible threshold at a low premium, letting you boost your total health cover affordably without replacing your base policy. For example, a ₹5 lakh base policy plus a ₹15 lakh top-up above a ₹5 lakh deductible gives you ₹20 lakh of effective cover, often at a fraction of what a standalone ₹20 lakh policy would cost." },
    { q: "Is cashless treatment available with all health policies?", a: "Cashless treatment is available only at your insurer's network hospitals; treatment elsewhere is usually settled via reimbursement after discharge." },
    { q: "Does health insurance cover maternity expenses?", a: "Some policies cover maternity, usually after a waiting period of 2-4 years — this needs to be checked specifically at the time of buying if it's a priority for you." },
    { q: "What does third-party motor insurance cover?", a: "Third-party motor insurance, mandatory by law, covers damage or injury you cause to another person or their property, but not damage to your own vehicle." },
    { q: "What's the difference between third-party and comprehensive motor insurance?", a: "Third-party only covers liability towards others and is legally mandatory; comprehensive also covers your own vehicle's damage, theft, and natural calamities, offering much wider protection." },
    { q: "What is zero depreciation cover in motor insurance?", a: "Zero depreciation (or 'zero dep') is an add-on that ensures you get the full claim amount on parts replacement without depreciation being deducted, useful for newer cars." },
    { q: "Does motor insurance cover two-wheelers too?", a: "Yes, both third-party and comprehensive motor insurance are available for two-wheelers, with similar add-ons like zero depreciation and roadside assistance." },
    { q: "What happens if my motor insurance lapses?", a: "Driving with a lapsed policy is illegal for the mandatory third-party cover and leaves you fully exposed to claim costs — we recommend timely renewal, which we can also assist with." },
    { q: "What's the difference between term insurance and health insurance?", a: "Term insurance pays a lump sum to your family if you pass away during the policy term; health insurance covers your medical treatment costs while you're alive — both serve different, essential purposes." },
    { q: "Can I buy term insurance if I already have a life policy from my employer?", a: "Yes, employer group cover usually ends when you leave the job, so an individual term plan is recommended for continuous, portable protection." },
    { q: "Does term insurance cover critical illness?", a: "Base term insurance covers death only; critical illness is typically available as an add-on rider for an additional premium." },
    { q: "What is the ideal age to buy term insurance?", a: "Buying young, in your 20s or early 30s, locks in a lower premium for the same cover, since premiums rise with age and health risk. For example, a ₹1 crore term cover might cost around ₹700-900/month if bought at 25, versus ₹1,500+/month for the same cover bought at 40." },
    { q: "Does term insurance have any maturity value if I outlive the policy?", a: "A pure term plan pays nothing on survival — that's exactly why the premium is so low compared to endowment or ULIP plans." },
    { q: "What is a ULIP and do you recommend it?", a: "A ULIP combines life insurance with market-linked investment; we generally recommend keeping insurance and investment separate — pure term insurance for protection and mutual funds for growth — for better transparency and returns." },
    { q: "How are mutual fund returns taxed?", a: "Equity fund gains held over a year are taxed as long-term capital gains, and shorter holdings as short-term gains; debt fund taxation follows separate rules — we can walk you through the basics, though final tax filing should go through a qualified tax professional." },
    { q: "Can I set up multiple SIPs for different goals?", a: "Yes, most clients run separate SIPs for different goals — retirement, a child's education, a house down payment — so progress on each goal stays clearly trackable. For example, a client might run a ₹5,000 SIP for retirement, a ₹3,000 SIP for a child's education, and a ₹2,000 SIP for a house down payment, each tracked against its own target." },
    { q: "What is rupee cost averaging in a SIP?", a: "Since a SIP invests a fixed amount regularly regardless of market level, you automatically buy more units when prices are low and fewer when high, averaging your purchase cost over time. For example, your fixed ₹5,000 buys more units when the NAV dips to ₹20 and fewer units when it rises to ₹25, smoothing out your average cost." },
    { q: "Can I increase my SIP amount later?", a: "Yes, you can increase, decrease, pause, or stop a SIP at almost any time, and we also offer Step-up SIPs that automatically increase your investment every year. For example, a Step-up SIP starting at ₹5,000/month with a 10% annual increase would have you investing around ₹8,000/month by the fifth year." },
    { q: "Do you help with health insurance claims?", a: "Yes, we assist clients with claim guidance and coordination with the insurer, even though the claim decision itself always rests with the insurance company." },
    { q: "Do you offer a combined review of my insurance and mutual fund portfolio?", a: "Yes, a periodic portfolio and protection review is part of how we work with clients, so your coverage and investments stay aligned as your life changes." },
    { q: "How do I get started with any of these services?", a: "Book a free first consultation through our Contact page or WhatsApp — we'll understand your goals across investment, insurance, and tax planning before suggesting anything." },
  ],
  hi: [
    { q: "मुझे पहले कौन सा इंश्योरेंस लेना चाहिए?", a: "टर्म इंश्योरेंस और हेल्थ इंश्योरेंस आमतौर पर पहली प्राथमिकता होती है, क्योंकि ये सबसे बड़े फाइनेंशियल रिस्क — मृत्यु और मेडिकल इमरजेंसी — से बचाते हैं। उदाहरण के लिए, एक युवा स्वस्थ कमाने वाले के लिए ₹1 करोड़ का टर्म कवर और ₹10 लाख की फैमिली हेल्थ पॉलिसी मिलाकर ₹1,500/माह से कम में आ सकती है।" },
    { q: "क्या मैं आपके through इंश्योरेंस और म्यूचुअल फंड दोनों ले सकता हूँ?", a: "हाँ, हम प्रोटेक्शन (इंश्योरेंस) और ग्रोथ (म्यूचुअल फंड) दोनों को एक साथ प्लान करने में मदद करते हैं।" },
    { q: "क्या इंश्योरेंस सलाह के लिए कोई फीस लगती है?", a: "इंश्योरेंस एडवाइजरी आमतौर पर इंश्योरर के कमीशन पर आधारित होती है, इसलिए सामान्य पॉलिसी गाइडेंस के लिए अलग से फीस नहीं लगती।" },
    { q: "मुझे कितना लाइफ कवर लेना चाहिए?", a: "सामान्य नियम है आपकी सालाना इनकम का 10-15 गुना, लेकिन यह आपके लोन, डिपेंडेंट्स और सेविंग्स पर निर्भर करता है — यह हम कैलकुलेट करते हैं। उदाहरण के लिए, ₹8 लाख सालाना कमाने वाले किसी व्यक्ति के लिए, जिस पर होम लोन और दो डिपेंडेंट हैं, लोन और भविष्य के गोल्स को जोड़कर लगभग ₹80 लाख-₹1.2 करोड़ का कवर बन सकता है।" },
    { q: "क्या टर्म इंश्योरेंस रेगुलर लाइफ पॉलिसी से बेहतर है?", a: "सिर्फ प्रोटेक्शन के लिए टर्म इंश्योरेंस ज्यादा कवर देता है कम प्रीमियम में। एंडोमेंट प्लान इंश्योरेंस और निवेश दोनों मिलाते हैं पर रिटर्न कम होता है। उदाहरण के लिए, एक स्वस्थ 30 साल के व्यक्ति के लिए ₹1 करोड़ का टर्म कवर लगभग ₹800-1,200/माह में मिल सकता है, जबकि इतने ही वैल्यू का एंडोमेंट प्लान उसी प्रोटेक्शन के लिए कई गुना ज्यादा खर्च कर सकता है, साथ में एक निवेश हिस्सा भी मिलाकर।" },
    { q: "क्या मोटर इंश्योरेंस प्राकृतिक आपदा को कवर करता है?", a: "कॉम्प्रिहेंसिव (ओन-डैमेज) मोटर पॉलिसी में फ्लड, फायर और स्टॉर्म डैमेज कवर होता है, जबकि सिर्फ थर्ड-पार्टी पॉलिसी में नहीं।" },
    { q: "SIP क्या है?", a: "SIP (सिस्टेमेटिक इन्वेस्टमेंट प्लान) से आप हर महीने म्यूचुअल फंड में एक फिक्स्ड राशि निवेश करते हैं, जिससे अनुशासित तरीके से धीरे-धीरे कॉर्पस बनता है। उदाहरण के लिए, ₹5,000/माह की SIP को 15 साल तक 12% के अनुमानित रिटर्न पर चलाया जाए तो यह लगभग ₹25 लाख तक बढ़ सकती है — इस साइट पर मौजूद कैलकुलेटर आपके खुद के नंबर दिखाता है।" },
    { q: "SIP शुरू करने के लिए न्यूनतम राशि क्या है?", a: "कई म्यूचुअल फंड्स में SIP सिर्फ ₹500 प्रति माह से शुरू की जा सकती है, जो लगभग हर बजट के लिए सुलभ है।" },
    { q: "SIP और Recurring Deposit में क्या फर्क है?", a: "Recurring Deposit में फिक्स्ड, गारंटीड बैंक इंटरेस्ट मिलता है, जबकि SIP मार्केट-लिंक्ड म्यूचुअल फंड में निवेश करती है जिसमें लंबे समय में संभावित रूप से ज्यादा पर वेरिएबल रिटर्न मिलता है। उदाहरण के लिए, 5 साल की RD में लगभग 6-7% सालाना गारंटीड मिल सकता है, जबकि उसी अवधि में इक्विटी SIP मार्केट के हिसाब से इससे ज्यादा या कम रिटर्न दे सकती है — दोनों में से किसी की भी कोई फिक्स्ड गारंटी नहीं है।" },
    { q: "एक शुरुआती व्यक्ति को किस म्यूचुअल फंड कैटेगरी से शुरुआत करनी चाहिए?", a: "शुरुआती लोग अक्सर लार्ज-कैप या फ्लेक्सी-कैप इक्विटी फंड्स से शुरू करते हैं स्थिरता के लिए, या हाइब्रिड फंड्स से इक्विटी और डेट के मिश्रण के लिए — हम इसे आपके गोल्स और रिस्क के हिसाब से तय करते हैं।" },
    { q: "क्या आप Direct Plan म्यूचुअल फंड बेचते हैं?", a: "नहीं, एक म्यूचुअल फंड डिस्ट्रीब्यूटर के रूप में हम Regular Plan ऑफर करते हैं, जिसमें एक्सपेंस रेशियो में एडवाइजरी सपोर्ट और सर्विसिंग शामिल होती है।" },
    { q: "Regular Plan और Direct Plan में क्या फर्क है?", a: "Direct Plan सीधे AMC से बिना डिस्ट्रीब्यूटर के खरीदा जाता है और इसका एक्सपेंस रेशियो थोड़ा कम होता है; Regular Plan, जो हम ऑफर करते हैं, में एडवाइजर की गाइडेंस, सर्विस और सपोर्ट थोड़े ज्यादा एक्सपेंस रेशियो में शामिल होता है। उदाहरण के लिए, ₹5 लाख के निवेश पर 0.5% का एक्सपेंस रेशियो फर्क लगभग ₹2,500 सालाना बनता है — यही राशि Regular Plan के साथ मिलने वाली एडवाइजरी और सर्विस को फंड करती है।" },
    { q: "क्या मैं अपने बच्चे की एजुकेशन के लिए SIP शुरू कर सकता हूँ?", a: "हाँ, हम जरूरी गोल अमाउंट कैलकुलेट करते हैं और आपके बच्चे की एजुकेशन टाइमलाइन के हिसाब से एक डेडिकेटेड SIP सेट करते हैं। उदाहरण के लिए, अगर आपको 12 साल बाद हायर एजुकेशन के लिए ₹15 लाख चाहिए, तो हम पीछे से कैलकुलेट करके बताते हैं कि इस लक्ष्य तक पहुंचने के लिए मासिक SIP कितनी होनी चाहिए।" },
    { q: "ELSS फंड क्या है?", a: "ELSS (इक्विटी लिंक्ड सेविंग्स स्कीम) एक इक्विटी म्यूचुअल फंड है जिसका 3 साल का लॉक-इन होता है और यह Section 80C के तहत ₹1.5 लाख तक टैक्स डिडक्शन के लिए भी योग्य है। उदाहरण के लिए, एक साल में ELSS में ₹1.5 लाख निवेश करने से आपकी टैक्सेबल इनकम उतनी ही कम हो सकती है, आपके टैक्स स्लैब के हिसाब से।" },
    { q: "टैक्स सेविंग के लिए ELSS PPF से बेहतर है?", a: "ELSS में मार्केट-लिंक्ड, संभावित रूप से ज्यादा रिटर्न मिलता है सिर्फ 3 साल के लॉक-इन के साथ, जबकि PPF सरकार समर्थित है फिक्स्ड रिटर्न और 15 साल के लॉक-इन के साथ — सही चुनाव आपके रिस्क और समय सीमा पर निर्भर करता है।" },
    { q: "STP क्या है और इसे कब इस्तेमाल करना चाहिए?", a: "Systematic Transfer Plan एक लम्पसम राशि को धीरे-धीरे एक फंड (आमतौर पर डेट) से दूसरे फंड (आमतौर पर इक्विटी) में नियमित अंतराल पर ट्रांसफर करता है, जिससे एक साथ मार्केट हाई पर पूरा निवेश करने का रिस्क कम होता है। उदाहरण के लिए, ₹6 लाख को डेट फंड से इक्विटी फंड में ₹1 लाख/माह की STP से 6 महीने में ट्रांसफर करने से एक ही दिन में पूरा निवेश करने के बजाय आपकी औसत एंट्री कीमत स्मूद हो जाती है।" },
    { q: "SWP क्या है?", a: "Systematic Withdrawal Plan से आप अपने म्यूचुअल फंड निवेश से नियमित रूप से एक फिक्स्ड राशि निकाल सकते हैं, जो रिटायरमेंट के बाद नियमित इनकम बनाने के लिए उपयोगी है। उदाहरण के लिए, ₹20 लाख के कॉर्पस से हर महीने ₹10,000 निकालना एक रिटायर व्यक्ति को नियमित इनकम देता है जबकि बाकी राशि निवेशित रहती है।" },
    { q: "क्या मैं रिटायरमेंट प्लानिंग के लिए म्यूचुअल फंड में निवेश कर सकता हूँ?", a: "हाँ, लंबे समय तक SIP के साथ इक्विटी और हाइब्रिड म्यूचुअल फंड का मिश्रण, NPS और PPF जैसे ऑप्शन के साथ रिटायरमेंट कॉर्पस बनाने का एक आम तरीका है।" },
    { q: "क्या आप ELSS के अलावा टैक्स प्लानिंग में मदद करते हैं?", a: "हाँ, हम आपकी पूरी तस्वीर देखते हैं — 80C निवेश, 80D के तहत इंश्योरेंस प्रीमियम, और लागू डिडक्शन — पर फाइनल फाइलिंग हमेशा एक क्वालिफाइड टैक्स प्रोफेशनल से कन्फर्म करानी चाहिए।" },
    { q: "Old और New टैक्स रिजीम में क्या फर्क है?", a: "Old Regime में 80C और HRA जैसी डिडक्शन मिलती हैं पर स्लैब रेट ज्यादा हैं; New Regime में स्लैब रेट कम हैं पर डिडक्शन कम हैं — कौन सा बेहतर है यह आपकी डिडक्शन पर निर्भर करता है, हम आपको कंपेयर करने में मदद कर सकते हैं।" },
    { q: "क्या म्यूचुअल फंड निवेश सुरक्षित है?", a: "म्यूचुअल फंड मार्केट-लिंक्ड होते हैं और इनमें रिस्क होता है — ये फिक्स्ड डिपॉजिट की तरह गारंटीड नहीं हैं — पर ये प्रोफेशनली मैनेज्ड और SEBI द्वारा रेगुलेटेड होते हैं, और डायवर्सिफिकेशन व सही फंड कैटेगरी से रिस्क मैनेज किया जा सकता है।" },
    { q: "क्या SIP में पैसा डूब सकता है?", a: "हाँ, क्योंकि SIP मार्केट-लिंक्ड म्यूचुअल फंड में निवेश करती है, शॉर्ट-टर्म में वैल्यू घट सकती है; लेकिन लंबे समय तक निवेशित रहने से हिस्टोरिकली उतार-चढ़ाव का औसत बेहतर हो जाता है।" },
    { q: "इक्विटी और डेट म्यूचुअल फंड में से कैसे चुनें?", a: "इक्विटी फंड लंबे समय के गोल्स (5+ साल) के लिए ज्यादा ग्रोथ और ज्यादा रिस्क के साथ सही हैं; डेट फंड कम समय के गोल्स के लिए ज्यादा स्थिरता देते हैं — हम आपके गोल टाइमलाइन के हिसाब से बांटने में मदद करते हैं।" },
    { q: "निवेश शुरू करने के लिए मुझे कौन से डॉक्यूमेंट चाहिए?", a: "आमतौर पर PAN, आधार-लिंक्ड KYC, बैंक अकाउंट, और मोबाइल नंबर/ईमेल e-KYC के लिए चाहिए — हम पूरी डिजिटल प्रोसेस में आपकी मदद करते हैं।" },
    { q: "क्या मैं अपना म्यूचुअल फंड निवेश कभी भी रिडीम कर सकता हूँ?", a: "ज्यादातर ओपन-एंडेड म्यूचुअल फंड (ELSS के लॉक-इन के दौरान छोड़कर) कभी भी रिडीम किए जा सकते हैं, हालांकि इक्विटी फंड जल्दी रिडीम करने पर एग्जिट लोड और शॉर्ट-टर्म कैपिटल गेन टैक्स लग सकता है।" },
    { q: "हेल्थ इंश्योरेंस में co-payment क्या है?", a: "Co-payment मेडिकल क्लेम का वह प्रतिशत है जो आप खुद चुकाने के लिए सहमत होते हैं, बाकी इंश्योरर कवर करता है — co-payment वाली पॉलिसी में प्रीमियम कम होता है। उदाहरण के लिए, ₹2 लाख के क्लेम पर 10% co-payment का मतलब है आप ₹20,000 खुद चुकाते हैं और बाकी ₹1.8 लाख इंश्योरर सेटल करता है।" },
    { q: "क्या हेल्थ इंश्योरेंस पहले से मौजूद बीमारियों को कवर करता है?", a: "ज्यादातर पॉलिसी वेटिंग पीरियड के बाद पहले से मौजूद बीमारियों को कवर करती हैं, आमतौर पर 2-4 साल, जो इंश्योरर और प्लान पर निर्भर करता है — हम खरीदने से पहले इसे कंपेयर करने में मदद करते हैं।" },
    { q: "फैमिली फ्लोटर हेल्थ प्लान क्या है?", a: "फैमिली फ्लोटर आपके पूरे परिवार को एक ही सम इंश्योर्ड में कवर करता है जिसे कोई भी सदस्य इस्तेमाल कर सकता है, जो अलग-अलग इंडिविजुअल पॉलिसी से आमतौर पर सस्ता पड़ता है। उदाहरण के लिए, चार लोगों का परिवार एक ही ₹10 लाख के सम इंश्योर्ड को शेयर करे तो यह आमतौर पर चार अलग-अलग ₹5 लाख की पॉलिसी खरीदने से सस्ता पड़ता है।" },
    { q: "मुझे कितना हेल्थ कवर लेना चाहिए?", a: "टियर-2/3 शहर में एक परिवार के लिए ₹5-10 लाख अक्सर एक रीजनेबल शुरुआती कवर है, जबकि मेट्रो शहर के परिवार या ज्यादा प्रोटेक्शन चाहने वाले ₹10-25 लाख पर विचार कर सकते हैं, आदर्श रूप से टॉप-अप के साथ।" },
    { q: "टॉप-अप हेल्थ इंश्योरेंस प्लान क्या है?", a: "टॉप-अप प्लान एक डिडक्टिबल थ्रेशोल्ड से ऊपर कम प्रीमियम में एक्स्ट्रा कवर जोड़ता है, जिससे आप अपनी बेस पॉलिसी बदले बिना अपना कुल हेल्थ कवर सस्ते में बढ़ा सकते हैं। उदाहरण के लिए, ₹5 लाख की बेस पॉलिसी के साथ ₹5 लाख डिडक्टिबल के ऊपर ₹15 लाख का टॉप-अप मिलाकर आपको ₹20 लाख का इफेक्टिव कवर मिलता है, वह भी अक्सर एक स्टैंडअलोन ₹20 लाख पॉलिसी की तुलना में काफी कम कीमत में।" },
    { q: "क्या सभी हेल्थ पॉलिसी में कैशलेस ट्रीटमेंट मिलता है?", a: "कैशलेस ट्रीटमेंट सिर्फ आपके इंश्योरर के नेटवर्क हॉस्पिटल में मिलता है; कहीं और ट्रीटमेंट आमतौर पर डिस्चार्ज के बाद रीइंबर्समेंट से सेटल होता है।" },
    { q: "क्या हेल्थ इंश्योरेंस मैटरनिटी खर्च कवर करता है?", a: "कुछ पॉलिसी मैटरनिटी कवर करती हैं, आमतौर पर 2-4 साल के वेटिंग पीरियड के बाद — अगर यह आपके लिए प्राथमिकता है तो खरीदते समय इसे खासतौर पर चेक करना जरूरी है।" },
    { q: "थर्ड-पार्टी मोटर इंश्योरेंस क्या कवर करता है?", a: "थर्ड-पार्टी मोटर इंश्योरेंस, जो कानूनन अनिवार्य है, आपके द्वारा किसी दूसरे व्यक्ति या उनकी प्रॉपर्टी को हुए नुकसान को कवर करता है, पर आपकी अपनी गाड़ी के नुकसान को नहीं।" },
    { q: "थर्ड-पार्टी और कॉम्प्रिहेंसिव मोटर इंश्योरेंस में क्या फर्क है?", a: "थर्ड-पार्टी सिर्फ दूसरों के प्रति लायबिलिटी कवर करता है और कानूनन अनिवार्य है; कॉम्प्रिहेंसिव आपकी अपनी गाड़ी के नुकसान, चोरी और प्राकृतिक आपदा को भी कवर करता है, यानी बहुत ज्यादा प्रोटेक्शन।" },
    { q: "मोटर इंश्योरेंस में zero depreciation कवर क्या है?", a: "Zero depreciation एक ऐड-ऑन है जो पार्ट्स रिप्लेसमेंट पर पूरा क्लेम अमाउंट सुनिश्चित करता है बिना डेप्रिसिएशन काटे, जो नई कारों के लिए उपयोगी है।" },
    { q: "क्या मोटर इंश्योरेंस टू-व्हीलर के लिए भी है?", a: "हाँ, थर्ड-पार्टी और कॉम्प्रिहेंसिव दोनों मोटर इंश्योरेंस टू-व्हीलर के लिए उपलब्ध हैं, साथ में zero depreciation और रोडसाइड असिस्टेंस जैसे ऐड-ऑन भी।" },
    { q: "अगर मेरी मोटर इंश्योरेंस लैप्स हो जाए तो क्या होगा?", a: "अनिवार्य थर्ड-पार्टी कवर के बिना ड्राइविंग करना गैरकानूनी है और आपको क्लेम खर्चों के प्रति पूरी तरह खुला छोड़ देता है — हम समय पर रिन्यूअल की सलाह देते हैं, जिसमें हम मदद भी करते हैं।" },
    { q: "टर्म इंश्योरेंस और हेल्थ इंश्योरेंस में क्या फर्क है?", a: "टर्म इंश्योरेंस पॉलिसी टर्म के दौरान आपकी मृत्यु होने पर परिवार को लम्पसम राशि देता है; हेल्थ इंश्योरेंस आपके जीवित रहते मेडिकल ट्रीटमेंट खर्च कवर करता है — दोनों अलग पर जरूरी उद्देश्य पूरे करते हैं।" },
    { q: "अगर मेरे पास पहले से एम्प्लॉयर की लाइफ पॉलिसी है तो क्या मैं टर्म इंश्योरेंस ले सकता हूँ?", a: "हाँ, एम्प्लॉयर का ग्रुप कवर आमतौर पर जॉब छोड़ने पर खत्म हो जाता है, इसलिए निरंतर, पोर्टेबल प्रोटेक्शन के लिए एक इंडिविजुअल टर्म प्लान लेने की सलाह दी जाती है।" },
    { q: "क्या टर्म इंश्योरेंस क्रिटिकल इलनेस कवर करता है?", a: "बेस टर्म इंश्योरेंस सिर्फ मृत्यु कवर करता है; क्रिटिकल इलनेस आमतौर पर अतिरिक्त प्रीमियम पर एक ऐड-ऑन राइडर के रूप में उपलब्ध होता है।" },
    { q: "टर्म इंश्योरेंस लेने की सही उम्र क्या है?", a: "20s या शुरुआती 30s में कम उम्र में खरीदने से उसी कवर के लिए कम प्रीमियम लॉक हो जाता है, क्योंकि उम्र और हेल्थ रिस्क बढ़ने के साथ प्रीमियम बढ़ता है। उदाहरण के लिए, ₹1 करोड़ का टर्म कवर 25 साल की उम्र में लगभग ₹700-900/माह में मिल सकता है, जबकि वही कवर 40 साल की उम्र में लेने पर ₹1,500+/माह लग सकता है।" },
    { q: "अगर मैं पॉलिसी टर्म से ज्यादा जिंदा रहूं तो क्या टर्म इंश्योरेंस में कोई मैच्योरिटी वैल्यू मिलती है?", a: "एक शुद्ध टर्म प्लान सर्वाइवल पर कुछ नहीं देता — इसी वजह से इसका प्रीमियम एंडोमेंट या ULIP प्लान की तुलना में इतना कम होता है।" },
    { q: "ULIP क्या है और क्या आप इसकी सलाह देते हैं?", a: "ULIP लाइफ इंश्योरेंस को मार्केट-लिंक्ड निवेश के साथ मिलाता है; हम आमतौर पर इंश्योरेंस और निवेश को अलग रखने की सलाह देते हैं — प्रोटेक्शन के लिए शुद्ध टर्म इंश्योरेंस और ग्रोथ के लिए म्यूचुअल फंड — बेहतर पारदर्शिता और रिटर्न के लिए।" },
    { q: "म्यूचुअल फंड रिटर्न पर टैक्स कैसे लगता है?", a: "एक साल से ज्यादा होल्ड किए गए इक्विटी फंड गेन पर लॉन्ग-टर्म कैपिटल गेन टैक्स लगता है, और कम समय के होल्डिंग पर शॉर्ट-टर्म गेन टैक्स; डेट फंड टैक्सेशन के अलग नियम हैं — हम बेसिक्स समझा सकते हैं, पर फाइनल टैक्स फाइलिंग एक क्वालिफाइड टैक्स प्रोफेशनल से करानी चाहिए।" },
    { q: "क्या मैं अलग-अलग गोल्स के लिए कई SIP सेट कर सकता हूँ?", a: "हाँ, ज्यादातर क्लाइंट्स अलग-अलग गोल्स के लिए अलग SIP चलाते हैं — रिटायरमेंट, बच्चे की एजुकेशन, घर की डाउन पेमेंट — ताकि हर गोल की प्रोग्रेस साफ तौर पर ट्रैक हो सके। उदाहरण के लिए, कोई क्लाइंट रिटायरमेंट के लिए ₹5,000, बच्चे की एजुकेशन के लिए ₹3,000, और घर की डाउन पेमेंट के लिए ₹2,000 की अलग-अलग SIP चला सकता है, हर एक अपने लक्ष्य के हिसाब से ट्रैक होती हुई।" },
    { q: "SIP में rupee cost averaging क्या है?", a: "क्योंकि SIP मार्केट लेवल की परवाह किए बिना नियमित रूप से एक फिक्स्ड राशि निवेश करती है, आप अपने आप कम कीमत पर ज्यादा यूनिट और ज्यादा कीमत पर कम यूनिट खरीदते हैं, जिससे समय के साथ आपकी खरीद लागत औसत हो जाती है। उदाहरण के लिए, आपकी फिक्स्ड ₹5,000 राशि NAV ₹20 पर गिरने पर ज्यादा यूनिट खरीदती है और NAV ₹25 पर बढ़ने पर कम यूनिट, जिससे औसत लागत संतुलित हो जाती है।" },
    { q: "क्या मैं बाद में अपनी SIP राशि बढ़ा सकता हूँ?", a: "हाँ, आप SIP को कभी भी लगभग बढ़ा, घटा, रोक या बंद कर सकते हैं, और हम Step-up SIP भी ऑफर करते हैं जो हर साल आपका निवेश अपने आप बढ़ा देती है। उदाहरण के लिए, ₹5,000/माह से शुरू होकर हर साल 10% बढ़ने वाली Step-up SIP पांचवें साल तक लगभग ₹8,000/माह तक पहुंच सकती है।" },
    { q: "क्या आप हेल्थ इंश्योरेंस क्लेम में मदद करते हैं?", a: "हाँ, हम क्लाइंट्स को क्लेम गाइडेंस और इंश्योरर के साथ कोऑर्डिनेशन में मदद करते हैं, हालांकि क्लेम का फैसला हमेशा इंश्योरेंस कंपनी के पास ही रहता है।" },
    { q: "क्या आप मेरे इंश्योरेंस और म्यूचुअल फंड पोर्टफोलियो का कॉम्बाइंड रिव्यू देते हैं?", a: "हाँ, पीरियोडिक पोर्टफोलियो और प्रोटेक्शन रिव्यू हमारे क्लाइंट्स के साथ काम करने के तरीके का हिस्सा है, ताकि आपका कवरेज और निवेश आपकी बदलती जिंदगी के साथ अलाइन रहे।" },
    { q: "इनमें से किसी भी सर्विस से शुरुआत कैसे करूं?", a: "हमारे Contact पेज या WhatsApp के जरिए एक फ्री पहली कंसल्टेशन बुक करें — हम कुछ भी सुझाने से पहले निवेश, इंश्योरेंस और टैक्स प्लानिंग में आपके गोल्स समझेंगे।" },
  ],
  hinglish: [
    { q: "Mujhe pehle kaunsa insurance lena chahiye?", a: "Term insurance aur health insurance usually pehli priority hoti hai, kyunki yeh sabse bade financial risk — death aur medical emergency — se bachate hain. Jaise, ek young healthy earner ke liye ₹1 crore ka term cover aur ₹10 lakh ki family health policy milakar ₹1,500/month se kam mein aa sakti hai." },
    { q: "Kya main aapke through insurance aur mutual funds dono le sakta hoon?", a: "Haan, hum protection (insurance) aur growth (mutual funds) dono ko ek saath plan karne mein help karte hain." },
    { q: "Kya insurance advice ke liye koi fee lagti hai?", a: "Insurance advisory generally insurer ke commission pe based hoti hai, isliye normal policy guidance ke liye alag se fee nahi lagti." },
    { q: "Mujhe kitna life cover lena chahiye?", a: "Common rule hai aapki annual income ka 10-15 times, lekin yeh aapke loans, dependents aur savings pe depend karta hai — yeh hum calculate karte hain. Jaise, ₹8 lakh saalana kamane wale kisi insaan ke liye, jiske paas home loan aur do dependents hain, loans aur future goals jodkar lagbhag ₹80 lakh-₹1.2 crore ka cover ban sakta hai." },
    { q: "Kya term insurance regular life policy se better hai?", a: "Sirf protection ke liye term insurance zyada cover deta hai kam premium mein. Endowment plans insurance aur investment dono combine karte hain par return kam hota hai. Jaise, ek healthy 30 saal ke insaan ke liye ₹1 crore ka term cover lagbhag ₹800-1,200/month mein mil sakta hai, jabki utne hi value ka endowment plan usi protection ke liye kai guna zyada cost kar sakta hai, saath mein ek investment component bhi mila hua." },
    { q: "Kya motor insurance natural disaster cover karta hai?", a: "Comprehensive (own-damage) motor policy mein flood, fire aur storm damage cover hota hai, jabki sirf third-party policy mein nahi." },
    { q: "SIP kya hai?", a: "SIP (Systematic Investment Plan) se aap har mahine mutual fund mein ek fixed amount invest karte ho, jisse disciplined tareeke se dheere-dheere corpus banta hai. Jaise, ₹5,000/month ki SIP ko 15 saal tak 12% ke assumed return pe chalayen to yeh lagbhag ₹25 lakh tak grow kar sakti hai — is site ke calculator mein aap apne khud ke numbers dekh sakte ho." },
    { q: "SIP shuru karne ke liye minimum amount kya hai?", a: "Kai mutual funds mein SIP sirf ₹500 per month se shuru ki ja sakti hai, jo lagbhag har budget ke liye accessible hai." },
    { q: "SIP aur Recurring Deposit mein kya farak hai?", a: "Recurring Deposit mein fixed, guaranteed bank interest milta hai, jabki SIP market-linked mutual fund mein invest karti hai jisme long term mein potentially zyada par variable return milta hai. Jaise, 5 saal ki RD mein lagbhag 6-7% saalana guaranteed mil sakta hai, jabki usi period mein equity SIP market ke hisaab se isse zyada ya kam return de sakti hai — dono mein koi fixed guarantee nahi hai." },
    { q: "Ek beginner ko kaunsi mutual fund category se start karna chahiye?", a: "Beginners often large-cap ya flexi-cap equity funds se start karte hain stability ke liye, ya hybrid funds se equity aur debt ke mix ke liye — hum ise aapke goals aur risk ke hisaab se decide karte hain." },
    { q: "Kya aap Direct Plan mutual funds bechte ho?", a: "Nahi, ek Mutual Fund Distributor ke roop mein hum Regular Plan offer karte hain, jisme expense ratio mein advisory support aur servicing included hota hai." },
    { q: "Regular Plan aur Direct Plan mein kya farak hai?", a: "Direct Plan directly AMC se bina distributor ke kharida jata hai aur iska expense ratio thoda kam hota hai; Regular Plan, jo hum offer karte hain, mein advisor ki guidance, service aur support thode zyada expense ratio mein included hota hai. Jaise, ₹5 lakh ke investment pe 0.5% ka expense ratio farak lagbhag ₹2,500 saalana banta hai — yehi amount Regular Plan ke saath milne wali advisory aur service ko fund karta hai." },
    { q: "Kya main apne bachche ki education ke liye SIP shuru kar sakta hoon?", a: "Haan, hum zaroori goal amount calculate karte hain aur aapke bachche ki education timeline ke hisaab se ek dedicated SIP set karte hain. Jaise, agar aapko 12 saal baad higher education ke liye ₹15 lakh chahiye, to hum piche se calculate karke batate hain ki us target tak pahunchne ke liye monthly SIP kitni honi chahiye." },
    { q: "ELSS fund kya hai?", a: "ELSS (Equity Linked Savings Scheme) ek equity mutual fund hai jiska 3 saal ka lock-in hota hai aur yeh Section 80C ke under ₹1.5 lakh tak tax deduction ke liye bhi qualify karta hai. Jaise, ek saal mein ELSS mein ₹1.5 lakh invest karne se aapki taxable income utni hi kam ho sakti hai, aapke tax slab ke hisaab se." },
    { q: "Tax saving ke liye ELSS PPF se better hai?", a: "ELSS mein market-linked, potentially zyada return milta hai sirf 3 saal ke lock-in ke saath, jabki PPF government-backed hai fixed return aur 15 saal ke lock-in ke saath — sahi choice aapke risk aur time horizon pe depend karti hai." },
    { q: "STP kya hai aur ise kab use karna chahiye?", a: "Systematic Transfer Plan ek lumpsum amount ko dheere-dheere ek fund (usually debt) se doosre fund (usually equity) mein regular intervals pe transfer karta hai, jisse ek saath market high pe pura invest karne ka risk kam hota hai. Jaise, ₹6 lakh ko debt fund se equity fund mein ₹1 lakh/month ki STP se 6 mahine mein transfer karne se ek hi din mein pura invest karne ke bajaye aapki average entry price smooth ho jaati hai." },
    { q: "SWP kya hai?", a: "Systematic Withdrawal Plan se aap apne mutual fund investment se regularly ek fixed amount nikaal sakte ho, jo retirement ke baad regular income banane ke liye useful hai. Jaise, ₹20 lakh ke corpus se har mahine ₹10,000 nikalna ek retired insaan ko regular income deta hai jabki baaki amount invested rehta hai." },
    { q: "Kya main retirement planning ke liye mutual funds mein invest kar sakta hoon?", a: "Haan, long term SIP ke saath equity aur hybrid mutual funds ka mix, NPS aur PPF jaise options ke saath retirement corpus banane ka ek common tareeka hai." },
    { q: "Kya aap ELSS ke alawa tax planning mein help karte ho?", a: "Haan, hum aapki puri picture dekhte hain — 80C investments, 80D ke under insurance premium, aur applicable deductions — par final filing hamesha ek qualified tax professional se confirm karani chahiye." },
    { q: "Old aur New tax regime mein kya farak hai?", a: "Old Regime mein 80C aur HRA jaisi deductions milti hain par slab rate zyada hain; New Regime mein slab rate kam hain par deductions kam hain — kaunsa better hai yeh aapki deductions pe depend karta hai, hum compare karne mein help kar sakte hain." },
    { q: "Kya mutual fund investment safe hai?", a: "Mutual funds market-linked hote hain aur inme risk hota hai — yeh fixed deposit jaise guaranteed nahi hain — par yeh professionally managed aur SEBI se regulated hote hain, aur diversification aur sahi fund category se risk manage kiya ja sakta hai." },
    { q: "Kya SIP mein paisa doob sakta hai?", a: "Haan, kyunki SIP market-linked mutual fund mein invest karti hai, short-term mein value ghat sakti hai; lekin long term tak invested rehne se historically volatility ka average behtar ho jaata hai." },
    { q: "Equity aur debt mutual fund mein se kaise choose karein?", a: "Equity funds long term goals (5+ saal) ke liye zyada growth aur zyada risk ke saath sahi hain; debt funds kam time ke goals ke liye zyada stability dete hain — hum aapke goal timeline ke hisaab se split karne mein help karte hain." },
    { q: "Invest shuru karne ke liye mujhe kaunse documents chahiye?", a: "Generally PAN, Aadhaar-linked KYC, bank account, aur mobile number/email e-KYC ke liye chahiye — hum puri digital process mein aapki help karte hain." },
    { q: "Kya main apna mutual fund investment kabhi bhi redeem kar sakta hoon?", a: "Zyada tar open-ended mutual funds (ELSS ke lock-in ke dauran chhod kar) kabhi bhi redeem kiye ja sakte hain, halanki equity funds jaldi redeem karne pe exit load aur short-term capital gains tax lag sakta hai." },
    { q: "Health insurance mein co-payment kya hai?", a: "Co-payment medical claim ka wo percentage hai jo aap khud pay karne ke liye agree karte hain, baaki insurer cover karta hai — co-payment wali policy mein premium kam hota hai. Jaise, ₹2 lakh ke claim pe 10% co-payment ka matlab hai aap ₹20,000 khud pay karte ho aur baaki ₹1.8 lakh insurer settle karta hai." },
    { q: "Kya health insurance pehle se maujood bimariyon ko cover karta hai?", a: "Zyada tar policies waiting period ke baad pehle se maujood bimariyon ko cover karti hain, usually 2-4 saal, jo insurer aur plan pe depend karta hai — hum kharidne se pehle ise compare karne mein help karte hain." },
    { q: "Family floater health plan kya hai?", a: "Family floater aapke pure parivar ko ek hi sum insured mein cover karta hai jise koi bhi member use kar sakta hai, jo alag-alag individual policies se usually sasta padta hai. Jaise, char logo ka parivar ek hi ₹10 lakh ke sum insured ko share kare to yeh usually char alag ₹5 lakh ki policies kharidne se sasta padta hai." },
    { q: "Mujhe kitna health cover lena chahiye?", a: "Tier-2/3 city mein ek family ke liye ₹5-10 lakh often ek reasonable starting cover hai, jabki metro city ki families ya extra protection chahne wale ₹10-25 lakh consider kar sakte hain, ideally top-up ke saath." },
    { q: "Top-up health insurance plan kya hai?", a: "Top-up plan ek deductible threshold ke upar low premium mein extra cover jodta hai, jisse aap apni base policy badle bina apna total health cover affordably badha sakte ho. Jaise, ₹5 lakh ki base policy ke saath ₹5 lakh deductible ke upar ₹15 lakh ka top-up milakar aapko ₹20 lakh ka effective cover milta hai, wo bhi often ek standalone ₹20 lakh policy ke comparison mein kaafi kam cost mein." },
    { q: "Kya saari health policies mein cashless treatment milta hai?", a: "Cashless treatment sirf aapke insurer ke network hospitals mein milta hai; kahin aur treatment usually discharge ke baad reimbursement se settle hota hai." },
    { q: "Kya health insurance maternity expenses cover karta hai?", a: "Kuch policies maternity cover karti hain, usually 2-4 saal ke waiting period ke baad — agar yeh aapke liye priority hai to kharidte waqt ise specifically check karna zaroori hai." },
    { q: "Third-party motor insurance kya cover karta hai?", a: "Third-party motor insurance, jo kanoonan mandatory hai, aapke through kisi doosre insaan ya unki property ko hue nuksaan ko cover karta hai, par aapki apni gaadi ke nuksaan ko nahi." },
    { q: "Third-party aur comprehensive motor insurance mein kya farak hai?", a: "Third-party sirf doosron ke prati liability cover karta hai aur kanoonan mandatory hai; comprehensive aapki apni gaadi ke nuksaan, chori aur natural calamity ko bhi cover karta hai, yaani bahut zyada protection." },
    { q: "Motor insurance mein zero depreciation cover kya hai?", a: "Zero depreciation ek add-on hai jo parts replacement pe pura claim amount ensure karta hai bina depreciation kaate, jo nayi cars ke liye useful hai." },
    { q: "Kya motor insurance two-wheelers ke liye bhi hai?", a: "Haan, third-party aur comprehensive dono motor insurance two-wheelers ke liye available hain, saath mein zero depreciation aur roadside assistance jaise add-ons bhi." },
    { q: "Agar meri motor insurance lapse ho jaaye to kya hoga?", a: "Mandatory third-party cover ke bina drive karna illegal hai aur aapko claim costs ke prati pura expose kar deta hai — hum time pe renewal ki advice dete hain, jisme hum help bhi karte hain." },
    { q: "Term insurance aur health insurance mein kya farak hai?", a: "Term insurance policy term ke dauran aapki death hone pe family ko lumpsum amount deta hai; health insurance aapke zinda rehte medical treatment costs cover karta hai — dono alag par zaroori purpose serve karte hain." },
    { q: "Agar mere paas pehle se employer ki life policy hai to kya main term insurance le sakta hoon?", a: "Haan, employer ka group cover usually job chhodne pe khatam ho jaata hai, isliye continuous, portable protection ke liye ek individual term plan lena recommended hai." },
    { q: "Kya term insurance critical illness cover karta hai?", a: "Base term insurance sirf death cover karta hai; critical illness usually additional premium pe ek add-on rider ke roop mein available hota hai." },
    { q: "Term insurance lene ki sahi age kya hai?", a: "20s ya early 30s mein kam age mein kharidne se usi cover ke liye kam premium lock ho jaata hai, kyunki age aur health risk badhne ke saath premium badhta hai. Jaise, ₹1 crore ka term cover 25 saal ki age mein lagbhag ₹700-900/month mein mil sakta hai, jabki wahi cover 40 saal ki age mein lene pe ₹1,500+/month lag sakta hai." },
    { q: "Agar main policy term se zyada zinda rahoon to kya term insurance mein koi maturity value milti hai?", a: "Ek pure term plan survival pe kuch nahi deta — isi wajah se iska premium endowment ya ULIP plans ke comparison mein itna kam hota hai." },
    { q: "ULIP kya hai aur kya aap iski advice dete ho?", a: "ULIP life insurance ko market-linked investment ke saath combine karta hai; hum usually insurance aur investment ko alag rakhne ki advice dete hain — protection ke liye pure term insurance aur growth ke liye mutual funds — behtar transparency aur returns ke liye." },
    { q: "Mutual fund returns pe tax kaise lagta hai?", a: "Ek saal se zyada hold kiye gaye equity fund gains pe long-term capital gains tax lagta hai, aur kam time ke holdings pe short-term gains tax; debt fund taxation ke alag rules hain — hum basics samjha sakte hain, par final tax filing ek qualified tax professional se karani chahiye." },
    { q: "Kya main different goals ke liye multiple SIPs set kar sakta hoon?", a: "Haan, zyada tar clients different goals ke liye alag SIPs chalate hain — retirement, bachche ki education, ghar ki down payment — taaki har goal ki progress clearly track ho sake. Jaise, koi client retirement ke liye ₹5,000, bachche ki education ke liye ₹3,000, aur ghar ki down payment ke liye ₹2,000 ki alag-alag SIP chala sakta hai, har ek apne goal ke hisaab se track hoti hui." },
    { q: "SIP mein rupee cost averaging kya hai?", a: "Kyunki SIP market level ki parwa kiye bina regularly ek fixed amount invest karti hai, aap automatically kam price pe zyada units aur zyada price pe kam units kharidte ho, jisse time ke saath aapki purchase cost average ho jaati hai. Jaise, aapki fixed ₹5,000 amount NAV ₹20 pe girne pe zyada units khareedti hai aur NAV ₹25 pe badhne pe kam units, jisse average cost balance ho jaata hai." },
    { q: "Kya main baad mein apna SIP amount badha sakta hoon?", a: "Haan, aap SIP ko kabhi bhi lagbhag badha, ghata, pause ya band kar sakte ho, aur hum Step-up SIP bhi offer karte hain jo har saal aapka investment automatically badha deti hai. Jaise, ₹5,000/month se shuru hoke har saal 10% badhne wali Step-up SIP paanchve saal tak lagbhag ₹8,000/month tak pahunch sakti hai." },
    { q: "Kya aap health insurance claims mein help karte ho?", a: "Haan, hum clients ko claim guidance aur insurer ke saath coordination mein help karte hain, halanki claim ka decision hamesha insurance company ke paas hi rehta hai." },
    { q: "Kya aap mere insurance aur mutual fund portfolio ka combined review dete ho?", a: "Haan, periodic portfolio aur protection review hamare clients ke saath kaam karne ke tareeke ka hissa hai, taaki aapka coverage aur investment aapki badalti zindagi ke saath aligned rahe." },
    { q: "In services mein se kisi se bhi shuruaat kaise karoon?", a: "Hamare Contact page ya WhatsApp ke through ek free pehli consultation book karo — hum kuch bhi suggest karne se pehle investment, insurance aur tax planning mein aapke goals samjhenge." },
  ],
};

export default function ServicesPage() {
  return (
    <div className="relative" data-testid="services-page-root">
      <SEO
        title="The Financial Doctor | Mutual Fund & Insurance Services"
        description="Our services — Mutual Fund investment advisory, SIP planning, Term Insurance, Health Insurance, Motor Insurance, and complete financial planning under one roof."
        keywords="term insurance plan, health insurance policy, motor insurance, car insurance, two wheeler insurance, life insurance, best insurance advisor, mutual fund advisor"
        path="/services"
      />
      <Navbar />
      <main>
        {/* "PRESCRIPTION PAD" HERO — teal/emerald instead of navy or indigo,
            a checklist motif leaning into the site's doctor metaphor instead
            of abstract blobs or a dot-grid. */}
        <section className="relative overflow-hidden bg-[#F6FAF8] pt-28 pb-16 md:pt-32 md:pb-20 px-6 border-b-2 border-[#0F6E5C]/15">
          <div className="container-x grid lg:grid-cols-[1.05fr,0.95fr] gap-10 items-center">
            <div>
              <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0F6E5C]/30 bg-[#0F6E5C]/8 text-[11px] tracking-[0.2em] uppercase text-[#0F6E5C] font-semibold">
                Our services
              </div>
              <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#0E1B2C] mt-5 leading-tight">
                One prescription, <span className="font-italic-serif" style={{ color: "#0F6E5C" }}>every financial need.</span>
              </h1>
              <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#2A364B]/80 text-[15px] sm:text-base max-w-xl leading-relaxed">
                Mutual funds, SIPs, tax planning, and Term/Health/Motor insurance — one advisor,
                one relationship, no juggling between agents.
              </p>
              <div className="fund-animate-in fund-animate-in-delay-3 flex gap-6 mt-8">
                <div><div className="font-display text-2xl text-[#0E1B2C]">6+</div><div className="text-[11px] uppercase tracking-wider text-[#5C8B7E] mt-0.5">Services offered</div></div>
                <div><div className="font-display text-2xl text-[#0E1B2C]">40+</div><div className="text-[11px] uppercase tracking-wider text-[#5C8B7E] mt-0.5">AMC &amp; insurer partners</div></div>
              </div>
            </div>
            <div className="fund-animate-in fund-animate-in-delay-2 bg-white rounded-2xl border border-[#E2D8C2] shadow-sm p-6 -rotate-1">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#8A93A6] mb-3">Today's checklist</div>
              <ul className="space-y-2.5">
                {["Mutual Funds & SIP", "Term Insurance", "Life Insurance", "Health Insurance", "Motor Insurance", "Portfolio Review"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-[#2A364B]">
                    <span className="w-5 h-5 rounded-full bg-[#0F6E5C]/10 text-[#0F6E5C] grid place-items-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <ProblemSolution
          accent="#0F6E5C"
          problem="Most families end up with a different agent for mutual funds, a different one for term insurance, another for health cover, and a bank RM pushing whatever that bank sells — nobody sees the whole picture."
          solution="One advisor across mutual funds, SIPs, and Term/Health/Motor insurance — every recommendation weighed against the others, so your protection and your growth plan actually work together."
        />
        <Services hideHeading />

        {/* INSURANCE TYPES — WHY EACH MATTERS */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Why These Insurance Covers Matter
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-10">
              Each type of insurance protects a different part of your life — here's
              why we recommend reviewing all of them.
            </p>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
              {insuranceTypes.map((t) => {
                const Icon = t.icon;
                return (
                <div key={t.title} className="shrink-0 w-[85%] snap-center md:w-auto md:shrink bg-white border border-[#E2D8C2] rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-32 grid place-items-center" style={{ background: `${t.color}0D` }}>
                    <div className="w-16 h-16 rounded-2xl grid place-items-center" style={{ background: `${t.color}1A`, color: t.color }}>
                      <Icon size={30} />
                    </div>
                  </div>
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
                );
              })}
            </div>
          </div>
        </section>

        <FAQSection title="Services — Frequently Asked Questions" data={servicesFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
