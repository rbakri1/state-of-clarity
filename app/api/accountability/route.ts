/**
 * Accountability Investigations List API
 *
 * GET /api/accountability - List user's investigation history
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { listUserInvestigations } from "@/lib/services/accountability-service";

export const GET = withAuth(async (_req, { user }) => {
  const investigations = await listUserInvestigations(user.id, 50);

  return NextResponse.json({ investigations });
});
