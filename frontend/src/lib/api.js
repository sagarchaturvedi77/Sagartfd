import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_tgaf18k";
const TEMPLATE_ID = "template_ikee3pt";
const PUBLIC_KEY = "FvB3BN4WHB03ZhD5R";

emailjs.init(PUBLIC_KEY);

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
    listReviews: () => Promise.resolve([]),
    reviewStats: () => Promise.resolve({ average: 0, count: 0 }),
    createReview: () => Promise.resolve({}),
    topFunds: () => Promise.resolve({ categories: [], funds: [] }),
    searchFunds: () => Promise.resolve([]),
    fundDetail: () => Promise.resolve({}),
};

export default {};
