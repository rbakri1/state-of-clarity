/**
 * Action List Agent Unit Tests
 *
 * Tests for action item validation and generation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { queueMockResponse, resetAnthropicMocks } from "../../mocks/anthropic";

vi.mock("@anthropic-ai/sdk", async () => {
  const { MockAnthropic } = await import("../../mocks/anthropic");
  return {
    default: MockAnthropic,
  };
});

import { actionListGenerationNode } from "@/lib/agents/action-list-agent";
import type { AccountabilityState } from "@/lib/agents/accountability-tracker-orchestrator";
import type { ActionItem, CorruptionScenario, UKProfileData } from "@/lib/types/accountability";

function createTestState(
  targetEntity: string,
  overrides: Partial<AccountabilityState> = {}
): AccountabilityState {
  return {
    targetEntity,
    investigationId: "test-investigation-123",
    entityType: null,
    profileData: null,
    corruptionScenarios: null,
    actionItems: null,
    qualityScore: null,
    qualityNotes: null,
    error: null,
    completedSteps: [],
    callbacks: null,
    ...overrides,
  };
}

function createMockProfileData(): UKProfileData {
  return {
    fullName: "Test Person",
    aliases: [],
    currentPositions: [
      {
        title: "Director",
        organization: "Test Company Ltd",
        startDate: "2020-01-01",
        description: "Managing director",
        sourceUrl: "https://example.com/source",
      },
    ],
    pastPositions: [],
    companiesHouseEntities: [
      {
        companyNumber: "12345678",
        companyName: "Test Company Ltd",
        role: "Director",
        appointedOn: "2020-01-01",
        companyStatus: "Active",
        sourceUrl: "https://beta.companieshouse.gov.uk/company/12345678",
      },
    ],
    registerOfInterests: [],
    charityInvolvements: [],
    politicalDonations: [],
    governmentContracts: [],
    sources: [],
    dataCompleteness: {
      hasCompaniesHouse: true,
      hasRegisterOfInterests: false,
      hasCharityData: false,
      hasDonationsData: false,
      hasContractsData: false,
      completenessScore: 0.2,
    },
  };
}

function createMockScenarios(): CorruptionScenario[] {
  return [
    {
      scenarioId: "scenario-1",
      title: "Potential Conflict of Interest",
      description: "The individual could theoretically have undisclosed financial interests.",
      mechanism: "Through undisclosed shareholdings",
      incentiveStructure: "Financial gain",
      enablingPositions: ["Director"],
      potentialConflicts: [
        {
          description: "Director role may conflict with public duties",
          positionA: "Company Director",
          positionB: "Public Official",
          conflictType: "financial",
        },
      ],
      redFlags: ["Unusual patterns"],
      innocentExplanations: ["Decisions may be based on legitimate considerations"],
      riskLevel: "medium",
      detectionDifficulty: "moderate",
      historicalPrecedents: [],
    },
    {
      scenarioId: "scenario-2",
      title: "Theoretical Procurement Irregularity",
      description: "There might be potential for preferential treatment.",
      mechanism: "Through relationships",
      incentiveStructure: "Business advantage",
      enablingPositions: ["Procurement Contact"],
      potentialConflicts: [],
      redFlags: ["High win rate"],
      innocentExplanations: ["High win rate may reflect genuine expertise"],
      riskLevel: "low",
      detectionDifficulty: "moderate",
      historicalPrecedents: [],
    },
    {
      scenarioId: "scenario-3",
      title: "Possible Regulatory Influence",
      description: "The entity could theoretically have inappropriate influence.",
      mechanism: "Through lobbying",
      incentiveStructure: "Favorable regulatory treatment",
      enablingPositions: ["Lobbyist"],
      potentialConflicts: [],
      redFlags: ["Unusual access"],
      innocentExplanations: ["Engagement with regulators is normal"],
      riskLevel: "medium",
      detectionDifficulty: "difficult",
      historicalPrecedents: [],
    },
  ];
}

function createValidActionItems(): ActionItem[] {
  return [
    {
      actionId: "action-1",
      priority: 1,
      action: "Search Companies House for all directorships and shareholdings",
      rationale: "Companies House provides verified corporate data",
      dataSource: "Companies House",
      expectedEvidence: "Full list of corporate relationships",
      estimatedTime: "1-2 hours",
      legalConsiderations: ["All data is public"],
      relatedScenarios: ["scenario-1"],
    },
    {
      actionId: "action-2",
      priority: 1,
      action: "Submit Freedom of Information request for meeting logs",
      rationale: "FOI requests reveal communications",
      dataSource: "WhatDoTheyKnow",
      expectedEvidence: "Meeting schedules",
      estimatedTime: "20 working days",
      legalConsiderations: ["Subject to exemptions"],
      relatedScenarios: ["scenario-1", "scenario-2"],
    },
    {
      actionId: "action-3",
      priority: 1,
      action: "Search Parliament Register of Interests for declared interests",
      rationale: "MPs must declare financial interests",
      dataSource: "Parliament UK",
      expectedEvidence: "Declared shareholdings",
      estimatedTime: "30 minutes",
      legalConsiderations: ["Public information"],
      relatedScenarios: ["scenario-1"],
    },
    {
      actionId: "action-4",
      priority: 2,
      action: "Search Electoral Commission database for donations",
      rationale: "Donations over £500 must be reported",
      dataSource: "Electoral Commission",
      expectedEvidence: "Donation amounts and dates",
      estimatedTime: "1 hour",
      legalConsiderations: ["Public register"],
      relatedScenarios: ["scenario-2"],
    },
    {
      actionId: "action-5",
      priority: 2,
      action: "Search Land Registry for property ownership records",
      rationale: "Property holdings may reveal undisclosed wealth",
      dataSource: "HM Land Registry",
      expectedEvidence: "Property ownership details",
      estimatedTime: "2-3 hours",
      legalConsiderations: ["£3 fee per search"],
      relatedScenarios: ["scenario-2"],
    },
    {
      actionId: "action-6",
      priority: 2,
      action: "Search Contracts Finder for government contracts",
      rationale: "Government contracts may reveal conflicts",
      dataSource: "Contracts Finder",
      expectedEvidence: "Contract values and dates",
      estimatedTime: "2 hours",
      legalConsiderations: ["Public database"],
      relatedScenarios: ["scenario-2", "scenario-3"],
    },
    {
      actionId: "action-7",
      priority: 2,
      action: "Search Charity Commission for trustee positions",
      rationale: "Charity involvement may reveal interests",
      dataSource: "Charity Commission",
      expectedEvidence: "Trustee appointments",
      estimatedTime: "1-2 hours",
      legalConsiderations: ["Public register"],
      relatedScenarios: ["scenario-1"],
    },
    {
      actionId: "action-8",
      priority: 3,
      action: "Search Hansard for parliamentary statements",
      rationale: "Parliamentary record may reveal positions",
      dataSource: "Hansard",
      expectedEvidence: "Speeches and voting records",
      estimatedTime: "4-6 hours",
      legalConsiderations: ["Public parliamentary record"],
      relatedScenarios: ["scenario-3"],
    },
    {
      actionId: "action-9",
      priority: 3,
      action: "Search court records for litigation history",
      rationale: "Court cases may reveal disputes",
      dataSource: "BAILII",
      expectedEvidence: "Case details",
      estimatedTime: "3-4 hours",
      legalConsiderations: ["Some cases restricted"],
      relatedScenarios: ["scenario-3"],
    },
    {
      actionId: "action-10",
      priority: 3,
      action: "Search international registries for overseas interests",
      rationale: "Offshore structures may obscure ownership",
      dataSource: "OpenCorporates",
      expectedEvidence: "Foreign company registrations",
      estimatedTime: "2-3 hours",
      legalConsiderations: ["Coverage varies"],
      relatedScenarios: ["scenario-1", "scenario-2", "scenario-3"],
    },
  ];
}

describe("Action List Agent", () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  describe("Action Item Count", () => {
    it("should return 8-15 ActionItem objects with profile data", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      expect(result.actionItems).toBeDefined();
      expect(result.actionItems!.length).toBeGreaterThanOrEqual(8);
      expect(result.actionItems!.length).toBeLessThanOrEqual(15);
    });

    it("should return 10 default items for sparse profile data", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
      });
      const result = await actionListGenerationNode(state);

      expect(result.actionItems).toBeDefined();
      expect(result.actionItems!.length).toBe(10);
    });

    it("should return 10 default items for empty corruption scenarios", async () => {
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: [],
      });
      const result = await actionListGenerationNode(state);

      expect(result.actionItems).toBeDefined();
      expect(result.actionItems!.length).toBe(10);
    });
  });

  describe("Priority Balance", () => {
    it("should have items across priorities 1, 2, and 3", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      const priorities = result.actionItems!.map((item) => item.priority);
      expect(priorities).toContain(1);
      expect(priorities).toContain(2);
      expect(priorities).toContain(3);
    });

    it("should have balanced priorities in default items", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
      });
      const result = await actionListGenerationNode(state);

      const priorityCounts = { 1: 0, 2: 0, 3: 0 };
      for (const item of result.actionItems!) {
        if (item.priority >= 1 && item.priority <= 3) {
          priorityCounts[item.priority as 1 | 2 | 3]++;
        }
      }

      expect(priorityCounts[1]).toBeGreaterThan(0);
      expect(priorityCounts[2]).toBeGreaterThan(0);
      expect(priorityCounts[3]).toBeGreaterThan(0);
      expect(priorityCounts[1] / result.actionItems!.length).toBeLessThanOrEqual(0.6);
    });
  });

  describe("Banned Words Validation", () => {
    it("should not contain banned words (hack, bribe, stalk, harass, threaten)", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      const bannedWords = ["hack", "bribe", "stalk", "harass", "threaten"];
      for (const item of result.actionItems!) {
        const actionLower = item.action.toLowerCase();
        const rationaleLower = item.rationale.toLowerCase();
        for (const banned of bannedWords) {
          expect(actionLower).not.toContain(banned);
          expect(rationaleLower).not.toContain(banned);
        }
      }
    });

    it("should filter out action items with banned words", async () => {
      const itemsWithBannedWords: ActionItem[] = [
        ...createValidActionItems().slice(0, 5),
        {
          actionId: "bad-action",
          priority: 1,
          action: "Hack into their email system",
          rationale: "This would reveal hidden communications",
          dataSource: "Illegal access",
          expectedEvidence: "Private emails",
          relatedScenarios: ["scenario-1"],
        },
      ];
      queueMockResponse(JSON.stringify(itemsWithBannedWords));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      for (const item of result.actionItems!) {
        expect(item.action.toLowerCase()).not.toContain("hack");
      }
    });

    it("should default items do not contain banned words", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
      });
      const result = await actionListGenerationNode(state);

      const bannedWords = ["hack", "bribe", "stalk", "harass", "threaten"];
      for (const item of result.actionItems!) {
        const actionLower = item.action.toLowerCase();
        const rationaleLower = item.rationale.toLowerCase();
        for (const banned of bannedWords) {
          expect(actionLower).not.toContain(banned);
          expect(rationaleLower).not.toContain(banned);
        }
      }
    });
  });

  describe("Related Scenarios", () => {
    it("should ensure each item has relatedScenarios field", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      for (const item of result.actionItems!) {
        expect(item.relatedScenarios).toBeDefined();
        expect(Array.isArray(item.relatedScenarios)).toBe(true);
      }
    });

    it("should add default relatedScenarios when LLM omits them", async () => {
      const itemsWithoutScenarios = createValidActionItems().map((item) => ({
        ...item,
        relatedScenarios: [],
      }));
      queueMockResponse(JSON.stringify(itemsWithoutScenarios));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      for (const item of result.actionItems!) {
        expect(item.relatedScenarios).toBeDefined();
        expect(item.relatedScenarios.length).toBeGreaterThan(0);
      }
    });

    it("should have relatedScenarios in default items", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      for (const item of result.actionItems!) {
        expect(item.relatedScenarios).toBeDefined();
        expect(Array.isArray(item.relatedScenarios)).toBe(true);
      }
    });
  });

  describe("Completed Steps", () => {
    it("should add 'action_list_generation' to completedSteps with profile data", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      expect(result.completedSteps).toContain("action_list_generation");
    });

    it("should add 'action_list_generation' to completedSteps with sparse data", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
      });
      const result = await actionListGenerationNode(state);

      expect(result.completedSteps).toContain("action_list_generation");
    });
  });

  describe("Callbacks", () => {
    it("should call onAgentStarted callback if provided", async () => {
      const onAgentStarted = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
        callbacks: {
          onAgentStarted,
          onAgentCompleted: vi.fn(),
        },
      });

      await actionListGenerationNode(state);

      expect(onAgentStarted).toHaveBeenCalledWith("action_list_generation");
    });

    it("should call onAgentCompleted callback with duration", async () => {
      const onAgentCompleted = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
        callbacks: {
          onAgentStarted: vi.fn(),
          onAgentCompleted,
        },
      });

      await actionListGenerationNode(state);

      expect(onAgentCompleted).toHaveBeenCalledWith(
        "action_list_generation",
        expect.any(Number)
      );
    });

    it("should call onStageChanged callback with 'generating'", async () => {
      const onStageChanged = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        corruptionScenarios: null,
        callbacks: {
          onStageChanged,
        },
      });

      await actionListGenerationNode(state);

      expect(onStageChanged).toHaveBeenCalledWith("generating");
    });

    it("should work without callbacks (optional)", async () => {
      queueMockResponse(JSON.stringify(createValidActionItems()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
        callbacks: null,
      });

      const result = await actionListGenerationNode(state);

      expect(result.actionItems).toBeDefined();
      expect(result.completedSteps).toContain("action_list_generation");
    });
  });

  describe("Error Handling", () => {
    it("should return default items when JSON parse fails", async () => {
      queueMockResponse("This is not valid JSON");
      queueMockResponse("Still not valid JSON after retry");

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      expect(result.actionItems).toBeDefined();
      expect(result.actionItems!.length).toBe(10);
      expect(result.completedSteps).toContain("action_list_generation");
    });

    it("should supplement with default items when fewer than 8 valid items", async () => {
      const fewItems = createValidActionItems().slice(0, 3);
      queueMockResponse(JSON.stringify(fewItems));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        corruptionScenarios: createMockScenarios(),
      });
      const result = await actionListGenerationNode(state);

      expect(result.actionItems!.length).toBeGreaterThanOrEqual(8);
    });
  });
});
