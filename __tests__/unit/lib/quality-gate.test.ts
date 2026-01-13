/**
 * Tests for lib/types/quality-gate.ts
 *
 * Tests the quality gate types and utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  QualityTier,
  getQualityTier,
  createQualityGateResult,
} from "@/lib/types/quality-gate";

describe("quality-gate", () => {
  describe("QualityTier enum", () => {
    it("has HIGH tier with value 'high'", () => {
      expect(QualityTier.HIGH).toBe("high");
    });

    it("has ACCEPTABLE tier with value 'acceptable'", () => {
      expect(QualityTier.ACCEPTABLE).toBe("acceptable");
    });

    it("has FAILED tier with value 'failed'", () => {
      expect(QualityTier.FAILED).toBe("failed");
    });
  });

  describe("getQualityTier", () => {
    describe("HIGH tier (score >= 8.0)", () => {
      it("returns HIGH for score of 10", () => {
        expect(getQualityTier(10)).toBe(QualityTier.HIGH);
      });

      it("returns HIGH for score of 8.5", () => {
        expect(getQualityTier(8.5)).toBe(QualityTier.HIGH);
      });

      it("returns HIGH for score of exactly 8.0", () => {
        expect(getQualityTier(8.0)).toBe(QualityTier.HIGH);
      });

      it("returns HIGH for score of 9.9", () => {
        expect(getQualityTier(9.9)).toBe(QualityTier.HIGH);
      });
    });

    describe("ACCEPTABLE tier (6.0 <= score < 8.0)", () => {
      it("returns ACCEPTABLE for score of 7.9", () => {
        expect(getQualityTier(7.9)).toBe(QualityTier.ACCEPTABLE);
      });

      it("returns ACCEPTABLE for score of 7.0", () => {
        expect(getQualityTier(7.0)).toBe(QualityTier.ACCEPTABLE);
      });

      it("returns ACCEPTABLE for score of exactly 6.0", () => {
        expect(getQualityTier(6.0)).toBe(QualityTier.ACCEPTABLE);
      });

      it("returns ACCEPTABLE for score of 6.5", () => {
        expect(getQualityTier(6.5)).toBe(QualityTier.ACCEPTABLE);
      });
    });

    describe("FAILED tier (score < 6.0)", () => {
      it("returns FAILED for score of 5.9", () => {
        expect(getQualityTier(5.9)).toBe(QualityTier.FAILED);
      });

      it("returns FAILED for score of 5.0", () => {
        expect(getQualityTier(5.0)).toBe(QualityTier.FAILED);
      });

      it("returns FAILED for score of 0", () => {
        expect(getQualityTier(0)).toBe(QualityTier.FAILED);
      });

      it("returns FAILED for score of 3.5", () => {
        expect(getQualityTier(3.5)).toBe(QualityTier.FAILED);
      });

      it("returns FAILED for negative scores", () => {
        expect(getQualityTier(-1)).toBe(QualityTier.FAILED);
      });
    });

    describe("boundary values", () => {
      it("correctly handles exactly 8.0 (boundary between HIGH and ACCEPTABLE)", () => {
        expect(getQualityTier(8.0)).toBe(QualityTier.HIGH);
        expect(getQualityTier(7.999999)).toBe(QualityTier.ACCEPTABLE);
      });

      it("correctly handles exactly 6.0 (boundary between ACCEPTABLE and FAILED)", () => {
        expect(getQualityTier(6.0)).toBe(QualityTier.ACCEPTABLE);
        expect(getQualityTier(5.999999)).toBe(QualityTier.FAILED);
      });
    });
  });

  describe("createQualityGateResult", () => {
    describe("HIGH quality results", () => {
      it("creates correct result for score 9.0 with 1 attempt", () => {
        const result = createQualityGateResult(9.0, 1);

        expect(result.tier).toBe(QualityTier.HIGH);
        expect(result.finalScore).toBe(9.0);
        expect(result.attempts).toBe(1);
        expect(result.publishable).toBe(true);
        expect(result.warningBadge).toBe(false);
        expect(result.refundRequired).toBe(false);
      });

      it("creates correct result for score 8.0 with 2 attempts", () => {
        const result = createQualityGateResult(8.0, 2);

        expect(result.tier).toBe(QualityTier.HIGH);
        expect(result.publishable).toBe(true);
        expect(result.warningBadge).toBe(false);
        expect(result.refundRequired).toBe(false);
      });
    });

    describe("ACCEPTABLE quality results", () => {
      it("creates correct result for score 7.0 with 1 attempt", () => {
        const result = createQualityGateResult(7.0, 1);

        expect(result.tier).toBe(QualityTier.ACCEPTABLE);
        expect(result.finalScore).toBe(7.0);
        expect(result.attempts).toBe(1);
        expect(result.publishable).toBe(true);
        expect(result.warningBadge).toBe(true);
        expect(result.refundRequired).toBe(false);
      });

      it("creates correct result for score 6.0 with 3 attempts", () => {
        const result = createQualityGateResult(6.0, 3);

        expect(result.tier).toBe(QualityTier.ACCEPTABLE);
        expect(result.publishable).toBe(true);
        expect(result.warningBadge).toBe(true);
        expect(result.refundRequired).toBe(false);
      });

      it("shows warning badge for acceptable quality briefs", () => {
        const result = createQualityGateResult(6.5, 1);

        expect(result.warningBadge).toBe(true);
      });
    });

    describe("FAILED quality results", () => {
      it("creates correct result for score 5.5 with 1 attempt", () => {
        const result = createQualityGateResult(5.5, 1);

        expect(result.tier).toBe(QualityTier.FAILED);
        expect(result.finalScore).toBe(5.5);
        expect(result.attempts).toBe(1);
        expect(result.publishable).toBe(false);
        expect(result.warningBadge).toBe(false);
        expect(result.refundRequired).toBe(true);
      });

      it("creates correct result for score 3.0 with max attempts", () => {
        const result = createQualityGateResult(3.0, 3);

        expect(result.tier).toBe(QualityTier.FAILED);
        expect(result.publishable).toBe(false);
        expect(result.refundRequired).toBe(true);
      });

      it("requires refund for failed briefs", () => {
        const result = createQualityGateResult(4.0, 2);

        expect(result.refundRequired).toBe(true);
      });

      it("does not show warning badge for failed briefs", () => {
        const result = createQualityGateResult(5.0, 1);

        expect(result.warningBadge).toBe(false);
      });
    });

    describe("attempt tracking", () => {
      it("correctly tracks single attempt", () => {
        const result = createQualityGateResult(7.5, 1);
        expect(result.attempts).toBe(1);
      });

      it("correctly tracks multiple attempts", () => {
        const result = createQualityGateResult(7.5, 5);
        expect(result.attempts).toBe(5);
      });

      it("correctly tracks zero attempts", () => {
        const result = createQualityGateResult(7.5, 0);
        expect(result.attempts).toBe(0);
      });
    });

    describe("score precision", () => {
      it("preserves decimal precision in finalScore", () => {
        const result = createQualityGateResult(7.123456, 1);
        expect(result.finalScore).toBe(7.123456);
      });

      it("handles integer scores", () => {
        const result = createQualityGateResult(8, 1);
        expect(result.finalScore).toBe(8);
      });
    });

    describe("result structure", () => {
      it("returns object with all required properties", () => {
        const result = createQualityGateResult(7.0, 1);

        expect(result).toHaveProperty("tier");
        expect(result).toHaveProperty("finalScore");
        expect(result).toHaveProperty("attempts");
        expect(result).toHaveProperty("publishable");
        expect(result).toHaveProperty("warningBadge");
        expect(result).toHaveProperty("refundRequired");
      });

      it("returns boolean values for publishable, warningBadge, refundRequired", () => {
        const result = createQualityGateResult(7.0, 1);

        expect(typeof result.publishable).toBe("boolean");
        expect(typeof result.warningBadge).toBe("boolean");
        expect(typeof result.refundRequired).toBe("boolean");
      });
    });
  });
});
