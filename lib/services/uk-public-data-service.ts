/**
 * UK Public Data Service - Orchestrator
 *
 * Main orchestrator that calls all UK public data sources in parallel
 * and aggregates results into a single profile object.
 */

import type {
  EntityType,
  InvestigationSource,
  CompanyRecord,
  CharityRecord,
  InterestDeclaration,
  Donation,
  Contract,
} from "../types/accountability";

import { fetchCompaniesHouseProfile } from "./companies-house-api";
import { fetchCharityCommissionData } from "../parsers/charity-commission-parser";
import { fetchRegisterOfInterests } from "../parsers/parliament-parser";
import { fetchElectoralCommissionData } from "../parsers/electoral-commission-parser";
import { fetchGovernmentContracts } from "../parsers/contracts-finder-parser";

/**
 * Error information from a data source fetch operation.
 */
export interface DataSourceError {
  source: string;
  message: string;
  recoverable: boolean;
}

/**
 * Partial UK profile data returned from data fetching.
 * All fields are optional since some sources may fail.
 */
export interface PartialUKProfileData {
  companiesHouseEntities?: CompanyRecord[];
  charityInvolvements?: CharityRecord[];
  registerOfInterests?: InterestDeclaration[];
  politicalDonations?: Donation[];
  governmentContracts?: Contract[];
}

/**
 * Result from fetching UK public data.
 */
export interface UKPublicDataResult {
  profileData: PartialUKProfileData;
  sources: InvestigationSource[];
  errors: DataSourceError[];
}

/**
 * Determine if an error is recoverable (transient) or permanent.
 * Transient errors (timeout, 500, 503) may succeed on retry.
 * Permanent errors (404, 401, 403) will not.
 */
function isRecoverableError(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Transient errors - recoverable
  if (lowerMessage.includes("timeout")) return true;
  if (lowerMessage.includes("500")) return true;
  if (lowerMessage.includes("503")) return true;
  if (lowerMessage.includes("502")) return true;
  if (lowerMessage.includes("network")) return true;
  if (lowerMessage.includes("econnreset")) return true;
  if (lowerMessage.includes("etimedout")) return true;

  // Permanent errors - not recoverable
  if (lowerMessage.includes("404")) return false;
  if (lowerMessage.includes("401")) return false;
  if (lowerMessage.includes("403")) return false;

  // Default to recoverable for unknown errors
  return true;
}

/**
 * Wrap a data source call in try-catch for graceful degradation.
 */
async function safeDataSourceCall<T>(
  sourceName: string,
  fetcher: () => Promise<T>,
  errors: DataSourceError[]
): Promise<T | null> {
  try {
    return await fetcher();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({
      source: sourceName,
      message,
      recoverable: isRecoverableError(message),
    });
    return null;
  }
}

/**
 * Fetch UK public data for a target entity from all available sources.
 *
 * Calls all 5 data sources in parallel using Promise.allSettled for
 * graceful degradation. If some sources fail, others will still return data.
 *
 * @param targetEntity - The name of the person/organization to search for
 * @param entityType - Whether the target is an individual or organization
 * @returns Aggregated profile data, sources, and any errors encountered
 */
export async function fetchUKPublicData(
  targetEntity: string,
  entityType: EntityType
): Promise<UKPublicDataResult> {
  const profileData: PartialUKProfileData = {};
  const sources: InvestigationSource[] = [];
  const errors: DataSourceError[] = [];

  // Build array of promises for parallel execution
  const companiesHousePromise = safeDataSourceCall(
    "companies_house",
    () => fetchCompaniesHouseProfile(targetEntity),
    errors
  );

  const charityPromise = safeDataSourceCall(
    "charity_commission",
    () => fetchCharityCommissionData(targetEntity),
    errors
  );

  const parliamentPromise = safeDataSourceCall(
    "register_of_interests",
    () => fetchRegisterOfInterests(targetEntity),
    errors
  );

  const electoralPromise = safeDataSourceCall(
    "electoral_commission",
    () => fetchElectoralCommissionData(targetEntity),
    errors
  );

  // Only fetch contracts for organizations
  const contractsPromise =
    entityType === "organization"
      ? safeDataSourceCall(
          "contracts_finder",
          () => fetchGovernmentContracts(targetEntity),
          errors
        )
      : Promise.resolve(null);

  if (entityType !== "organization") {
    console.log("Skipping Contracts Finder for individual entity");
    profileData.governmentContracts = [];
  }

  // Execute all in parallel
  const [companiesHouseResult, charityResult, parliamentResult, electoralResult, contractsResult] =
    await Promise.all([
      companiesHousePromise,
      charityPromise,
      parliamentPromise,
      electoralPromise,
      contractsPromise,
    ]);

  // Aggregate Companies House results
  if (companiesHouseResult) {
    profileData.companiesHouseEntities = companiesHouseResult.records;
    sources.push(...companiesHouseResult.sources);
  }

  // Aggregate Charity Commission results
  if (charityResult) {
    profileData.charityInvolvements = charityResult.records;
    sources.push(...charityResult.sources);
  }

  // Aggregate Parliament Register of Interests results
  if (parliamentResult) {
    profileData.registerOfInterests = parliamentResult.records;
    sources.push(...parliamentResult.sources);
  }

  // Aggregate Electoral Commission results
  if (electoralResult) {
    profileData.politicalDonations = electoralResult.records;
    sources.push(...electoralResult.sources);
  }

  // Aggregate Contracts Finder results (only for organizations)
  if (contractsResult) {
    profileData.governmentContracts = contractsResult.records;
    sources.push(...contractsResult.sources);
  }

  return { profileData, sources, errors };
}
