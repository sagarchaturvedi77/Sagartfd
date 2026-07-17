import React, { useState } from "react";
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { IDS } from "@/constants/testIds";
import { useSubmitOnce } from "../lib/useSubmitOnce";

const SERVICES = [
    "Mutual Funds / SIP",
    "Term Insurance",
    "Life Insurance",
    "Health Insurance",
    "Motor Insurance",
    "Portfolio Review",
    "Partner with TFD",
    "Other",
];

export default function Contact() {
    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        email: "",
        service: "",
        message: "",
    });
    const [onSubmit, loading] = useSubmitOnce(async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.phone) {
            toast.error("Name & phone zaroori hain.");
            return;
        }
        try {
            await api.submitContact(form);
            toast.success("Request received! We'll connect within 24 hours.");
            setForm({ full_name: "", phone: "", email: "", service: "", message: "" });
        } catch (e) {
            toast.error("Submit failed. Please try WhatsApp instead.");
        }
    });

    return (
        <section id="contact" className="section">
            <div className="container-x grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5">
                    <div className="eyebrow">Let's talk money</div>
                    <h2 className="h2 mt-3 text-[#0E1B2C]">
                        Book your free <span className="font-italic-serif text-[#024396]">15-min consult.</span>
                    </h2>
                    <p className="mt-4 text-[#2A364B] max-w-md">
                        Tell us a bit about your goal — SIP, insurance, or a portfolio review — and we'll
                        get back within 24 hours.
                    </p>

                    <div className="mt-8 space-y-5">
                        <a
                            href="tel:+917773805794"
                            className="flex items-start gap-4 group"
                            data-testid="contact-phone-link"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#0E1B2C] text-[#F6F1E8] grid place-items-center shrink-0 group-hover:bg-[#024396] transition-colors">
                                <Phone size={18} />
                            </div>
                            <div>
                                <div className="text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                    Phone / WhatsApp
                                </div>
                                <div className="font-display text-[#0E1B2C] text-xl mt-0.5">
                                    7773805794
                                </div>
                            </div>
                        </a>
                        <a
                            href="mailto:wecare@thefinancialdoctor.in"
                            className="flex items-start gap-4 group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#0E1B2C] text-[#F6F1E8] grid place-items-center shrink-0 group-hover:bg-[#024396] transition-colors">
                                <Mail size={18} />
                            </div>
                            <div>
                                <div className="text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                    Email
                                </div>
                                <div className="font-display text-[#0E1B2C] text-xl mt-0.5">
                                    wecare@thefinancialdoctor.in
                                </div>
                            </div>
                        </a>
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#0E1B2C] text-[#F6F1E8] grid place-items-center shrink-0">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <div className="text-[11px] tracking-[0.18em] uppercase text-[#5C677D]">
                                    Office
                                </div>
                                <div className="font-display text-[#0E1B2C] text-base mt-0.5 leading-snug">
                                    1st Floor, Above SK Finance
                                    <br />
                                    Beside Upadhyay Honda Showroom
                                    <br />
                                    Sekdakhedi Road, New Bus Stand
                                    <br />
                                    Sehore, Madhya Pradesh – 466001
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="lg:col-span-7 card-cream p-7 md:p-8">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Full Name" required>
                            <input
                                required
                                data-testid={IDS.contact.name}
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                className="input-cream"
                            />
                        </Field>
                        <Field label="Phone" required>
                            <input
                                required
                                data-testid={IDS.contact.phone}
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="input-cream"
                                inputMode="tel"
                            />
                        </Field>
                        <Field label="Email (Optional)">
                            <input
                                type="email"
                                data-testid={IDS.contact.email}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="input-cream"
                            />
                        </Field>
                        <Field label="Service">
                            <select
                                data-testid={IDS.contact.service}
                                value={form.service}
                                onChange={(e) => setForm({ ...form, service: e.target.value })}
                                className="input-cream"
                            >
                                <option value="">Select a service</option>
                                {SERVICES.map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <div className="mt-4">
                        <Field label="Message (Optional)">
                            <textarea
                                rows={4}
                                data-testid={IDS.contact.message}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className="input-cream"
                            />
                        </Field>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            data-testid={IDS.contact.submit}
                            className="btn-pill btn-primary justify-center disabled:opacity-50"
                        >
                            <Send size={16} /> {loading ? "Sending…" : "Send Request"}
                        </button>
                        <a
                            href="https://wa.me/917773805794?text=Hi%20Sagar%20ji%2C%20I%20want%20to%20know%20more%20about%20mutual%20fund%20investments."
                            target="_blank"
                            rel="noreferrer"
                            className="btn-pill btn-ghost justify-center"
                        >
                            <MessageCircle size={16} /> Chat on WhatsApp
                        </a>
                    </div>
                    <p className="text-[11px] text-[#5C677D] mt-4">
                        By submitting, you agree to be contacted by The Financial Doctor (ARN-290298). We
                        respect your privacy and do not share data.
                    </p>

                    <style>{`
                        .input-cream {
                            width: 100%;
                            background: #F6F1E8;
                            border: 1px solid #E2D8C2;
                            border-radius: 12px;
                            padding: 12px 14px;
                            color: #0E1B2C;
                            font-family: inherit;
                        }
                        .input-cream:focus { border-color: #024396; }
                    `}</style>
                </form>
            </div>
        </section>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#5C677D] mb-2">
                {label}
                {required && <span className="text-[#C7102E] ml-0.5">*</span>}
            </span>
            {children}
        </label>
    );
}
