import React from "react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import TopFunds from "@/components/TopFunds";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";
import ProblemSolution from "@/components/ProblemSolution";
import CompareFunds from "@/components/CompareFunds";

// `risk` is a rough, editorial 0-100 positioning (not a data feed) used only
// to place each category along the spectrum band below — Debt lowest,
// Mid/Small Cap highest, matching the descriptive copy already on the page.
const categories = [
  { title: "Debt Funds", text: "Lower-risk funds investing in bonds and fixed-income instruments — suited for short-term goals and capital preservation.", risk: 12 },
  { title: "Hybrid Funds", text: "A mix of equity and debt to balance growth potential with relative stability.", risk: 38 },
  { title: "Large Cap Funds", text: "Invest in well-established, financially strong companies. Lower volatility, suited for conservative long-term investors.", risk: 55 },
  { title: "Flexi Cap & Multi Cap Funds", text: "Diversified across market caps, giving fund managers flexibility to shift allocation based on market conditions.", risk: 68 },
  { title: "ELSS (Tax Saving) Funds", text: "Equity funds with a 3-year lock-in that also qualify for tax deduction under Section 80C.", risk: 78 },
  { title: "Mid & Small Cap Funds", text: "Higher growth potential from emerging companies, but with higher volatility — best for longer investment horizons.", risk: 92 },
];

function riskColor(risk) {
  if (risk < 30) return "#22C55E";
  if (risk < 60) return "#D9B15C";
  return "#C7102E";
}
function riskLabel(risk) {
  if (risk < 30) return "Lower risk";
  if (risk < 60) return "Moderate risk";
  return "Higher risk";
}

export const fundsFAQ = {
  en: [
    { q: "How do you select the 'top' funds shown here?", a: "We shortlist funds based on consistency of returns, fund manager track record, expense ratio, and how well they fit common investor goals. For example, a fund with steady 3Y and 5Y CAGR and a below-category-average expense ratio would rank ahead of one with a single stand-out year followed by inconsistent performance." },
    { q: "Should I always pick the fund with the highest returns?", a: "No — past returns don't guarantee future performance. Risk level, consistency, and your own goal matter just as much. For example, a fund that topped the charts last year could easily rank average or below this year once market conditions shift." },
    { q: "What does expense ratio mean?", a: "It's the annual fee charged by the fund house to manage your money, expressed as a percentage of your investment. For example, a 1.5% expense ratio on a ₹5 lakh investment works out to roughly ₹7,500 a year charged by the fund, regardless of how the fund performs." },
    { q: "Can I compare funds across categories?", a: "Yes, but comparing a small cap fund to a debt fund isn't apples-to-apples — it's better to compare within the same category." },
    { q: "How often should I review my fund picks?", a: "A review every 6-12 months is usually enough, unless there's a major life change or consistent underperformance." },
    { q: "What is CAGR and how is it calculated on this page?", a: "CAGR (Compound Annual Growth Rate) shows the smoothed annual return over a period, calculated from a fund's actual historical NAV data via AMFI, not estimated. For example, an investment that grew from ₹1 lakh to ₹1.76 lakh over 5 years works out to roughly a 12% CAGR." },
    { q: "Is the CAGR shown here the same as guaranteed future returns?", a: "No, CAGR reflects past performance only — it's a useful reference point, but mutual fund returns are market-linked and never guaranteed." },
    { q: "What is a Large Cap fund?", a: "Large cap funds invest in well-established, financially strong companies, offering relatively lower volatility, suited for conservative long-term investors." },
    { q: "What is a Mid Cap fund?", a: "Mid cap funds invest in medium-sized companies with higher growth potential than large caps, but with correspondingly higher volatility." },
    { q: "What is a Small Cap fund?", a: "Small cap funds invest in smaller, emerging companies offering the highest growth potential among equity categories, along with the highest volatility and risk." },
    { q: "What is a Flexi Cap fund?", a: "A Flexi Cap fund can invest across large, mid, and small cap companies without any fixed allocation limit, giving the fund manager flexibility based on market conditions." },
    { q: "What is a Multi Cap fund?", a: "A Multi Cap fund is required to hold a minimum allocation across large, mid, and small caps, ensuring diversification across market capitalisation by mandate." },
    { q: "What's the difference between Flexi Cap and Multi Cap funds?", a: "Flexi Cap gives the fund manager full discretion on allocation across market caps, while Multi Cap mandates minimum fixed allocations to each of large, mid, and small cap." },
    { q: "What is an ELSS fund and why is it on this page?", a: "ELSS (Equity Linked Savings Scheme) is an equity fund with a 3-year lock-in that also qualifies for tax deduction under Section 80C — we track it here since it's a popular top-performing category too." },
    { q: "What is a Debt fund?", a: "Debt funds invest in bonds and fixed-income instruments, offering relatively lower risk and more stability, suited for short-term goals and capital preservation." },
    { q: "What is a Hybrid fund?", a: "Hybrid funds mix equity and debt in varying proportions to balance growth potential with relative stability, suited for moderate risk-takers." },
    { q: "Which fund category is best for a first-time investor?", a: "Large cap or hybrid funds are often a gentler starting point, though the right choice depends on your goal, time horizon, and comfort with volatility." },
    { q: "Which fund category is best for a long-term goal like retirement?", a: "Equity categories like flexi cap or multi cap are commonly used for long-term goals (10+ years) given their higher growth potential over long horizons." },
    { q: "Which fund category is best for a short-term goal (under 3 years)?", a: "Debt funds are generally more suitable for short-term goals since they carry lower volatility than equity categories." },
    { q: "How many funds do you track on this page?", a: "We track 15+ funds across 5 major categories, with data sourced live from AMFI's official NAV feed." },
    { q: "Where does the fund data on this page come from?", a: "Returns and NAV data are pulled from AMFI's official feed, not estimates or sample figures, so the numbers reflect actual historical performance." },
    { q: "Can I compare up to 3 funds side by side?", a: "Yes, our Compare Funds tool lets you place up to 3 funds side by side to compare their returns, expense ratio, and category." },
    { q: "What is 1Y, 3Y, and 5Y CAGR?", a: "These show the compound annual growth rate over the trailing 1 year, 3 years, and 5 years respectively, giving a sense of performance across different time horizons. For example, a fund might show a strong 25% 1Y return during a market rally but a steadier 13% 5Y CAGR once short-term swings are averaged out." },
    { q: "Why does a fund's 1-year return look very different from its 5-year return?", a: "Short-term returns (1Y) are more affected by recent market swings, while longer periods (5Y) smooth out volatility and better reflect a fund's consistency. For instance, a fund that had an exceptional year could show a high 1Y figure while its 5Y CAGR stays much closer to the category average." },
    { q: "Do you recommend investing based only on this page's data?", a: "This page is a research starting point — for a recommendation matched to your goals and risk profile, we suggest a free consultation with our team." },
    { q: "Is a higher expense ratio always bad?", a: "Not necessarily — a slightly higher expense ratio can be worthwhile if the fund consistently delivers strong risk-adjusted returns, but it's one factor among several to weigh. For example, a fund charging 1.8% but consistently beating its category average may still work out better than a 1% fund with weaker, inconsistent returns." },
    { q: "What's a typical expense ratio range for equity mutual funds?", a: "Regular Plan equity fund expense ratios commonly range from about 1% to 2.25%, varying by fund size, category, and AMC." },
    { q: "Does expense ratio differ between Direct and Regular Plans?", a: "Yes, Direct Plans have a lower expense ratio since no distributor commission is included; Regular Plans, which we offer, bundle in advisory service and support. For example, a 0.5-0.7% expense ratio gap on a ₹5 lakh investment works out to roughly ₹2,500-3,500 a year — the cost of the ongoing guidance that comes with a Regular Plan." },
    { q: "How do I know if a fund is underperforming its category?", a: "Compare its CAGR against the category average and similar peer funds over the same period — consistent, meaningful underperformance across multiple years is a signal worth discussing with us. For example, a large cap fund trailing its category average by 2%+ for three years running is worth a closer look, versus a single weak quarter." },
    { q: "Can past top-performing funds become poor performers later?", a: "Yes, fund performance can shift due to manager changes, market cycle shifts, or category dynamics — that's why we recommend periodic reviews rather than a one-time pick." },
    { q: "Should I invest in a fund just because it's shown as 'top' here?", a: "No, use this page as a starting reference — the right fund for you depends on your specific goals, risk appetite, and existing portfolio, which we help assess." },
    { q: "What is fund manager track record and why does it matter?", a: "It's the fund manager's history of performance across market cycles — a consistent, experienced manager is generally a positive signal, though not a guarantee of future results." },
    { q: "Are these top funds available for SIP or only lumpsum investment?", a: "Nearly all funds shown here support both SIP and lumpsum investment routes." },
    { q: "Do the returns shown account for exit load or taxes?", a: "No, displayed CAGR is a pre-tax, pre-exit-load figure — actual take-home returns depend on your holding period, applicable exit load, and capital gains tax. For example, redeeming an equity fund within a year could attract a 1% exit load plus short-term capital gains tax, reducing your actual take-home compared to the headline CAGR." },
    { q: "How is a fund's category assigned — who decides it's 'large cap' or 'mid cap'?", a: "Categories follow SEBI's official mutual fund categorisation norms, which define market-cap ranges for large, mid, and small cap classification." },
    { q: "Can a fund's category change over time?", a: "Rarely, but a fund can be reclassified if SEBI updates categorisation thresholds or if the AMC repositions the scheme — we reflect the currently applicable category." },
    { q: "What's the risk difference between large cap and small cap funds?", a: "Small cap funds are meaningfully more volatile — bigger potential upside but also bigger potential drawdowns — compared to the relatively steadier large cap category. For example, in a sharp market correction, a small cap fund might fall considerably more than a large cap fund, even if both are in the same overall market downturn." },
    { q: "Is it better to invest in one fund or diversify across several?", a: "Most investors benefit from a small, diversified mix across categories aligned to different goals rather than concentrating in a single fund." },
    { q: "How do I decide the right asset allocation between equity and debt?", a: "It depends on your goal's time horizon and your risk tolerance — longer horizons generally support a higher equity tilt, and we help you work out the right mix." },
    { q: "Can I switch out of a fund shown here if it underperforms?", a: "Yes, mutual fund units (outside ELSS lock-in) can be redeemed or switched, though exit load and capital gains tax implications should be checked first." },
    { q: "What is NAV and how does it relate to returns?", a: "NAV (Net Asset Value) is the per-unit price of a mutual fund; CAGR is calculated from the change in NAV over the given time period. For example, if a fund's NAV moved from ₹20 to ₹35 over 5 years, that works out to a CAGR of roughly 12%." },
    { q: "Why do two funds in the same category show different returns?", a: "Differences in stock selection, sector weighting, cash levels, and fund manager decisions all lead to performance differences even within the same category." },
    { q: "Do you update the fund data on this page regularly?", a: "Yes, NAV and return figures are pulled live from AMFI's feed, so the data reflects current values rather than a static snapshot." },
    { q: "Is investing in a top-rated fund from this page risk-free?", a: "No, mutual fund investments are subject to market risks — no fund, regardless of past ranking, is risk-free or return-guaranteed." },
    { q: "What should I look at besides returns before choosing a fund?", a: "Expense ratio, fund manager tenure, portfolio concentration, category fit for your goal, and consistency of performance across market cycles all matter alongside returns." },
    { q: "Are ELSS funds riskier than other equity categories because of the lock-in?", a: "The lock-in itself doesn't add investment risk — ELSS funds carry similar market risk to other diversified equity funds, with the added constraint that you can't redeem for 3 years." },
    { q: "Can I use the Compare Funds tool without creating an account?", a: "Yes, the Compare Funds tool is free to use instantly with no login required." },
    { q: "How do I decide between two similar-looking top funds?", a: "Look beyond headline returns to expense ratio, consistency across 1Y/3Y/5Y, and portfolio composition — or bring both options to a free consultation for a comparative view." },
    { q: "Does past performance shown here predict what will happen going forward?", a: "No — as stated in scheme documents industry-wide, past performance is not indicative of future returns; it's one input among several for decision-making." },
    { q: "How do I get a personalised fund recommendation instead of just browsing this page?", a: "Book a free consultation with our team — we assess your goals, risk profile, and time horizon before suggesting specific funds suited to you." },
  ],
  hi: [
    { q: "यहाँ दिखाए गए 'टॉप' फंड्स कैसे चुने जाते हैं?", a: "हम फंड्स को रिटर्न की निरंतरता, फंड मैनेजर के ट्रैक रिकॉर्ड, एक्सपेंस रेशियो और निवेशक के गोल के हिसाब से शॉर्टलिस्ट करते हैं। उदाहरण के लिए, स्थिर 3Y और 5Y CAGR वाला और कैटेगरी-औसत से कम एक्सपेंस रेशियो वाला फंड, सिर्फ एक शानदार साल के बाद अस्थिर परफॉरमेंस वाले फंड से आगे रैंक करेगा।" },
    { q: "क्या मुझे हमेशा सबसे ज्यादा रिटर्न वाला फंड चुनना चाहिए?", a: "नहीं — पुराना रिटर्न भविष्य की गारंटी नहीं देता। रिस्क लेवल और निरंतरता भी उतनी ही महत्वपूर्ण है। उदाहरण के लिए, पिछले साल टॉप रहा कोई फंड मार्केट कंडीशन बदलने पर इस साल आसानी से एवरेज या उससे कम रैंक कर सकता है।" },
    { q: "एक्सपेंस रेशियो का मतलब क्या है?", a: "यह वह सालाना फीस है जो फंड हाउस आपके पैसे को मैनेज करने के लिए लेता है, आपके निवेश के प्रतिशत के रूप में। उदाहरण के लिए, ₹5 लाख के निवेश पर 1.5% का एक्सपेंस रेशियो फंड द्वारा हर साल लगभग ₹7,500 का चार्ज बनता है, चाहे फंड का परफॉरमेंस कैसा भी हो।" },
    { q: "क्या मैं अलग-अलग कैटेगरी के फंड्स compare कर सकता हूँ?", a: "हाँ, लेकिन स्मॉल कैप और डेट फंड की तुलना करना सही नहीं है — एक ही कैटेगरी में compare करना बेहतर है।" },
    { q: "मुझे अपने फंड्स कितनी बार review करना चाहिए?", a: "हर 6-12 महीने में review करना काफी है, जब तक कोई बड़ा बदलाव या लगातार खराब परफॉरमेंस न हो।" },
    { q: "CAGR क्या है और इस पेज पर कैसे कैलकुलेट किया जाता है?", a: "CAGR (Compound Annual Growth Rate) एक निश्चित अवधि में स्मूथ्ड सालाना रिटर्न दिखाता है, जो AMFI के जरिए फंड के असली हिस्टोरिकल NAV डेटा से कैलकुलेट किया जाता है, अनुमानित नहीं। उदाहरण के लिए, ₹1 लाख से ₹1.76 लाख तक 5 साल में बढ़ा कोई निवेश लगभग 12% CAGR के बराबर होता है।" },
    { q: "क्या यहाँ दिखाया गया CAGR भविष्य के गारंटीड रिटर्न के बराबर है?", a: "नहीं, CAGR सिर्फ पिछली परफॉरमेंस दिखाता है — यह एक उपयोगी रेफरेंस पॉइंट है, पर म्यूचुअल फंड रिटर्न मार्केट-लिंक्ड होते हैं और कभी गारंटीड नहीं होते।" },
    { q: "Large Cap फंड क्या है?", a: "Large cap फंड्स स्थापित, आर्थिक रूप से मजबूत कंपनियों में निवेश करते हैं, अपेक्षाकृत कम वोलैटिलिटी के साथ, कंजर्वेटिव लॉन्ग-टर्म निवेशकों के लिए उपयुक्त।" },
    { q: "Mid Cap फंड क्या है?", a: "Mid cap फंड्स मीडियम साइज की कंपनियों में निवेश करते हैं जिनकी ग्रोथ पोटेंशियल large caps से ज्यादा है, पर उसी अनुपात में वोलैटिलिटी भी ज्यादा होती है।" },
    { q: "Small Cap फंड क्या है?", a: "Small cap फंड्स छोटी, उभरती कंपनियों में निवेश करते हैं जो इक्विटी कैटेगरी में सबसे ज्यादा ग्रोथ पोटेंशियल देती हैं, साथ में सबसे ज्यादा वोलैटिलिटी और रिस्क भी।" },
    { q: "Flexi Cap फंड क्या है?", a: "Flexi Cap फंड बिना किसी फिक्स्ड एलोकेशन लिमिट के large, mid और small cap कंपनियों में निवेश कर सकता है, जिससे फंड मैनेजर को मार्केट कंडीशन के हिसाब से फ्लेक्सिबिलिटी मिलती है।" },
    { q: "Multi Cap फंड क्या है?", a: "Multi Cap फंड को large, mid और small caps में न्यूनतम एलोकेशन रखना जरूरी होता है, जिससे मैंडेट के तहत मार्केट कैपिटलाइजेशन में डायवर्सिफिकेशन सुनिश्चित होता है।" },
    { q: "Flexi Cap और Multi Cap फंड में क्या फर्क है?", a: "Flexi Cap फंड मैनेजर को मार्केट कैप के बीच एलोकेशन पर पूरी छूट देता है, जबकि Multi Cap large, mid और small cap हर एक में न्यूनतम फिक्स्ड एलोकेशन अनिवार्य करता है।" },
    { q: "ELSS फंड क्या है और यह इस पेज पर क्यों है?", a: "ELSS (Equity Linked Savings Scheme) एक इक्विटी फंड है जिसका 3 साल का लॉक-इन होता है और यह Section 80C के तहत टैक्स डिडक्शन के लिए भी योग्य है — हम इसे यहाँ इसलिए ट्रैक करते हैं क्योंकि यह भी एक लोकप्रिय टॉप-परफॉर्मिंग कैटेगरी है।" },
    { q: "Debt फंड क्या है?", a: "Debt फंड्स बॉन्ड्स और फिक्स्ड-इनकम इंस्ट्रूमेंट्स में निवेश करते हैं, अपेक्षाकृत कम रिस्क और ज्यादा स्थिरता देते हुए, शॉर्ट-टर्म गोल्स और कैपिटल प्रिजर्वेशन के लिए उपयुक्त।" },
    { q: "Hybrid फंड क्या है?", a: "Hybrid फंड्स इक्विटी और डेट को अलग-अलग अनुपात में मिलाते हैं ताकि ग्रोथ पोटेंशियल और अपेक्षाकृत स्थिरता के बीच बैलेंस बना रहे, मॉडरेट रिस्क लेने वालों के लिए उपयुक्त।" },
    { q: "पहली बार निवेश करने वाले के लिए कौन सी फंड कैटेगरी सबसे अच्छी है?", a: "Large cap या hybrid फंड्स अक्सर एक आसान शुरुआती बिंदु होते हैं, हालांकि सही चुनाव आपके गोल, समय सीमा और वोलैटिलिटी के प्रति सहजता पर निर्भर करता है।" },
    { q: "रिटायरमेंट जैसे लॉन्ग-टर्म गोल के लिए कौन सी फंड कैटेगरी सबसे अच्छी है?", a: "flexi cap या multi cap जैसी इक्विटी कैटेगरी अक्सर लॉन्ग-टर्म गोल्स (10+ साल) के लिए इस्तेमाल होती हैं क्योंकि इनकी लंबे समय में ग्रोथ पोटेंशियल ज्यादा होती है।" },
    { q: "शॉर्ट-टर्म गोल (3 साल से कम) के लिए कौन सी फंड कैटेगरी सबसे अच्छी है?", a: "Debt फंड्स आमतौर पर शॉर्ट-टर्म गोल्स के लिए ज्यादा उपयुक्त होते हैं क्योंकि इनमें इक्विटी कैटेगरी की तुलना में कम वोलैटिलिटी होती है।" },
    { q: "इस पेज पर आप कितने फंड्स ट्रैक करते हैं?", a: "हम 5 मुख्य कैटेगरी में 15+ फंड्स ट्रैक करते हैं, जिनका डेटा AMFI के ऑफिशियल NAV फीड से लाइव लिया जाता है।" },
    { q: "इस पेज पर फंड डेटा कहाँ से आता है?", a: "रिटर्न और NAV डेटा AMFI के ऑफिशियल फीड से लिया जाता है, न कि अनुमान या सैंपल आंकड़ों से, इसलिए नंबर असली हिस्टोरिकल परफॉरमेंस दिखाते हैं।" },
    { q: "क्या मैं 3 फंड्स तक साथ-साथ compare कर सकता हूं?", a: "हाँ, हमारा Compare Funds टूल आपको उनके रिटर्न, एक्सपेंस रेशियो और कैटेगरी compare करने के लिए 3 फंड्स तक साथ-साथ रखने देता है।" },
    { q: "1Y, 3Y और 5Y CAGR क्या है?", a: "ये क्रमशः पिछले 1 साल, 3 साल और 5 साल में कंपाउंड सालाना ग्रोथ रेट दिखाते हैं, जो अलग-अलग समय सीमा में परफॉरमेंस का अंदाज़ा देते हैं। उदाहरण के लिए, कोई फंड मार्केट रैली के दौरान 25% का मजबूत 1Y रिटर्न दिखा सकता है पर शॉर्ट-टर्म उतार-चढ़ाव औसत होने के बाद उसका 5Y CAGR 13% जैसा ज्यादा स्थिर हो सकता है।" },
    { q: "किसी फंड का 1-साल का रिटर्न उसके 5-साल के रिटर्न से इतना अलग क्यों दिखता है?", a: "शॉर्ट-टर्म रिटर्न (1Y) हाल के मार्केट उतार-चढ़ाव से ज्यादा प्रभावित होता है, जबकि लंबी अवधि (5Y) वोलैटिलिटी को स्मूथ करती है और फंड की निरंतरता को बेहतर दिखाती है। उदाहरण के लिए, किसी शानदार साल वाले फंड का 1Y आंकड़ा ज्यादा दिख सकता है जबकि उसका 5Y CAGR कैटेगरी औसत के काफी करीब रहता है।" },
    { q: "क्या आप सिर्फ इस पेज के डेटा के आधार पर निवेश की सलाह देते हैं?", a: "यह पेज एक रिसर्च शुरुआती बिंदु है — आपके गोल्स और रिस्क प्रोफाइल से मैच करने वाली सिफारिश के लिए, हम हमारी टीम से फ्री कंसल्टेशन का सुझाव देते हैं।" },
    { q: "क्या ज्यादा एक्सपेंस रेशियो हमेशा बुरा होता है?", a: "जरूरी नहीं — अगर फंड लगातार मजबूत रिस्क-एडजस्टेड रिटर्न देता है तो थोड़ा ज्यादा एक्सपेंस रेशियो भी worthwhile हो सकता है, पर यह विचार करने योग्य कई फैक्टर्स में से एक है। उदाहरण के लिए, 1.8% चार्ज करने वाला पर अपनी कैटेगरी औसत को लगातार पीछे छोड़ने वाला फंड, 1% चार्ज करने वाले पर कमजोर, अस्थिर रिटर्न वाले फंड से बेहतर साबित हो सकता है।" },
    { q: "इक्विटी म्यूचुअल फंड के लिए एक टिपिकल एक्सपेंस रेशियो रेंज क्या है?", a: "Regular Plan इक्विटी फंड्स का एक्सपेंस रेशियो आमतौर पर लगभग 1% से 2.25% के बीच होता है, जो फंड साइज, कैटेगरी और AMC के हिसाब से अलग होता है।" },
    { q: "क्या Direct और Regular Plan में एक्सपेंस रेशियो अलग होता है?", a: "हाँ, Direct Plan का एक्सपेंस रेशियो कम होता है क्योंकि इसमें कोई डिस्ट्रीब्यूटर कमीशन शामिल नहीं होता; Regular Plan, जो हम ऑफर करते हैं, में एडवाइजरी सर्विस और सपोर्ट शामिल होता है। उदाहरण के लिए, ₹5 लाख के निवेश पर 0.5-0.7% का एक्सपेंस रेशियो फर्क लगभग ₹2,500-3,500 सालाना बनता है — यही Regular Plan के साथ मिलने वाली लगातार गाइडेंस की लागत है।" },
    { q: "मुझे कैसे पता चले कि कोई फंड अपनी कैटेगरी से कम परफॉर्म कर रहा है?", a: "उसके CAGR की तुलना कैटेगरी औसत और उसी अवधि के समान पीयर फंड्स से करें — कई सालों में लगातार, महत्वपूर्ण अंडरपरफॉरमेंस एक संकेत है जिस पर हमसे चर्चा करना उचित है। उदाहरण के लिए, लगातार तीन साल अपनी कैटेगरी औसत से 2%+ पीछे रहने वाला लार्ज कैप फंड, एक कमजोर तिमाही की तुलना में ज्यादा गौर करने लायक है।" },
    { q: "क्या पिछले टॉप-परफॉर्मिंग फंड्स बाद में खराब परफॉर्मर बन सकते हैं?", a: "हाँ, मैनेजर बदलाव, मार्केट साइकल में बदलाव या कैटेगरी डायनामिक्स की वजह से फंड परफॉरमेंस बदल सकती है — इसीलिए हम एक बार के चुनाव के बजाय पीरियोडिक रिव्यू की सलाह देते हैं।" },
    { q: "क्या मुझे सिर्फ इसलिए किसी फंड में निवेश करना चाहिए क्योंकि वह यहां 'टॉप' दिखाया गया है?", a: "नहीं, इस पेज को एक शुरुआती रेफरेंस की तरह इस्तेमाल करें — आपके लिए सही फंड आपके खास गोल्स, रिस्क एपेटाइट और मौजूदा पोर्टफोलियो पर निर्भर करता है, जिसे आंकने में हम मदद करते हैं।" },
    { q: "फंड मैनेजर ट्रैक रिकॉर्ड क्या है और यह क्यों मायने रखता है?", a: "यह मार्केट साइकल्स में फंड मैनेजर की परफॉरमेंस हिस्ट्री है — एक निरंतर, अनुभवी मैनेजर आमतौर पर एक पॉजिटिव संकेत है, हालांकि यह भविष्य के नतीजों की गारंटी नहीं है।" },
    { q: "क्या ये टॉप फंड्स SIP के लिए उपलब्ध हैं या सिर्फ लम्पसम निवेश के लिए?", a: "यहाँ दिखाए गए लगभग सभी फंड्स SIP और लम्पसम दोनों निवेश रूट को सपोर्ट करते हैं।" },
    { q: "क्या दिखाए गए रिटर्न में एग्जिट लोड या टैक्स शामिल है?", a: "नहीं, दिखाया गया CAGR एक प्री-टैक्स, प्री-एग्जिट-लोड आंकड़ा है — असली हाथ में आने वाला रिटर्न आपकी होल्डिंग पीरियड, लागू एग्जिट लोड और कैपिटल गेन टैक्स पर निर्भर करता है। उदाहरण के लिए, एक इक्विटी फंड को एक साल के अंदर रिडीम करने पर 1% एग्जिट लोड और शॉर्ट-टर्म कैपिटल गेन टैक्स लग सकता है, जिससे हेडलाइन CAGR की तुलना में असली हाथ में आने वाला रिटर्न कम हो जाता है।" },
    { q: "किसी फंड की कैटेगरी कैसे तय होती है — कौन तय करता है कि यह 'लार्ज कैप' है या 'मिड कैप'?", a: "कैटेगरी SEBI के ऑफिशियल म्यूचुअल फंड कैटेगराइजेशन नॉर्म्स को फॉलो करती हैं, जो large, mid और small cap क्लासिफिकेशन के लिए मार्केट-कैप रेंज तय करते हैं।" },
    { q: "क्या समय के साथ किसी फंड की कैटेगरी बदल सकती है?", a: "बहुत कम, पर अगर SEBI कैटेगराइजेशन थ्रेशोल्ड अपडेट करता है या AMC स्कीम को रीपोजिशन करता है तो फंड को रीक्लासिफाई किया जा सकता है — हम वर्तमान में लागू कैटेगरी दिखाते हैं।" },
    { q: "Large cap और small cap फंड्स में रिस्क का फर्क क्या है?", a: "Small cap फंड्स काफी ज्यादा वोलैटाइल होते हैं — ज्यादा संभावित अपसाइड पर ज्यादा संभावित गिरावट भी — अपेक्षाकृत स्थिर large cap कैटेगरी की तुलना में। उदाहरण के लिए, किसी तेज मार्केट करेक्शन में, small cap फंड large cap फंड से काफी ज्यादा गिर सकता है, भले ही दोनों एक ही ओवरऑल मार्केट डाउनटर्न में हों।" },
    { q: "क्या एक फंड में निवेश करना बेहतर है या कई में डायवर्सिफाई करना?", a: "ज्यादातर निवेशकों को अलग-अलग गोल्स से जुड़ी कैटेगरीज में एक छोटे, डायवर्सिफाइड मिश्रण से फायदा होता है, न कि किसी एक फंड में सब कुछ लगाने से।" },
    { q: "मैं इक्विटी और डेट के बीच सही एसेट एलोकेशन कैसे तय करूं?", a: "यह आपके गोल की समय सीमा और आपकी रिस्क टॉलरेंस पर निर्भर करता है — लंबी समय सीमा आमतौर पर ज्यादा इक्विटी झुकाव को सपोर्ट करती है, और हम सही मिश्रण तय करने में मदद करते हैं।" },
    { q: "अगर यहाँ दिखाया गया कोई फंड अंडरपरफॉर्म करे तो क्या मैं उससे बाहर निकल सकता हूं?", a: "हाँ, म्यूचुअल फंड यूनिट्स (ELSS लॉक-इन के बाहर) रिडीम या स्विच किए जा सकते हैं, हालांकि एग्जिट लोड और कैपिटल गेन टैक्स के असर पहले चेक कर लेने चाहिए।" },
    { q: "NAV क्या है और यह रिटर्न से कैसे जुड़ा है?", a: "NAV (Net Asset Value) एक म्यूचुअल फंड की प्रति-यूनिट कीमत है; CAGR दी गई समय अवधि में NAV में बदलाव से कैलकुलेट किया जाता है। उदाहरण के लिए, अगर किसी फंड का NAV 5 साल में ₹20 से ₹35 तक पहुंचा हो, तो यह लगभग 12% के CAGR के बराबर होता है।" },
    { q: "एक ही कैटेगरी के दो फंड्स अलग रिटर्न क्यों दिखाते हैं?", a: "स्टॉक सिलेक्शन, सेक्टर वेटिंग, कैश लेवल और फंड मैनेजर के फैसलों में फर्क, यह सब एक ही कैटेगरी में भी परफॉरमेंस में फर्क ला सकते हैं।" },
    { q: "क्या आप इस पेज पर फंड डेटा नियमित रूप से अपडेट करते हैं?", a: "हाँ, NAV और रिटर्न के आंकड़े AMFI के फीड से लाइव लिए जाते हैं, इसलिए डेटा एक स्टैटिक स्नैपशॉट के बजाय मौजूदा वैल्यू दिखाता है।" },
    { q: "क्या इस पेज पर टॉप-रेटेड फंड में निवेश करना रिस्क-फ्री है?", a: "नहीं, म्यूचुअल फंड निवेश मार्केट रिस्क के अधीन हैं — पिछली रैंकिंग चाहे जो भी हो, कोई भी फंड रिस्क-फ्री या रिटर्न-गारंटीड नहीं है।" },
    { q: "फंड चुनने से पहले रिटर्न के अलावा मुझे और क्या देखना चाहिए?", a: "एक्सपेंस रेशियो, फंड मैनेजर का कार्यकाल, पोर्टफोलियो कंसंट्रेशन, आपके गोल के लिए कैटेगरी फिट, और मार्केट साइकल्स में परफॉरमेंस की निरंतरता — यह सब रिटर्न के साथ मायने रखते हैं।" },
    { q: "क्या लॉक-इन की वजह से ELSS फंड्स दूसरी इक्विटी कैटेगरी से ज्यादा रिस्की हैं?", a: "लॉक-इन खुद कोई अतिरिक्त निवेश रिस्क नहीं जोड़ता — ELSS फंड्स में दूसरे डायवर्सिफाइड इक्विटी फंड्स जैसा ही मार्केट रिस्क होता है, बस अतिरिक्त शर्त यह है कि आप 3 साल तक रिडीम नहीं कर सकते।" },
    { q: "क्या मैं बिना अकाउंट बनाए Compare Funds टूल इस्तेमाल कर सकता हूं?", a: "हाँ, Compare Funds टूल बिना किसी लॉगिन के तुरंत फ्री इस्तेमाल किया जा सकता है।" },
    { q: "मैं दो समान दिखने वाले टॉप फंड्स के बीच कैसे तय करूं?", a: "हेडलाइन रिटर्न से आगे बढ़कर एक्सपेंस रेशियो, 1Y/3Y/5Y में निरंतरता, और पोर्टफोलियो कंपोजिशन देखें — या दोनों ऑप्शन को कंपेरेटिव व्यू के लिए फ्री कंसल्टेशन में लाएं।" },
    { q: "क्या यहाँ दिखाई गई पिछली परफॉरमेंस बताती है कि आगे क्या होगा?", a: "नहीं — जैसा कि इंडस्ट्री-वाइड स्कीम डॉक्यूमेंट्स में कहा जाता है, पिछली परफॉरमेंस भविष्य के रिटर्न का संकेत नहीं है; यह फैसला लेने के लिए कई इनपुट में से एक है।" },
    { q: "सिर्फ इस पेज को ब्राउज़ करने के बजाय मुझे पर्सनलाइज्ड फंड सिफारिश कैसे मिले?", a: "हमारी टीम से फ्री कंसल्टेशन बुक करें — हम आपको सूट करने वाले खास फंड्स सुझाने से पहले आपके गोल्स, रिस्क प्रोफाइल और समय सीमा का आकलन करते हैं।" },
  ],
  hinglish: [
    { q: "Yaha dikhaye gaye 'top' funds kaise select kiye jaate hain?", a: "Hum funds ko returns ki consistency, fund manager ke track record, expense ratio aur investor goals ke hisaab se shortlist karte hain. Jaise, stable 3Y aur 5Y CAGR wala aur category-average se kam expense ratio wala fund, sirf ek shandaar saal ke baad inconsistent performance wale fund se aage rank karega." },
    { q: "Kya mujhe hamesha highest return wala fund choose karna chahiye?", a: "Nahi — past returns future performance guarantee nahi karte. Risk level aur consistency bhi equally important hai. Jaise, pichhle saal top raha koi fund market condition badalne pe is saal easily average ya usse kam rank kar sakta hai." },
    { q: "Expense ratio ka matlab kya hota hai?", a: "Yeh wo annual fee hai jo fund house aapke paise manage karne ke liye charge karta hai, aapke investment ke percentage mein. Jaise, ₹5 lakh ke investment pe 1.5% ka expense ratio fund dwara har saal lagbhag ₹7,500 ka charge banta hai, chahe fund ka performance kaisa bhi ho." },
    { q: "Kya main different category ke funds compare kar sakta hoon?", a: "Haan, lekin small cap aur debt fund ko compare karna fair nahi hai — same category mein compare karna better hai." },
    { q: "Mujhe apne funds kitni baar review karna chahiye?", a: "Har 6-12 mahine mein review karna kaafi hai, jab tak koi bada life change ya consistent underperformance na ho." },
    { q: "CAGR kya hai aur is page pe kaise calculate hota hai?", a: "CAGR (Compound Annual Growth Rate) ek period mein smoothed annual return dikhata hai, jo AMFI ke through fund ke actual historical NAV data se calculate hota hai, estimated nahi. Jaise, ₹1 lakh se ₹1.76 lakh tak 5 saal mein badha koi investment lagbhag 12% CAGR ke barabar hota hai." },
    { q: "Kya yaha dikhaya gaya CAGR future guaranteed returns ke barabar hai?", a: "Nahi, CAGR sirf past performance dikhata hai — yeh ek useful reference point hai, par mutual fund returns market-linked hote hain aur kabhi guaranteed nahi hote." },
    { q: "Large Cap fund kya hai?", a: "Large cap funds established, financially strong companies mein invest karte hain, relatively kam volatility ke saath, conservative long-term investors ke liye suited." },
    { q: "Mid Cap fund kya hai?", a: "Mid cap funds medium size ki companies mein invest karte hain jinki growth potential large caps se zyada hai, par usi proportion mein volatility bhi zyada hoti hai." },
    { q: "Small Cap fund kya hai?", a: "Small cap funds chhoti, emerging companies mein invest karte hain jo equity category mein sabse zyada growth potential deti hain, saath mein sabse zyada volatility aur risk bhi." },
    { q: "Flexi Cap fund kya hai?", a: "Flexi Cap fund bina kisi fixed allocation limit ke large, mid aur small cap companies mein invest kar sakta hai, jisse fund manager ko market condition ke hisaab se flexibility milti hai." },
    { q: "Multi Cap fund kya hai?", a: "Multi Cap fund ko large, mid aur small caps mein minimum allocation rakhna zaroori hota hai, jisse mandate ke under market capitalisation mein diversification ensure hoti hai." },
    { q: "Flexi Cap aur Multi Cap fund mein kya farak hai?", a: "Flexi Cap fund manager ko market cap ke beech allocation pe puri chhoot deta hai, jabki Multi Cap large, mid aur small cap har ek mein minimum fixed allocation mandatory karta hai." },
    { q: "ELSS fund kya hai aur yeh is page pe kyu hai?", a: "ELSS (Equity Linked Savings Scheme) ek equity fund hai jiska 3 saal ka lock-in hota hai aur yeh Section 80C ke under tax deduction ke liye bhi qualify karta hai — hum ise yaha isliye track karte hain kyunki yeh bhi ek popular top-performing category hai." },
    { q: "Debt fund kya hai?", a: "Debt funds bonds aur fixed-income instruments mein invest karte hain, relatively kam risk aur zyada stability dete hue, short-term goals aur capital preservation ke liye suited." },
    { q: "Hybrid fund kya hai?", a: "Hybrid funds equity aur debt ko alag-alag proportion mein mix karte hain taaki growth potential aur relative stability ke beech balance bane, moderate risk lene walon ke liye suited." },
    { q: "Pehli baar invest karne wale ke liye kaunsi fund category sabse best hai?", a: "Large cap ya hybrid funds often ek aasan starting point hote hain, halanki sahi choice aapke goal, time horizon aur volatility ke prati comfort pe depend karti hai." },
    { q: "Retirement jaise long-term goal ke liye kaunsi fund category best hai?", a: "flexi cap ya multi cap jaisi equity categories often long-term goals (10+ saal) ke liye use hoti hain kyunki inki lambe time mein growth potential zyada hoti hai." },
    { q: "Short-term goal (3 saal se kam) ke liye kaunsi fund category best hai?", a: "Debt funds usually short-term goals ke liye zyada suitable hote hain kyunki inme equity category ke comparison mein kam volatility hoti hai." },
    { q: "Is page pe aap kitne funds track karte ho?", a: "Hum 5 major categories mein 15+ funds track karte hain, jinka data AMFI ke official NAV feed se live liya jaata hai." },
    { q: "Is page pe fund data kaha se aata hai?", a: "Returns aur NAV data AMFI ke official feed se liya jaata hai, na ki estimate ya sample figures se, isliye numbers actual historical performance dikhate hain." },
    { q: "Kya main 3 funds tak saath-saath compare kar sakta hoon?", a: "Haan, hamara Compare Funds tool aapko unke returns, expense ratio aur category compare karne ke liye 3 funds tak saath-saath rakhne deta hai." },
    { q: "1Y, 3Y aur 5Y CAGR kya hai?", a: "Yeh respectively pichhle 1 saal, 3 saal aur 5 saal mein compound annual growth rate dikhate hain, jo different time horizons mein performance ka idea dete hain. Jaise, koi fund market rally ke dauran 25% ka strong 1Y return dikha sakta hai par short-term swings average hone ke baad uska 5Y CAGR 13% jaisa zyada stable ho sakta hai." },
    { q: "Kisi fund ka 1-saal ka return uske 5-saal ke return se itna alag kyu dikhta hai?", a: "Short-term returns (1Y) recent market swings se zyada affected hote hain, jabki longer periods (5Y) volatility ko smooth karte hain aur fund ki consistency ko behtar dikhate hain. Jaise, kisi shandaar saal wale fund ka 1Y figure zyada dikh sakta hai jabki uska 5Y CAGR category average ke kaafi kareeb rehta hai." },
    { q: "Kya aap sirf is page ke data ke basis pe invest karne ki advice dete ho?", a: "Yeh page ek research starting point hai — aapke goals aur risk profile se match karne wali recommendation ke liye, hum hamari team se free consultation suggest karte hain." },
    { q: "Kya zyada expense ratio hamesha bura hota hai?", a: "Zaroori nahi — agar fund consistently strong risk-adjusted returns deta hai to thoda zyada expense ratio bhi worthwhile ho sakta hai, par yeh consider karne layak kai factors mein se ek hai. Jaise, 1.8% charge karne wala par apni category average ko consistently peeche chhodne wala fund, 1% charge karne wale par weak, inconsistent returns wale fund se better prove ho sakta hai." },
    { q: "Equity mutual funds ke liye ek typical expense ratio range kya hai?", a: "Regular Plan equity funds ka expense ratio usually lagbhag 1% se 2.25% ke beech hota hai, jo fund size, category aur AMC ke hisaab se alag hota hai." },
    { q: "Kya Direct aur Regular Plan mein expense ratio alag hota hai?", a: "Haan, Direct Plan ka expense ratio kam hota hai kyunki ismein koi distributor commission included nahi hota; Regular Plan, jo hum offer karte hain, mein advisory service aur support included hota hai. Jaise, ₹5 lakh ke investment pe 0.5-0.7% ka expense ratio gap lagbhag ₹2,500-3,500 saalana banta hai — yehi Regular Plan ke saath milne wali ongoing guidance ki cost hai." },
    { q: "Mujhe kaise pata chale ki koi fund apni category se kam perform kar raha hai?", a: "Uske CAGR ki comparison category average aur usi period ke similar peer funds se karo — kai saalon mein consistent, meaningful underperformance ek signal hai jispe humse discuss karna theek rahega. Jaise, lagatar teen saal apni category average se 2%+ peeche rehne wala large cap fund, ek weak quarter ke comparison mein zyada dhyaan dene layak hai." },
    { q: "Kya past top-performing funds baad mein poor performer ban sakte hain?", a: "Haan, manager changes, market cycle shifts ya category dynamics ki wajah se fund performance badal sakti hai — isliye hum ek baar ke pick ke bajaye periodic reviews recommend karte hain." },
    { q: "Kya mujhe sirf isliye kisi fund mein invest karna chahiye kyunki yeh yaha 'top' dikhaya gaya hai?", a: "Nahi, is page ko ek starting reference ki tarah use karo — aapke liye sahi fund aapke specific goals, risk appetite aur existing portfolio pe depend karta hai, jise assess karne mein hum help karte hain." },
    { q: "Fund manager track record kya hai aur yeh kyu matter karta hai?", a: "Yeh market cycles mein fund manager ki performance history hai — ek consistent, experienced manager usually ek positive signal hai, halanki yeh future results ki guarantee nahi hai." },
    { q: "Kya yeh top funds SIP ke liye available hain ya sirf lumpsum investment ke liye?", a: "Yaha dikhaye gaye lagbhag sabhi funds SIP aur lumpsum dono investment routes ko support karte hain." },
    { q: "Kya dikhaye gaye returns mein exit load ya taxes included hain?", a: "Nahi, dikhaya gaya CAGR ek pre-tax, pre-exit-load figure hai — actual haath mein aane wala return aapke holding period, applicable exit load aur capital gains tax pe depend karta hai. Jaise, ek equity fund ko ek saal ke andar redeem karne pe 1% exit load aur short-term capital gains tax lag sakta hai, jisse headline CAGR ke comparison mein actual haath mein aane wala return kam ho jata hai." },
    { q: "Kisi fund ki category kaise assign hoti hai — kaun decide karta hai ki yeh 'large cap' hai ya 'mid cap'?", a: "Categories SEBI ke official mutual fund categorisation norms follow karti hain, jo large, mid aur small cap classification ke liye market-cap ranges define karte hain." },
    { q: "Kya time ke saath kisi fund ki category badal sakti hai?", a: "Bahut kam, par agar SEBI categorisation thresholds update karta hai ya AMC scheme ko reposition karta hai to fund ko reclassify kiya ja sakta hai — hum currently applicable category dikhate hain." },
    { q: "Large cap aur small cap funds mein risk ka farak kya hai?", a: "Small cap funds kaafi zyada volatile hote hain — zyada potential upside par zyada potential drawdown bhi — relatively steady large cap category ke comparison mein. Jaise, kisi sharp market correction mein, small cap fund large cap fund se kaafi zyada gir sakta hai, chahe dono ek hi overall market downturn mein ho." },
    { q: "Ek fund mein invest karna better hai ya kai mein diversify karna?", a: "Zyada tar investors ko different goals se linked categories mein ek chhote, diversified mix se fayda hota hai, na ki kisi ek fund mein sab kuch lagane se." },
    { q: "Main equity aur debt ke beech sahi asset allocation kaise decide karoon?", a: "Yeh aapke goal ke time horizon aur aapki risk tolerance pe depend karta hai — longer horizons usually zyada equity tilt support karte hain, aur hum sahi mix decide karne mein help karte hain." },
    { q: "Agar yaha dikhaya gaya koi fund underperform kare to kya main usse bahar nikal sakta hoon?", a: "Haan, mutual fund units (ELSS lock-in ke bahar) redeem ya switch kiye ja sakte hain, halanki exit load aur capital gains tax implications pehle check kar lene chahiye." },
    { q: "NAV kya hai aur yeh returns se kaise juda hai?", a: "NAV (Net Asset Value) ek mutual fund ki per-unit price hai; CAGR di gayi time period mein NAV mein change se calculate hota hai. Jaise, agar kisi fund ka NAV 5 saal mein ₹20 se ₹35 tak pahuncha ho, to yeh lagbhag 12% ke CAGR ke barabar hota hai." },
    { q: "Ek hi category ke do funds alag returns kyu dikhate hain?", a: "Stock selection, sector weighting, cash levels aur fund manager ke decisions mein farak, yeh sab ek hi category mein bhi performance mein farak la sakte hain." },
    { q: "Kya aap is page pe fund data regularly update karte ho?", a: "Haan, NAV aur return ke figures AMFI ke feed se live liye jaate hain, isliye data ek static snapshot ke bajaye current values dikhata hai." },
    { q: "Kya is page pe top-rated fund mein invest karna risk-free hai?", a: "Nahi, mutual fund investments market risks ke subject hain — past ranking chahe jo bhi ho, koi bhi fund risk-free ya return-guaranteed nahi hai." },
    { q: "Fund choose karne se pehle returns ke alawa mujhe aur kya dekhna chahiye?", a: "Expense ratio, fund manager ka tenure, portfolio concentration, aapke goal ke liye category fit, aur market cycles mein performance ki consistency — yeh sab returns ke saath matter karte hain." },
    { q: "Kya lock-in ki wajah se ELSS funds doosri equity category se zyada risky hain?", a: "Lock-in khud koi extra investment risk nahi jodta — ELSS funds mein doosre diversified equity funds jaisa hi market risk hota hai, bas extra condition yeh hai ki aap 3 saal tak redeem nahi kar sakte." },
    { q: "Kya main bina account banaye Compare Funds tool use kar sakta hoon?", a: "Haan, Compare Funds tool bina kisi login ke turant free use kiya ja sakta hai." },
    { q: "Main do similar dikhne wale top funds ke beech kaise decide karoon?", a: "Headline returns se aage badhkar expense ratio, 1Y/3Y/5Y mein consistency, aur portfolio composition dekho — ya dono options ko comparative view ke liye free consultation mein lao." },
    { q: "Kya yaha dikhayi gayi past performance batati hai ki aage kya hoga?", a: "Nahi — jaise ki industry-wide scheme documents mein kaha jaata hai, past performance future returns ka indicator nahi hai; yeh decision lene ke liye kai inputs mein se ek hai." },
    { q: "Sirf is page ko browse karne ke bajaye mujhe personalised fund recommendation kaise mile?", a: "Hamari team se free consultation book karo — hum aapko suit karne wale specific funds suggest karne se pehle aapke goals, risk profile aur time horizon ka assessment karte hain." },
  ],
};

export default function TopFundsPage() {
  return (
    <div className="relative" data-testid="top-funds-page-root">
      <SEO
        title="The Financial Doctor | Top Mutual Funds & Returns - Compare & Invest"
        description="Explore top-performing mutual funds across Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, Debt & Hybrid categories — live returns, fund comparison, and expert-picked schemes to invest in."
        keywords="TFD, The Financial Doctor, top mutual funds, best mutual funds India, mutual fund returns, compare mutual funds, large cap fund, small cap fund, mid cap fund, flexi cap fund, ELSS fund, debt fund, hybrid fund, mutual funds, mutual fund, mutal fund, mutualfund, best mutual fund advisor, Parag Parikh Flexi Cap Fund, HDFC Mutual Fund, ICICI Prudential Mutual Fund, SBI Mutual Fund, Axis Mutual Fund, Nippon India Mutual Fund, Kotak Mutual Fund, Aditya Birla Sun Life Mutual Fund, UTI Mutual Fund, DSP Mutual Fund, Franklin Templeton Mutual Fund, Tata Mutual Fund, Mirae Asset Mutual Fund, Motilal Oswal Mutual Fund, Invesco Mutual Fund, Quant Mutual Fund, PPFAS Mutual Fund"
        path="/top-funds"
      />
      <Navbar />
      <main>
        {/* "TRADING TERMINAL" HERO — dark navy + market-green (distinct from
            Calculators' indigo/dot-grid and Services' teal/checklist), with
            a live-looking sparkline as the visual anchor instead of stat
            tiles or a photo. */}
        <section className="relative overflow-hidden bg-[#0A1420] pt-28 pb-16 md:pt-32 md:pb-20 px-6">
          <div
            aria-hidden
            className="fund-animate-in absolute -bottom-16 left-0 right-0 h-40 opacity-20"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(34,197,94,0.4) 100%)" }}
          />
          <div className="container-x relative">
            <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1E3A2E] bg-[#0F2419] text-[11px] tracking-[0.2em] uppercase text-[#4ADE80] font-semibold">
              Live market data
            </div>
            <div className="grid lg:grid-cols-[1.15fr,0.85fr] gap-10 items-end mt-6">
              <div>
                <h1 className="fund-animate-in fund-animate-in-delay-1 font-display text-3xl sm:text-4xl md:text-5xl text-[#F1F5F3] leading-tight">
                  Past returns, calculated <span className="font-italic-serif" style={{ color: "#4ADE80" }}>the honest way.</span>
                </h1>
                <p className="fund-animate-in fund-animate-in-delay-2 mt-4 text-[#9CA9A2] text-[15px] sm:text-base max-w-xl leading-relaxed">
                  Search any mutual fund, compare up to 3 side by side, and see real 1Y/3Y/5Y CAGR
                  calculated from actual historical NAV via AMFI — not estimates, not sample numbers.
                </p>
                <div className="fund-animate-in fund-animate-in-delay-3 flex gap-6 mt-7" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <div><div className="font-display text-2xl text-[#F1F5F3]">15+</div><div className="text-[11px] uppercase tracking-wider text-[#5C7A6A] mt-0.5">Funds tracked</div></div>
                  <div><div className="font-display text-2xl text-[#F1F5F3]">5</div><div className="text-[11px] uppercase tracking-wider text-[#5C7A6A] mt-0.5">Categories</div></div>
                  <div><div className="font-display text-2xl text-[#4ADE80]">Live</div><div className="text-[11px] uppercase tracking-wider text-[#5C7A6A] mt-0.5">AMFI NAV feed</div></div>
                </div>
              </div>
              <svg
                aria-hidden
                className="fund-animate-in fund-animate-in-delay-2 w-full h-28"
                viewBox="0 0 300 100"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,80 30,72 60,76 90,55 120,60 150,40 180,45 210,25 240,30 270,12 300,18"
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="0,80 30,72 60,76 90,55 120,60 150,40 180,45 210,25 240,30 270,12 300,18 300,100 0,100"
                  fill="url(#fundGrad)"
                  stroke="none"
                />
                <defs>
                  <linearGradient id="fundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </section>
        <ProblemSolution
          accent="#22C55E"
          problem="Most 'top fund' lists online show cherry-picked returns from marketing pages, sometimes months out of date, with no way to check the underlying NAV history yourself."
          solution="Every return shown here is computed live from actual historical NAV via AMFI's own feed — search any fund and verify the same 1Y/3Y/5Y numbers yourself, nothing pre-baked."
        />
        {/* FUND CATEGORIES, BY RISK — moved ahead of the live fund table so
            a visitor orients on "which category fits me" before scanning
            15+ funds by name. Rebuilt as an actual risk/return spectrum (a
            positioned gradient bar with a marker per category) instead of
            a card grid or accordion — a structurally different device from
            anything else on the site, and a more honest way to compare 6
            categories than a symmetric grid implies. Same spectrum band
            reflows (not re-composes) between mobile and desktop; the card
            list beneath it is what actually restructures — 2-col stack on
            mobile, 3-col on desktop. */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 text-center">
              Fund Categories, by Risk
            </h2>
            <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-12">
              Not sure which type of fund fits your goal? Here's where each category sits
              on the risk spectrum, lowest to highest.
            </p>

            <div className="relative mt-6 mb-14 px-2">
              <div
                className="relative h-2 rounded-full"
                style={{ background: "linear-gradient(90deg, #22C55E 0%, #D9B15C 50%, #C7102E 100%)" }}
              >
                {categories.map((c) => (
                  <div
                    key={c.title}
                    className="absolute top-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm"
                    style={{ left: `${c.risk}%`, transform: "translate(-50%, -50%)", borderColor: riskColor(c.risk) }}
                    title={c.title}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-[#8A93A6] mt-3">
                <span>Lower risk</span>
                <span>Higher risk</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.title} className="bg-white border border-[#E2D8C2] rounded-2xl p-5 shadow-sm">
                  <div className="inline-flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: riskColor(c.risk) }} />
                    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: riskColor(c.risk) }}>
                      {riskLabel(c.risk)}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-display text-[#0E1B2C] mb-1.5">{c.title}</h3>
                  <p className="text-sm text-[#2A364B]/80 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#2A364B]/60 text-center mt-10">
              Mutual fund investments are subject to market risks. Past performance
              is not indicative of future returns. Please read scheme documents carefully.
            </p>
          </div>
        </section>

        <TopFunds hideHeading />

        {/* COMPARE FUNDS TOOL */}
        <CompareFunds />

        <FAQSection title="Top Funds — Frequently Asked Questions" data={fundsFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
