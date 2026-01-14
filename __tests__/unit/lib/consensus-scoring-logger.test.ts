/**
 * Tests for lib/agents/consensus-scoring-logger.ts
 *
 * Tests the consensus scoring logging functionality including:
 * - Logging evaluator verdicts
 * - Logging disagreement detection
 * - Logging discussion rounds
 * - Logging tiebreaker verdicts
 * - Logging final consensus scores
 * - Full consensus scoring run logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  EvaluatorVerdict,
  DisagreementResult,
  ClarityScore,
  DimensionScore,
} from "@/lib/types/clarity-scoring";
import type { DiscussionRoundOutput } from "@/lib/agents/discussion-round-agent";
import type { TiebreakerOutput } from "@/lib/agents/tiebreaker-agent";

// Create mock chain functions
const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
};

vi.mock("@/lib/supabase/client", () => ({
  createServiceRoleClient: () => mockSupabase,
}));

import {
  logEvaluatorVerdict,
  logAllEvaluatorVerdicts,
  logDisagreementDetection,
  logDiscussionRound,
  logTiebreakerVerdict,
  logFinalConsensusScore,
  logFullConsensusScoringRun,
} from "@/lib/agents/consensus-scoring-logger";

// Helper to create a mock evaluator verdict
function createMockVerdict(
  role: "Skeptic" | "Advocate" | "Generalist" | "Arbiter" = "Skeptic",
  overallScore: number = 7.5
): EvaluatorVerdict {
  return {
    evaluatorRole: role,
    overallScore,
    confidence: 0.85,
    critique: "This is a test critique for the evaluation.",
    dimensionScores: [
      {
        dimension: "firstPrinciplesCoherence",
        score: 7.0,
        reasoning: "Good foundational reasoning",
        issues: [],
      },
      {
        dimension: "internalConsistency",
        score: 8.0,
        reasoning: "Consistent throughout",
        issues: [],
      },
      {
        dimension: "evidenceQuality",
        score: 6.5,
        reasoning: "Adequate evidence",
        issues: [],
      },
      {
        dimension: "accessibility",
        score: 8.5,
        reasoning: "Clear and accessible",
        issues: [],
      },
      {
        dimension: "objectivity",
        score: 7.0,
        reasoning: "Mostly objective",
        issues: [],
      },
      {
        dimension: "factualAccuracy",
        score: 7.5,
        reasoning: "Facts are accurate",
        issues: [],
      },
      {
        dimension: "biasDetection",
        score: 8.0,
        reasoning: "Low bias detected",
        issues: [],
      },
    ],
    issues: [
      {
        dimension: "evidenceQuality",
        severity: "medium",
        description: "Some sources could be stronger",
      },
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

// Helper to create a mock disagreement result
function createMockDisagreement(hasDisagreement: boolean = true): DisagreementResult {
  return {
    hasDisagreement,
    disagreeingDimensions: hasDisagreement ? ["evidenceQuality", "objectivity"] : [],
    maxSpread: hasDisagreement ? 2.5 : 0.5,
    evaluatorPositions: [
      {
        evaluator: "Skeptic",
        overallScore: 6.5,
        divergentDimensions: hasDisagreement
          ? [
              { dimension: "evidenceQuality", score: 5.0 },
              { dimension: "objectivity", score: 6.0 },
            ]
          : [],
      },
      {
        evaluator: "Advocate",
        overallScore: 8.0,
        divergentDimensions: hasDisagreement
          ? [
              { dimension: "evidenceQuality", score: 7.5 },
              { dimension: "objectivity", score: 8.0 },
            ]
          : [],
      },
      {
        evaluator: "Generalist",
        overallScore: 7.0,
        divergentDimensions: hasDisagreement
          ? [
              { dimension: "evidenceQuality", score: 6.5 },
              { dimension: "objectivity", score: 7.0 },
            ]
          : [],
      },
    ],
  };
}

// Helper to create a mock discussion round output
function createMockDiscussionOutput(): DiscussionRoundOutput {
  return {
    revisedVerdicts: [
      createMockVerdict("Skeptic", 7.0),
      createMockVerdict("Advocate", 7.5),
      createMockVerdict("Generalist", 7.2),
    ],
    discussionSummary: "Evaluators reached closer consensus after discussion.",
    changesCount: 2,
    durationMs: 3500,
  };
}

// Helper to create a mock tiebreaker output
function createMockTiebreakerOutput(): TiebreakerOutput {
  return {
    verdict: createMockVerdict("Arbiter", 7.3),
    resolutionSummary: "Arbiter resolved disputes on evidenceQuality and objectivity.",
    durationMs: 4200,
  };
}

// Helper to create a mock clarity score
function createMockClarityScore(): ClarityScore {
  return {
    overallScore: 7.4,
    dimensionBreakdown: [
      {
        dimension: "firstPrinciplesCoherence",
        score: 7.0,
        reasoning: "Good foundational reasoning",
        issues: [],
      },
      {
        dimension: "internalConsistency",
        score: 8.0,
        reasoning: "Consistent throughout",
        issues: [],
      },
      {
        dimension: "evidenceQuality",
        score: 6.5,
        reasoning: "Adequate evidence",
        issues: [],
      },
      {
        dimension: "accessibility",
        score: 8.5,
        reasoning: "Clear and accessible",
        issues: [],
      },
      {
        dimension: "objectivity",
        score: 7.0,
        reasoning: "Mostly objective",
        issues: [],
      },
      {
        dimension: "factualAccuracy",
        score: 7.5,
        reasoning: "Facts are accurate",
        issues: [],
      },
      {
        dimension: "biasDetection",
        score: 8.0,
        reasoning: "Low bias detected",
        issues: [],
      },
    ],
    critique: "Overall good brief with minor improvements needed.",
    confidence: 0.88,
    evaluatorVerdicts: [
      createMockVerdict("Skeptic", 7.0),
      createMockVerdict("Advocate", 7.8),
      createMockVerdict("Generalist", 7.2),
    ],
    consensusMethod: "median",
    hasDisagreement: false,
    needsHumanReview: false,
    scoredAt: new Date().toISOString(),
  };
}

describe("consensus-scoring-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logEvaluatorVerdict", () => {
    it("logs evaluator verdict successfully", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdict = createMockVerdict("Skeptic", 7.5);
      await logEvaluatorVerdict("brief-123", verdict, 1500, 0);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "Consensus Evaluator (Skeptic)",
          status: "completed",
          duration_ms: 1500,
          metadata: expect.objectContaining({
            type: "evaluator_verdict",
            evaluatorRole: "Skeptic",
            overallScore: 7.5,
            confidence: 0.85,
            issueCount: 1,
            retryCount: 0,
          }),
        })
      );
    });

    it("handles null briefId", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdict = createMockVerdict("Advocate", 8.0);
      await logEvaluatorVerdict(null, verdict, 1200);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: null,
        })
      );
    });

    it("truncates long issue descriptions", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdict = createMockVerdict("Generalist", 7.0);
      verdict.issues = [
        {
          dimension: "evidenceQuality",
          severity: "high",
          description: "A".repeat(300), // Long description
        },
      ];

      await logEvaluatorVerdict("brief-123", verdict, 1000);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.issues[0].description.length).toBeLessThanOrEqual(200);
    });

    it("handles database error gracefully", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const verdict = createMockVerdict("Skeptic", 7.0);
      await logEvaluatorVerdict("brief-123", verdict, 1000);

      expect(console.error).toHaveBeenCalled();
    });

    it("handles exception during insert", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const verdict = createMockVerdict("Advocate", 7.5);
      // Should not throw
      await expect(logEvaluatorVerdict("brief-123", verdict, 1000)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it("correctly transforms dimension scores to record", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdict = createMockVerdict("Skeptic", 7.5);
      await logEvaluatorVerdict("brief-123", verdict, 1500);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.dimensionScores).toEqual({
        firstPrinciplesCoherence: 7.0,
        internalConsistency: 8.0,
        evidenceQuality: 6.5,
        accessibility: 8.5,
        objectivity: 7.0,
        factualAccuracy: 7.5,
        biasDetection: 8.0,
      });
    });
  });

  describe("logAllEvaluatorVerdicts", () => {
    it("logs all verdicts in parallel", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdicts = [
        createMockVerdict("Skeptic", 7.0),
        createMockVerdict("Advocate", 7.8),
        createMockVerdict("Generalist", 7.2),
      ];

      const durations = [
        { role: "Skeptic", durationMs: 1200 },
        { role: "Advocate", durationMs: 1100 },
        { role: "Generalist", durationMs: 1300 },
      ];

      await logAllEvaluatorVerdicts("brief-123", verdicts, durations);

      expect(mockInsert).toHaveBeenCalledTimes(3);
    });

    it("handles missing duration for a role", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const verdicts = [createMockVerdict("Skeptic", 7.0)];
      const durations: Array<{ role: string; durationMs: number }> = []; // No durations

      await logAllEvaluatorVerdicts("brief-123", verdicts, durations);

      // Should use 0 as default duration
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_ms: 0,
        })
      );
    });
  });

  describe("logDisagreementDetection", () => {
    it("logs disagreement detection result", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const disagreement = createMockDisagreement(true);
      await logDisagreementDetection("brief-123", disagreement, 200);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "Consensus Disagreement Detection",
          status: "completed",
          duration_ms: 200,
          metadata: expect.objectContaining({
            type: "disagreement_detection",
            hasDisagreement: true,
            disagreeingDimensions: ["evidenceQuality", "objectivity"],
            maxSpread: 2.5,
          }),
        })
      );
    });

    it("logs when no disagreement detected", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const disagreement = createMockDisagreement(false);
      await logDisagreementDetection("brief-123", disagreement, 150);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.hasDisagreement).toBe(false);
      expect(insertCall.metadata.disagreeingDimensions).toEqual([]);
    });

    it("includes evaluator positions in metadata", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const disagreement = createMockDisagreement(true);
      await logDisagreementDetection("brief-123", disagreement, 200);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.evaluatorPositions).toHaveLength(3);
      expect(insertCall.metadata.evaluatorPositions[0].evaluator).toBe("Skeptic");
    });
  });

  describe("logDiscussionRound", () => {
    it("logs discussion round output", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const output = createMockDiscussionOutput();
      await logDiscussionRound("brief-123", output, true);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "Consensus Discussion Round",
          status: "completed",
          duration_ms: 3500,
          metadata: expect.objectContaining({
            type: "discussion_round",
            changesCount: 2,
            discussionSummaryLength: output.discussionSummary.length,
            resolvedDisagreement: true,
          }),
        })
      );
    });

    it("handles unresolved disagreement", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const output = createMockDiscussionOutput();
      await logDiscussionRound("brief-123", output, false);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.resolvedDisagreement).toBe(false);
    });

    it("counts revisions by evaluator", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const output = createMockDiscussionOutput();
      await logDiscussionRound("brief-123", output, true);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.revisionsByEvaluator).toBeDefined();
      expect(typeof insertCall.metadata.revisionsByEvaluator).toBe("object");
    });
  });

  describe("logTiebreakerVerdict", () => {
    it("logs tiebreaker verdict", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const output = createMockTiebreakerOutput();
      const disputedDimensions = ["evidenceQuality", "objectivity"];

      await logTiebreakerVerdict("brief-123", output, disputedDimensions);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "Consensus Tiebreaker (Arbiter)",
          status: "completed",
          duration_ms: 4200,
          metadata: expect.objectContaining({
            type: "tiebreaker",
            arbiterScore: 7.3,
            disputedDimensionsResolved: disputedDimensions,
            resolutionSummaryLength: output.resolutionSummary.length,
          }),
        })
      );
    });

    it("handles empty disputed dimensions", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const output = createMockTiebreakerOutput();
      await logTiebreakerVerdict("brief-123", output, []);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.disputedDimensionsResolved).toEqual([]);
    });
  });

  describe("logFinalConsensusScore", () => {
    it("logs final consensus score", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const clarityScore = createMockClarityScore();
      await logFinalConsensusScore("brief-123", clarityScore, 8000, 3);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "Consensus Final Score Calculator",
          status: "completed",
          duration_ms: 8000,
          metadata: expect.objectContaining({
            type: "final_consensus_score",
            overallScore: 7.4,
            consensusMethod: "median",
            confidence: 0.88,
            hasDisagreement: false,
            needsHumanReview: false,
            evaluatorCount: 3,
          }),
        })
      );
    });

    it("includes dimension breakdown", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const clarityScore = createMockClarityScore();
      await logFinalConsensusScore("brief-123", clarityScore, 8000, 3);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.dimensionBreakdown).toEqual({
        firstPrinciplesCoherence: 7.0,
        internalConsistency: 8.0,
        evidenceQuality: 6.5,
        accessibility: 8.5,
        objectivity: 7.0,
        factualAccuracy: 7.5,
        biasDetection: 8.0,
      });
    });

    it("includes review reason when human review is needed", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const clarityScore = createMockClarityScore();
      clarityScore.needsHumanReview = true;
      clarityScore.reviewReason = "Low confidence in evidence quality assessment";

      await logFinalConsensusScore("brief-123", clarityScore, 8000, 3);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.needsHumanReview).toBe(true);
      expect(insertCall.metadata.reviewReason).toBe(
        "Low confidence in evidence quality assessment"
      );
    });

    it("calculates total issue count from all verdicts", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const clarityScore = createMockClarityScore();
      // Each verdict has 1 issue, 3 verdicts = 3 issues
      await logFinalConsensusScore("brief-123", clarityScore, 8000, 3);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.issueCount).toBe(3);
    });
  });

  describe("logFullConsensusScoringRun", () => {
    it("logs all components of a scoring run", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: "brief-123",
        verdicts: [
          createMockVerdict("Skeptic", 7.0),
          createMockVerdict("Advocate", 7.8),
          createMockVerdict("Generalist", 7.2),
        ],
        evaluatorDurations: [
          { role: "Skeptic", durationMs: 1200 },
          { role: "Advocate", durationMs: 1100 },
          { role: "Generalist", durationMs: 1300 },
        ],
        disagreement: createMockDisagreement(false),
        disagreementDetectionDurationMs: 150,
        clarityScore: createMockClarityScore(),
        totalDurationMs: 5000,
      };

      await logFullConsensusScoringRun(log);

      // Should log verdicts (3) + disagreement (1) + final score (1) = 5 inserts
      expect(mockInsert).toHaveBeenCalledTimes(5);
    });

    it("includes discussion round when present", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: "brief-123",
        verdicts: [
          createMockVerdict("Skeptic", 7.0),
          createMockVerdict("Advocate", 7.8),
          createMockVerdict("Generalist", 7.2),
        ],
        evaluatorDurations: [
          { role: "Skeptic", durationMs: 1200 },
          { role: "Advocate", durationMs: 1100 },
          { role: "Generalist", durationMs: 1300 },
        ],
        disagreement: createMockDisagreement(true),
        disagreementDetectionDurationMs: 150,
        discussionRound: createMockDiscussionOutput(),
        discussionResolvedDisagreement: false,
        clarityScore: createMockClarityScore(),
        totalDurationMs: 10000,
      };

      await logFullConsensusScoringRun(log);

      // Should log verdicts (3) + disagreement (1) + discussion (1) + final score (1) = 6 inserts
      expect(mockInsert).toHaveBeenCalledTimes(6);
    });

    it("includes tiebreaker when present", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: "brief-123",
        verdicts: [
          createMockVerdict("Skeptic", 7.0),
          createMockVerdict("Advocate", 7.8),
          createMockVerdict("Generalist", 7.2),
        ],
        evaluatorDurations: [
          { role: "Skeptic", durationMs: 1200 },
          { role: "Advocate", durationMs: 1100 },
          { role: "Generalist", durationMs: 1300 },
        ],
        disagreement: createMockDisagreement(true),
        disagreementDetectionDurationMs: 150,
        tiebreaker: createMockTiebreakerOutput(),
        disputedDimensions: ["evidenceQuality", "objectivity"],
        clarityScore: createMockClarityScore(),
        totalDurationMs: 12000,
      };

      await logFullConsensusScoringRun(log);

      // Should log verdicts (3) + disagreement (1) + tiebreaker (1) + final score (1) = 6 inserts
      expect(mockInsert).toHaveBeenCalledTimes(6);
    });

    it("includes both discussion round and tiebreaker when present", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: "brief-123",
        verdicts: [
          createMockVerdict("Skeptic", 7.0),
          createMockVerdict("Advocate", 7.8),
          createMockVerdict("Generalist", 7.2),
        ],
        evaluatorDurations: [
          { role: "Skeptic", durationMs: 1200 },
          { role: "Advocate", durationMs: 1100 },
          { role: "Generalist", durationMs: 1300 },
        ],
        disagreement: createMockDisagreement(true),
        disagreementDetectionDurationMs: 150,
        discussionRound: createMockDiscussionOutput(),
        discussionResolvedDisagreement: false,
        tiebreaker: createMockTiebreakerOutput(),
        disputedDimensions: ["evidenceQuality", "objectivity"],
        clarityScore: createMockClarityScore(),
        totalDurationMs: 15000,
      };

      await logFullConsensusScoringRun(log);

      // Should log verdicts (3) + disagreement (1) + discussion (1) + tiebreaker (1) + final score (1) = 7 inserts
      expect(mockInsert).toHaveBeenCalledTimes(7);
    });

    it("handles null briefId throughout", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: null,
        verdicts: [createMockVerdict("Skeptic", 7.0)],
        evaluatorDurations: [{ role: "Skeptic", durationMs: 1200 }],
        disagreement: createMockDisagreement(false),
        disagreementDetectionDurationMs: 150,
        clarityScore: createMockClarityScore(),
        totalDurationMs: 3000,
      };

      await logFullConsensusScoringRun(log);

      // All inserts should have brief_id: null
      for (const call of mockInsert.mock.calls) {
        expect(call[0].brief_id).toBeNull();
      }
    });

    it("defaults discussionResolvedDisagreement to false when undefined", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const log = {
        briefId: "brief-123",
        verdicts: [createMockVerdict("Skeptic", 7.0)],
        evaluatorDurations: [{ role: "Skeptic", durationMs: 1200 }],
        disagreement: createMockDisagreement(true),
        disagreementDetectionDurationMs: 150,
        discussionRound: createMockDiscussionOutput(),
        // discussionResolvedDisagreement is undefined
        clarityScore: createMockClarityScore(),
        totalDurationMs: 8000,
      };

      await logFullConsensusScoringRun(log);

      // Find the discussion round insert
      const discussionInsert = mockInsert.mock.calls.find(
        (call) => call[0].metadata?.type === "discussion_round"
      );
      expect(discussionInsert).toBeDefined();
      expect(discussionInsert![0].metadata.resolvedDisagreement).toBe(false);
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully across all functions", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const verdict = createMockVerdict("Skeptic", 7.0);
      const disagreement = createMockDisagreement(true);
      const discussionOutput = createMockDiscussionOutput();
      const tiebreakerOutput = createMockTiebreakerOutput();
      const clarityScore = createMockClarityScore();

      // All these should not throw
      await expect(logEvaluatorVerdict("brief-123", verdict, 1000)).resolves.toBeUndefined();
      await expect(
        logDisagreementDetection("brief-123", disagreement, 100)
      ).resolves.toBeUndefined();
      await expect(
        logDiscussionRound("brief-123", discussionOutput, true)
      ).resolves.toBeUndefined();
      await expect(
        logTiebreakerVerdict("brief-123", tiebreakerOutput, ["evidenceQuality"])
      ).resolves.toBeUndefined();
      await expect(
        logFinalConsensusScore("brief-123", clarityScore, 5000, 3)
      ).resolves.toBeUndefined();
    });

    it("handles network exceptions gracefully", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const log = {
        briefId: "brief-123",
        verdicts: [createMockVerdict("Skeptic", 7.0)],
        evaluatorDurations: [{ role: "Skeptic", durationMs: 1200 }],
        disagreement: createMockDisagreement(false),
        disagreementDetectionDurationMs: 150,
        clarityScore: createMockClarityScore(),
        totalDurationMs: 3000,
      };

      // Should not throw
      await expect(logFullConsensusScoringRun(log)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
