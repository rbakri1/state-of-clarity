/**
 * Tests for lib/agents/execution-logger.ts
 *
 * Tests the agent execution logging functionality including:
 * - Token estimation
 * - Log entry creation and updates
 * - Execution wrappers
 * - Log retrieval and performance summaries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Create mock chain functions
const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
const mockEq = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
const mockOrder = vi.fn();
const mockSelectEq = vi.fn().mockReturnValue({ order: mockOrder });
const mockSelectForQuery = vi.fn().mockReturnValue({ eq: mockSelectEq });

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelectForQuery,
  }),
};

vi.mock("@/lib/supabase/client", () => ({
  createServiceRoleClient: () => mockSupabase,
}));

import {
  estimateTokenCount,
  logAgentStart,
  logAgentComplete,
  logAgentFailed,
  withExecutionLogging,
  executeWithLogging,
  getExecutionLogsForBrief,
  getBriefPerformanceSummary,
  type ExecutionContext,
} from "@/lib/agents/execution-logger";

describe("execution-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("estimateTokenCount", () => {
    it("returns correct count based on chars / 4", () => {
      // 16 characters should give 4 tokens
      expect(estimateTokenCount("1234567890123456")).toBe(4);
      // 17 characters should give 5 tokens (ceiling)
      expect(estimateTokenCount("12345678901234567")).toBe(5);
      // 8 characters should give 2 tokens
      expect(estimateTokenCount("12345678")).toBe(2);
    });

    it("handles empty string", () => {
      expect(estimateTokenCount("")).toBe(0);
    });

    it("handles null/undefined gracefully", () => {
      expect(estimateTokenCount(null as unknown as string)).toBe(0);
      expect(estimateTokenCount(undefined as unknown as string)).toBe(0);
    });

    it("rounds up for partial tokens", () => {
      // 5 characters should give 2 tokens (ceiling of 1.25)
      expect(estimateTokenCount("12345")).toBe(2);
      // 1 character should give 1 token (ceiling of 0.25)
      expect(estimateTokenCount("a")).toBe(1);
    });
  });

  describe("logAgentStart", () => {
    const defaultContext: ExecutionContext = {
      briefId: "test-brief-id",
      executionMode: "sequential",
    };

    it("inserts log entry and returns ID", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const result = await logAgentStart("Test Agent", defaultContext, 100);

      expect(result).toBe("log-entry-id");
      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          brief_id: "test-brief-id",
          agent_name: "Test Agent",
          status: "running",
          metadata: expect.objectContaining({
            inputTokenEstimate: 100,
            executionMode: "sequential",
          }),
        })
      );
    });

    it("returns null on database error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await logAgentStart("Test Agent", defaultContext);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("returns null when data.id is missing", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await logAgentStart("Test Agent", defaultContext);

      expect(result).toBeNull();
    });

    it("handles exception during insert", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const result = await logAgentStart("Test Agent", defaultContext);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("includes parallel group in metadata when provided", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });

      const contextWithGroup: ExecutionContext = {
        briefId: "test-brief-id",
        executionMode: "parallel",
        parallelGroup: "research-group",
      };

      await logAgentStart("Test Agent", contextWithGroup);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            parallelGroup: "research-group",
            executionMode: "parallel",
          }),
        })
      );
    });
  });

  describe("logAgentComplete", () => {
    it("updates entry with duration and completion status", async () => {
      const startedAt = new Date(Date.now() - 1000); // 1 second ago

      await logAgentComplete("log-id-123", "Test Agent", startedAt, 50);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          metadata: { outputTokenEstimate: 50 },
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "log-id-123");
    });

    it("handles null logId gracefully", async () => {
      const startedAt = new Date();

      await logAgentComplete(null, "Test Agent", startedAt);

      // Should not call update when logId is null
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("calculates duration correctly", async () => {
      const startedAt = new Date(Date.now() - 5000); // 5 seconds ago

      await logAgentComplete("log-id-123", "Test Agent", startedAt);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_ms: expect.any(Number),
        })
      );

      // Get the actual call to check duration is reasonable
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.duration_ms).toBeGreaterThanOrEqual(4900);
      expect(updateCall.duration_ms).toBeLessThan(6000);
    });

    it("handles exception during update", async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error("Update failed");
      });

      const startedAt = new Date();

      // Should not throw
      await expect(
        logAgentComplete("log-id-123", "Test Agent", startedAt)
      ).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("logAgentFailed", () => {
    it("updates entry with error message and failed status", async () => {
      const startedAt = new Date(Date.now() - 500);
      const error = new Error("Something went wrong");

      await logAgentFailed("log-id-456", "Test Agent", startedAt, error);

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          error_message: "Something went wrong",
        })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "log-id-456");
    });

    it("handles string error", async () => {
      const startedAt = new Date();

      await logAgentFailed("log-id-456", "Test Agent", startedAt, "String error");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          error_message: "String error",
        })
      );
    });

    it("handles null logId gracefully", async () => {
      const startedAt = new Date();

      await logAgentFailed(null, "Test Agent", startedAt, new Error("Error"));

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("handles exception during update", async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error("Update failed");
      });

      const startedAt = new Date();

      await expect(
        logAgentFailed("log-id-456", "Test Agent", startedAt, new Error("Error"))
      ).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("withExecutionLogging", () => {
    const defaultContext: ExecutionContext = {
      briefId: "test-brief-id",
      executionMode: "sequential",
    };

    beforeEach(() => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });
    });

    it("wraps function correctly and returns result", async () => {
      const originalFn = vi.fn().mockResolvedValue("result-value");

      const wrappedFn = withExecutionLogging(
        "Wrapped Agent",
        originalFn,
        defaultContext
      );

      const result = await wrappedFn("arg1", "arg2");

      expect(result).toBe("result-value");
      expect(originalFn).toHaveBeenCalledWith("arg1", "arg2");
      expect(mockInsert).toHaveBeenCalled(); // logAgentStart was called
    });

    it("logs failure on error and rethrows", async () => {
      const originalFn = vi.fn().mockRejectedValue(new Error("Agent failed"));

      const wrappedFn = withExecutionLogging(
        "Failing Agent",
        originalFn,
        defaultContext
      );

      await expect(wrappedFn()).rejects.toThrow("Agent failed");
      expect(mockInsert).toHaveBeenCalled(); // logAgentStart was called
    });

    it("uses getInputSize option", async () => {
      const originalFn = vi.fn().mockResolvedValue("result");
      const getInputSize = vi.fn().mockReturnValue(42);

      const wrappedFn = withExecutionLogging(
        "Agent",
        originalFn,
        defaultContext,
        { getInputSize }
      );

      await wrappedFn("test-input");

      expect(getInputSize).toHaveBeenCalledWith("test-input");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            inputTokenEstimate: 42,
          }),
        })
      );
    });

    it("uses getOutputSize option", async () => {
      const originalFn = vi.fn().mockResolvedValue({ data: "test" });
      const getOutputSize = vi.fn().mockReturnValue(100);

      const wrappedFn = withExecutionLogging(
        "Agent",
        originalFn,
        defaultContext,
        { getOutputSize }
      );

      await wrappedFn();

      expect(getOutputSize).toHaveBeenCalledWith({ data: "test" });
    });

    it("preserves function arguments and return type", async () => {
      const originalFn = vi.fn<[number, string], Promise<{ sum: number }>>(
        async (num, str) => ({ sum: num + str.length })
      );

      const wrappedFn = withExecutionLogging(
        "Agent",
        originalFn,
        defaultContext
      );

      const result = await wrappedFn(5, "hello");

      expect(result).toEqual({ sum: 10 });
      expect(originalFn).toHaveBeenCalledWith(5, "hello");
    });
  });

  describe("executeWithLogging", () => {
    const defaultContext: ExecutionContext = {
      briefId: "test-brief-id",
      executionMode: "parallel",
    };

    beforeEach(() => {
      mockSingle.mockResolvedValue({
        data: { id: "log-entry-id" },
        error: null,
      });
    });

    it("executes function and logs", async () => {
      const fn = vi.fn().mockResolvedValue("executed-result");

      const result = await executeWithLogging(
        "Execute Agent",
        fn,
        defaultContext
      );

      expect(result).toBe("executed-result");
      expect(fn).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it("estimates tokens from inputText option", async () => {
      const fn = vi.fn().mockResolvedValue("result");

      await executeWithLogging("Agent", fn, defaultContext, {
        inputText: "1234567890123456", // 16 chars = 4 tokens
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            inputTokenEstimate: 4,
          }),
        })
      );
    });

    it("rethrows error on failure", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Execution failed"));

      await expect(
        executeWithLogging("Agent", fn, defaultContext)
      ).rejects.toThrow("Execution failed");
    });

    it("uses getOutputSize option", async () => {
      const fn = vi.fn().mockResolvedValue("output-data");
      const getOutputSize = vi.fn().mockReturnValue(25);

      await executeWithLogging("Agent", fn, defaultContext, {
        getOutputSize,
      });

      expect(getOutputSize).toHaveBeenCalledWith("output-data");
    });
  });

  describe("getExecutionLogsForBrief", () => {
    it("returns mapped entries from database", async () => {
      const mockDbRows = [
        {
          id: "log-1",
          brief_id: "brief-123",
          agent_name: "Agent 1",
          started_at: "2024-01-01T10:00:00Z",
          completed_at: "2024-01-01T10:00:05Z",
          duration_ms: 5000,
          status: "completed",
          error_message: null,
          metadata: { executionMode: "sequential" },
        },
        {
          id: "log-2",
          brief_id: "brief-123",
          agent_name: "Agent 2",
          started_at: "2024-01-01T10:00:00Z",
          completed_at: null,
          duration_ms: null,
          status: "running",
          error_message: null,
          metadata: { executionMode: "parallel" },
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await getExecutionLogsForBrief("brief-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "log-1",
        briefId: "brief-123",
        agentName: "Agent 1",
        startedAt: new Date("2024-01-01T10:00:00Z"),
        completedAt: new Date("2024-01-01T10:00:05Z"),
        durationMs: 5000,
        status: "completed",
        errorMessage: undefined,
        metadata: { executionMode: "sequential" },
      });
      expect(result[1].completedAt).toBeUndefined();
      expect(result[1].durationMs).toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith("agent_execution_logs");
      expect(mockSelectForQuery).toHaveBeenCalledWith("*");
      expect(mockSelectEq).toHaveBeenCalledWith("brief_id", "brief-123");
      expect(mockOrder).toHaveBeenCalledWith("started_at", { ascending: true });
    });

    it("returns empty array on database error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await getExecutionLogsForBrief("brief-123");

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it("returns empty array on exception", async () => {
      mockOrder.mockRejectedValue(new Error("Network error"));

      const result = await getExecutionLogsForBrief("brief-123");

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it("returns empty array when data is null", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getExecutionLogsForBrief("brief-123");

      expect(result).toEqual([]);
    });
  });

  describe("getBriefPerformanceSummary", () => {
    it("calculates metrics correctly", async () => {
      const mockDbRows = [
        {
          id: "log-1",
          brief_id: "brief-123",
          agent_name: "Sequential Agent",
          started_at: "2024-01-01T10:00:00Z",
          completed_at: "2024-01-01T10:00:05Z",
          duration_ms: 5000,
          status: "completed",
          error_message: null,
          metadata: { executionMode: "sequential" },
        },
        {
          id: "log-2",
          brief_id: "brief-123",
          agent_name: "Parallel Agent 1",
          started_at: "2024-01-01T10:00:05Z",
          completed_at: "2024-01-01T10:00:08Z",
          duration_ms: 3000,
          status: "completed",
          error_message: null,
          metadata: { executionMode: "parallel" },
        },
        {
          id: "log-3",
          brief_id: "brief-123",
          agent_name: "Parallel Agent 2",
          started_at: "2024-01-01T10:00:05Z",
          completed_at: "2024-01-01T10:00:10Z",
          duration_ms: 5000,
          status: "failed",
          error_message: "Something failed",
          metadata: { executionMode: "parallel" },
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await getBriefPerformanceSummary("brief-123");

      expect(result).not.toBeNull();
      expect(result!.agentCount).toBe(3);
      expect(result!.parallelExecutions).toBe(2);
      expect(result!.sequentialExecutions).toBe(1);
      expect(result!.failedAgents).toEqual(["Parallel Agent 2"]);
      // Total duration: from earliest start (10:00:00) to latest completion (10:00:10) = 10000ms
      expect(result!.totalDurationMs).toBe(10000);
    });

    it("returns null when no logs exist", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getBriefPerformanceSummary("brief-123");

      expect(result).toBeNull();
    });

    it("handles logs without completion times", async () => {
      const mockDbRows = [
        {
          id: "log-1",
          brief_id: "brief-123",
          agent_name: "Running Agent",
          started_at: "2024-01-01T10:00:00Z",
          completed_at: null,
          duration_ms: null,
          status: "running",
          error_message: null,
          metadata: { executionMode: "sequential" },
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await getBriefPerformanceSummary("brief-123");

      expect(result).not.toBeNull();
      expect(result!.totalDurationMs).toBe(0);
      expect(result!.agentCount).toBe(1);
    });

    it("handles logs without execution mode metadata", async () => {
      const mockDbRows = [
        {
          id: "log-1",
          brief_id: "brief-123",
          agent_name: "Agent Without Mode",
          started_at: "2024-01-01T10:00:00Z",
          completed_at: "2024-01-01T10:00:05Z",
          duration_ms: 5000,
          status: "completed",
          error_message: null,
          metadata: null,
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await getBriefPerformanceSummary("brief-123");

      expect(result).not.toBeNull();
      expect(result!.parallelExecutions).toBe(0);
      expect(result!.sequentialExecutions).toBe(0);
    });

    it("returns null on database error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await getBriefPerformanceSummary("brief-123");

      expect(result).toBeNull();
    });
  });
});
