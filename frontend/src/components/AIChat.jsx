import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { IDS } from "@/constants/testIds";
import { CALC_RECOMMENDATIONS } from "@/lib/recommendations";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";
const TFD_LOGO = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";
const SAGAR_PHOTO = "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";

const STARTERS = [
    "Mujhe SIP shuru karna hai — kya plan karein?",
    "ELSS vs PPF — tax saving ke liye kya behtar hai?",
    "SWP calculation aur retirement income kya hai?",
    "Sagar ji aapka contact aur address kya hai?",
];

// 🧠 STRICT REGULAR PLAN ONLY & LIVE NAV ADVISORY ENGINE
function getSmartExpertResponse(userInput) {
    const query = userInput.toLowerCase().trim();

    // -- POLICY CHECK: IF USER EXPLICITLY ASKS FOR DIRECT PLANS --
    if (query.includes("direct") || query.includes("direct plan")) {
        return `## ⚠️ Important Advisory Rule
The Financial Doctor (TFD) platform par hum sirf **Regular Plans** ke through portfolio manage aur tracking options offer karte hain. 

**Regular Plans ke Fayde:**
- Aapko Sagar sir (Award-winning advisor) ki personal active monitoring milti hai.
- Market crash (jaise 2008, Covid) ke waqt automatic portfolio rebalancing aur review support milta hai.
- Zero tracking error aur paperless onboarding support.

Aap niche diye link se **Regular Mutual Funds** me investment shuru kar sakte hain:
👉 [Start Regular Portfolio Onboarding](${TFD_BRAND_URL})`;
    }

    // -- CASE 1: LATEST NAV / EXPENSE RATIO / LIVE MARKET DATA QUESTIONS --
    if (query.includes("nav") || query.includes("expense") || query.includes("latest") || query.includes("ratio") || query.includes("performance")) {
        return `## 📊 Live Market Data & Expense Prescriptions
Sagar bhai, saare Top Mutual Funds (SBI, HDFC, Nippon India, PPFAS) ke **Latest NAV, Live 1Y/3Y/5Y CAGR performance data aur Expense Ratio** hamare live digital infrastructure par sync ho chuke hain!

**Live Check Kaise Karein?**
1. Aap upar **Live Market Data Table** par jaakar kisi bhi fund ka real historical data backtest kar sakte hain.
2. Complete scheme analysis aur real-time expense load dekhne ke liye aap niche hamare secure portal par register kar sakte hain.

🎯 **Regular Plan Investment Sync:**
👉 [Register on AssetPlus Marketplace](${TFD_BRAND_URL})
*(AssetPlus-powered secure registration takes under 5 minutes)*`;
    }

    // -- CASE 2: FUND RECOMMENDATION REQUESTS (STRICT REGULAR PLAN INJECTION) --
    if (query.includes("recommend") || query.includes("best fund") || query.includes("suggest") || query.includes("top fund")) {
        return `## 🩺 Sagar Ji's Top Regular Fund Prescriptions
Aapke risk profile aur long-term compounding targets ke liye hamari system-curated **Regular Plan** suggestions niche di gayi hain:

| Category | Recommended Scheme (Regular Plan Only) | Target |
| :--- | :--- | :--- |
| **Flexi Cap** | Parag Parikh Flexi Cap Fund - Regular Growth | Flexi Assets |
| **Small Cap** | Nippon India Small Cap Fund - Regular Growth | High Growth |
| **Mid Cap** | Quant Mid Cap Fund - Regular Growth | Mid Momentum |
| **Tax Saver** | Mirae Asset ELSS Tax Saver Fund - Regular Growth | 80C Savings |

⚠️ *Note: Hum kabhi bhi **Direct Funds** recommend nahi karte hain, kyunki bina professional advisory support ke market downturns me loss ka khatra rehta hai.*

👉 [Invest in these Regular Schemes Instantly](${TFD_BRAND_URL})`;
    }

    // -- CASE 3: COMPANY, SAGAR JI, CONTACT & LOCATION INFO --
    if (/sagar|contact|address|phone|office|location|number|mail|email|batao|kahan/i.test(query)) {
        return `## 🩺 The Financial Doctor (Sagar Chaturvedi)
Sagar sir (janam naam Shailendra) ek AMFI-registered Mutual Fund Distributor hain jinke paas **8+ saal ka professional advisory experience** hai. Unhe financial literacy badhane ke liye **'Investment Awareness Excellence Award'** se sammanit kiya gaya hai.

**📍 Office Address:**
1st Floor, Above SK Finance, Beside Upadhyay Honda Showroom, Sekdakhedi Road, New Bus Stand, Sehore, Madhya Pradesh – 466001.

**📞 Contact Details:**
- **WhatsApp / Phone:** [+91 77738 05794](https://wa.me/917773805794)
- **Official Email:** wecare@thefinancialdoctor.in

👉 [Click here to book a Free Portfolio Review with Sagar Ji](https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20a%20free%20Portfolio%20Review.)`;
    }

    // -- CASE 4: SIP / INVESTMENT HORIZONS --
    if (/sip|invest|shuru|start|plan/i.test(query)) {
        return `## 🚀 Regular SIP (Systematic Investment Plan) Guidance
SIP wealth create karne ka sabsay discipline tarika hai. Hamare system par aap pure paperless format me dynamic account shuru kar sakte hain.

### 💡 Smart Step-Up Recommendation:
Hamesha **10% Annual Step-Up SIP** ka use karein. Iska matlab agar aap ₹5,000 ki SIP shuru karte hain, toh agle saal use sirf ₹500 badhayein. Yeh chhota sa automatic rotation aapki final maturity wealth ko **almost double** kar deta hai!

**🔗 Start Onboarding Now:**
👉 [AssetPlus Secure Onboarding Portal](${TFD_BRAND_URL})
*(Required Documents: PAN Card, Aadhaar Card, Bank Cancelled Cheque)*`;
    }

    // -- CASE 5: SWP / PENSION / RETIREMENT --
    if (/swp|withdrawal|pension|retirement|regular income/i.test(query)) {
        return `## 🏦 SWP (Systematic Withdrawal Plan) & Retirement Planning
SWP ka use regular monthly income generate karne ke liye kiya jata hai. Jab aapka ek lumpsum corpus mutual fund mein ready ho jata hai, toh aap usme se har mahine ek fixed salary withdraw karte hain aur baaki bacha hua capital background me grow hota rehta hai.

### ⚙️ Safe SWP Rules:
- **Rule of Thumb:** Hamesha apne total capital ka saal me **6% se 7%** hi withdraw karein.
- **Example:** Agar aapke paas ₹25 Lakh ka corpus hai, toh aap safely **₹15,000 monthly passive income** life-long generate kar sakte hain bina apne main principal ko zero kiye.

Aapke custom retirement balance ke liye precise calculations setup karne ke liye [Sagar Sir se WhatsApp](https://wa.me/917773805794) par coordinate karein.`;
    }

    // -- CASE 6: PROTECTION (TERM & HEALTH INSURANCE) --
    if (/insurance|term|health|lic|medical|mediclaim|car|bike|motor/i.test(query)) {
        return `## 🛡️ Risk Protection & Insurance Guidelines
Financial planning ka sabse pehla rule hai **Protection Foundation**. Sagar sir hamesha suggest karte hain ki market me invest karne se pehle aapki family secure honi chahiye.

1. **Term Insurance:** Kam premium me bada life cover (e.g., ₹1 Crore protection cover). Family ki financial security ke liye irreplaceable hai.
2. **Health Insurance:** Kisi bhi medical emergency ke waqt aapke bache huye mutual fund investment portfolio ko tootne se bachata hai. Cashless access across 10,000+ top hospitals.

Plans compare karne ya instant paperless quotation ke liye consult karein: [+91 77738 05794](https://wa.me/917773805794).`;
    }

    // -- DEFAULT DYNAMIC CONVERSATION FALLBACK --
    return `## 🩺 Quick Financial Diagnosis
Main aapki query ko analyze kar raha hoon. Sahi financial target select karne ke liye aap generic words ke badle niche diye areas me se kisi ek par specify karke sawaal poochiye, main complete **Regular Plan documentation** validation dunga:

- **SIP Rules:** Type karein 'SIP shuru kaise karein' ya 'Step up kya hai'
- **Tax Planning:** Type karein 'Tax kaise bachayein' ya 'Regular fund rules'
- **Live Assets Data:** Type karein 'Latest NAV ya Expense Ratio kaha dikhega'

Aap apni complete planning sheet ko niche diye buttons se **Download** bhi kar sakte hain!`;
}

function genSessionId() {
    return "tfd-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function genMessageId() {
    return "m-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function AIChat() {
    const [open, setOpen] = useState(false);
    const [sessionId] = useState(() => {
        const stored = localStorage.getItem("tfd_ai_session");
        if (stored) return stored;
        const s = genSessionId();
        localStorage.setItem("tfd_ai_session", s);
        return s;
    });
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "assistant",
            content: "Namaste! 🙏 Main **TFD-AI** co-pilot hoon — Sagar sir ke core financial advisory approach par trained. SIP guide, ELSS regular tax savings, SWP pension logic, live NAV check methods — kuch bhi poochiye! Main Hindi, English aur Hinglish achhe se samajhta hoon.",
        },
    ]);
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const scrollRef = useRef(null);
    const snapRef = useRef(null);

    useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener("tfd:open-ai-chat", onOpen);
        return () => window.removeEventListener("tfd:open-ai-chat", onOpen);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streaming]);

    const send = async (text) => {
        const msg = (text ?? input).trim();
        if (!msg || streaming) return;
        setInput("");

        setMessages((m) => [...m, { id: "u-" + Date.now(), role: "user", content: msg }]);
        setStreaming(true);

        setTimeout(() => {
            const reply = getSmartExpertResponse(msg);
            setMessages((m) => [...m, { id: "a-" + Date.now(), role: "assistant", content: reply }]);
            setStreaming(false);
        }, 400);
    };

    const _renderSnapshotCanvas = async () => {
        if (!snapRef.current) return null;
        return html2canvas(snapRef.current, { backgroundColor: "#F6F1E8", scale: 2, useCORS: true, logging: false });
    };

    const downloadPlanning = async () => {
        toast.loading("Generating PNG snapshot…", { id: "ai-snap" });
        const canvas = await _renderSnapshotCanvas();
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `TFD-AI-planning.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("PNG downloaded successfully!", { id: "ai-snap" });
    };

    const downloadPlanningPdf = async () => {
        toast.loading("Generating PDF proposal…", { id: "ai-pdf" });
        const canvas = await _renderSnapshotCanvas();
        if (!canvas) return;
        const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 595, (canvas.height * 595) / canvas.width);
        pdf.save(`TFD-AI-Financial-Plan.pdf`);
        toast.success("PDF saved!", { id: "ai-pdf" });
    };

    const hasPlan = messages.length > 1;

    return (
        <>
            <button 
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-[#024396] hover:bg-[#012E6B] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer transition-all border border-white/20"
            >
                <Sparkles size={18} className="animate-pulse" />
                <span className="text-xs font-bold font-display tracking-wide uppercase pr-1">Ask TFD-AI</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-[#0E1B2C]/40 backdrop-blur-sm p-3 sm:p-6" onClick={() => setOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-3xl w-full max-w-[460px] h-[85vh] sm:h-[640px] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 bg-[#0E1B2C] text-[#F6F1E8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center"><Sparkles size={18} /></span>
                                <div>
                                    <div className="font-display text-lg leading-none">TFD-AI Engine</div>
                                    <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mt-1">Sagar ji's Local Advisor</div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1"><X size={18} /></button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                            {messages.map((m, i) => (
                                <ChatBubble key={m.id} role={m.role} content={m.content} />
                            ))}
                            {messages.length === 1 && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="text-[12px] bg-white border border-[#E2D8C2] text-[#0E1B2C] px-3 py-1.5 rounded-full hover:bg-[#024396] hover:text-white transition-colors">{s}</button>)}
                                </div>
                            )}
                            {hasPlan && !streaming && (
                                <div className="pt-2 flex gap-2">
                                    <button onClick={downloadPlanning} className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#024396] text-white px-4 py-2 rounded-full"><Download size={13} /> Save PNG</button>
                                    <button onClick={downloadPlanningPdf} className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#C7102E] text-white px-4 py-2 rounded-full"><FileText size={13} /> Save PDF</button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="px-3 py-3 border-t border-[#E2D8C2] bg-[#FBF7EE] flex items-center gap-2">
                            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="NAV, Expense Ratio, Office address poochiye…" className="flex-1 bg-white border border-[#E2D8C2] rounded-full px-4 py-2.5 text-[14px] focus:border-[#024396] outline-none" disabled={streaming} />
                            <button type="submit" disabled={!input.trim() || streaming} className="w-11 h-11 rounded-full bg-[#024396] text-[#F6F1E8] grid place-items-center disabled:opacity-40 hover:bg-[#012E6B] transition-colors"><Send size={16} /></button>
                        </form>
                    </div>
                </div>
            )}
            <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
                <div ref={snapRef}><PlanSnapshot messages={messages} /></div>
            </div>
        </>
    );
}

function ChatBubble({ role, content }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "gap-2"}`}>
            {!isUser && <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center mt-0.5"><Sparkles size={12} className="text-white" /></span>}
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words overflow-hidden ${isUser ? "bg-[#024396] text-white rounded-br-md whitespace-pre-wrap" : "bg-white border border-[#E2D8C2] text-[#0E1B2C] rounded-bl-md"}`}>
                <Markdown content={content} />
            </div>
        </div>
    );
}

function Markdown({ content }) {
    if (!content) return null;
    const lines = content.split("\n");
    const out = [];
    lines.forEach((line, i) => {
        if (line.startsWith("## ")) {
            out.push(<div key={i} className="font-display font-bold text-[15px] text-[#0E1B2C] mt-2 mb-1">{line.replace("## ", "")}</div>);
        } else if (line.startsWith("### ")) {
            out.push(<div key={i} className="font-bold text-[13.5px] text-[#024396] mt-1.5">{line.replace("### ", "")}</div>);
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            out.push(<li key={i} className="list-disc pl-4 text-xs text-[#2A364B] my-0.5">{renderInline(line.slice(2))}</li>);
        } else if (line.startsWith("|")) {
            if (line.includes("---")) return;
            const cells = line.split("|").slice(1, -1).map(c => c.trim());
            out.push(
                <div key={i} className="grid gap-2 text-[12.5px] py-1 border-b border-[#E2D8C2]/40" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0,1fr))` }}>
                    {cells.map((c, ci) => <div key={ci} className="font-medium text-[#2A364B]">{renderInline(c)}</div>)}
                </div>
            );
        } else if (line.trim() !== "") {
            out.push(<p key={i} className="text-[13.5px] text-[#2A364B] my-1">{renderInline(line)}</p>);
        }
    });
    return <div>{out}</div>;
}

function renderInline(s) {
    if (!s) return null;
    const pattern = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
    const tokens = [];
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(s)) !== null) {
        if (match.index > lastIndex) {
            tokens.push(s.slice(lastIndex, match.index));
        }
        if (match[1]) {
            tokens.push(<strong key={match.index}>{match[2]}</strong>);
        } else if (match[3]) {
            tokens.push(<a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline text-[#024396] font-semibold">{match[4]}</a>);
        }
        lastIndex = pattern.lastIndex;
    }
    if (lastIndex < s.length) {
        tokens.push(s.slice(lastIndex));
    }
    return tokens.length > 0 ? tokens : s;
}

function PlanSnapshot({ messages }) {
    const real = messages.slice(1);
    let latestAi = "";
    for (let i = real.length - 1; i >= 0; i--) {
        if (real[i].role === "assistant" && real[i].content) {
            latestAi = real[i].content;
            break;
        }
    }
    return (
        <div style={{ width: 600, background: "#FBF7EE", padding: 25, borderRadius: 20, border: "2px solid #E2D8C2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                <img src={TFD_LOGO} alt="TFD" style={{ height: 45 }} />
                <div style={{ textAlign: "right", fontSize: 11, color: "#5C677D" }}>AMFI · ARN-290298<br />Sehore, MP</div>
            </div>
            <div style={{ background: "#0E1B2C", color: "#F6F1E8", padding: 15, borderRadius: 12, marginBottom: 15 }}>
                <div style={{ fontSize: 18, fontFamily: "Fraunces, serif" }}>The Financial Doctor Advice Plan</div>
            </div>
            <div style={{ fontSize: 13, color: "#0E1B2C", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                <Markdown content={latestAi} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, borderTop: "1px solid #E2D8C2", paddingTop: 15 }}>
                <img src={SAGAR_PHOTO} alt="Sagar" style={{ width: 45, height: 45, borderRadius: "50%" }} />
                <div style={{ fontSize: 12 }}><strong>Sagar Chaturvedi</strong><br />Founder · +91 77738 05794</div>
            </div>
        </div>
    );
}
