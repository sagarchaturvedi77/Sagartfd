// 🧮 Advanced Historical SIP/Lumpsum Backtesting Engine
function FundModal({ data, onClose }) {
    const [calcType, setCalcType] = useState("SIP"); // SIP or Lumpsum
    const [amount, setAmount] = useState(5000); // Default Amount
    const [yearsAgo, setYearsAgo] = useState(5); // Default 5 Years back
    const [customMode, setCustomMode] = useState(false);
    const [customMonth, setCustomMonth] = useState("01");
    const [customYear, setCustomYear] = useState("2021");
    
    const [loadingCalc, setLoadingCalc] = useState(false);
    const [calcResult, setCalcResult] = useState(null);

    // Dynamic Calculation using Historical NAV Analytics
    const calculatePastReturns = async (selectedYears, isCustom = false) => {
        setLoadingCalc(true);
        try {
            // Fetch complete historical data array from MFAPI
            const res = await fetch(`https://api.mfapi.in/mf/${data.code}`);
            const fullData = await res.json();
            const navArray = fullData.data; // Array of {date, nav}

            if (!navArray || navArray.length === 0) return;

            const targetDate = new Date();
            if (isCustom) {
                targetDate.setFullYear(parseInt(customYear), parseInt(customMonth) - 1, 1);
            } else {
                targetDate.setFullYear(targetDate.getFullYear() - selectedYears);
            }

            const currentNav = parseFloat(navArray[0].nav);
            const currentDateStr = navArray[0].date;

            // Helper function to find closest NAV for any historical date
            const findClosestNav = (targetDt) => {
                let closest = navArray[0];
                let minDiff = Infinity;
                
                for (let item of navArray) {
                    const [d, m, y] = item.date.split("-");
                    const itemDt = new Date(y, m - 1, d);
                    const diff = Math.abs(itemDt - targetDt);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = item;
                    }
                }
                return closest;
            };

            let totalInvested = 0;
            let totalUnits = 0;

            if (calcType === "Lumpsum") {
                const purchasePoint = findClosestNav(targetDate);
                const purchaseNav = parseFloat(purchasePoint.nav);
                totalInvested = parseFloat(amount);
                totalUnits = totalInvested / purchaseNav;
            } else {
                // SIP Monthly Loop from Target Past Date to Today
                let currentLoopDt = new Date(targetDate);
                const today = new Date();

                while (currentLoopDt <= today) {
                    const sipPoint = findClosestNav(currentLoopDt);
                    const sipNav = parseFloat(sipPoint.nav);
                    
                    totalInvested += parseFloat(amount);
                    totalUnits += parseFloat(amount) / sipNav;

                    // Move to next month
                    currentLoopDt.setMonth(currentLoopDt.getMonth() + 1);
                }
            }

            const currentValue = totalUnits * currentNav;
            const totalGain = currentValue - totalInvested;
            const absoluteReturn = (totalGain / totalInvested) * 100;

            setCalcResult({
                invested: Math.round(totalInvested),
                currentValue: Math.round(currentValue),
                profit: Math.round(totalGain),
                returnsPct: absoluteReturn.toFixed(1),
                asOfDate: currentDateStr
            });

        } catch (err) {
            console.error("Backtesting calculation matrix error:", err);
        } finally {
            setLoadingCalc(false);
        }
    };

    // Run calculation when parameters change
    useEffect(() => {
        if (!customMode) {
            calculatePastReturns(yearsAgo, false);
        }
    }, [yearsAgo, calcType, amount, customMode]);

    return (
        <div className="fixed inset-0 z-[60] bg-[#0E1B2C]/70 backdrop-blur grid place-items-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-[#FBF7EE] border-2 border-[#E2D8C2] rounded-2xl p-6 max-w-xl w-full shadow-2xl relative overflow-y-auto max-h-[95vh]"
            >
                {/* BRAND HEADER */}
                <div className="border-b border-[#E2D8C2] pb-3 mb-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-[#024396] tracking-wider uppercase font-display">The Financial Doctor</h3>
                        <p className="text-[9px] text-[#5C677D] tracking-tight">Sagar Chaturvedi · AMFI Registered MFD (ARN-290298)</p>
                    </div>
                    <button onClick={onClose} className="text-xs text-[#5C677D] hover:text-[#0E1B2C] font-bold">✕ Close</button>
                </div>

                {/* FUND INFO */}
                <div className="mb-5 bg-[#024396]/5 p-3 rounded-xl border border-[#024396]/10">
                    <h4 className="font-display text-lg font-bold text-[#0E1B2C] leading-tight">{data.name}</h4>
                    <p className="text-xs text-[#5C677D] mt-0.5">{data.category} · Live NAV: ₹{data.nav}</p>
                </div>

                {/* CALCULATOR CONTROLS */}
                <div className="space-y-4 text-xs">
                    {/* Toggle SIP / Lumpsum */}
                    <div className="flex gap-2 p-1 bg-[#F6F1E8] rounded-lg">
                        <button 
                            onClick={() => { setCalcType("SIP"); setCalcResult(null); }}
                            className={`flex-1 py-2 text-center rounded-md font-semibold transition-all ${calcType === "SIP" ? "bg-[#024396] text-white shadow" : "text-[#5C677D]"}`}
                        >
                            Monthly SIP
                        </button>
                        <button 
                            onClick={() => { setCalcType("Lumpsum"); setCalcResult(null); }}
                            className={`flex-1 py-2 text-center rounded-md font-semibold transition-all ${calcType === "Lumpsum" ? "bg-[#024396] text-white shadow" : "text-[#5C677D]"}`}
                        >
                            One-Time Lumpsum
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-[#5C677D] font-medium mb-1.5">Investment Amount (₹):</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => { setAmount(e.target.value); setCalcResult(null); }}
                            className="w-full bg-white border border-[#E2D8C2] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0E1B2C] focus:border-[#024396]"
                        />
                    </div>

                    {/* Quick Period Buttons vs Custom Mode */}
                    <div>
                        <label className="block text-[#5C677D] font-medium mb-1.5">Select Past Timeline:</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[3, 5, 7].map((yr) => (
                                <button
                                    key={yr}
                                    onClick={() => { setCustomMode(false); setYearsAgo(yr); }}
                                    className={`py-2 rounded-xl border font-bold text-center transition-all ${!customMode && yearsAgo === yr ? "bg-[#024396]/10 border-[#024396] text-[#024396]" : "bg-white border-[#E2D8C2] text-[#5C677D]"}`}
                                >
                                    {yr} Years Ago
                                </button>
                            ))}
                            <button
                                onClick={() => { setCustomMode(true); setCalcResult(null); }}
                                className={`py-2 rounded-xl border font-bold text-center transition-all ${customMode ? "bg-[#024396]/10 border-[#024396] text-[#024396]" : "bg-white border-[#E2D8C2] text-[#5C677D]"}`}
                            >
                                Custom Date
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Inputs (Conditional) */}
                    {customMode && (
                        <div className="grid grid-cols-2 gap-3 bg-[#F6F1E8]/40 p-3 rounded-xl border border-[#E2D8C2]/40">
                            <div>
                                <label className="block text-[10px] uppercase text-[#5C677D] mb-1">Month</label>
                                <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} className="w-full bg-white border border-[#E2D8C2] rounded-lg p-2 font-medium">
                                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-[#5C677D] mb-1">Year</label>
                                <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} className="w-full bg-white border border-[#E2D8C2] rounded-lg p-2 font-medium">
                                    {["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={() => calculatePastReturns(0, true)}
                                className="col-span-2 mt-2 w-full bg-[#024396] text-white py-2 rounded-lg font-bold shadow-sm"
                            >
                                Run Historical Check
                            </button>
                        </div>
                    )}
                </div>

                {/* VISUAL WEALTH MATRIX RESULT */}
                <div className="mt-6 border-t border-[#E2D8C2] pt-4">
                    {loadingCalc && (
                        <div className="text-center py-6 text-xs text-[#024396] font-medium animate-pulse">
                            🔄 Parsing historical AMFI daily NAV tables...
                        </div>
                    )}

                    {!loadingCalc && calcResult && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-[#F6F1E8]/60 p-3 rounded-xl border border-[#E2D8C2]/40">
                                    <span className="text-[#5C677D] text-[10px] block font-medium">Total Capital Invested</span>
                                    <span className="text-base font-bold text-[#0E1B2C] block mt-0.5">₹{calcResult.invested.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-[#024396]/5 p-3 rounded-xl border border-[#024396]/10">
                                    <span className="text-[#024396] text-[10px] block font-bold">Estimated Wealth Value</span>
                                    <span className="text-lg font-extrabold text-[#024396] block mt-0.5">₹{calcResult.currentValue.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="bg-white border border-[#E2D8C2] p-3 rounded-xl flex justify-between items-center text-xs shadow-sm">
                                <div>
                                    <span className="text-[#5C677D] text-[10px] block">Net Wealth Gain (Profit)</span>
                                    <span className="text-sm font-bold text-emerald-600 mt-0.5">+₹{calcResult.profit.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#5C677D] text-[10px] block">Absolute Growth</span>
                                    <span className="text-sm font-extrabold text-[#024396] mt-0.5">{calcResult.returnsPct}%</span>
                                </div>
                            </div>
                            
                            <p className="text-[9px] text-[#8A93A6] italic text-center mt-2">
                                *Calculations mapped back to actual historical fund pricing as of {calcResult.asOfDate}. Mutual fund investments are subject to market risks.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
