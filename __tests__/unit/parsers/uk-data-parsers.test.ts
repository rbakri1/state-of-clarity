/**
 * UK Data Parsers Unit Tests
 *
 * Tests for Tavily-based parsers: Charity Commission, Parliament, Electoral Commission, Contracts Finder.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the safeAICall function before importing parsers
vi.mock("@/lib/ai/safe-ai-call", () => ({
  safeAICall: vi.fn(),
}));

import { safeAICall } from "@/lib/ai/safe-ai-call";
import { fetchCharityCommissionData } from "@/lib/parsers/charity-commission-parser";
import { fetchRegisterOfInterests } from "@/lib/parsers/parliament-parser";
import { fetchElectoralCommissionData } from "@/lib/parsers/electoral-commission-parser";
import { fetchGovernmentContracts } from "@/lib/parsers/contracts-finder-parser";

const mockSafeAICall = vi.mocked(safeAICall);

describe("UK Data Parsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchCharityCommissionData", () => {
    it("should parse charity numbers from URLs with regId parameter", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=1234567",
              title: "Test Charity - Charity Commission",
              content: "John Smith is a trustee of this charity",
              score: 0.9,
            },
          ],
          query: '"John Smith" trustee site:register-of-charities.charitycommission.gov.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("John Smith");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].charityNumber).toBe("1234567");
      expect(result.records[0].charityName).toBe("Test Charity");
      expect(result.records[0].role).toBe("Trustee");
      expect(result.records[0].sourceUrl).toContain("regId=1234567");
    });

    it("should parse charity numbers from URLs with /charity/ path", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/9876543/overview",
              title: "Foundation for Good - Charity Commission",
              content: "Jane Doe serves as chair of this foundation",
              score: 0.85,
            },
          ],
          query: '"Jane Doe" trustee site:register-of-charities.charitycommission.gov.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Jane Doe");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].charityNumber).toBe("9876543");
      expect(result.records[0].role).toBe("Chair");
    });

    it("should return empty arrays when no results found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [],
          query: '"Unknown Person" trustee site:register-of-charities.charitycommission.gov.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Unknown Person");

      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should return empty arrays on API error", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: null,
        error: new Error("API error"),
        isAIServiceError: true,
      });

      const result = await fetchCharityCommissionData("Test Person");

      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should deduplicate charities by charity number", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=1111111",
              title: "Duplicate Charity",
              content: "Trustee info",
              score: 0.9,
            },
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity/1111111/trustees",
              title: "Duplicate Charity - Trustees",
              content: "Same charity trustee page",
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
      expect(result.records[0].charityNumber).toBe("1111111");
    });

    it("should create sources with unverified status", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://register-of-charities.charitycommission.gov.uk/charity-details/?regId=5555555",
              title: "Verified Test Charity",
              content: "Director role",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchCharityCommissionData("Test");

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].sourceType).toBe("charity_commission");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });
  });

  describe("fetchRegisterOfInterests", () => {
    it("should parse Employment interest category", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://members.parliament.uk/member/12345/registeredinterests",
              title: "MP Name - Register of Interests",
              content:
                "Employment and earnings: Received remunerated directorship at Company X",
              score: 0.9,
              published_date: "2023-06-15",
            },
          ],
          query: '"MP Name" "register of interests" site:parliament.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("MP Name");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].category).toBe("Employment");
    });

    it("should parse Donations interest category", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://members.parliament.uk/member/12345/registeredinterests",
              title: "Test MP - Register of Interests",
              content:
                "Received donation from supporter, £5,000 gift for campaign",
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

    it("should parse Land interest category", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Land Owner MP",
              content: "Owns property in London, land holdings in rural estate",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Land Owner MP");

      expect(result.records.some((r) => r.category === "Land")).toBe(true);
    });

    it("should parse Shareholdings interest category", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Investor MP",
              content: "Shareholding in Tech Corp, equity stake in Finance Ltd",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Investor MP");

      expect(result.records.some((r) => r.category === "Shareholdings")).toBe(
        true
      );
    });

    it("should extract monetary values with £ symbol", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Money MP",
              content:
                "Employment: Received £25,000 for consulting, donation benefit received",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchRegisterOfInterests("Money MP");

      expect(result.records.some((r) => r.value === "£25,000")).toBe(true);
    });

    it("should return empty arrays when no results found", async () => {
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

    it("should create sources with unverified status", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://parliament.uk/test",
              title: "Test MP",
              content: "Some interest category employment",
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
      expect(result.sources[0].sourceType).toBe("register_of_interests");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });
  });

  describe("fetchElectoralCommissionData", () => {
    it("should extract £ amounts from content", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/donor/12345",
              title: "Donor Search Results",
              content: "Donated £50,000 to Conservative Party on 15 January 2023",
              score: 0.9,
              published_date: "2023-01-15",
            },
          ],
          query: '"John Donor" donations site:search.electoralcommission.org.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("John Donor");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].amount).toBe(50000);
    });

    it("should extract multiple £ amounts from single result", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/donor/12345",
              title: "Multiple Donations",
              content: "Cash donations: £10,000 in 2022, £25,000 in 2023, £5,000.50 recently",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Multi Donor");

      expect(result.records).toHaveLength(3);
      expect(result.records.map((r) => r.amount)).toContain(10000);
      expect(result.records.map((r) => r.amount)).toContain(25000);
      expect(result.records.map((r) => r.amount)).toContain(5000.5);
    });

    it("should detect Cash donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Cash Donation",
              content: "Cash donation of £1,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Cash Donor");

      expect(result.records[0].type).toBe("Cash");
    });

    it("should detect Services donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Services Donation",
              content: "Provided services worth £2,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Services Donor");

      expect(result.records[0].type).toBe("Non-cash (Services)");
    });

    it("should detect Sponsorship donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Sponsorship",
              content: "Provided sponsorship of £3,000 for event",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Sponsor");

      expect(result.records[0].type).toBe("Sponsorship");
    });

    it("should detect Loan donation type", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "Loan",
              content: "Provided loan of £100,000 to party",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Lender");

      expect(result.records[0].type).toBe("Loan");
    });

    it("should return empty arrays when no results found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("Unknown Donor");

      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should create record with amount 0 when no £ amounts found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://search.electoralcommission.org.uk/test",
              title: "No Amount",
              content: "Donation record without specific amount listed",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchElectoralCommissionData("No Amount Donor");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].amount).toBe(0);
    });

    it("should create sources with unverified status", async () => {
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

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].sourceType).toBe("electoral_commission");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });
  });

  describe("fetchGovernmentContracts", () => {
    it("should extract standard contract values", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/12345",
              title: "IT Services Contract",
              content:
                "Contract awarded to Acme Corp for £500,000 by Ministry of Defence",
              score: 0.9,
              published_date: "2023-03-20",
            },
          ],
          query: '"Acme Corp" site:contractsfinder.service.gov.uk',
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Acme Corp");

      expect(result.records).toHaveLength(1);
      expect(result.records[0].value).toBe(500000);
      expect(result.records[0].supplier).toBe("Acme Corp");
    });

    it("should extract £m million values", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/67890",
              title: "Major Infrastructure Contract",
              content: "Contract valued at £2.5m for construction services",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Builder Corp");

      expect(result.records[0].value).toBe(2500000);
    });

    it("should extract £ million values (word form)", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/11111",
              title: "Healthcare Contract",
              content: "Contract worth £10 million for NHS services",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Health Corp");

      expect(result.records[0].value).toBe(10000000);
    });

    it("should extract £bn billion values", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/22222",
              title: "Defence Contract",
              content: "Major defence contract valued at £1.5bn",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Defence Corp");

      expect(result.records[0].value).toBe(1500000000);
    });

    it("should extract buyer from known departments", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/33333",
              title: "Education Contract",
              content:
                "Department for Education awarded contract for £100,000 school supplies",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("School Supplies Ltd");

      expect(result.records[0].buyer).toBe("Department for Education");
    });

    it("should return empty arrays when no results found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Unknown Company");

      expect(result.records).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it("should set value to 0 when no amounts found", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/44444",
              title: "Mystery Contract",
              content: "Contract awarded, value not disclosed",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Secret Corp");

      expect(result.records[0].value).toBe(0);
    });

    it("should create sources with unverified status", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/55555",
              title: "Test Contract",
              content: "Contract for £50,000",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Test Corp");

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].sourceType).toBe("contracts_finder");
      expect(result.sources[0].verificationStatus).toBe("unverified");
    });

    it("should use entity name as supplier", async () => {
      mockSafeAICall.mockResolvedValueOnce({
        data: {
          results: [
            {
              url: "https://contractsfinder.service.gov.uk/contract/66666",
              title: "Supply Contract",
              content: "Contract for £75,000 supplies",
              score: 0.9,
            },
          ],
          query: "test",
        },
        error: null,
        isAIServiceError: false,
      });

      const result = await fetchGovernmentContracts("Specific Supplier Name Ltd");

      expect(result.records[0].supplier).toBe("Specific Supplier Name Ltd");
    });
  });
});
