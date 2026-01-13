/**
 * Tests for lib/validation/brief-schemas.ts and admin-schemas.ts
 *
 * Tests the Zod validation schemas used in the API.
 */

import { describe, it, expect } from "vitest";
import {
  briefIdSchema,
  createBriefSchema,
  updateBriefSchema,
  popularBriefsQuerySchema,
  exploreBriefsQuerySchema,
} from "@/lib/validation/brief-schemas";
import { cacheFlushSchema } from "@/lib/validation/admin-schemas";

describe("validation schemas", () => {
  describe("briefIdSchema", () => {
    it("accepts valid UUIDs", () => {
      const validUuids = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      validUuids.forEach((uuid) => {
        const result = briefIdSchema.safeParse(uuid);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(uuid);
        }
      });
    });

    it("rejects invalid UUIDs", () => {
      const invalidUuids = [
        "not-a-uuid",
        "123",
        "123e4567-e89b-12d3-a456", // Too short
        "123e4567-e89b-12d3-a456-426614174000-extra", // Too long
        "123e4567e89b12d3a456426614174000", // Missing hyphens
        "",
      ];

      invalidUuids.forEach((uuid) => {
        const result = briefIdSchema.safeParse(uuid);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Invalid brief ID");
        }
      });
    });
  });

  describe("createBriefSchema", () => {
    it("accepts valid brief creation data", () => {
      const validData = {
        question: "What is the policy on climate change?",
        summaries: { child: "Summary for kids" },
        structured_data: { key: "value" },
        narrative: "A detailed narrative about climate policy.",
      };

      const result = createBriefSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const validData = {
        question: "Test question",
        summaries: {},
        structured_data: {},
        narrative: "Test narrative",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        clarity_score: 85,
        metadata: { tags: ["policy"] },
      };

      const result = createBriefSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("accepts null user_id", () => {
      const validData = {
        question: "Test question",
        summaries: {},
        structured_data: {},
        narrative: "Test narrative",
        user_id: null,
      };

      const result = createBriefSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects empty question", () => {
      const invalidData = {
        question: "",
        summaries: {},
        structured_data: {},
        narrative: "Test narrative",
      };

      const result = createBriefSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects question that is too long", () => {
      const invalidData = {
        question: "a".repeat(1001),
        summaries: {},
        structured_data: {},
        narrative: "Test narrative",
      };

      const result = createBriefSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects empty narrative", () => {
      const invalidData = {
        question: "Test question",
        summaries: {},
        structured_data: {},
        narrative: "",
      };

      const result = createBriefSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects clarity_score outside valid range", () => {
      const tooLow = {
        question: "Test",
        summaries: {},
        structured_data: {},
        narrative: "Test",
        clarity_score: -1,
      };

      const tooHigh = {
        question: "Test",
        summaries: {},
        structured_data: {},
        narrative: "Test",
        clarity_score: 101,
      };

      expect(createBriefSchema.safeParse(tooLow).success).toBe(false);
      expect(createBriefSchema.safeParse(tooHigh).success).toBe(false);
    });

    it("accepts clarity_score at boundaries", () => {
      const min = {
        question: "Test",
        summaries: {},
        structured_data: {},
        narrative: "Test",
        clarity_score: 0,
      };

      const max = {
        question: "Test",
        summaries: {},
        structured_data: {},
        narrative: "Test",
        clarity_score: 100,
      };

      expect(createBriefSchema.safeParse(min).success).toBe(true);
      expect(createBriefSchema.safeParse(max).success).toBe(true);
    });
  });

  describe("updateBriefSchema", () => {
    it("accepts partial updates", () => {
      const narrativeOnly = { narrative: "Updated narrative" };
      const scoreOnly = { clarity_score: 90 };
      const summariesOnly = { summaries: { child: "New summary" } };

      expect(updateBriefSchema.safeParse(narrativeOnly).success).toBe(true);
      expect(updateBriefSchema.safeParse(scoreOnly).success).toBe(true);
      expect(updateBriefSchema.safeParse(summariesOnly).success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateBriefSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts null clarity_score", () => {
      const result = updateBriefSchema.safeParse({ clarity_score: null });
      expect(result.success).toBe(true);
    });

    it("rejects empty narrative string", () => {
      const result = updateBriefSchema.safeParse({ narrative: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("popularBriefsQuerySchema", () => {
    it("uses default limit when not provided", () => {
      const result = popularBriefsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it("accepts valid limit values", () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("coerces string to number", () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("rejects limit below minimum", () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: "0" });
      expect(result.success).toBe(false);
    });

    it("rejects limit above maximum", () => {
      const result = popularBriefsQuerySchema.safeParse({ limit: "101" });
      expect(result.success).toBe(false);
    });
  });

  describe("exploreBriefsQuerySchema", () => {
    it("uses defaults when not provided", () => {
      const result = exploreBriefsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("newest");
        expect(result.data.date).toBe("all");
        expect(result.data.limit).toBe(12);
        expect(result.data.offset).toBe(0);
      }
    });

    it("accepts all valid sort options", () => {
      const sortOptions = ["newest", "oldest", "score", "views"];

      sortOptions.forEach((sort) => {
        const result = exploreBriefsQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe(sort);
        }
      });
    });

    it("rejects invalid sort option", () => {
      const result = exploreBriefsQuerySchema.safeParse({ sort: "invalid" });
      expect(result.success).toBe(false);
    });

    it("accepts all valid date options", () => {
      const dateOptions = ["week", "month", "year", "all"];

      dateOptions.forEach((date) => {
        const result = exploreBriefsQuerySchema.safeParse({ date });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe(date);
        }
      });
    });

    it("rejects invalid date option", () => {
      const result = exploreBriefsQuerySchema.safeParse({ date: "day" });
      expect(result.success).toBe(false);
    });

    it("accepts optional search query", () => {
      const result = exploreBriefsQuerySchema.safeParse({
        q: "climate change",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("climate change");
      }
    });

    it("accepts optional tags", () => {
      const result = exploreBriefsQuerySchema.safeParse({
        tags: "policy,climate,economy",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBe("policy,climate,economy");
      }
    });

    it("accepts minScore within range", () => {
      const result = exploreBriefsQuerySchema.safeParse({ minScore: "7.5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minScore).toBe(7.5);
      }
    });

    it("rejects minScore outside range", () => {
      expect(
        exploreBriefsQuerySchema.safeParse({ minScore: "-1" }).success
      ).toBe(false);
      expect(
        exploreBriefsQuerySchema.safeParse({ minScore: "11" }).success
      ).toBe(false);
    });

    it("coerces limit and offset to numbers", () => {
      const result = exploreBriefsQuerySchema.safeParse({
        limit: "24",
        offset: "12",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(24);
        expect(result.data.offset).toBe(12);
      }
    });

    it("rejects negative offset", () => {
      const result = exploreBriefsQuerySchema.safeParse({ offset: "-1" });
      expect(result.success).toBe(false);
    });
  });

  describe("cacheFlushSchema", () => {
    it("accepts request without pattern", () => {
      const result = cacheFlushSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pattern).toBeUndefined();
      }
    });

    it("accepts valid pattern", () => {
      const result = cacheFlushSchema.safeParse({ pattern: "brief:*" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pattern).toBe("brief:*");
      }
    });

    it("rejects empty pattern string", () => {
      const result = cacheFlushSchema.safeParse({ pattern: "" });
      expect(result.success).toBe(false);
    });

    it("rejects pattern that is too long", () => {
      const result = cacheFlushSchema.safeParse({ pattern: "a".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("accepts pattern at max length", () => {
      const result = cacheFlushSchema.safeParse({ pattern: "a".repeat(200) });
      expect(result.success).toBe(true);
    });
  });
});
