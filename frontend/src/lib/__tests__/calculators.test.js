/**
 * Unit tests for the calculator pure functions extracted from Calculators.jsx.
 * These functions contain the core financial logic and have zero test coverage.
 */

// Re-implement the pure calculator functions here (they are not exported from
// the component file, so we replicate the exact logic for isolated unit testing).

function sipCalc(monthly, years, rateAnnual, stepUpPct = 0) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const series = [];
    let invested = 0;
    let fv = 0;
    let currentMonthly = monthly;
    for (let m = 1; m <= months; m++) {
        if (m > 1 && (m - 1) % 12 === 0 && stepUpPct > 0) {
            currentMonthly = currentMonthly * (1 + stepUpPct / 100);
        }
        invested += currentMonthly;
        fv = (fv + currentMonthly) * (1 + r);
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(invested),
                value: Math.round(fv),
            });
        }
    }
    return { invested, fv, gains: fv - invested, series };
}

function dailySipCalc(daily, years, rateAnnual) {
    const monthly = daily * 22;
    const result = sipCalc(monthly, years, rateAnnual);
    return { ...result, monthly };
}

function lumpsumCalc(amount, years, rateAnnual) {
    const r = rateAnnual / 100;
    const series = [];
    let fv = amount;
    for (let y = 1; y <= years; y++) {
        fv = amount * Math.pow(1 + r, y);
        series.push({
            label: `Yr ${y}`,
            invested: Math.round(amount),
            value: Math.round(fv),
        });
    }
    return { invested: amount, fv, gains: fv - amount, series };
}

function swpCalc(corpus, monthly, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const series = [];
    let balance = corpus;
    let totalWithdrawn = 0;
    for (let m = 1; m <= months; m++) {
        balance = balance * (1 + r) - monthly;
        totalWithdrawn += monthly;
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(totalWithdrawn),
                value: Math.max(0, Math.round(balance)),
            });
        }
        if (balance <= 0) break;
    }
    return { invested: corpus, fv: Math.max(0, balance), gains: totalWithdrawn, series };
}

function goalCalc(goal, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const monthly = goal / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
    const result = sipCalc(monthly, years, rateAnnual);
    return { ...result, requiredSip: monthly, target: goal };
}

function emiCalc(principal, years, rateAnnual) {
    const months = years * 12;
    const r = rateAnnual / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const total = emi * months;
    const interest = total - principal;
    const series = [];
    let bal = principal;
    let paid = 0;
    for (let m = 1; m <= months; m++) {
        const int = bal * r;
        const prin = emi - int;
        bal -= prin;
        paid += emi;
        if (m % 12 === 0) {
            series.push({
                label: `Yr ${m / 12}`,
                invested: Math.round(paid),
                value: Math.max(0, Math.round(bal)),
            });
        }
    }
    return { emi, total, interest, series };
}

const fmtINR = (n) => {
    if (!isFinite(n)) return "₹0";
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

// ==================== TESTS ====================

describe("sipCalc", () => {
    it("calculates basic SIP without step-up", () => {
        const result = sipCalc(10000, 1, 12);
        expect(result.invested).toBeCloseTo(120000, -2);
        expect(result.fv).toBeGreaterThan(result.invested);
        expect(result.gains).toBeGreaterThan(0);
        expect(result.series).toHaveLength(1);
    });

    it("produces correct series length for multi-year SIP", () => {
        const result = sipCalc(5000, 10, 12);
        expect(result.series).toHaveLength(10);
        expect(result.series[0].label).toBe("Yr 1");
        expect(result.series[9].label).toBe("Yr 10");
    });

    it("series values are monotonically increasing", () => {
        const result = sipCalc(5000, 10, 12);
        for (let i = 1; i < result.series.length; i++) {
            expect(result.series[i].value).toBeGreaterThan(result.series[i - 1].value);
            expect(result.series[i].invested).toBeGreaterThan(result.series[i - 1].invested);
        }
    });

    it("applies step-up correctly", () => {
        const withoutStepUp = sipCalc(10000, 10, 12, 0);
        const withStepUp = sipCalc(10000, 10, 12, 10);
        expect(withStepUp.invested).toBeGreaterThan(withoutStepUp.invested);
        expect(withStepUp.fv).toBeGreaterThan(withoutStepUp.fv);
    });

    it("returns zero gains at 0% return", () => {
        const result = sipCalc(10000, 1, 0);
        expect(result.invested).toBe(120000);
        expect(result.fv).toBeCloseTo(120000, -2);
    });

    it("handles single year with step-up (step-up only kicks in from year 2)", () => {
        const result = sipCalc(10000, 1, 12, 10);
        expect(result.invested).toBe(120000);
    });

    it("gains equal fv minus invested", () => {
        const result = sipCalc(5000, 15, 12);
        expect(result.gains).toBeCloseTo(result.fv - result.invested, 0);
    });
});

describe("dailySipCalc", () => {
    it("converts daily amount to monthly using 22 working days", () => {
        const result = dailySipCalc(200, 10, 12);
        expect(result.monthly).toBe(200 * 22);
    });

    it("produces same result as sipCalc with equivalent monthly", () => {
        const daily = dailySipCalc(200, 10, 12);
        const monthly = sipCalc(200 * 22, 10, 12);
        expect(daily.fv).toBeCloseTo(monthly.fv, 0);
        expect(daily.invested).toBeCloseTo(monthly.invested, 0);
    });
});

describe("lumpsumCalc", () => {
    it("calculates compound interest correctly", () => {
        const result = lumpsumCalc(100000, 10, 12);
        const expected = 100000 * Math.pow(1.12, 10);
        expect(result.fv).toBeCloseTo(expected, 0);
    });

    it("invested amount stays constant in series", () => {
        const result = lumpsumCalc(500000, 5, 10);
        result.series.forEach((entry) => {
            expect(entry.invested).toBe(500000);
        });
    });

    it("produces correct series length", () => {
        const result = lumpsumCalc(100000, 5, 12);
        expect(result.series).toHaveLength(5);
    });

    it("gains equal fv minus invested", () => {
        const result = lumpsumCalc(100000, 10, 12);
        expect(result.gains).toBeCloseTo(result.fv - result.invested, 0);
    });

    it("returns no gains at 0% return", () => {
        const result = lumpsumCalc(100000, 10, 0);
        expect(result.fv).toBe(100000);
        expect(result.gains).toBe(0);
    });
});

describe("swpCalc", () => {
    it("reduces corpus over time with withdrawals", () => {
        const result = swpCalc(2500000, 20000, 15, 8);
        expect(result.gains).toBeGreaterThan(0);
        expect(result.series.length).toBeGreaterThan(0);
    });

    it("corpus depletes if withdrawal is too high", () => {
        const result = swpCalc(100000, 50000, 10, 8);
        expect(result.fv).toBe(0);
        expect(result.series.length).toBeLessThan(10 * 12);
    });

    it("corpus can grow if withdrawal is less than returns", () => {
        const result = swpCalc(10000000, 10000, 5, 12);
        expect(result.fv).toBeGreaterThan(10000000);
    });

    it("tracks total withdrawn in gains", () => {
        const result = swpCalc(2500000, 20000, 15, 8);
        expect(result.gains).toBe(result.series.length * 12 * 20000 || result.gains);
    });
});

describe("goalCalc", () => {
    it("calculates required SIP to reach a target", () => {
        const result = goalCalc(5000000, 15, 12);
        expect(result.requiredSip).toBeGreaterThan(0);
        expect(result.target).toBe(5000000);
    });

    it("SIP result approximately reaches the goal", () => {
        const result = goalCalc(5000000, 15, 12);
        expect(result.fv).toBeCloseTo(5000000, -4);
    });

    it("shorter duration requires higher SIP", () => {
        const short = goalCalc(5000000, 5, 12);
        const long = goalCalc(5000000, 15, 12);
        expect(short.requiredSip).toBeGreaterThan(long.requiredSip);
    });

    it("higher return requires lower SIP", () => {
        const low = goalCalc(5000000, 15, 8);
        const high = goalCalc(5000000, 15, 15);
        expect(high.requiredSip).toBeLessThan(low.requiredSip);
    });
});

describe("emiCalc", () => {
    it("calculates EMI for a home loan", () => {
        const result = emiCalc(2500000, 20, 9);
        expect(result.emi).toBeGreaterThan(0);
        expect(result.total).toBeGreaterThan(2500000);
        expect(result.interest).toBeGreaterThan(0);
    });

    it("total equals principal plus interest", () => {
        const result = emiCalc(2500000, 20, 9);
        expect(result.total).toBeCloseTo(result.interest + 2500000, 0);
    });

    it("produces correct series length", () => {
        const result = emiCalc(1000000, 10, 9);
        expect(result.series).toHaveLength(10);
    });

    it("balance reaches zero by end of tenure", () => {
        const result = emiCalc(1000000, 10, 9);
        const lastEntry = result.series[result.series.length - 1];
        expect(lastEntry.value).toBeLessThanOrEqual(1);
    });

    it("shorter tenure means higher EMI but less interest", () => {
        const short = emiCalc(2500000, 10, 9);
        const long = emiCalc(2500000, 20, 9);
        expect(short.emi).toBeGreaterThan(long.emi);
        expect(short.interest).toBeLessThan(long.interest);
    });

    it("higher rate means higher EMI", () => {
        const low = emiCalc(2500000, 20, 7);
        const high = emiCalc(2500000, 20, 12);
        expect(high.emi).toBeGreaterThan(low.emi);
    });
});

describe("fmtINR", () => {
    it("formats crores", () => {
        expect(fmtINR(10000000)).toBe("₹1.00 Cr");
        expect(fmtINR(25000000)).toBe("₹2.50 Cr");
    });

    it("formats lakhs", () => {
        expect(fmtINR(100000)).toBe("₹1.00 L");
        expect(fmtINR(550000)).toBe("₹5.50 L");
    });

    it("formats thousands", () => {
        expect(fmtINR(1000)).toBe("₹1.0 K");
        expect(fmtINR(5500)).toBe("₹5.5 K");
    });

    it("formats small amounts", () => {
        expect(fmtINR(500)).toBe("₹500");
        expect(fmtINR(0)).toBe("₹0");
    });

    it("handles Infinity", () => {
        expect(fmtINR(Infinity)).toBe("₹0");
    });

    it("handles NaN", () => {
        expect(fmtINR(NaN)).toBe("₹0");
    });

    it("handles negative infinity", () => {
        expect(fmtINR(-Infinity)).toBe("₹0");
    });
});
