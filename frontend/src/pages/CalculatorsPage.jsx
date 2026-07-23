import React from "react";
import { useParams, Link } from "react-router-dom"; // 👈 useParams ko import kiya
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Calculators from "@/components/Calculators";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import ProblemSolution from "@/components/ProblemSolution";
import LanguageToggle from "@/components/LanguageToggle";

// Kept in sync with the real tab ids in components/Calculators.jsx (sip,
// daily, lumpsum, swp, goal, emi, tax, gst, inflation) — every H3 heading
// below is real, crawlable text naming the actual calculator, and each
// title/description pair also doubles as the per-type SEO copy so a search
// for any one of these calculators can land directly on this page.
const calcInfo = [
  { id: "sip", title: "SIP Calculator", text: "Estimate the future value of your monthly SIP investments based on expected annual returns and investment duration.", description: "Free SIP Calculator — estimate the future value of your monthly SIP investment with expected returns, powered by The Financial Doctor's mutual fund advisory." },
  { id: "daily", title: "Daily SIP Calculator", text: "See how small daily investments compound into a large corpus over time — a lighter alternative to a monthly SIP.", description: "Free Daily SIP Calculator — project how small daily mutual fund investments grow over time with compounding." },
  { id: "lumpsum", title: "Lumpsum Calculator", text: "See how a one-time investment can grow over the years with the power of compounding.", description: "Free Lumpsum Calculator — see how a one-time mutual fund investment can grow over the years with compounding." },
  { id: "swp", title: "SWP Calculator", text: "Plan a Systematic Withdrawal Plan — see how long your corpus lasts with regular withdrawals and expected returns.", description: "Free SWP (Systematic Withdrawal Plan) Calculator — plan regular withdrawals from your mutual fund corpus and see how long it lasts." },
  { id: "goal", title: "Goal Planning Calculator", text: "Reverse-calculate the monthly SIP needed to hit a specific future goal amount, like a child's education fund.", description: "Free Goal-Based Investment Calculator — work out the monthly SIP needed to reach any future financial goal." },
  { id: "emi", title: "EMI / Loan Calculator", text: "Calculate your monthly loan EMI for home, car, or personal loans before you commit.", description: "Free EMI Calculator — calculate your monthly loan EMI for home, car, or personal loans instantly." },
  { id: "tax", title: "Income Tax Calculator", text: "Compare old vs new tax regime and estimate potential savings through 80C investments.", description: "Free Income Tax Calculator — compare Old vs New tax regime and estimate your savings through 80C investments." },
  { id: "gst", title: "GST Calculator", text: "Quickly work out GST-inclusive or GST-exclusive amounts for any transaction.", description: "Free GST Calculator online — instantly calculate GST-inclusive or GST-exclusive amounts." },
  { id: "inflation", title: "Future Goal (Inflation) Calculator", text: "See what today's goal amount will really cost in the future once inflation is factored in.", description: "Free Future Goal Calculator — see what your financial goal will really cost after adjusting for inflation." },
];

export const calcFAQ = {
  en: [
    { q: "What is a Step-up SIP?", a: "It's a SIP where you increase your monthly investment amount every year by a fixed percentage, matching your rising income over time. For example, a ₹5,000/month SIP stepped up by 10% annually would have you investing about ₹8,000/month by the fifth year." },
    { q: "Why is Step-up SIP better than a flat SIP?", a: "Since most people's income grows over time, a step-up SIP helps you invest more as you earn more, leading to a significantly larger corpus over the long run. For example, over 15 years, a step-up SIP starting at ₹5,000/month could build a noticeably larger corpus than a flat ₹5,000/month SIP, simply because later years see much higher contributions." },
    { q: "What's the difference between Reducing Balance and Fixed Rate EMI?", a: "Reducing Balance calculates interest only on the outstanding loan amount (most bank loans work this way). Fixed Rate charges interest on the full original amount throughout the tenure, making it costlier overall. For example, on a ₹5 lakh loan at 10% for 5 years, the Fixed Rate method can end up costing noticeably more in total interest than Reducing Balance for the same headline rate." },
    { q: "How does the Interest-Free SIP suggestion work?", a: "It calculates your total interest payable on the loan, then works out the monthly SIP (at an assumed 12% p.a. return) that could grow to roughly the same amount by the time your loan ends. For example, if a loan's total interest works out to ₹4 lakh over 10 years, the calculator shows roughly what monthly SIP could build a similar ₹4 lakh corpus over the same period." },
    { q: "Which tax regime should I choose?", a: "If you have significant 80C investments, HRA, or other deductions, the Old Regime is often better. If you have few deductions, the New Regime's lower slabs usually work out cheaper. The calculator shows you both." },
    { q: "Are these calculators accurate?", a: "They provide estimates based on the inputs and assumed rates you enter — actual returns, inflation, and tax rules can vary and are never guaranteed." },
    { q: "Can I get a personalized calculation from an advisor?", a: "Yes, these calculators are a starting point — for a detailed, personalized plan, book a free consultation with our team." },
    { q: "What is a SIP Calculator used for?", a: "It estimates the future value of your monthly mutual fund SIP based on the amount, duration, and an assumed annual rate of return. For example, a ₹5,000/month SIP for 15 years at an assumed 12% return could grow to roughly ₹25 lakh — enter your own numbers to see your exact estimate." },
    { q: "How is the SIP Calculator's maturity value calculated?", a: "It uses the standard compound interest formula for periodic investments, compounding your monthly contributions at the assumed rate over your chosen tenure. For instance, each month's ₹5,000 contribution compounds for a different length of time, so the first year's investment grows for the full tenure while the last month's barely grows at all." },
    { q: "What is a Daily SIP Calculator?", a: "It projects how a small fixed daily investment in a mutual fund can grow over time, compounding more frequently than a monthly SIP. For example, investing ₹200 a day (roughly ₹6,000 a month) over 15 years at an assumed 12% return could build a corpus similar to an equivalent monthly SIP." },
    { q: "Who should use a Daily SIP Calculator instead of monthly SIP?", a: "Anyone who prefers investing smaller, more frequent amounts — say from daily savings — rather than committing to one larger monthly deduction." },
    { q: "What is a Lumpsum Calculator?", a: "It shows how a one-time investment amount can grow over a chosen period at an assumed annual rate of return, using compound growth. For example, a ₹5 lakh lumpsum invested for 10 years at an assumed 12% return could grow to roughly ₹15.5 lakh." },
    { q: "What's the difference between SIP and Lumpsum investing?", a: "A SIP spreads investment across regular intervals, averaging your purchase cost, while a Lumpsum invests the full amount at once, whose outcome depends heavily on market timing." },
    { q: "What is an SWP Calculator?", a: "It shows how long a corpus will last if you withdraw a fixed amount regularly, factoring in the corpus's assumed ongoing growth. For example, withdrawing ₹10,000 a month from a ₹20 lakh corpus growing at an assumed 8% could last significantly longer than the same withdrawal from a corpus earning no growth at all." },
    { q: "How do I know if my SWP corpus will last long enough?", a: "The calculator shows the corpus depletion (or growth) over time based on your withdrawal rate and assumed returns, so you can adjust the withdrawal amount if needed." },
    { q: "Can SWP withdrawals exceed the growth of my corpus?", a: "Yes, if you withdraw more than your corpus grows, the principal will gradually reduce — the calculator helps you see this before it happens in real life. For example, withdrawing ₹15,000/month from a ₹20 lakh corpus growing at only 6% a year would draw down the principal faster than a ₹10,000/month withdrawal would." },
    { q: "What is a Goal Planning Calculator?", a: "It reverse-calculates the monthly SIP you need today to reach a specific future goal amount, like a child's education or a house down payment. For example, if you need ₹20 lakh in 10 years, the calculator tells you roughly what monthly SIP, at an assumed return, gets you there." },
    { q: "How do I use the Goal Calculator for my child's education?", a: "Enter today's estimated cost, the number of years until you need the funds, and an assumed return — it tells you the monthly SIP required to reach that goal." },
    { q: "What if I don't know the exact future cost of my goal?", a: "Use today's cost as a starting estimate and let the calculator's inflation adjustment project a reasonable future figure, or ask us for help estimating it." },
    { q: "What is an EMI/Loan Calculator?", a: "It calculates your fixed monthly repayment amount for a home, car, or personal loan, based on the loan amount, interest rate, and tenure. For example, a ₹30 lakh home loan at 9% for 20 years works out to an EMI of roughly ₹27,000 a month." },
    { q: "What inputs does the EMI Calculator need?", a: "Loan amount, interest rate, and tenure (in months or years) are the three core inputs needed to calculate your EMI." },
    { q: "Does the EMI Calculator include processing fees or other loan charges?", a: "No, it calculates only the principal and interest EMI — processing fees, insurance, and other charges vary by lender and aren't included." },
    { q: "What is an Income Tax Calculator?", a: "It estimates your tax liability under both the Old and New tax regimes so you can compare and see which works out cheaper for your income and deductions." },
    { q: "Does the Tax Calculator file my taxes for me?", a: "No, it only gives an estimate for planning purposes — actual filing should always be done through a qualified tax professional or the official portal." },
    { q: "Can I use the Tax Calculator for both salaried and self-employed income?", a: "Yes, you can enter your income details regardless of source, though self-employed income may have additional considerations best confirmed with a tax professional." },
    { q: "What is a GST Calculator?", a: "It quickly calculates the GST amount and final price for a transaction, whether you're adding GST to a base price or extracting it from a GST-inclusive amount. For example, adding 18% GST to a ₹1,000 base price gives a final amount of ₹1,180." },
    { q: "What's the difference between GST-inclusive and GST-exclusive calculation?", a: "GST-exclusive adds GST on top of a base price; GST-inclusive extracts the GST portion already built into a total price — the calculator handles both directions. For example, ₹1,180 at 18% GST-inclusive works out to a ₹1,000 base price plus ₹180 GST." },
    { q: "What GST rate should I use in the calculator?", a: "Use the GST rate applicable to your specific goods or service (common slabs are 5%, 12%, 18%, and 28%) — check the applicable rate for your transaction before calculating." },
    { q: "What is a Future Goal (Inflation) Calculator?", a: "It shows what a goal that costs a certain amount today will realistically cost in the future once you factor in an assumed inflation rate. For example, a goal costing ₹10 lakh today could cost roughly ₹18-20 lakh in 10 years at an assumed 6-7% inflation rate." },
    { q: "What inflation rate does the calculator assume?", a: "It typically uses a general assumed rate (often around 6-7% for planning purposes), which you can usually adjust to match a more conservative or aggressive estimate." },
    { q: "Why does my goal cost more in the future than today?", a: "Because of inflation — prices for education, weddings, and most goals tend to rise over time, so today's cost isn't what you'll actually need to have saved. For example, a course costing ₹5 lakh today could easily cost ₹9-10 lakh in 10 years if education costs rise faster than general inflation." },
    { q: "What rate of return do the calculators assume for equity mutual funds?", a: "Most calculators default to a commonly used long-term estimate like 12% p.a. for equity, which you can adjust — actual returns are never guaranteed and depend on market performance." },
    { q: "Can I change the assumed rate of return in the calculators?", a: "Yes, all our calculators let you edit the expected rate of return to model more conservative or optimistic scenarios." },
    { q: "Are these calculators free to use?", a: "Yes, all nine calculators on this page are completely free with no login required." },
    { q: "Do I need to create an account to use the calculators?", a: "No, you can use any calculator on this page instantly without signing up or logging in." },
    { q: "Can I download or export my calculation results?", a: "Yes, several calculators let you export your results as a personalised proposal PDF." },
    { q: "Is my data saved when I use a calculator?", a: "No, calculator inputs are used only to generate your result on the page and aren't stored unless you choose to export or share them with us." },
    { q: "Can I use the SIP calculator to plan for retirement?", a: "Yes, many clients use the SIP calculator to estimate the corpus a long-term monthly investment could build towards retirement, alongside options like NPS. For example, a ₹10,000/month SIP for 25 years at an assumed 12% return could build a corpus well over ₹1 crore — a useful starting estimate to plan around." },
    { q: "How accurate is the EMI calculator compared to my bank's actual EMI?", a: "It's very close for standard reducing-balance loans, though your bank's final figure may vary slightly due to rounding, processing fees, or specific loan terms." },
    { q: "Why does my bank's EMI differ slightly from the calculator's result?", a: "Small differences usually come from rounding conventions, exact interest compounding methods, or additional charges your bank includes that a generic calculator doesn't." },
    { q: "Can I compare SIP vs Lumpsum results side by side?", a: "Yes, you can run both calculators with the same amount and duration to compare how each approach could grow your money differently." },
    { q: "What's a reasonable expected return to assume for a long-term equity SIP?", a: "Many investors use a long-term historical range of 10-12% p.a. as a planning assumption, though this isn't guaranteed and actual returns will vary year to year." },
    { q: "Should I use a debt fund return assumption for short-term goals?", a: "Yes, for goals under 3 years, a lower, more conservative return assumption (closer to debt fund returns) is more realistic than assuming equity-like growth." },
    { q: "Can these calculators account for market volatility?", a: "No, they use a smoothed average annual return for simplicity — actual investment journeys involve ups and downs that a basic calculator doesn't simulate." },
    { q: "Do calculator results guarantee my actual investment outcome?", a: "No, all results are estimates based on assumed rates — actual mutual fund, loan, or tax outcomes depend on real market and regulatory conditions and are never guaranteed." },
    { q: "What is the minimum and maximum investment period I can enter?", a: "Most calculators accept a wide range, from a few months to several decades, so you can model both short-term and long-term goals." },
    { q: "Can I use these calculators on mobile?", a: "Yes, all calculators are fully responsive and work smoothly on mobile, tablet, and desktop." },
    { q: "Do I need to know my exact salary to use the Tax Calculator?", a: "An accurate figure gives the best estimate, but you can also enter an approximate income to get a rough sense of your tax liability under both regimes." },
    { q: "How often should I recalculate my SIP or goal projections?", a: "Revisiting your numbers once or twice a year, or after a major income or goal change, keeps your plan realistic and on track." },
    { q: "Can I use these calculators before speaking to an advisor?", a: "Yes, they're designed as a self-serve starting point — many clients bring their calculator results into their first free consultation with us." },
  ],
  hi: [
    { q: "Step-up SIP क्या है?", a: "यह एक SIP है जिसमें आप हर साल अपनी मासिक निवेश राशि को एक फिक्स्ड प्रतिशत से बढ़ाते हैं, जैसे-जैसे आपकी इनकम बढ़ती है। उदाहरण के लिए, ₹5,000/माह की SIP को हर साल 10% बढ़ाया जाए तो पांचवें साल तक आप लगभग ₹8,000/माह निवेश कर रहे होंगे।" },
    { q: "Step-up SIP फ्लैट SIP से बेहतर क्यों है?", a: "क्योंकि ज्यादातर लोगों की इनकम समय के साथ बढ़ती है, Step-up SIP आपको ज्यादा कमाने पर ज्यादा निवेश करने में मदद करती है, जिससे लंबे समय में एक बड़ा कॉर्पस बनता है। उदाहरण के लिए, 15 साल में ₹5,000/माह से शुरू होने वाली Step-up SIP एक फ्लैट ₹5,000/माह की SIP से काफी बड़ा कॉर्पस बना सकती है, क्योंकि बाद के सालों में योगदान काफी ज्यादा हो जाता है।" },
    { q: "Reducing Balance और Fixed Rate EMI में क्या फर्क है?", a: "Reducing Balance में इंटरेस्ट सिर्फ बचे हुए लोन अमाउंट पर लगता है (ज्यादातर बैंक लोन ऐसे होते हैं)। Fixed Rate में इंटरेस्ट पूरे ओरिजिनल अमाउंट पर पूरे टेन्योर तक लगता है, जिससे कुल लागत ज्यादा हो जाती है। उदाहरण के लिए, ₹5 लाख के लोन पर 10% दर से 5 साल के लिए, Fixed Rate तरीका उसी हेडलाइन रेट पर Reducing Balance से काफी ज्यादा कुल इंटरेस्ट खर्च करा सकता है।" },
    { q: "Interest-Free SIP सुझाव कैसे काम करता है?", a: "यह आपके लोन पर देय कुल इंटरेस्ट कैलकुलेट करता है, फिर बताता है कि कितनी मासिक SIP (12% p.a. रिटर्न मानकर) से लोन खत्म होने तक लगभग उतनी ही राशि बन सकती है। उदाहरण के लिए, अगर किसी लोन का कुल इंटरेस्ट 10 साल में ₹4 लाख बनता है, तो कैलकुलेटर दिखाता है कि लगभग कितनी मासिक SIP से उतने ही समय में ₹4 लाख का कॉर्पस बन सकता है।" },
    { q: "मुझे कौन सा टैक्स रिजीम चुनना चाहिए?", a: "अगर आपके 80C निवेश, HRA या अन्य डिडक्शन ज्यादा हैं, तो Old Regime अक्सर बेहतर होता है। कम डिडक्शन हों तो New Regime के कम स्लैब आमतौर पर सस्ते पड़ते हैं। कैलकुलेटर दोनों दिखाता है।" },
    { q: "क्या ये कैलकुलेटर सटीक हैं?", a: "ये आपके दिए गए इनपुट और अनुमानित दरों के आधार पर अनुमान देते हैं — वास्तविक रिटर्न, महंगाई और टैक्स नियम बदल सकते हैं, गारंटीड नहीं होते।" },
    { q: "क्या मुझे एडवाइजर से पर्सनलाइज्ड कैलकुलेशन मिल सकती है?", a: "हाँ, ये कैलकुलेटर एक शुरुआती बिंदु हैं — विस्तृत, पर्सनलाइज्ड प्लान के लिए हमारी टीम से फ्री कंसल्टेशन बुक करें।" },
    { q: "SIP कैलकुलेटर किस लिए इस्तेमाल होता है?", a: "यह राशि, अवधि और अनुमानित सालाना रिटर्न दर के आधार पर आपकी मासिक म्यूचुअल फंड SIP की भविष्य की वैल्यू का अनुमान लगाता है। उदाहरण के लिए, ₹5,000/माह की SIP को 15 साल तक 12% के अनुमानित रिटर्न पर चलाया जाए तो यह लगभग ₹25 लाख तक बढ़ सकती है — अपने खुद के अनुमान के लिए अपने नंबर डालें।" },
    { q: "SIP कैलकुलेटर की मैच्योरिटी वैल्यू कैसे कैलकुलेट होती है?", a: "यह पीरियोडिक निवेश के लिए स्टैंडर्ड कंपाउंड इंटरेस्ट फॉर्मूला इस्तेमाल करता है, आपके चुने गए टेन्योर में आपकी मासिक राशि को अनुमानित दर पर कंपाउंड करते हुए। उदाहरण के लिए, हर महीने का ₹5,000 का योगदान अलग-अलग समय तक कंपाउंड होता है, इसलिए पहले साल का निवेश पूरे टेन्योर तक बढ़ता है जबकि आखिरी महीने का निवेश लगभग नहीं बढ़ता।" },
    { q: "Daily SIP कैलकुलेटर क्या है?", a: "यह दिखाता है कि म्यूचुअल फंड में एक छोटी फिक्स्ड डेली राशि समय के साथ कैसे बढ़ सकती है, जो मासिक SIP से ज्यादा बार कंपाउंड होती है। उदाहरण के लिए, रोज़ ₹200 (लगभग ₹6,000/माह) 15 साल तक 12% के अनुमानित रिटर्न पर निवेश करने से एक बराबर मासिक SIP जैसा ही कॉर्पस बन सकता है।" },
    { q: "मासिक SIP की बजाय Daily SIP कैलकुलेटर किसे इस्तेमाल करना चाहिए?", a: "जो कोई भी एक बड़ी मासिक कटौती के बजाय छोटी, ज्यादा बार की राशि निवेश करना पसंद करता है — जैसे डेली सेविंग्स से।" },
    { q: "Lumpsum कैलकुलेटर क्या है?", a: "यह दिखाता है कि एक बार की निवेश राशि चुनी गई अवधि में अनुमानित सालाना रिटर्न दर पर कंपाउंड ग्रोथ के साथ कैसे बढ़ सकती है। उदाहरण के लिए, ₹5 लाख का लम्पसम 10 साल के लिए 12% के अनुमानित रिटर्न पर निवेश किया जाए तो यह लगभग ₹15.5 लाख तक बढ़ सकता है।" },
    { q: "SIP और Lumpsum निवेश में क्या फर्क है?", a: "SIP निवेश को नियमित अंतराल में फैलाती है, जिससे खरीद लागत औसत होती है, जबकि Lumpsum पूरी राशि एक साथ निवेश करती है, जिसका नतीजा मार्केट टाइमिंग पर काफी निर्भर करता है।" },
    { q: "SWP कैलकुलेटर क्या है?", a: "यह दिखाता है कि अगर आप नियमित रूप से एक फिक्स्ड राशि निकालते हैं तो कॉर्पस कितने समय तक चलेगा, कॉर्पस की अनुमानित निरंतर ग्रोथ को ध्यान में रखते हुए। उदाहरण के लिए, ₹20 लाख के कॉर्पस से जो 8% की अनुमानित दर से बढ़ रहा है, हर महीने ₹10,000 निकालना, बिना किसी ग्रोथ वाले कॉर्पस से उतनी ही निकासी की तुलना में काफी ज्यादा समय तक चल सकता है।" },
    { q: "मुझे कैसे पता चले कि मेरा SWP कॉर्पस काफी समय तक चलेगा?", a: "कैलकुलेटर आपके विड्रॉल रेट और अनुमानित रिटर्न के आधार पर समय के साथ कॉर्पस के घटने (या बढ़ने) को दिखाता है, ताकि जरूरत पड़ने पर आप विड्रॉल राशि एडजस्ट कर सकें।" },
    { q: "क्या SWP विड्रॉल मेरे कॉर्पस की ग्रोथ से ज्यादा हो सकता है?", a: "हाँ, अगर आप अपने कॉर्पस की ग्रोथ से ज्यादा निकालते हैं, तो प्रिंसिपल धीरे-धीरे घटेगा — कैलकुलेटर आपको यह असल जिंदगी में होने से पहले दिखाने में मदद करता है। उदाहरण के लिए, ₹20 लाख के कॉर्पस से जो सिर्फ 6% सालाना बढ़ रहा है, ₹15,000/माह निकालना ₹10,000/माह निकालने से कहीं ज्यादा तेजी से प्रिंसिपल घटाएगा।" },
    { q: "Goal Planning कैलकुलेटर क्या है?", a: "यह किसी खास भविष्य के गोल अमाउंट, जैसे बच्चे की एजुकेशन या घर की डाउन पेमेंट, तक पहुंचने के लिए आज जरूरी मासिक SIP को रिवर्स-कैलकुलेट करता है। उदाहरण के लिए, अगर आपको 10 साल में ₹20 लाख चाहिए, तो कैलकुलेटर बताता है कि एक अनुमानित रिटर्न पर वहां तक पहुंचने के लिए लगभग कितनी मासिक SIP चाहिए।" },
    { q: "मैं अपने बच्चे की एजुकेशन के लिए Goal कैलकुलेटर कैसे इस्तेमाल करूं?", a: "आज की अनुमानित लागत, फंड चाहिए होने तक के सालों की संख्या, और एक अनुमानित रिटर्न डालें — यह आपको उस गोल तक पहुंचने के लिए जरूरी मासिक SIP बताता है।" },
    { q: "अगर मुझे अपने गोल की सटीक भविष्य की लागत नहीं पता तो?", a: "आज की लागत को शुरुआती अनुमान के रूप में इस्तेमाल करें और कैलकुलेटर के इन्फ्लेशन एडजस्टमेंट को एक रीजनेबल भविष्य का आंकड़ा प्रोजेक्ट करने दें, या हमसे अनुमान लगाने में मदद मांगें।" },
    { q: "EMI/Loan कैलकुलेटर क्या है?", a: "यह लोन अमाउंट, इंटरेस्ट रेट और टेन्योर के आधार पर होम, कार या पर्सनल लोन के लिए आपकी फिक्स्ड मासिक चुकौती राशि कैलकुलेट करता है। उदाहरण के लिए, 9% पर 20 साल के लिए ₹30 लाख का होम लोन लगभग ₹27,000/माह की EMI बनाता है।" },
    { q: "EMI कैलकुलेटर को कौन से इनपुट चाहिए?", a: "लोन अमाउंट, इंटरेस्ट रेट और टेन्योर (महीनों या सालों में) — ये तीन मुख्य इनपुट EMI कैलकुलेट करने के लिए चाहिए होते हैं।" },
    { q: "क्या EMI कैलकुलेटर में प्रोसेसिंग फीस या अन्य लोन चार्ज शामिल हैं?", a: "नहीं, यह सिर्फ प्रिंसिपल और इंटरेस्ट EMI कैलकुलेट करता है — प्रोसेसिंग फीस, इंश्योरेंस और अन्य चार्ज लेंडर के हिसाब से अलग होते हैं और इसमें शामिल नहीं हैं।" },
    { q: "Income Tax कैलकुलेटर क्या है?", a: "यह Old और New दोनों टैक्स रिजीम के तहत आपकी टैक्स देनदारी का अनुमान लगाता है ताकि आप compare कर सकें कि आपकी इनकम और डिडक्शन के लिए कौन सा सस्ता पड़ता है।" },
    { q: "क्या Tax कैलकुलेटर मेरा टैक्स फाइल करता है?", a: "नहीं, यह सिर्फ प्लानिंग के लिए एक अनुमान देता है — असली फाइलिंग हमेशा एक क्वालिफाइड टैक्स प्रोफेशनल या ऑफिशियल पोर्टल के जरिए होनी चाहिए।" },
    { q: "क्या मैं सैलरीड और सेल्फ-एम्प्लॉयड दोनों इनकम के लिए Tax कैलकुलेटर इस्तेमाल कर सकता हूं?", a: "हाँ, आप सोर्स चाहे जो भी हो अपनी इनकम डिटेल्स डाल सकते हैं, हालांकि सेल्फ-एम्प्लॉयड इनकम में कुछ अतिरिक्त बातों की पुष्टि टैक्स प्रोफेशनल से करना बेहतर है।" },
    { q: "GST कैलकुलेटर क्या है?", a: "यह किसी ट्रांजैक्शन के लिए GST अमाउंट और फाइनल प्राइस जल्दी कैलकुलेट करता है, चाहे आप बेस प्राइस में GST जोड़ रहे हों या GST-इन्क्लूसिव अमाउंट से उसे निकाल रहे हों। उदाहरण के लिए, ₹1,000 के बेस प्राइस में 18% GST जोड़ने पर फाइनल अमाउंट ₹1,180 बनता है।" },
    { q: "GST-inclusive और GST-exclusive कैलकुलेशन में क्या फर्क है?", a: "GST-exclusive बेस प्राइस के ऊपर GST जोड़ता है; GST-inclusive एक टोटल प्राइस में पहले से शामिल GST हिस्से को निकालता है — कैलकुलेटर दोनों दिशाओं को हैंडल करता है। उदाहरण के लिए, 18% GST-inclusive ₹1,180 का मतलब है ₹1,000 का बेस प्राइस और ₹180 GST।" },
    { q: "कैलकुलेटर में मुझे कौन सी GST रेट इस्तेमाल करनी चाहिए?", a: "अपने खास सामान या सर्विस पर लागू GST रेट इस्तेमाल करें (आम स्लैब 5%, 12%, 18% और 28% हैं) — कैलकुलेट करने से पहले अपने ट्रांजैक्शन पर लागू रेट चेक करें।" },
    { q: "Future Goal (Inflation) कैलकुलेटर क्या है?", a: "यह दिखाता है कि आज एक निश्चित राशि की लागत वाला गोल, अनुमानित इन्फ्लेशन रेट को ध्यान में रखने पर भविष्य में वास्तव में कितना खर्च होगा। उदाहरण के लिए, आज ₹10 लाख की लागत वाला कोई गोल 6-7% की अनुमानित इन्फ्लेशन दर पर 10 साल में लगभग ₹18-20 लाख का हो सकता है।" },
    { q: "कैलकुलेटर कौन सी इन्फ्लेशन रेट मानता है?", a: "यह आमतौर पर एक सामान्य अनुमानित दर इस्तेमाल करता है (प्लानिंग के लिए अक्सर 6-7% के आस-पास), जिसे आप आमतौर पर ज्यादा कंजर्वेटिव या ज्यादा एग्रेसिव अनुमान से मैच करने के लिए एडजस्ट कर सकते हैं।" },
    { q: "मेरे गोल की भविष्य में लागत आज से ज्यादा क्यों है?", a: "इन्फ्लेशन की वजह से — एजुकेशन, शादी और ज्यादातर गोल्स की कीमतें समय के साथ बढ़ती हैं, इसलिए आज की लागत वह नहीं है जो आपको असल में सेव करनी होगी। उदाहरण के लिए, आज ₹5 लाख का कोई कोर्स 10 साल में ₹9-10 लाख तक पहुंच सकता है अगर एजुकेशन की लागत सामान्य महंगाई से तेज बढ़े।" },
    { q: "इक्विटी म्यूचुअल फंड के लिए कैलकुलेटर कौन सी रिटर्न दर मानते हैं?", a: "ज्यादातर कैलकुलेटर डिफॉल्ट रूप से इक्विटी के लिए 12% p.a. जैसा एक आम इस्तेमाल होने वाला लॉन्ग-टर्म अनुमान इस्तेमाल करते हैं, जिसे आप एडजस्ट कर सकते हैं — असली रिटर्न कभी गारंटीड नहीं होते और मार्केट परफॉरमेंस पर निर्भर करते हैं।" },
    { q: "क्या मैं कैलकुलेटर में अनुमानित रिटर्न दर बदल सकता हूं?", a: "हाँ, हमारे सभी कैलकुलेटर आपको ज्यादा कंजर्वेटिव या ऑप्टिमिस्टिक सिनेरियो मॉडल करने के लिए अपेक्षित रिटर्न दर एडिट करने देते हैं।" },
    { q: "क्या ये कैलकुलेटर इस्तेमाल करने के लिए फ्री हैं?", a: "हाँ, इस पेज पर सभी नौ कैलकुलेटर बिना किसी लॉगिन के पूरी तरह फ्री हैं।" },
    { q: "क्या कैलकुलेटर इस्तेमाल करने के लिए मुझे अकाउंट बनाना होगा?", a: "नहीं, आप बिना साइन अप या लॉगिन किए इस पेज पर किसी भी कैलकुलेटर को तुरंत इस्तेमाल कर सकते हैं।" },
    { q: "क्या मैं अपने कैलकुलेशन रिजल्ट डाउनलोड या एक्सपोर्ट कर सकता हूं?", a: "हाँ, कई कैलकुलेटर आपको अपने रिजल्ट को पर्सनलाइज्ड प्रपोजल PDF के रूप में एक्सपोर्ट करने देते हैं।" },
    { q: "क्या कैलकुलेटर इस्तेमाल करते समय मेरा डेटा सेव होता है?", a: "नहीं, कैलकुलेटर इनपुट सिर्फ पेज पर आपका रिजल्ट जनरेट करने के लिए इस्तेमाल होते हैं और तब तक स्टोर नहीं होते जब तक आप उन्हें एक्सपोर्ट या हमारे साथ शेयर न करें।" },
    { q: "क्या मैं SIP कैलकुलेटर का इस्तेमाल रिटायरमेंट प्लानिंग के लिए कर सकता हूं?", a: "हाँ, कई क्लाइंट्स NPS जैसे ऑप्शन के साथ-साथ, एक लॉन्ग-टर्म मासिक निवेश रिटायरमेंट के लिए कितना कॉर्पस बना सकता है इसका अनुमान लगाने के लिए SIP कैलकुलेटर इस्तेमाल करते हैं। उदाहरण के लिए, ₹10,000/माह की SIP को 25 साल तक 12% के अनुमानित रिटर्न पर चलाया जाए तो यह ₹1 करोड़ से भी ज्यादा का कॉर्पस बना सकती है — प्लानिंग के लिए एक उपयोगी शुरुआती अनुमान।" },
    { q: "मेरे बैंक की असली EMI के मुकाबले EMI कैलकुलेटर कितना सटीक है?", a: "स्टैंडर्ड reducing-balance लोन के लिए यह काफी करीब होता है, हालांकि राउंडिंग, प्रोसेसिंग फीस या खास लोन शर्तों की वजह से आपके बैंक का फाइनल आंकड़ा थोड़ा अलग हो सकता है।" },
    { q: "मेरे बैंक की EMI कैलकुलेटर के रिजल्ट से थोड़ी अलग क्यों है?", a: "छोटे फर्क आमतौर पर राउंडिंग कन्वेंशन, इंटरेस्ट कंपाउंडिंग के सटीक तरीके, या आपके बैंक द्वारा शामिल किए गए अतिरिक्त चार्जेस से आते हैं जो एक जनरिक कैलकुलेटर में नहीं होते।" },
    { q: "क्या मैं SIP बनाम Lumpsum के रिजल्ट साथ-साथ compare कर सकता हूं?", a: "हाँ, आप दोनों कैलकुलेटर एक ही राशि और अवधि के साथ चलाकर compare कर सकते हैं कि हर तरीका आपके पैसे को अलग तरीके से कैसे बढ़ा सकता है।" },
    { q: "लॉन्ग-टर्म इक्विटी SIP के लिए कौन सी अपेक्षित रिटर्न मानना रीजनेबल है?", a: "कई निवेशक प्लानिंग अनुमान के रूप में 10-12% p.a. की लॉन्ग-टर्म हिस्टोरिकल रेंज इस्तेमाल करते हैं, हालांकि यह गारंटीड नहीं है और असली रिटर्न साल-दर-साल बदलता रहेगा।" },
    { q: "क्या मुझे शॉर्ट-टर्म गोल्स के लिए डेट फंड रिटर्न का अनुमान इस्तेमाल करना चाहिए?", a: "हाँ, 3 साल से कम के गोल्स के लिए, इक्विटी जैसी ग्रोथ मानने के बजाय एक कम, ज्यादा कंजर्वेटिव रिटर्न अनुमान (डेट फंड रिटर्न के करीब) ज्यादा रियलिस्टिक है।" },
    { q: "क्या ये कैलकुलेटर मार्केट वोलैटिलिटी को ध्यान में रखते हैं?", a: "नहीं, सिंपलिसिटी के लिए ये एक स्मूथ्ड औसत सालाना रिटर्न इस्तेमाल करते हैं — असली निवेश जर्नी में उतार-चढ़ाव होते हैं जिन्हें एक बेसिक कैलकुलेटर सिमुलेट नहीं करता।" },
    { q: "क्या कैलकुलेटर रिजल्ट मेरे असली निवेश नतीजे की गारंटी देते हैं?", a: "नहीं, सभी रिजल्ट अनुमानित दरों पर आधारित अनुमान हैं — असली म्यूचुअल फंड, लोन या टैक्स नतीजे असली मार्केट और रेगुलेटरी कंडीशंस पर निर्भर करते हैं और कभी गारंटीड नहीं होते।" },
    { q: "मैं कितनी न्यूनतम और अधिकतम निवेश अवधि डाल सकता हूं?", a: "ज्यादातर कैलकुलेटर एक विस्तृत रेंज स्वीकार करते हैं, कुछ महीनों से लेकर कई दशकों तक, ताकि आप शॉर्ट-टर्म और लॉन्ग-टर्म दोनों गोल्स मॉडल कर सकें।" },
    { q: "क्या मैं ये कैलकुलेटर मोबाइल पर इस्तेमाल कर सकता हूं?", a: "हाँ, सभी कैलकुलेटर पूरी तरह रिस्पॉन्सिव हैं और मोबाइल, टैबलेट और डेस्कटॉप पर आसानी से काम करते हैं।" },
    { q: "क्या Tax कैलकुलेटर इस्तेमाल करने के लिए मुझे अपनी एग्जैक्ट सैलरी पता होनी चाहिए?", a: "एक सटीक आंकड़ा सबसे अच्छा अनुमान देता है, पर आप एक अनुमानित इनकम डालकर भी दोनों रिजीम के तहत अपनी टैक्स देनदारी का मोटा अंदाज़ा ले सकते हैं।" },
    { q: "मुझे अपने SIP या गोल प्रोजेक्शन कितनी बार दोबारा कैलकुलेट करने चाहिए?", a: "साल में एक-दो बार, या किसी बड़े इनकम या गोल बदलाव के बाद अपने आंकड़ों को दोबारा देखना आपके प्लान को रियलिस्टिक और ट्रैक पर रखता है।" },
    { q: "क्या मैं एडवाइजर से बात करने से पहले ये कैलकुलेटर इस्तेमाल कर सकता हूं?", a: "हाँ, ये एक सेल्फ-सर्व शुरुआती बिंदु के रूप में डिजाइन किए गए हैं — कई क्लाइंट्स अपने कैलकुलेटर रिजल्ट हमारी पहली फ्री कंसल्टेशन में साथ लाते हैं।" },
  ],
  hinglish: [
    { q: "Step-up SIP kya hota hai?", a: "Yeh ek SIP hai jisme aap har saal apni monthly investment amount ko ek fixed percentage se badhate ho, jaise jaise aapki income badhti hai. Jaise, ₹5,000/month ki SIP ko har saal 10% badhaya jaaye to paanchve saal tak aap lagbhag ₹8,000/month invest kar rahe honge." },
    { q: "Step-up SIP flat SIP se better kyu hai?", a: "Kyunki zyada tar logo ki income time ke saath badhti hai, Step-up SIP aapko zyada earn karne pe zyada invest karne mein help karta hai, jisse long term mein bada corpus banta hai. Jaise, 15 saal mein ₹5,000/month se shuru hone wali Step-up SIP ek flat ₹5,000/month ki SIP se kaafi bada corpus bana sakti hai, kyunki baad ke saalon mein contribution kaafi zyada ho jaata hai." },
    { q: "Reducing Balance aur Fixed Rate EMI mein kya farak hai?", a: "Reducing Balance mein interest sirf bache hue loan amount pe lagta hai (zyada tar bank loans aise hote hain). Fixed Rate mein interest poore original amount pe lagta hai pure tenure tak, jisse total cost zyada ho jata hai. Jaise, ₹5 lakh ke loan pe 10% rate se 5 saal ke liye, Fixed Rate method usi headline rate pe Reducing Balance se kaafi zyada total interest kharch kara sakta hai." },
    { q: "Interest-Free SIP suggestion kaise kaam karta hai?", a: "Yeh aapke loan ka total interest calculate karta hai, phir batata hai ki kitni monthly SIP (12% p.a. return maan kar) se loan khatam hone tak roughly utna hi amount ban sakta hai. Jaise, agar kisi loan ka total interest 10 saal mein ₹4 lakh banta hai, to calculator dikhata hai ki lagbhag kitni monthly SIP se utne hi period mein ₹4 lakh ka corpus ban sakta hai." },
    { q: "Mujhe kaunsa tax regime choose karna chahiye?", a: "Agar aapke 80C investments, HRA ya doosri deductions zyada hain, to Old Regime often better hota hai. Kam deductions ho to New Regime ke lower slabs usually cheaper padte hain. Calculator dono dikhata hai." },
    { q: "Kya yeh calculators accurate hain?", a: "Yeh aapke diye gaye input aur assumed rates ke base pe estimate dete hain — actual returns, inflation aur tax rules vary kar sakte hain, guaranteed nahi hote." },
    { q: "Kya mujhe advisor se personalized calculation mil sakti hai?", a: "Haan, yeh calculators ek starting point hain — detailed aur personalized plan ke liye hamari team se free consultation book karo." },
    { q: "SIP Calculator kis liye use hota hai?", a: "Yeh amount, duration aur assumed annual return rate ke basis pe aapki monthly mutual fund SIP ki future value estimate karta hai. Jaise, ₹5,000/month ki SIP ko 15 saal tak 12% ke assumed return pe chalayen to yeh lagbhag ₹25 lakh tak badh sakti hai — apna estimate dekhne ke liye apne khud ke numbers daalo." },
    { q: "SIP Calculator ki maturity value kaise calculate hoti hai?", a: "Yeh periodic investments ke liye standard compound interest formula use karta hai, aapki monthly contributions ko chosen tenure mein assumed rate pe compound karte hue. Jaise, har mahine ka ₹5,000 ka contribution alag-alag time tak compound hota hai, isliye pehle saal ka investment pure tenure tak badhta hai jabki aakhri mahine ka investment lagbhag nahi badhta." },
    { q: "Daily SIP Calculator kya hai?", a: "Yeh project karta hai ki mutual fund mein ek chhoti fixed daily investment time ke saath kaise badh sakti hai, jo monthly SIP se zyada frequently compound hoti hai. Jaise, roz ₹200 (lagbhag ₹6,000/month) 15 saal tak 12% ke assumed return pe invest karne se ek barabar monthly SIP jaisa hi corpus ban sakta hai." },
    { q: "Monthly SIP ki jagah Daily SIP Calculator kisko use karna chahiye?", a: "Jo koi bhi ek badi monthly deduction ke bajaye chhoti, zyada frequent amounts invest karna prefer karta hai — jaise daily savings se." },
    { q: "Lumpsum Calculator kya hai?", a: "Yeh dikhata hai ki ek baar ki investment amount chosen period mein assumed annual return rate pe compound growth ke saath kaise badh sakti hai. Jaise, ₹5 lakh ka lumpsum 10 saal ke liye 12% ke assumed return pe invest kiya jaaye to yeh lagbhag ₹15.5 lakh tak badh sakta hai." },
    { q: "SIP aur Lumpsum investing mein kya farak hai?", a: "SIP investment ko regular intervals mein spread karti hai, jisse purchase cost average hoti hai, jabki Lumpsum poori amount ek saath invest karta hai, jiska result market timing pe kaafi depend karta hai." },
    { q: "SWP Calculator kya hai?", a: "Yeh dikhata hai ki agar aap regularly ek fixed amount withdraw karte ho to corpus kitne time tak chalega, corpus ki assumed ongoing growth ko factor karte hue. Jaise, ₹20 lakh ke corpus se jo 8% ki assumed rate se badh raha hai, har mahine ₹10,000 nikalna, bina kisi growth wale corpus se utni hi withdrawal ke comparison mein kaafi zyada time tak chal sakta hai." },
    { q: "Mujhe kaise pata chale ki mera SWP corpus kaafi time tak chalega?", a: "Calculator aapke withdrawal rate aur assumed returns ke basis pe time ke saath corpus ke ghatne (ya badhne) ko dikhata hai, taaki zaroorat pade to aap withdrawal amount adjust kar sako." },
    { q: "Kya SWP withdrawals mere corpus ki growth se zyada ho sakte hain?", a: "Haan, agar aap apne corpus ki growth se zyada nikaalte ho, to principal dheere-dheere kam hoga — calculator aapko yeh real life mein hone se pehle dikhane mein help karta hai. Jaise, ₹20 lakh ke corpus se jo sirf 6% saalana badh raha hai, ₹15,000/month nikalna ₹10,000/month nikalne se kahin zyada tezi se principal ghatayega." },
    { q: "Goal Planning Calculator kya hai?", a: "Yeh kisi specific future goal amount, jaise bachche ki education ya ghar ki down payment, tak pahunchne ke liye aaj zaroori monthly SIP ko reverse-calculate karta hai. Jaise, agar aapko 10 saal mein ₹20 lakh chahiye, to calculator batata hai ki ek assumed return pe wahan tak pahunchne ke liye lagbhag kitni monthly SIP chahiye." },
    { q: "Main apne bachche ki education ke liye Goal Calculator kaise use karoon?", a: "Aaj ki estimated cost, fund chahiye hone tak ke saalon ki sankhya, aur ek assumed return daalo — yeh aapko us goal tak pahunchne ke liye zaroori monthly SIP batata hai." },
    { q: "Agar mujhe apne goal ki exact future cost nahi pata to?", a: "Aaj ki cost ko starting estimate ke roop mein use karo aur calculator ke inflation adjustment ko ek reasonable future figure project karne do, ya humse estimate karne mein help maango." },
    { q: "EMI/Loan Calculator kya hai?", a: "Yeh loan amount, interest rate aur tenure ke basis pe home, car ya personal loan ke liye aapki fixed monthly repayment amount calculate karta hai. Jaise, 9% pe 20 saal ke liye ₹30 lakh ka home loan lagbhag ₹27,000/month ki EMI banata hai." },
    { q: "EMI Calculator ko kaunse inputs chahiye?", a: "Loan amount, interest rate aur tenure (months ya years mein) — yeh teen core inputs EMI calculate karne ke liye chahiye hote hain." },
    { q: "Kya EMI Calculator mein processing fees ya doosre loan charges included hain?", a: "Nahi, yeh sirf principal aur interest EMI calculate karta hai — processing fees, insurance aur doosre charges lender ke hisaab se alag hote hain aur ismein included nahi hain." },
    { q: "Income Tax Calculator kya hai?", a: "Yeh Old aur New dono tax regimes ke under aapki tax liability estimate karta hai taaki aap compare kar sako ki aapki income aur deductions ke liye kaunsa cheaper padta hai." },
    { q: "Kya Tax Calculator mera tax file karta hai?", a: "Nahi, yeh sirf planning ke liye ek estimate deta hai — actual filing hamesha ek qualified tax professional ya official portal ke through honi chahiye." },
    { q: "Kya main salaried aur self-employed dono income ke liye Tax Calculator use kar sakta hoon?", a: "Haan, aap source chahe jo bhi ho apni income details daal sakte ho, halanki self-employed income mein kuch additional considerations ki confirmation tax professional se karna better hai." },
    { q: "GST Calculator kya hai?", a: "Yeh kisi transaction ke liye GST amount aur final price jaldi calculate karta hai, chahe aap base price mein GST jod rahe ho ya GST-inclusive amount se use nikaal rahe ho. Jaise, ₹1,000 ke base price mein 18% GST jodne pe final amount ₹1,180 banta hai." },
    { q: "GST-inclusive aur GST-exclusive calculation mein kya farak hai?", a: "GST-exclusive base price ke upar GST jodta hai; GST-inclusive ek total price mein pehle se included GST portion nikaalta hai — calculator dono directions handle karta hai. Jaise, 18% GST-inclusive ₹1,180 ka matlab hai ₹1,000 ka base price aur ₹180 GST." },
    { q: "Calculator mein mujhe kaunsi GST rate use karni chahiye?", a: "Apne specific goods ya service pe applicable GST rate use karo (common slabs 5%, 12%, 18% aur 28% hain) — calculate karne se pehle apne transaction pe applicable rate check karo." },
    { q: "Future Goal (Inflation) Calculator kya hai?", a: "Yeh dikhata hai ki aaj ek certain amount ki cost wala goal, assumed inflation rate ko factor karne pe future mein realistically kitna cost karega. Jaise, aaj ₹10 lakh ki cost wala koi goal 6-7% ki assumed inflation rate pe 10 saal mein lagbhag ₹18-20 lakh ka ho sakta hai." },
    { q: "Calculator kaunsi inflation rate assume karta hai?", a: "Yeh usually ek general assumed rate use karta hai (planning ke liye often 6-7% ke aas-paas), jise aap usually zyada conservative ya zyada aggressive estimate se match karne ke liye adjust kar sakte ho." },
    { q: "Mere goal ki future cost aaj se zyada kyu hai?", a: "Inflation ki wajah se — education, shaadi aur zyada tar goals ki prices time ke saath badhti hain, isliye aaj ki cost woh nahi hai jo aapko actually save karni hogi. Jaise, aaj ₹5 lakh ka koi course 10 saal mein ₹9-10 lakh tak pahunch sakta hai agar education ki cost general inflation se tez badhe." },
    { q: "Equity mutual funds ke liye calculators kaunsi return rate assume karte hain?", a: "Zyada tar calculators default roop se equity ke liye 12% p.a. jaisa ek commonly used long-term estimate use karte hain, jise aap adjust kar sakte ho — actual returns kabhi guaranteed nahi hote aur market performance pe depend karte hain." },
    { q: "Kya main calculators mein assumed return rate badal sakta hoon?", a: "Haan, hamare sabhi calculators aapko zyada conservative ya optimistic scenarios model karne ke liye expected return rate edit karne dete hain." },
    { q: "Kya yeh calculators use karne ke liye free hain?", a: "Haan, is page pe sabhi nau calculators bina kisi login ke bilkul free hain." },
    { q: "Kya calculators use karne ke liye mujhe account banana hoga?", a: "Nahi, aap bina sign up ya login kiye is page pe kisi bhi calculator ko turant use kar sakte ho." },
    { q: "Kya main apne calculation results download ya export kar sakta hoon?", a: "Haan, kai calculators aapko apne results ko personalised proposal PDF ke roop mein export karne dete hain." },
    { q: "Kya calculator use karte waqt mera data save hota hai?", a: "Nahi, calculator inputs sirf page pe aapka result generate karne ke liye use hote hain aur tab tak store nahi hote jab tak aap unhe export ya humare saath share na karo." },
    { q: "Kya main SIP calculator ka use retirement planning ke liye kar sakta hoon?", a: "Haan, kai clients NPS jaise options ke saath-saath, ek long-term monthly investment retirement ke liye kitna corpus bana sakta hai iska estimate lagane ke liye SIP calculator use karte hain. Jaise, ₹10,000/month ki SIP ko 25 saal tak 12% ke assumed return pe chalayen to yeh ₹1 crore se bhi zyada ka corpus bana sakti hai — planning ke liye ek useful starting estimate." },
    { q: "Mere bank ki actual EMI ke comparison mein EMI calculator kitna accurate hai?", a: "Standard reducing-balance loans ke liye yeh kaafi close hota hai, halanki rounding, processing fees ya specific loan terms ki wajah se aapke bank ka final figure thoda alag ho sakta hai." },
    { q: "Mere bank ki EMI calculator ke result se thodi alag kyu hai?", a: "Chhote differences usually rounding conventions, exact interest compounding methods, ya aapke bank ke shamil kiye gaye additional charges se aate hain jo ek generic calculator mein nahi hote." },
    { q: "Kya main SIP vs Lumpsum ke results side by side compare kar sakta hoon?", a: "Haan, aap dono calculators same amount aur duration ke saath run karke compare kar sakte ho ki har approach aapke paise ko alag tarike se kaise bada sakta hai." },
    { q: "Long-term equity SIP ke liye kaunsi expected return assume karna reasonable hai?", a: "Kai investors planning assumption ke roop mein 10-12% p.a. ki long-term historical range use karte hain, halanki yeh guaranteed nahi hai aur actual returns saal-dar-saal vary karenge." },
    { q: "Kya mujhe short-term goals ke liye debt fund return assumption use karna chahiye?", a: "Haan, 3 saal se kam ke goals ke liye, equity jaisi growth maanne ke bajaye ek kam, zyada conservative return assumption (debt fund returns ke close) zyada realistic hai." },
    { q: "Kya yeh calculators market volatility ko account karte hain?", a: "Nahi, simplicity ke liye yeh ek smoothed average annual return use karte hain — actual investment journey mein ups and downs hote hain jinhe ek basic calculator simulate nahi karta." },
    { q: "Kya calculator results mere actual investment outcome ki guarantee dete hain?", a: "Nahi, sabhi results assumed rates pe based estimates hain — actual mutual fund, loan ya tax outcomes real market aur regulatory conditions pe depend karte hain aur kabhi guaranteed nahi hote." },
    { q: "Main kitna minimum aur maximum investment period daal sakta hoon?", a: "Zyada tar calculators ek wide range accept karte hain, kuch months se lekar kai decades tak, taaki aap short-term aur long-term dono goals model kar sako." },
    { q: "Kya main yeh calculators mobile pe use kar sakta hoon?", a: "Haan, sabhi calculators fully responsive hain aur mobile, tablet aur desktop pe smoothly kaam karte hain." },
    { q: "Kya Tax Calculator use karne ke liye mujhe apni exact salary pata honi chahiye?", a: "Ek accurate figure best estimate deta hai, par aap ek approximate income daal kar bhi dono regimes ke under apni tax liability ka rough sense le sakte ho." },
    { q: "Mujhe apne SIP ya goal projections kitni baar recalculate karne chahiye?", a: "Saal mein ek-do baar, ya kisi major income ya goal change ke baad apne numbers ko revisit karna aapke plan ko realistic aur track pe rakhta hai." },
    { q: "Kya main advisor se baat karne se pehle yeh calculators use kar sakta hoon?", a: "Haan, yeh ek self-serve starting point ke roop mein design kiye gaye hain — kai clients apne calculator results hamari pehli free consultation mein saath laate hain." },
  ],
};

const DEFAULT_SEO = {
  title: "The Financial Doctor | SIP, Tax, Loan & EMI Calculator - Free Online Tools",
  description: "Free online calculators — SIP Calculator, Income Tax Calculator, EMI/Loan Calculator, Lumpsum Calculator, SWP Calculator, GST Calculator, Goal Planner — all in one place, instant results.",
  keywords: "SIP calculator, SIP calculator online, free SIP calculator, EMI calculator, loan calculator, home loan EMI calculator, income tax calculator, income tax calculator online, lumpsum calculator, lump sum calculator, SWP calculator, systematic withdrawal plan calculator, GST calculator online, mutual fund calculator, mutual fund SIP calculator, goal based investment calculator, daily SIP calculator, step up SIP calculator, retirement calculator, inflation calculator, best SIP calculator India",
};

// Grouped into 3 real-world "tracks" instead of one flat list of 9 — how
// someone actually thinks about the question ("how do I grow money" /
// "how do I plan a payout or goal" / "what will this loan or tax actually
// cost me"), not an alphabetical or menu-order dump.
const CALC_TRACKS = [
  { key: "grow", label: "Grow your money", accent: "#024396", ids: ["sip", "daily", "lumpsum"] },
  { key: "plan", label: "Plan a goal or payout", accent: "#0F6E5C", ids: ["goal", "swp", "inflation"] },
  { key: "cost", label: "Loans & tax", accent: "#B8722E", ids: ["emi", "tax", "gst"] },
];

export default function CalculatorsPage() {
  // 1. URL parameter ko read karega (jaise 'sip', 'gst', 'loan-emi')
  const { calculatorType } = useParams();
  const activeId = calculatorType || "sip";
  const match = calcInfo.find((c) => c.id === calculatorType);
  const seo = match
    ? { title: `The Financial Doctor | ${match.title} - Free Online Tool`, description: match.description, keywords: DEFAULT_SEO.keywords }
    : DEFAULT_SEO;

  return (
    <div className="relative" data-testid="calculators-page-root">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} path={`/calculators${calculatorType ? `/${calculatorType}` : ""}`} />
      <Navbar />
      <main>
        {/* TOOL HERO — on-brand navy/gold (not an off-brand indigo dashboard
            look), still visibly distinct from every other page's hero via
            the dot-grid texture and tabular-numeral stat tiles instead of a
            photo, quote, or icon — a financial *instrument* panel, not a
            SaaS product screen. */}
        <section className="relative overflow-hidden bg-[#0E1B2C] pt-28 pb-14 md:pt-32 md:pb-16 px-6">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(rgba(216,185,138,0.25) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div
            aria-hidden
            className="fund-animate-in absolute -top-20 right-[-10%] w-[380px] h-[380px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle at center, rgba(216,185,138,0.6) 0%, transparent 65%)" }}
          />
          <div className="container-x relative grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
            <div>
              <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2A364B] bg-[#152238] text-[11px] tracking-[0.18em] uppercase text-[#D8B98A] font-semibold font-mono">
                Plan · Visualise · Act
              </div>
              <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6F1E8] mt-5 leading-tight">
                Nine calculators. <span style={{ color: "#D8B98A" }} className="font-italic-serif">Zero guesswork.</span>
              </h1>
              <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#F6F1E8]/70 text-[15px] sm:text-base max-w-xl leading-relaxed">
                SIP, Lumpsum, SWP, Goal, EMI, Tax, GST &amp; Inflation — every number below is
                computed live as you type, then exportable as a personalised proposal PDF.
              </p>
            </div>
            <div className="fund-animate-in fund-animate-in-delay-2 grid grid-cols-2 gap-3" style={{ fontVariantNumeric: "tabular-nums" }}>
              {[
                { label: "SIP, 15 yrs @ 12%", value: "₹50.4L" },
                { label: "Lumpsum, 10 yrs", value: "₹31.1L" },
                { label: "Tax saved, 80C", value: "₹46.8K" },
                { label: "Goal corpus needed", value: "₹1.2Cr" },
              ].map((s) => (
                <div key={s.label} className="bg-[#152238] border border-[#2A364B] rounded-xl p-4">
                  <div className="font-mono text-lg text-[#F6F1E8] font-semibold">{s.value}</div>
                  <div className="text-[10.5px] text-[#8FA0BD] mt-1 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <ProblemSolution
          accent="#024396"
          problem="Most people invest, borrow, or plan a goal based on a rough guess — 'SIP for 10 years should be enough' — without ever running the actual numbers, then get an unpleasant surprise years later."
          solution="Nine free calculators compute the real math instantly — exact corpus, exact EMI, exact tax saved — so every decision is based on numbers you've actually seen, not a guess."
        />

        {/* "PICK A CALCULATOR" CHOOSER — grouped into 3 real-world tracks
            (grow / plan / cost) instead of one flat 9-item grid, each track
            with its own accent-coloured left rail so the grouping reads at
            a glance. Every row is still a real link to that calculator's
            URL (routes into the same Calculators widget below via its
            activeType prop) — this replaced a decorative reference list
            that used to sit after the tool with something that both
            explains AND leads straight into each calculator. */}
        <section className="bg-[#FBF7EE] py-14 md:py-16 px-6">
          <div className="container-x max-w-5xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl text-[#0E1B2C] mb-2 text-center">
              Which calculator do you need?
            </h2>
            <p className="text-[#2A364B]/70 text-center max-w-xl mx-auto mb-10 text-sm">
              Grouped by what you're actually trying to do — tap one to jump straight in below.
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {CALC_TRACKS.map((track) => (
                <div key={track.key} className="bg-white rounded-2xl border border-[#E2D8C2] overflow-hidden">
                  <div
                    className="px-5 py-3 text-[11px] uppercase tracking-[0.16em] font-semibold border-b"
                    style={{ color: track.accent, background: `${track.accent}0D`, borderColor: `${track.accent}33` }}
                  >
                    {track.label}
                  </div>
                  <div className="divide-y divide-[#E2D8C2]">
                    {track.ids.map((id) => {
                      const c = calcInfo.find((x) => x.id === id);
                      const isActive = id === activeId;
                      return (
                        <Link
                          key={id}
                          to={`/calculators/${id}`}
                          className={`flex items-start justify-between gap-3 px-5 py-4 transition-colors ${isActive ? "bg-[#F6F1E8]" : "hover:bg-[#FBF7EE]"}`}
                        >
                          <div>
                            <h3 className="font-display text-[15px] text-[#0E1B2C]">{c.title}</h3>
                            <p className="text-[12.5px] text-[#2A364B]/70 leading-relaxed mt-1">{c.text}</p>
                          </div>
                          <ArrowRight size={14} className="shrink-0 mt-1" style={{ color: track.accent }} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Calculators variant="public" activeType={calculatorType} hideHeading />

        <div className="flex justify-center pt-10">
          <LanguageToggle />
        </div>

        <p className="text-xs text-[#2A364B]/60 text-center mt-10 px-6">
          Note: These calculators provide estimates based on assumed rates of
          return and are meant for planning purposes only, not guaranteed returns.
        </p>

        <FAQSection title="Calculators — Frequently Asked Questions" data={calcFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
