/**
 * Companies House API Service
 *
 * Provides integration with the UK Companies House REST API for searching
 * officers and fetching their appointment histories.
 *
 * @see https://developer.company-information.service.gov.uk/
 */

import type { CompanyRecord, InvestigationSource } from "../types/accountability";

const COMPANIES_HOUSE_BASE_URL = "https://api.company-information.service.gov.uk";

/**
 * Generate the Basic Auth header for Companies House API.
 * The API key is used as the username with an empty password.
 *
 * @returns The Authorization header value in Basic Auth format
 */
export function getCompaniesHouseAuthHeader(): string {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY || "";
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

interface OfficerSearchItem {
  title?: string;
  links?: { self?: string };
  date_of_birth?: { month?: number; year?: number };
  address_snippet?: string;
  address?: Record<string, string>;
  appointment_count?: number;
  description?: string;
  matches?: Record<string, unknown>;
}

interface OfficerSearchResponse {
  items?: OfficerSearchItem[];
  total_results?: number;
}

interface AppointmentItem {
  appointed_to?: { company_name?: string; company_number?: string; company_status?: string };
  officer_role?: string;
  appointed_on?: string;
  resigned_on?: string;
  links?: { company?: string };
}

interface AppointmentsResponse {
  items?: AppointmentItem[];
  total_results?: number;
}

/**
 * Search for officers in Companies House by name.
 *
 * @param name - The name to search for
 * @returns Array of officer search results, empty array if none found or on 404
 */
export async function searchOfficers(name: string): Promise<OfficerSearchItem[]> {
  const url = new URL("/search/officers", COMPANIES_HOUSE_BASE_URL);
  url.searchParams.set("q", name);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: getCompaniesHouseAuthHeader(),
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Companies House search failed: ${response.status} ${response.statusText}`
    );
  }

  const data: OfficerSearchResponse = await response.json();
  return data.items || [];
}

/**
 * Get all appointments for an officer by their officer ID.
 *
 * @param officerId - The Companies House officer ID (from the links.self path)
 * @returns Array of appointment records, empty array if none found or on 404
 */
export async function getOfficerAppointments(
  officerId: string
): Promise<AppointmentItem[]> {
  const url = new URL(`/officers/${officerId}/appointments`, COMPANIES_HOUSE_BASE_URL);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: getCompaniesHouseAuthHeader(),
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Companies House appointments failed: ${response.status} ${response.statusText}`
    );
  }

  const data: AppointmentsResponse = await response.json();
  return data.items || [];
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract officer ID from the self link path.
 * Example: "/officers/abc123" -> "abc123"
 */
function extractOfficerId(selfLink?: string): string | null {
  if (!selfLink) return null;
  const match = selfLink.match(/\/officers\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Companies House profile data for an entity with retry logic.
 *
 * Searches for officers matching the entity name, then fetches appointments
 * for each officer found. Implements exponential backoff retry for transient errors.
 *
 * @param entityName - The name of the person/entity to search for
 * @returns Object containing CompanyRecord[] and InvestigationSource[]
 */
export async function fetchCompaniesHouseProfile(entityName: string): Promise<{
  records: CompanyRecord[];
  sources: InvestigationSource[];
}> {
  const records: CompanyRecord[] = [];
  const sources: InvestigationSource[] = [];
  const delays = [1000, 2000, 4000];

  let officers: OfficerSearchItem[] = [];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      officers = await searchOfficers(entityName);
      lastError = null;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        await sleep(delays[attempt]);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  if (officers.length === 0) {
    return { records, sources };
  }

  for (const officer of officers) {
    const officerId = extractOfficerId(officer.links?.self);
    if (!officerId) continue;

    let appointments: AppointmentItem[] = [];
    lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        appointments = await getOfficerAppointments(officerId);
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await sleep(delays[attempt]);
        }
      }
    }

    if (lastError) {
      console.warn(
        `[CompaniesHouse] Failed to fetch appointments for officer ${officerId}:`,
        lastError.message
      );
      continue;
    }

    for (const appointment of appointments) {
      const companyNumber = appointment.appointed_to?.company_number || "";
      const companyName = appointment.appointed_to?.company_name || "Unknown Company";
      const companyStatus = appointment.appointed_to?.company_status || "unknown";
      const role = appointment.officer_role || "Unknown Role";
      const appointedOn = appointment.appointed_on;
      const resignedOn = appointment.resigned_on;

      const sourceUrl = companyNumber
        ? `https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`
        : `https://find-and-update.company-information.service.gov.uk/search?q=${encodeURIComponent(entityName)}`;

      records.push({
        companyNumber,
        companyName,
        role,
        appointedOn,
        resignedOn,
        companyStatus,
        sourceUrl,
      });

      sources.push({
        sourceType: "companies_house",
        url: sourceUrl,
        title: `Companies House - ${companyName}`,
        accessedAt: new Date().toISOString(),
        verificationStatus: "verified",
      });
    }
  }

  return { records, sources };
}
