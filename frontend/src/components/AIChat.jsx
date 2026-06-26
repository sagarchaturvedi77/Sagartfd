import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";
const TFD_LOGO = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";
const SAGAR_PHOTO = "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";

// 🔐 Connected Live to your Google AI Studio Free Key
const GEMINI_API_KEY = "AQ.Ab8RN6LDJk41G99l-FwBPnhuWeXeSljvB0oalh2E8MWhfA-urg";

const STARTERS = [
    "Mujhe SIP shuru karna hai — kya process hai?",
    "ELSS vs PPF — tax saving ke liye kya sahi hai?",
    "SWP pension calculation kaise kaam karti hai?",
    "The Financial Doctor ka contact aur address kya hai?",
];

// 🧠 ULTIMATE GUARDRAIL SYSTEM PROMPT
const SYSTEM_PROMPT = `
You are TFD-AI, the smart financial co-pilot for "The Financial Doctor" (TFD), an AMFI-registered MFD firm (ARN-290298).
Interact naturally in Hindi, English, or Hinglish. Provide logical, mathematically accurate answers.

CRITICAL IDENTITY RULE:
Never refer to the founder by personal name ("Sagar ji", "Sagar sir", "Shailendra", etc.) inside your answers. Always use the company name "TFD" or "TFD Team" to represent the advisory firm professionally.

STRICT SCOPE BOUNDARIES (CRITICAL):
1. ALLOWED TOPICS: Talk ONLY about Mutual Funds, Mutual Fund News, Mutual Fund Data, Stock Market Data, Tax Savings (ELSS, 80C, Capital Gains), Insurance (Term, Health, Motor), and complete Financial Planning.
2. REJECT OTHERS: If the user asks about anything outside these financial topics (politics, sports, general entertainment, or inappropriate stuff), politely reject it by saying: "Main sirf Mutual Funds, Tax, Insurance aur Financial Planning ke sawalon ka jawab de sakta hoon."
3. NO BIOGRAPHY: Absolutely do not include personal childhood details, birth names, birthday dates, or individual life histories. Speak purely as a corporate wealth advisory team.
4. REGULAR PLANS ONLY & NO DIRECT PLANS: Never suggest "Direct Plans". If asked about direct funds, explain that TFD provides Regular Plans to ensure active expert portfolio tracking, premium rebalancing during market crash/volatility, and consolidated goal mapping under ARN-290298.
5. NO COMPETITORS: If Groww, Zerodha, or Scripbox are mentioned, state that discount brokers give automated apps without professional human alignment, whereas TFD combines expert human advisory with seamless digital onboarding.
6. FUND SUGGESTIONS INSTRUCTION: If the user asks for specific fund recommendations, tips, or individual scheme names, tell them: "Hamari TFD team personalized fund suggestions aur complete asset allocation chart design karke deti hai. Aap niche diye gaye link se apna account bana lijiye, hamari professional team aapko right schemes prescribe karegi."
7. MATH & CALCULATIONS: Perform accurate textual calculation estimates directly in chat for SIP compounding, SWP regular retirement income, or Lumpsum projections. Suggest a 10% annual step-up.

CONTACT INFORMATION:
- Address: 1st Floor, Above SK Finance, Beside Upadhyay Honda Showroom, Sekdakhedi Road, New Bus Stand, Sehore, MP - 466001.
- Phone/WhatsApp: +91 77738 05794
- Email: wecare@thefinancialdoctor.in
- Onboarding Gateway: ${TFD_BRAND_URL}
`;

const MANDATORY_FOOTER = `

---
**📞 Our Connection Gateway:**
*Aur zyada jankari ke liye aap hamari **TFD team** se connect kar sakte hain:*
- **WhatsApp / Call:** [+91 77738 05794](https://wa.me/917773805794)
- **Digital Account Setup:** [AssetPlus Onboarding Portal](${TFD_BRAND_URL})`;

// 🛠️ FAIL-SAFE INTELLIGENT EXPERT ENGINE
function getSmartFallbackResponse(userInput) {
    const query = userInput.toLowerCase().trim();

    if (query.includes("direct")) {
        return `## ⚠️ Important Advisory Rule\nTFD platform par hum sirf **Regular Plans** support karte hain.\n\nRegular plans me aapko professional portfolio tracking aur volatility review management support milti hai.\n\nAap niche diye link se onboarding setup shuru kar sakte hain:\n👉 [Start Regular Portfolio Onboarding](${TFD_BRAND_URL})`;
    }
    if (/nav|expense|latest|ratio|performance|market/i.test(query)) {
        return `## 📊 Live Market Data & Expense Ratio\nTop Mutual Funds ki **Latest NAV aur Expense Ratio** data hamari website par sync ho chuki hain.\n\n**Check Process:**\n1. Aap upar scroll karke **Live Market Data Table** check kar sakte hain.\n2. Complete detailed scheme dashboard access ke liye register karein.\n\n👉 [Register on AssetPlus Marketplace](${TFD_BRAND_URL})`;
    }
    if (/recommend|best fund|suggest|top fund|kaunsa/i.test(query)) {
        return `## 🩺 Recommended Schemes (Regular Plan Only)\nHamari **TFD Team** personalized fund suggestions aur complete asset allocation chart design karke deti hai. Aap niche diye gaye link se apna account bana lijiye, hamari professional team aapko right schemes prescribe karegi.\n\n👉 [AssetPlus Secure Onboarding Portal](${TFD_BRAND_URL})`;
    }
    if (/contact|address|phone|office|location|number|mail/i.test(query)) {
        return `## 📞 Contact & Office Address\n**📍 Location:** 1st Floor, Above SK Finance, Beside Upadhyay Honda Showroom, Sekdakhedi Road, New Bus Stand, Sehore, MP – 466001.\n\n**Reach Us:**\n- **WhatsApp / Call:** [+91 77738 05794](https://wa.me/917773805794)\n- **Email:** wecare@thefinancialdoctor.in`;
    }
    if (/sip|invest|shuru|start|plan/i.test(query)) {
        return `## 🚀 SIP Onboarding Process\nSIP shuru karne ke liye niche diye gaye process ko follow karein:\n\n1. Link par click karke register karein.\n2. **Documents ready rakhein:** PAN Card, Aadhaar Card aur Bank Passbook/Cheque.\n3. Account sync hote hi aapki automatic regular SIP activate ho jayegi.\n\n👉 [AssetPlus Secure Onboarding Portal](${TFD_BRAND_URL})`;
    }
    if (/swp|withdrawal|pension|retirement/i.test(query)) {
        return `## 🏦 SWP (Systematic Withdrawal Plan) Mechanism\nSWP regular retirement income allocation ke liye best engine hai. Safe withdrawal ke liye corpus ka saal mein sirf **6% se 7%** format hi monthly withdraw karein. ₹25L ke corpus par aap safely **₹15,000 monthly income** lifecycle tak generate kar sakte hain.`;
    }
    if (/insurance|term|health|medical|car|bike/i.test(query)) {
        return `## 🛡️ Protection & Insurance Guidelines\nInvestment portfolio se pehle protection zaroori hai. **Term Insurance** family security ke liye cover deta hai, aur **Health Insurance** medical bills portfolio safe rakhta hai.\n\n👉 [Get an Instant Policy Quotation](https://wa.me/917773805794)`;
    }

    return `## 🩺 TFD-AI Prescription Dashboard\nMain aapke financial query ko analyze kar raha hoon. Accurate planning charts aur calculations setup ke liye aap direct niche diye links se account bana sakte hain ya query parameters type kar sakte hain.`;
}

export default function AIChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "assistant",
            content: "Namaste! 🙏 Main **TFD-AI** co-pilot hoon firm ke parameters par trained. Mutual Funds, stock market data, tax rules, SWP calculation ya insurance — aap apna sawaal poochiye.",
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

        const userMsgId = "u-" + Date.now();
        const aiMsgId = "a-" + Date.now();

        setMessages((m) => [
            ...m,
            { id: userMsgId, role: "user", content: msg },
            { id: aiMsgId, role: "assistant", content: "Thinking..." }
        ]);
        setStreaming(true);

        try {
            const combinedText = `${SYSTEM_PROMPT}\n\nUser Question: ${msg}`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: combinedText }] }]
                })
            });

            if (!response.ok) throw new Error("API-handshake-failed");

            const data = await response.json();
            
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                let aiReply = data.candidates[0].content.parts[0].text;
                aiReply = aiReply + MANDATORY_FOOTER;
                setMessages((m) => m.map(item => item.id === aiMsgId ? { ...item, content: aiReply } : item));
            } else {
                throw new Error("Parsing error");
            }

        } catch (e) {
            console.warn("API Switch Triggered. Using clean embedded smart database logic.");
            let fallbackReply = getSmartFallbackResponse(msg);
            fallbackReply = fallbackReply + MANDATORY_FOOTER;
            setMessages((m) => m.map(item => item.id === aiMsgId ? { ...item, content: fallbackReply } : item));
        } finally {
            setStreaming(false);
        }
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
                                    <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mt-1">Live Intelligent Advisor</div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1"><X size={18} /></button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                            {messages.map((m) => (
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
                            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="SIP, Stock data, Tax rules, calculations poochiye…" className="flex-1 bg-white border border-[#E2D8C2] rounded-full px-4 py-2.5 text-[14px] focus:border-[#024396] outline-none" disabled={streaming} />
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
                <div style={{ fontSize: 18, fontFamily: "Fraunces, serif" }}>The Financial Doctor Live AI Advice</div>
            </div>
            <div style={{ fontSize: 13, color: "#0E1B2C", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                <Markdown content={latestAi} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, borderTop: "1px solid #E2D8C2", paddingTop: 15 }}>
                <img src={SAGAR_PHOTO} alt="Sagar" style={{ width: 45, height: 45, borderRadius: "50%" }} />
                <div style={{ fontSize: 12 }}><strong>TFD Team</strong><br />Corporate Office · +91 77738 05794</div>
            </div>
        </div>
    );
}
