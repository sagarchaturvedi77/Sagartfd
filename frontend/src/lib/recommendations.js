// Trilingual recommendation tips per calculator tab + AI plan context.
// Each tip: { en, hi, hinglish } — en+hi rendered together inside the PNG snapshot;
// the proposal PDF (Calculators.jsx) picks one field based on the selected language.
// NOTE: `hi` used to hold romanised Hinglish text (mislabeled) — it now holds real
// Devanagari Hindi, and the old Hinglish copy moved to the new `hinglish` field.

export const CALC_RECOMMENDATIONS = {
    sip: [
        {
            en: "Step up your SIP by 10% every year — small increase, huge compounding impact.",
            hi: "हर साल अपनी SIP 10% बढ़ाएं — छोटा कदम, कंपाउंडिंग पर बड़ा असर।",
            hinglish: "Har saal SIP 10% badhayein — chhota kadam, bada compounding impact.",
        },
        {
            en: "Pair with ELSS to save up to ₹46,800 in tax under section 80C.",
            hi: "ELSS के साथ जोड़ें — सेक्शन 80C में ₹46,800 तक टैक्स बचाएं।",
            hinglish: "ELSS ke saath jodein — Section 80C me ₹46,800 tak tax bachayein.",
        },
        {
            en: "Don't pause SIP during market dips — that's when averaging works best.",
            hi: "बाजार गिरने पर SIP बंद न करें — वहीं पर एवरेजिंग का असली फायदा मिलता है।",
            hinglish: "Market girne par SIP band na karein — wahi par averaging ka asli fayda hai.",
        },
    ],
    daily: [
        {
            en: "Consider switching to a single monthly SIP — fewer transactions, same outcome.",
            hi: "एक मासिक SIP पर शिफ्ट होने पर विचार करें — कम ट्रांजैक्शन, वही नतीजा।",
            hinglish: "Monthly SIP par shift karein — kam transactions, wahi result.",
        },
        {
            en: "Daily contributions build the strongest investing discipline — keep going.",
            hi: "रोज़ाना निवेश सबसे मजबूत अनुशासन बनाता है — इसे जारी रखें।",
            hinglish: "Daily nivesh sabse strong habit banata hai — discipline mat todhiye.",
        },
        {
            en: "Add a small lumpsum once a year (bonus / Diwali money) to accelerate goals.",
            hi: "साल में एक बार छोटा लम्पसम (बोनस / दिवाली का पैसा) जरूर जोड़ें।",
            hinglish: "Saal me ek baar lumpsum (bonus / Diwali ka paisa) zaroor add karein.",
        },
    ],
    lumpsum: [
        {
            en: "Reduce timing risk — stagger via STP over 6–12 months instead of one-shot.",
            hi: "टाइमिंग रिस्क कम करें — एक बार की जगह 6–12 महीने में STP करें।",
            hinglish: "Ek baar ki jagah 6–12 mahine STP karein — timing risk kam ho jayega.",
        },
        {
            en: "Top this up with a monthly SIP to keep wealth compounding alongside.",
            hi: "साथ में मासिक SIP भी शुरू करें — संपत्ति और तेज़ी से बढ़ेगी।",
            hinglish: "Sath me monthly SIP bhi shuru karein — wealth aur tezi se badhegi.",
        },
        {
            en: "Pick large-cap or flexi-cap for stability; avoid sector funds at start.",
            hi: "शुरुआत में स्थिरता के लिए लार्ज-कैप या फ्लेक्सी-कैप चुनें — सेक्टर फंड्स से बचें।",
            hinglish: "Shuru me large-cap ya flexi-cap chunein — sector funds se bachein.",
        },
    ],
    swp: [
        {
            en: "Withdraw ≤ 6–7% annually so your corpus lasts 25+ years comfortably.",
            hi: "सालाना केवल 6–7% निकालें — कोष आराम से 25+ साल चलेगा।",
            hinglish: "Saalana sirf 6–7% nikalein — corpus 25+ saal aaram se chalega.",
        },
        {
            en: "Keep a separate 6-month emergency fund — never dip into SWP corpus.",
            hi: "6 महीने का इमरजेंसी फंड अलग रखें — SWP कोष से कभी न निकालें।",
            hinglish: "6 mahine ka emergency fund alag rakhein — SWP corpus se nahi nikalein.",
        },
        {
            en: "Choose hybrid funds for SWP — lower volatility = smoother monthly income.",
            hi: "SWP के लिए हाइब्रिड फंड चुनें — कम अस्थिरता, स्मूद मासिक आय।",
            hinglish: "SWP ke liye hybrid funds chunein — volatility kam, monthly income smooth.",
        },
    ],
    goal: [
        {
            en: "Step up SIP by 10% yearly — you'll reach the goal ~3 years sooner.",
            hi: "हर साल SIP 10% बढ़ाएं — लक्ष्य करीब 3 साल पहले हासिल होगा।",
            hinglish: "Har saal SIP 10% step-up karein — goal 3 saal pehle achieve hoga.",
        },
        {
            en: "For 7+ year goals choose equity; for 3–7 years use hybrid funds.",
            hi: "7+ साल के लक्ष्य के लिए इक्विटी, 3–7 साल के लिए हाइब्रिड फंड चुनें।",
            hinglish: "7+ saal ke goal ke liye equity, 3–7 saal ke liye hybrid funds chunein.",
        },
        {
            en: "Buy term insurance equal to the goal amount — protect the plan, not just grow it.",
            hi: "लक्ष्य राशि के बराबर टर्म इंश्योरेंस लें — प्लान को बढ़ाने के साथ सुरक्षित भी करें।",
            hinglish: "Goal ke barabar term insurance lein — plan ko grow ke saath protect bhi karein.",
        },
    ],
    emi: [
        {
            en: "Pre-pay one extra EMI per year — saves 4–6 years of tenure & lakhs in interest.",
            hi: "साल में एक अतिरिक्त EMI भरें — 4–6 साल जल्दी लोन खत्म, लाखों की ब्याज बचत।",
            hinglish: "Saal me ek extra EMI bharein — 4–6 saal jaldi loan khatam, lakhs ki interest bachat.",
        },
        {
            en: "Start a parallel SIP of 10–15% of EMI — your safety net against rate hikes.",
            hi: "EMI का 10–15% समानांतर SIP में लगाएं — ब्याज दर बढ़ने पर यह बैकअप का काम करेगा।",
            hinglish: "EMI ka 10–15% parallel SIP me lagayein — interest badhe to backup ready.",
        },
        {
            en: "Don't compromise on emergency fund or term insurance just for a bigger EMI.",
            hi: "बड़ी EMI के चक्कर में इमरजेंसी फंड / टर्म इंश्योरेंस से समझौता न करें।",
            hinglish: "Badi EMI ke chakkar me emergency fund / term insurance kabhi mat compromise karein.",
        },
    ],
};

export const AI_PLAN_RECOMMENDATIONS = [
    {
        en: "Buy term insurance before any investment — protect first, grow later.",
        hi: "Pehle term insurance lein, phir investment shuru karein.",
    },
    {
        en: "Keep 6 months of expenses as emergency fund in a liquid fund or savings.",
        hi: "6 mahine ka kharcha emergency fund me rakhein — liquid fund ya savings me.",
    },
    {
        en: "Review portfolio every 12 months — rebalance if any asset class drifts >10%.",
        hi: "Har saal portfolio review karein — koi asset 10% se zyada hile to rebalance karein.",
    },
    {
        en: "Invest via Regular plans with an AMFI advisor — hand-holding & rebalancing included.",
        hi: "AMFI advisor ke through Regular plan me invest karein — guidance aur rebalancing sath milti hai.",
    },
];
