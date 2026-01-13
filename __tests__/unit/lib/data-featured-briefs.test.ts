/**
 * Tests for lib/data/featured-briefs.ts
 *
 * Tests the featured briefs data and utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  FEATURED_BRIEFS,
  getRandomFeaturedBriefs,
  getRotatingFeaturedBriefs,
  FeaturedBrief,
} from "@/lib/data/featured-briefs";

describe("data/featured-briefs", () => {
  describe("FEATURED_BRIEFS", () => {
    it("contains multiple briefs", () => {
      expect(FEATURED_BRIEFS.length).toBeGreaterThan(0);
      expect(FEATURED_BRIEFS.length).toBeGreaterThanOrEqual(6);
    });

    it("each brief has required properties", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("excerpt");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("each brief has valid id format (slug)", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(typeof brief.id).toBe("string");
        expect(brief.id.length).toBeGreaterThan(0);
        expect(brief.id).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it("each brief has non-empty question", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(typeof brief.question).toBe("string");
        expect(brief.question.length).toBeGreaterThan(10);
      });
    });

    it("each brief has meaningful excerpt (2-3 sentences)", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(typeof brief.excerpt).toBe("string");
        expect(brief.excerpt.length).toBeGreaterThan(50);
        // Excerpts should be reasonably long but not too long
        expect(brief.excerpt.length).toBeLessThan(500);
      });
    });

    it("each brief has valid clarity score (0-10)", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(typeof brief.clarity_score).toBe("number");
        expect(brief.clarity_score).toBeGreaterThanOrEqual(0);
        expect(brief.clarity_score).toBeLessThanOrEqual(10);
      });
    });

    it("featured briefs have high quality scores (7+)", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(brief.clarity_score).toBeGreaterThanOrEqual(7);
      });
    });

    it("each brief has at least one tag", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(Array.isArray(brief.tags)).toBe(true);
        expect(brief.tags.length).toBeGreaterThan(0);
      });
    });

    it("each brief has valid read time format", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        expect(typeof brief.readTime).toBe("string");
        expect(brief.readTime).toMatch(/^\d+ min$/);
      });
    });

    it("all brief IDs are unique", () => {
      const ids = FEATURED_BRIEFS.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("includes key briefs", () => {
      const ids = FEATURED_BRIEFS.map((b) => b.id);
      expect(ids).toContain("what-is-a-state");
      expect(ids).toContain("medicare-for-all");
    });
  });

  describe("getRandomFeaturedBriefs", () => {
    it("returns the requested number of briefs", () => {
      const result = getRandomFeaturedBriefs(4);
      expect(result).toHaveLength(4);
    });

    it("defaults to 3 briefs when no count specified", () => {
      const result = getRandomFeaturedBriefs();
      expect(result).toHaveLength(3);
    });

    it("returns valid FeaturedBrief objects with excerpts", () => {
      const result = getRandomFeaturedBriefs(3);
      result.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("excerpt");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("returns briefs from the FEATURED_BRIEFS array", () => {
      const result = getRandomFeaturedBriefs(5);
      const featuredIds = FEATURED_BRIEFS.map((b) => b.id);
      result.forEach((brief) => {
        expect(featuredIds).toContain(brief.id);
      });
    });

    it("returns unique briefs (no duplicates)", () => {
      const result = getRandomFeaturedBriefs(5);
      const ids = result.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("handles count larger than available briefs", () => {
      const result = getRandomFeaturedBriefs(100);
      expect(result.length).toBe(FEATURED_BRIEFS.length);
    });

    it("handles count of 0", () => {
      const result = getRandomFeaturedBriefs(0);
      expect(result).toHaveLength(0);
    });

    it("handles count of 1", () => {
      const result = getRandomFeaturedBriefs(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("excerpt");
    });

    it("returns different results on multiple calls (randomness)", () => {
      const results: string[][] = [];
      for (let i = 0; i < 10; i++) {
        results.push(getRandomFeaturedBriefs(5).map((b) => b.id));
      }

      const uniqueResults = new Set(results.map((r) => r.join(",")));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe("getRotatingFeaturedBriefs", () => {
    it("returns 4 briefs or fewer if less available", () => {
      const result = getRotatingFeaturedBriefs();
      expect(result.length).toBeLessThanOrEqual(4);
      expect(result.length).toBe(Math.min(4, FEATURED_BRIEFS.length));
    });

    it("returns valid FeaturedBrief objects", () => {
      const result = getRotatingFeaturedBriefs();
      result.forEach((brief) => {
        expect(brief).toHaveProperty("id");
        expect(brief).toHaveProperty("question");
        expect(brief).toHaveProperty("excerpt");
        expect(brief).toHaveProperty("clarity_score");
        expect(brief).toHaveProperty("tags");
        expect(brief).toHaveProperty("readTime");
      });
    });

    it("returns unique briefs (no duplicates)", () => {
      const result = getRotatingFeaturedBriefs();
      const ids = result.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("varies results on multiple calls (rotation)", () => {
      const results: string[][] = [];
      for (let i = 0; i < 10; i++) {
        results.push(getRotatingFeaturedBriefs().map((b) => b.id));
      }

      const uniqueResults = new Set(results.map((r) => r.join(",")));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it("only includes briefs from FEATURED_BRIEFS", () => {
      const result = getRotatingFeaturedBriefs();
      const featuredIds = FEATURED_BRIEFS.map((b) => b.id);
      result.forEach((brief) => {
        expect(featuredIds).toContain(brief.id);
      });
    });
  });

  describe("FeaturedBrief interface", () => {
    it("extends showcase briefs with excerpt field", () => {
      const validBrief: FeaturedBrief = {
        id: "test-featured",
        question: "What is the featured test question?",
        excerpt:
          "This is a meaningful excerpt that summarizes the key insight from the brief in 2-3 sentences.",
        clarity_score: 8.5,
        tags: ["Test", "Featured"],
        readTime: "5 min",
      };

      expect(validBrief.id).toBe("test-featured");
      expect(validBrief.excerpt.length).toBeGreaterThan(50);
    });
  });

  describe("excerpt quality", () => {
    it("excerpts contain substantive information", () => {
      FEATURED_BRIEFS.forEach((brief) => {
        // Excerpts should contain words, not just placeholder text
        const wordCount = brief.excerpt.split(/\s+/).length;
        expect(wordCount).toBeGreaterThan(10);
      });
    });

    it("excerpts relate to their questions", () => {
      // The what-is-a-state brief should have an excerpt about states
      const stateBrief = FEATURED_BRIEFS.find((b) => b.id === "what-is-a-state");
      if (stateBrief) {
        expect(stateBrief.excerpt.toLowerCase()).toMatch(/state|natural|emerged/);
      }

      // The medicare brief should have an excerpt about healthcare
      const medicareBrief = FEATURED_BRIEFS.find((b) => b.id === "medicare-for-all");
      if (medicareBrief) {
        expect(medicareBrief.excerpt.toLowerCase()).toMatch(
          /healthcare|billion|insurance/
        );
      }
    });
  });
});
