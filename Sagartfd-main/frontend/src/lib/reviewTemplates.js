// Pre-written review templates — pick one or rotate. All 5★ tone.
export const REVIEW_TEMPLATES = [
    "Sagar sir ne meri financial planning ko bilkul badal diya. SIP advice se mera portfolio aaram se grow ho raha hai. Highly recommended for anyone in Sehore!",
    "Best mutual fund distributor in Sehore. Transparent advice, no pushy selling. Har sawaal ka simple language me jawab milta hai.",
    "The Financial Doctor team is truly professional. AssetPlus onboarding was super smooth and Sagar ji ne har SIP ka logic clearly samjhaya.",
    "Free portfolio review me Sagar ji ne mere underperforming funds identify kiye aur better Regular Plan options suggest kiye. Returns clearly improve hue hain.",
    "First-time investor tha — Sagar sir ne SIP, term insurance, sab kuch step-by-step samjhaya. Family ki financial security peaceful feel ho rahi hai.",
    "ELSS ke through tax bachaya aur retirement ke liye proper goal-based SIP setup karwaya. Ekdum honest aur knowledgeable advisor in MP.",
    "Sagar ji ki advice ekdum down-to-earth hai. No jargons, no over-promises. Family ke har goal ke liye clear roadmap diya.",
    "Health insurance, term insurance aur mutual fund — sab ek hi expert se. Trust + clarity = The Financial Doctor.",
];

/** Return a random template per call (used to pre-fill the review form). */
export function pickRandomTemplate() {
    return REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
}
