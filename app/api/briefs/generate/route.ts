/**
 * Brief Generation API Route
 * 
 * Generates a policy brief with integrated credit system:
 * 1. Check user has credits before starting
 * 2. Deduct 1 credit at start
 * 3. Run research agent + generate brief
 * 4. Evaluate with quality gate
 * 5. Refund credit if quality score < 6.0
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasCredits, deductCredits, refundCredits } from "@/lib/services/credit-service";
import { generateBrief } from "@/lib/agents/langgraph-orchestrator";
import { createBrief } from "@/lib/services/brief-service";
import type { Database } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes - brief generation involves multiple AI calls

const BRIEF_COST = 1;

interface GenerateBriefRequest {
  question: string;
}

interface GenerateBriefResponse {
  success: boolean;
  briefId?: string;
  question?: string;
  clarityScore?: number;
  creditRefunded?: boolean;
  error?: string;
  creditsLink?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateBriefResponse>> {
  try {
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
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: GenerateBriefRequest = await request.json();

    if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    const question = body.question.trim();

    const hasSufficientCredits = await hasCredits(user.id, BRIEF_COST);

    if (!hasSufficientCredits) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient credits. Each brief generation costs 1 credit.",
          creditsLink: "/credits",
        },
        { status: 402 }
      );
    }

    // Step 1: Create brief record in database to get UUID
    const { id: briefId, error: createError } = await createBrief(question, user.id);

    if (createError || !briefId) {
      console.error('[Brief Generate] Failed to create brief:', createError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create brief record. Please try again.",
        },
        { status: 500 }
      );
    }

    // Step 2: Deduct credits
    const creditDeducted = await deductCredits(
      user.id,
      BRIEF_COST,
      briefId,
      `Brief generation: "${question.substring(0, 50)}${question.length > 50 ? "..." : ""}"`
    );

    if (!creditDeducted) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to deduct credits. Please try again.",
        },
        { status: 500 }
      );
    }

    let clarityScore = 0;
    let creditRefunded = false;

    try {
      // Step 3: Run full brief generation orchestrator
      console.log(`[Brief Generate] Starting full generation for brief ${briefId}`);
      const briefState = await generateBrief(question, briefId);

      // Check for generation errors
      if (briefState.error) {
        throw new Error(briefState.error);
      }

      // Step 4: Evaluate quality gate
      clarityScore = briefState.clarityScore?.overall || 0;

      if (clarityScore < 60) {
        await refundCredits(
          user.id,
          BRIEF_COST,
          briefId,
          `Quality gate failed: clarity score ${clarityScore} < 60`
        );
        creditRefunded = true;

        return NextResponse.json({
          success: false,
          briefId,
          question,
          clarityScore: clarityScore / 10, // Convert to 0-10 scale for display
          creditRefunded: true,
          error: `Brief quality score (${(clarityScore / 10).toFixed(1)}/10) did not meet minimum threshold of 6.0. Your credit has been refunded.`,
        });
      }

      console.log(`[Brief Generate] Successfully generated brief ${briefId} with score ${clarityScore}`);

      return NextResponse.json({
        success: true,
        briefId,
        question,
        clarityScore: clarityScore / 10, // Convert to 0-10 scale for display
        creditRefunded: false,
      });

    } catch (generationError) {
      await refundCredits(
        user.id,
        BRIEF_COST,
        briefId,
        `Generation failed: ${generationError instanceof Error ? generationError.message : "Unknown error"}`
      );

      console.error("[Brief Generation] Error:", generationError);

      // Check if this is an AI service error
      const errorMessage = generationError instanceof Error ? generationError.message : "";
      const isAIError = errorMessage.toLowerCase().includes("ai service") || 
                        errorMessage.toLowerCase().includes("temporarily unavailable");

      return NextResponse.json({
        success: false,
        briefId,
        question,
        creditRefunded: true,
        error: isAIError 
          ? "AI service temporarily unavailable. Please try again in a few moments. Your credit has been refunded."
          : "Brief generation failed. Your credit has been refunded.",
      });
    }

  } catch (error) {
    console.error("[Brief Generation] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
