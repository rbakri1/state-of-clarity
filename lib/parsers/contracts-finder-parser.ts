/**
 * Contracts Finder Parser
 *
 * Searches UK government contracts via Tavily.
 * Returns structured contract records and investigation sources.
 */

import type { Contract, InvestigationSource } from "../types/accountability";
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
 * Search Tavily API for Contracts Finder data.
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
      operationName: "Tavily Contracts Finder Search",
      model: "tavily-advanced",
      promptSummary: `Contracts Finder search: ${params.query.substring(0, 100)}`,
    }
  );

  if (result.error || !result.data) {
    return { results: [], query: params.query };
  }

  return result.data;
}

/**
 * Extract contract value from content using £ symbol patterns.
 * Handles formats like: £1,234 or £1,234.56 or £1234 or £1.2m or £1.2 million
 *
 * @param content - The text content to search
 * @returns The largest extracted amount (contracts typically mention total value)
 */
function extractContractValue(content: string): number {
  const amounts: number[] = [];

  // Match £ amounts with optional million/m suffix
  const millionRegex = /£([\d,.]+)\s*(million|m)\b/gi;
  let match;
  while ((match = millionRegex.exec(content)) !== null) {
    const amountStr = match[1].replace(/,/g, "");
    const amount = parseFloat(amountStr) * 1_000_000;
    if (!isNaN(amount) && amount > 0) {
      amounts.push(amount);
    }
  }

  // Match £ amounts with optional billion/bn suffix
  const billionRegex = /£([\d,.]+)\s*(billion|bn)\b/gi;
  while ((match = billionRegex.exec(content)) !== null) {
    const amountStr = match[1].replace(/,/g, "");
    const amount = parseFloat(amountStr) * 1_000_000_000;
    if (!isNaN(amount) && amount > 0) {
      amounts.push(amount);
    }
  }

  // Match standard £ amounts
  const standardRegex = /£([\d,]+(?:\.\d{2})?)/g;
  while ((match = standardRegex.exec(content)) !== null) {
    const amountStr = match[1].replace(/,/g, "");
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      amounts.push(amount);
    }
  }

  // Return largest amount (typically the total contract value)
  return amounts.length > 0 ? Math.max(...amounts) : 0;
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
 * Extract buyer (government department) from content.
 */
function extractBuyer(content: string, title: string): string {
  const combinedText = `${title} ${content}`;
  const lowerText = combinedText.toLowerCase();

  // Common government departments and agencies
  const departments = [
    "Ministry of Defence",
    "Department for Education",
    "Department of Health",
    "Department for Transport",
    "Home Office",
    "Cabinet Office",
    "HM Treasury",
    "NHS",
    "Environment Agency",
    "HMRC",
    "Department for Work and Pensions",
    "Foreign Office",
    "Ministry of Justice",
    "Highways England",
  ];

  for (const dept of departments) {
    if (lowerText.includes(dept.toLowerCase())) {
      return dept;
    }
  }

  // Try to extract from "awarded by" pattern
  const awardedByMatch = combinedText.match(/awarded\s+by\s+([^,.\n]+)/i);
  if (awardedByMatch) {
    return awardedByMatch[1].trim();
  }

  return "UK Government";
}

/**
 * Extract contract title from result.
 */
function extractContractTitle(result: TavilyResult, entityName: string): string {
  if (result.title && !result.title.includes("Contracts Finder")) {
    return result.title;
  }

  // Try to extract from content
  const content = result.content || "";
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length < 200) {
    return firstSentence.trim();
  }

  return `Contract involving ${entityName}`;
}

/**
 * Fetch government contracts data for an entity via Tavily search.
 *
 * Searches the Contracts Finder database for government contracts.
 * Results are marked as unverified since they come from web scraping.
 *
 * @param entityName - The name of the company/organization to search for
 * @returns Object containing Contract[] and InvestigationSource[]
 */
export async function fetchGovernmentContracts(entityName: string): Promise<{
  records: Contract[];
  sources: InvestigationSource[];
}> {
  const records: Contract[] = [];
  const sources: InvestigationSource[] = [];

  const query = `"${entityName}" site:contractsfinder.service.gov.uk`;

  const searchResponse = await tavilySearch({
    query,
    search_depth: "advanced",
    max_results: 10,
    include_domains: ["contractsfinder.service.gov.uk"],
  });

  if (!searchResponse.results || searchResponse.results.length === 0) {
    return { records, sources };
  }

  const seenUrls = new Set<string>();

  for (const result of searchResponse.results) {
    if (seenUrls.has(result.url)) continue;
    seenUrls.add(result.url);

    const value = extractContractValue(result.content || "");
    const awardDate = extractDate(result);
    const buyer = extractBuyer(result.content || "", result.title || "");
    const contractTitle = extractContractTitle(result, entityName);

    records.push({
      contractTitle,
      buyer,
      supplier: entityName,
      value,
      awardDate,
      sourceUrl: result.url,
    });

    sources.push({
      sourceType: "contracts_finder",
      url: result.url,
      title: result.title || `Contracts Finder - ${entityName}`,
      accessedAt: new Date().toISOString(),
      verificationStatus: "unverified",
    });
  }

  return { records, sources };
}
