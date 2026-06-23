import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, MessageCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
        setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
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
                // SSE: split by double newline
                const parts = buf.split("\n\n");
                buf = parts.pop() ?? "";
                for (const block of parts) {
                    if (block.startsWith("event: done")) {
                        // end
                        continue;
                    }
                    // collect data: lines (may be multiple per block)
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
            setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant" && !last.content) {
                    last.content = "Sorry, mujhe abhi connect karne me dikkat aa rahi hai. Thoda baad try karein, ya direct Sagar ji ko WhatsApp karein.";
                }
                return copy;
            });
        } finally {
            setStreaming(false);
        }
    };

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
                        className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-3xl w-full max-w-[440px] h-[85vh] sm:h-[600px] flex flex-col shadow-2xl overflow-hidden"
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
                            <button
                                onClick={() => setOpen(false)}
                                className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1"
                                data-testid="ai-chat-close"
                                aria-label="Close chat"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
                            data-testid="ai-chat-messages"
                        >
                            {messages.map((m, i) => (
                                <ChatBubble key={i} role={m.role} content={m.content} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
                            ))}

                            {/* Starters */}
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
                            AI assistant trained on Sagar ji's approach. Not a replacement for personalised advice. Mutual fund investments are subject to market risks.
                        </div>
                    </div>
                </div>
            )}
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

// Tiny markdown renderer for **bold**, *italic*, `code`, headings, lists, links
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
        if (/^(-|\*) /.test(line.trim())) {
            listBuf.push(line.trim().replace(/^(-|\*) /, ""));
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
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline text-[#0E5E48]">$1</a>');
}
