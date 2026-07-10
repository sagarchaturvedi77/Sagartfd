import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_tgaf18k";
const TEMPLATE_ID = "template_ikee3pt";
const PUBLIC_KEY = "FvB3BN4WHB03ZhD5R";

emailjs.init(PUBLIC_KEY);

// Backend base URL — same env var portal/api.js uses, so this works against
// whatever backend is actually running (local dev port or the deployed
// Render URL) instead of a hardcoded dead address.
const BACKEND_BASE_URL = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export const api = {
    // 1. Contact Form Submit (EmailJS + Backend DB Backup)
    submitContact: async (payload) => {
        try {
            // EmailJS send
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
                from_name: payload.full_name,
                phone: payload.phone,
                email: payload.email || "Not provided",
                service: payload.service || "Not selected",
                message: payload.message || "No message",
            });

            // Saath hi backend database mein save karne ke liye request
            await fetch(`${BACKEND_BASE_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            return { success: true };
        } catch (error) {
            console.error("Contact submission failed:", error);
            throw error;
        }
    },

    // 2. Reviews List le kar aana backend se
    listReviews: async (limit = 50) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/reviews?limit=${limit}`);
            if (!res.ok) throw new Error("Failed to fetch reviews");
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // 3. Reviews ke Stats (Average Rating)
    reviewStats: async () => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/reviews/stats`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            return await res.json();
        } catch (error) {
            console.error(error);
            return { average: 0, count: 0 };
        }
    },

    // 4. Naya Review Create karna
    createReview: async (payload) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to create review");
            return await res.json();
        } catch (error) {
            console.error(error);
            return {};
        }
    },

    // 5. Mutual Funds - Top Funds curated list
    topFunds: async () => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/mf/top-funds`);
            if (!res.ok) throw new Error("Failed to fetch top funds");
            return await res.json();
        } catch (error) {
            console.error(error);
            return { categories: [], funds: [] };
        }
    },

    // 6. Mutual Funds - Search bar functionality
    searchFunds: async (query) => {
        if (!query || query.length < 2) return [];
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/mf/search?q=${query}`);
            if (!res.ok) throw new Error("Search failed");
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // 7. Mutual Funds - Kisi specific fund ki detail aur graph history
    fundDetail: async (code) => {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/mf/${code}`);
            if (!res.ok) throw new Error("Failed to fetch fund details");
            return await res.json();
        } catch (error) {
            console.error(error);
            return {};
        }
    }
};

export default {};
