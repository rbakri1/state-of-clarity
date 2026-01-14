/**
 * Entity Classification Agent Unit Tests
 *
 * Tests for classifying entities as individuals or organizations.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { queueMockResponse, resetAnthropicMocks } from "../../mocks/anthropic";

vi.mock("@anthropic-ai/sdk", async () => {
  const { MockAnthropic } = await import("../../mocks/anthropic");
  return {
    default: MockAnthropic,
  };
});

import { entityClassificationNode } from "@/lib/agents/entity-classification-agent";
import type { AccountabilityState } from "@/lib/agents/accountability-tracker-orchestrator";

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

describe("Entity Classification Agent", () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  describe("Individual Classification", () => {
    it("should classify 'Boris Johnson' as individual", async () => {
      queueMockResponse(
        JSON.stringify({
          entityType: "individual",
          confidence: 0.95,
          reasoning: "Name follows typical individual naming pattern",
        })
      );

      const state = createTestState("Boris Johnson");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("individual");
    });

    it("should default to 'individual' for ambiguous names", async () => {
      queueMockResponse(
        JSON.stringify({
          entityType: "unknown",
          confidence: 0.3,
          reasoning: "Cannot determine entity type",
        })
      );

      const state = createTestState("The Smith");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("individual");
    });

    it("should default to 'individual' when JSON parse fails", async () => {
      queueMockResponse("This is not valid JSON at all");

      const state = createTestState("Some Entity");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("individual");
    });
  });

  describe("Organization Classification by Suffix", () => {
    it("should classify 'Serco Ltd' as organization (detects Ltd suffix)", async () => {
      const state = createTestState("Serco Ltd");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });

    it("should classify 'John Smith PLC' as organization", async () => {
      const state = createTestState("John Smith PLC");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });

    it("should classify 'Acme Limited' as organization", async () => {
      const state = createTestState("Acme Limited");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });

    it("should classify 'Big Corp Corporation' as organization", async () => {
      const state = createTestState("Big Corp Corporation");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });

    it("should classify 'City Council' as organization", async () => {
      const state = createTestState("City Council");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });
  });

  describe("Organization Classification by LLM", () => {
    it("should classify organization via LLM when no suffix detected", async () => {
      queueMockResponse(
        JSON.stringify({
          entityType: "organization",
          confidence: 0.92,
          reasoning: "This is a well-known government department",
        })
      );

      const state = createTestState("Ministry of Defence");
      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("organization");
    });
  });

  describe("Completed Steps", () => {
    it("should add 'entity_classification' to completedSteps", async () => {
      queueMockResponse(
        JSON.stringify({
          entityType: "individual",
          confidence: 0.9,
          reasoning: "Individual name pattern",
        })
      );

      const state = createTestState("Jane Doe");
      const result = await entityClassificationNode(state);

      expect(result.completedSteps).toContain("entity_classification");
    });

    it("should add 'entity_classification' to completedSteps for organizations", async () => {
      const state = createTestState("Mega Corp Ltd");
      const result = await entityClassificationNode(state);

      expect(result.completedSteps).toContain("entity_classification");
    });
  });

  describe("Callbacks", () => {
    it("should call onAgentStarted callback if provided", async () => {
      const onAgentStarted = vi.fn();
      const state = createTestState("Test Entity Ltd", {
        callbacks: {
          onAgentStarted,
          onAgentCompleted: vi.fn(),
        },
      });

      await entityClassificationNode(state);

      expect(onAgentStarted).toHaveBeenCalledWith("entity_classification");
    });

    it("should call onAgentCompleted callback with duration", async () => {
      const onAgentCompleted = vi.fn();
      const state = createTestState("Test Entity Ltd", {
        callbacks: {
          onAgentStarted: vi.fn(),
          onAgentCompleted,
        },
      });

      await entityClassificationNode(state);

      expect(onAgentCompleted).toHaveBeenCalledWith(
        "entity_classification",
        expect.any(Number)
      );
    });

    it("should call onStageChanged callback with 'classifying'", async () => {
      const onStageChanged = vi.fn();
      queueMockResponse(
        JSON.stringify({
          entityType: "individual",
          confidence: 0.9,
          reasoning: "Individual name",
        })
      );

      const state = createTestState("John Doe", {
        callbacks: {
          onStageChanged,
        },
      });

      await entityClassificationNode(state);

      expect(onStageChanged).toHaveBeenCalledWith("classifying");
    });

    it("should work without callbacks (optional)", async () => {
      queueMockResponse(
        JSON.stringify({
          entityType: "individual",
          confidence: 0.9,
          reasoning: "Individual name",
        })
      );

      const state = createTestState("John Doe", { callbacks: null });

      const result = await entityClassificationNode(state);

      expect(result.entityType).toBe("individual");
    });
  });
});
