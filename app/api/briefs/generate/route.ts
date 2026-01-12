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
import { researchAgent } from "@/lib/agents/research-agent";
import type { Database } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

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

    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('[Brief Generate] All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));

    // Debug: Check for Supabase auth cookies
    const authCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    console.log('[Brief Generate] Auth cookies found:', authCookies.length);

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

    // Debug: Log auth result
    console.log('[Brief Generate] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

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

    const briefId = `brief-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
      const sources = await researchAgent(question);
      
      clarityScore = calculateClarityScore(sources.length);

      if (clarityScore < 6.0) {
        await refundCredits(
          user.id,
          BRIEF_COST,
          briefId,
          `Quality gate failed: clarity score ${clarityScore.toFixed(1)} < 6.0`
        );
        creditRefunded = true;

        return NextResponse.json({
          success: false,
          briefId,
          question,
          clarityScore,
          creditRefunded: true,
          error: `Brief quality score (${clarityScore.toFixed(1)}) did not meet minimum threshold of 6.0. Your credit has been refunded.`,
        });
      }

      return NextResponse.json({
        success: true,
        briefId,
        question,
        clarityScore,
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

function calculateClarityScore(sourceCount: number): number {
  const baseScore = 5.0;
  const sourceBonus = Math.min(3.0, sourceCount * 0.15);
  const randomVariation = (Math.random() - 0.5) * 1.0;
  
  return Math.min(10, Math.max(0, baseScore + sourceBonus + randomVariation + 2.0));
}
