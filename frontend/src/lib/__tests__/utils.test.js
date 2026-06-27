/**
 * Unit tests for lib/utils.js — the cn() utility function.
 */
import { cn } from "../utils";

describe("cn (className merge utility)", () => {
    it("merges simple class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes via clsx", () => {
        expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("resolves tailwind conflicts (last wins)", () => {
        const result = cn("px-4", "px-6");
        expect(result).toBe("px-6");
    });

    it("handles empty inputs", () => {
        expect(cn()).toBe("");
        expect(cn("")).toBe("");
    });

    it("handles undefined and null", () => {
        expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("handles array inputs", () => {
        expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("resolves conflicting tailwind text colors", () => {
        const result = cn("text-red-500", "text-blue-500");
        expect(result).toBe("text-blue-500");
    });
});
