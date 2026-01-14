/**
 * UK Public Data Service - Orchestrator
 *
 * Main orchestrator that calls all UK public data sources in parallel
 * and aggregates results into a single profile object.
 */

import * as Sentry from "@sentry/nextjs";

import type {
  EntityType,
  InvestigationSource,
  CompanyRecord,
  CharityRecord,
  InterestDeclaration,
  Donation,
  Contract,
} from "../types/accountability";

import { withCache } from "../cache/with-cache";
import { fetchCompaniesHouseProfile } from "./companies-house-api";
import { fetchCharityCommissionData } from "../parsers/charity-commission-parser";
import { fetchRegisterOfInterests } from "../parsers/parliament-parser";
import { fetchElectoralCommissionData } from "../parsers/electoral-commission-parser";
import { fetchGovernmentContracts } from "../parsers/contracts-finder-parser";

/**
 * Cache TTL values in seconds for each data source.
 */
const CACHE_TTLS = {
  companies_house: 86400,    // 24 hours
  charity_commission: 86400, // 24 hours
  register_of_interests: 43200, // 12 hours
  electoral_commission: 43200,  // 12 hours
  contracts_finder: 86400,   // 24 hours
} as const;

/**
 * Normalize entity name for use in cache keys.
 * Lowercases and trims whitespace.
 */
function normalizeCacheKey(entityName: string): string {
  return entityName.toLowerCase().trim().replace(/\s+/g, "_");
}

/**
 * Generate a cache key for a UK data source.
 * Format: uk_data:{source}:{normalized_entity_name}
 */
function getCacheKey(source: keyof typeof CACHE_TTLS, entityName: string): string {
  return `uk_data:${source}:${normalizeCacheKey(entityName)}`;
}

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
 * Determine the error type for Sentry logging.
 * Transient errors may succeed on retry, permanent errors will not.
 */
function getErrorType(message: string): "transient" | "permanent" {
  return isRecoverableError(message) ? "transient" : "permanent";
}

/**
 * Wrap a data source call in try-catch for graceful degradation.
 * Logs errors to Sentry with proper context tags.
 */
async function safeDataSourceCall<T>(
  sourceName: string,
  fetcher: () => Promise<T>,
  errors: DataSourceError[],
  entityName: string,
  entityType: EntityType
): Promise<T | null> {
  try {
    return await fetcher();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const recoverable = isRecoverableError(message);
    const normalizedName = normalizeCacheKey(entityName);

    // Log to Sentry with context tags
    Sentry.captureException(error, {
      tags: {
        component: "uk-public-data",
        source: sourceName,
        entity: normalizedName,
      },
      extra: {
        entityType,
        errorType: getErrorType(message),
        entityName,
        recoverable,
      },
    });

    errors.push({
      source: sourceName,
      message,
      recoverable,
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

  // Build array of promises for parallel execution with caching
  const companiesHousePromise = safeDataSourceCall(
    "companies_house",
    () =>
      withCache(
        getCacheKey("companies_house", targetEntity),
        () => fetchCompaniesHouseProfile(targetEntity),
        CACHE_TTLS.companies_house
      ),
    errors,
    targetEntity,
    entityType
  );

  const charityPromise = safeDataSourceCall(
    "charity_commission",
    () =>
      withCache(
        getCacheKey("charity_commission", targetEntity),
        () => fetchCharityCommissionData(targetEntity),
        CACHE_TTLS.charity_commission
      ),
    errors,
    targetEntity,
    entityType
  );

  const parliamentPromise = safeDataSourceCall(
    "register_of_interests",
    () =>
      withCache(
        getCacheKey("register_of_interests", targetEntity),
        () => fetchRegisterOfInterests(targetEntity),
        CACHE_TTLS.register_of_interests
      ),
    errors,
    targetEntity,
    entityType
  );

  const electoralPromise = safeDataSourceCall(
    "electoral_commission",
    () =>
      withCache(
        getCacheKey("electoral_commission", targetEntity),
        () => fetchElectoralCommissionData(targetEntity),
        CACHE_TTLS.electoral_commission
      ),
    errors,
    targetEntity,
    entityType
  );

  // Only fetch contracts for organizations
  const contractsPromise =
    entityType === "organization"
      ? safeDataSourceCall(
          "contracts_finder",
          () =>
            withCache(
              getCacheKey("contracts_finder", targetEntity),
              () => fetchGovernmentContracts(targetEntity),
              CACHE_TTLS.contracts_finder
            ),
          errors,
          targetEntity,
          entityType
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
