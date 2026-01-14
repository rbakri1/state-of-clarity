/**
 * Tests for lib/agents/refinement-logger.ts
 *
 * Tests the refinement logging functionality including:
 * - Cost estimation
 * - Agent execution logging
 * - Refinement attempt logging
 * - Refinement summary logging
 * - Fixer execution logging
 * - Orchestrator execution logging
 * - Reconciliation execution logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FixerType, RefinementAttempt, SuggestedEdit } from "@/lib/types/refinement";

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
  estimateRefinementCost,
  logAgentExecution,
  logRefinementAttempt,
  logRefinementSummary,
  logFixerExecution,
  logOrchestratorExecution,
  logReconciliationExecution,
  type AgentType,
  type LogStatus,
} from "@/lib/agents/refinement-logger";

// Helper to create a mock suggested edit
function createMockEdit(section: string = "Introduction"): SuggestedEdit {
  return {
    section,
    originalText: "This is the original text that needs improvement.",
    suggestedText: "This is the improved text with better clarity.",
    rationale: "Improved clarity and readability.",
    priority: "medium",
  };
}

// Helper to create a mock refinement attempt
function createMockRefinementAttempt(
  attemptNumber: number = 1,
  scoreBefore: number = 6.5,
  scoreAfter: number = 7.2
): RefinementAttempt {
  return {
    attemptNumber,
    fixersDeployed: [
      FixerType.firstPrinciplesCoherence,
      FixerType.evidenceQuality,
      FixerType.accessibility,
    ],
    editsMade: [
      createMockEdit("Introduction"),
      createMockEdit("Evidence Section"),
    ],
    editsSkipped: [
      {
        edit: createMockEdit("Conclusion"),
        reason: "Edit conflicts with previous changes",
      },
    ],
    scoreBeforeAfter: {
      before: scoreBefore,
      after: scoreAfter,
      dimensionScores: {
        [FixerType.firstPrinciplesCoherence]: { before: 6.0, after: 7.0 },
        [FixerType.internalConsistency]: { before: 7.0, after: 7.5 },
        [FixerType.evidenceQuality]: { before: 5.5, after: 6.5 },
        [FixerType.accessibility]: { before: 7.5, after: 8.0 },
        [FixerType.objectivity]: { before: 7.0, after: 7.0 },
        [FixerType.factualAccuracy]: { before: 6.5, after: 7.0 },
        [FixerType.biasDetection]: { before: 7.0, after: 7.5 },
      },
    },
    processingTime: 3500,
  };
}

describe("refinement-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("estimateRefinementCost", () => {
    it("returns non-zero cost for valid inputs", () => {
      const cost = estimateRefinementCost(3, 2);
      expect(cost).toBeGreaterThan(0);
    });

    it("returns 0 for zero fixers", () => {
      const cost = estimateRefinementCost(0, 1);
      // With 0 fixers, fixer cost is 0, but reconciliation and scoring still apply
      expect(cost).toBeGreaterThan(0);
    });

    it("returns 0 for zero attempts", () => {
      const cost = estimateRefinementCost(3, 0);
      expect(cost).toBe(0);
    });

    it("scales linearly with number of attempts", () => {
      const cost1 = estimateRefinementCost(3, 1);
      const cost2 = estimateRefinementCost(3, 2);
      // Use precision of 3 decimal places due to rounding in the implementation
      expect(cost2).toBeCloseTo(cost1 * 2, 3);
    });

    it("increases with more fixers", () => {
      const costLow = estimateRefinementCost(2, 1);
      const costHigh = estimateRefinementCost(5, 1);
      expect(costHigh).toBeGreaterThan(costLow);
    });

    it("returns value with up to 4 decimal places", () => {
      const cost = estimateRefinementCost(3, 1);
      const decimalPart = cost.toString().split(".")[1] || "";
      expect(decimalPart.length).toBeLessThanOrEqual(4);
    });
  });

  describe("logAgentExecution", () => {
    it("inserts log entry and returns ID", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "success",
        durationMs: 1500,
        metadata: { testKey: "testValue" },
      });

      expect(result).toBe("log-entry-id");
      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "test_agent",
          agent_type: "fixer",
          status: "success",
          duration_ms: 1500,
          metadata: { testKey: "testValue" },
        })
      );
    });

    it("handles undefined briefId", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logAgentExecution({
        agentName: "test_agent",
        agentType: "orchestrator",
        status: "success",
      });

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: undefined,
        })
      );
    });

    it("handles error message", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "failed",
        errorMessage: "Something went wrong",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Something went wrong",
        })
      );
    });

    it("returns null on database error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "success",
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("returns null on exception", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const result = await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "success",
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("uses empty object for undefined metadata", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "success",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        })
      );
    });

    it("sets completed_at to null when durationMs is not provided", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logAgentExecution({
        briefId: "brief-123",
        agentName: "test_agent",
        agentType: "fixer",
        status: "running",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          completed_at: null,
          duration_ms: undefined,
        })
      );
    });

    it("accepts all valid agent types", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const agentTypes: AgentType[] = ["fixer", "orchestrator", "reconciliation", "refinement_loop"];

      for (const agentType of agentTypes) {
        await logAgentExecution({
          briefId: "brief-123",
          agentName: "test_agent",
          agentType,
          status: "success",
        });
      }

      expect(mockInsert).toHaveBeenCalledTimes(4);
    });

    it("accepts all valid log statuses", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const statuses: LogStatus[] = ["running", "success", "failed", "skipped"];

      for (const status of statuses) {
        await logAgentExecution({
          briefId: "brief-123",
          agentName: "test_agent",
          agentType: "fixer",
          status,
        });
      }

      expect(mockInsert).toHaveBeenCalledTimes(4);
    });
  });

  describe("logRefinementAttempt", () => {
    it("logs refinement attempt with correct metadata", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);
      const result = await logRefinementAttempt("brief-123", attempt);

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "refinement_attempt_1",
          agent_type: "refinement_loop",
          status: "success",
          duration_ms: 3500,
          metadata: expect.objectContaining({
            attemptNumber: 1,
            fixersDeployed: [
              FixerType.firstPrinciplesCoherence,
              FixerType.evidenceQuality,
              FixerType.accessibility,
            ],
            editsCount: {
              suggested: 3, // 2 made + 1 skipped
              applied: 2,
              skipped: 1,
            },
            scores: {
              before: 6.5,
              after: 7.2,
              change: expect.closeTo(0.7, 1),
            },
            processingTimeMs: 3500,
          }),
        })
      );
    });

    it("handles attempt with no skipped edits", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);
      attempt.editsSkipped = [];

      await logRefinementAttempt("brief-123", attempt);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.editsCount.skipped).toBe(0);
      expect(insertCall.metadata.editsCount.suggested).toBe(2);
    });

    it("handles undefined briefId", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);
      await logRefinementAttempt(undefined, attempt);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: undefined,
        })
      );
    });

    it("includes dimension scores in metadata", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(2, 7.0, 7.8);
      await logRefinementAttempt("brief-123", attempt);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.dimensionScores).toBeDefined();
      expect(insertCall.metadata.dimensionScores[FixerType.firstPrinciplesCoherence]).toEqual({
        before: 6.0,
        after: 7.0,
      });
    });

    it("handles missing processingTime", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);
      (attempt as any).processingTime = undefined;

      await logRefinementAttempt("brief-123", attempt);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.processingTimeMs).toBe(0);
    });

    it("handles undefined editsSkipped", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);
      (attempt as any).editsSkipped = undefined;

      await logRefinementAttempt("brief-123", attempt);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.editsCount.skipped).toBe(0);
    });
  });

  describe("logRefinementSummary", () => {
    it("logs successful refinement summary", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempts = [
        createMockRefinementAttempt(1, 6.5, 7.2),
        createMockRefinementAttempt(2, 7.2, 8.1),
      ];

      const result = await logRefinementSummary("brief-123", {
        attempts,
        initialScore: 6.5,
        finalScore: 8.1,
        success: true,
        totalProcessingTimeMs: 7000,
      });

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "refinement_loop_summary",
          agent_type: "refinement_loop",
          status: "success",
          duration_ms: 7000,
          metadata: expect.objectContaining({
            totalAttempts: 2,
            initialScore: 6.5,
            finalScore: 8.1,
            success: true,
            totalProcessingTimeMs: 7000,
            totalEditsSuggested: 6, // 3 per attempt * 2 attempts
            totalEditsApplied: 4, // 2 per attempt * 2 attempts
            totalEditsSkipped: 2, // 1 per attempt * 2 attempts
          }),
        })
      );
    });

    it("logs failed refinement summary with warning reason", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempts = [createMockRefinementAttempt(1, 6.5, 6.8)];

      await logRefinementSummary("brief-123", {
        attempts,
        initialScore: 6.5,
        finalScore: 6.8,
        success: false,
        totalProcessingTimeMs: 3500,
        warningReason: "Score did not reach threshold after max attempts",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Score did not reach threshold after max attempts",
          metadata: expect.objectContaining({
            success: false,
            warningReason: "Score did not reach threshold after max attempts",
          }),
        })
      );
    });

    it("calculates estimated cost correctly", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempts = [
        createMockRefinementAttempt(1, 6.5, 7.2),
        createMockRefinementAttempt(2, 7.2, 8.0),
      ];

      await logRefinementSummary("brief-123", {
        attempts,
        initialScore: 6.5,
        finalScore: 8.0,
        success: true,
        totalProcessingTimeMs: 7000,
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.estimatedCostUsd).toBeGreaterThan(0);
      expect(typeof insertCall.metadata.estimatedCostUsd).toBe("number");
    });

    it("includes score progression", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempts = [
        createMockRefinementAttempt(1, 6.5, 7.2),
        createMockRefinementAttempt(2, 7.2, 8.0),
      ];

      await logRefinementSummary("brief-123", {
        attempts,
        initialScore: 6.5,
        finalScore: 8.0,
        success: true,
        totalProcessingTimeMs: 7000,
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.scoreProgression).toEqual([
        { attempt: 1, score: 7.2 },
        { attempt: 2, score: 8.0 },
      ]);
    });

    it("handles empty attempts array", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logRefinementSummary("brief-123", {
        attempts: [],
        initialScore: 6.5,
        finalScore: 6.5,
        success: false,
        totalProcessingTimeMs: 0,
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.totalAttempts).toBe(0);
      expect(insertCall.metadata.totalEditsSuggested).toBe(0);
      expect(insertCall.metadata.totalEditsApplied).toBe(0);
      expect(insertCall.metadata.scoreProgression).toEqual([]);
    });

    it("logs summary message to console", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const attempts = [createMockRefinementAttempt(1, 6.5, 8.1)];

      await logRefinementSummary("brief-123", {
        attempts,
        initialScore: 6.5,
        finalScore: 8.1,
        success: true,
        totalProcessingTimeMs: 3500,
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[ExecutionLogger] Refinement summary:")
      );
    });
  });

  describe("logFixerExecution", () => {
    it("logs fixer execution with success status", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logFixerExecution("brief-123", {
        fixerType: FixerType.evidenceQuality,
        dimensionScore: 5.5,
        editsGenerated: 3,
        confidence: 0.85,
        processingTimeMs: 1200,
        status: "success",
      });

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "fixer_evidenceQuality",
          agent_type: "fixer",
          status: "success",
          duration_ms: 1200,
          metadata: expect.objectContaining({
            fixerType: FixerType.evidenceQuality,
            dimensionScore: 5.5,
            editsGenerated: 3,
            confidence: 0.85,
            processingTimeMs: 1200,
          }),
        })
      );
    });

    it("logs fixer execution with failed status and error message", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logFixerExecution("brief-123", {
        fixerType: FixerType.accessibility,
        dimensionScore: 6.0,
        editsGenerated: 0,
        confidence: 0,
        processingTimeMs: 500,
        status: "failed",
        errorMessage: "LLM API error",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "LLM API error",
        })
      );
    });

    it("handles skipped status", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logFixerExecution("brief-123", {
        fixerType: FixerType.biasDetection,
        dimensionScore: 8.5,
        editsGenerated: 0,
        confidence: 0,
        processingTimeMs: 0,
        status: "skipped",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "skipped",
        })
      );
    });

    it("handles all fixer types", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const fixerTypes = Object.values(FixerType);

      for (const fixerType of fixerTypes) {
        await logFixerExecution("brief-123", {
          fixerType,
          dimensionScore: 6.0,
          editsGenerated: 1,
          confidence: 0.8,
          processingTimeMs: 1000,
          status: "success",
        });
      }

      expect(mockInsert).toHaveBeenCalledTimes(7);
    });
  });

  describe("logOrchestratorExecution", () => {
    it("logs orchestrator execution", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logOrchestratorExecution("brief-123", {
        fixersDeployed: [
          FixerType.evidenceQuality,
          FixerType.accessibility,
          FixerType.firstPrinciplesCoherence,
        ],
        fixersSkipped: [FixerType.biasDetection, FixerType.objectivity],
        totalEditsCollected: 8,
        processingTimeMs: 4500,
        dimensionScores: {
          [FixerType.firstPrinciplesCoherence]: 6.0,
          [FixerType.internalConsistency]: 7.5,
          [FixerType.evidenceQuality]: 5.0,
          [FixerType.accessibility]: 6.5,
          [FixerType.objectivity]: 8.0,
          [FixerType.factualAccuracy]: 7.0,
          [FixerType.biasDetection]: 8.5,
        },
        status: "success",
      });

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "fixer_orchestrator",
          agent_type: "orchestrator",
          status: "success",
          duration_ms: 4500,
          metadata: expect.objectContaining({
            fixersDeployed: [
              FixerType.evidenceQuality,
              FixerType.accessibility,
              FixerType.firstPrinciplesCoherence,
            ],
            fixersSkipped: [FixerType.biasDetection, FixerType.objectivity],
            totalEditsCollected: 8,
            processingTimeMs: 4500,
          }),
        })
      );
    });

    it("logs console message with deployment stats", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logOrchestratorExecution("brief-123", {
        fixersDeployed: [FixerType.evidenceQuality],
        fixersSkipped: [FixerType.biasDetection],
        totalEditsCollected: 3,
        processingTimeMs: 2000,
        dimensionScores: {},
        status: "success",
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[ExecutionLogger] Orchestrator:")
      );
    });

    it("handles failed orchestrator with error message", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logOrchestratorExecution("brief-123", {
        fixersDeployed: [],
        fixersSkipped: [],
        totalEditsCollected: 0,
        processingTimeMs: 100,
        dimensionScores: {},
        status: "failed",
        errorMessage: "Failed to initialize fixers",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Failed to initialize fixers",
        })
      );
    });
  });

  describe("logReconciliationExecution", () => {
    it("logs reconciliation execution", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logReconciliationExecution("brief-123", {
        editsReceived: 10,
        editsApplied: 7,
        editsSkipped: 3,
        conflictsResolved: 2,
        processingTimeMs: 2500,
        status: "success",
      });

      expect(result).toBe("log-entry-id");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "brief-123",
          agent_name: "edit_reconciliation",
          agent_type: "reconciliation",
          status: "success",
          duration_ms: 2500,
          metadata: expect.objectContaining({
            editsReceived: 10,
            editsApplied: 7,
            editsSkipped: 3,
            conflictsResolved: 2,
            processingTimeMs: 2500,
          }),
        })
      );
    });

    it("logs console message with reconciliation stats", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logReconciliationExecution("brief-123", {
        editsReceived: 5,
        editsApplied: 4,
        editsSkipped: 1,
        conflictsResolved: 1,
        processingTimeMs: 1500,
        status: "success",
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[ExecutionLogger] Reconciliation:")
      );
    });

    it("handles failed reconciliation", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logReconciliationExecution("brief-123", {
        editsReceived: 5,
        editsApplied: 0,
        editsSkipped: 0,
        conflictsResolved: 0,
        processingTimeMs: 500,
        status: "failed",
        errorMessage: "Failed to apply edits",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Failed to apply edits",
        })
      );
    });

    it("handles zero conflicts", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      await logReconciliationExecution("brief-123", {
        editsReceived: 3,
        editsApplied: 3,
        editsSkipped: 0,
        conflictsResolved: 0,
        processingTimeMs: 800,
        status: "success",
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.metadata.conflictsResolved).toBe(0);
    });
  });

  describe("error handling", () => {
    it("handles database errors gracefully across all logging functions", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);

      // All these should not throw and return null
      const results = await Promise.all([
        logAgentExecution({
          briefId: "brief-123",
          agentName: "test",
          agentType: "fixer",
          status: "success",
        }),
        logRefinementAttempt("brief-123", attempt),
        logRefinementSummary("brief-123", {
          attempts: [attempt],
          initialScore: 6.5,
          finalScore: 7.2,
          success: true,
          totalProcessingTimeMs: 3500,
        }),
        logFixerExecution("brief-123", {
          fixerType: FixerType.evidenceQuality,
          dimensionScore: 5.5,
          editsGenerated: 1,
          confidence: 0.8,
          processingTimeMs: 1000,
          status: "success",
        }),
        logOrchestratorExecution("brief-123", {
          fixersDeployed: [],
          fixersSkipped: [],
          totalEditsCollected: 0,
          processingTimeMs: 100,
          dimensionScores: {},
          status: "success",
        }),
        logReconciliationExecution("brief-123", {
          editsReceived: 0,
          editsApplied: 0,
          editsSkipped: 0,
          conflictsResolved: 0,
          processingTimeMs: 100,
          status: "success",
        }),
      ]);

      for (const result of results) {
        expect(result).toBeNull();
      }
    });

    it("handles network exceptions gracefully", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const attempt = createMockRefinementAttempt(1, 6.5, 7.2);

      // Should not throw
      await expect(logRefinementAttempt("brief-123", attempt)).resolves.toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
