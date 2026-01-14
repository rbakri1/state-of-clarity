/**
 * Comprehensive Unit Tests for charity-commission-parser.ts
 *
 * Tests edge cases, error handling, and extraction functions for the
 * Charity Commission parser that searches via Tavily API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the safeAICall function before importing parser
vi.mock("@/lib/ai/safe-ai-call", () => ({
  safeAICall: vi.fn(),
}));

import { safeAICall } from "@/lib/ai/safe-ai-call";
import { fetchCharityCommissionData } from "@/lib/parsers/charity-commission-parser";

const mockSafeAICall = vi.mocked(safeAICall);

describe("Charity Commission Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractCharityNumber", () => {
    it("should extract charity number from regId URL parameter", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=1234567",
              title: "Test Charity",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test Person");
      expect(result.records[0].charityNumber).toBe("1234567");
    });

    it("should extract charity number from /charity/ path format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/9876543/trustees",
              title: "Another Charity",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test Person");
      expect(result.records[0].charityNumber).toBe("9876543");
    });

    it("should skip results with URLs that have no charity number", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/search",
              title: "Search Results",
              content: "Some trustee mentioned",
              score: 0.9,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1111111",
              title: "Valid Charity",
              content: "Trustee info",
              score: 0.85,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test Person");
      expect(result.records).toHaveLength(1);
      expect(result.records[0].charityNumber).toBe("1111111");
    });

    it("should handle charity number with leading zeros", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=0123456",
              title: "Leading Zero Charity",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityNumber).toBe("0123456");
    });
  });

  describe("extractCharityName", () => {
    it("should clean 'Charity Commission' suffix from title", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "British Heart Foundation - Charity Commission",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityName).toBe("British Heart Foundation");
    });

    it("should clean 'Charity Commission Register' suffix from title", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "RSPCA - Charity Commission Register",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityName).toBe("RSPCA");
    });

    it("should return 'Unknown Charity' for empty titles", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityName).toBe("Unknown Charity");
    });

    it("should return 'Unknown Charity' when title only contains suffix", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: " - Charity Commission",
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityName).toBe("Unknown Charity");
    });

    it("should handle title with undefined", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: undefined as unknown as string,
              content: "Trustee info",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].charityName).toBe("Unknown Charity");
    });
  });

  describe("extractRole", () => {
    it("should identify Chair role", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "John Smith serves as the Chair of this organization",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("John Smith");
      expect(result.records[0].role).toBe("Chair");
    });

    it("should identify Treasurer role", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Jane Doe is the Treasurer responsible for finances",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Jane Doe");
      expect(result.records[0].role).toBe("Treasurer");
    });

    it("should identify Secretary role", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Bob serves as Secretary handling correspondence",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Bob");
      expect(result.records[0].role).toBe("Secretary");
    });

    it("should identify Director role", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Alice is appointed as Director of the charity",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Alice");
      expect(result.records[0].role).toBe("Director");
    });

    it("should default to Trustee when no specific role found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "A member of the charity board",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Member");
      expect(result.records[0].role).toBe("Trustee");
    });

    it("should prioritize Chair over Trustee when both mentioned", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "John is a trustee and also serves as the chair",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("John");
      expect(result.records[0].role).toBe("Chair");
    });

    it("should handle empty content gracefully", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].role).toBe("Trustee");
    });

    it("should handle undefined content gracefully", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: undefined as unknown as string,
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].role).toBe("Trustee");
    });

    it("should identify Trustee role explicitly mentioned", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "John Smith is listed as a trustee of this charity",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("John Smith");
      expect(result.records[0].role).toBe("Trustee");
    });
  });

  describe("deduplication", () => {
    it("should deduplicate charities with same number from different URL formats", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=1234567",
              title: "Charity One",
              content: "Trustee info",
              score: 0.95,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567/overview",
              title: "Charity One Overview",
              content: "More trustee info",
              score: 0.9,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567/trustees",
              title: "Charity One Trustees",
              content: "Trustee list",
              score: 0.85,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records).toHaveLength(1);
      expect(result.sources).toHaveLength(1);
    });

    it("should keep charities with different numbers", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1111111",
              title: "Charity A",
              content: "Trustee",
              score: 0.9,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/2222222",
              title: "Charity B",
              content: "Director",
              score: 0.85,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/3333333",
              title: "Charity C",
              content: "Chair",
              score: 0.8,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records).toHaveLength(3);
      expect(result.sources).toHaveLength(3);
    });
  });

  describe("error handling", () => {
    it("should return empty arrays when safeAICall returns error", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
        isAIServiceError: true,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should return empty arrays when results is undefined", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: undefined as unknown as [],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should return empty arrays when results is null", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: null as unknown as [],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should handle API timeout gracefully", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: null,
        error: new Error("Request timeout"),
        isAIServiceError: true,
      });

      const result = await fetchCharityCommissionData("Slow Search");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });
  });

  describe("source generation", () => {
    it("should create sources with correct sourceType", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.sources[0].sourceType).toBe("charity_commission");
    });

    it("should create sources with unverified verificationStatus", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });

    it("should include accessedAt timestamp in sources", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Test Charity",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.sources[0].accessedAt).toBeDefined();
      expect(new Date(result.sources[0].accessedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it("should format source title with charity name", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "British Heart Foundation",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.sources[0].title).toBe(
        "Charity Commission - British Heart Foundation"
      );
    });
  });

  describe("query construction", () => {
    it("should call safeAICall with correct parameters", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: { results: [], query: "test" },
        error: null,
        isAIServiceError: false,
      });

      await fetchCharityCommissionData("John Smith");

      expect(mockSafeAICall).toHaveBeenCalledTimes(1);
      const callArg = mockSafeAICall.mock.calls[0][1];
      expect(callArg).toMatchObject({
        operationName: "Tavily Charity Search",
        model: "tavily-advanced",
      });
    });

    it("should handle entity names with special characters", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: { results: [], query: "test" },
        error: null,
        isAIServiceError: false,
      });

      await fetchCharityCommissionData("O'Brien & Associates");
      expect(mockSafeAICall).toHaveBeenCalledTimes(1);
    });

    it("should handle very long entity names", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: { results: [], query: "test" },
        error: null,
        isAIServiceError: false,
      });

      const longName = "A".repeat(200);
      await fetchCharityCommissionData(longName);
      expect(mockSafeAICall).toHaveBeenCalledTimes(1);
    });
  });

  describe("record structure", () => {
    it("should return records with all required fields", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1234567",
              title: "Complete Charity",
              content: "John is the Chair",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("John");
      const record = result.records[0];

      expect(record).toHaveProperty("charityNumber");
      expect(record).toHaveProperty("charityName");
      expect(record).toHaveProperty("role");
      expect(record).toHaveProperty("sourceUrl");

      expect(typeof record.charityNumber).toBe("string");
      expect(typeof record.charityName).toBe("string");
      expect(typeof record.role).toBe("string");
      expect(typeof record.sourceUrl).toBe("string");
    });

    it("should preserve original source URL in records", async () => {
      const originalUrl =
        "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=1234567&foo=bar";
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: originalUrl,
              title: "Test",
              content: "Trustee",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");
      expect(result.records[0].sourceUrl).toBe(originalUrl);
    });
  });
});
