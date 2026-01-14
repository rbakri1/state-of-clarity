/**
 * UK Public Data Service Unit Tests
 *
 * Tests for the UK public data orchestrator's aggregation and graceful degradation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";

// Mock all data source functions
vi.mock("@/lib/services/companies-house-api", () => ({
  fetchCompaniesHouseProfile: vi.fn(),
}));

vi.mock("@/lib/parsers/charity-commission-parser", () => ({
  fetchCharityCommissionData: vi.fn(),
}));

vi.mock("@/lib/parsers/parliament-parser", () => ({
  fetchRegisterOfInterests: vi.fn(),
}));

vi.mock("@/lib/parsers/electoral-commission-parser", () => ({
  fetchElectoralCommissionData: vi.fn(),
}));

vi.mock("@/lib/parsers/contracts-finder-parser", () => ({
  fetchGovernmentContracts: vi.fn(),
}));

// Mock the cache utility to return the fetcher result directly
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string, fn: () => Promise<unknown>, _ttl: number) => fn()),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { fetchUKPublicData } from "@/lib/services/uk-public-data-service";
import { fetchCompaniesHouseProfile } from "@/lib/services/companies-house-api";
import { fetchCharityCommissionData } from "@/lib/parsers/charity-commission-parser";
import { fetchRegisterOfInterests } from "@/lib/parsers/parliament-parser";
import { fetchElectoralCommissionData } from "@/lib/parsers/electoral-commission-parser";
import { fetchGovernmentContracts } from "@/lib/parsers/contracts-finder-parser";
import { withCache } from "@/lib/cache/with-cache";

const mockCompaniesHouse = vi.mocked(fetchCompaniesHouseProfile);
const mockCharity = vi.mocked(fetchCharityCommissionData);
const mockParliament = vi.mocked(fetchRegisterOfInterests);
const mockElectoral = vi.mocked(fetchElectoralCommissionData);
const mockContracts = vi.mocked(fetchGovernmentContracts);
const mockWithCache = vi.mocked(withCache);
const mockSentryCapture = vi.mocked(Sentry.captureException);

describe("UK Public Data Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset withCache to execute the fetcher
    mockWithCache.mockImplementation((_key, fn, _ttl) => fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchUKPublicData - aggregation", () => {
    it("should aggregate results from all sources", async () => {
      // Mock all 5 sources returning data
      mockCompaniesHouse.mockResolvedValueOnce({
        records: [
          {
            companyName: "Test Company Ltd",
            companyNumber: "12345678",
            role: "Director",
            appointedOn: "2020-01-01",
            companyStatus: "active",
            sourceUrl: "https://find-and-update.company-information.service.gov.uk/company/12345678",
          },
        ],
        sources: [
          {
            sourceType: "companies_house",
            url: "https://find-and-update.company-information.service.gov.uk/company/12345678",
            title: "Companies House Record",
            verificationStatus: "verified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      mockCharity.mockResolvedValueOnce({
        records: [
          {
            charityNumber: "1111111",
            charityName: "Test Charity",
            role: "Trustee",
            sourceUrl: "https://register-of-charities.charitycommission.gov.uk/charity/1111111",
          },
        ],
        sources: [
          {
            sourceType: "charity_commission",
            url: "https://register-of-charities.charitycommission.gov.uk/charity/1111111",
            title: "Charity Commission Record",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      mockParliament.mockResolvedValueOnce({
        records: [
          {
            category: "Employment",
            description: "Director of Test Company",
            value: "£50,000",
            dateRegistered: "2021-06-01",
            sourceUrl: "https://parliament.uk/interests",
          },
        ],
        sources: [
          {
            sourceType: "register_of_interests",
            url: "https://parliament.uk/interests",
            title: "Register of Interests",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      mockElectoral.mockResolvedValueOnce({
        records: [
          {
            donor: "John Smith",
            recipient: "Test Party",
            amount: 10000,
            type: "Cash",
            date: "2022-03-15",
            sourceUrl: "https://search.electoralcommission.org.uk/donation",
          },
        ],
        sources: [
          {
            sourceType: "electoral_commission",
            url: "https://search.electoralcommission.org.uk/donation",
            title: "Electoral Commission Donation",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      mockContracts.mockResolvedValueOnce({
        records: [
          {
            contractTitle: "IT Services Contract",
            buyer: "Ministry of Defence",
            supplier: "Test Company Ltd",
            value: 1000000,
            awardDate: "2023-01-10",
            sourceUrl: "https://contractsfinder.service.gov.uk/contract/12345",
          },
        ],
        sources: [
          {
            sourceType: "contracts_finder",
            url: "https://contractsfinder.service.gov.uk/contract/12345",
            title: "Contracts Finder",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      const result = await fetchUKPublicData("Test Company Ltd", "organization");

      // Verify all data was aggregated
      expect(result.profileData.companiesHouseEntities).toHaveLength(1);
      expect(result.profileData.companiesHouseEntities?.[0].companyName).toBe("Test Company Ltd");

      expect(result.profileData.charityInvolvements).toHaveLength(1);
      expect(result.profileData.charityInvolvements?.[0].charityName).toBe("Test Charity");

      expect(result.profileData.registerOfInterests).toHaveLength(1);
      expect(result.profileData.registerOfInterests?.[0].category).toBe("Employment");

      expect(result.profileData.politicalDonations).toHaveLength(1);
      expect(result.profileData.politicalDonations?.[0].amount).toBe(10000);

      expect(result.profileData.governmentContracts).toHaveLength(1);
      expect(result.profileData.governmentContracts?.[0].contractTitle).toBe("IT Services Contract");

      // All 5 sources should be collected
      expect(result.sources).toHaveLength(5);
      expect(result.errors).toEqual([]);
    });
  });

  describe("fetchUKPublicData - graceful degradation", () => {
    it("should continue with other sources if one fails", async () => {
      // Companies House fails
      mockCompaniesHouse.mockRejectedValueOnce(new Error("API Error 500"));

      // Other sources succeed
      mockCharity.mockResolvedValueOnce({
        records: [
          {
            charityNumber: "2222222",
            charityName: "Good Foundation",
            role: "Chair",
            sourceUrl: "https://register-of-charities.charitycommission.gov.uk/charity/2222222",
          },
        ],
        sources: [
          {
            sourceType: "charity_commission",
            url: "https://register-of-charities.charitycommission.gov.uk/charity/2222222",
            title: "Charity Commission",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      mockParliament.mockResolvedValueOnce({ records: [], sources: [] });
      mockElectoral.mockResolvedValueOnce({ records: [], sources: [] });
      mockContracts.mockResolvedValueOnce({ records: [], sources: [] });

      const result = await fetchUKPublicData("Jane Doe", "organization");

      // Companies House data should be undefined (failed)
      expect(result.profileData.companiesHouseEntities).toBeUndefined();

      // Charity data should be present
      expect(result.profileData.charityInvolvements).toHaveLength(1);
      expect(result.profileData.charityInvolvements?.[0].charityName).toBe("Good Foundation");

      // Should have 1 source from charity
      expect(result.sources).toHaveLength(1);

      // Should have 1 error from companies house
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe("companies_house");
      expect(result.errors[0].message).toBe("API Error 500");
      expect(result.errors[0].recoverable).toBe(true); // 500 is transient

      // Sentry should have been called
      expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    });

    it("should return empty arrays and errors when all sources fail", async () => {
      // All sources fail
      mockCompaniesHouse.mockRejectedValueOnce(new Error("Timeout error"));
      mockCharity.mockRejectedValueOnce(new Error("Network error"));
      mockParliament.mockRejectedValueOnce(new Error("404 Not Found"));
      mockElectoral.mockRejectedValueOnce(new Error("503 Service Unavailable"));
      mockContracts.mockRejectedValueOnce(new Error("401 Unauthorized"));

      const result = await fetchUKPublicData("Failed Entity", "organization");

      // All profile data should be undefined
      expect(result.profileData.companiesHouseEntities).toBeUndefined();
      expect(result.profileData.charityInvolvements).toBeUndefined();
      expect(result.profileData.registerOfInterests).toBeUndefined();
      expect(result.profileData.politicalDonations).toBeUndefined();
      expect(result.profileData.governmentContracts).toBeUndefined();

      // No sources
      expect(result.sources).toEqual([]);

      // 5 errors
      expect(result.errors).toHaveLength(5);
      
      // Check error recovery classification
      const companiesError = result.errors.find(e => e.source === "companies_house");
      expect(companiesError?.recoverable).toBe(true); // timeout is recoverable
      
      const charityError = result.errors.find(e => e.source === "charity_commission");
      expect(charityError?.recoverable).toBe(true); // network is recoverable

      const parliamentError = result.errors.find(e => e.source === "register_of_interests");
      expect(parliamentError?.recoverable).toBe(false); // 404 is not recoverable

      const electoralError = result.errors.find(e => e.source === "electoral_commission");
      expect(electoralError?.recoverable).toBe(true); // 503 is recoverable

      const contractsError = result.errors.find(e => e.source === "contracts_finder");
      expect(contractsError?.recoverable).toBe(false); // 401 is not recoverable

      // Sentry should have been called 5 times
      expect(mockSentryCapture).toHaveBeenCalledTimes(5);
    });
  });

  describe("fetchUKPublicData - caching", () => {
    it("should use cache wrapper for data source calls", async () => {
      // Setup all sources to return empty
      mockCompaniesHouse.mockResolvedValue({ records: [], sources: [] });
      mockCharity.mockResolvedValue({ records: [], sources: [] });
      mockParliament.mockResolvedValue({ records: [], sources: [] });
      mockElectoral.mockResolvedValue({ records: [], sources: [] });
      mockContracts.mockResolvedValue({ records: [], sources: [] });

      await fetchUKPublicData("Cache Test Entity", "organization");

      // withCache should have been called 5 times (once per source)
      expect(mockWithCache).toHaveBeenCalledTimes(5);

      // Verify cache keys have correct format
      const cacheCalls = mockWithCache.mock.calls;
      expect(cacheCalls[0][0]).toBe("uk_data:companies_house:cache_test_entity");
      expect(cacheCalls[1][0]).toBe("uk_data:charity_commission:cache_test_entity");
      expect(cacheCalls[2][0]).toBe("uk_data:register_of_interests:cache_test_entity");
      expect(cacheCalls[3][0]).toBe("uk_data:electoral_commission:cache_test_entity");
      expect(cacheCalls[4][0]).toBe("uk_data:contracts_finder:cache_test_entity");

      // Verify TTLs
      expect(cacheCalls[0][2]).toBe(86400);  // companies_house: 24h
      expect(cacheCalls[1][2]).toBe(86400);  // charity_commission: 24h
      expect(cacheCalls[2][2]).toBe(43200);  // register_of_interests: 12h
      expect(cacheCalls[3][2]).toBe(43200);  // electoral_commission: 12h
      expect(cacheCalls[4][2]).toBe(86400);  // contracts_finder: 24h
    });

    it("should return cached data on second call", async () => {
      const cachedCompaniesData = {
        records: [
          {
            companyName: "Cached Company",
            companyNumber: "99999999",
            role: "Director",
            appointedOn: "2020-01-01",
            companyStatus: "active",
            sourceUrl: "https://find-and-update.company-information.service.gov.uk/company/99999999",
          },
        ],
        sources: [
          {
            sourceType: "companies_house" as const,
            url: "https://find-and-update.company-information.service.gov.uk/company/99999999",
            title: "Cached Record",
            verificationStatus: "verified" as const,
            accessedAt: new Date().toISOString(),
          },
        ],
      };

      // First call - withCache executes fetcher and returns result
      mockWithCache.mockImplementationOnce((_key, fn, _ttl) => fn());
      mockWithCache.mockImplementationOnce((_key, fn, _ttl) => fn());
      mockWithCache.mockImplementationOnce((_key, fn, _ttl) => fn());
      mockWithCache.mockImplementationOnce((_key, fn, _ttl) => fn());
      mockWithCache.mockImplementationOnce((_key, fn, _ttl) => fn());

      mockCompaniesHouse.mockResolvedValueOnce(cachedCompaniesData);
      mockCharity.mockResolvedValueOnce({ records: [], sources: [] });
      mockParliament.mockResolvedValueOnce({ records: [], sources: [] });
      mockElectoral.mockResolvedValueOnce({ records: [], sources: [] });
      mockContracts.mockResolvedValueOnce({ records: [], sources: [] });

      const firstResult = await fetchUKPublicData("Cache Entity", "organization");
      expect(firstResult.profileData.companiesHouseEntities?.[0].companyName).toBe("Cached Company");

      // Second call - withCache returns cached value without calling fetcher
      mockWithCache.mockImplementation((_key, _fn, _ttl) => {
        // Return cached data directly for companies_house key
        if (_key.includes("companies_house")) {
          return Promise.resolve(cachedCompaniesData);
        }
        return Promise.resolve({ records: [], sources: [] });
      });

      // Clear the mock call count on data sources
      mockCompaniesHouse.mockClear();

      const secondResult = await fetchUKPublicData("Cache Entity", "organization");
      
      // Should have same result
      expect(secondResult.profileData.companiesHouseEntities?.[0].companyName).toBe("Cached Company");
      
      // fetchCompaniesHouseProfile should NOT have been called again
      // (because withCache returned cached data)
      expect(mockCompaniesHouse).not.toHaveBeenCalled();
    });
  });

  describe("fetchUKPublicData - entity type filtering", () => {
    it("should include Contracts Finder for organizations", async () => {
      mockCompaniesHouse.mockResolvedValueOnce({ records: [], sources: [] });
      mockCharity.mockResolvedValueOnce({ records: [], sources: [] });
      mockParliament.mockResolvedValueOnce({ records: [], sources: [] });
      mockElectoral.mockResolvedValueOnce({ records: [], sources: [] });
      mockContracts.mockResolvedValueOnce({
        records: [
          {
            contractTitle: "Org Contract",
            buyer: "HMRC",
            supplier: "Test Org",
            value: 500000,
            awardDate: "2023-05-01",
            sourceUrl: "https://contractsfinder.service.gov.uk/contract/org123",
          },
        ],
        sources: [
          {
            sourceType: "contracts_finder",
            url: "https://contractsfinder.service.gov.uk/contract/org123",
            title: "Contract Record",
            verificationStatus: "unverified",
            accessedAt: new Date().toISOString(),
          },
        ],
      });

      const result = await fetchUKPublicData("Test Organization", "organization");

      // Contracts should be included
      expect(result.profileData.governmentContracts).toHaveLength(1);
      expect(result.profileData.governmentContracts?.[0].contractTitle).toBe("Org Contract");
      expect(mockContracts).toHaveBeenCalled();
    });

    it("should NOT call Contracts Finder for individuals", async () => {
      mockCompaniesHouse.mockResolvedValueOnce({ records: [], sources: [] });
      mockCharity.mockResolvedValueOnce({ records: [], sources: [] });
      mockParliament.mockResolvedValueOnce({ records: [], sources: [] });
      mockElectoral.mockResolvedValueOnce({ records: [], sources: [] });

      // Note: We intentionally don't mock mockContracts here
      // to verify it's never called

      const consoleSpy = vi.spyOn(console, "log");

      const result = await fetchUKPublicData("John Individual", "individual");

      // governmentContracts should be empty array (not undefined)
      expect(result.profileData.governmentContracts).toEqual([]);

      // fetchGovernmentContracts should NOT have been called
      expect(mockContracts).not.toHaveBeenCalled();

      // Only 4 cache calls (not 5)
      expect(mockWithCache).toHaveBeenCalledTimes(4);

      // Should log skip message
      expect(consoleSpy).toHaveBeenCalledWith("Skipping Contracts Finder for individual entity");

      consoleSpy.mockRestore();
    });
  });
});
