/**
 * Question Classification Types
 *
 * Types for classifying questions to route to specialist agents
 * and optimize the brief generation pipeline.
 */

export type Domain =
  | "economics"
  | "healthcare"
  | "climate"
  | "education"
  | "defense"
  | "immigration"
  | "housing"
  | "justice"
  | "technology"
  | "governance"
  | "other";

export type ControversyLevel = "low" | "medium" | "high";

export type QuestionType = "factual" | "analytical" | "opinion" | "comparative";

export type TemporalScope = "historical" | "current" | "future" | "timeless";

export interface QuestionClassification {
  domain: Domain;
  controversyLevel: ControversyLevel;
  questionType: QuestionType;
  temporalScope: TemporalScope;
}
