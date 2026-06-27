import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_tgaf18k";
const TEMPLATE_ID = "template_ikee3pt";
const PUBLIC_KEY = "FvB3BN4WHB03ZhD5R";

emailjs.init(PUBLIC_KEY);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

async function apiFetch(path, options = {}) {
    const url = `${BACKEND_URL}${path}`;
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`API ${options.method || "GET"} ${path} failed (${res.status}): ${detail}`);
    }
    return res.json();
}

export const api = {
    submitContact: async (payload) => {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            from_name: payload.full_name,
            phone: payload.phone,
            email: payload.email || "Not provided",
            service: payload.service || "Not selected",
            message: payload.message || "No message",
        });
        return { success: true };
    },
    listReviews: (limit = 50) =>
        apiFetch(`/api/reviews?limit=${limit}`).catch((err) => {
            console.error("listReviews failed:", err);
            throw err;
        }),
    reviewStats: () =>
        apiFetch("/api/reviews/stats").catch((err) => {
            console.error("reviewStats failed:", err);
            throw err;
        }),
    createReview: (payload) =>
        apiFetch("/api/reviews", {
            method: "POST",
            body: JSON.stringify(payload),
        }).catch((err) => {
            console.error("createReview failed:", err);
            throw err;
        }),
    topFunds: () =>
        apiFetch("/api/mf/top-funds").catch((err) => {
            console.error("topFunds failed:", err);
            throw err;
        }),
    searchFunds: (q) =>
        apiFetch(`/api/mf/search?q=${encodeURIComponent(q)}`).catch((err) => {
            console.error("searchFunds failed:", err);
            throw err;
        }),
    fundDetail: (code) =>
        apiFetch(`/api/mf/${code}`).catch((err) => {
            console.error("fundDetail failed:", err);
            throw err;
        }),
};

export default {};
