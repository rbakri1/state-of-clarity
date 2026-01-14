/**
 * Accountability Tracker Orchestrator Unit Tests
 *
 * Tests for the full pipeline orchestration including graph compilation,
 * execution, callbacks, and error handling.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("@/lib/agents/entity-classification-agent", () => ({
  entityClassificationNode: vi.fn(),
}));

vi.mock("@/lib/agents/uk-profile-research-agent", () => ({
  ukProfileResearchNode: vi.fn(),
}));

vi.mock("@/lib/agents/corruption-analysis-agent", () => ({
  corruptionAnalysisNode: vi.fn(),
}));

vi.mock("@/lib/agents/action-list-agent", () => ({
  actionListGenerationNode: vi.fn(),
}));

vi.mock("@/lib/agents/quality-check-agent", () => ({
  qualityCheckNode: vi.fn(),
}));

import { entityClassificationNode } from "@/lib/agents/entity-classification-agent";
import { ukProfileResearchNode } from "@/lib/agents/uk-profile-research-agent";
import { corruptionAnalysisNode } from "@/lib/agents/corruption-analysis-agent";
import { actionListGenerationNode } from "@/lib/agents/action-list-agent";
import { qualityCheckNode } from "@/lib/agents/quality-check-agent";
import {
  createAccountabilityGraph,
  generateAccountabilityReport,
  type AccountabilityCallbacks,
  type AccountabilityState,
} from "@/lib/agents/accountability-tracker-orchestrator";
import type {
  UKProfileData,
  CorruptionScenario,
  ActionItem,
} from "@/lib/types/accountability";

function createMockProfileData(): UKProfileData {
  return {
    fullName: "Test Person",
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
      description: "Theoretical conflict scenario",
      mechanism: "Through undisclosed shareholdings",
      incentiveStructure: "Financial gain",
      enablingPositions: ["Director"],
      potentialConflicts: [],
      redFlags: ["Unusual patterns"],
      innocentExplanations: ["Legitimate business reasons"],
      riskLevel: "medium",
      detectionDifficulty: "moderate",
      historicalPrecedents: [],
    },
  ];
}

function createMockActionItems(): ActionItem[] {
  return [
    {
      actionId: "action-1",
      priority: 1,
      action: "Search Companies House",
      rationale: "Verify corporate relationships",
      dataSource: "Companies House",
      expectedEvidence: "Full list of directorships",
      estimatedTime: "1-2 hours",
      legalConsiderations: ["Public data"],
      relatedScenarios: ["scenario-1"],
    },
  ];
}

function setupMockAgents(options: {
  throwError?: string;
  throwInAgent?: string;
} = {}) {
  const mockProfile = createMockProfileData();
  const mockScenarios = createMockScenarios();
  const mockActionItems = createMockActionItems();

  (entityClassificationNode as Mock).mockImplementation(async (state: AccountabilityState) => {
    if (options.throwInAgent === "entity_classification") {
      throw new Error(options.throwError ?? "Entity classification failed");
    }
    state.callbacks?.onAgentStarted?.("entity_classification");
    state.callbacks?.onStageChanged?.("classifying");
    state.callbacks?.onAgentCompleted?.("entity_classification", 100);
    return {
      entityType: "individual" as const,
      completedSteps: ["entity_classification"],
    };
  });

  (ukProfileResearchNode as Mock).mockImplementation(async (state: AccountabilityState) => {
    if (options.throwInAgent === "uk_profile_research") {
      throw new Error(options.throwError ?? "UK profile research failed");
    }
    state.callbacks?.onAgentStarted?.("uk_profile_research");
    state.callbacks?.onStageChanged?.("researching");
    state.callbacks?.onAgentCompleted?.("uk_profile_research", 200);
    return {
      profileData: mockProfile,
      completedSteps: ["uk_profile_research"],
    };
  });

  (corruptionAnalysisNode as Mock).mockImplementation(async (state: AccountabilityState) => {
    if (options.throwInAgent === "corruption_analysis") {
      throw new Error(options.throwError ?? "Corruption analysis failed");
    }
    state.callbacks?.onAgentStarted?.("corruption_analysis");
    state.callbacks?.onStageChanged?.("analyzing");
    state.callbacks?.onAgentCompleted?.("corruption_analysis", 300);
    return {
      corruptionScenarios: mockScenarios,
      completedSteps: ["corruption_analysis"],
    };
  });

  (actionListGenerationNode as Mock).mockImplementation(async (state: AccountabilityState) => {
    if (options.throwInAgent === "action_list_generation") {
      throw new Error(options.throwError ?? "Action list generation failed");
    }
    state.callbacks?.onAgentStarted?.("action_list_generation");
    state.callbacks?.onStageChanged?.("generating");
    state.callbacks?.onAgentCompleted?.("action_list_generation", 400);
    return {
      actionItems: mockActionItems,
      completedSteps: ["action_list_generation"],
    };
  });

  (qualityCheckNode as Mock).mockImplementation(async (state: AccountabilityState) => {
    if (options.throwInAgent === "quality_check") {
      throw new Error(options.throwError ?? "Quality check failed");
    }
    state.callbacks?.onAgentStarted?.("quality_check");
    state.callbacks?.onStageChanged?.("checking");
    state.callbacks?.onAgentCompleted?.("quality_check", 500);
    return {
      qualityScore: 7.5,
      qualityNotes: ["Good data coverage", "All scenarios validated"],
      completedSteps: ["quality_check"],
    };
  });

  return { mockProfile, mockScenarios, mockActionItems };
}

describe("Accountability Tracker Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Graph Compilation", () => {
    it("should compile the graph without errors", () => {
      setupMockAgents();
      const graph = createAccountabilityGraph();
      expect(graph).toBeDefined();
    });

    it("should create a graph with invoke method", () => {
      setupMockAgents();
      const graph = createAccountabilityGraph();
      expect(typeof graph.invoke).toBe("function");
    });
  });

  describe("generateAccountabilityReport", () => {
    it("should return all expected fields", async () => {
      const { mockProfile, mockScenarios, mockActionItems } = setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result).toHaveProperty("profileData");
      expect(result).toHaveProperty("corruptionScenarios");
      expect(result).toHaveProperty("actionItems");
      expect(result).toHaveProperty("qualityScore");
      expect(result).toHaveProperty("qualityNotes");
    });

    it("should return correct profileData", async () => {
      const { mockProfile } = setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.profileData).toEqual(mockProfile);
    });

    it("should return correct corruptionScenarios", async () => {
      const { mockScenarios } = setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.corruptionScenarios).toEqual(mockScenarios);
    });

    it("should return correct actionItems", async () => {
      const { mockActionItems } = setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.actionItems).toEqual(mockActionItems);
    });

    it("should return correct qualityScore", async () => {
      setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.qualityScore).toBe(7.5);
    });

    it("should return correct qualityNotes", async () => {
      setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.qualityNotes).toEqual([
        "Good data coverage",
        "All scenarios validated",
      ]);
    });
  });

  describe("Callback Emissions", () => {
    it("should emit callbacks in correct order (5 agents)", async () => {
      setupMockAgents();
      const agentStartedOrder: string[] = [];
      const agentCompletedOrder: string[] = [];
      const stageChangedOrder: string[] = [];

      const callbacks: AccountabilityCallbacks = {
        onAgentStarted: (name) => agentStartedOrder.push(name),
        onAgentCompleted: (name) => agentCompletedOrder.push(name),
        onStageChanged: (stage) => stageChangedOrder.push(stage),
      };

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        callbacks
      );

      expect(agentStartedOrder).toEqual([
        "entity_classification",
        "uk_profile_research",
        "corruption_analysis",
        "action_list_generation",
        "quality_check",
      ]);

      expect(agentCompletedOrder).toEqual([
        "entity_classification",
        "uk_profile_research",
        "corruption_analysis",
        "action_list_generation",
        "quality_check",
      ]);

      expect(stageChangedOrder).toEqual([
        "classifying",
        "researching",
        "analyzing",
        "generating",
        "checking",
      ]);
    });

    it("should call onAgentStarted for all 5 agents", async () => {
      setupMockAgents();
      const onAgentStarted = vi.fn();

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        { onAgentStarted }
      );

      expect(onAgentStarted).toHaveBeenCalledTimes(5);
      expect(onAgentStarted).toHaveBeenNthCalledWith(1, "entity_classification");
      expect(onAgentStarted).toHaveBeenNthCalledWith(2, "uk_profile_research");
      expect(onAgentStarted).toHaveBeenNthCalledWith(3, "corruption_analysis");
      expect(onAgentStarted).toHaveBeenNthCalledWith(4, "action_list_generation");
      expect(onAgentStarted).toHaveBeenNthCalledWith(5, "quality_check");
    });

    it("should call onAgentCompleted with durations for all 5 agents", async () => {
      setupMockAgents();
      const onAgentCompleted = vi.fn();

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        { onAgentCompleted }
      );

      expect(onAgentCompleted).toHaveBeenCalledTimes(5);
      expect(onAgentCompleted).toHaveBeenNthCalledWith(
        1,
        "entity_classification",
        expect.any(Number)
      );
      expect(onAgentCompleted).toHaveBeenNthCalledWith(
        2,
        "uk_profile_research",
        expect.any(Number)
      );
      expect(onAgentCompleted).toHaveBeenNthCalledWith(
        3,
        "corruption_analysis",
        expect.any(Number)
      );
      expect(onAgentCompleted).toHaveBeenNthCalledWith(
        4,
        "action_list_generation",
        expect.any(Number)
      );
      expect(onAgentCompleted).toHaveBeenNthCalledWith(
        5,
        "quality_check",
        expect.any(Number)
      );
    });

    it("should call onStageChanged for all stages", async () => {
      setupMockAgents();
      const onStageChanged = vi.fn();

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        { onStageChanged }
      );

      expect(onStageChanged).toHaveBeenCalledTimes(5);
      expect(onStageChanged).toHaveBeenNthCalledWith(1, "classifying");
      expect(onStageChanged).toHaveBeenNthCalledWith(2, "researching");
      expect(onStageChanged).toHaveBeenNthCalledWith(3, "analyzing");
      expect(onStageChanged).toHaveBeenNthCalledWith(4, "generating");
      expect(onStageChanged).toHaveBeenNthCalledWith(5, "checking");
    });
  });

  describe("Error Handling", () => {
    it("should propagate error from first agent to onError callback", async () => {
      setupMockAgents({
        throwError: "Classification error",
        throwInAgent: "entity_classification",
      });
      const onError = vi.fn();

      await expect(
        generateAccountabilityReport(
          "Test Person",
          "investigation-123",
          { onError }
        )
      ).rejects.toThrow("Classification error");

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Classification error" })
      );
    });

    it("should propagate error from middle agent to onError callback", async () => {
      setupMockAgents({
        throwError: "Analysis failed",
        throwInAgent: "corruption_analysis",
      });
      const onError = vi.fn();

      await expect(
        generateAccountabilityReport(
          "Test Person",
          "investigation-123",
          { onError }
        )
      ).rejects.toThrow("Analysis failed");

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Analysis failed" })
      );
    });

    it("should propagate error from last agent to onError callback", async () => {
      setupMockAgents({
        throwError: "Quality check failed",
        throwInAgent: "quality_check",
      });
      const onError = vi.fn();

      await expect(
        generateAccountabilityReport(
          "Test Person",
          "investigation-123",
          { onError }
        )
      ).rejects.toThrow("Quality check failed");

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Quality check failed" })
      );
    });

    it("should still throw error when no onError callback provided", async () => {
      setupMockAgents({
        throwError: "Pipeline failed",
        throwInAgent: "uk_profile_research",
      });

      await expect(
        generateAccountabilityReport(
          "Test Person",
          "investigation-123"
        )
      ).rejects.toThrow("Pipeline failed");
    });
  });

  describe("Completed Steps", () => {
    it("should have all 5 agent names in completedSteps after success", async () => {
      setupMockAgents();

      let finalCompletedSteps: string[] = [];
      
      (qualityCheckNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        finalCompletedSteps = [...state.completedSteps];
        state.callbacks?.onAgentStarted?.("quality_check");
        state.callbacks?.onStageChanged?.("checking");
        state.callbacks?.onAgentCompleted?.("quality_check", 500);
        return {
          qualityScore: 7.5,
          qualityNotes: ["Good data coverage"],
          completedSteps: ["quality_check"],
        };
      });

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(finalCompletedSteps).toContain("entity_classification");
      expect(finalCompletedSteps).toContain("uk_profile_research");
      expect(finalCompletedSteps).toContain("corruption_analysis");
      expect(finalCompletedSteps).toContain("action_list_generation");
    });

    it("should accumulate completedSteps through the pipeline", async () => {
      const stepsAtEachStage: string[][] = [];
      
      (entityClassificationNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        stepsAtEachStage.push([...state.completedSteps]);
        return {
          entityType: "individual" as const,
          completedSteps: ["entity_classification"],
        };
      });

      (ukProfileResearchNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        stepsAtEachStage.push([...state.completedSteps]);
        return {
          profileData: createMockProfileData(),
          completedSteps: ["uk_profile_research"],
        };
      });

      (corruptionAnalysisNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        stepsAtEachStage.push([...state.completedSteps]);
        return {
          corruptionScenarios: createMockScenarios(),
          completedSteps: ["corruption_analysis"],
        };
      });

      (actionListGenerationNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        stepsAtEachStage.push([...state.completedSteps]);
        return {
          actionItems: createMockActionItems(),
          completedSteps: ["action_list_generation"],
        };
      });

      (qualityCheckNode as Mock).mockImplementation(async (state: AccountabilityState) => {
        stepsAtEachStage.push([...state.completedSteps]);
        return {
          qualityScore: 7.5,
          qualityNotes: [],
          completedSteps: ["quality_check"],
        };
      });

      await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(stepsAtEachStage[0]).toEqual([]);
      expect(stepsAtEachStage[1]).toContain("entity_classification");
      expect(stepsAtEachStage[2]).toContain("uk_profile_research");
      expect(stepsAtEachStage[3]).toContain("corruption_analysis");
      expect(stepsAtEachStage[4]).toContain("action_list_generation");
    });
  });

  describe("Work Without Callbacks", () => {
    it("should work correctly without any callbacks", async () => {
      setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123"
      );

      expect(result.profileData).toBeDefined();
      expect(result.corruptionScenarios).toBeDefined();
      expect(result.actionItems).toBeDefined();
      expect(result.qualityScore).toBe(7.5);
    });

    it("should work correctly with empty callbacks object", async () => {
      setupMockAgents();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        {}
      );

      expect(result.profileData).toBeDefined();
      expect(result.corruptionScenarios).toBeDefined();
      expect(result.actionItems).toBeDefined();
      expect(result.qualityScore).toBe(7.5);
    });

    it("should work correctly with partial callbacks", async () => {
      setupMockAgents();
      const onStageChanged = vi.fn();

      const result = await generateAccountabilityReport(
        "Test Person",
        "investigation-123",
        { onStageChanged }
      );

      expect(result.profileData).toBeDefined();
      expect(onStageChanged).toHaveBeenCalled();
    });
  });
});
