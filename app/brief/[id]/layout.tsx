/**
 * Brief Layout with Dynamic Social Sharing Metadata
 *
 * Generates Open Graph and Twitter Card metadata for social sharing
 * with dynamic images via /api/og endpoint.
 */

import type { Metadata } from "next";
import { getBriefById } from "@/lib/services/brief-service";

// Import sample briefs for friendly ID mapping
import briefUK4Day from "@/sample-briefs/uk-four-day-week.json";
import briefWhatIsState from "@/sample-briefs/what-is-a-state.json";
import briefMedicareForAll from "@/sample-briefs/medicare-for-all.json";
import briefUKBanConversion from "@/sample-briefs/uk-ban-conversion-therapy.json";
import briefUKMandatoryVoting from "@/sample-briefs/uk-mandatory-voting.json";
import briefUKRentControls from "@/sample-briefs/uk-rent-controls.json";
import briefUKScotlandIndependence from "@/sample-briefs/uk-scotland-independence-economics.json";

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

  // Check for hardcoded sample briefs first (matches page.tsx mapping)
  const sampleBriefs: { [key: string]: any } = {
    "uk-four-day-week": briefUK4Day,
    "brief-001-uk-4day-week": briefUK4Day,
    "what-is-a-state": briefWhatIsState,
    "brief-002-what-is-a-state": briefWhatIsState,
    "medicare-for-all": briefMedicareForAll,
    "brief-008-medicare-for-all": briefMedicareForAll,
    "uk-ban-conversion-therapy": briefUKBanConversion,
    "uk-mandatory-voting": briefUKMandatoryVoting,
    "uk-rent-controls": briefUKRentControls,
    "uk-scotland-independence-economics": briefUKScotlandIndependence,
  };

  if (sampleBriefs[id]) {
    // Use hardcoded sample brief
    console.log(`[Brief Metadata] Using sample brief: ${id}`);
    const brief = sampleBriefs[id];
    question = brief.question;
    clarityScore = brief.clarity_score;

    // Extract summary from summaries object
    if (brief.summaries?.undergrad) {
      description = brief.summaries.undergrad;
    } else if (brief.summaries?.teen) {
      description = brief.summaries.teen;
    }
  } else {
    // Fetch from database for UUID-based briefs
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
