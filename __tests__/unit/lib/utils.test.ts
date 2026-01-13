/**
 * Tests for lib/utils.ts
 *
 * Tests the utility functions used throughout the application.
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn (class names utility)", () => {
    it("merges simple class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional class names", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
      expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
    });

    it("handles undefined and null values", () => {
      expect(cn("foo", undefined, "bar")).toBe("foo bar");
      expect(cn("foo", null, "bar")).toBe("foo bar");
    });

    it("handles empty strings", () => {
      expect(cn("foo", "", "bar")).toBe("foo bar");
    });

    it("handles arrays of class names", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
      expect(cn("baz", ["foo", "bar"])).toBe("baz foo bar");
    });

    it("handles objects with boolean values", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("merges Tailwind classes correctly", () => {
      // Later classes should override earlier ones
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles complex Tailwind merging", () => {
      expect(cn("p-4", "px-6")).toBe("p-4 px-6");
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe(
        "hover:bg-blue-500"
      );
    });

    it("handles responsive variants", () => {
      expect(cn("sm:px-2", "sm:px-4")).toBe("sm:px-4");
      expect(cn("md:text-lg", "lg:text-xl")).toBe("md:text-lg lg:text-xl");
    });

    it("handles no arguments", () => {
      expect(cn()).toBe("");
    });

    it("handles single argument", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("handles mixed input types", () => {
      expect(
        cn("base", { conditional: true }, ["array-class"], undefined, "final")
      ).toBe("base conditional array-class final");
    });
  });
});
