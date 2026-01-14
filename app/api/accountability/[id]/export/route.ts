/**
 * Accountability Investigation Export API
 *
 * GET /api/accountability/[id]/export - Redirect to print page for PDF export
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getInvestigation } from "@/lib/services/accountability-service";

export const GET = withAuth(async (req, { user, params }) => {
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

  const printUrl = new URL(`/accountability/${id}/print`, req.url);
  return NextResponse.redirect(printUrl, 302);
});
