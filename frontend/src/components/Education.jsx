import React, { useState } from "react";

const content = {
    English: [
        {
            t: "What is a Mutual Fund?",
            b: "A mutual fund pools money from many investors and invests it in stocks, bonds or other assets, managed by a professional fund manager. You buy units; your gains rise and fall with the fund's NAV.",
        },
        {
            t: "SIP — Systematic Investment Plan",
            b: "Invest a fixed amount (e.g. ₹1,000) every month. Rupee-cost averaging smooths market ups and downs. Best for salaried investors building long-term wealth.",
        },
        {
            t: "Lumpsum vs SWP",
            b: "Lumpsum = one-time investment when markets are favourable. SWP = Systematic Withdrawal Plan; withdraw a fixed amount monthly from your corpus — perfect for retirement income.",
        },
        {
            t: "Insurance is your foundation",
            b: "Before investing, protect your family with term insurance (high cover, low premium) and health insurance. Mutual funds build wealth; insurance protects it.",
        },
    ],
    "हिंदी": [
        {
            t: "म्यूचुअल फंड क्या है?",
            b: "म्यूचुअल फंड कई निवेशकों का पैसा एकत्रित करके स्टॉक्स, बॉन्ड्स या अन्य assets में निवेश करता है — एक professional fund manager द्वारा प्रबंधित। आप units खरीदते हैं और NAV के अनुसार आपका रिटर्न बदलता है।",
        },
        {
            t: "SIP — व्यवस्थित निवेश योजना",
            b: "हर महीने एक निश्चित राशि (जैसे ₹1,000) निवेश करें। Rupee-cost averaging से बाज़ार के उतार-चढ़ाव कम होते हैं। नौकरीपेशा लोगों के लिए लम्बी अवधि की संपत्ति निर्माण का सबसे अच्छा तरीका।",
        },
        {
            t: "Lumpsum बनाम SWP",
            b: "Lumpsum = एकमुश्त निवेश जब बाज़ार अनुकूल हो। SWP = व्यवस्थित निकासी; अपने corpus से हर महीने एक निश्चित राशि निकालें — रिटायरमेंट आय के लिए परफेक्ट।",
        },
        {
            t: "बीमा आपकी नींव है",
            b: "निवेश से पहले अपने परिवार को term insurance (अधिक कवर, कम प्रीमियम) और health insurance से सुरक्षित करें। म्यूचुअल फंड संपत्ति बनाते हैं; बीमा उसे बचाता है।",
        },
    ],
    Hinglish: [
        {
            t: "Mutual Fund kya hota hai?",
            b: "Mutual fund kayi investors ka paisa milake stocks, bonds ya assets me invest karta hai — ek professional fund manager ke through. Aap units kharidte ho, aur NAV ke hisaab se aapka return badalta hai.",
        },
        {
            t: "SIP — Har month ka discipline",
            b: "Har month ek fixed amount (jaise ₹1,000) invest karo. Rupee-cost averaging market ke ups-downs ko smooth kar deti hai. Salaried logon ke liye best long-term wealth strategy.",
        },
        {
            t: "Lumpsum vs SWP",
            b: "Lumpsum = ek-baar ka investment, jab market accha ho. SWP = har month corpus se ek fixed amount nikalna — retirement income ke liye perfect.",
        },
        {
            t: "Insurance pehle, investment baad me",
            b: "Family ko pehle term insurance (high cover, kam premium) aur health insurance se cover karo. Mutual fund wealth banate hain; insurance us wealth ko bachata hai.",
        },
    ],
};

const langs = Object.keys(content);

export default function Education() {
    const [lang, setLang] = useState("English");
    return (
        <section className="section bg-[#EFE7D6]">
            <div className="container-x">
                <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
                    <div>
                        <div className="eyebrow">Financial Education</div>
                        <h1 className="h2 mt-3 text-[#0E1B2C]">
                            Learn before <span className="font-italic-serif text-[#024396]">you invest.</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {langs.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`tab-pill ${lang === l ? "active" : ""}`}
                                data-testid={`edu-lang-${l}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 no-scrollbar md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
                    {content[lang].map((c) => (
                        <article key={c.t} className="shrink-0 w-[82%] snap-center md:w-auto md:shrink card-cream p-7">
                            <h3 className="font-display text-[1.4rem] text-[#0E1B2C] leading-snug">
                                {c.t}
                            </h3>
                            <p className="mt-3 text-[#2A364B] leading-relaxed">{c.b}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-10 card-ink p-7 md:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div>
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#C7102E] font-semibold">
                            Join our community
                        </div>
                        <h3 className="font-display text-[1.8rem] mt-1">
                            Daily financial tips on WhatsApp
                        </h3>
                        <p className="opacity-80 mt-2 max-w-xl">
                            Get free educational content from Sagar ji directly on WhatsApp.
                        </p>
                    </div>
                    <a
                        href="https://chat.whatsapp.com/JEb2Ilngiq45oqyUQDMFSX"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-pill"
                        style={{ background: "#C7102E", color: "#fff" }}
                    >
                        Join WhatsApp Community
                    </a>
                </div>
            </div>
        </section>
    );
}
