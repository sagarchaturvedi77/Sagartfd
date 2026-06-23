import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { AI_PLAN_RECOMMENDATIONS } from "@/lib/recommendations";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TFD_BRAND_URL = "https://www.assetplus.in/mfd/ARN-290298";
const TFD_LOGO =
    "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png";
const SAGAR_PHOTO =
    "https://customer-assets.emergentagent.com/job_wealth-advisor-111/artifacts/1dwkpp48_D3037D99-4115-4778-83D8-907655A401FD.png";

const STARTERS = [
    "Mujhe 5000/month ka SIP shuru karna hai — kya plan karein?",
    "ELSS vs PPF — tax saving ke liye kya behtar hai?",
    "Mere paas ₹1 lakh hai — Lumpsum karu ya STP karu?",
    "30 saal ki age me term insurance lena chahiye?",
];

function genSessionId() {
    return "tfd-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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
            role: "assistant",
            content:
                "Namaste! 🙏 Main **TFD-AI** hoon — Sagar ji ke financial advisory approach par trained. SIP, ELSS, insurance, tax — kuch bhi poochiye! \n\n_Disclaimer: I'm an AI assistant; for actual onboarding speak directly with Sagar ji._",
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
            { role: "user", content: msg },
            { role: "assistant", content: "" },
        ]);
        setStreaming(true);

        try {
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
                        const copy = [...m];
                        const last = copy[copy.length - 1];
                        if (last && last.role === "assistant") {
                            last.content = (last.content || "") + chunk;
                        }
                        return copy;
                    });
                }
            }
        } catch (e) {
            console.error("AI chat error", e);
            setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant" && !last.content) {
                    last.content =
                        "Sorry, mujhe abhi connect karne me dikkat aa rahi hai. Thoda baad try karein, ya direct Sagar ji ko WhatsApp karein.";
                }
                return copy;
            });
        } finally {
            setStreaming(false);
        }
    };

    const downloadPlanning = async () => {
        // Build a transient snapshot in DOM, render, capture.
        if (!snapRef.current) return;
        const userMsgs = messages.filter((m) => m.role === "user");
        const assistantMsgs = messages.filter((m) => m.role === "assistant").slice(1); // skip the welcome message
        if (assistantMsgs.length === 0) {
            toast.error("Pehle TFD-AI se planning karwaiye, phir download karein.");
            return;
        }

        try {
            toast.loading("Generating your planning snapshot…", { id: "ai-snap" });
            await new Promise((r) => setTimeout(r, 250));
            const canvas = await html2canvas(snapRef.current, {
                backgroundColor: "#F6F1E8",
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement("a");
            link.download = `TFD-AI-planning-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.success("Planning snapshot downloaded — share it on WhatsApp!", { id: "ai-snap" });
        } catch (e) {
            console.error(e);
            toast.error("Could not generate snapshot. Try again.", { id: "ai-snap" });
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
                                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E5E48] to-[#C9802A] grid place-items-center">
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
                                    <button
                                        onClick={downloadPlanning}
                                        className="hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-[#C9802A] hover:bg-[#B66B1B] text-white px-3 py-1.5 rounded-full"
                                        data-testid="ai-chat-download-header"
                                    >
                                        <Download size={13} /> PNG
                                    </button>
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
                                    key={i}
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
                                            className="text-[12px] bg-white border border-[#E2D8C2] text-[#0E1B2C] px-3 py-1.5 rounded-full hover:bg-[#0E5E48] hover:text-[#F6F1E8] hover:border-transparent transition-colors"
                                            data-testid="ai-chat-starter"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Inline download CTA after at least one plan */}
                            {hasPlan && !streaming && (
                                <div className="pt-2">
                                    <button
                                        onClick={downloadPlanning}
                                        data-testid="ai-chat-download"
                                        className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0E5E48] hover:bg-[#0A4838] text-[#F6F1E8] px-4 py-2 rounded-full"
                                    >
                                        <Download size={13} /> Download this planning as PNG
                                    </button>
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
                                className="flex-1 bg-white border border-[#E2D8C2] rounded-full px-4 py-2.5 text-[14px] focus:border-[#0E5E48] outline-none"
                                disabled={streaming}
                                data-testid="ai-chat-input"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || streaming}
                                className="w-11 h-11 rounded-full bg-[#0E5E48] text-[#F6F1E8] grid place-items-center disabled:opacity-40 hover:bg-[#0A4838] transition-colors"
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
                <div className="max-w-[85%] bg-[#0E5E48] text-[#F6F1E8] px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                    {content}
                </div>
            </div>
        );
    }
    return (
        <div className="flex gap-2">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0E5E48] to-[#C9802A] grid place-items-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-white" />
            </span>
            <div className="max-w-[88%] bg-white border border-[#E2D8C2] px-4 py-2.5 rounded-2xl rounded-bl-md text-[14px] leading-relaxed text-[#0E1B2C] break-words overflow-hidden">
                <Markdown content={content} />
                {streaming && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#0E5E48] animate-pulse align-middle" />
                )}
            </div>
        </div>
    );
}

// Markdown renderer (bold, italic, code, list, heading, link, table-row → mono row)
function Markdown({ content }) {
    if (!content) return null;
    const lines = content.split("\n");
    const out = [];
    let listBuf = [];
    const flushList = (key) => {
        if (listBuf.length) {
            out.push(
                <ul key={`ul-${key}`} className="list-disc pl-5 my-1 space-y-0.5">
                    {listBuf.map((it, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />
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
                        <div
                            key={ci}
                            className="text-[#2A364B]"
                            dangerouslySetInnerHTML={{ __html: renderInline(c) }}
                        />
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
                    className="border-l-2 border-[#C9802A] pl-3 my-1 text-[#2A364B] italic"
                    dangerouslySetInnerHTML={{ __html: renderInline(line.replace(/^> /, "")) }}
                />
            );
            return;
        }
        flushList(i);
        if (line.trim() === "") {
            out.push(<div key={`s-${i}`} className="h-1.5" />);
        } else {
            out.push(<p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
        }
    });
    flushList("end");
    return <div>{out}</div>;
}

function renderInline(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, '<code class="bg-[#F6F1E8] px-1 rounded text-[12px]">$1</code>')
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-[#0E5E48]">$1</a>',
        );
}

// ---------- Plan Snapshot for PNG ----------
function PlanSnapshot({ messages }) {
    const real = messages.slice(1); // skip the welcome
    const turns = [];
    for (let i = 0; i < real.length; i += 2) {
        const u = real[i];
        const a = real[i + 1];
        if (u && u.role === "user") {
            turns.push({ user: u.content, ai: a && a.role === "assistant" ? a.content : "" });
        }
    }

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
                    background: "radial-gradient(circle, rgba(14,94,72,0.18) 0%, transparent 70%)",
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
                    background: "radial-gradient(circle, rgba(201,128,42,0.15) 0%, transparent 70%)",
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
                            color: "#0E5E48",
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
                            color: "#C9802A",
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
                        background: "#C9802A",
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

            {/* Turns */}
            <div style={{ position: "relative", marginBottom: 18 }}>
                {turns.map((t, idx) => (
                    <div key={idx} style={{ marginBottom: 12 }}>
                        <div
                            style={{
                                background: "#0E5E48",
                                color: "#F6F1E8",
                                padding: "10px 14px",
                                borderRadius: "14px 14px 14px 4px",
                                fontSize: 12.5,
                                lineHeight: 1.45,
                                maxWidth: "85%",
                                marginBottom: 6,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 9,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    opacity: 0.7,
                                    marginBottom: 4,
                                }}
                            >
                                You asked
                            </div>
                            {truncate(t.user, 320)}
                        </div>
                        <div
                            style={{
                                background: "#FBF7EE",
                                border: "1px solid #E2D8C2",
                                padding: "10px 14px",
                                borderRadius: "14px 14px 4px 14px",
                                fontSize: 12,
                                lineHeight: 1.55,
                                color: "#0E1B2C",
                                marginLeft: 24,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 9,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "#0E5E48",
                                    fontWeight: 700,
                                    marginBottom: 4,
                                }}
                            >
                                TFD-AI says
                            </div>
                            {stripMd(t.ai, 1100)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bilingual Smart Tips */}
            <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C9802A", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: "#C9802A", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>💡</span>
                    Smart tips · सुझाव
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {AI_PLAN_RECOMMENDATIONS.slice(0, 3).map((tip, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: "#FBF7EE",
                                border: "1px solid #E2D8C2",
                                borderRadius: 12,
                                padding: "8px 12px",
                                borderLeft: "3px solid #0E5E48",
                            }}
                        >
                            <div style={{ fontSize: 11.5, color: "#0E1B2C", lineHeight: 1.4 }}>
                                <strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#0E5E48" }}>EN:</strong>
                                {tip.en}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#2A364B", lineHeight: 1.4, marginTop: 3 }}>
                                <strong style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, marginRight: 6, color: "#C9802A" }}>HI:</strong>
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
                            border: "3px solid #C9802A",
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
                            color: "#C9802A",
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
    return truncate(out.trim(), max);
}
