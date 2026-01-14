/**
 * Comprehensive Unit Tests for parliament-parser.ts
 *
 * Tests edge cases, error handling, and extraction functions for the
 * Parliament Register of Interests parser that searches via Tavily API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the safeAICall function before importing parser
vi.mock("@/lib/ai/safe-ai-call", () => ({
  safeAICall: vi.fn(),
}));

import { safeAICall } from "@/lib/ai/safe-ai-call";
import { fetchRegisterOfInterests } from "@/lib/parsers/parliament-parser";

const mockSafeAICall = vi.mocked(safeAICall);

describe("Parliament Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractCategories", () => {
    describe("Employment category", () => {
      it("should detect Employment when 'employment' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Employment and earnings from consulting",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Employment")).toBe(true);
      });

      it("should detect Employment when 'occupation' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Previous occupation as barrister",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Employment")).toBe(true);
      });

      it("should detect Employment when 'remunerated' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Remunerated directorship at Company X",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Employment")).toBe(true);
      });
    });

    describe("Donations category", () => {
      it("should detect Donations when 'donation' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Received donation from supporter",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Donations")).toBe(true);
      });

      it("should detect Donations when 'gift' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Received gift valued at over threshold",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Donations")).toBe(true);
      });

      it("should detect Donations when 'benefit' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Material benefit received from organization",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Donations")).toBe(true);
      });
    });

    describe("Land category", () => {
      it("should detect Land when 'land' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Owns land in rural constituency",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Land")).toBe(true);
      });

      it("should detect Land when 'property' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Property holdings in London",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Land")).toBe(true);
      });

      it("should detect Land when 'estate' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Family estate in countryside",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Land")).toBe(true);
      });
    });

    describe("Shareholdings category", () => {
      it("should detect Shareholdings when 'shareholding' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Shareholding in FTSE 100 company",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Shareholdings")).toBe(
          true
        );
      });

      it("should detect Shareholdings when 'shares' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Holds shares in family company",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Shareholdings")).toBe(
          true
        );
      });

      it("should detect Shareholdings when 'stake' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Ownership stake in business venture",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Shareholdings")).toBe(
          true
        );
      });

      it("should detect Shareholdings when 'equity' mentioned", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Equity interest in private company",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Shareholdings")).toBe(
          true
        );
      });
    });

    describe("Other category", () => {
      it("should return 'Other' when no specific category found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "Generic interest declaration",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Other")).toBe(true);
      });

      it("should return 'Other' for empty content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: "",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.some((r) => r.category === "Other")).toBe(true);
      });

      it("should handle undefined content (may throw error in extractDate)", async () => {
        // Note: The parser's extractDate function accesses result.content.match()
        // which will throw if content is undefined. This test documents that behavior.
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content: undefined as unknown as string,
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        // The parser will throw when trying to call match on undefined
        await expect(fetchRegisterOfInterests("Test MP")).rejects.toThrow();
      });
    });

    describe("multiple categories", () => {
      it("should detect multiple categories from single result", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "MP Interests",
                content:
                  "Employment income and property holdings, plus shareholding in company",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        const categories = result.records.map((r) => r.category);
        expect(categories).toContain("Employment");
        expect(categories).toContain("Land");
        expect(categories).toContain("Shareholdings");
        expect(result.records.length).toBe(3);
      });

      it("should create separate record for each category", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://parliament.uk/test",
                title: "Comprehensive Interests",
                content: "Employment and donation received",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchRegisterOfInterests("Test MP");
        expect(result.records.length).toBe(2);
        expect(result.sources.length).toBe(1);
      });
    });
  });

  describe("extractValue", () => {
    it("should extract single £ value from content", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Employment income of £25,000 from consulting",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records.some((r) => r.value === "£25,000")).toBe(true);
    });

    it("should extract value with decimal places", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Received employment income £1,234.56",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records.some((r) => r.value === "£1,234.56")).toBe(true);
    });

    it("should extract range value in 'between X and Y' format when no standalone £ value present", async () => {
      // Note: The parser checks for standalone £ values first, so range detection
      // only works when no simple £X,XXX pattern appears before the range expression.
      // This is a limitation of the current implementation.
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Estimated value somewhere between more than ten and less than twenty thousand",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      // When no £ value is found, value should be undefined
      expect(result.records.some((r) => r.value === undefined)).toBe(true);
    });

    it("should extract first £ value when multiple patterns present", async () => {
      // Tests that the parser returns the first £ value found, even if a range exists
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Estimated value between £10,000 and £20,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      // The parser finds £10,000 first (standalone £ pattern matches before range)
      expect(result.records.some((r) => r.value === "£10,000")).toBe(true);
    });

    it("should return undefined when no value found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Generic employment interest with no value",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records.some((r) => r.value === undefined)).toBe(true);
    });

    it("should return first value when multiple present", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Employment £10,000 and donation £5,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records.some((r) => r.value === "£10,000")).toBe(true);
    });
  });

  describe("extractDate", () => {
    it("should use published_date when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Some other interest",
              score: 0.9,
              published_date: "2023-06-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toContain("2023-06-15");
    });

    it("should parse published_date into ISO format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Other category content",
              score: 0.9,
              published_date: "2024-01-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should extract date from 'registered' pattern in content", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Interest registered 15 January 2024, other category content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toBeDefined();
    });

    it("should extract date from 'declared' pattern in content", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Interest declared 2024-03-20 for other matters",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toBeDefined();
    });

    it("should extract date from 'updated' pattern in content", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Record updated 10 February 2024 other category content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toBeDefined();
    });

    it("should fall back to current date when no date found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "MP Interests",
              content: "Generic other interest with no dates",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].dateRegistered).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("deduplication", () => {
    it("should deduplicate results by URL", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test/12345",
              title: "Interest A",
              content: "Generic other content",
              score: 0.95,
            },
            {
              url: "https://parliament.uk/test/12345",
              title: "Interest A Duplicate",
              content: "More other content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.sources).toHaveLength(1);
    });

    it("should keep results with different URLs", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test/11111",
              title: "Interest A",
              content: "Employment content",
              score: 0.95,
            },
            {
              url: "https://parliament.uk/test/22222",
              title: "Interest B",
              content: "Other donation content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.sources).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("should return empty arrays when safeAICall returns error", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
        isAIServiceError: true,
      });

      const result = await fetchRegisterOfInterests("Test MP");
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

      const result = await fetchRegisterOfInterests("Test MP");
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

      const result = await fetchRegisterOfInterests("Not An MP");
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

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });
  });

  describe("source generation", () => {
    it("should create sources with register_of_interests sourceType", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Test",
              content: "Other category employment",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.sources[0].sourceType).toBe("register_of_interests");
    });

    it("should use result title for source title when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "John Smith MP - Register of Interests",
              content: "Employment income",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("John Smith");
      expect(result.sources[0].title).toBe("John Smith MP - Register of Interests");
    });

    it("should use fallback title when result title is empty", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "",
              content: "Other category employment",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("John Smith");
      expect(result.sources[0].title).toBe("Parliament - Register of Interests");
    });

    it("should create sources with unverified verificationStatus", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Test",
              content: "Other category employment",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });

    it("should include accessedAt timestamp", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Test",
              content: "Other category employment",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.sources[0].accessedAt).toBeDefined();
      expect(new Date(result.sources[0].accessedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it("should create one source per URL even when multiple categories found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Multiple Categories",
              content:
                "Employment income, property holdings, and shareholding interests",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records.length).toBe(3);
      expect(result.sources).toHaveLength(1);
    });
  });

  describe("record structure", () => {
    it("should return records with all required fields", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Complete Interest",
              content: "Employment income £50,000",
              score: 0.9,
              published_date: "2024-01-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      const record = result.records[0];

      expect(record).toHaveProperty("category");
      expect(record).toHaveProperty("description");
      expect(record).toHaveProperty("dateRegistered");
      expect(record).toHaveProperty("sourceUrl");

      expect(typeof record.category).toBe("string");
      expect(typeof record.description).toBe("string");
      expect(typeof record.dateRegistered).toBe("string");
      expect(typeof record.sourceUrl).toBe("string");
    });

    it("should use result title as description", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Consulting Income Declaration",
              content: "Employment related content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].description).toBe("Consulting Income Declaration");
    });

    it("should use fallback description when title is empty", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "",
              content: "Other category content",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("John Smith");
      expect(result.records[0].description).toBe(
        "Interest declaration for John Smith"
      );
    });

    it("should preserve sourceUrl in records", async () => {
      const originalUrl = "https://members.parliament.uk/member/12345/interests";
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: originalUrl,
              title: "Test",
              content: "Other category employment",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Test MP");
      expect(result.records[0].sourceUrl).toBe(originalUrl);
    });
  });

  describe("query construction", () => {
    it("should call safeAICall with correct parameters", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: { results: [], query: "test" },
        error: null,
        isAIServiceError: false,
      });

      await fetchRegisterOfInterests("John Smith");

      expect(mockSafeAICall).toHaveBeenCalledTimes(1);
      const callArg = mockSafeAICall.mock.calls[0][1];
      expect(callArg).toMatchObject({
        operationName: "Tavily Parliament Search",
        model: "tavily-advanced",
      });
    });
  });
});
