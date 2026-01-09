/**
 * Brief Generation SSE Endpoint
 *
 * Server-Sent Events endpoint for real-time agent status updates during brief generation.
 * Streams: agent_started, agent_completed, stage_changed, brief_ready
 */

import { NextRequest } from "next/server";
import { generateBriefWithEvents } from "@/lib/agents/langgraph-orchestrator-streaming";
import { createBrief } from "@/lib/services/brief-service";
import type { GenerationEvent } from "@/lib/types/generation-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let isClientConnected = true;

  try {
    const body = await request.json();
    const { question, userId } = body;

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id: briefId, error: createError } = await createBrief(question, userId);
    if (createError || !briefId) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Failed to create brief" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: GenerationEvent) => {
          if (!isClientConnected) return;
          try {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            console.error("[SSE] Error sending event:", error);
          }
        };

        const sendComment = (comment: string) => {
          if (!isClientConnected) return;
          try {
            controller.enqueue(encoder.encode(`: ${comment}\n\n`));
          } catch (error) {
            console.error("[SSE] Error sending comment:", error);
          }
        };

        sendComment("Connected to brief generation stream");
        sendEvent({
          type: "stage_changed",
          agentName: "",
          timestamp: Date.now(),
          stageName: "initializing",
          metadata: { briefId },
        });

        try {
          await generateBriefWithEvents(question, briefId, {
            onAgentStarted: (agentName: string, stageName: string) => {
              sendEvent({
                type: "agent_started",
                agentName,
                timestamp: Date.now(),
                stageName,
              });
            },
            onAgentCompleted: (agentName: string, stageName: string, durationMs: number) => {
              sendEvent({
                type: "agent_completed",
                agentName,
                timestamp: Date.now(),
                stageName,
                metadata: { durationMs },
              });
            },
            onStageChanged: (stageName: string, activeAgents: string[]) => {
              sendEvent({
                type: "stage_changed",
                agentName: "",
                timestamp: Date.now(),
                stageName,
                metadata: { activeAgents },
              });
            },
            onError: (error: string) => {
              sendEvent({
                type: "error",
                agentName: "",
                timestamp: Date.now(),
                stageName: "error",
                metadata: { error },
              });
            },
          });

          sendEvent({
            type: "brief_ready",
            agentName: "",
            timestamp: Date.now(),
            stageName: "complete",
            metadata: { briefId },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          sendEvent({
            type: "error",
            agentName: "",
            timestamp: Date.now(),
            stageName: "error",
            metadata: { error: errorMessage },
          });
        } finally {
          isClientConnected = false;
          controller.close();
        }
      },
      cancel() {
        isClientConnected = false;
        console.log("[SSE] Client disconnected");
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Brief-Id": briefId,
      },
    });
  } catch (error) {
    console.error("[SSE] Unexpected error:", error);
    isClientConnected = false;
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST to generate a brief",
      example: { question: "What would be the impacts of a 4-day work week in the UK?" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
