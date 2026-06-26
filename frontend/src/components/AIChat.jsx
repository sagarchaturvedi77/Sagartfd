import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { AI_PLAN_RECOMMENDATIONS } from "@/lib/recommendations";

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

// 🛠️ SMART ADVISORY KNOWLEDGE BASE (HINDI / ENGLISH / HINGLISH)
function getSmartExpertResponse(userInput) {
    const query = userInput.toLowerCase().trim();

    // 1. COMPANY, SAGAR JI, CONTACT & LOCATION INFO
    if (/sagar|contact|address|phone|office|location|number|mail|email|batao|kahan/i.test(query)) {
        return `## 🩺 The Financial Doctor (Sagar Chaturvedi)
Sagar sir (janam naam Shailendra) ek AMFI-registered Mutual Fund Distributor hain jinke paas **8+ saal ka professional advisory experience** hai. Unhe financial literacy badhane ke liye **'Investment Awareness Excellence Award'** se sammanit kiya gaya hai.

**📍 Office Address:**
1st Floor, Above SK Finance, Beside Upadhyay Honda Showroom, Sekdakhedi Road, New Bus Stand, Sehore, Madhya Pradesh – 466001.

**📞 Contact Details:**
- **WhatsApp / Phone:** [+91 77738 05794](https://wa.me/917773805794)
- **Official Email:** wecare@thefinancialdoctor.in
- **Location Scope:** Sehore, Bhopal, aur poore Madhya Pradesh me personal consultation.

Aap niche diye gaye WhatsApp link par click karke direct Sagar sir ke sath appointment fix kar sakte hain!`;
    }

    // 2. TAX SAVING & TAXATION RULES (TAXATION & 80C)
    if (/tax|elss|bacha|80c|ppf|nsc|slab|gains/i.test(query)) {
        return `## 💰 Smart Tax Planning & Rules (Section 80C)
Tax bachane ke liye **ELSS ( there Equity Linked Savings Scheme)** ko sabse best equity mutual fund maana jata hai. Iska lock-in period sirf **3 saal** hai, jo PPF (15 saal) aur Tax Saving FD (5 saal) ke muqable sabse kam hai.

### 📊 Income Tax Rules on Mutual Funds (2026):
| Investment Type | Short Term Tax (STCG) | Long Term Tax (LTCG) |
| :--- | :--- | :--- |
| **Equity Funds** | **20%** (If sold within 1 year) | **12.5%** (After 1 year, up to ₹1.25L profit is Free) |
| **Debt Funds** | As per your Tax Slab Rate | As per your Tax Slab Rate |

**📂 Documents Required for Tax Saving MF:**
PAN Card, Aadhaar Card, Net Banking/UPI Details, aur Aadhaar linked Mobile Number (for digital signature). Onboarding is fully digital in 5 minutes!`;
    }

    // 3. SIP PLANNING & SMART RECOMMENDATIONS
    if (/sip|invest|shuru|start|plan|kise/i.test(query)) {
        return `## 🚀 SIP (Systematic Investment Plan) Guidance
SIP wealth create karne ka sabsay discipline tarika hai. Agar aap investment planning shuru karna chahte hain, toh aap direct hamare onboarding portal se shuru kar sakte hain.

### 💡 Smart Expert Suggestion:
Hamesha **10% Annual Step-Up SIP** ka use karein. Iska matlab agar aap ₹5,000 ki SIP shuru karte hain, toh har saal use sirf ₹500 badhayein. Yeh chhota sa step aapki maturity value ko **almost double** kar deta hai aur aap apne targets 3-4 saal pehle poora kar sakte hain!

**🔗 Start Instantly Now:**
Aap niche link par tap karke digital account setup kar sakte hain:
[AssetPlus Secure Onboarding Portal](https://www.assetplus.in/mfd/ARN-290298)

**📂 KYC Checklist Documents:**
PAN Card · Aadhaar Card · Bank Passbook/Cancelled Cheque.`;
    }

    // 4. SWP / PENSION / RETIREMENT CALCULATIONS
    if (/swp|withdrawal|pension|retirement|regular income/i.test(query)) {
        return `## 🏦 SWP (Systematic Withdrawal Plan) & Retirement Planning
SWP ka use regular monthly income generate karne ke liye kiya jata hai. Jab aapka ek lumpsum corpus mutual fund mein ready ho jata hai, toh aap usme se har mahine ek fixed amout withdraw karte hain aur baaki bacha hua capital grow hota rehta hai.

### ⚙️ Practical SWP Example:
- **Lumpsum Capital:** ₹25 Lakh
- **Expected Return:** 8% to 10% p.a.
- **Safe Monthly Income Withdrawal:** ₹15,000 to ₹18,000 life-long.
- **Result:** Aapka main ₹25 Lakh ka capital safe rahega aur har mahine aapke bank account mein system-generated salary credit hoti rahegi.

Aapke corpus ke hisab se customized swp charts design karne ke liye aap [Sagar Sir se WhatsApp](https://wa.me/917773805794) par coordinate kar sakte hain.`;
    }

    // 5. PROTECTION FOUNDATION (TERM & HEALTH INSURANCE)
    if (/insurance|term|health|lic|medical|mediclaim|car|bike|motor|document/i.test(query)) {
        return `## 🛡️ Risk Protection & Insurance Guidelines
Financial planning ka sabse pehla rule hai **Protection Foundation**. Sagar sir hamesha suggest karte hain ki market me invest karne se pehle aapki family secure honi chahiye.

### 📋 Insurance Categories & Documents:
1. **Term Insurance:** Kam premium me bada life cover (e.g., ₹1 Crore protection cover). Family ki financial security ke liye irreplaceable hai.
2. **Health Insurance:** Kisi bhi medical emergency ke waqt aapke bache huye mutual fund investment portfolio ko tootne se bachata hai. TFD cash-less system provides access across 10,000+ top hospitals.

**📂 Required Documents Checklist:**
- **Mutual Fund / Insurance KYC:** PAN Card, Aadhaar Card, Bank Details.
- **Term Cover Special:** Income Proof (Latest 3 Months Salary slips ya 2 Years ITR Form).

Plans compare karne ya instant paperless quotation ke liye consult karein: [+91 77738 05794](https://wa.me/917773805794).`;
    }

    // 6. DEFAULT INTELLIGENT EXPERT FALLBACK
    return `## 🩺 The Financial Doctor AI Assistant
Main aapke financial goal aur query ko samajh raha hoon. Wealth creation strategy, lumpsum portfolio setup, tax optimization, portfolio review ya live AMFI records validation ke liye aap niche diye buttons ka use karke custom blueprint copy **Download** kar sakte hain ya direct WhatsApp par coordinate kar sakte hain.

**🔗 Fast Access Actions:**
- Direct Digital Onboarding: [AssetPlus Dashboard](${TFD_BRAND_URL})
- Chat with Advisor: [WhatsApp Consultation Link](https://wa.me/917773805794)`;
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
            content: "Namaste! 🙏 Main **TFD-AI** co-pilot hoon — Sagar sir ke core financial advisory approach par trained. SIP guide, ELSS tax savings, SWP pension logic, insurance documentation ya contact metrics — kuch bhi poochiye! Main Hindi, English aur Hinglish achhe se samajhta hoon.",
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

        setMessages((m) => [
            ...m,
            { id: genMessageId(), role: "user", content: msg },
            { id: genMessageId(), role: "assistant", content: "" },
        ]);
        setStreaming(true);

        try {
            // Attempt standard stream delivery
            const resp = await fetch(`${BACKEND_URL}/api/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message: msg }),
            });

            if (!resp.ok || !resp.body) throw new Error("stream-failed");

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const parts = buf.split("\n\n");
                buf = parts.pop() ?? "";
                for (const block of parts) {
                    if (block.startsWith("event: done")) continue;
                    const dataLines = block
                        .split("\n")
                        .filter((l) => l.startsWith("data: "))
                        .map((l) => l.slice(6));
                    if (dataLines.length === 0) continue;
                    const chunk = dataLines.join("\n");
                    if (chunk === "[DONE]") continue;

                    setMessages((m) => {
                        if (m.length === 0) return m;
                        const lastIdx = m.length - 1;
                        const last = m[lastIdx];
                        if (last.role !== "assistant") return m;
                        const updated = { ...last, content: (last.content || "") + chunk };
                        const copy = m.slice();
                        copy[lastIdx] = updated;
                        return copy;
                    });
                }
            }
        } catch (e) {
            // 🛡️ SMART FALLBACK GATEWAY ACTIVE IF LIVE KEY UNPAID OR MISSING
            console.warn("Using smart embedded local framework processing");
            const localReply = getSmartExpertResponse(msg);
            setMessages((m) => {
                if (m.length === 0) return m;
                const lastIdx = m.length - 1;
                const last = m[lastIdx];
                if (last.role !== "assistant") return m;
                const updated = { ...last, content: localReply };
                const copy = m.slice();
                copy[lastIdx] = updated;
                return copy;
            });
        } finally {
            setStreaming(false);
        }
    };

    const _renderSnapshotCanvas = async () => {
        if (!snapRef.current) return null;
        const node = snapRef.current;
        await new Promise((r) => setTimeout(r, 250));
        return html2canvas(node, {
            backgroundColor: "#F6F1E8",
            scale: 2,
            useCORS: true,
            logging: false,
            width: node.offsetWidth,
            height: node.offsetHeight,
            windowWidth: node.offsetWidth,
            windowHeight: node.offsetHeight,
        });
    };

    const _ensurePlanReady = () => {
        const assistantMsgs = messages.filter((m) => m.role === "assistant" && m.content && m.content.trim().length > 0);
        if (assistantMsgs.length < 2) {
            toast.error("Pehle TFD-AI se planning karwaiye, phir download karein.");
            return false;
        }
        return true;
    };

    const downloadPlanning = async () => {
        if (!_ensurePlanReady()) return;
        try {
            toast.loading("Generating your planning PNG…", { id: "ai-snap" });
            const canvas = await _renderSnapshotCanvas();
            if (!canvas) return;
            const link = document.createElement("a");
            link.download = `TFD-AI-planning-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("PNG downloaded — share it on WhatsApp!", { id: "ai-snap" });
        } catch (e) {
            console.error(e);
        }
    };

    const downloadPlanningPdf = async () => {
        if (!_ensurePlanReady()) return;
        try {
            toast.loading("Generating your planning PDF…", { id: "ai-pdf" });
            const canvas = await _renderSnapshotCanvas();
            if (!canvas) return;
            const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW;
            const imgH = (canvas.height * pageW) / canvas.width;
            const imgData = canvas.toDataURL("image/jpeg", 0.92);

            if (imgH <= pageH) {
                pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH, undefined, "FAST");
            } else {
                let remaining = imgH;
                let y = 0;
                while (remaining > 0) {
                    pdf.addImage(imgData, "JPEG", 0, y, imgW, imgH, undefined, "FAST");
                    remaining -= pageH;
                    if (remaining > 0) {
                        pdf.addPage();
                        y -= pageH;
                    }
                }
            }
            pdf.save(`TFD-AI-planning-${Date.now()}.pdf`);
            toast.success("PDF downloaded — share it on WhatsApp!", { id: "ai-pdf" });
        } catch (e) {
            console.error(e);
        }
    };

    const hasPlan = messages.filter((m) => m.role === "assistant").length > 1;

    return (
        <>
            {open && (
                <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-[#0E1B2C]/40 backdrop-blur-sm p-3 sm:p-6" onClick={() => setOpen(false)} data-testid="ai-chat-overlay">
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-3xl w-full max-w-[460px] h-[85vh] sm:h-[640px] flex flex-col shadow-2xl overflow-hidden" data-testid="ai-chat-panel">
                        {/* Header */}
                        <div className="px-5 py-4 bg-[#0E1B2C] text-[#F6F1E8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center"><Sparkles size={18} /></span>
                                <div>
                                    <div className="font-display text-lg leading-none">TFD-AI</div>
                                    <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mt-1">Sagar ji's AI Assistant</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasPlan && (
                                    <>
                                        <button onClick={downloadPlanning} className="hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-[#C7102E] text-white px-3 py-1.5 rounded-full">PNG</button>
                                        <button onClick={downloadPlanningPdf} className="hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-[#024396] text-white px-3 py-1.5 rounded-full">PDF</button>
                                    </>
                                )}
                                <button onClick={() => setOpen(false)} className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4" data-testid="ai-chat-messages">
                            {messages.map((m, i) => (
                                <ChatBubble key={m.id || `msg-${i}`} role={m.role} content={m.content} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
                            ))}
                            {messages.length === 1 && !streaming && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {STARTERS.map((s) => (
                                        <button key={s} onClick={() => send(s)} className="text-[12px] bg-white border border-[#E2D8C2] text-[#0E1B2C] px-3 py-1.5 rounded-full hover:bg-[#024396] hover:text-[#F6F1E8] hover:border-transparent transition-colors">{s}</button>
                                    ))}
                                </div>
                            )}
                            {hasPlan && !streaming && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                    <button onClick={downloadPlanning} className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#024396] text-[#F6F1E8] px-4 py-2 rounded-full"><Download size={13} /> Save PNG</button>
                                    <button onClick={downloadPlanningPdf} className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#C7102E] text-white px-4 py-2 rounded-full"><FileText size={13} /> Save PDF</button>
                                </div>
                            )}
                        </div>

                        {/* Input Form */}
                        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="px-3 py-3 border-t border-[#E2D8C2] bg-[#FBF7EE] flex items-center gap-2">
                            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Apna sawaal poochiye..." className="flex-1 bg-white border border-[#E2D8C2] rounded-full px-4 py-2.5 text-[14px] focus:border-[#024396] outline-none" disabled={streaming} />
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

function ChatBubble({ role, content, streaming }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "gap-2"}`}>
            {!isUser && <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center shrink-0 mt-0.5"><Sparkles size={12} className="text-white" /></span>}
            <div className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words overflow-hidden ${isUser ? "bg-[#024396] text-[#F6F1E8] rounded-br-md whitespace-pre-wrap" : "bg-white border border-[#E2D8C2] text-[#0E1B2C] rounded-bl-md"}`}>
                <Markdown content={content} />
                {streaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#024396] animate-pulse align-middle" />}
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
