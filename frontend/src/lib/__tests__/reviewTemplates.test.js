/**
 * Unit tests for lib/reviewTemplates.js.
 */
import { REVIEW_TEMPLATES, pickRandomTemplate } from "../reviewTemplates";

describe("REVIEW_TEMPLATES", () => {
    it("contains at least 5 templates", () => {
        expect(REVIEW_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it("all templates are non-empty strings", () => {
        REVIEW_TEMPLATES.forEach((t) => {
            expect(typeof t).toBe("string");
            expect(t.length).toBeGreaterThan(20);
        });
    });

    it("all templates are unique", () => {
        const unique = new Set(REVIEW_TEMPLATES);
        expect(unique.size).toBe(REVIEW_TEMPLATES.length);
    });
});

describe("pickRandomTemplate", () => {
    it("returns a string from the templates array", () => {
        const result = pickRandomTemplate();
        expect(REVIEW_TEMPLATES).toContain(result);
    });

    it("returns different values over multiple calls (probabilistic)", () => {
        const results = new Set();
        for (let i = 0; i < 50; i++) {
            results.add(pickRandomTemplate());
        }
        expect(results.size).toBeGreaterThan(1);
    });
});
