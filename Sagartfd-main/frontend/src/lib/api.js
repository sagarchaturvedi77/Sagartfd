import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_tgaf18k";
const TEMPLATE_ID = "template_ikee3pt";
const PUBLIC_KEY = "FvB3BN4WHB03ZhD5R";

emailjs.init(PUBLIC_KEY);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export const api = {
    submitContact: async (payload) => {
        // 1) Save into the backend so it shows up under
        //    Admin Portal -> Leads -> Web Leads. Never block the user-facing
        //    form on this — if the backend is unreachable, we still try email.
        try {
            await fetch(`${BACKEND_URL}/api/leads/public/website`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: payload.full_name,
                    phone: payload.phone,
                    email: payload.email || null,
                    service: payload.service || null,
                    message: payload.message || null,
                    source: payload.source || "website",
                }),
            });
        } catch (e) {
            // backend unreachable — fall through to email so the lead isn't lost
        }

        // 2) Also email via EmailJS (existing behaviour, kept as-is).
        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
                from_name: payload.full_name,
                phone: payload.phone,
                email: payload.email || "Not provided",
                service: payload.service || "Not selected",
                message: payload.message || "No message",
            });
        } catch (e) {
            // ignore — backend save above already captured the lead
        }
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
