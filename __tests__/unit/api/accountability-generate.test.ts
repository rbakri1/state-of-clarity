/**
 * Accountability Generate API Route Unit Tests
 *
 * Comprehensive tests for the generation endpoint including:
 * - Authentication and authorization
 * - Input validation (targetEntity, ethicsAcknowledged)
 * - Credit handling (check, deduct, refund)
 * - Quality gate logic with boundary conditions
 * - SSE streaming format and events
 * - Rate limiting
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

// --- Types for SSE events ---
interface SSEEvent<T = unknown> {
  event: string;
  data: T;
}

interface AgentStartedData {
  agent: string;
  timestamp: string;
}

interface AgentCompletedData {
  agent: string;
  duration: number;
  timestamp: string;
}

interface StageChangedData {
  stage: string;
  timestamp: string;
}

interface CompleteData {
  investigationId: string;
  qualityScore: number;
  creditRefunded: boolean;
  timestamp: string;
}

interface ErrorData {
  message: string;
  creditRefunded: boolean;
  timestamp: string;
}

// --- Mocks ---
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}));

const mockHasCredits = vi.fn();
const mockDeductCredits = vi.fn();
const mockRefundCredits = vi.fn();

vi.mock("@/lib/services/credit-service", () => ({
  hasCredits: (...args: unknown[]) => mockHasCredits(...args),
  deductCredits: (...args: unknown[]) => mockDeductCredits(...args),
  refundCredits: (...args: unknown[]) => mockRefundCredits(...args),
}));

const mockCreateInvestigation = vi.fn();

vi.mock("@/lib/services/accountability-service", () => ({
  createInvestigation: (...args: unknown[]) => mockCreateInvestigation(...args),
}));

const mockGenerateAccountabilityReport = vi.fn();

vi.mock("@/lib/agents/accountability-tracker-orchestrator", () => ({
  generateAccountabilityReport: (...args: unknown[]) =>
    mockGenerateAccountabilityReport(...args),
}));

// Mock middleware - withAuth uses real logic via mocked supabase
// withRateLimit needs to be mockable for rate limit tests
let rateLimitEnabled = false;
let rateLimitCounter = 0;
const RATE_LIMIT_MAX = 3;

vi.mock("@/lib/auth/middleware", () => ({
  withAuth: (
    handler: (
      req: NextRequest,
      ctx: { user: { id: string; email: string } }
    ) => Promise<Response>
  ) => {
    return async (req: NextRequest) => {
      const authResult = await mockGetUser();
      if (!authResult.data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return handler(req, { user: authResult.data.user });
    };
  },
  withRateLimit: (
    handler: (req: NextRequest) => Promise<Response>,
    _config?: { requests: number; window: number }
  ) => {
    return async (req: NextRequest) => {
      if (rateLimitEnabled) {
        rateLimitCounter++;
        if (rateLimitCounter > RATE_LIMIT_MAX) {
          return new Response(
            JSON.stringify({
              error: "Rate limit exceeded",
              message: "Too many requests. Try again later.",
              retryAfter: 3600,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "3600",
              },
            }
          );
        }
      }
      return handler(req);
    };
  },
}));

import { POST } from "@/app/api/accountability/generate/route";

// --- SSE Stream Reader Utility ---
async function readSSEStream<T = unknown>(
  response: Response
): Promise<SSEEvent<T>[]> {
  const events: SSEEvent<T>[] = [];
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return events;

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push({ event: currentEvent, data });
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const lines = buffer.split("\n");
    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push({ event: currentEvent, data });
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  return events;
}

// --- Helper to create test requests ---
function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/accountability/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// --- Tests ---
describe("Accountability Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateInvestigation.mockResolvedValue({ id: "inv-123" });
    mockDeductCredits.mockResolvedValue(true);
    rateLimitEnabled = false;
    rateLimitCounter = 0;
  });

  afterEach(() => {
    rateLimitEnabled = false;
    rateLimitCounter = 0;
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when getUser returns an error", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Session expired" },
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
    });

    describe("ethicsAcknowledged", () => {
      it("should return 400 when ethicsAcknowledged is false", async () => {
        const request = createRequest({
          targetEntity: "Test Entity",
          ethicsAcknowledged: false,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Ethics acknowledgment required");
      });

      it("should return 400 when ethicsAcknowledged is missing", async () => {
        const request = createRequest({
          targetEntity: "Test Entity",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Ethics acknowledgment required");
      });
    });

    describe("targetEntity", () => {
      it("should return 400 when targetEntity is missing", async () => {
        const request = createRequest({
          ethicsAcknowledged: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Target entity is required");
      });

      it("should return 400 when targetEntity is empty string", async () => {
        const request = createRequest({
          targetEntity: "",
          ethicsAcknowledged: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Target entity is required");
      });

      it("should return 400 when targetEntity is whitespace only", async () => {
        const request = createRequest({
          targetEntity: "   ",
          ethicsAcknowledged: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Target entity is required");
      });

      it("should return 400 when targetEntity is not a string", async () => {
        const request = createRequest({
          targetEntity: 12345,
          ethicsAcknowledged: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Target entity is required");
      });
    });
  });

  describe("Credit Handling", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
    });

    it("should return 402 when user has insufficient credits", async () => {
      mockHasCredits.mockResolvedValue(false);

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe("Insufficient credits");
      expect(data.redirectTo).toBe("/credits");
    });

    it("should check credits with correct user ID and amount", async () => {
      mockHasCredits.mockResolvedValue(false);

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      await POST(request);

      expect(mockHasCredits).toHaveBeenCalledWith("user-123", 1);
    });

    it("should deduct 1 credit before generation starts", async () => {
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 8.0,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      await readSSEStream(response);

      expect(mockDeductCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        expect.stringContaining("Test Entity")
      );

      // Verify deduction happens before generation
      expect(mockDeductCredits).toHaveBeenCalledBefore(
        mockGenerateAccountabilityReport
      );
    });
  });

  describe("Investigation Creation", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
    });

    it("should create investigation with correct parameters", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.5,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "  John Doe  ",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      await readSSEStream(response);

      expect(mockCreateInvestigation).toHaveBeenCalledWith(
        "John Doe", // trimmed
        "user-123",
        "individual",
        expect.any(Date)
      );
    });

    it("should create investigation before deducting credits", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.5,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      await readSSEStream(response);

      expect(mockCreateInvestigation).toHaveBeenCalledBefore(mockDeductCredits);
    });
  });

  describe("Quality Gate and Refunds", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
    });

    it("should refund credit when quality score < 6.0", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 5.9,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<CompleteData>(response);

      expect(mockRefundCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        "Quality gate failed"
      );

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.data.creditRefunded).toBe(true);
      expect(completeEvent?.data.qualityScore).toBe(5.9);
    });

    it("should NOT refund credit when quality score = 6.0 (boundary)", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 6.0,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<CompleteData>(response);

      expect(mockRefundCredits).not.toHaveBeenCalled();

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.data.creditRefunded).toBe(false);
      expect(completeEvent?.data.qualityScore).toBe(6.0);
    });

    it("should NOT refund credit when quality score > 6.0", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 8.5,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<CompleteData>(response);

      expect(mockRefundCredits).not.toHaveBeenCalled();

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.data.creditRefunded).toBe(false);
    });

    it("should handle null/undefined quality score as 0 (triggers refund)", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: undefined,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<CompleteData>(response);

      expect(mockRefundCredits).toHaveBeenCalled();

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent?.data.qualityScore).toBe(0);
      expect(completeEvent?.data.creditRefunded).toBe(true);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
    });

    it("should refund credit on generation error", async () => {
      mockGenerateAccountabilityReport.mockRejectedValue(
        new Error("External API timeout")
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<ErrorData>(response);

      expect(mockRefundCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        "Generation failed"
      );

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.data.creditRefunded).toBe(true);
      expect(errorEvent?.data.message).toBe("External API timeout");
    });

    it("should handle non-Error exceptions gracefully", async () => {
      mockGenerateAccountabilityReport.mockRejectedValue("String error");

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<ErrorData>(response);

      expect(mockRefundCredits).toHaveBeenCalled();

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.data.message).toBe("Generation failed");
      expect(errorEvent?.data.creditRefunded).toBe(true);
    });

    it("should always return SSE response even on error (never throw)", async () => {
      mockGenerateAccountabilityReport.mockRejectedValue(
        new Error("Catastrophic failure")
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      // Should not throw
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    });
  });

  describe("SSE Streaming", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
    });

    it("should return correct SSE headers", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.0,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);

      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
      expect(response.headers.get("Connection")).toBe("keep-alive");
    });

    it("should emit agent_started events with correct format", async () => {
      mockGenerateAccountabilityReport.mockImplementation(
        async (
          _target: string,
          _id: string,
          callbacks: { onAgentStarted?: (agent: string) => void }
        ) => {
          callbacks.onAgentStarted?.("research_agent");
          callbacks.onAgentStarted?.("analysis_agent");
          return {
            qualityScore: 8.0,
            profileData: {},
            corruptionScenarios: [],
            actionItems: [],
          };
        }
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<AgentStartedData>(response);

      const agentStartedEvents = events.filter(
        (e) => e.event === "agent_started"
      );
      expect(agentStartedEvents).toHaveLength(2);
      expect(agentStartedEvents[0].data.agent).toBe("research_agent");
      expect(agentStartedEvents[0].data.timestamp).toBeDefined();
      expect(agentStartedEvents[1].data.agent).toBe("analysis_agent");
    });

    it("should emit agent_completed events with duration", async () => {
      mockGenerateAccountabilityReport.mockImplementation(
        async (
          _target: string,
          _id: string,
          callbacks: {
            onAgentCompleted?: (agent: string, duration: number) => void;
          }
        ) => {
          callbacks.onAgentCompleted?.("research_agent", 1500);
          callbacks.onAgentCompleted?.("analysis_agent", 2300);
          return {
            qualityScore: 8.0,
            profileData: {},
            corruptionScenarios: [],
            actionItems: [],
          };
        }
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<AgentCompletedData>(response);

      const agentCompletedEvents = events.filter(
        (e) => e.event === "agent_completed"
      );
      expect(agentCompletedEvents).toHaveLength(2);
      expect(agentCompletedEvents[0].data.agent).toBe("research_agent");
      expect(agentCompletedEvents[0].data.duration).toBe(1500);
      expect(agentCompletedEvents[1].data.duration).toBe(2300);
    });

    it("should emit stage_changed events", async () => {
      mockGenerateAccountabilityReport.mockImplementation(
        async (
          _target: string,
          _id: string,
          callbacks: { onStageChanged?: (stage: string) => void }
        ) => {
          callbacks.onStageChanged?.("research");
          callbacks.onStageChanged?.("analysis");
          callbacks.onStageChanged?.("synthesis");
          return {
            qualityScore: 8.0,
            profileData: {},
            corruptionScenarios: [],
            actionItems: [],
          };
        }
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<StageChangedData>(response);

      const stageEvents = events.filter((e) => e.event === "stage_changed");
      expect(stageEvents).toHaveLength(3);
      expect(stageEvents.map((e) => e.data.stage)).toEqual([
        "research",
        "analysis",
        "synthesis",
      ]);
    });

    it("should emit complete event with all required fields", async () => {
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.8,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream<CompleteData>(response);

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.data).toMatchObject({
        investigationId: "inv-123",
        qualityScore: 7.8,
        creditRefunded: false,
      });
      expect(completeEvent?.data.timestamp).toBeDefined();
    });

    it("should emit events in chronological order", async () => {
      mockGenerateAccountabilityReport.mockImplementation(
        async (
          _target: string,
          _id: string,
          callbacks: {
            onAgentStarted?: (agent: string) => void;
            onAgentCompleted?: (agent: string, duration: number) => void;
            onStageChanged?: (stage: string) => void;
          }
        ) => {
          callbacks.onStageChanged?.("research");
          callbacks.onAgentStarted?.("research_agent");
          callbacks.onAgentCompleted?.("research_agent", 1000);
          callbacks.onStageChanged?.("analysis");
          return {
            qualityScore: 8.0,
            profileData: {},
            corruptionScenarios: [],
            actionItems: [],
          };
        }
      );

      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });

      const response = await POST(request);
      const events = await readSSEStream(response);

      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toEqual([
        "stage_changed",
        "agent_started",
        "agent_completed",
        "stage_changed",
        "complete",
      ]);
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.5,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });
      rateLimitEnabled = true;
      rateLimitCounter = 0;
    });

    it("should allow requests within rate limit", async () => {
      // First 3 requests should succeed
      // Create fresh request for each iteration (body can only be read once)
      for (let i = 0; i < 3; i++) {
        const request = createRequest({
          targetEntity: "Test Entity",
          ethicsAcknowledged: true,
        });
        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it("should return 429 when rate limit exceeded", async () => {
      // Make 3 requests to hit the limit
      // Create fresh request for each iteration (body can only be read once)
      for (let i = 0; i < 3; i++) {
        const request = createRequest({
          targetEntity: "Test Entity",
          ethicsAcknowledged: true,
        });
        await POST(request);
      }

      // 4th request should be rate limited
      const request = createRequest({
        targetEntity: "Test Entity",
        ethicsAcknowledged: true,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Rate limit exceeded");
      expect(response.headers.get("Retry-After")).toBe("3600");
    });
  });
});
