/**
 * Corruption Analysis Agent Unit Tests
 *
 * Tests for ethical validation and scenario generation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { queueMockResponse, resetAnthropicMocks } from "../../mocks/anthropic";

vi.mock("@anthropic-ai/sdk", async () => {
  const { MockAnthropic } = await import("../../mocks/anthropic");
  return {
    default: MockAnthropic,
  };
});

import { corruptionAnalysisNode } from "@/lib/agents/corruption-analysis-agent";
import type { AccountabilityState } from "@/lib/agents/accountability-tracker-orchestrator";
import type { CorruptionScenario, UKProfileData } from "@/lib/types/accountability";

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

function createValidScenarios(): CorruptionScenario[] {
  return [
    {
      scenarioId: "scenario-1",
      title: "Potential Conflict of Interest",
      description:
        "The individual could theoretically have undisclosed financial interests that might influence decisions.",
      mechanism: "Through undisclosed shareholdings or business interests",
      incentiveStructure: "Financial gain from favorable decisions",
      enablingPositions: ["Director", "Board Member"],
      potentialConflicts: [
        {
          description: "Director role may conflict with public duties",
          positionA: "Company Director",
          positionB: "Public Official",
          conflictType: "financial",
        },
      ],
      redFlags: ["Unusual patterns of decision-making", "Undisclosed meetings"],
      innocentExplanations: [
        "Decisions may be based on legitimate policy considerations",
        "Many similar patterns exist without wrongdoing",
      ],
      riskLevel: "medium",
      detectionDifficulty: "moderate",
      historicalPrecedents: [
        {
          name: "Example Case",
          year: 2020,
          description: "Similar situation investigated",
          outcome: "No wrongdoing found",
        },
      ],
    },
    {
      scenarioId: "scenario-2",
      title: "Theoretical Procurement Irregularity",
      description:
        "There might be potential for preferential treatment in contract allocation.",
      mechanism: "Through relationships with procurement officials",
      incentiveStructure: "Business advantage from favorable contracts",
      enablingPositions: ["Procurement Contact", "Contractor"],
      potentialConflicts: [
        {
          description: "Company may benefit from procurement decisions",
          positionA: "Company representative",
          positionB: "Procurement official",
          conflictType: "financial",
        },
      ],
      redFlags: ["High win rate on tenders", "Last-minute specification changes"],
      innocentExplanations: [
        "High win rate may reflect genuine expertise",
        "Specification changes may address real requirements",
      ],
      riskLevel: "low",
      detectionDifficulty: "moderate",
      historicalPrecedents: [],
    },
    {
      scenarioId: "scenario-3",
      title: "Possible Regulatory Influence",
      description:
        "The entity could theoretically have inappropriate influence over regulatory outcomes.",
      mechanism: "Through lobbying or advisory relationships",
      incentiveStructure: "Favorable regulatory treatment benefits business",
      enablingPositions: ["Lobbyist", "Industry Advisor"],
      potentialConflicts: [
        {
          description: "Advisory role may create conflicts",
          positionA: "Industry advisor",
          positionB: "Regulatory body",
          conflictType: "regulatory",
        },
      ],
      redFlags: ["Unusual access to decision-makers", "Favorable regulatory outcomes"],
      innocentExplanations: [
        "Engagement with regulators is normal business practice",
        "Outcomes may reflect legitimate industry needs",
      ],
      riskLevel: "medium",
      detectionDifficulty: "difficult",
      historicalPrecedents: [],
    },
  ];
}

describe("Corruption Analysis Agent", () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  describe("Scenario Count", () => {
    it("should return 3-5 CorruptionScenario objects with profile data", async () => {
      queueMockResponse(JSON.stringify(createValidScenarios()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBeGreaterThanOrEqual(3);
      expect(result.corruptionScenarios!.length).toBeLessThanOrEqual(5);
    });

    it("should return 3 generic scenarios for empty profile data", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBe(3);
    });

    it("should return 3 generic organization scenarios for empty org profile", async () => {
      const state = createTestState("Unknown Corp Ltd", {
        entityType: "organization",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBe(3);
    });
  });

  describe("Innocent Explanations Validation", () => {
    it("should ensure each scenario has non-empty innocentExplanations array", async () => {
      queueMockResponse(JSON.stringify(createValidScenarios()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      for (const scenario of result.corruptionScenarios!) {
        expect(scenario.innocentExplanations).toBeDefined();
        expect(Array.isArray(scenario.innocentExplanations)).toBe(true);
        expect(scenario.innocentExplanations.length).toBeGreaterThan(0);
      }
    });

    it("should add default innocentExplanations when LLM omits them", async () => {
      const scenariosWithoutInnocent = createValidScenarios().map((s) => ({
        ...s,
        innocentExplanations: [],
      }));
      queueMockResponse(JSON.stringify(scenariosWithoutInnocent));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      for (const scenario of result.corruptionScenarios!) {
        expect(scenario.innocentExplanations.length).toBeGreaterThan(0);
      }
    });

    it("should have innocentExplanations in generic scenarios", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      for (const scenario of result.corruptionScenarios!) {
        expect(scenario.innocentExplanations).toBeDefined();
        expect(scenario.innocentExplanations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Conditional Language", () => {
    it("should use conditional language (no direct accusations)", async () => {
      queueMockResponse(JSON.stringify(createValidScenarios()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      for (const scenario of result.corruptionScenarios!) {
        const descLower = scenario.description.toLowerCase();
        expect(descLower).not.toContain("is corrupt");
        expect(descLower).not.toContain("has committed");
        expect(descLower).not.toContain("has engaged in corruption");
      }
    });

    it("should use conditional language in generic scenarios", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      for (const scenario of result.corruptionScenarios!) {
        const descLower = scenario.description.toLowerCase();
        expect(descLower.includes("could") || 
               descLower.includes("might") || 
               descLower.includes("potential") ||
               descLower.includes("theoretical")).toBe(true);
      }
    });
  });

  describe("Sparse Profile Data", () => {
    it("should return generic scenarios with empty profile data", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBe(3);
    });

    it("should return generic scenarios when profile has no significant data", async () => {
      const sparseProfile: UKProfileData = {
        fullName: "Sparse Person",
        aliases: [],
        currentPositions: [],
        pastPositions: [],
        companiesHouseEntities: [],
        registerOfInterests: [],
        charityInvolvements: [],
        politicalDonations: [],
        governmentContracts: [],
        sources: [],
        dataCompleteness: {
          hasCompaniesHouse: false,
          hasRegisterOfInterests: false,
          hasCharityData: false,
          hasDonationsData: false,
          hasContractsData: false,
          completenessScore: 0,
        },
      };

      const state = createTestState("Sparse Person", {
        entityType: "individual",
        profileData: sparseProfile,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBe(3);
    });

    it("should return organization-specific generic scenarios for orgs", async () => {
      const state = createTestState("Unknown Corp", {
        entityType: "organization",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      const scenarioIds = result.corruptionScenarios!.map((s) => s.scenarioId);
      expect(scenarioIds.every((id) => id.startsWith("generic-org-"))).toBe(true);
    });
  });

  describe("Completed Steps", () => {
    it("should add 'corruption_analysis' to completedSteps with profile data", async () => {
      queueMockResponse(JSON.stringify(createValidScenarios()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.completedSteps).toContain("corruption_analysis");
    });

    it("should add 'corruption_analysis' to completedSteps with sparse data", async () => {
      const state = createTestState("Unknown Person", {
        entityType: "individual",
        profileData: null,
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.completedSteps).toContain("corruption_analysis");
    });
  });

  describe("Callbacks", () => {
    it("should call onAgentStarted callback if provided", async () => {
      const onAgentStarted = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        callbacks: {
          onAgentStarted,
          onAgentCompleted: vi.fn(),
        },
      });

      await corruptionAnalysisNode(state);

      expect(onAgentStarted).toHaveBeenCalledWith("corruption_analysis");
    });

    it("should call onAgentCompleted callback with duration", async () => {
      const onAgentCompleted = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        callbacks: {
          onAgentStarted: vi.fn(),
          onAgentCompleted,
        },
      });

      await corruptionAnalysisNode(state);

      expect(onAgentCompleted).toHaveBeenCalledWith(
        "corruption_analysis",
        expect.any(Number)
      );
    });

    it("should call onStageChanged callback with 'analyzing'", async () => {
      const onStageChanged = vi.fn();
      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: null,
        callbacks: {
          onStageChanged,
        },
      });

      await corruptionAnalysisNode(state);

      expect(onStageChanged).toHaveBeenCalledWith("analyzing");
    });

    it("should work without callbacks (optional)", async () => {
      queueMockResponse(JSON.stringify(createValidScenarios()));

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
        callbacks: null,
      });

      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.completedSteps).toContain("corruption_analysis");
    });
  });

  describe("Error Handling", () => {
    it("should return generic scenarios when JSON parse fails", async () => {
      queueMockResponse("This is not valid JSON");
      queueMockResponse("Still not valid JSON after retry");

      const state = createTestState("Test Person", {
        entityType: "individual",
        profileData: createMockProfileData(),
      });
      const result = await corruptionAnalysisNode(state);

      expect(result.corruptionScenarios).toBeDefined();
      expect(result.corruptionScenarios!.length).toBe(3);
      expect(result.completedSteps).toContain("corruption_analysis");
    });
  });
});
