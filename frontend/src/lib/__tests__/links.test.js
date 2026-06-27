/**
 * Unit tests for lib/links.js — validates brand link integrity.
 */
import { LINKS } from "../links";

describe("LINKS", () => {
    it("contains all required brand links", () => {
        const requiredKeys = [
            "assetPlus",
            "whatsappDM",
            "whatsappCommunity",
            "googleReviews",
            "instagram",
            "youtube",
            "linkedin",
            "phone",
            "email",
        ];
        requiredKeys.forEach((key) => {
            expect(LINKS).toHaveProperty(key);
        });
    });

    it("all URL values are valid URLs or contact strings", () => {
        const urlKeys = [
            "assetPlus",
            "whatsappDM",
            "whatsappCommunity",
            "googleReviews",
            "instagram",
            "youtube",
            "linkedin",
        ];
        urlKeys.forEach((key) => {
            expect(LINKS[key]).toMatch(/^https?:\/\//);
        });
    });

    it("assetPlus URL contains ARN number", () => {
        expect(LINKS.assetPlus).toContain("ARN-290298");
    });

    it("whatsapp links point to correct number", () => {
        expect(LINKS.whatsappDM).toContain("917773805794");
    });

    it("phone is a valid Indian number", () => {
        expect(LINKS.phone).toMatch(/^\+91\d{10}$/);
    });

    it("email is a valid format", () => {
        expect(LINKS.email).toMatch(/.+@.+\..+/);
    });
});
