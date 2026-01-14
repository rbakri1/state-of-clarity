/**
 * Accountability Investigation Generate API
 *
 * POST /api/accountability/generate - Generate a new investigation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/auth/middleware";

interface GenerateRequestBody {
  targetEntity: string;
  ethicsAcknowledged: boolean;
}

const handler = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as GenerateRequestBody;
  const { targetEntity, ethicsAcknowledged } = body;

  if (!ethicsAcknowledged) {
    return NextResponse.json(
      { error: "Ethics acknowledgment required" },
      { status: 400 }
    );
  }

  if (!targetEntity || typeof targetEntity !== "string" || !targetEntity.trim()) {
    return NextResponse.json(
      { error: "Target entity is required" },
      { status: 400 }
    );
  }

  console.log("Generating investigation for:", targetEntity);

  return NextResponse.json({
    message: "Generation endpoint placeholder",
    userId: user.id,
    targetEntity: targetEntity.trim(),
  });
});

export const POST = withRateLimit(handler, { requests: 3, window: 3600 });
