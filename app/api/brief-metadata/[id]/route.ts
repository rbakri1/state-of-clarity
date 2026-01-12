/**
 * Brief Metadata Debug Endpoint
 *
 * GET /api/brief-metadata/[id]
 *
 * Returns the metadata that would be generated for a specific brief.
 * Useful for debugging social sharing issues without needing to actually share the URL.
 *
 * Response includes:
 * - OpenGraph tags (title, description, image URL)
 * - Twitter card tags
 * - Canonical URL
 * - Error details if brief fetch fails
 */

import { NextRequest, NextResponse } from "next/server";
import { getBriefById } from "@/lib/services/brief-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const response: any = {
    briefId: id,
    timestamp: new Date().toISOString(),
    metadata: null,
    error: null,
    warnings: []
  };

  let question = "Policy Brief";
  let description = "An AI-powered policy brief that delivers transparent, multi-layered analysis.";
  let clarityScore: number | null = null;
  let usingFallback = false;
  let source: "database" | "fallback" = "fallback";

  // Fetch from database (works for both sample briefs and user-generated briefs)
  try {
    const result = await getBriefById(id);
    if (result.data) {
      source = "database";
      question = result.data.question;
      clarityScore = typeof result.data.clarity_score === 'number' ? result.data.clarity_score : null;

      // Handle both array and object formats for summaries
      const summaries = result.data.summaries;
      if (summaries) {
        let summaryText: string | undefined;
        if (Array.isArray(summaries)) {
          const undergrad = summaries.find((s: { level: string }) => s.level === "undergrad");
          const teen = summaries.find((s: { level: string }) => s.level === "teen");
          summaryText = undergrad?.content || teen?.content;
        } else if (typeof summaries === "object") {
          const sumObj = summaries as unknown as { child?: string; teen?: string; undergrad?: string; postdoc?: string };
          summaryText = sumObj.undergrad || sumObj.teen;
        }
        if (summaryText) {
          description = summaryText.slice(0, 200) + (summaryText.length > 200 ? "..." : "");
        } else {
          response.warnings.push("No suitable summary found for brief");
        }
      } else {
        response.warnings.push("Brief has no summaries");
      }
    } else {
      response.error = `Brief ${id} not found in database`;
      usingFallback = true;
    }
  } catch (error) {
    response.error = error instanceof Error ? error.message : String(error);
    response.warnings.push("Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly");
    usingFallback = true;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stateofclarity.org";

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    response.warnings.push("NEXT_PUBLIC_BASE_URL is not set, using default: " + baseUrl);
  }

  // Build OG image URL
  const ogParams = new URLSearchParams();
  ogParams.set("title", question);
  ogParams.set("description", description.slice(0, 150));
  if (clarityScore !== null) {
    ogParams.set("score", String(clarityScore));
  }
  const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  const briefUrl = `${baseUrl}/brief/${id}`;

  response.metadata = {
    source,
    usingFallback,
    html: {
      title: `${question} | State of Clarity`,
      description,
    },
    openGraph: {
      title: question,
      description,
      url: briefUrl,
      siteName: "State of Clarity",
      image: {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: question,
      },
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: question,
      description,
      image: ogImageUrl,
      creator: "@stateofclarity",
    },
    canonical: briefUrl,
    clarityScore,
  };

  // Test if OG image URL is accessible (basic check)
  response.ogImageCheck = {
    url: ogImageUrl,
    urlEncoded: ogParams.toString().includes("%") ? "URL contains encoded characters (normal for special characters)" : "URL uses plain ASCII",
  };

  return NextResponse.json(response, {
    status: response.error && usingFallback ? 404 : 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}
