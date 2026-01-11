/**
 * Brief API Route
 *
 * GET: Fetch a brief by ID with HTTP caching
 * - Returns brief data from server cache (Vercel KV)
 * - Sets Cache-Control headers for CDN/browser caching
 * - Supports ETag for conditional requests (304 Not Modified)
 */

import { NextRequest, NextResponse } from "next/server";
import { getBriefById, type BriefRecord } from "@/lib/services/brief-service";

function generateETag(brief: BriefRecord): string {
  const timestamp = new Date(brief.updated_at).getTime();
  return `"brief-${brief.id}-${timestamp}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: briefId } = await params;

  const result = await getBriefById(briefId);

  if (result.error) {
    console.error(`[API] Error fetching brief ${briefId}:`, result.error.message);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
      { status: 500 }
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { error: "Brief not found" },
      { status: 404 }
    );
  }

  const brief = result.data;
  const etag = generateETag(brief);

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  return NextResponse.json(brief, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      ETag: etag,
    },
  });
}
