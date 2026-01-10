import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

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

  // US-010: Add template-based suggestions (query question_templates with ILIKE)
  const supabase = await createServerSupabaseClient();
  const { data: templates } = await supabase
    .from("question_templates")
    .select("question_text, category")
    .ilike("question_text", `%${q}%`)
    .order("display_order")
    .limit(3);

  if (templates && templates.length > 0) {
    for (const template of templates as { question_text: string; category: string }[]) {
      suggestions.push({
        text: template.question_text,
        source: "template",
        category: template.category,
      });
    }
  }

  // US-011: Add history-based suggestions (query briefs table)
  // Only include briefs that exist (treated as published)
  const { data: historyBriefs } = await supabase
    .from("briefs")
    .select("question")
    .ilike("question", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(5); // Fetch more than needed for deduplication

  if (historyBriefs && historyBriefs.length > 0) {
    // Get template texts for deduplication
    const templateTexts = new Set(suggestions.map((s) => s.text.toLowerCase()));
    
    let historyCount = 0;
    for (const brief of historyBriefs as { question: string }[]) {
      // Deduplicate against template results
      if (!templateTexts.has(brief.question.toLowerCase()) && historyCount < 2) {
        suggestions.push({
          text: brief.question,
          source: "history",
        });
        historyCount++;
      }
    }
  }

  // TODO US-012: Add AI-generated suggestions (call Claude Haiku)

  // Limit to 6 results total
  const limitedSuggestions = suggestions.slice(0, 6);

  return NextResponse.json(limitedSuggestions);
}
