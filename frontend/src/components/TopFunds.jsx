                </div>

                {loadingDetails && (
                    <div className="flex items-center gap-2 text-xs text-[#024396] mb-4 bg-[#024396]/10 px-4 py-2 rounded-xl w-fit">
                        <Loader2 className="animate-spin" size={14} /> Fetching selected fund history...
                    </div>
                )}

                <div className="-mx-6 md:mx-0 px-6 md:px-0 mb-6 overflow-x-auto" data-testid={IDS.funds.category}>
                    <div className="flex gap-2 min-w-max md:flex-wrap">
                        {categories.map((c) => (
                            <button
                                key={c}
                                onClick={() => handleCategoryChange(c)}
                                className={`tab-pill shrink-0 ${category === c ? "active" : ""}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-cream overflow-hidden" data-testid={IDS.funds.table}>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F6F1E8] text-[#5C677D]">
                                <tr className="text-left">
                                    <th className="px-5 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">Fund Name</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase">Category</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">Live NAV</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">1Y CAGR</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">3Y CAGR</th>
                                    <th className="px-3 py-4 font-medium text-[11px] tracking-[0.18em] uppercase text-right">5Y CAGR</th>
                                    <th className="px-5 py-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            <Sparkles className="inline animate-pulse" size={16} /> Connecting live AMFI database...
                                        </td>
                                    </tr>
                                )}
                                {!loading && paginatedFunds.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-[#5C677D]">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    paginatedFunds.map((f) => (
                                        <tr key={f.code} className="border-t border-[#E2D8C2] hover:bg-[#F6F1E8]">
                                            <td className="px-5 py-4">
                                                <button onClick={() => openFundDetail(f.code)} className="text-left group block">
                                                    <div className="font-display text-[15px] text-[#0E1B2C] font-semibold leading-tight group-hover:text-[#024396] transition-colors">{f.name}</div>
                                                    <div className="text-[11px] text-[#5C677D] mt-1">{f.fund_house}</div>
                                                </button>
                                            </td>
                                            <td className="px-3 py-4 text-[12px] text-[#5C677D]">{f.category}</td>
                                            <td className="px-3 py-4 text-right">
                                                <div className="font-medium text-[#0E1B2C]">Rs. {Number(f.nav || 0).toFixed(4)}</div>
                                                <div className="text-[10px] text-[#5C677D]">{f.nav_date}</div>
                                            </td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_1y)}</td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_3y)}</td>
                                            <td className="px-3 py-4 text-right text-[#024396] font-medium">{fmtPct(f.return_5y)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => openFundDetail(f.code)} className="text-xs font-bold text-white bg-[#024396] hover:bg-[#012E6B] px-4 py-2 rounded-lg transition-all shadow-sm">
                                                    Past Returns Calculator
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden divide-y divide-[#E2D8C2]">
                        {!loading &&
                            paginatedFunds.map((f) => (
                                <article key={f.code} className="px-4 py-4 bg-[#FBF7EE]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-display text-[14.5px] font-bold text-[#0E1B2C] leading-tight">{f.name}</div>
                                            <div className="text-[11px] text-[#5C677D] mt-1">{f.fund_house}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-display text-[15px] font-bold text-[#0E1B2C]">Rs. {Number(f.nav || 0).toFixed(4)}</div>
                                            <div className="text-[9px] text-[#5C677D] mt-0.5">{f.nav_date}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] mt-3 text-[#024396] font-semibold">
                                        <span>1Y {fmtPct(f.return_1y)}</span>
                                        <span>3Y {fmtPct(f.return_3y)}</span>
                                        <span>5Y {fmtPct(f.return_5y)}</span>
                                    </div>
                                    <button onClick={() => openFundDetail(f.code)} className="mt-4 w-full text-center text-xs font-bold text-white bg-[#024396] py-2.5 rounded-xl shadow-sm block">
                                        Past Returns Calculator
                                    </button>
                                </article>
                            ))}
                    </div>
                </div>

                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 px-1">
                        <div className="text-xs text-[#5C677D]">
                            Showing page <span className="font-semibold text-[#0E1B2C]">{currentPage}</span> of <span className="font-semibold text-[#0E1B2C]">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-[#FBF7EE] border border-[#E2D8C2] disabled:opacity-40 hover:bg-[#F6F1E8]">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-[#FBF7EE] border border-[#E2D8C2] disabled:opacity-40 hover:bg-[#F6F1E8]">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {searchingDetail && <FundModal data={searchingDetail} onClose={() => setSearchingDetail(null)} />}
            </div>
        </section>
    );
}

function FundModal({ data, onClose }) {
    const [calcType, setCalcType] = useState("SIP");
    const [amount, setAmount] = useState(5000);
    const [yearsAgo, setYearsAgo] = useState(5);
    const [customMode, setCustomMode] = useState(false);
    const [customMonth, setCustomMonth] = useState("01");
    const [customYear, setCustomYear] = useState("2021");
    const [loadingCalc, setLoadingCalc] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const proposalRef = useRef(null);

    const selectedStartDate = useMemo(() => {
        const latest = data.history?.[0]?.dt || new Date();
        if (customMode) return new Date(Number(customYear), Number(customMonth) - 1, 1);
        const d = new Date(latest);
        d.setFullYear(d.getFullYear() - yearsAgo);
        return d;
    }, [customMode, customMonth, customYear, data.history, yearsAgo]);

    const runSingleCalculation = () => {
        setLoadingCalc(true);
        try {
            const history = data.history || [];
            const latest = history[0];
            if (!latest) return;

            const startPoint = findClosestNav(history, selectedStartDate);
            const currentNav = latest.nav;
            const currentDate = latest.dt;
            let totalInvested = 0;
            let totalUnits = 0;
            const cashflows = [];
            const series = [];

            if (calcType === "Lumpsum") {
                totalInvested = Number(amount) || 0;
                totalUnits = totalInvested / startPoint.nav;
                cashflows.push({ date: startPoint.dt, amount: -totalInvested });
                cashflows.push({ date: currentDate, amount: totalUnits * currentNav });
                series.push({ label: "Start", invested: totalInvested, value: totalInvested });
                series.push({ label: "Today", invested: totalInvested, value: totalUnits * currentNav });
            } else {
                const loopDt = new Date(startPoint.dt);
                while (loopDt <= currentDate) {
                    const point = findClosestNav(history, loopDt);
                    const monthly = Number(amount) || 0;
                    totalInvested += monthly;
                    totalUnits += monthly / point.nav;
                    cashflows.push({ date: new Date(point.dt), amount: -monthly });
                    if (loopDt.getMonth() === 0 || loopDt.getTime() === startPoint.dt.getTime()) {
                        series.push({
                            label: `${loopDt.getFullYear()}`,
                            invested: Math.round(totalInvested),
                            value: Math.round(totalUnits * point.nav),
                        });
                    }
                    loopDt.setMonth(loopDt.getMonth() + 1);
                }
                cashflows.push({ date: currentDate, amount: totalUnits * currentNav });
                series.push({
                    label: "Today",
                    invested: Math.round(totalInvested),
                    value: Math.round(totalUnits * currentNav),
                });
            }

            const cValue = totalUnits * currentNav;
            const selectedYears = Math.max(1 / 12, (currentDate - startPoint.dt) / (365 * 24 * 60 * 60 * 1000));
            const periodCagr = (Math.pow(currentNav / startPoint.nav, 1 / selectedYears) - 1) * 100;
            const annualized = calcType === "SIP" ? xirr(cashflows) : periodCagr;

            setCalcResult({
                invested: Math.round(totalInvested),
                currentValue: Math.round(cValue),
                profit: Math.round(cValue - totalInvested),
                returnsPct: ((cValue - totalInvested) / Math.max(totalInvested, 1)) * 100,
                annualizedReturn: annualized,
                periodCagr,
                startDate: startPoint.date,
                startNav: startPoint.nav,
                asOfDate: latest.date,
                currentNav,
                series,
            });
        } finally {
            setLoadingCalc(false);
        }
    };

    useEffect(() => {
        runSingleCalculation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yearsAgo, calcType, amount, customMode, customMonth, customYear, data.code]);

    const downloadProposal = async () => {
        if (!proposalRef.current || !calcResult) return;
        setDownloading(true);
        try {
            toast?.loading?.("Generating 1-page proposal PDF...", { id: "fund-proposal" });
            await new Promise((resolve) => setTimeout(resolve, 150));
            const canvas = await html2canvas(proposalRef.current, {
                backgroundColor: "#F6F1E8",
                scale: 2,
                useCORS: true,
                logging: false,
                width: 794,
                height: 1123,
                windowWidth: 794,
                windowHeight: 1123,
            });
            const jpeg = canvas.toDataURL("image/jpeg", 0.96);
            const blob = singlePagePdfBlobFromJpeg(jpegDataUrlToBytes(jpeg));
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `TFD-${data.name.replace(/[^a-z0-9]+/gi, "-").slice(0, 70)}-proposal.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast?.success?.("Proposal PDF downloaded.", { id: "fund-proposal" });
