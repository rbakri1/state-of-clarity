/**
 * Brief Generation API Route (Streaming)
 * 
 * Generates a policy brief with integrated credit system:
 * 1. Check user has credits before starting
 * 2. Deduct 1 credit at start
 * 3. Run research agent + generate brief (with streaming progress)
 * 4. Evaluate with quality gate
 * 5. Refund credit if quality score < 6.0
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasCredits, deductCredits, refundCredits } from "@/lib/services/credit-service";
import { generateBrief } from "@/lib/agents/langgraph-orchestrator";
import { createBrief } from "@/lib/services/brief-service";
import type { Database } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes - brief generation involves multiple AI calls

const BRIEF_COST = 1;

function createSSEResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export async function POST(request: NextRequest) {
  console.log('[Brief Generate] Starting request...');
  
  // Check required env vars
  const envCheck = {
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasTavilyKey: !!process.env.TAVILY_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  console.log('[Brief Generate] Env check:', envCheck);
  
  if (!envCheck.hasAnthropicKey || !envCheck.hasTavilyKey) {
    console.error('[Brief Generate] Missing API keys!');
    return Response.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[Brief Generate] Authentication failed:', authError);
    return Response.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
    return Response.json(
      { success: false, error: "Question is required" },
      { status: 400 }
    );
  }

  const question = body.question.trim();

  const hasSufficientCredits = await hasCredits(user.id, BRIEF_COST);

  if (!hasSufficientCredits) {
    return Response.json(
      {
        success: false,
        error: "Insufficient credits. Each brief generation costs 1 credit.",
        creditsLink: "/credits",
      },
      { status: 402 }
    );
  }

  // Create SSE stream for progress updates
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial progress
        sendSSE(controller, "progress", { stage: "starting", message: "Initializing..." });

        // Step 1: Create brief record in database to get UUID
        const { id: briefId, error: createError } = await createBrief(question, user.id);

        if (createError || !briefId) {
          console.error('[Brief Generate] Failed to create brief:', createError);
          sendSSE(controller, "error", { 
            success: false, 
            error: "Failed to create brief record. Please try again." 
          });
          controller.close();
          return;
        }

        sendSSE(controller, "progress", { stage: "created", briefId, message: "Brief record created" });

        // Step 2: Deduct credits
        const creditDeducted = await deductCredits(
          user.id,
          BRIEF_COST,
          briefId,
          `Brief generation: "${question.substring(0, 50)}${question.length > 50 ? "..." : ""}"`
        );

        if (!creditDeducted) {
          sendSSE(controller, "error", {
            success: false,
            error: "Failed to deduct credits. Please try again.",
          });
          controller.close();
          return;
        }

        sendSSE(controller, "progress", { stage: "credits_deducted", message: "Credits deducted" });

        // Keep-alive: send heartbeat every 10 seconds during generation
        const heartbeatInterval = setInterval(() => {
          try {
            sendSSE(controller, "heartbeat", { timestamp: Date.now() });
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 10000);

        try {
          // Step 3: Run full brief generation orchestrator
          console.log(`[Brief Generate] Starting full generation for brief ${briefId}`);
          console.log(`[Brief Generate] Using Anthropic key: ${process.env.ANTHROPIC_API_KEY?.slice(0, 10)}...`);
          console.log(`[Brief Generate] Using Tavily key: ${process.env.TAVILY_API_KEY?.slice(0, 10)}...`);
          sendSSE(controller, "progress", { stage: "research", message: "Researching sources..." });
          
          let briefState;
          try {
            briefState = await generateBrief(question, briefId);
            console.log(`[Brief Generate] Generation completed. Error: ${briefState.error || 'none'}`);
            console.log(`[Brief Generate] Completed steps: ${briefState.completedSteps?.join(', ') || 'none'}`);
            console.log(`[Brief Generate] Has sources: ${briefState.sources?.length || 0}`);
            console.log(`[Brief Generate] Has structure: ${!!briefState.structure}`);
            console.log(`[Brief Generate] Has narrative: ${!!briefState.narrative}`);
            console.log(`[Brief Generate] Has summaries: ${Object.keys(briefState.summaries || {}).join(', ') || 'none'}`);
            console.log(`[Brief Generate] Clarity score: ${briefState.clarityScore?.overall || 'none'}`);
          } catch (genErr) {
            console.error(`[Brief Generate] Generation threw error:`, genErr);
            throw genErr;
          }

          clearInterval(heartbeatInterval);

          // Check for generation errors
          if (briefState.error) {
            throw new Error(briefState.error);
          }

          // Step 4: Evaluate quality gate
          const clarityScore = briefState.clarityScore?.overall || 0;

          if (clarityScore < 60) {
            await refundCredits(
              user.id,
              BRIEF_COST,
              briefId,
              `Quality gate failed: clarity score ${clarityScore} < 60`
            );

            sendSSE(controller, "complete", {
              success: false,
              briefId,
              question,
              clarityScore: clarityScore / 10,
              creditRefunded: true,
              error: `Brief quality score (${(clarityScore / 10).toFixed(1)}/10) did not meet minimum threshold of 6.0. Your credit has been refunded.`,
            });
            controller.close();
            return;
          }

          console.log(`[Brief Generate] Successfully generated brief ${briefId} with score ${clarityScore}`);

          sendSSE(controller, "complete", {
            success: true,
            briefId,
            question,
            clarityScore: clarityScore / 10,
            creditRefunded: false,
          });
          controller.close();

        } catch (generationError) {
          clearInterval(heartbeatInterval);
          
          await refundCredits(
            user.id,
            BRIEF_COST,
            briefId,
            `Generation failed: ${generationError instanceof Error ? generationError.message : "Unknown error"}`
          );

          console.error("[Brief Generation] Error:", generationError);

          const errorMessage = generationError instanceof Error ? generationError.message : "";
          const isAIError = errorMessage.toLowerCase().includes("ai service") || 
                           errorMessage.toLowerCase().includes("temporarily unavailable");

          sendSSE(controller, "complete", {
            success: false,
            briefId,
            question,
            creditRefunded: true,
            error: isAIError 
              ? "AI service temporarily unavailable. Please try again in a few moments. Your credit has been refunded."
              : "Brief generation failed. Your credit has been refunded.",
          });
          controller.close();
        }

      } catch (error) {
        console.error("[Brief Generation] Unexpected error:", error);
        sendSSE(controller, "error", { success: false, error: "Internal server error" });
        controller.close();
      }
    },
  });

  return createSSEResponse(stream);
}
