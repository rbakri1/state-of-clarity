/**
 * Dynamic Open Graph Image Generation
 *
 * Generates social sharing images for briefs with:
 * - Brief question as title
 * - Clarity score badge
 * - State of Clarity branding
 *
 * Usage: /api/og?title=...&description=...&score=...
 * The layout.tsx passes these params when generating metadata
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get data from query params (passed by layout.tsx metadata)
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    const score = searchParams.get("score");

    console.log('[OG Image] Generating image with params:', {
      hasTitle: !!title,
      hasDescription: !!description,
      score,
    });

    const question = title ? decodeURIComponent(title) : "State of Clarity";
    const summary = description ? decodeURIComponent(description) : "See politics clearly. Decide wisely.";
    const clarityScore = score ? parseFloat(score) : null;
    const hasBrief = !!title;

    // Validate score if provided
    if (score && (isNaN(parseFloat(score)) || parseFloat(score) < 0 || parseFloat(score) > 100)) {
      console.warn('[OG Image] Invalid clarity score provided:', score);
    }

  // Normalize clarity score for display
  const displayScore = clarityScore !== null
    ? (clarityScore > 10 ? (clarityScore / 10).toFixed(1) : clarityScore.toFixed(1))
    : null;

  // Get score color
  const getScoreColor = (scoreVal: number | null) => {
    if (scoreVal === null) return "#6B7280";
    const normalized = scoreVal > 10 ? scoreVal / 10 : scoreVal;
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
              fontSize: hasBrief ? "56px" : "64px",
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
          {hasBrief && (
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
  } catch (error) {
    console.error('[OG Image] Error generating image:', error);

    // Return a simple fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F7F6F3",
            padding: "60px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#1C1C1C",
              textAlign: "center",
            }}
          >
            State of Clarity
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#6B7280",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            See politics clearly. Decide wisely.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
