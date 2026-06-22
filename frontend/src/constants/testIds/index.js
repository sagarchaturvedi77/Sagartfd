// Central test-id registry for stable selectors.
export const IDS = {
    nav: {
        logo: "nav-logo",
        cta: "nav-cta-start",
        whatsapp: "nav-whatsapp",
    },
    hero: {
        startInvesting: "hero-start-investing",
        whatsapp: "hero-whatsapp",
    },
    calc: {
        tabSip: "calc-tab-sip",
        tabLumpsum: "calc-tab-lumpsum",
        tabSwp: "calc-tab-swp",
        tabGoal: "calc-tab-goal",
        tabEmi: "calc-tab-emi",
        tabDaily: "calc-tab-daily",
        amount: "calc-input-amount",
        years: "calc-input-years",
        rate: "calc-input-rate",
        startPlan: "calc-start-plan",
        download: "calc-download-png",
        snapshot: "calc-snapshot",
        result: "calc-result",
        dailyAmount: "calc-input-daily-amount",
    },
    funds: {
        category: "funds-category",
        search: "funds-search",
        table: "funds-table",
        searchResults: "funds-search-results",
    },
    reviews: {
        form: "reviews-form",
        name: "reviews-name",
        location: "reviews-location",
        message: "reviews-message",
        submit: "reviews-submit",
        list: "reviews-list",
        star: (i) => `reviews-star-${i}`,
    },
    contact: {
        name: "contact-name",
        phone: "contact-phone",
        email: "contact-email",
        service: "contact-service",
        message: "contact-message",
        submit: "contact-submit",
    },
};

export default IDS;
