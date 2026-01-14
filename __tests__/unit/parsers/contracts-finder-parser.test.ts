/**
 * Comprehensive Unit Tests for contracts-finder-parser.ts
 *
 * Tests edge cases, error handling, and extraction functions for the
 * Contracts Finder parser that searches UK government contracts via Tavily API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the safeAICall function before importing parser
vi.mock("@/lib/ai/safe-ai-call", () => ({
  safeAICall: vi.fn(),
}));

import { safeAICall } from "@/lib/ai/safe-ai-call";
import { fetchGovernmentContracts } from "@/lib/parsers/contracts-finder-parser";

const mockSafeAICall = vi.mocked(safeAICall);

describe("Contracts Finder Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractContractValue", () => {
    describe("standard amounts", () => {
      it("should extract simple £ amounts without commas", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Simple Contract",
                content: "Contract value: £5000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(5000);
      });

      it("should extract £ amounts with commas", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Formatted Contract",
                content: "Contract value: £1,234,567",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(1234567);
      });

      it("should extract £ amounts with decimal places", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Decimal Contract",
                content: "Contract value: £1,234.56",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(1234.56);
      });
    });

    describe("million amounts", () => {
      it("should extract £Xm format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Million Contract",
                content: "Contract value: £5m",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(5000000);
      });

      it("should extract £X.Xm format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Decimal Million Contract",
                content: "Contract value: £2.5m",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(2500000);
      });

      it("should extract £X million format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Word Million Contract",
                content: "Contract worth £10 million for services",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(10000000);
      });

      it("should extract £X.X million format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Decimal Word Million Contract",
                content: "Contract value £3.75 million",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(3750000);
      });
    });

    describe("billion amounts", () => {
      it("should extract £Xbn format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Billion Contract",
                content: "Major contract valued at £2bn",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(2000000000);
      });

      it("should extract £X.Xbn format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Decimal Billion Contract",
                content: "Contract valued at £1.5bn",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(1500000000);
      });

      it("should extract £X billion format", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Word Billion Contract",
                content: "Defence contract worth £3 billion",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(3000000000);
      });
    });

    describe("multiple amounts", () => {
      it("should return the largest amount when multiple found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Multi-value Contract",
                content:
                  "Initial value £100,000, extension £50,000, total value £150,000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(150000);
      });

      it("should return largest between million and standard amounts", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Mixed Value Contract",
                content: "Contract £5m total, first phase £500,000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(5000000);
      });

      it("should handle billion being larger than million", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Huge Contract",
                content: "Contract £1bn, annual budget £100m",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(1000000000);
      });
    });

    describe("edge cases", () => {
      it("should return 0 when no amounts found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "No Value Contract",
                content: "Contract awarded, value not disclosed",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(0);
      });

      it("should handle empty content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Empty Content",
                content: "",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(0);
      });

      it("should handle undefined content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Undefined Content",
                content: undefined as unknown as string,
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(0);
      });

      it("should ignore zero amounts", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Zero and Real Value",
                content: "£0 deposit, contract value £50,000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].value).toBe(50000);
      });
    });
  });

  describe("extractDate", () => {
    it("should use published_date when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Dated Contract",
              content: "Contract info",
              score: 0.9,
              published_date: "2023-06-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].awardDate).toBe("2023-06-15");
    });

    it("should extract date from content in DD Month YYYY format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Content Date Contract",
              content: "Contract awarded on 15 January 2024",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].awardDate).toBe("15 January 2024");
    });

    it("should extract date from content in YYYY-MM-DD format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "ISO Date Contract",
              content: "Award date: 2024-03-20",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].awardDate).toBe("2024-03-20");
    });

    it("should extract date from content in DD/MM/YYYY format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "UK Date Contract",
              content: "Published: 25/12/2023",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].awardDate).toBe("25/12/2023");
    });

    it("should fall back to current date when no date found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "No Date Contract",
              content: "Contract information without dates",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].awardDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("extractBuyer", () => {
    describe("known departments", () => {
      it("should identify Ministry of Defence", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "MoD Contract",
                content: "Contract awarded by Ministry of Defence",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Ministry of Defence");
      });

      it("should identify Department for Education", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Education Contract",
                content: "Department for Education school supplies",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Department for Education");
      });

      it("should identify Department of Health", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Health Contract",
                content: "Department of Health medical supplies",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Department of Health");
      });

      it("should identify Home Office", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Security Contract",
                content: "Home Office security services",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Home Office");
      });

      it("should identify NHS", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "NHS Contract",
                content: "NHS medical equipment contract",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("NHS");
      });

      it("should identify HMRC", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "HMRC Contract",
                content: "HMRC IT services contract",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("HMRC");
      });

      it("should identify Cabinet Office", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Cabinet Contract",
                content: "Cabinet Office procurement",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Cabinet Office");
      });

      it("should identify HM Treasury", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Treasury Contract",
                content: "HM Treasury consulting services",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("HM Treasury");
      });

      it("should identify Department for Transport", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Transport Contract",
                content: "Department for Transport rail services",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Department for Transport");
      });

      it("should identify Highways England", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Road Contract",
                content: "Highways England road maintenance",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Highways England");
      });
    });

    describe("awarded by pattern", () => {
      it("should extract buyer from 'awarded by' pattern", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Custom Buyer Contract",
                content: "Contract awarded by Local Council Authority",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Local Council Authority");
      });
    });

    describe("fallback", () => {
      it("should default to 'UK Government' when no department found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Unknown Buyer Contract",
                content: "Contract for various services",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("UK Government");
      });
    });

    describe("case insensitivity", () => {
      it("should match department names case-insensitively", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://contractsfinder.service.gov.uk/contract/12345",
                title: "Case Test Contract",
                content: "ministry of defence contract",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchGovernmentContracts("Test");
        expect(result.records[0].buyer).toBe("Ministry of Defence");
      });
    });
  });

  describe("extractContractTitle", () => {
    it("should use result title when not containing 'Contracts Finder'", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "IT Infrastructure Services",
              content: "Contract details here",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].contractTitle).toBe("IT Infrastructure Services");
    });

    it("should extract first sentence from content when title contains 'Contracts Finder'", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contracts Finder - Search Results",
              content: "Supply of office furniture. More details follow.",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records[0].contractTitle).toBe("Supply of office furniture");
    });

    it("should use entity name fallback when no good title available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contracts Finder - Results",
              content: "",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Acme Corp");
      expect(result.records[0].contractTitle).toBe("Contract involving Acme Corp");
    });

    it("should truncate very long first sentences", async () => {
      const longSentence = "A".repeat(250) + ". Second sentence.";
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contracts Finder",
              content: longSentence,
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test Corp");
      expect(result.records[0].contractTitle).toBe("Contract involving Test Corp");
    });
  });

  describe("deduplication", () => {
    it("should deduplicate contracts by URL", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contract A",
              content: "£100,000",
              score: 0.95,
            },
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contract A Duplicate",
              content: "£100,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records).toHaveLength(1);
    });

    it("should keep contracts with different URLs", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/11111",
              title: "Contract A",
              content: "£100,000",
              score: 0.95,
            },
            {
              url: "https://contractsfinder.service.gov.uk/contract/22222",
              title: "Contract B",
              content: "£200,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("should return empty arrays when safeAICall returns error", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
        isAIServiceError: true,
      });

      const result = await fetchGovernmentContracts("Test");
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

      const result = await fetchGovernmentContracts("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should return empty arrays when results is empty", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });
  });

  describe("source generation", () => {
    it("should create sources with contracts_finder sourceType", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Test Contract",
              content: "£50,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.sources[0].sourceType).toBe("contracts_finder");
    });

    it("should use result title for source title when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "IT Services Contract",
              content: "£50,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.sources[0].title).toBe("IT Services Contract");
    });

    it("should use fallback title when result title is empty", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "",
              content: "£50,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Acme Corp");
      expect(result.sources[0].title).toBe("Contracts Finder - Acme Corp");
    });

    it("should include accessedAt timestamp", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Test",
              content: "£50,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test");
      expect(result.sources[0].accessedAt).toBeDefined();
      expect(new Date(result.sources[0].accessedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });
  });

  describe("record structure", () => {
    it("should return records with all required fields", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Complete Contract",
              content: "Contract value £100,000 by Ministry of Defence",
              score: 0.9,
              published_date: "2024-01-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Supplier Ltd");
      const record = result.records[0];

      expect(record).toHaveProperty("contractTitle");
      expect(record).toHaveProperty("buyer");
      expect(record).toHaveProperty("supplier");
      expect(record).toHaveProperty("value");
      expect(record).toHaveProperty("awardDate");
      expect(record).toHaveProperty("sourceUrl");

      expect(typeof record.contractTitle).toBe("string");
      expect(typeof record.buyer).toBe("string");
      expect(typeof record.supplier).toBe("string");
      expect(typeof record.value).toBe("number");
      expect(typeof record.awardDate).toBe("string");
      expect(typeof record.sourceUrl).toBe("string");
    });

    it("should use entity name as supplier", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "Contract",
              content: "£100,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Specific Company Name Ltd");
      expect(result.records[0].supplier).toBe("Specific Company Name Ltd");
    });
  });
});
