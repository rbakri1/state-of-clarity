/**
 * Dynamic Open Graph Image Generation
 *
 * Generates social sharing images for briefs with:
 * - Brief question as title
 * - Clarity score badge
 * - State of Clarity branding
 *
 * Usage: /api/og?id=<brief-id>
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getBriefById } from "@/lib/services/brief-service";

export const runtime = "edge";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  let question = "State of Clarity";
  let clarityScore: number | null = null;
  let summary = "See politics clearly. Decide wisely.";

  if (id) {
    // Check sample briefs first
    if (sampleBriefs[id]) {
      question = sampleBriefs[id].question;
      clarityScore = sampleBriefs[id].clarity_score;
      summary = sampleBriefs[id].summaries?.undergrad || summary;
    } else {
      // Fetch from database
      try {
        const result = await getBriefById(id);
        if (result.data) {
          question = result.data.question;
          clarityScore = result.data.clarity_score;
          // Get summary excerpt - handle both array and object formats
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
              summary = summaryText.slice(0, 150) + (summaryText.length > 150 ? "..." : "");
            }
          }
        }
      } catch (error) {
        console.error("[OG Image] Error fetching brief:", error);
      }
    }
  }

  // Normalize clarity score for display
  const displayScore = clarityScore !== null
    ? (clarityScore > 10 ? (clarityScore / 10).toFixed(1) : clarityScore.toFixed(1))
    : null;

  // Get score color
  const getScoreColor = (score: number | null) => {
    if (score === null) return "#6B7280";
    const normalized = score > 10 ? score / 10 : score;
    if (normalized >= 8) return "#059669"; // green
    if (normalized >= 6) return "#D97706"; // amber
    return "#DC2626"; // red
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7F6F3", // ivory-100
          padding: "60px",
        }}
      >
        {/* Header with logo and score */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#5D7052", // sage-500
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F7F6F3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#1C1C1C", // ink-800
              }}
            >
              State of Clarity
            </span>
          </div>

          {/* Clarity Score Badge */}
          {displayScore && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "9999px",
                backgroundColor: getScoreColor(clarityScore) + "20",
                color: getScoreColor(clarityScore),
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
              </svg>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                {displayScore}/10
              </span>
            </div>
          )}
        </div>

        {/* Question */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: id ? "56px" : "64px",
              fontWeight: 700,
              color: "#1C1C1C",
              lineHeight: 1.2,
              margin: 0,
              marginBottom: "24px",
            }}
          >
            {question}
          </h1>

          {/* Summary excerpt */}
          {id && (
            <p
              style={{
                fontSize: "24px",
                color: "#4A4A4A",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {summary}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #E5E4E0",
            paddingTop: "24px",
            marginTop: "40px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: "#6B7280",
            }}
          >
            stateofclarity.org
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#5D7052",
              fontWeight: 500,
            }}
          >
            See politics clearly. Decide wisely.
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
