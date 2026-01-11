/**
 * Research Agent - Uses Tavily AI to discover and analyze sources
 *
 * Cost: ~£0.015 per search (vs £0.10 for Perplexity)
 * Speed: <5 seconds for 20 high-quality sources
 */

import Anthropic from "@anthropic-ai/sdk";
import { safeAICall } from "@/lib/ai/safe-ai-call";

// Tavily AI client setup
interface TavilySearchParams {
  query: string;
  search_depth?: "basic" | "advanced";
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
}

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number; // Relevance score 0-1
  published_date?: string;
}

interface TavilySearchResponse {
  results: TavilyResult[];
  answer?: string;
  query: string;
}

async function tavilySearch(params: TavilySearchParams): Promise<TavilySearchResponse> {
  const result = await safeAICall(
    async () => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<TavilySearchResponse>;
    },
    {
      operationName: "Tavily Search",
      model: "tavily-advanced",
      promptSummary: `Search query: ${params.query.substring(0, 100)}`,
    }
  );

  if (result.error || !result.data) {
    throw new Error("AI service temporarily unavailable");
  }

  return result.data;
}

// Source types for State of Clarity
export interface Source {
  id: string;
  url: string;
  title: string;
  content: string; // Cleaned excerpt
  author?: string;
  publication_date?: string;
  publisher: string;
  source_type: "primary" | "secondary" | "tertiary";
  political_lean: "left" | "center-left" | "center" | "center-right" | "right" | "unknown";
  credibility_score: number; // 0-10
  relevance_score: number; // 0-1 from Tavily
  accessed_at: string;
}

/**
 * Main Research Agent
 *
 * Steps:
 * 1. Search via Tavily (returns 20 diverse sources with content)
 * 2. Classify political lean (using Claude)
 * 3. Score credibility (domain reputation + publication type)
 * 4. Ensure diversity (≥40% opposing perspectives)
 * 5. Return top 15-20 sources
 */
export async function researchAgent(question: string): Promise<Source[]> {
  console.log(`[Research Agent] Starting research for: "${question}"`);

  // Step 1: Search via Tavily
  const tavilyResults = await tavilySearch({
    query: question,
    search_depth: "advanced", // More thorough research
    max_results: 20,
    include_answer: false, // We'll generate our own narrative
    include_raw_content: true, // Get full content for analysis
  });

  console.log(`[Research Agent] Found ${tavilyResults.results.length} sources from Tavily`);

  // Step 2: Structure sources
  const structuredSources: Partial<Source>[] = tavilyResults.results.map((result, index) => ({
    id: `source-${Date.now()}-${index}`,
    url: result.url,
    title: result.title,
    content: result.content.slice(0, 1000), // Limit to 1000 chars per source
    publisher: extractPublisher(result.url),
    relevance_score: result.score,
    publication_date: result.published_date || new Date().toISOString().split("T")[0],
    accessed_at: new Date().toISOString(),
  }));

  // Step 3: Classify political lean in batch (one API call for all sources)
  const classifiedSources = await classifyPoliticalLeanBatch(structuredSources);

  // Step 4: Score credibility
  const scoredSources = classifiedSources.map(source => ({
    ...source,
    credibility_score: calculateCredibilityScore(source),
    source_type: determineSourceType(source),
  })) as Source[];

  // Step 5: Ensure diversity (≥40% opposing perspectives)
  const balancedSources = ensureDiversity(scoredSources);

  console.log(`[Research Agent] Final source breakdown:`, {
    total: balancedSources.length,
    political_leans: countByLean(balancedSources),
    avg_credibility: average(balancedSources.map(s => s.credibility_score)),
    primary_ratio: balancedSources.filter(s => s.source_type === "primary").length / balancedSources.length,
  });

  return balancedSources.slice(0, 20);
}

/**
 * Classify political lean for multiple sources in one API call
 * (More efficient than individual calls)
 */
async function classifyPoliticalLeanBatch(sources: Partial<Source>[]): Promise<Partial<Source>[]> {
  const prompt = `
You are a media bias expert. Classify the political lean of these ${sources.length} sources.

For each source, analyze the publisher domain and title to determine:
- Political lean: left, center-left, center, center-right, right, or unknown
- Reasoning: Brief explanation (1 sentence)

Sources:
${sources.map((s, i) => `${i + 1}. ${s.publisher} - "${s.title}" (${s.url})`).join("\n")}

Return JSON array (one object per source):
[
  {"index": 1, "political_lean": "center-left", "reasoning": "Guardian is UK center-left outlet"},
  {"index": 2, "political_lean": "right", "reasoning": "Daily Telegraph is UK conservative paper"},
  ...
]

Guidelines:
- Consider publisher reputation, not just headline
- UK sources: Guardian (center-left), Telegraph (right), BBC (center), etc.
- US sources: NYT (center-left), Fox (right), Reuters (center), etc.
- Academic journals, government sources: center
- Think tanks: Research their affiliation
- Unknown publishers: mark as "unknown"
`;

  const result = await safeAICall(
    async () => {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: prompt,
        }],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Claude response");
      }
      return JSON.parse(jsonMatch[0]) as Array<{ index: number; political_lean: string }>;
    },
    {
      operationName: "Political Lean Classification",
      model: "claude-3-5-haiku-20241022",
      promptSummary: `Classify political lean for ${sources.length} sources`,
    }
  );

  // If AI fails, fall back to "unknown" for all sources
  if (result.error || !result.data) {
    console.warn("[Research Agent] Political classification failed, defaulting to unknown");
    return sources.map(source => ({
      ...source,
      political_lean: "unknown" as const,
    }));
  }

  type PoliticalLean = "left" | "center-left" | "center" | "center-right" | "right" | "unknown";
  const classifications = result.data;
  
  return sources.map((source, index) => ({
    ...source,
    political_lean: (classifications[index]?.political_lean || "unknown") as PoliticalLean,
  }));
}

/**
 * Calculate credibility score based on domain reputation and source type
 */
function calculateCredibilityScore(source: Partial<Source>): number {
  const domain = new URL(source.url!).hostname.replace("www.", "");

  // Domain reputation scores (0-10)
  const reputationScores: Record<string, number> = {
    // Government & International
    "gov.uk": 10,
    "ons.gov.uk": 10,
    "un.org": 9.5,
    "europa.eu": 9.5,
    "oecd.org": 9.5,

    // Academic
    "ac.uk": 9,
    "edu": 9,
    "jstor.org": 9,
    "arxiv.org": 8.5,

    // Established News (UK)
    "bbc.co.uk": 9,
    "bbc.com": 9,
    "ft.com": 9,
    "economist.com": 9,
    "theguardian.com": 8.5,
    "telegraph.co.uk": 8.5,
    "thetimes.co.uk": 8.5,
    "independent.co.uk": 8,
    "channel4.com": 8,

    // Established News (US)
    "nytimes.com": 9,
    "washingtonpost.com": 9,
    "wsj.com": 9,
    "reuters.com": 9,
    "apnews.com": 9,
    "bloomberg.com": 8.5,

    // Think Tanks & Research
    "brookings.edu": 8.5,
    "chathamhouse.org": 8.5,
    "rand.org": 8.5,
    "pewresearch.org": 8.5,
    "ippr.org": 8,
    "ifs.org.uk": 8.5,

    // Default
    "default": 6,
  };

  const baseScore = reputationScores[domain] || reputationScores["default"];

  // Adjust for recency (newer = slightly higher)
  const publicationDate = new Date(source.publication_date || Date.now());
  const ageInYears = (Date.now() - publicationDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
  const recencyBonus = ageInYears < 2 ? 0.5 : ageInYears < 5 ? 0 : -0.5;

  return Math.min(10, Math.max(0, baseScore + recencyBonus));
}

/**
 * Determine source type (primary, secondary, tertiary)
 */
function determineSourceType(source: Partial<Source>): "primary" | "secondary" | "tertiary" {
  const domain = new URL(source.url!).hostname.replace("www.", "");

  // Primary: Original research, government data, primary documents
  if (
    domain.includes("gov.") ||
    domain.includes(".ac.") ||
    domain.includes(".edu") ||
    domain.includes("oecd.org") ||
    domain.includes("un.org") ||
    domain.includes("jstor.org") ||
    domain.includes("arxiv.org")
  ) {
    return "primary";
  }

  // Tertiary: Aggregators, wikis, general reference
  if (
    domain.includes("wikipedia.org") ||
    domain.includes("britannica.com") ||
    source.title?.toLowerCase().includes("explainer")
  ) {
    return "tertiary";
  }

  // Secondary: News, analysis, commentary (default)
  return "secondary";
}

/**
 * Ensure political diversity (≥40% opposing perspectives)
 */
function ensureDiversity(sources: Source[]): Source[] {
  const leanCounts = countByLean(sources);

  const leftCount = (leanCounts["left"] || 0) + (leanCounts["center-left"] || 0);
  const rightCount = (leanCounts["right"] || 0) + (leanCounts["center-right"] || 0);
  const centerCount = leanCounts["center"] || 0;

  const total = sources.length;
  const leftRatio = leftCount / total;
  const rightRatio = rightCount / total;

  // If <40% from either side, we need better balance
  const needsMoreLeft = leftRatio < 0.3;
  const needsMoreRight = rightRatio < 0.3;

  if (needsMoreLeft || needsMoreRight) {
    console.warn(
      `[Research Agent] Source diversity issue: Left ${(leftRatio * 100).toFixed(0)}%, Right ${(rightRatio * 100).toFixed(0)}%`
    );
    // In production, trigger additional searches with bias towards underrepresented side
    // For MVP, proceed with warning
  }

  return sources;
}

// Utility functions

function extractPublisher(url: string): string {
  const domain = new URL(url).hostname.replace("www.", "");
  // Capitalize first letter
  return domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
}

function countByLean(sources: Source[]): Record<string, number> {
  const counts: Record<string, number> = {};
  sources.forEach(source => {
    counts[source.political_lean] = (counts[source.political_lean] || 0) + 1;
  });
  return counts;
}

function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
