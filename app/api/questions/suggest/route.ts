import { NextRequest, NextResponse } from "next/server";

export interface Suggestion {
  text: string;
  source: "template" | "history" | "ai";
  category?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const suggestions: Suggestion[] = [];

  // TODO US-010: Add template-based suggestions (query question_templates with ILIKE)
  // TODO US-011: Add history-based suggestions (query briefs table)
  // TODO US-012: Add AI-generated suggestions (call Claude Haiku)

  // Limit to 6 results total
  const limitedSuggestions = suggestions.slice(0, 6);

  return NextResponse.json(limitedSuggestions);
}
