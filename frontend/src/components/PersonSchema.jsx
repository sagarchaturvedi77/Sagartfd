import { useEffect } from "react";
import { LINKS } from "@/lib/links";

const SITE_URL = "https://thefinancialdoctor.in";

// Site-wide Person + Organization JSON-LD — mounted once in App.js so it's
// present on every route without duplicating in each page. This is the
// entity data Google's Knowledge Panel and AI answer engines (ChatGPT,
// Perplexity) draw from when someone searches "Sagar Chaturvedi" or "best
// mutual fund advisor [city]" — kept factually consistent with the rest of
// the site (Sehore-based; no unverified alternate names) rather than
// invented for the sake of a richer-looking schema block.
// Stable @id for the Organization entity — referenced from here AND from
// PublicBlog.jsx's BlogPosting.publisher (instead of each repeating its own
// separate, partial Organization object), so Google/AI answer engines see
// ONE canonical "The Financial Doctor" entity, not several fragments.
export const ORG_ID = `${SITE_URL}/#organization`;

export default function PersonSchema() {
    useEffect(() => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Person",
                    "@id": `${SITE_URL}/about#sagar-chaturvedi`,
                    name: "Sagar Chaturvedi",
                    alternateName: ["Sagar Chaturvedi Financial Doctor", "Sagar ji", "TFD Sagar"],
                    jobTitle: "Financial Consultant & AMFI Registered Mutual Fund Distributor",
                    description:
                        "Sagar Chaturvedi is an AMFI-registered Mutual Fund Distributor (ARN-290298) and founder of The Financial Doctor (TFD), based in Sehore, Madhya Pradesh, serving 1000+ families across Madhya Pradesh and India through goal-based mutual fund and insurance advisory.",
                    url: `${SITE_URL}/about`,
                    image: `${SITE_URL}/assets/founder/sagar-photo.webp`,
                    knowsAbout: [
                        "Mutual Funds",
                        "SIP Strategy",
                        "SWP Pension Planning",
                        "Wealth Management",
                        "Financial Planning",
                        "Stock Market History",
                    ],
                    worksFor: { "@id": ORG_ID },
                    address: {
                        "@type": "PostalAddress",
                        streetAddress: "1st Floor, above SK Finance, Sekdakhedi Road, New Bus Stand",
                        addressLocality: "Sehore",
                        addressRegion: "Madhya Pradesh",
                        postalCode: "466001",
                        addressCountry: "IN",
                    },
                    areaServed: [
                        "Sehore", "Bhopal", "Indore", "Madhya Pradesh", "Chhattisgarh",
                        "Mumbai", "Maharashtra", "Delhi NCR", "Gujarat", "Uttar Pradesh", "Bihar", "India",
                    ],
                    sameAs: [
                        LINKS.linkedin,
                        LINKS.instagram,
                        LINKS.youtube,
                        LINKS.googleBusiness,
                        LINKS.assetPlus,
                    ].filter(Boolean),
                },
                {
                    "@type": "Organization",
                    "@id": ORG_ID,
                    name: "The Financial Doctor",
                    // "TFD" is how the brand refers to itself sitewide (TFD
                    // PartnerHub, TFD WorkSpace, TFD Internship) and how many
                    // clients actually search — a real, established
                    // abbreviation, not one invented for SEO.
                    alternateName: "TFD",
                    url: SITE_URL,
                    logo: `${SITE_URL}/assets/logos/TFD-MAIN-LOGO.webp`,
                    founder: { "@id": `${SITE_URL}/about#sagar-chaturvedi` },
                    address: {
                        "@type": "PostalAddress",
                        streetAddress: "1st Floor, above SK Finance, Sekdakhedi Road, New Bus Stand",
                        addressLocality: "Sehore",
                        addressRegion: "Madhya Pradesh",
                        postalCode: "466001",
                        addressCountry: "IN",
                    },
                    sameAs: [
                        LINKS.linkedin,
                        LINKS.instagram,
                        LINKS.youtube,
                        LINKS.googleBusiness,
                        LINKS.assetPlus,
                    ].filter(Boolean),
                },
            ],
        });
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    return null;
}
