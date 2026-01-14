/**
 * Tiebreaker Agent Unit Tests
 *
 * Tests for the Arbiter evaluator that resolves disagreements
 * among primary evaluators.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';

// Mock Anthropic before importing the tiebreaker agent
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

import {
  runTiebreaker,
  TiebreakerInput,
  TiebreakerOutput,
  ARBITER_WEIGHT_MULTIPLIER,
} from '@/lib/agents/tiebreaker-agent';
import type { EvaluatorVerdict, DisagreementResult, DimensionName } from '@/lib/types/clarity-scoring';

describe('Tiebreaker Agent', () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  const createMockVerdict = (
    role: string,
    overallScore: number,
    dimensionScores: Record<DimensionName, number>
  ): EvaluatorVerdict => ({
    evaluatorRole: role,
    overallScore,
    dimensionScores: Object.entries(dimensionScores).map(([dimension, score]) => ({
      dimension: dimension as DimensionName,
      score,
      reasoning: `${role}'s assessment of ${dimension}`,
      issues: [],
    })),
    issues: [],
    critique: `${role}'s overall critique`,
    confidence: 0.85,
    evaluatedAt: new Date().toISOString(),
  });

  const createMockDisagreement = (
    dimensions: DimensionName[],
    maxSpread: number
  ): DisagreementResult => ({
    hasDisagreement: true,
    disagreeingDimensions: dimensions,
    maxSpread,
    details: dimensions.map((dim) => ({
      dimension: dim,
      scores: [6.0, 8.0, 7.0],
      spread: 2.0,
    })),
  });

  describe('Arbiter Resolution', () => {
    it('should resolve disputed dimensions', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'What is the impact of inflation?',
          narrative: 'A detailed analysis of inflation effects...',
        },
        verdicts: [
          createMockVerdict('Skeptic', 6.5, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 8.0,
            evidenceQuality: 5.0, // Low score
            accessibility: 7.5,
            objectivity: 6.0,
            factualAccuracy: 7.0,
            biasDetection: 6.5,
          }),
          createMockVerdict('Advocate', 8.0, {
            firstPrinciplesCoherence: 8.0,
            internalConsistency: 8.5,
            evidenceQuality: 8.5, // High score - disagreement!
            accessibility: 8.0,
            objectivity: 7.5,
            factualAccuracy: 8.0,
            biasDetection: 7.5,
          }),
          createMockVerdict('Generalist', 7.0, {
            firstPrinciplesCoherence: 7.5,
            internalConsistency: 8.0,
            evidenceQuality: 6.5,
            accessibility: 7.5,
            objectivity: 7.0,
            factualAccuracy: 7.5,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 3.5),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [
              { evaluator: 'Skeptic', score: 5.0, reasoning: 'Insufficient primary sources' },
              { evaluator: 'Advocate', score: 8.5, reasoning: 'Good source diversity' },
              { evaluator: 'Generalist', score: 6.5, reasoning: 'Mixed quality' },
            ],
            strongerArgument: 'The Skeptic raises valid points about source verification',
            definitiveScore: 6.5,
            resolution: 'Score reflects need for better source verification',
          },
        ],
        otherDimensions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.5, reasoning: 'Solid structure' },
          { dimension: 'internalConsistency', score: 8.0, reasoning: 'No contradictions' },
          { dimension: 'accessibility', score: 7.5, reasoning: 'Clear language' },
          { dimension: 'objectivity', score: 7.0, reasoning: 'Generally balanced' },
          { dimension: 'factualAccuracy', score: 7.5, reasoning: 'Mostly accurate' },
          { dimension: 'biasDetection', score: 7.0, reasoning: 'Minor issues' },
        ],
        overallCritique: 'A comprehensive brief with room for improvement in evidence quality.',
        resolutionSummary: 'Resolved evidence quality dispute in favor of moderate score.',
        confidence: 0.88,
      }));

      const result = await runTiebreaker(input);

      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('resolutionSummary');
      expect(result).toHaveProperty('durationMs');
      expect(result.verdict.evaluatorRole).toBe('Arbiter');
    });

    it('should include resolution reasoning for disputed dimensions', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test question',
          narrative: 'Test narrative',
        },
        verdicts: [
          createMockVerdict('Skeptic', 6.0, {
            firstPrinciplesCoherence: 6.0,
            internalConsistency: 7.0,
            evidenceQuality: 5.0,
            accessibility: 7.0,
            objectivity: 5.5,
            factualAccuracy: 6.5,
            biasDetection: 5.0,
          }),
          createMockVerdict('Advocate', 8.5, {
            firstPrinciplesCoherence: 8.5,
            internalConsistency: 8.0,
            evidenceQuality: 8.5,
            accessibility: 8.0,
            objectivity: 8.0,
            factualAccuracy: 8.5,
            biasDetection: 8.0,
          }),
          createMockVerdict('Generalist', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.5,
            evidenceQuality: 7.0,
            accessibility: 7.5,
            objectivity: 6.5,
            factualAccuracy: 7.0,
            biasDetection: 6.5,
          }),
        ],
        disagreement: createMockDisagreement(['objectivity', 'biasDetection'], 3.0),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'objectivity',
            evaluatorPositions: [
              { evaluator: 'Skeptic', score: 5.5, reasoning: 'Shows political bias' },
              { evaluator: 'Advocate', score: 8.0, reasoning: 'Balanced perspectives' },
              { evaluator: 'Generalist', score: 6.5, reasoning: 'Some bias present' },
            ],
            strongerArgument: 'Both Skeptic and Generalist noted bias issues',
            definitiveScore: 6.5,
            resolution: 'Majority view of moderate objectivity is supported',
          },
          {
            dimension: 'biasDetection',
            evaluatorPositions: [
              { evaluator: 'Skeptic', score: 5.0, reasoning: 'Clear political framing' },
              { evaluator: 'Advocate', score: 8.0, reasoning: 'Minimal bias' },
              { evaluator: 'Generalist', score: 6.5, reasoning: 'Subtle bias present' },
            ],
            strongerArgument: 'Evidence of framing bias supports lower scores',
            definitiveScore: 6.0,
            resolution: 'Subtle but present bias requires lower score',
          },
        ],
        otherDimensions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, reasoning: 'Adequate' },
          { dimension: 'internalConsistency', score: 7.5, reasoning: 'Consistent' },
          { dimension: 'evidenceQuality', score: 7.0, reasoning: 'Acceptable' },
          { dimension: 'accessibility', score: 7.5, reasoning: 'Clear' },
          { dimension: 'factualAccuracy', score: 7.0, reasoning: 'Accurate' },
        ],
        overallCritique: 'Brief has quality issues in objectivity areas.',
        resolutionSummary: 'Resolved disputes favoring moderate-to-lower scores for bias dimensions.',
        confidence: 0.85,
      }));

      const result = await runTiebreaker(input);

      // Check that disputed dimensions have resolution in reasoning
      const objectivityScore = result.verdict.dimensionScores.find(
        (d) => d.dimension === 'objectivity'
      );
      expect(objectivityScore?.reasoning).toContain('[RESOLUTION]');
    });
  });

  describe('Weight Multiplier', () => {
    it('should export ARBITER_WEIGHT_MULTIPLIER constant', () => {
      expect(ARBITER_WEIGHT_MULTIPLIER).toBe(1.5);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate weighted overall score', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test narrative',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
          createMockVerdict('Advocate', 8.0, {
            firstPrinciplesCoherence: 8.0,
            internalConsistency: 8.0,
            evidenceQuality: 8.0,
            accessibility: 8.0,
            objectivity: 8.0,
            factualAccuracy: 8.0,
            biasDetection: 8.0,
          }),
          createMockVerdict('Generalist', 7.5, {
            firstPrinciplesCoherence: 7.5,
            internalConsistency: 7.5,
            evidenceQuality: 7.5,
            accessibility: 7.5,
            objectivity: 7.5,
            factualAccuracy: 7.5,
            biasDetection: 7.5,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [],
            strongerArgument: 'Test',
            definitiveScore: 7.5,
            resolution: 'Test resolution',
          },
        ],
        otherDimensions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.5, reasoning: 'Test' },
          { dimension: 'internalConsistency', score: 7.5, reasoning: 'Test' },
          { dimension: 'accessibility', score: 7.5, reasoning: 'Test' },
          { dimension: 'objectivity', score: 7.5, reasoning: 'Test' },
          { dimension: 'factualAccuracy', score: 7.5, reasoning: 'Test' },
          { dimension: 'biasDetection', score: 7.5, reasoning: 'Test' },
        ],
        overallCritique: 'Test critique',
        resolutionSummary: 'Test summary',
        confidence: 0.9,
      }));

      const result = await runTiebreaker(input);

      // Overall score should be calculated as weighted average
      expect(result.verdict.overallScore).toBeGreaterThan(0);
      expect(result.verdict.overallScore).toBeLessThanOrEqual(10);
    });
  });

  describe('Duration Tracking', () => {
    it('should track execution duration', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [],
            strongerArgument: 'Test',
            definitiveScore: 7.0,
            resolution: 'Test',
          },
        ],
        otherDimensions: [],
        overallCritique: 'Test',
        resolutionSummary: 'Test',
        confidence: 0.85,
      }));

      const result = await runTiebreaker(input);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.durationMs).toBe('number');
    });
  });

  describe('Discussion Summary Integration', () => {
    it('should include discussion summary when provided', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['objectivity'], 2.0),
        discussionSummary: 'The evaluators discussed objectivity at length...',
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'objectivity',
            evaluatorPositions: [],
            strongerArgument: 'Based on discussion',
            definitiveScore: 7.0,
            resolution: 'Resolution informed by discussion',
          },
        ],
        otherDimensions: [],
        overallCritique: 'Test',
        resolutionSummary: 'Resolution considered discussion points',
        confidence: 0.9,
      }));

      const result = await runTiebreaker(input);

      expect(result.resolutionSummary).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when JSON cannot be extracted', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      queueMockResponse('This is not JSON at all');

      await expect(runTiebreaker(input)).rejects.toThrow();
    });
  });

  describe('Verdict Properties', () => {
    it('should set evaluatorRole to Arbiter', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [],
            strongerArgument: 'Test',
            definitiveScore: 7.0,
            resolution: 'Test',
          },
        ],
        otherDimensions: [],
        overallCritique: 'Test critique',
        resolutionSummary: 'Test',
        confidence: 0.85,
      }));

      const result = await runTiebreaker(input);

      expect(result.verdict.evaluatorRole).toBe('Arbiter');
      expect(result.verdict.critique).toBe('Test critique');
      expect(result.verdict.evaluatedAt).toBeDefined();
    });

    it('should include confidence score', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [],
            strongerArgument: 'Test',
            definitiveScore: 7.0,
            resolution: 'Test',
          },
        ],
        otherDimensions: [],
        overallCritique: 'Test',
        resolutionSummary: 'Test',
        confidence: 0.92,
      }));

      const result = await runTiebreaker(input);

      expect(result.verdict.confidence).toBe(0.92);
    });
  });

  describe('Default Scores for Missing Dimensions', () => {
    it('should assign default score 5 for dimensions not evaluated', async () => {
      const input: TiebreakerInput = {
        brief: {
          question: 'Test',
          narrative: 'Test',
        },
        verdicts: [
          createMockVerdict('Skeptic', 7.0, {
            firstPrinciplesCoherence: 7.0,
            internalConsistency: 7.0,
            evidenceQuality: 7.0,
            accessibility: 7.0,
            objectivity: 7.0,
            factualAccuracy: 7.0,
            biasDetection: 7.0,
          }),
        ],
        disagreement: createMockDisagreement(['evidenceQuality'], 1.0),
      };

      // Response with missing dimensions
      queueMockResponse(JSON.stringify({
        disputedDimensionEvaluations: [
          {
            dimension: 'evidenceQuality',
            evaluatorPositions: [],
            strongerArgument: 'Test',
            definitiveScore: 7.0,
            resolution: 'Test',
          },
        ],
        otherDimensions: [], // Missing all other dimensions
        overallCritique: 'Test',
        resolutionSummary: 'Test',
        confidence: 0.85,
      }));

      const result = await runTiebreaker(input);

      // Find a dimension that wasn't in disputed or other
      const missingDimensionScore = result.verdict.dimensionScores.find(
        (d) => d.dimension !== 'evidenceQuality'
      );

      // Should default to 5 for unevaluated dimensions
      expect(missingDimensionScore?.score).toBe(5);
      expect(missingDimensionScore?.reasoning).toContain('Not explicitly evaluated');
    });
  });
});
