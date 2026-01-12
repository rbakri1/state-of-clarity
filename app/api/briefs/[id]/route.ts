/**
 * Brief Fetch API Route
 *
 * GET /api/briefs/[id] - Fetches a brief by ID from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { getBriefById } from "@/lib/services/brief-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Brief ID is required" },
        { status: 400 }
      );
    }

    // Fetch brief from database
    const result = await getBriefById(id);

    if (result.error) {
      console.error('[Brief Fetch] Error fetching brief:', result.error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch brief" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: "Brief not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      brief: result.data,
    });

  } catch (error) {
    console.error("[Brief Fetch] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
