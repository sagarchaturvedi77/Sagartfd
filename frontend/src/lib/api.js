import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

export const api = {
    submitContact: async (payload) => {
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            console.warn("EmailJS not configured — set REACT_APP_EMAILJS_* env vars");
            return { success: false };
        }
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            from_name: payload.full_name,
            phone: payload.phone,
            email: payload.email || "Not provided",
            service: payload.service || "Not selected",
            message: payload.message || "No message",
        });
        return { success: true };
    },
    listReviews: () => Promise.resolve([]),
    reviewStats: () => Promise.resolve({ average: 0, count: 0 }),
    createReview: () => Promise.resolve({}),
    topFunds: () => Promise.resolve({ categories: [], funds: [] }),
    searchFunds: () => Promise.resolve([]),
    fundDetail: () => Promise.resolve({}),
};

export default {};
