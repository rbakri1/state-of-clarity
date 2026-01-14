/**
 * Parliament Register of Interests Parser
 *
 * Searches the UK Parliament Register of Members' Interests via Tavily.
 * Returns structured interest declarations and investigation sources.
 */

import type { InterestDeclaration, InvestigationSource } from "../types/accountability";
import { safeAICall } from "@/lib/ai/safe-ai-call";

interface TavilySearchParams {
  query: string;
  search_depth?: "basic" | "advanced";
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_domains?: string[];
}

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilySearchResponse {
  results: TavilyResult[];
  answer?: string;
  query: string;
}

/**
 * Search Tavily API for Parliament data.
 */
async function tavilySearch(params: TavilySearchParams): Promise<TavilySearchResponse> {
  const result = await safeAICall(
    async () => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
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
      operationName: "Tavily Parliament Search",
      model: "tavily-advanced",
      promptSummary: `Parliament search: ${params.query.substring(0, 100)}`,
    }
  );

  if (result.error || !result.data) {
    return { results: [], query: params.query };
  }

  return result.data;
}

type InterestCategory = "Employment" | "Donations" | "Land" | "Shareholdings" | "Other";

/**
 * Extract interest categories from content.
 * Categories: Employment, Donations, Land, Shareholdings
 *
 * @param content - The search result content
 * @returns Array of detected interest categories
 */
function extractCategories(content: string): InterestCategory[] {
  const categories: InterestCategory[] = [];
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("employment") ||
    lowerContent.includes("occupation") ||
    lowerContent.includes("remunerated")
  ) {
    categories.push("Employment");
  }

  if (
    lowerContent.includes("donation") ||
    lowerContent.includes("gift") ||
    lowerContent.includes("benefit")
  ) {
    categories.push("Donations");
  }

  if (
    lowerContent.includes("land") ||
    lowerContent.includes("property") ||
    lowerContent.includes("estate")
  ) {
    categories.push("Land");
  }

  if (
    lowerContent.includes("shareholding") ||
    lowerContent.includes("shares") ||
    lowerContent.includes("stake") ||
    lowerContent.includes("equity")
  ) {
    categories.push("Shareholdings");
  }

  if (categories.length === 0) {
    categories.push("Other");
  }

  return categories;
}

/**
 * Extract monetary value from content if present.
 *
 * @param content - The search result content
 * @returns Value string or undefined
 */
function extractValue(content: string): string | undefined {
  const valueMatch = content.match(/£[\d,]+(?:\.\d{2})?/);
  if (valueMatch) return valueMatch[0];

  const rangeMatch = content.match(/between\s+£[\d,]+\s+and\s+£[\d,]+/i);
  if (rangeMatch) return rangeMatch[0];

  return undefined;
}

/**
 * Extract date from content or result metadata.
 *
 * @param result - The Tavily search result
 * @returns ISO date string
 */
function extractDate(result: TavilyResult): string {
  if (result.published_date) {
    return new Date(result.published_date).toISOString();
  }

  const dateMatch = result.content.match(
    /(?:registered|declared|updated).*?(\d{1,2}\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Fetch Register of Interests data for an entity via Tavily search.
 *
 * Searches the Parliament Register of Members' Interests for declarations.
 * Results are marked as unverified since they come from web scraping.
 * Returns empty arrays if the entity is not found (not an MP).
 *
 * @param entityName - The name of the person to search for
 * @returns Object containing InterestDeclaration[] and InvestigationSource[]
 */
export async function fetchRegisterOfInterests(entityName: string): Promise<{
  records: InterestDeclaration[];
  sources: InvestigationSource[];
}> {
  const records: InterestDeclaration[] = [];
  const sources: InvestigationSource[] = [];

  const query = `"${entityName}" "register of interests" site:parliament.uk`;

  const searchResponse = await tavilySearch({
    query,
    search_depth: "advanced",
    max_results: 10,
    include_domains: ["parliament.uk"],
  });

  if (!searchResponse.results || searchResponse.results.length === 0) {
    return { records, sources };
  }

  const seenUrls = new Set<string>();

  for (const result of searchResponse.results) {
    if (seenUrls.has(result.url)) continue;
    seenUrls.add(result.url);

    const categories = extractCategories(result.content || "");
    const value = extractValue(result.content || "");
    const dateRegistered = extractDate(result);

    for (const category of categories) {
      records.push({
        category,
        description: result.title || `Interest declaration for ${entityName}`,
        value,
        dateRegistered,
        sourceUrl: result.url,
      });
    }

    sources.push({
      sourceType: "register_of_interests",
      url: result.url,
      title: result.title || `Parliament - Register of Interests`,
      accessedAt: new Date().toISOString(),
      verificationStatus: "unverified",
    });
  }

  return { records, sources };
}
