/**
 * Refinement System Types
 * 
 * Types for the 7 fixer agents that improve brief quality across scoring dimensions.
 */

/**
 * Seven scoring dimensions that fixer agents target
 */
export enum FixerType {
  firstPrinciplesCoherence = "firstPrinciplesCoherence",
  internalConsistency = "internalConsistency",
  evidenceQuality = "evidenceQuality",
  accessibility = "accessibility",
  objectivity = "objectivity",
  factualAccuracy = "factualAccuracy",
  biasDetection = "biasDetection",
}

/**
 * Priority levels for suggested edits
 */
export type EditPriority = "critical" | "high" | "medium" | "low";

/**
 * A single edit suggestion from a fixer agent
 */
export interface SuggestedEdit {
  section: string;
  originalText: string;
  suggestedText: string;
  rationale: string;
  priority: EditPriority;
}

/**
 * Result from a single fixer agent run
 */
export interface FixerResult {
  fixerType: FixerType;
  suggestedEdits: SuggestedEdit[];
  confidence: number;
  processingTime: number;
}

/**
 * Score before and after refinement
 */
export interface ScoreBeforeAfter {
  before: number;
  after: number;
  dimensionScores?: Record<FixerType, { before: number; after: number }>;
}

/**
 * A single refinement attempt record
 */
export interface RefinementAttempt {
  attemptNumber: number;
  fixersDeployed: FixerType[];
  editsMade: SuggestedEdit[];
  editsSkipped: Array<{ edit: SuggestedEdit; reason: string }>;
  scoreBeforeAfter: ScoreBeforeAfter;
  processingTime: number;
}

/**
 * Final result of the refinement loop
 */
export interface RefinementResult {
  finalBrief: string;
  finalScore: number;
  success: boolean;
  attempts: RefinementAttempt[];
  totalProcessingTime: number;
  warningReason?: string;
}

/**
 * Input for fixer agents
 */
export interface FixerInput {
  brief: string;
  dimensionScore: number;
  critique: string;
  sources?: Array<{
    url: string;
    title: string;
    content: string;
  }>;
}

/**
 * Consensus scoring result with dimension breakdown
 */
export interface DimensionScores {
  [FixerType.firstPrinciplesCoherence]: number;
  [FixerType.internalConsistency]: number;
  [FixerType.evidenceQuality]: number;
  [FixerType.accessibility]: number;
  [FixerType.objectivity]: number;
  [FixerType.factualAccuracy]: number;
  [FixerType.biasDetection]: number;
}

/**
 * Consensus scoring input for the fixer orchestrator
 */
export interface ConsensusResult {
  overallScore: number;
  dimensionScores: DimensionScores;
  critique: string;
  dimensionCritiques: Record<FixerType, string>;
}

/**
 * Result from edit reconciliation
 */
export interface ReconciliationResult {
  revisedBrief: string;
  editsApplied: SuggestedEdit[];
  editsSkipped: Array<{ edit: SuggestedEdit; reason: string }>;
}
