import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({
    baseURL: API,
    timeout: 20000,
});

export const api = {
    listReviews: () => http.get("/reviews").then((r) => r.data),
    reviewStats: () => http.get("/reviews/stats").then((r) => r.data),
    createReview: (payload) => http.post("/reviews", payload).then((r) => r.data),
    submitContact: (payload) => http.post("/contact", payload).then((r) => r.data),
    topFunds: () => http.get("/mf/top-funds").then((r) => r.data),
    searchFunds: (q) => http.get("/mf/search", { params: { q } }).then((r) => r.data),
    fundDetail: (code) => http.get(`/mf/${code}`).then((r) => r.data),
};

export default http;
