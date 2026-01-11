import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import Anthropic from "@anthropic-ai/sdk";

export interface Suggestion {
  text: string;
  source: "template" | "history" | "ai";
  category?: string;
}

// US-013: Cache for AI suggestions with TTL
interface CacheEntry {
  suggestions: Suggestion[];
  expiresAt: number;
}

const aiSuggestionsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

function getCachedSuggestions(query: string): Suggestion[] | null {
  const key = normalizeQuery(query);
  const entry = aiSuggestionsCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expiresAt) {
    aiSuggestionsCache.delete(key);
    return null;
  }
  
  return entry.suggestions;
}

function setCachedSuggestions(query: string, suggestions: Suggestion[]): void {
  const key = normalizeQuery(query);
  aiSuggestionsCache.set(key, {
    suggestions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function generateAiSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Generate 2 well-formed policy questions related to "${query}".

Requirements:
- Questions should be specific, clear, and answerable with factual policy information
- Focus on UK public policy, government, or current affairs
- Each question should be a complete sentence ending with a question mark
- Questions should be different from each other

Return ONLY a JSON array of 2 strings, nothing else:
["question 1?", "question 2?"]`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const questions = JSON.parse(jsonMatch[0]) as string[];
    return questions.slice(0, 2).map((text) => ({
      text,
      source: "ai" as const,
    }));
  } catch (error) {
    console.error("[AI Suggestions] Failed to generate:", error);
    return [];
  }
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
    for (const template of templates as {
      question_text: string;
      category: string;
    }[]) {
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

  // US-012: Add AI-generated suggestions if template + history < 4
  // US-013: Check cache before calling AI
  if (suggestions.length < 4) {
    const cachedAiSuggestions = getCachedSuggestions(q);
    if (cachedAiSuggestions !== null) {
      suggestions.push(...cachedAiSuggestions);
    } else {
      const aiSuggestions = await generateAiSuggestions(q);
      if (aiSuggestions.length > 0) {
        setCachedSuggestions(q, aiSuggestions);
      }
      suggestions.push(...aiSuggestions);
    }
  }

  // Limit to 6 results total
  const limitedSuggestions = suggestions.slice(0, 6);

  return NextResponse.json(limitedSuggestions);
}
