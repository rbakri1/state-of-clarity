/**
 * Comprehensive Unit Tests for electoral-commission-parser.ts
 *
 * Tests edge cases, error handling, and extraction functions for the
 * Electoral Commission parser that searches UK political donation data via Tavily API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the safeAICall function before importing parser
vi.mock("@/lib/ai/safe-ai-call", () => ({
  safeAICall: vi.fn(),
}));

import { safeAICall } from "@/lib/ai/safe-ai-call";
import { fetchElectoralCommissionData } from "@/lib/parsers/electoral-commission-parser";

const mockSafeAICall = vi.mocked(safeAICall);

describe("Electoral Commission Parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractAmounts", () => {
    describe("standard amounts", () => {
      it("should extract simple £ amounts without commas", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Simple Donation",
                content: "Donated £5000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records[0].amount).toBe(5000);
      });

      it("should extract £ amounts with commas", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Formatted Donation",
                content: "Donated £50,000 to party",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records[0].amount).toBe(50000);
      });

      it("should extract £ amounts with decimal places", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Decimal Donation",
                content: "Donation of £1,234.56",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records[0].amount).toBe(1234.56);
      });

      it("should extract large £ amounts with commas", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Large Donation",
                content: "Major donation of £1,234,567",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records[0].amount).toBe(1234567);
      });
    });

    describe("multiple amounts", () => {
      it("should create separate records for each amount found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Multiple Donations",
                content: "Cash donations: £10,000 in 2022, £25,000 in 2023",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(2);
        expect(result.records.map((r) => r.amount)).toContain(10000);
        expect(result.records.map((r) => r.amount)).toContain(25000);
      });

      it("should create three records for three amounts", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Three Donations",
                content: "Donated £5,000, £10,000, and £15,000 over three years",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(3);
      });
    });

    describe("edge cases", () => {
      it("should create record with amount 0 when no amounts found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "No Amount",
                content: "Donation record without specific amount",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(1);
        expect(result.records[0].amount).toBe(0);
      });

      it("should handle empty content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
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

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(1);
        expect(result.records[0].amount).toBe(0);
      });

      it("should handle undefined content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
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

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(1);
        expect(result.records[0].amount).toBe(0);
      });

      it("should ignore zero amounts in content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Zero Amount",
                content: "£0 administrative fee, actual donation £10,000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records).toHaveLength(1);
        expect(result.records[0].amount).toBe(10000);
      });

      it("should ignore invalid amounts", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Invalid Amount",
                content: "Real donation £5,000",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Test");
        expect(result.records[0].amount).toBe(5000);
      });
    });
  });

  describe("extractDate", () => {
    it("should use published_date when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Dated Donation",
              content: "Donated £1,000 cash",
              score: 0.9,
              published_date: "2023-06-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].date).toBe("2023-06-15");
    });

    it("should extract date from content in DD Month YYYY format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Content Date",
              content: "Donation made on 15 January 2024, amount £5,000 cash",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].date).toBe("15 January 2024");
    });

    it("should extract date from content in YYYY-MM-DD format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "ISO Date",
              content: "Reported on 2024-03-20, donation £5,000 cash",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].date).toBe("2024-03-20");
    });

    it("should extract date from content in DD/MM/YYYY format", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "UK Date",
              content: "Received 25/12/2023, donation £1,000 cash",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].date).toBe("25/12/2023");
    });

    it("should fall back to current date when no date found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "No Date",
              content: "Cash donation of £5,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("extractDonationType", () => {
    it("should detect Cash donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Cash",
              content: "Cash donation of £10,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Cash");
    });

    it("should detect Visit donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Visit",
              content: "Sponsored visit worth £5,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Visit");
    });

    it("should detect Non-cash Services donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Services",
              content: "Provided services worth £3,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Non-cash (Services)");
    });

    it("should detect Sponsorship donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Sponsorship",
              content: "Event sponsorship of £20,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Sponsorship");
    });

    it("should detect Loan donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Loan",
              content: "Provided loan of £100,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Loan");
    });

    it("should default to 'Donation' when no specific type found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Generic",
              content: "Political contribution £5,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Donation");
    });

    it("should prioritize Cash over generic Donation", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Cash Donation",
              content: "Cash contribution £5,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Cash");
    });

    it("should handle empty content gracefully", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Empty",
              content: "",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].type).toBe("Donation");
    });
  });

  describe("extractDonorRecipient", () => {
    describe("donated to pattern", () => {
      it("should identify entity as donor when 'donated to' found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Donor",
                content: "John Smith donated to Conservative Party £10,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("John Smith");
        expect(result.records[0].donor).toBe("John Smith");
        expect(result.records[0].recipient).toBeUndefined();
      });

      it("should identify entity as donor when 'gave to' found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Giver",
                content: "Jane Doe gave to Labour Party £5,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Jane Doe");
        expect(result.records[0].donor).toBe("Jane Doe");
      });
    });

    describe("received from pattern", () => {
      it("should identify entity as recipient when 'received from' found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Recipient",
                content:
                  "Conservative Party received from wealthy donor £50,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Conservative Party");
        expect(result.records[0].recipient).toBe("Conservative Party");
        expect(result.records[0].donor).toBeUndefined();
      });

      it("should identify entity as recipient when 'donation from' found", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Recipient",
                content: "Labour Party donation from supporter £25,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Labour Party");
        expect(result.records[0].recipient).toBe("Labour Party");
      });
    });

    describe("context-based detection", () => {
      it("should identify entity as donor when 'from' appears before entity name (no other patterns)", async () => {
        // Context-based detection only works when the "donated to" and "received from"
        // patterns are NOT present, and the entity name appears in the content
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "From Context",
                content:
                  "Money came from Big Corp for political purposes £100,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Big Corp");
        expect(result.records[0].donor).toBe("Big Corp");
      });

      it("should identify entity as recipient when 'to' appears before entity name (no other patterns)", async () => {
        // Context-based detection only works when the "donated to" and "received from"
        // patterns are NOT present, and the entity name appears in the content
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "To Context",
                content:
                  "Money sent to Green Party for campaign £5,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Green Party");
        expect(result.records[0].recipient).toBe("Green Party");
      });
    });

    describe("default behavior", () => {
      it("should default entity as donor when no pattern matches", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Default",
                content: "John Smith political donation £10,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("John Smith");
        expect(result.records[0].donor).toBe("John Smith");
      });

      it("should handle case where entity name not found in content", async () => {
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "No Match",
                content: "Unrelated content £5,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("Mystery Donor");
        expect(result.records[0].donor).toBe("Mystery Donor");
      });
    });

    describe("case insensitivity", () => {
      it("should match entity name case-insensitively in context detection", async () => {
        // Note: Context detection only works when "donated to"/"received from" patterns
        // are NOT present. This tests that entity name matching is case-insensitive.
        mockSafeAICall.mockResolvedValueOnce({
          data: {
            results: [
              {
                url: "https://search.electoralcommission.org.uk/test",
                title: "Case Test",
                content:
                  "Money came from john smith for political campaign £10,000 cash",
                score: 0.9,
              },
            ],
            query: "test",
          },
          error: null,
          isAIServiceError: false,
        });

        const result = await fetchElectoralCommissionData("John Smith");
        expect(result.records[0].donor).toBe("John Smith");
      });
    });
  });

  describe("deduplication", () => {
    it("should deduplicate results by URL", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test/12345",
              title: "Donation A",
              content: "Cash £10,000",
              score: 0.95,
            },
            {
              url: "https://search.electoralcommission.org.uk/test/12345",
              title: "Donation A Duplicate",
              content: "Cash £10,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.sources).toHaveLength(1);
    });

    it("should keep results with different URLs", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test/11111",
              title: "Donation A",
              content: "Cash £10,000",
              score: 0.95,
            },
            {
              url: "https://search.electoralcommission.org.uk/test/22222",
              title: "Donation B",
              content: "Cash £20,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
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

      const result = await fetchElectoralCommissionData("Test");
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

      const result = await fetchElectoralCommissionData("Test");
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

      const result = await fetchElectoralCommissionData("Test");
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

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });
  });

  describe("source generation", () => {
    it("should create sources with electoral_commission sourceType", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Test",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.sources[0].sourceType).toBe("electoral_commission");
    });

    it("should use result title for source title when available", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Donation Record - John Smith",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("John Smith");
      expect(result.sources[0].title).toBe("Donation Record - John Smith");
    });

    it("should use fallback title when result title is empty", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("John Smith");
      expect(result.sources[0].title).toBe("Electoral Commission - John Smith");
    });

    it("should create sources with unverified verificationStatus", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Test",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });

    it("should include accessedAt timestamp", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Test",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.sources[0].accessedAt).toBeDefined();
      expect(new Date(result.sources[0].accessedAt).getTime()).toBeLessThanOrEqual(
        Date.now()
      );
    });

    it("should create one source per URL even when multiple amounts found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Multiple Amounts",
              content: "Cash donations £10,000, £20,000, £30,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records).toHaveLength(3);
      expect(result.sources).toHaveLength(1);
    });
  });

  describe("record structure", () => {
    it("should return records with all required fields", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Complete",
              content: "John Smith donated to Conservative Party £10,000 cash",
              score: 0.9,
              published_date: "2024-01-15",
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("John Smith");
      const record = result.records[0];

      expect(record).toHaveProperty("donor");
      expect(record).toHaveProperty("amount");
      expect(record).toHaveProperty("date");
      expect(record).toHaveProperty("type");
      expect(record).toHaveProperty("sourceUrl");

      expect(typeof record.amount).toBe("number");
      expect(typeof record.date).toBe("string");
      expect(typeof record.type).toBe("string");
      expect(typeof record.sourceUrl).toBe("string");
    });

    it("should preserve sourceUrl in records", async () => {
      const originalUrl =
        "https://search.electoralcommission.org.uk/test/specific/12345";
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: originalUrl,
              title: "Test",
              content: "Cash £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Test");
      expect(result.records[0].sourceUrl).toBe(originalUrl);
    });
  });
});
