/**
 * Unit tests for lib/recommendations.js — validates data structure integrity.
 */
import { CALC_RECOMMENDATIONS, AI_PLAN_RECOMMENDATIONS } from "../recommendations";

describe("CALC_RECOMMENDATIONS", () => {
    const expectedTabs = ["sip", "daily", "lumpsum", "swp", "goal", "emi"];

    it("has entries for all calculator tabs", () => {
        expectedTabs.forEach((tab) => {
            expect(CALC_RECOMMENDATIONS).toHaveProperty(tab);
        });
    });

    it("each tab has exactly 3 recommendations", () => {
        expectedTabs.forEach((tab) => {
            expect(CALC_RECOMMENDATIONS[tab]).toHaveLength(3);
        });
    });

    it("each recommendation has en and hi translations", () => {
        expectedTabs.forEach((tab) => {
            CALC_RECOMMENDATIONS[tab].forEach((rec) => {
                expect(rec).toHaveProperty("en");
                expect(rec).toHaveProperty("hi");
                expect(typeof rec.en).toBe("string");
                expect(typeof rec.hi).toBe("string");
                expect(rec.en.length).toBeGreaterThan(10);
                expect(rec.hi.length).toBeGreaterThan(10);
            });
        });
    });
});

describe("AI_PLAN_RECOMMENDATIONS", () => {
    it("is an array with at least 3 entries", () => {
        expect(Array.isArray(AI_PLAN_RECOMMENDATIONS)).toBe(true);
        expect(AI_PLAN_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(3);
    });

    it("each entry has en and hi translations", () => {
        AI_PLAN_RECOMMENDATIONS.forEach((rec) => {
            expect(rec).toHaveProperty("en");
            expect(rec).toHaveProperty("hi");
            expect(typeof rec.en).toBe("string");
            expect(typeof rec.hi).toBe("string");
        });
    });
});
