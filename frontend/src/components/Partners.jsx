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
                <div className="max-w-2xl mb-8 sm:mb-10">
                    <div className="eyebrow">Partners we deliver through</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        Access to 40+ AMCs, <span className="font-italic-serif text-[#024396]">one trusted advisor.</span>
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                    {partners.map((p, i) => (
                        <div
                            key={`partner-${p}-${i}`}
                            className="px-3 sm:px-4 py-3 sm:py-4 bg-[#FBF7EE] border border-[#E2D8C2] rounded-xl text-[#0E1B2C] font-display text-[13px] sm:text-[15px] text-center"
                        >
                            {p}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
