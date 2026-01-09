/**
 * Quality Gate Types
 *
 * Types for the tiered quality gate system that determines:
 * - Whether a brief is publishable
 * - Whether it needs a quality warning badge
 * - Whether credits should be refunded
 */

export enum QualityTier {
  HIGH = "high",
  ACCEPTABLE = "acceptable",
  FAILED = "failed",
}

export interface QualityGateResult {
  tier: QualityTier;
  finalScore: number;
  attempts: number;
  publishable: boolean;
  warningBadge: boolean;
  refundRequired: boolean;
}

export interface RetryQueueItem {
  id: string;
  briefId: string;
  originalQuestion: string;
  classification: Record<string, unknown>;
  failureReason: string;
  retryParams: RetryParams;
  scheduledAt: Date;
  attempts: number;
  status: RetryStatus;
  createdAt: Date;
}

export interface RetryParams {
  specialistPersona?: string;
  adjustedPrompts?: string[];
  increasedSourceDiversity?: boolean;
  forceOpposingViews?: boolean;
  minSources?: number;
}

export type RetryStatus = "pending" | "processing" | "completed" | "abandoned";

export function getQualityTier(score: number): QualityTier {
  if (score >= 8.0) return QualityTier.HIGH;
  if (score >= 6.0) return QualityTier.ACCEPTABLE;
  return QualityTier.FAILED;
}

export function createQualityGateResult(
  score: number,
  attempts: number
): QualityGateResult {
  const tier = getQualityTier(score);

  return {
    tier,
    finalScore: score,
    attempts,
    publishable: tier !== QualityTier.FAILED,
    warningBadge: tier === QualityTier.ACCEPTABLE,
    refundRequired: tier === QualityTier.FAILED,
  };
}
