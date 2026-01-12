/**
 * Brief Layout with Dynamic Social Sharing Metadata
 *
 * Generates Open Graph and Twitter Card metadata for social sharing
 * with dynamic images via /api/og endpoint.
 */

import type { Metadata } from "next";
import { getBriefById } from "@/lib/services/brief-service";

// Sample briefs for static IDs
const sampleBriefs: Record<string, { question: string; clarity_score: number | null; summaries?: Record<string, string> }> = {
  "uk-four-day-week": {
    question: "Would a four-day work week benefit the UK economy?",
    clarity_score: 8.2,
    summaries: { undergrad: "A four-day work week could boost productivity and worker wellbeing, but implementation challenges remain." }
  },
  "what-is-a-state": {
    question: "What is a state?",
    clarity_score: 7.8,
    summaries: { undergrad: "A state is a political entity with defined territory, population, government, and sovereignty." }
  }
};

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;

  let question = "Policy Brief";
  let description = "An AI-powered policy brief that delivers transparent, multi-layered analysis.";
  let clarityScore: number | null = null;
  let usingFallback = false;

  // Check sample briefs first
  if (sampleBriefs[id]) {
    console.log(`[Brief Metadata] Using hardcoded sample brief: ${id}`);
    question = sampleBriefs[id].question;
    clarityScore = sampleBriefs[id].clarity_score;
    const summaries = sampleBriefs[id].summaries;
    if (summaries?.undergrad) {
      description = summaries.undergrad;
    }
  } else {
    // Fetch from database
    console.log(`[Brief Metadata] Fetching brief from database: ${id}`);
    try {
      const result = await getBriefById(id);
      if (result.data) {
        console.log(`[Brief Metadata] Successfully fetched brief: ${result.data.question}`);
        question = result.data.question;
        clarityScore = typeof result.data.clarity_score === 'number' ? result.data.clarity_score : null;
        // Handle both array and object formats for summaries
        const summaries = result.data.summaries;
        if (summaries) {
          let summaryText: string | undefined;
          if (Array.isArray(summaries)) {
            // Array format: ReadingLevelSummary[]
            const undergrad = summaries.find((s: { level: string }) => s.level === "undergrad");
            const teen = summaries.find((s: { level: string }) => s.level === "teen");
            summaryText = undergrad?.content || teen?.content;
          } else if (typeof summaries === "object") {
            // Object format: SummaryOutputs { child, teen, undergrad, postdoc }
            const sumObj = summaries as unknown as { child?: string; teen?: string; undergrad?: string; postdoc?: string };
            summaryText = sumObj.undergrad || sumObj.teen;
          }
          if (summaryText) {
            description = summaryText.slice(0, 200) + (summaryText.length > 200 ? "..." : "");
          } else {
            console.warn(`[Brief Metadata] No suitable summary found for brief ${id}`);
          }
        } else {
          console.warn(`[Brief Metadata] Brief ${id} has no summaries`);
        }
      } else {
        console.error(`[Brief Metadata] Brief ${id} not found in database, using fallback metadata`);
        usingFallback = true;
      }
    } catch (error) {
      console.error(`[Brief Metadata] Error fetching brief ${id} for metadata:`, error);
      if (process.env.NODE_ENV === 'development') {
        console.error('[Brief Metadata] Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly');
      }
      usingFallback = true;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stateofclarity.org";

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.warn('[Brief Metadata] NEXT_PUBLIC_BASE_URL is not set, using default:', baseUrl);
  }

  // Build OG image URL with query params (data fetched server-side, passed to edge function)
  const ogParams = new URLSearchParams();
  ogParams.set("title", question);
  ogParams.set("description", description.slice(0, 150));
  if (clarityScore !== null) {
    ogParams.set("score", String(clarityScore));
  }
  const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  const briefUrl = `${baseUrl}/brief/${id}`;

  console.log(`[Brief Metadata] Generated metadata for brief ${id}:`);
  console.log(`  - Title: ${question}`);
  console.log(`  - Description: ${description.slice(0, 100)}...`);
  console.log(`  - Clarity Score: ${clarityScore}`);
  console.log(`  - OG Image URL: ${ogImageUrl}`);
  console.log(`  - Brief URL: ${briefUrl}`);
  console.log(`  - Using Fallback: ${usingFallback}`);

  return {
    title: `${question} | State of Clarity`,
    description,
    openGraph: {
      title: question,
      description,
      url: briefUrl,
      siteName: "State of Clarity",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: question,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: question,
      description,
      images: [ogImageUrl],
      creator: "@stateofclarity",
    },
    alternates: {
      canonical: briefUrl,
    },
  };
}

export default function BriefLayout({ children }: Props) {
  return children;
}
