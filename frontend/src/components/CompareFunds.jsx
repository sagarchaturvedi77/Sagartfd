import React, { useState } from "react";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { MASTER_FUNDS, fetchFund, searchFundsByName, fmtPct } from "@/lib/fundData";

// Real, live fund comparison — up to 3 schemes, real NAV-derived CAGR via
// MFAPI.in (same data source/cache as the Top Funds section). Starts with
// two curated funds pre-loaded so the table isn't empty on first paint.
const DEFAULT_CODES = [MASTER_FUNDS[0].code, MASTER_FUNDS[3].code];

export default function CompareFunds() {
  const [selected, setSelected] = useState([]); // [{code, name, category, fund_house, ...loaded fields}]
  const [loadingCodes, setLoadingCodes] = useState(new Set());
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadFund = async (code, category) => {
    if (selected.some((f) => f.code === code) || selected.length >= 3) return;
    setLoadingCodes((s) => new Set(s).add(code));
    try {
      const data = await fetchFund(code);
      setSelected((prev) =>
        prev.some((f) => f.code === code) ? prev : [...prev, { ...data, category: category || data.scheme_category }]
      );
    } catch {
      // fetchFund already caches successes; a transient failure just means
      // this fund doesn't get added — no fake fallback numbers.
    } finally {
      setLoadingCodes((s) => {
        const next = new Set(s);
        next.delete(code);
        return next;
      });
    }
  };

  React.useEffect(() => {
    DEFAULT_CODES.forEach((code) => {
      const master = MASTER_FUNDS.find((f) => f.code === code);
      loadFund(code, master?.category);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (searchQ.trim().length < 3) {
      setSearchResults([]);
      return undefined;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        setSearchResults(await searchFundsByName(searchQ));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const removeFund = (code) => setSelected((prev) => prev.filter((f) => f.code !== code));

  return (
    <section className="bg-white py-16 px-6 border-t border-[#E2D8C2]">
      <div className="container-x max-w-5xl mx-auto">
        <div className="eyebrow text-center">
          <TrendingUp size={14} className="inline -mt-0.5 mr-1.5" /> Live NAV comparison
        </div>
        <h2 className="text-3xl font-serif text-[#0E1B2C] mb-3 mt-2 text-center">Compare Funds</h2>
        <p className="text-[#2A364B]/80 text-center max-w-2xl mx-auto mb-8">
          Search any mutual fund and add up to 3 to compare side by side — returns are calculated
          live from real historical NAV, the same feed used across this site.
        </p>

        {/* SEARCH */}
        <div className="relative max-w-xl mx-auto mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]">
            {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          </div>
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search a fund to add (e.g. HDFC Flexi Cap)..."
            disabled={selected.length >= 3}
            className="w-full bg-[#FBF7EE] border border-[#E2D8C2] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396] disabled:opacity-50"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-[#E2D8C2] rounded-2xl max-h-[260px] overflow-y-auto shadow-xl divide-y divide-[#E2D8C2]/40">
              {searchResults.map((r) => (
                <button
                  key={r.schemeCode}
                  onClick={() => {
                    loadFund(String(r.schemeCode));
                    setSearchQ("");
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#2A364B] hover:bg-[#FBF7EE] transition-colors"
                >
                  {r.schemeName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* QUICK PICKS */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {MASTER_FUNDS.slice(0, 8).map((f) => {
            const isSelected = selected.some((s) => s.code === f.code);
            const isLoading = loadingCodes.has(f.code);
            return (
              <button
                key={f.code}
                onClick={() => (isSelected ? removeFund(f.code) : loadFund(f.code, f.category))}
                disabled={!isSelected && selected.length >= 3}
                className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? "bg-[#024396] text-white border-[#024396]"
                    : "bg-[#FBF7EE] text-[#2A364B] border-[#E2D8C2] hover:border-[#024396]"
                }`}
              >
                {isLoading ? <Loader2 className="inline animate-spin" size={12} /> : f.category}
              </button>
            );
          })}
        </div>

        {/* COMPARISON TABLE */}
        {selected.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border border-[#E2D8C2] rounded-xl text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]">
                  <th className="text-left p-4 font-display text-[#0E1B2C]">Fund</th>
                  {selected.map((f) => (
                    <th key={f.code} className="text-left p-4 font-display text-[#024396] min-w-[160px]">
                      <div className="flex items-start justify-between gap-2">
                        <span>{f.name}</span>
                        <button
                          onClick={() => removeFund(f.code)}
                          aria-label={`Remove ${f.name}`}
                          className="text-[#5C677D] hover:text-[#C7102E] shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Category", (f) => f.category || f.scheme_category],
                  ["Fund House", (f) => f.fund_house],
                  ["1Y CAGR", (f) => fmtPct(f.return_1y)],
                  ["3Y CAGR", (f) => fmtPct(f.return_3y)],
                  ["5Y CAGR", (f) => fmtPct(f.return_5y)],
                  ["NAV", (f) => `Rs. ${Number(f.nav).toFixed(2)} (${f.nav_date})`],
                ].map(([label, get]) => (
                  <tr key={label} className="border-t border-[#E2D8C2]">
                    <td className="p-4 text-[#2A364B]/70 font-medium">{label}</td>
                    {selected.map((f) => (
                      <td key={f.code} className="p-4 text-[#2A364B]">{get(f)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-[#5C677D] mt-3 text-center">
              Live NAV via MFAPI.in (AMFI feed). Past returns don't guarantee future performance.
            </p>
          </div>
        ) : (
          <p className="text-center text-[#2A364B]/60">Search or pick a fund above to start comparing.</p>
        )}
      </div>
    </section>
  );
}
