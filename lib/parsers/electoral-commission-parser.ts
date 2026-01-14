/**
 * Electoral Commission Parser
 *
 * Searches the UK Electoral Commission donation data via Tavily.
 * Returns structured donation records and investigation sources.
 */

import type { Donation, InvestigationSource } from "../types/accountability";
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
 * Search Tavily API for Electoral Commission data.
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
      operationName: "Tavily Electoral Commission Search",
      model: "tavily-advanced",
      promptSummary: `Electoral Commission search: ${params.query.substring(0, 100)}`,
    }
  );

  if (result.error || !result.data) {
    return { results: [], query: params.query };
  }

  return result.data;
}

/**
 * Extract donation amounts from content using £ symbol patterns.
 * Handles formats like: £1,234 or £1,234.56 or £1234
 *
 * @param content - The text content to search
 * @returns Array of extracted amounts as numbers
 */
function extractAmounts(content: string): number[] {
  const amounts: number[] = [];
  const regex = /£([\d,]+(?:\.\d{2})?)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const amountStr = match[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      amounts.push(amount);
    }
  }

  return amounts;
}

/**
 * Extract date from content or published date.
 * Falls back to current date if not found.
 */
function extractDate(result: TavilyResult): string {
  if (result.published_date) {
    return result.published_date;
  }

  const content = result.content || "";
  const datePatterns = [
    /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return new Date().toISOString().split("T")[0];
}

/**
 * Determine donation type from content.
 */
function extractDonationType(content: string): string {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("cash")) return "Cash";
  if (lowerContent.includes("visit")) return "Visit";
  if (lowerContent.includes("services")) return "Non-cash (Services)";
  if (lowerContent.includes("sponsorship")) return "Sponsorship";
  if (lowerContent.includes("loan")) return "Loan";
  return "Donation";
}

/**
 * Extract donor/recipient names from content.
 */
function extractDonorRecipient(
  content: string,
  entityName: string
): { donor?: string; recipient?: string } {
  const lowerContent = content.toLowerCase();
  const lowerEntity = entityName.toLowerCase();

  if (lowerContent.includes("donated to") || lowerContent.includes("gave to")) {
    return { donor: entityName };
  }
  if (lowerContent.includes("received from") || lowerContent.includes("donation from")) {
    return { recipient: entityName };
  }

  if (lowerContent.includes(lowerEntity)) {
    const beforeEntity = lowerContent.indexOf(lowerEntity);
    const contextBefore = lowerContent.substring(Math.max(0, beforeEntity - 50), beforeEntity);
    if (contextBefore.includes("from")) {
      return { donor: entityName };
    }
    if (contextBefore.includes("to")) {
      return { recipient: entityName };
    }
  }

  return { donor: entityName };
}

/**
 * Fetch Electoral Commission donation data for an entity via Tavily search.
 *
 * Searches the Electoral Commission database for political donations.
 * Results are marked as unverified since they come from web scraping.
 *
 * @param entityName - The name of the person/entity to search for
 * @returns Object containing Donation[] and InvestigationSource[]
 */
export async function fetchElectoralCommissionData(entityName: string): Promise<{
  records: Donation[];
  sources: InvestigationSource[];
}> {
  const records: Donation[] = [];
  const sources: InvestigationSource[] = [];

  const query = `"${entityName}" donations site:search.electoralcommission.org.uk`;

  const searchResponse = await tavilySearch({
    query,
    search_depth: "advanced",
    max_results: 10,
    include_domains: ["search.electoralcommission.org.uk"],
  });

  if (!searchResponse.results || searchResponse.results.length === 0) {
    return { records, sources };
  }

  const seenUrls = new Set<string>();

  for (const result of searchResponse.results) {
    if (seenUrls.has(result.url)) continue;
    seenUrls.add(result.url);

    const amounts = extractAmounts(result.content || "");
    const date = extractDate(result);
    const donationType = extractDonationType(result.content || "");
    const { donor, recipient } = extractDonorRecipient(result.content || "", entityName);

    if (amounts.length === 0) {
      records.push({
        donor,
        recipient,
        amount: 0,
        date,
        type: donationType,
        sourceUrl: result.url,
      });
    } else {
      for (const amount of amounts) {
        records.push({
          donor,
          recipient,
          amount,
          date,
          type: donationType,
          sourceUrl: result.url,
        });
      }
    }

    sources.push({
      sourceType: "electoral_commission",
      url: result.url,
      title: result.title || `Electoral Commission - ${entityName}`,
      accessedAt: new Date().toISOString(),
      verificationStatus: "unverified",
    });
  }

  return { records, sources };
}
