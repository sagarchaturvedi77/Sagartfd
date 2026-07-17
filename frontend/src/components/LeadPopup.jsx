import React, { useEffect, useState } from "react";
import { X, Stethoscope, Phone, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const STORAGE_KEY = "tfd_lead_popup_v1";
const SHOW_AFTER_MS = 5000;

export default function LeadPopup() {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        // If user has previously dismissed/submitted, don't show again
        if (localStorage.getItem(STORAGE_KEY)) return;
        const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
        return () => clearTimeout(t);
    }, []);

    const dismiss = (reason = "dismissed") => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ reason, at: Date.now() }));
        setOpen(false);
    };

    const [submit, loading] = useSubmitOnce(async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) {
            toast.error("Name aur phone — dono bharein.");
            return;
        }
        if (phone.replace(/\D/g, "").length < 10) {
            toast.error("Phone number 10 digits ka hona chahiye.");
            return;
        }
        try {
            await api.submitContact({
                full_name: name.trim(),
                phone: phone.trim(),
                service: "Lead Popup",
                message: "Captured via 5-second lead popup.",
            });
            setSubmitted(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ reason: "submitted", at: Date.now() }));
            toast.success("Thank you! Sagar ji will reach out within 24 hours.");
        } catch (err) {
            toast.error("Submit failed. Please WhatsApp +91 77738 05794.");
        }
    });

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[80] grid place-items-center bg-[#0E1B2C]/55 backdrop-blur-sm p-4"
            onClick={() => dismiss("backdrop")}
            data-testid="lead-popup"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#FBF7EE] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
                <button
                    onClick={() => dismiss("close-btn")}
                    aria-label="Close popup"
                    data-testid="lead-popup-close"
                    className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-[#F6F1E8] hover:bg-[#E2D8C2] text-[#0E1B2C] z-10"
                >
                    <X size={16} />
                </button>

                {submitted ? (
                    <div className="px-7 py-10 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#024396] grid place-items-center mx-auto text-[#F6F1E8]">
                            <Sparkles size={28} />
                        </div>
                        <h3 className="font-display text-2xl text-[#0E1B2C] mt-5">
                            Dhanyavaad, {name.split(" ")[0]}!
                        </h3>
                        <p className="text-[#2A364B] mt-3 text-[14.5px] leading-relaxed">
                            Sagar ji will personally reach out within 24 hours. Meanwhile, explore the
                            calculators or chat with TFD-AI.
                        </p>
                        <button
                            onClick={() => setOpen(false)}
                            className="btn-pill btn-primary mt-6"
                            data-testid="lead-popup-continue"
                        >
                            Continue exploring
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header band */}
                        <div className="bg-[#0E1B2C] text-[#F6F1E8] px-7 py-5 flex items-center gap-3">
                            <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center shrink-0">
                                <Stethoscope size={18} />
                            </span>
                            <div>
                                <div className="text-[10px] tracking-[0.22em] uppercase opacity-70">
                                    Free 15-min consult
                                </div>
                                <div className="font-display text-lg leading-tight mt-1">
                                    Talk to Sagar ji directly
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="px-7 py-6">
                            <p className="text-[14px] text-[#2A364B] leading-relaxed">
                                Apna naam aur number chhodiye — Sagar ji <strong>personally</strong> aapko
                                call karenge for a free portfolio review. No spam, no obligations.
                            </p>

                            <div className="mt-5 space-y-3">
                                <div className="relative">
                                    <User
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]"
                                    />
                                    <input
                                        autoFocus
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Aapka naam"
                                        data-testid="lead-popup-name"
                                        className="w-full bg-[#F6F1E8] border border-[#E2D8C2] rounded-xl pl-11 pr-4 py-3 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396]"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C677D]"
                                    />
                                    <input
                                        required
                                        type="tel"
                                        inputMode="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Mobile number"
                                        data-testid="lead-popup-phone"
                                        className="w-full bg-[#F6F1E8] border border-[#E2D8C2] rounded-xl pl-11 pr-4 py-3 text-[#0E1B2C] placeholder:text-[#8A93A6] focus:border-[#024396]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="lead-popup-submit"
                                className="btn-pill btn-primary w-full justify-center mt-5 disabled:opacity-60"
                            >
                                {loading ? "Submitting…" : "Get free call back →"}
                            </button>

                            <button
                                type="button"
                                onClick={() => dismiss("maybe-later")}
                                data-testid="lead-popup-skip"
                                className="block mx-auto mt-4 text-[12px] text-[#5C677D] hover:text-[#0E1B2C] underline-offset-2 hover:underline"
                            >
                                Maybe later
                            </button>

                            <p className="text-[10px] text-[#5C677D] text-center mt-5 leading-relaxed">
                                We respect your privacy. Your details are only used by The Financial Doctor
                                (ARN-290298) and never shared.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
