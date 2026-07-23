// Central, searchable index of every page's FAQ questions — consumed by
// SearchPage.jsx and PublicFAQ.jsx (the "all FAQs, one place, searchable"
// page). Pulls the English array from each page's exported FAQ object
// rather than re-typing the content, so this index can never drift out of
// sync with what's actually shown on each dedicated page.
import { aboutFAQ } from "@/pages/AboutPage";
import { servicesFAQ } from "@/pages/ServicesPage";
import { reviewsFAQ } from "@/pages/ReviewsPage";
import { contactFAQ } from "@/pages/ContactPage";
import { calcFAQ } from "@/pages/CalculatorsPage";
import { fundsFAQ } from "@/pages/TopFundsPage";
import { partnerFAQ } from "@/pages/PartnerPage";

const SOURCES = [
    { key: "about", label: "About", path: "/about", data: aboutFAQ },
    { key: "services", label: "Services", path: "/services", data: servicesFAQ },
    { key: "reviews", label: "Reviews", path: "/reviews", data: reviewsFAQ },
    { key: "contact", label: "Contact", path: "/contact", data: contactFAQ },
    { key: "calculators", label: "Calculators", path: "/calculators", data: calcFAQ },
    { key: "top-funds", label: "Top Funds", path: "/top-funds", data: fundsFAQ },
    { key: "partner", label: "Partner Program", path: "/partner-with-us", data: partnerFAQ },
];

export const FAQ_SOURCES = SOURCES;

// Stable, URL-safe id for a single FAQ item, derived purely from its
// question text — so the same question always resolves to the same id
// (usable as a `#hash` deep link) no matter which page/position it ends
// up on. A short deterministic hash suffix is always appended, not only
// when an ASCII-slug collision is spotted: Hindi/Hinglish question text
// strips down to an empty (or near-identical) ASCII slug once non-Latin
// characters are removed, so most Hindi questions in the same list would
// otherwise collide on the same id. The hash keeps every id unique
// regardless of script.
const COMBINING_DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function slugifyFaqId(text) {
    const raw = String(text || "");
    const base = raw
        .toLowerCase()
        .normalize("NFKD")
        .replace(COMBINING_DIACRITICS_RE, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = (hash * 31 + raw.charCodeAt(i)) | 0;
    }
    const suffix = Math.abs(hash).toString(36);
    return `faq-${base ? `${base}-` : ""}${suffix}`;
}

export const FAQ_INDEX = SOURCES.flatMap((s) =>
    (s.data?.en || []).map((item) => ({
        source: s.label,
        sourceKey: s.key,
        path: s.path,
        q: item.q,
        a: item.a,
        id: slugifyFaqId(item.q),
    }))
);
