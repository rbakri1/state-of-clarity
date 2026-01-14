/**
 * Charity Commission Parser
 *
 * Searches the UK Charity Commission register via Tavily for trustee/charity data.
 * Returns structured charity records and investigation sources.
 */

import type { CharityRecord, InvestigationSource } from "../types/accountability";
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
 * Search Tavily API for charity commission data.
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
      operationName: "Tavily Charity Search",
      model: "tavily-advanced",
      promptSummary: `Charity search: ${params.query.substring(0, 100)}`,
    }
  );

  if (result.error || !result.data) {
    return { results: [], query: params.query };
  }

  return result.data;
}

/**
 * Extract charity number from Charity Commission URL.
 * Example URL: https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=123456
 * Or: https://register-of-charities.charitycommission.gov.uk/charity/123456/
 *
 * @param url - The Charity Commission URL
 * @returns The charity number or null if not found
 */
function extractCharityNumber(url: string): string | null {
  const regIdMatch = url.match(/regId=(\d+)/);
  if (regIdMatch) return regIdMatch[1];

  const charityPathMatch = url.match(/\/charity\/(\d+)/);
  if (charityPathMatch) return charityPathMatch[1];

  return null;
}

/**
 * Extract charity name from search result title or content.
 */
function extractCharityName(result: TavilyResult): string {
  const title = result.title || "";
  const cleaned = title.replace(/\s*-\s*Charity Commission.*$/i, "").trim();
  return cleaned || "Unknown Charity";
}

/**
 * Parse role from content (trustee, director, etc).
 */
function extractRole(content: string): string {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("chair")) return "Chair";
  if (lowerContent.includes("treasurer")) return "Treasurer";
  if (lowerContent.includes("secretary")) return "Secretary";
  if (lowerContent.includes("director")) return "Director";
  if (lowerContent.includes("trustee")) return "Trustee";
  return "Trustee";
}

/**
 * Fetch Charity Commission data for an entity via Tavily search.
 *
 * Searches the Charity Commission register for trustees/charity involvement.
 * Results are marked as unverified since they come from web scraping.
 *
 * @param entityName - The name of the person/entity to search for
 * @returns Object containing CharityRecord[] and InvestigationSource[]
 */
export async function fetchCharityCommissionData(entityName: string): Promise<{
  records: CharityRecord[];
  sources: InvestigationSource[];
}> {
  const records: CharityRecord[] = [];
  const sources: InvestigationSource[] = [];

  const query = `"${entityName}" trustee site:register-of-charities.charitycommission.gov.uk`;

  const searchResponse = await tavilySearch({
    query,
    search_depth: "advanced",
    max_results: 10,
    include_domains: ["register-of-charities.charitycommission.gov.uk"],
  });

  if (!searchResponse.results || searchResponse.results.length === 0) {
    return { records, sources };
  }

  const seenCharities = new Set<string>();

  for (const result of searchResponse.results) {
    const charityNumber = extractCharityNumber(result.url);
    if (!charityNumber) continue;
    if (seenCharities.has(charityNumber)) continue;
    seenCharities.add(charityNumber);

    const charityName = extractCharityName(result);
    const role = extractRole(result.content || "");
    const sourceUrl = result.url;

    records.push({
      charityNumber,
      charityName,
      role,
      sourceUrl,
    });

    sources.push({
      sourceType: "charity_commission",
      url: sourceUrl,
      title: `Charity Commission - ${charityName}`,
      accessedAt: new Date().toISOString(),
      verificationStatus: "unverified",
    });
  }

  return { records, sources };
}
