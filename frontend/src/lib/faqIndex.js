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

export const FAQ_INDEX = SOURCES.flatMap((s) =>
    (s.data?.en || []).map((item) => ({
        source: s.label,
        sourceKey: s.key,
        path: s.path,
        q: item.q,
        a: item.a,
    }))
);
