/**
 * Tests for lib/types/refinement.ts
 *
 * Tests the refinement system types and enums.
 */

import { describe, it, expect } from "vitest";
import {
  FixerType,
  type EditPriority,
  type SuggestedEdit,
  type FixerResult,
  type ScoreBeforeAfter,
  type RefinementAttempt,
  type RefinementResult,
  type FixerInput,
  type DimensionScores,
  type ConsensusResult,
  type ReconciliationResult,
} from "@/lib/types/refinement";

describe("refinement types", () => {
  describe("FixerType enum", () => {
    it("has all 7 fixer types", () => {
      const fixerTypes = Object.values(FixerType);
      expect(fixerTypes.length).toBe(7);
    });

    it("includes firstPrinciplesCoherence", () => {
      expect(FixerType.firstPrinciplesCoherence).toBe("firstPrinciplesCoherence");
    });

    it("includes internalConsistency", () => {
      expect(FixerType.internalConsistency).toBe("internalConsistency");
    });

    it("includes evidenceQuality", () => {
      expect(FixerType.evidenceQuality).toBe("evidenceQuality");
    });

    it("includes accessibility", () => {
      expect(FixerType.accessibility).toBe("accessibility");
    });

    it("includes objectivity", () => {
      expect(FixerType.objectivity).toBe("objectivity");
    });

    it("includes factualAccuracy", () => {
      expect(FixerType.factualAccuracy).toBe("factualAccuracy");
    });

    it("includes biasDetection", () => {
      expect(FixerType.biasDetection).toBe("biasDetection");
    });

    it("fixer types are camelCase strings", () => {
      Object.values(FixerType).forEach((type) => {
        expect(typeof type).toBe("string");
        expect(type[0]).toBe(type[0].toLowerCase());
      });
    });
  });

  describe("EditPriority type", () => {
    it("allows critical priority", () => {
      const priority: EditPriority = "critical";
      expect(priority).toBe("critical");
    });

    it("allows high priority", () => {
      const priority: EditPriority = "high";
      expect(priority).toBe("high");
    });

    it("allows medium priority", () => {
      const priority: EditPriority = "medium";
      expect(priority).toBe("medium");
    });

    it("allows low priority", () => {
      const priority: EditPriority = "low";
      expect(priority).toBe("low");
    });
  });

  describe("SuggestedEdit interface", () => {
    it("can create a valid suggested edit", () => {
      const edit: SuggestedEdit = {
        section: "introduction",
        originalText: "The policy is bad.",
        suggestedText: "The policy has several drawbacks.",
        rationale: "More neutral language",
        priority: "high",
      };

      expect(edit.section).toBe("introduction");
      expect(edit.originalText).toBe("The policy is bad.");
      expect(edit.suggestedText).toBe("The policy has several drawbacks.");
      expect(edit.rationale).toBe("More neutral language");
      expect(edit.priority).toBe("high");
    });
  });

  describe("FixerResult interface", () => {
    it("can create a valid fixer result", () => {
      const result: FixerResult = {
        fixerType: FixerType.objectivity,
        suggestedEdits: [],
        confidence: 0.85,
        processingTime: 1500,
      };

      expect(result.fixerType).toBe(FixerType.objectivity);
      expect(result.suggestedEdits).toEqual([]);
      expect(result.confidence).toBe(0.85);
      expect(result.processingTime).toBe(1500);
    });

    it("can include multiple suggested edits", () => {
      const result: FixerResult = {
        fixerType: FixerType.accessibility,
        suggestedEdits: [
          {
            section: "section1",
            originalText: "text1",
            suggestedText: "text2",
            rationale: "reason",
            priority: "medium",
          },
          {
            section: "section2",
            originalText: "text3",
            suggestedText: "text4",
            rationale: "reason2",
            priority: "low",
          },
        ],
        confidence: 0.9,
        processingTime: 2000,
      };

      expect(result.suggestedEdits.length).toBe(2);
    });
  });

  describe("ScoreBeforeAfter interface", () => {
    it("can create score comparison", () => {
      const scores: ScoreBeforeAfter = {
        before: 6.5,
        after: 7.8,
      };

      expect(scores.before).toBe(6.5);
      expect(scores.after).toBe(7.8);
    });

    it("can include dimension scores", () => {
      const scores: ScoreBeforeAfter = {
        before: 6.0,
        after: 7.5,
        dimensionScores: {
          [FixerType.accessibility]: { before: 5.0, after: 7.0 },
          [FixerType.objectivity]: { before: 6.5, after: 7.5 },
        },
      };

      expect(scores.dimensionScores?.[FixerType.accessibility].before).toBe(5.0);
      expect(scores.dimensionScores?.[FixerType.accessibility].after).toBe(7.0);
    });
  });

  describe("RefinementAttempt interface", () => {
    it("can create a refinement attempt record", () => {
      const attempt: RefinementAttempt = {
        attemptNumber: 1,
        fixersDeployed: [FixerType.accessibility, FixerType.objectivity],
        editsMade: [],
        editsSkipped: [],
        scoreBeforeAfter: { before: 6.0, after: 7.0 },
        processingTime: 5000,
      };

      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.fixersDeployed.length).toBe(2);
      expect(attempt.scoreBeforeAfter.after).toBe(7.0);
    });

    it("can include skipped edits with reasons", () => {
      const attempt: RefinementAttempt = {
        attemptNumber: 2,
        fixersDeployed: [FixerType.factualAccuracy],
        editsMade: [],
        editsSkipped: [
          {
            edit: {
              section: "intro",
              originalText: "original",
              suggestedText: "suggested",
              rationale: "reason",
              priority: "low",
            },
            reason: "Would change meaning too much",
          },
        ],
        scoreBeforeAfter: { before: 6.5, after: 6.5 },
        processingTime: 3000,
      };

      expect(attempt.editsSkipped.length).toBe(1);
      expect(attempt.editsSkipped[0].reason).toBe("Would change meaning too much");
    });
  });

  describe("RefinementResult interface", () => {
    it("can create a successful refinement result", () => {
      const result: RefinementResult = {
        finalBrief: "The improved brief content...",
        finalScore: 8.5,
        success: true,
        attempts: [],
        totalProcessingTime: 10000,
      };

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(8.5);
      expect(result.warningReason).toBeUndefined();
    });

    it("can create a result with warning", () => {
      const result: RefinementResult = {
        finalBrief: "Brief content...",
        finalScore: 6.5,
        success: true,
        attempts: [],
        totalProcessingTime: 15000,
        warningReason: "Score improved but below threshold",
      };

      expect(result.warningReason).toBe("Score improved but below threshold");
    });
  });

  describe("FixerInput interface", () => {
    it("can create fixer input without sources", () => {
      const input: FixerInput = {
        brief: "The brief content to improve",
        dimensionScore: 5.5,
        critique: "Needs better evidence",
      };

      expect(input.brief).toBeDefined();
      expect(input.dimensionScore).toBe(5.5);
      expect(input.sources).toBeUndefined();
    });

    it("can create fixer input with sources", () => {
      const input: FixerInput = {
        brief: "Brief content",
        dimensionScore: 6.0,
        critique: "Add more citations",
        sources: [
          {
            url: "https://example.com",
            title: "Source Title",
            content: "Source content",
          },
        ],
      };

      expect(input.sources?.length).toBe(1);
      expect(input.sources?.[0].title).toBe("Source Title");
    });
  });

  describe("DimensionScores interface", () => {
    it("can create scores for all dimensions", () => {
      const scores: DimensionScores = {
        [FixerType.firstPrinciplesCoherence]: 7.5,
        [FixerType.internalConsistency]: 8.0,
        [FixerType.evidenceQuality]: 6.5,
        [FixerType.accessibility]: 7.0,
        [FixerType.objectivity]: 8.5,
        [FixerType.factualAccuracy]: 9.0,
        [FixerType.biasDetection]: 7.5,
      };

      expect(scores[FixerType.firstPrinciplesCoherence]).toBe(7.5);
      expect(scores[FixerType.factualAccuracy]).toBe(9.0);
    });
  });

  describe("ConsensusResult interface", () => {
    it("can create consensus result", () => {
      const result: ConsensusResult = {
        overallScore: 7.5,
        dimensionScores: {
          [FixerType.firstPrinciplesCoherence]: 7.0,
          [FixerType.internalConsistency]: 8.0,
          [FixerType.evidenceQuality]: 7.5,
          [FixerType.accessibility]: 7.0,
          [FixerType.objectivity]: 8.0,
          [FixerType.factualAccuracy]: 7.5,
          [FixerType.biasDetection]: 7.5,
        },
        critique: "Overall good quality with room for improvement",
        dimensionCritiques: {
          [FixerType.firstPrinciplesCoherence]: "Could use clearer reasoning",
          [FixerType.internalConsistency]: "Very consistent",
          [FixerType.evidenceQuality]: "Adequate sources",
          [FixerType.accessibility]: "Good readability",
          [FixerType.objectivity]: "Well balanced",
          [FixerType.factualAccuracy]: "Facts verified",
          [FixerType.biasDetection]: "Minor bias detected",
        },
      };

      expect(result.overallScore).toBe(7.5);
      expect(result.critique).toContain("good quality");
    });
  });

  describe("ReconciliationResult interface", () => {
    it("can create reconciliation result", () => {
      const result: ReconciliationResult = {
        revisedBrief: "The improved and reconciled brief content...",
        editsApplied: [
          {
            section: "intro",
            originalText: "old",
            suggestedText: "new",
            rationale: "improvement",
            priority: "high",
          },
        ],
        editsSkipped: [],
      };

      expect(result.revisedBrief).toBeDefined();
      expect(result.editsApplied.length).toBe(1);
      expect(result.editsSkipped.length).toBe(0);
    });

    it("can include both applied and skipped edits", () => {
      const result: ReconciliationResult = {
        revisedBrief: "Brief content",
        editsApplied: [
          {
            section: "body",
            originalText: "a",
            suggestedText: "b",
            rationale: "r",
            priority: "medium",
          },
        ],
        editsSkipped: [
          {
            edit: {
              section: "conclusion",
              originalText: "x",
              suggestedText: "y",
              rationale: "z",
              priority: "low",
            },
            reason: "Conflicted with another edit",
          },
        ],
      };

      expect(result.editsApplied.length).toBe(1);
      expect(result.editsSkipped.length).toBe(1);
    });
  });
});
