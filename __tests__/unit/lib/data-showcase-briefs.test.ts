/**
 * Tests for lib/data/showcase-briefs.ts
 *
 * Tests the showcase briefs data and utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  SHOWCASE_BRIEFS,
  getRandomShowcaseBriefs,
  getFeaturedBriefs,
  ShowcaseBrief,
} from "@/lib/data/showcase-briefs";

describe("data/showcase-briefs", () => {
  describe("SHOWCASE_BRIEFS", () => {
    it("contains multiple briefs", () => {
      expect(SHOWCASE_BRIEFS.length).toBeGreaterThan(0);
      expect(SHOWCASE_BRIEFS.length).toBeGreaterThanOrEqual(6);
    });

    it("each brief has required properties", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("each brief has valid id format", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(typeof brief.id).toBe("string");
        expect(brief.id.length).toBeGreaterThan(0);
        // IDs should be slug-like (lowercase with hyphens)
        expect(brief.id).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it("each brief has non-empty question", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(typeof brief.question).toBe("string");
        expect(brief.question.length).toBeGreaterThan(10);
      });
    });

    it("each brief has valid clarity score (0-10)", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(typeof brief.clarity_score).toBe("number");
        expect(brief.clarity_score).toBeGreaterThanOrEqual(0);
        expect(brief.clarity_score).toBeLessThanOrEqual(10);
      });
    });

    it("each brief has at least one tag", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(Array.isArray(brief.tags)).toBe(true);
        expect(brief.tags.length).toBeGreaterThan(0);
      });
    });

    it("each brief has valid read time format", () => {
      SHOWCASE_BRIEFS.forEach((brief) => {
        expect(typeof brief.readTime).toBe("string");
        expect(brief.readTime).toMatch(/^\d+ min$/);
      });
    });

    it("all brief IDs are unique", () => {
      const ids = SHOWCASE_BRIEFS.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("includes expected sample briefs", () => {
      const ids = SHOWCASE_BRIEFS.map((b) => b.id);
      expect(ids).toContain("what-is-a-state");
      expect(ids).toContain("uk-four-day-week");
    });
  });

  describe("getRandomShowcaseBriefs", () => {
    it("returns the requested number of briefs", () => {
      const result = getRandomShowcaseBriefs(3);
      expect(result).toHaveLength(3);
    });

    it("defaults to 6 briefs when no count specified", () => {
      const result = getRandomShowcaseBriefs();
      expect(result).toHaveLength(6);
    });

    it("returns valid ShowcaseBrief objects", () => {
      const result = getRandomShowcaseBriefs(4);
      result.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("returns briefs from the SHOWCASE_BRIEFS array", () => {
      const result = getRandomShowcaseBriefs(4);
      const showcaseIds = SHOWCASE_BRIEFS.map((b) => b.id);
      result.forEach((brief) => {
        expect(showcaseIds).toContain(brief.id);
      });
    });

    it("returns unique briefs (no duplicates)", () => {
      const result = getRandomShowcaseBriefs(6);
      const ids = result.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("handles count larger than available briefs", () => {
      const result = getRandomShowcaseBriefs(100);
      expect(result.length).toBe(SHOWCASE_BRIEFS.length);
    });

    it("handles count of 0", () => {
      const result = getRandomShowcaseBriefs(0);
      expect(result).toHaveLength(0);
    });

    it("handles count of 1", () => {
      const result = getRandomShowcaseBriefs(1);
      expect(result).toHaveLength(1);
    });

    it("returns different results on multiple calls (randomness)", () => {
      // Run multiple times and check that we get different orderings
      const results: string[][] = [];
      for (let i = 0; i < 10; i++) {
        results.push(getRandomShowcaseBriefs(6).map((b) => b.id));
      }

      // At least some results should be different (very unlikely to be all same)
      const uniqueResults = new Set(results.map((r) => r.join(",")));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe("getFeaturedBriefs", () => {
    it("returns 6 briefs", () => {
      const result = getFeaturedBriefs();
      expect(result).toHaveLength(6);
    });

    it("always includes the first two showcase briefs", () => {
      const result = getFeaturedBriefs();
      const resultIds = result.map((b) => b.id);

      // First two from SHOWCASE_BRIEFS should always be included
      expect(resultIds).toContain(SHOWCASE_BRIEFS[0].id);
      expect(resultIds).toContain(SHOWCASE_BRIEFS[1].id);
    });

    it("returns valid ShowcaseBrief objects", () => {
      const result = getFeaturedBriefs();
      result.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("returns unique briefs (no duplicates)", () => {
      const result = getFeaturedBriefs();
      const ids = result.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("varies the additional 4 briefs randomly", () => {
      // Get the non-featured briefs (after first 2)
      const results: string[][] = [];
      for (let i = 0; i < 10; i++) {
        const featured = getFeaturedBriefs();
        // Get IDs of the last 4 (random ones)
        results.push(featured.slice(2).map((b) => b.id));
      }

      // Should have some variation
      const uniqueResults = new Set(results.map((r) => r.join(",")));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe("ShowcaseBrief interface", () => {
    it("can be used to type check briefs", () => {
      const validBrief: ShowcaseBrief = {
        id: "test-brief",
        question: "Is this a test question?",
        clarity_score: 8.5,
        tags: ["Test", "Example"],
        readTime: "5 min",
      };

      expect(validBrief.id).toBe("test-brief");
      expect(validBrief.clarity_score).toBe(8.5);
    });
  });
});
