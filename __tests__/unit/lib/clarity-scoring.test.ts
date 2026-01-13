/**
 * Tests for lib/types/clarity-scoring.ts
 *
 * Tests the clarity scoring types, dimensions, and utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  CLARITY_DIMENSIONS,
  DimensionName,
  getDimensionWeight,
  getAllDimensions,
  validateWeightsSum,
} from "@/lib/types/clarity-scoring";

describe("clarity-scoring", () => {
  describe("CLARITY_DIMENSIONS", () => {
    it("has all 7 required dimensions", () => {
      const expectedDimensions: DimensionName[] = [
        "firstPrinciplesCoherence",
        "internalConsistency",
        "evidenceQuality",
        "accessibility",
        "objectivity",
        "factualAccuracy",
        "biasDetection",
      ];

      const actualDimensions = Object.keys(CLARITY_DIMENSIONS);
      expect(actualDimensions).toHaveLength(7);
      expectedDimensions.forEach((dim) => {
        expect(actualDimensions).toContain(dim);
      });
    });

    it("each dimension has required properties", () => {
      Object.values(CLARITY_DIMENSIONS).forEach((dimension) => {
        expect(dimension).toHaveProperty("name");
        expect(dimension).toHaveProperty("weight");
        expect(dimension).toHaveProperty("description");
        expect(dimension).toHaveProperty("scoringGuidelines");

        expect(typeof dimension.name).toBe("string");
        expect(typeof dimension.weight).toBe("number");
        expect(typeof dimension.description).toBe("string");
        expect(typeof dimension.scoringGuidelines).toBe("string");
      });
    });

    it("all weights are between 0 and 1", () => {
      Object.values(CLARITY_DIMENSIONS).forEach((dimension) => {
        expect(dimension.weight).toBeGreaterThanOrEqual(0);
        expect(dimension.weight).toBeLessThanOrEqual(1);
      });
    });

    it("dimension names match their keys", () => {
      Object.entries(CLARITY_DIMENSIONS).forEach(([key, dimension]) => {
        expect(dimension.name).toBe(key);
      });
    });

    describe("individual dimension weights", () => {
      it("firstPrinciplesCoherence has weight 0.20", () => {
        expect(CLARITY_DIMENSIONS.firstPrinciplesCoherence.weight).toBe(0.20);
      });

      it("internalConsistency has weight 0.15", () => {
        expect(CLARITY_DIMENSIONS.internalConsistency.weight).toBe(0.15);
      });

      it("evidenceQuality has weight 0.20", () => {
        expect(CLARITY_DIMENSIONS.evidenceQuality.weight).toBe(0.20);
      });

      it("accessibility has weight 0.15", () => {
        expect(CLARITY_DIMENSIONS.accessibility.weight).toBe(0.15);
      });

      it("objectivity has weight 0.10", () => {
        expect(CLARITY_DIMENSIONS.objectivity.weight).toBe(0.10);
      });

      it("factualAccuracy has weight 0.15", () => {
        expect(CLARITY_DIMENSIONS.factualAccuracy.weight).toBe(0.15);
      });

      it("biasDetection has weight 0.05", () => {
        expect(CLARITY_DIMENSIONS.biasDetection.weight).toBe(0.05);
      });
    });
  });

  describe("getDimensionWeight", () => {
    it("returns correct weight for each dimension", () => {
      expect(getDimensionWeight("firstPrinciplesCoherence")).toBe(0.20);
      expect(getDimensionWeight("internalConsistency")).toBe(0.15);
      expect(getDimensionWeight("evidenceQuality")).toBe(0.20);
      expect(getDimensionWeight("accessibility")).toBe(0.15);
      expect(getDimensionWeight("objectivity")).toBe(0.10);
      expect(getDimensionWeight("factualAccuracy")).toBe(0.15);
      expect(getDimensionWeight("biasDetection")).toBe(0.05);
    });
  });

  describe("getAllDimensions", () => {
    it("returns array of all 7 dimensions", () => {
      const dimensions = getAllDimensions();
      expect(dimensions).toHaveLength(7);
    });

    it("returns ScoringDimension objects", () => {
      const dimensions = getAllDimensions();
      dimensions.forEach((dim) => {
        expect(dim).toHaveProperty("name");
        expect(dim).toHaveProperty("weight");
        expect(dim).toHaveProperty("description");
        expect(dim).toHaveProperty("scoringGuidelines");
      });
    });

    it("includes all dimension names", () => {
      const dimensions = getAllDimensions();
      const names = dimensions.map((d) => d.name);

      expect(names).toContain("firstPrinciplesCoherence");
      expect(names).toContain("internalConsistency");
      expect(names).toContain("evidenceQuality");
      expect(names).toContain("accessibility");
      expect(names).toContain("objectivity");
      expect(names).toContain("factualAccuracy");
      expect(names).toContain("biasDetection");
    });
  });

  describe("validateWeightsSum", () => {
    it("returns true when all weights sum to 1.0", () => {
      expect(validateWeightsSum()).toBe(true);
    });

    it("correctly calculates the sum of weights", () => {
      const sum = Object.values(CLARITY_DIMENSIONS).reduce(
        (acc, dim) => acc + dim.weight,
        0
      );
      // Sum should be 0.20 + 0.15 + 0.20 + 0.15 + 0.10 + 0.15 + 0.05 = 1.00
      expect(sum).toBeCloseTo(1.0, 3);
    });
  });

  describe("scoring guidelines", () => {
    it("all dimensions have scoring guidelines that mention score ranges", () => {
      Object.values(CLARITY_DIMENSIONS).forEach((dimension) => {
        expect(dimension.scoringGuidelines).toContain("10:");
        expect(dimension.scoringGuidelines).toContain("8-9:");
        expect(dimension.scoringGuidelines).toContain("6-7:");
        expect(dimension.scoringGuidelines).toContain("4-5:");
        expect(dimension.scoringGuidelines).toContain("1-3:");
      });
    });

    it("firstPrinciplesCoherence guidelines mention foundational reasoning", () => {
      expect(
        CLARITY_DIMENSIONS.firstPrinciplesCoherence.scoringGuidelines
      ).toContain("first principles");
    });

    it("evidenceQuality guidelines mention sources", () => {
      expect(CLARITY_DIMENSIONS.evidenceQuality.scoringGuidelines).toContain(
        "sources"
      );
    });

    it("accessibility guidelines mention jargon", () => {
      expect(CLARITY_DIMENSIONS.accessibility.scoringGuidelines).toContain(
        "jargon"
      );
    });

    it("objectivity guidelines mention perspectives", () => {
      expect(CLARITY_DIMENSIONS.objectivity.scoringGuidelines).toContain(
        "perspectives"
      );
    });

    it("factualAccuracy guidelines mention facts", () => {
      expect(CLARITY_DIMENSIONS.factualAccuracy.scoringGuidelines).toContain(
        "facts"
      );
    });

    it("biasDetection guidelines mention bias", () => {
      expect(CLARITY_DIMENSIONS.biasDetection.scoringGuidelines).toContain(
        "bias"
      );
    });
  });

  describe("dimension descriptions", () => {
    it("all dimensions have non-empty descriptions", () => {
      Object.values(CLARITY_DIMENSIONS).forEach((dimension) => {
        expect(dimension.description.length).toBeGreaterThan(10);
      });
    });
  });
});
