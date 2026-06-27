/**
 * Unit tests for constants/testIds — ensures test ID registry is complete and consistent.
 */
import { IDS } from "../testIds";

describe("IDS (test ID registry)", () => {
    it("has nav section with required IDs", () => {
        expect(IDS.nav).toBeDefined();
        expect(IDS.nav.logo).toBe("nav-logo");
        expect(IDS.nav.cta).toBe("nav-cta-start");
        expect(IDS.nav.whatsapp).toBe("nav-whatsapp");
    });

    it("has hero section with required IDs", () => {
        expect(IDS.hero).toBeDefined();
        expect(IDS.hero.startInvesting).toBe("hero-start-investing");
        expect(IDS.hero.whatsapp).toBe("hero-whatsapp");
    });

    it("has calc section with all tab IDs", () => {
        expect(IDS.calc).toBeDefined();
        expect(IDS.calc.tabSip).toBeTruthy();
        expect(IDS.calc.tabLumpsum).toBeTruthy();
        expect(IDS.calc.tabSwp).toBeTruthy();
        expect(IDS.calc.tabGoal).toBeTruthy();
        expect(IDS.calc.tabEmi).toBeTruthy();
        expect(IDS.calc.tabDaily).toBeTruthy();
    });

    it("has calc input IDs", () => {
        expect(IDS.calc.amount).toBeTruthy();
        expect(IDS.calc.years).toBeTruthy();
        expect(IDS.calc.rate).toBeTruthy();
        expect(IDS.calc.dailyAmount).toBeTruthy();
    });

    it("has reviews section with form fields", () => {
        expect(IDS.reviews).toBeDefined();
        expect(IDS.reviews.form).toBeTruthy();
        expect(IDS.reviews.name).toBeTruthy();
        expect(IDS.reviews.message).toBeTruthy();
        expect(IDS.reviews.submit).toBeTruthy();
    });

    it("reviews.star is a function that returns dynamic IDs", () => {
        expect(typeof IDS.reviews.star).toBe("function");
        expect(IDS.reviews.star(1)).toBe("reviews-star-1");
        expect(IDS.reviews.star(5)).toBe("reviews-star-5");
    });

    it("has contact section with form fields", () => {
        expect(IDS.contact).toBeDefined();
        expect(IDS.contact.name).toBeTruthy();
        expect(IDS.contact.phone).toBeTruthy();
        expect(IDS.contact.email).toBeTruthy();
        expect(IDS.contact.submit).toBeTruthy();
    });

    it("all string IDs are non-empty", () => {
        const checkObject = (obj) => {
            Object.values(obj).forEach((val) => {
                if (typeof val === "string") {
                    expect(val.length).toBeGreaterThan(0);
                } else if (typeof val === "object" && val !== null) {
                    checkObject(val);
                }
            });
        };
        checkObject(IDS);
    });
});
