/**
 * Accountability Generate API Route Unit Tests
 *
 * Tests for the generation endpoint including credit handling, SSE streaming,
 * quality gate refunds, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

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
        });
      }
      return handler(req, { user: authResult.data.user });
    };
  },
  withRateLimit: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

import { POST } from "@/app/api/accountability/generate/route";

async function readSSEStream(
  response: Response
): Promise<{ event: string; data: object }[]> {
  const events: { event: string; data: object }[] = [];
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
        currentEvent = line.slice(7);
      } else if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        events.push({ event: currentEvent, data });
      }
    }
  }

  return events;
}

describe("Accountability Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateInvestigation.mockResolvedValue({ id: "inv-123" });
    mockDeductCredits.mockResolvedValue(true);
  });

  describe("POST /api/accountability/generate", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when ethicsAcknowledged is false", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: false,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Ethics acknowledgment required");
    });

    it("should return 402 when insufficient credits", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(false);

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe("Insufficient credits");
      expect(data.redirectTo).toBe("/credits");
    });

    it("should deduct credit before generation starts", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 8.0,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      await readSSEStream(response);

      expect(mockDeductCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        expect.stringContaining("Test Entity")
      );
      expect(mockDeductCredits).toHaveBeenCalledBefore(
        mockGenerateAccountabilityReport
      );
    });

    it("should refund credit when quality score < 6.0", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 5.5,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const events = await readSSEStream(response);

      expect(mockRefundCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        "Quality gate failed"
      );

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect((completeEvent?.data as { creditRefunded: boolean }).creditRefunded).toBe(true);
    });

    it("should not refund credit when quality score >= 6.0", async () => {
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

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const events = await readSSEStream(response);

      expect(mockRefundCredits).not.toHaveBeenCalled();

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect((completeEvent?.data as { creditRefunded: boolean }).creditRefunded).toBe(false);
    });

    it("should refund credit on generation error", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockRejectedValue(
        new Error("Generation failed unexpectedly")
      );

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const events = await readSSEStream(response);

      expect(mockRefundCredits).toHaveBeenCalledWith(
        "user-123",
        1,
        "inv-123",
        "Generation failed"
      );

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as { creditRefunded: boolean }).creditRefunded).toBe(true);
      expect((errorEvent?.data as { message: string }).message).toBe(
        "Generation failed unexpectedly"
      );
    });

    it("should send SSE events in proper format", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);

      mockGenerateAccountabilityReport.mockImplementation(
        async (_target: string, _id: string, callbacks: {
          onAgentStarted?: (agent: string) => void;
          onAgentCompleted?: (agent: string, duration: number) => void;
          onStageChanged?: (stage: string) => void;
        }) => {
          callbacks.onAgentStarted?.("research_agent");
          callbacks.onAgentCompleted?.("research_agent", 1500);
          callbacks.onStageChanged?.("analysis");
          return {
            qualityScore: 8.0,
            profileData: {},
            corruptionScenarios: [],
            actionItems: [],
          };
        }
      );

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);
      const events = await readSSEStream(response);

      const agentStartedEvent = events.find((e) => e.event === "agent_started");
      expect(agentStartedEvent).toBeDefined();
      expect((agentStartedEvent?.data as { agent: string }).agent).toBe("research_agent");
      expect((agentStartedEvent?.data as { timestamp: string }).timestamp).toBeDefined();

      const agentCompletedEvent = events.find(
        (e) => e.event === "agent_completed"
      );
      expect(agentCompletedEvent).toBeDefined();
      expect((agentCompletedEvent?.data as { agent: string }).agent).toBe("research_agent");
      expect((agentCompletedEvent?.data as { duration: number }).duration).toBe(1500);

      const stageChangedEvent = events.find((e) => e.event === "stage_changed");
      expect(stageChangedEvent).toBeDefined();
      expect((stageChangedEvent?.data as { stage: string }).stage).toBe("analysis");

      const completeEvent = events.find((e) => e.event === "complete");
      expect(completeEvent).toBeDefined();
      expect((completeEvent?.data as { investigationId: string }).investigationId).toBe("inv-123");
      expect((completeEvent?.data as { qualityScore: number }).qualityScore).toBe(8.0);
    });

    it("should return SSE response with correct headers", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });
      mockHasCredits.mockResolvedValue(true);
      mockGenerateAccountabilityReport.mockResolvedValue({
        qualityScore: 7.0,
        profileData: {},
        corruptionScenarios: [],
        actionItems: [],
      });

      const request = new NextRequest(
        "http://localhost/api/accountability/generate",
        {
          method: "POST",
          body: JSON.stringify({
            targetEntity: "Test Entity",
            ethicsAcknowledged: true,
          }),
        }
      );

      const response = await POST(request);

      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
      expect(response.headers.get("Connection")).toBe("keep-alive");
    });
  });
});
