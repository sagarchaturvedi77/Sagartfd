import React, { useState } from "react";
import { X, Car, Send } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { FormFieldBlock as Field } from "@/components/FormField";

const ADDONS = [
    "Zero Depreciation",
    "Engine Protection",
    "Roadside Assistance",
    "Personal Accident Cover",
    "NCB Protection",
];

export default function MotorInsuranceForm({ open, onClose }) {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        regNo: "",
        insuranceType: "Comprehensive",
        expiry: "",
        oldCompany: "",
    });
    const [addons, setAddons] = useState([]);

    if (!open) return null;

    const toggleAddon = (a) => {
        setAddons((prev) =>
            prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
        );
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const lines = [
            `Hi Sagar ji, I want a Motor Insurance quote.`,
            ``,
            `*Name:* ${form.name}`,
            `*Phone:* ${form.phone}`,
            `*Vehicle Reg. No:* ${form.regNo}`,
            `*Insurance Type:* ${form.insuranceType}`,
            addons.length ? `*Add-ons:* ${addons.join(", ")}` : null,
            form.expiry ? `*Old Policy Expiry:* ${form.expiry}` : null,
            form.oldCompany ? `*Old Insurance Company:* ${form.oldCompany}` : null,
        ].filter(Boolean);

        const message = encodeURIComponent(lines.join("\n"));
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(url, "_blank", "noopener,noreferrer");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center bg-[#0E1B2C]/40 backdrop-blur-sm p-3 sm:p-6"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#FBF7EE] border border-[#E2D8C2] rounded-3xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                {/* Header */}
                <div className="px-5 py-4 bg-[#0E1B2C] text-[#F6F1E8] flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#024396] to-[#C7102E] grid place-items-center">
                            <Car size={18} />
                        </span>
                        <div>
                            <div className="font-display text-lg leading-none">Motor Insurance</div>
                            <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mt-1">
                                Quick Quote Form
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#F6F1E8]/80 hover:text-[#F6F1E8] p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <Field label="Full Name" required>
                        <input
                            required
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Your name"
                        />
                    </Field>

                    <Field label="Phone Number" required>
                        <input
                            required
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="10-digit mobile number"
                        />
                    </Field>

                    <Field label="Vehicle Registration Number" required>
                        <input
                            required
                            name="regNo"
                            value={form.regNo}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g. MP04 AB 1234"
                        />
                    </Field>

                    <Field label="Insurance Type">
                        <select
                            name="insuranceType"
                            value={form.insuranceType}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option>Comprehensive</option>
                            <option>Third Party</option>
                            <option>First Party (Own Damage)</option>
                        </select>
                    </Field>

                    <Field label="Add-ons (optional)">
                        <div className="flex flex-wrap gap-2">
                            {ADDONS.map((a) => (
                                <button
                                    type="button"
                                    key={a}
                                    onClick={() => toggleAddon(a)}
                                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                                        addons.includes(a)
                                            ? "bg-[#024396] text-white border-transparent"
                                            : "bg-white border-[#E2D8C2] text-[#0E1B2C]"
                                    }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Old Policy Expiry Date (optional)">
                        <input
                            type="date"
                            name="expiry"
                            value={form.expiry}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </Field>

                    <Field label="Old Insurance Company (optional)">
                        <input
                            name="oldCompany"
                            value={form.oldCompany}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g. ICICI Lombard"
                        />
                    </Field>

                    <button
                        type="submit"
                        className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#024396] hover:bg-[#012E6B] text-white font-medium py-3 rounded-full transition-colors"
                    >
                        <Send size={16} /> Send via WhatsApp
                    </button>
                    <p className="text-[11px] text-[#5C677D] text-center pt-1">
                        Aapki details WhatsApp pe Sagar ji ko bheji jayegi.
                    </p>
                </form>
            </div>
        </div>
    );
}
