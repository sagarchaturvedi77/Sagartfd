import React from "react";

const partners = [
    "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential", "Axis Mutual Fund",
    "Nippon India", "Aditya Birla Sun Life", "Kotak Mahindra", "UTI Mutual Fund",
    "DSP Mutual Fund", "Mirae Asset", "Franklin Templeton", "Tata Mutual Fund",
    "Edelweiss MF", "Motilal Oswal", "PPFAS", "Quant MF",
    "Bandhan MF", "Invesco", "Canara Robeco", "L&T Mutual Fund",
];

export default function Partners() {
    return (
        <section className="section">
            <div className="container-x">
                <div className="max-w-2xl mb-10">
                    <div className="eyebrow">Partners we deliver through</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        Access to 40+ AMCs, <span className="font-italic-serif text-[#0E5E48]">one trusted advisor.</span>
                    </h2>
                </div>
            </div>

            <div className="marquee relative overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to right, #F6F1E8, transparent)" }}
                />
                <div
                    aria-hidden
                    className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(to left, #F6F1E8, transparent)" }}
                />
                <div className="marquee-track">
                    {[...partners, ...partners].map((p, i) => (
                        <div
                            key={i}
                            className="shrink-0 px-7 py-5 mx-3 bg-[#FBF7EE] border border-[#E2D8C2] rounded-xl text-[#0E1B2C] font-display text-lg"
                        >
                            {p}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
