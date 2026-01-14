/**
 * Accountability Tracker Orchestrator
 *
 * LangGraph orchestration for the accountability investigation pipeline.
 * Pipeline: Entity Classification → UK Profile Research → Corruption Analysis → Action List Generation → Quality Check
 */

import { Annotation } from "@langchain/langgraph";
import type {
  EntityType,
  UKProfileData,
  CorruptionScenario,
  ActionItem,
} from "../types/accountability";

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
});
