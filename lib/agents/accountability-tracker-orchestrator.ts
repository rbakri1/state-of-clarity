/**
 * Accountability Tracker Orchestrator
 *
 * LangGraph orchestration for the accountability investigation pipeline.
 * Pipeline: Entity Classification → UK Profile Research → Corruption Analysis → Action List Generation → Quality Check
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { entityClassificationNode } from "./entity-classification-agent";
import { ukProfileResearchNode } from "./uk-profile-research-agent";
import { corruptionAnalysisNode } from "./corruption-analysis-agent";
import { actionListGenerationNode } from "./action-list-agent";
import { qualityCheckNode } from "./quality-check-agent";
import type {
  EntityType,
  UKProfileData,
  CorruptionScenario,
  ActionItem,
} from "../types/accountability";

/**
 * Callback interface for SSE streaming progress updates
 */
export interface AccountabilityCallbacks {
  onAgentStarted?: (agentName: string) => void;
  onAgentCompleted?: (agentName: string, durationMs: number) => void;
  onStageChanged?: (stage: string) => void;
  onError?: (error: Error) => void;
}

export interface AccountabilityState {
  targetEntity: string;
  investigationId: string;
  entityType: EntityType | null;
  profileData: UKProfileData | null;
  corruptionScenarios: CorruptionScenario[] | null;
  actionItems: ActionItem[] | null;
  qualityScore: number | null;
  qualityNotes: string[] | null;
  error: string | null;
  completedSteps: string[];
  callbacks: AccountabilityCallbacks | null;
}

export const AccountabilityStateAnnotation = Annotation.Root({
  targetEntity: Annotation<string>(),
  investigationId: Annotation<string>(),

  entityType: Annotation<EntityType | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  profileData: Annotation<UKProfileData | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  corruptionScenarios: Annotation<CorruptionScenario[] | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  actionItems: Annotation<ActionItem[] | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  qualityScore: Annotation<number | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  qualityNotes: Annotation<string[] | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  error: Annotation<string | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  completedSteps: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  callbacks: Annotation<AccountabilityCallbacks | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
});

/**
 * Create the Accountability Tracker LangGraph
 *
 * Pipeline: START → entity_classification → uk_profile_research → corruption_analysis → action_list_generation → quality_check → END
 */
export function createAccountabilityGraph() {
  const graph = new StateGraph(AccountabilityStateAnnotation)
    .addNode("entity_classification", entityClassificationNode)
    .addNode("uk_profile_research", ukProfileResearchNode)
    .addNode("corruption_analysis", corruptionAnalysisNode)
    .addNode("action_list_generation", actionListGenerationNode)
    .addNode("quality_check", qualityCheckNode)
    .addEdge(START, "entity_classification")
    .addEdge("entity_classification", "uk_profile_research")
    .addEdge("uk_profile_research", "corruption_analysis")
    .addEdge("corruption_analysis", "action_list_generation")
    .addEdge("action_list_generation", "quality_check")
    .addEdge("quality_check", END);

  return graph.compile();
}

export const accountabilityGraph = createAccountabilityGraph();

/**
 * Result type for the accountability report generation
 */
export interface AccountabilityReportResult {
  profileData: UKProfileData | null;
  corruptionScenarios: CorruptionScenario[] | null;
  actionItems: ActionItem[] | null;
  qualityScore: number | null;
  qualityNotes: string[] | null;
}

/**
 * Generate an accountability report for a target entity
 *
 * Runs the full pipeline: Entity Classification → UK Profile Research →
 * Corruption Analysis → Action List Generation → Quality Check
 *
 * @param targetEntity - The name of the entity to investigate
 * @param investigationId - The ID of the investigation in the database
 * @param callbacks - Optional callbacks for SSE streaming progress
 * @returns The generated accountability report data
 */
export async function generateAccountabilityReport(
  targetEntity: string,
  investigationId: string,
  callbacks?: AccountabilityCallbacks
): Promise<AccountabilityReportResult> {
  const startTime = Date.now();
  console.log(
    `[AccountabilityTracker] Starting report generation for: ${targetEntity}`
  );

  const initialState = {
    targetEntity,
    investigationId,
    entityType: null,
    profileData: null,
    corruptionScenarios: null,
    actionItems: null,
    qualityScore: null,
    qualityNotes: null,
    error: null,
    completedSteps: [],
    callbacks: callbacks ?? null,
  };

  try {
    const result = await accountabilityGraph.invoke(initialState);

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(
      `[AccountabilityTracker] Report generation completed in ${durationMs}ms`
    );

    return {
      profileData: result.profileData,
      corruptionScenarios: result.corruptionScenarios,
      actionItems: result.actionItems,
      qualityScore: result.qualityScore,
      qualityNotes: result.qualityNotes,
    };
  } catch (error) {
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.error(
      `[AccountabilityTracker] Report generation failed after ${durationMs}ms:`,
      error
    );

    if (callbacks?.onError && error instanceof Error) {
      callbacks.onError(error);
    }

    throw error;
  }
}
