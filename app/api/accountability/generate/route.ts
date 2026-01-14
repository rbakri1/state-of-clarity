/**
 * Accountability Investigation Generate API
 *
 * POST /api/accountability/generate - Generate a new investigation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/auth/middleware";
import { hasCredits, deductCredits, refundCredits } from "@/lib/services/credit-service";
import { createInvestigation } from "@/lib/services/accountability-service";
import { createSSEResponse, sendSSE } from "@/lib/api/sse-helpers";
import { generateAccountabilityReport } from "@/lib/agents/accountability-tracker-orchestrator";

interface GenerateRequestBody {
  targetEntity: string;
  ethicsAcknowledged: boolean;
}

const handler = withAuth(async (req: NextRequest, { user }) => {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch (e) {
    console.error("Failed to parse request body:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const { targetEntity, ethicsAcknowledged } = body;

  if (!ethicsAcknowledged) {
    return NextResponse.json(
      { error: "Ethics acknowledgment required" },
      { status: 400 }
    );
  }

  if (!targetEntity || typeof targetEntity !== "string" || !targetEntity.trim()) {
    return NextResponse.json(
      { error: "Target entity is required" },
      { status: 400 }
    );
  }

  const userHasCredits = await hasCredits(user.id, 1);
  if (!userHasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", redirectTo: "/credits" },
      { status: 402 }
    );
  }

  console.log("[Accountability] Starting generation for:", targetEntity, "user:", user.id);

  let investigationId: string;
  try {
    const result = await createInvestigation(
      targetEntity.trim(),
      user.id,
      "individual",
      new Date()
    );
    investigationId = result.id;
    console.log("[Accountability] Created investigation:", investigationId);
  } catch (error) {
    console.error("[Accountability] Failed to create investigation:", error);
    return NextResponse.json(
      { error: `Failed to create investigation: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  try {
    await deductCredits(
      user.id,
      1,
      investigationId,
      `Accountability investigation: ${targetEntity.trim()}`
    );
    console.log("[Accountability] Credit deducted for investigation:", investigationId);
  } catch (error) {
    console.error("[Accountability] Failed to deduct credits:", error);
    return NextResponse.json(
      { error: `Failed to deduct credits: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendSSE(controller, "started", {
          investigationId,
          timestamp: new Date().toISOString(),
        });

        const result = await generateAccountabilityReport(
          targetEntity.trim(),
          investigationId,
          {
            onAgentStarted: (agent: string) => {
              sendSSE(controller, "agent_started", {
                agent,
                timestamp: new Date().toISOString(),
              });
            },
            onAgentCompleted: (agent: string, duration: number) => {
              sendSSE(controller, "agent_completed", {
                agent,
                duration,
                timestamp: new Date().toISOString(),
              });
            },
            onStageChanged: (stage: string) => {
              sendSSE(controller, "stage_changed", {
                stage,
                timestamp: new Date().toISOString(),
              });
            },
          }
        );

        const qualityScore = result.qualityScore ?? 0;
        let creditRefunded = false;

        if (qualityScore < 6.0) {
          await refundCredits(user.id, 1, investigationId, "Quality gate failed");
          creditRefunded = true;
          console.log("Credit refunded - quality gate failed:", qualityScore);
        }

        sendSSE(controller, "complete", {
          investigationId,
          qualityScore,
          creditRefunded,
          timestamp: new Date().toISOString(),
        });

        controller.close();
      } catch (error) {
        console.error("Generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Generation failed";

        try {
          await refundCredits(user.id, 1, investigationId, "Generation failed");
        } catch (refundError) {
          console.error("Failed to refund credits:", refundError);
        }

        sendSSE(controller, "error", {
          message: errorMessage,
          creditRefunded: true,
          timestamp: new Date().toISOString(),
        });

        controller.close();
      }
    },
  });

  return createSSEResponse(stream);
});

export const POST = withRateLimit(handler, { requests: 3, window: 3600 });
