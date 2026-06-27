import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Download, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { AI_PLAN_RECOMMENDATIONS } from "@/lib/recommendations";
import { LINKS } from "@/lib/links";
import { LOGO_URL, SAGAR_PHOTO } from "@/lib/constants";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CHAT_API_URL = BACKEND_URL ? `${BACKEND_URL}/api/ai/chat` : "/api/ai/chat";
const TFD_BRAND_URL = LINKS.assetPlus;
const TFD_LOGO = LOGO_URL;

const STARTERS = [
    "Mujhe 5000/month ka SIP shuru karna hai - kya plan karein?",
    "ELSS vs PPF - tax saving ke liye kya behtar hai?",
    "Mere paas Rs 1 lakh hai - Lumpsum karu ya STP karu?",
    "30 saal ki age me term insurance lena chahiye?",
];

const TFD_ASSISTANT_PROFILE = `
You are TFD-AI, the official AI assistant for The Financial Doctor and Sagar Chaturvedi.

Business rules:
- Speak only about The Financial Doctor, Sagar Chaturvedi, and the user's financial planning needs.
- Do not recommend, promote, compare, or name other advisory businesses, distributors, brokers, agencies, or competitor brands.
- Answer in the user's language: Hindi, English, or Hinglish.
- Cover mutual funds, SIP, STP, SWP, ELSS, PPF, NPS, tax planning, insurance, emergency fund, goal planning, retirement planning, and general company/financial questions.
- Ask clarifying questions when age, income, dependents, risk profile, time horizon, tax regime, or goal amount is missing.
- Refuse unrelated questions politely and bring the user back to finance, tax, insurance, or planning.

Compliance rules:
- Keep answers educational and suitable for an AMFI/MFD-style website assistant.
- Do not promise guaranteed returns.
- Do not give buy/sell/hold calls for stocks or specific schemes unless approved product data is provided by the backend.
- Do not claim to be SEBI RIA, lawyer, CA, or tax filing authority.
- For tax, explain general rules and ask the user to confirm with a qualified tax professional for final filing.
- Always include short risk/disclaimer language when discussing investments or insurance.
- Never collect sensitive data such as PAN, Aadhaar, OTP, card details, bank password, or full account number.
`.trim();

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
            content:
                "Namaste! Main **TFD-AI** hoon - The Financial Doctor aur Sagar ji ke financial planning approach ke hisaab se help karta hoon. SIP, ELSS, insurance, tax, retirement planning ya financial goals ke baare me poochiye.\n\n_Disclaimer: Main educational AI assistant hoon; final personalised advice ke liye Sagar ji se direct baat karein._",
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
            const resp = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: msg,
                    assistant_profile: TFD_ASSISTANT_PROFILE,
                }),
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
                        // PURE update — replace the object, do NOT mutate.
                        // (Strict Mode invokes updaters twice and would otherwise
                        // append the same chunk twice into the same mutated object.)
                        const updated = { ...last, content: (last.content || "") + chunk };
                        const copy = m.slice();
                        copy[lastIdx] = updated;
                        return copy;
                    });
                }
            }
        } catch (e) {
            console.error("AI chat error", e);
            setMessages((m) => {
                if (m.length === 0) return m;
                const lastIdx = m.length - 1;
                const last = m[lastIdx];
                if (last.role !== "assistant" || last.content) return m;
                const updated = {
                    ...last,
                    content:
                        "Sorry, abhi AI service connect nahi ho pa rahi hai. Thoda baad try karein, ya direct Sagar ji ko WhatsApp karein. Website owner ke liye note: backend par `/api/ai/chat` route aur AI API key configure honi chahiye.",
                };
                const copy = m.slice();
                copy[lastIdx] = updated;
                return copy;
            });
        } finally {
            setStreaming(false);
        }
    };

    // Generates the html2canvas of the snapshot DOM. Reused by PNG and PDF flows.
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
        const assistantMsgs = messages.filter(
            (m) => m.role === "assistant" && m.content && m.content.trim().length > 0,
        );
        // First assistant is the welcome message — need at least one more substantial reply
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
            if (!canvas) {
                toast.error("Could not generate snapshot. Try again.", { id: "ai-snap" });
                return;
            }
            const link = document.createElement("a");
            link.download = `TFD-AI-planning-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("PNG downloaded — share it on WhatsApp!", { id: "ai-snap" });
        } catch (e) {
            console.error(e);
            toast.error("Could not generate snapshot. Try again.", { id: "ai-snap" });
        }
    };

    const downloadPlanningPdf = async () => {
        if (!_ensurePlanReady()) return;
        try {
            toast.loading("Generating your planning PDF…", { id: "ai-pdf" });
            const canvas = await _renderSnapshotCanvas();
            if (!canvas) {
                toast.error("Could not generate PDF. Try again.", { id: "ai-pdf" });
                return;
            }
            // A4 portrait at 72dpi = 595 × 842 pt. Fit canvas to A4 width with auto-paging.
            const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW;
            const imgH = (canvas.height * pageW) / canvas.width;
            const imgData = canvas.toDataURL("image/jpeg", 0.92);
            if (imgH <= pageH) {
                pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH, undefined, "FAST");
            } else {
                // Multi-page: slice the tall canvas into page-height strips.
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
            toast.error("Could not generate PDF. Try again.", { id: "ai-pdf" });
        }
    };

    const hasPlan = messages.filter((m) => m.role === "assistant").length > 1;

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-[#0E1B2C]/40 backdrop-blur-sm p-3 sm:p-6"
                    onClick={() => setOpen(false)}
                    data-testid="ai-chat-overlay"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-3xl w-full max-w-[460px] h-[85vh] sm:h-[640px] flex flex-col shadow-2xl overflow-hidden"
                        data-testid="ai-chat-panel"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-[#0E1B2C] text-[#F6F1E8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center">
                                    <Sparkles size={18} />
                                </span>
                                <div>
                                    <div className="font-display text-lg leading-none">TFD-AI</div>
                                    <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mt-1">
                                        Sagar ji's AI assistant
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasPlan && (
                                    <>
                                        <button
                                            onClick={downloadPlanning}
                                            className="hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-[#C7102E] hover:bg-[#9B0D24] text-white px-3 py-1.5 rounded-full"
                                            data-testid="ai-chat-download-header"
                                            title="Download as PNG"
                                        >
                                            <Download size={13} /> PNG
                                        </button>
                                        <button
                                            onClick={downloadPlanningPdf}
                                            className="hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-[#024396] hover:bg-[#012E6B] text-white px-3 py-1.5 rounded-full"
                                            data-testid="ai-chat-download-pdf-header"
                                            title="Download as PDF"
                                        >
                                            <FileText size={13} /> PDF
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1"
                                    data-testid="ai-chat-close"
                                    aria-label="Close chat"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
                            data-testid="ai-chat-messages"
                        >
                            {messages.map((m, i) => (
                                <ChatBubble
                                    key={m.id || `msg-${i}`}
                                    role={m.role}
                                    content={m.content}
                                    streaming={
                                        streaming &&
                                        i === messages.length - 1 &&
                                        m.role === "assistant"
                                    }
                                />
                            ))}

                            {messages.length === 1 && !streaming && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {STARTERS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="text-[12px] bg-white border border-[#E2D8C2] text-[#0E1B2C] px-3 py-1.5 rounded-full hover:bg-[#024396] hover:text-[#F6F1E8] hover:border-transparent transition-colors"
                                            data-testid="ai-chat-starter"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Inline download CTAs after at least one plan */}
                            {hasPlan && !streaming && (
                                <div className="pt-2">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={downloadPlanning}
                                            data-testid="ai-chat-download"
                                            className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#024396] hover:bg-[#012E6B] text-[#F6F1E8] px-4 py-2 rounded-full"
                                        >
                                            <Download size={13} /> Download as PNG
                                        </button>
                                        <button
                                            onClick={downloadPlanningPdf}
                                            data-testid="ai-chat-download-pdf"
                                            className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#C7102E] hover:bg-[#9B0D24] text-white px-4 py-2 rounded-full"
                                        >
                                            <FileText size={13} /> Download as PDF
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-[#5C677D] mt-1.5">
                                        Save and share your AI-curated plan on WhatsApp.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                send();
                            }}
                            className="px-3 py-3 border-t border-[#E2D8C2] bg-[#FBF7EE] flex items-center gap-2"
                        >
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Apna sawaal poochiye…"
                                className="flex-1 bg-white border border-[#E2D8C2] rounded-full px-4 py-2.5 text-[14px] focus:border-[#024396] outline-none"
                                disabled={streaming}
                                data-testid="ai-chat-input"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || streaming}
                                className="w-11 h-11 rounded-full bg-[#024396] text-[#F6F1E8] grid place-items-center disabled:opacity-40 hover:bg-[#012E6B] transition-colors"
                                data-testid="ai-chat-send"
                                aria-label="Send"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        <div className="text-[10px] text-[#5C677D] text-center py-1.5 border-t border-[#E2D8C2] bg-[#F6F1E8]">
                            AI assistant trained on Sagar ji's approach. Mutual fund investments are subject to market risks.
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden snapshot for PNG export */}
            <div style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }} aria-hidden>
                <div ref={snapRef}>
                    <PlanSnapshot messages={messages} />
                </div>
            </div>
        </>
    );
}

function ChatBubble({ role, content, streaming }) {
    if (role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#024396] text-[#F6F1E8] px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                    {content}
                </div>
            </div>
        );
    }
    return (
        <div className="flex gap-2">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-white" />
            </span>
            <div className="max-w-[88%] bg-white border border-[#E2D8C2] px-4 py-2.5 rounded-2xl rounded-bl-md text-[14px] leading-relaxed text-[#0E1B2C] break-words overflow-hidden">
                <Markdown content={content} />
                {streaming && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#024396] animate-pulse align-middle" />
                )}
            </div>
        </div>
    );
}

// Markdown renderer (bold, italic, code, list, heading, link, table-row → mono row)
// SAFE: uses React nodes only, no dangerouslySetInnerHTML — eliminates XSS.
function Markdown({ content }) {
    if (!content) return null;
    const lines = content.split("\n");
    const out = [];
    let listBuf = [];
    const flushList = (key) => {
        if (listBuf.length) {
            const items = listBuf.slice();
            out.push(
                <ul key={`ul-${key}`} className="list-disc pl-5 my-1 space-y-0.5">
                    {items.map((it, i) => (
                        <li key={`li-${key}-${i}-${it.slice(0, 12)}`}>{renderInline(it)}</li>
                    ))}
                </ul>
            );
            listBuf = [];
        }
    };
    lines.forEach((raw, i) => {
        const line = raw;
        if (/^---+$/.test(line.trim())) {
            flushList(i);
            out.push(<hr key={`hr-${i}`} className="my-2 border-[#E2D8C2]" />);
            return;
        }
        if (/^## /.test(line)) {
            flushList(i);
            out.push(
                <div key={`h-${i}`} className="font-display text-[15px] text-[#0E1B2C] mt-2 mb-1">
                    {line.replace(/^## /, "")}
                </div>
            );
            return;
        }
        if (/^# /.test(line)) {
            flushList(i);
            out.push(
                <div key={`h1-${i}`} className="font-display text-[16px] text-[#0E1B2C] mt-2 mb-1">
                    {line.replace(/^# /, "")}
                </div>
            );
            return;
        }
        if (/^(-|\*) /.test(line.trim())) {
            listBuf.push(line.trim().replace(/^(-|\*) /, ""));
            return;
        }
        if (/^\s*\|.+\|\s*$/.test(line)) {
            flushList(i);
            // Skip pure separator row of table (e.g. |---|---|)
            if (/^[\s|:\-]+$/.test(line)) return;
            const cells = line.split("|").slice(1, -1).map((c) => c.trim());
            out.push(
                <div
                    key={`tr-${i}`}
                    className="grid gap-2 text-[12.5px] py-0.5"
                    style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0,1fr))` }}
                >
                    {cells.map((c, ci) => (
                        <div key={`td-${i}-${ci}`} className="text-[#2A364B]">
                            {renderInline(c)}
                        </div>
                    ))}
                </div>
            );
            return;
        }
        if (/^> /.test(line.trim())) {
            flushList(i);
            out.push(
                <div
                    key={`q-${i}`}
                    className="border-l-2 border-[#C7102E] pl-3 my-1 text-[#2A364B] italic"
                >
                    {renderInline(line.replace(/^> /, ""))}
                </div>
            );
            return;
        }
        flushList(i);
        if (line.trim() === "") {
            out.push(<div key={`s-${i}`} className="h-1.5" />);
        } else {
            out.push(<p key={`p-${i}-${line.slice(0, 16)}`}>{renderInline(line)}</p>);
        }
    });
    flushList("end");
    return <div>{out}</div>;
}

// Safe URL gate — only http(s) and mailto allowed in markdown links.
function safeUrl(u) {
    try {
        const url = String(u).trim();
        if (/^(https?:|mailto:)/i.test(url)) return url;
        return "#";
    } catch {
        return "#";
    }
}

// Tokenise inline markdown (`**bold**`, `*em*`, `` `code` ``, `[label](url)`) into React nodes.
// Returns an array of strings + JSX elements — completely sanitiser-free since React escapes text.
function renderInline(s) {
    if (s == null || s === "") return null;
    // Order matters: handle links and code first to avoid bold/italic eating their innards.
    const tokens = [];
    let remaining = String(s);
    let safetyCounter = 0;
    const pattern = /(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/;
    while (remaining && safetyCounter++ < 500) {
        const m = remaining.match(pattern);
        if (!m) {
            tokens.push(remaining);
            break;
        }
        const idx = m.index;
        if (idx > 0) tokens.push(remaining.slice(0, idx));
        if (m[1]) {
            // link
            tokens.push(
                <a
                    key={`a-${tokens.length}`}
                    href={safeUrl(m[3])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#024396]"
                >
                    {m[2]}
                </a>
            );
        } else if (m[4]) {
            // inline code
            tokens.push(
                <code
                    key={`c-${tokens.length}`}
                    className="bg-[#F6F1E8] px-1 rounded text-[12px]"
                >
                    {m[5]}
                </code>
            );
        } else if (m[6]) {
            tokens.push(<strong key={`b-${tokens.length}`}>{m[7]}</strong>);
        } else if (m[8]) {
            tokens.push(<em key={`i-${tokens.length}`}>{m[9]}</em>);
        }
        remaining = remaining.slice(idx + m[0].length);
    }
    return tokens;
}

// ---------- Plan Snapshot for PNG ----------
// Strategy: capture ONLY the latest substantial AI plan (full content, no truncation)
// + the user question that triggered it. This avoids cut-off on long chats and keeps
// the snapshot focused on "the planning + recommendations" as the user requested.
function PlanSnapshot({ messages }) {
    const real = messages.slice(1); // skip the welcome message
    // Find the latest non-empty assistant message
    let latestAi = "";
    let latestAiIdx = -1;
    for (let i = real.length - 1; i >= 0; i--) {
        if (real[i].role === "assistant" && real[i].content && real[i].content.trim().length > 0) {
            latestAi = real[i].content;
            latestAiIdx = i;
            break;
        }
    }
    // Find the user message that immediately precedes the latest AI message
    let latestUser = "";
    for (let i = latestAiIdx - 1; i >= 0; i--) {
        if (real[i].role === "user") {
            latestUser = real[i].content;
            break;
        }
    }
    // Count total turns so we can show context "Turn X of Y" if there were earlier ones
    const totalUserTurns = real.filter((m) => m.role === "user").length;

    return (
        <div
            style={{
                width: 640,
                background: "linear-gradient(160deg, #FBF7EE 0%, #EFE7D6 100%)",
                color: "#0E1B2C",
                borderRadius: 28,
                border: "1px solid #E2D8C2",
                padding: "28px 30px",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: "0 30px 60px -25px rgba(14,27,44,0.25)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Decorative blob */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: -120,
                    right: -120,
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(2, 67, 150,0.18) 0%, transparent 70%)",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    bottom: -140,
                    left: -140,
                    width: 360,
                    height: 360,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(199, 16, 46,0.15) 0%, transparent 70%)",
                }}
            />

            {/* Header */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                        src={TFD_LOGO}
                        crossOrigin="anonymous"
                        alt="TFD"
                        style={{
                            height: 64,
                            width: "auto",
                            objectFit: "contain",
                            background: "#F6F1E8",
                            borderRadius: 12,
                            padding: 6,
                            border: "1px solid #E2D8C2",
                        }}
                    />
                    <div>
                        <div
                            style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: 22,
                                color: "#0E1B2C",
                                lineHeight: 1,
                            }}
                        >
                            The Financial Doctor
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                                color: "#5C677D",
                                marginTop: 6,
                            }}
                        >
                            Treating Your Financial Health
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "#5C677D",
                        }}
                    >
                        AMFI · ARN-290298
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "#024396",
                            marginTop: 4,
                            fontWeight: 600,
                        }}
                    >
                        Sehore · MP
                    </div>
                </div>
            </div>

            {/* Title strip */}
            <div
                style={{
                    background: "#0E1B2C",
                    color: "#F6F1E8",
                    borderRadius: 18,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    position: "relative",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: "#C7102E",
                            fontWeight: 700,
                        }}
                    >
                        TFD-AI · Personalised Planning
                    </div>
                    <div
                        style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: 22,
                            marginTop: 4,
                            lineHeight: 1.05,
                        }}
                    >
                        Your AI-curated financial plan
                    </div>
                </div>
                <div
                    style={{
                        background: "#C7102E",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    Snapshot
                </div>
            </div>

            {/* Latest plan — full content, no truncation */}
            <div style={{ position: "relative", marginBottom: 18 }}>
                {latestUser && (
                    <div
                        style={{
                            background: "#024396",
                            color: "#F6F1E8",
                            padding: "10px 14px",
                            borderRadius: "14px 14px 14px 4px",
                            fontSize: 12.5,
                            lineHeight: 1.45,
                            maxWidth: "85%",
                            marginBottom: 10,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 9,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                opacity: 0.75,
                                marginBottom: 4,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>You asked</span>
                            {totalUserTurns > 1 && (
                                <span>Latest of {totalUserTurns} questions</span>
                            )}
                        </div>
                        {latestUser}
                    </div>
                )}
                <div
                    style={{
                        background: "#FBF7EE",
                        border: "1px solid #E2D8C2",
                        padding: "14px 16px",
                        borderRadius: "14px 14px 4px 14px",
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: "#0E1B2C",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    <div
                        style={{
                            fontSize: 9,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "#024396",
                            fontWeight: 700,
                            marginBottom: 6,
                        }}
                    >
                        TFD-AI · Planning &amp; Recommendations
                    </div>
                    {stripMdFull(latestAi)}
                </div>
            </div>

            {/* Bilingual Smart Tips */}
            <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7102E", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: "#C7102E", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>💡</span>
                    Smart tips · सुझाव
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {AI_PLAN_RECOMMENDATIONS.slice(0, 3).map((tip, idx) => (
                        <div
                            key={`tip-${idx}-${(tip.en || "").slice(0, 12)}`}
                            style={{
                                background: "#FBF7EE",
                                border: "1px solid #E2D8C2",
                                borderRadius: 12,
                                padding: "8px 12px",
                                borderLeft: "3px solid #024396",
                            }}
                        >
                            <div style={{ fontSize: 11.5, color: "#0E1B2C", lineHeight: 1.4 }}>
                                <strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#024396" }}>EN:</strong>
                                {tip.en}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#2A364B", lineHeight: 1.4, marginTop: 3 }}>
                                <strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#C7102E" }}>HI:</strong>
                                {tip.hi}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Sagar + QR */}
            <div
                style={{
                    background: "#0E1B2C",
                    color: "#F6F1E8",
                    borderRadius: 18,
                    padding: "16px 18px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 12,
                    position: "relative",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                        src={SAGAR_PHOTO}
                        crossOrigin="anonymous"
                        alt="Sagar"
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #C7102E",
                        }}
                    />
                    <div>
                        <div
                            style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: 17,
                                lineHeight: 1.1,
                            }}
                        >
                            Sagar Chaturvedi
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                opacity: 0.7,
                                marginTop: 2,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            Founder · MFD (AMFI Certified)
                        </div>
                        <div style={{ fontSize: 11, marginTop: 5 }}>📱 +91 77738 05794</div>
                        <div style={{ fontSize: 11 }}>✉ wecare@thefinancialdoctor.in</div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ background: "#fff", padding: 5, borderRadius: 10 }}>
                        <QRCodeCanvas
                            value={TFD_BRAND_URL}
                            size={84}
                            bgColor="#FFFFFF"
                            fgColor="#0E1B2C"
                            level="M"
                            includeMargin={false}
                        />
                    </div>
                    <div
                        style={{
                            fontSize: 9,
                            marginTop: 5,
                            color: "#C7102E",
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                        }}
                    >
                        Scan to invest
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>AssetPlus · ARN-290298</div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    thefinancialdoctor.in
                </div>
                <div
                    style={{
                        fontSize: 9,
                        color: "#5C677D",
                        fontStyle: "italic",
                        lineHeight: 1.4,
                    }}
                >
                    Generated by TFD-AI — an educational assistant trained on Sagar ji's approach. Not a
                    substitute for personalised advice. Mutual fund investments are subject to market
                    risks. Read all scheme-related documents carefully.
                </div>
            </div>
        </div>
    );
}

function truncate(s, max) {
    if (!s) return "";
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function stripMd(s, max) {
    return truncate(stripMdFull(s), max);
}

// Full markdown strip — preserves entire content (no truncation) for snapshot use.
// Also collapses immediate duplicate lines/sentences that can leak in from streaming SSE chunks.
function stripMdFull(s) {
    if (!s) return "";
    let out = s
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^#+\s*/gm, "")
        .replace(/^\s*[-*]\s+/gm, "• ")
        .replace(/^\s*\|.+\|\s*$/gm, (l) =>
            l
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim())
                .filter(Boolean)
                .join(" · "),
        )
        .replace(/^[\s|:\-]+$/gm, "")
        .replace(/\n{3,}/g, "\n\n");
    // Collapse exact duplicate adjacent lines (streaming SSE chunk-boundary artefact)
    out = out
        .split("\n")
        .filter((line, i, arr) => i === 0 || line.trim() === "" || line.trim() !== arr[i - 1].trim())
        .join("\n");
    // Collapse "Sentence Sentence" → "Sentence" for ≥15-char repeated phrases on same line
    out = out.replace(/\b([^.!?\n]{15,}?[.!?])\s+\1/g, "$1");
    return out.trim();
}
