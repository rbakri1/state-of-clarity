/**
 * Accountability Investigation Fetch API
 *
 * GET /api/accountability/[id] - Fetch a single investigation by ID
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import {
  getInvestigation,
  getInvestigationSources,
} from "@/lib/services/accountability-service";

export const GET = withAuth(async (_req, { user, params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id as string;

  const investigation = await getInvestigation(id);

  if (!investigation) {
    return NextResponse.json(
      { error: "Investigation not found" },
      { status: 404 }
    );
  }

  if (investigation.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const sources = await getInvestigationSources(id);

  return NextResponse.json({
    investigation: {
      ...investigation,
      sources,
    },
  });
});
