/**
 * Tests for lib/services/retry-queue-service.ts
 *
 * Tests the generateRetryParams function which generates
 * retry parameters based on failure reasons.
 */

import { describe, it, expect } from "vitest";
import { generateRetryParams } from "@/lib/services/retry-queue-service";

describe("retry-queue-service", () => {
  describe("generateRetryParams", () => {
    describe("evidence-related failures", () => {
      it("sets increasedSourceDiversity for 'evidence' failures", () => {
        const params = generateRetryParams("Low evidence quality");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.minSources).toBe(10);
      });

      it("sets increasedSourceDiversity for 'source' failures", () => {
        const params = generateRetryParams("Not enough sources cited");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.minSources).toBe(10);
      });

      it("handles case-insensitive matching for evidence", () => {
        const params = generateRetryParams("EVIDENCE issues found");

        expect(params.increasedSourceDiversity).toBe(true);
      });

      it("handles case-insensitive matching for source", () => {
        const params = generateRetryParams("SOURCE diversity lacking");

        expect(params.increasedSourceDiversity).toBe(true);
      });
    });

    describe("objectivity-related failures", () => {
      it("sets forceOpposingViews for 'objectivity' failures", () => {
        const params = generateRetryParams("Low objectivity score");

        expect(params.forceOpposingViews).toBe(true);
        expect(params.specialistPersona).toBe("Neutral Analyst");
      });

      it("sets forceOpposingViews for 'bias' failures", () => {
        const params = generateRetryParams("Content shows bias");

        expect(params.forceOpposingViews).toBe(true);
        expect(params.specialistPersona).toBe("Neutral Analyst");
      });

      it("handles case-insensitive matching for objectivity", () => {
        const params = generateRetryParams("OBJECTIVITY concerns");

        expect(params.forceOpposingViews).toBe(true);
      });

      it("handles case-insensitive matching for bias", () => {
        const params = generateRetryParams("BIAS detected in summary");

        expect(params.forceOpposingViews).toBe(true);
      });
    });

    describe("clarity-related failures", () => {
      it("sets adjustedPrompts for 'clarity' failures", () => {
        const params = generateRetryParams("Low clarity score");

        expect(params.adjustedPrompts).toBeDefined();
        expect(params.adjustedPrompts).toBeInstanceOf(Array);
        expect(params.adjustedPrompts?.length).toBeGreaterThan(0);
      });

      it("sets adjustedPrompts for 'unclear' failures", () => {
        const params = generateRetryParams("Content is unclear");

        expect(params.adjustedPrompts).toBeDefined();
        expect(params.adjustedPrompts?.length).toBeGreaterThan(0);
      });

      it("includes specific clarity improvement prompts", () => {
        const params = generateRetryParams("Clarity issues");

        expect(params.adjustedPrompts).toContain("Use shorter sentences");
        expect(params.adjustedPrompts).toContain("Define technical terms");
        expect(params.adjustedPrompts).toContain("Structure with clear headings");
      });

      it("handles case-insensitive matching for clarity", () => {
        const params = generateRetryParams("CLARITY needs improvement");

        expect(params.adjustedPrompts).toBeDefined();
      });

      it("handles case-insensitive matching for unclear", () => {
        const params = generateRetryParams("UNCLEAR explanations");

        expect(params.adjustedPrompts).toBeDefined();
      });
    });

    describe("combined failures", () => {
      it("sets both evidence and objectivity params for combined failures", () => {
        const params = generateRetryParams("Low evidence and objectivity");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.minSources).toBe(10);
        expect(params.forceOpposingViews).toBe(true);
        expect(params.specialistPersona).toBe("Neutral Analyst");
      });

      it("sets evidence and clarity params together", () => {
        const params = generateRetryParams("Evidence unclear");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.adjustedPrompts).toBeDefined();
      });

      it("sets objectivity and clarity params together", () => {
        const params = generateRetryParams("Biased and unclear content");

        expect(params.forceOpposingViews).toBe(true);
        expect(params.adjustedPrompts).toBeDefined();
      });

      it("sets all params for failures mentioning all issues", () => {
        const params = generateRetryParams(
          "Poor evidence, bias detected, and unclear writing"
        );

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.forceOpposingViews).toBe(true);
        expect(params.adjustedPrompts).toBeDefined();
      });
    });

    describe("generic/unknown failures", () => {
      it("applies default params for unrecognized failure reasons", () => {
        const params = generateRetryParams("Generic quality failure");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.forceOpposingViews).toBe(true);
      });

      it("applies default params for empty failure reason", () => {
        const params = generateRetryParams("");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.forceOpposingViews).toBe(true);
      });

      it("applies default params for random text", () => {
        const params = generateRetryParams("xyz123 random text");

        expect(params.increasedSourceDiversity).toBe(true);
        expect(params.forceOpposingViews).toBe(true);
      });

      it("default params do not include adjustedPrompts", () => {
        const params = generateRetryParams("Unknown failure");

        expect(params.adjustedPrompts).toBeUndefined();
      });

      it("default params do not include specialistPersona", () => {
        const params = generateRetryParams("Unknown failure");

        expect(params.specialistPersona).toBeUndefined();
      });

      it("default params do not include minSources", () => {
        const params = generateRetryParams("Unknown failure");

        expect(params.minSources).toBeUndefined();
      });
    });

    describe("partial keyword matches", () => {
      it("matches 'evidence' within a longer word", () => {
        const params = generateRetryParams("evidencequality is low");

        expect(params.increasedSourceDiversity).toBe(true);
      });

      it("matches 'source' within a longer word", () => {
        const params = generateRetryParams("multisource diversity needed");

        expect(params.increasedSourceDiversity).toBe(true);
      });

      it("matches 'bias' within 'biased'", () => {
        const params = generateRetryParams("Content appears biased");

        expect(params.forceOpposingViews).toBe(true);
      });

      it("matches 'unclear' within 'unclearly'", () => {
        const params = generateRetryParams("Arguments presented unclearly");

        expect(params.adjustedPrompts).toBeDefined();
      });
    });

    describe("return type structure", () => {
      it("returns an object", () => {
        const params = generateRetryParams("test");

        expect(typeof params).toBe("object");
        expect(params).not.toBeNull();
      });

      it("returns only relevant params (not all params)", () => {
        const evidenceParams = generateRetryParams("evidence issue");

        expect(evidenceParams.increasedSourceDiversity).toBe(true);
        expect(evidenceParams.minSources).toBe(10);
        expect(evidenceParams.forceOpposingViews).toBeUndefined();
        expect(evidenceParams.specialistPersona).toBeUndefined();
        expect(evidenceParams.adjustedPrompts).toBeUndefined();
      });
    });
  });
});
