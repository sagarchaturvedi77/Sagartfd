                                    <span className="text-[#5C677D] text-[10px] uppercase block">{calcType === "SIP" ? "SIP XIRR" : "Annualized Return"}</span>
                                    <span className="text-sm font-extrabold text-[#024396] mt-0.5 block">{fmtPct(calcResult.annualizedReturn)}</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-[#5C677D] bg-[#F6F1E8] border border-[#E2D8C2] rounded-xl p-3 leading-relaxed">
                                Calculation selected fund ke real historical NAV se hua hai: start NAV Rs. {calcResult.startNav.toFixed(4)} on {calcResult.startDate}, current NAV Rs. {calcResult.currentNav.toFixed(4)} on {calcResult.asOfDate}.
                            </p>

                            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 pt-2">
                                <button onClick={downloadProposal} disabled={downloading} className="inline-flex justify-center items-center gap-2 text-xs text-white font-bold py-3 bg-[#024396] hover:bg-[#012E6B] rounded-xl transition-all shadow-md disabled:opacity-60">
                                    {downloading ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                                    Download Proposal PDF
                                </button>
                                <a href={ASSETPLUS} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center gap-2 text-xs text-white font-bold py-3 bg-[#00A86B] hover:bg-[#078458] rounded-xl transition-all shadow-md">
                                    Invest Now <ExternalLink size={15} />
                                </a>
                                <button onClick={onClose} className="px-4 text-center text-xs text-[#5C677D] border border-[#E2D8C2] font-semibold py-3 bg-white hover:bg-[#F6F1E8] rounded-xl transition-all">Close</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
                    {calcResult && <ProposalPage refEl={proposalRef} data={data} calcType={calcType} amount={amount} result={calcResult} />}
                </div>
            </div>
        </div>
    );
}

function MiniReturn({ label, value }) {
    return (
        <div className="bg-white border border-[#E2D8C2] rounded-lg px-2 py-2">
            <div className="text-[9px] uppercase tracking-[0.12em] text-[#5C677D]">{label}</div>
            <div className="text-[#024396] font-bold mt-0.5">{fmtPct(value)}</div>
        </div>
    );
}

function StatBox({ label, value, accent }) {
    return (
        <div className={`${accent ? "bg-[#024396]/5 border-[#024396]/10" : "bg-[#F6F1E8]/60 border-[#E2D8C2]/40"} p-3 rounded-xl border`}>
            <span className={`${accent ? "text-[#024396]" : "text-[#5C677D]"} text-[10px] uppercase font-semibold block`}>{label}</span>
            <span className={`${accent ? "text-[#024396] text-lg" : "text-[#0E1B2C] text-base"} font-bold block mt-0.5`}>{value}</span>
        </div>
    );
}

function ProposalPage({ refEl, data, calcType, amount, result }) {
    return (
        <div
            ref={refEl}
            style={{
                width: 794,
                height: 1123,
                background: "#F6F1E8",
                color: "#0E1B2C",
                padding: 34,
                fontFamily: "DM Sans, Arial, sans-serif",
                border: "1px solid #E2D8C2",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <img src={TFD_LOGO} crossOrigin="anonymous" alt="TFD" style={{ width: 360, height: 95, objectFit: "contain", border: "1px solid #E2D8C2", borderRadius: 14, background: "#FBF7EE" }} />
                    <div>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 31, lineHeight: 1.05 }}>The Financial<br />Doctor</div>
                        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "#5C677D", marginTop: 8 }}>Treating your<br />financial health</div>
                    </div>
                </div>
                <div style={{ textAlign: "right", color: "#024396", fontWeight: 700, fontSize: 13, letterSpacing: "0.2em" }}>
                    AMFI - ARN<br />290298
                    <div style={{ marginTop: 14, letterSpacing: 0 }}>Sehore - MP</div>
                </div>
            </div>

            <div style={{ background: "#0E1B2C", borderRadius: 22, padding: 26, color: "#F6F1E8", marginBottom: 22 }}>
                <div style={{ color: "#C7102E", fontSize: 13, letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 700 }}>{calcType} Historical Proposal</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 34, lineHeight: 1.1, marginTop: 18 }}>{fmtINR(result.currentValue)}</div>
                <div style={{ opacity: 0.75, fontSize: 15, marginTop: 4 }}>
                    Current value from real NAV history - calculated @ {fmtPct(result.periodCagr)} fund CAGR
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 16 }}>
                    {calcType === "SIP" ? "Monthly SIP" : "One-time investment"}: {fmtFullINR(amount)}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
                <PdfStat label="Total Invested" value={fmtINR(result.invested)} />
                <PdfStat label="Net Gain" value={fmtINR(result.profit)} />
                <PdfStat label="Current Value" value={fmtINR(result.currentValue)} accent />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
                <PdfStat label="Absolute Return" value={fmtPct(result.returnsPct)} />
                <PdfStat label={calcType === "SIP" ? "SIP XIRR" : "Annualized Return"} value={fmtPct(result.annualizedReturn)} />
            </div>

            <div style={{ border: "1px solid #E2D8C2", borderRadius: 16, background: "#FBF7EE", padding: 18, marginBottom: 18 }}>
                <div style={{ color: "#024396", fontWeight: 800, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10 }}>Selected Fund</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, lineHeight: 1.15 }}>{data.name}</div>
                <div style={{ color: "#5C677D", fontSize: 13, marginTop: 8 }}>{data.fund_house} - Scheme code {data.code}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, fontSize: 13 }}>
                    <div><strong>Start:</strong> NAV Rs. {result.startNav.toFixed(4)} on {result.startDate}</div>
                    <div><strong>Latest:</strong> NAV Rs. {result.currentNav.toFixed(4)} on {result.asOfDate}</div>
                    <div><strong>1Y CAGR:</strong> {fmtPct(data.return_1y)}</div>
                    <div><strong>3Y CAGR:</strong> {fmtPct(data.return_3y)}</div>
                    <div><strong>5Y CAGR:</strong> {fmtPct(data.return_5y)}</div>
                    <div><strong>Used for this proposal:</strong> {fmtPct(result.periodCagr)}</div>
                </div>
            </div>

            <div style={{ border: "1px solid #E2D8C2", borderLeft: "4px solid #C7102E", borderRadius: 14, background: "#FBF7EE", padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, color: "#024396", marginBottom: 6 }}>Important note</div>
                <div style={{ color: "#5C677D", fontSize: 13, lineHeight: 1.45 }}>
                    This proposal uses the selected fund's real historical NAV records from AMFI/MFAPI. Past returns are shown only for illustration and do not guarantee future returns.
                </div>
            </div>

            <div style={{ background: "#0E1B2C", color: "#F6F1E8", borderRadius: 18, padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={SAGAR_PHOTO} crossOrigin="anonymous" alt="Sagar" style={{ width: 76, height: 92, borderRadius: 12, objectFit: "cover", border: "2px solid #C7102E" }} />
                    <div>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, lineHeight: 1.1 }}>Sagar Chaturvedi</div>
                        <div style={{ fontSize: 11, color: "#F6F1E8", opacity: 0.7, marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Founder - MFD (AMFI Certified)</div>
                        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>+91 77738 05794</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>wecare@thefinancialdoctor.in</div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: 6, borderRadius: 10 }}>
                        <QRCodeCanvas value={ASSETPLUS} size={92} bgColor="#FFFFFF" fgColor="#0E1B2C" level="M" includeMargin={false} />
                    </div>
                    <div style={{ fontSize: 9, marginTop: 6, color: "#C7102E", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Scan to invest</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>AssetPlus - ARN-290298</div>
                </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 18 }}>
                <div style={{ fontSize: 13, color: "#0E1B2C", fontWeight: 800, marginBottom: 6 }}>thefinancialdoctor.in</div>
                <div style={{ fontSize: 11, color: "#5C677D", fontStyle: "italic", lineHeight: 1.4 }}>
                    Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Calculations are illustrative; actual returns may vary.
                </div>
            </div>
        </div>
    );
}

function PdfStat({ label, value, accent }) {
    return (
        <div style={{ background: accent ? "#024396" : "#FBF7EE", border: accent ? "none" : "1px solid #E2D8C2", borderRadius: 16, padding: "18px 18px", color: accent ? "#F6F1E8" : "#0E1B2C" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: accent ? "rgba(246,241,232,0.75)" : "#5C677D", marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, lineHeight: 1.1 }}>{value}</div>
        </div>
    );
}
