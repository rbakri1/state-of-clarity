/**
 * Consensus Scorer Unit Tests
 *
 * Tests for the 3-evaluator consensus panel, disagreement detection,
 * score calculation, and critique aggregation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  EvaluatorVerdict,
  DimensionScore,
  DimensionName,
  Issue,
} from '@/lib/types/clarity-scoring';

// Import the functions we're testing
import {
  detectDisagreement,
  calculateFinalScore,
  aggregateCritiques,
  type FinalScoreInput,
} from '@/lib/agents/consensus-scorer';

// Helper to create mock dimension scores
function createDimensionScores(scores: Partial<Record<DimensionName, number>>): DimensionScore[] {
  const dimensions: DimensionName[] = [
    'firstPrinciplesCoherence',
    'internalConsistency',
    'evidenceQuality',
    'accessibility',
    'objectivity',
    'factualAccuracy',
    'biasDetection',
  ];

  return dimensions.map(dimension => ({
    dimension,
    score: scores[dimension] ?? 7.0,
    reasoning: `Reasoning for ${dimension}`,
    issues: [],
  }));
}

// Helper to create a mock evaluator verdict
function createMockVerdict(
  role: EvaluatorVerdict['evaluatorRole'],
  overallScore: number,
  dimensionScores?: DimensionScore[],
  issues?: Issue[]
): EvaluatorVerdict {
  return {
    evaluatorRole: role,
    dimensionScores: dimensionScores ?? createDimensionScores({}),
    overallScore,
    critique: `Critique from ${role}`,
    issues: issues ?? [],
    confidence: 0.85,
    evaluatedAt: new Date().toISOString(),
  };
}

describe('Consensus Scorer', () => {
  describe('detectDisagreement', () => {
    it('should return no disagreement when verdicts are aligned', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.5, createDimensionScores({
          firstPrinciplesCoherence: 7.5,
          evidenceQuality: 8.0,
        })),
        createMockVerdict('Advocate', 7.8, createDimensionScores({
          firstPrinciplesCoherence: 7.8,
          evidenceQuality: 8.2,
        })),
        createMockVerdict('Generalist', 7.6, createDimensionScores({
          firstPrinciplesCoherence: 7.6,
          evidenceQuality: 7.9,
        })),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.hasDisagreement).toBe(false);
      expect(result.disagreeingDimensions).toHaveLength(0);
      expect(result.maxSpread).toBeLessThanOrEqual(2);
    });

    it('should detect dimension spread greater than 2', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, createDimensionScores({
          evidenceQuality: 5.0,
        })),
        createMockVerdict('Advocate', 8.5, createDimensionScores({
          evidenceQuality: 9.0,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 7.0,
        })),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.hasDisagreement).toBe(true);
      expect(result.disagreeingDimensions).toContain('evidenceQuality');
      expect(result.maxSpread).toBeGreaterThan(2);
    });

    it('should detect overall score spread greater than 2', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 5.0),
        createMockVerdict('Advocate', 8.5),
        createMockVerdict('Generalist', 7.0),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.hasDisagreement).toBe(true);
      expect(result.maxSpread).toBeGreaterThanOrEqual(3.5);
    });

    it('should identify multiple disagreeing dimensions', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, createDimensionScores({
          evidenceQuality: 4.0,
          objectivity: 5.0,
        })),
        createMockVerdict('Advocate', 8.0, createDimensionScores({
          evidenceQuality: 9.0,
          objectivity: 8.5,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 6.0,
          objectivity: 6.0,
        })),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.hasDisagreement).toBe(true);
      expect(result.disagreeingDimensions).toContain('evidenceQuality');
      expect(result.disagreeingDimensions).toContain('objectivity');
    });

    it('should handle single verdict without error', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.hasDisagreement).toBe(false);
      expect(result.disagreeingDimensions).toHaveLength(0);
      expect(result.maxSpread).toBe(0);
    });

    it('should handle empty verdicts array', () => {
      const result = detectDisagreement([]);

      expect(result.hasDisagreement).toBe(false);
      expect(result.disagreeingDimensions).toHaveLength(0);
    });

    it('should include evaluator positions in result', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, createDimensionScores({
          evidenceQuality: 5.0,
        })),
        createMockVerdict('Advocate', 9.0, createDimensionScores({
          evidenceQuality: 9.5,
        })),
        createMockVerdict('Generalist', 7.5, createDimensionScores({
          evidenceQuality: 7.0,
        })),
      ];

      const result = detectDisagreement(verdicts);

      expect(result.evaluatorPositions).toHaveLength(3);
      expect(result.evaluatorPositions[0].evaluator).toBe('Skeptic');
      expect(result.evaluatorPositions[0].overallScore).toBe(6.0);
    });

    it('should handle exact threshold (spread = 2)', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, createDimensionScores({
          evidenceQuality: 6.0,
        })),
        createMockVerdict('Advocate', 8.0, createDimensionScores({
          evidenceQuality: 8.0,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 7.0,
        })),
      ];

      const result = detectDisagreement(verdicts);

      // Spread of exactly 2 should NOT trigger disagreement
      expect(result.hasDisagreement).toBe(false);
    });

    it('should handle spread just over threshold (spread = 2.1)', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, createDimensionScores({
          evidenceQuality: 5.9,
        })),
        createMockVerdict('Advocate', 8.0, createDimensionScores({
          evidenceQuality: 8.0,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 7.0,
        })),
      ];

      const result = detectDisagreement(verdicts);

      // Spread of 2.1 should trigger disagreement
      expect(result.hasDisagreement).toBe(true);
    });
  });

  describe('calculateFinalScore', () => {
    it('should use median method when no disagreement', () => {
      const input: FinalScoreInput = {
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 8.0),
          createMockVerdict('Generalist', 7.5),
        ],
      };

      const result = calculateFinalScore(input);

      expect(result.consensusMethod).toBe('median');
      expect(result.hasDisagreement).toBe(false);
      expect(result.needsHumanReview).toBe(false);
    });

    it('should use post-discussion method when discussion occurred', () => {
      const disagreement = detectDisagreement([
        createMockVerdict('Skeptic', 5.0),
        createMockVerdict('Advocate', 8.5),
        createMockVerdict('Generalist', 7.0),
      ]);

      const input: FinalScoreInput = {
        verdicts: [
          createMockVerdict('Skeptic', 6.5),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.0),
        ],
        disagreement,
        discussionOccurred: true,
      };

      const result = calculateFinalScore(input);

      expect(result.consensusMethod).toBe('post-discussion');
    });

    it('should use tiebreaker method with arbiter verdict', () => {
      const verdicts = [
        createMockVerdict('Skeptic', 5.0, createDimensionScores({
          evidenceQuality: 4.0,
        })),
        createMockVerdict('Advocate', 9.0, createDimensionScores({
          evidenceQuality: 9.5,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 7.0,
        })),
      ];

      const disagreement = detectDisagreement(verdicts);
      const arbiterVerdict = createMockVerdict('Arbiter', 7.5, createDimensionScores({
        evidenceQuality: 7.5,
      }));

      const input: FinalScoreInput = {
        verdicts,
        disagreement,
        arbiterVerdict,
      };

      const result = calculateFinalScore(input);

      expect(result.consensusMethod).toBe('tiebreaker');
      expect(result.needsHumanReview).toBe(true);
      expect(result.reviewReason).toContain('Tiebreaker');
    });

    it('should calculate weighted overall score correctly', () => {
      const input: FinalScoreInput = {
        verdicts: [
          createMockVerdict('Skeptic', 8.0, createDimensionScores({
            firstPrinciplesCoherence: 8.0,
            internalConsistency: 8.0,
            evidenceQuality: 8.0,
            accessibility: 8.0,
            objectivity: 8.0,
            factualAccuracy: 8.0,
            biasDetection: 8.0,
          })),
          createMockVerdict('Advocate', 8.0, createDimensionScores({
            firstPrinciplesCoherence: 8.0,
            internalConsistency: 8.0,
            evidenceQuality: 8.0,
            accessibility: 8.0,
            objectivity: 8.0,
            factualAccuracy: 8.0,
            biasDetection: 8.0,
          })),
          createMockVerdict('Generalist', 8.0, createDimensionScores({
            firstPrinciplesCoherence: 8.0,
            internalConsistency: 8.0,
            evidenceQuality: 8.0,
            accessibility: 8.0,
            objectivity: 8.0,
            factualAccuracy: 8.0,
            biasDetection: 8.0,
          })),
        ],
      };

      const result = calculateFinalScore(input);

      expect(result.overallScore).toBe(8.0);
    });

    it('should consolidate critiques from all evaluators', () => {
      const input: FinalScoreInput = {
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 8.0),
          createMockVerdict('Generalist', 7.5),
        ],
      };

      const result = calculateFinalScore(input);

      expect(result.critique).toContain('Skeptic');
      expect(result.critique).toContain('Advocate');
      expect(result.critique).toContain('Generalist');
    });

    it('should include arbiter critique when tiebreaker used', () => {
      const verdicts = [
        createMockVerdict('Skeptic', 5.0, createDimensionScores({ evidenceQuality: 4.0 })),
        createMockVerdict('Advocate', 9.0, createDimensionScores({ evidenceQuality: 9.5 })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({ evidenceQuality: 7.0 })),
      ];

      const disagreement = detectDisagreement(verdicts);
      const arbiterVerdict = createMockVerdict('Arbiter', 7.5);

      const input: FinalScoreInput = {
        verdicts,
        disagreement,
        arbiterVerdict,
      };

      const result = calculateFinalScore(input);

      expect(result.critique).toContain('Arbiter');
      expect(result.evaluatorVerdicts).toHaveLength(4); // 3 primary + 1 arbiter
    });

    it('should calculate average confidence', () => {
      const input: FinalScoreInput = {
        verdicts: [
          { ...createMockVerdict('Skeptic', 7.0), confidence: 0.80 },
          { ...createMockVerdict('Advocate', 8.0), confidence: 0.90 },
          { ...createMockVerdict('Generalist', 7.5), confidence: 0.85 },
        ],
      };

      const result = calculateFinalScore(input);

      expect(result.confidence).toBeCloseTo(0.85, 2);
    });

    it('should include scored timestamp', () => {
      const input: FinalScoreInput = {
        verdicts: [createMockVerdict('Skeptic', 7.0)],
      };

      const result = calculateFinalScore(input);

      expect(result.scoredAt).toBeDefined();
      expect(new Date(result.scoredAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('aggregateCritiques', () => {
    it('should return empty result for empty verdicts', () => {
      const result = aggregateCritiques([]);

      expect(result.issues).toHaveLength(0);
      expect(result.summary).toContain('No evaluator verdicts');
      expect(result.topPriority).toBeNull();
    });

    it('should return empty result when no issues flagged', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 9.0, undefined, []),
        createMockVerdict('Advocate', 9.0, undefined, []),
        createMockVerdict('Generalist', 9.0, undefined, []),
      ];

      const result = aggregateCritiques(verdicts);

      expect(result.issues).toHaveLength(0);
      expect(result.summary).toContain('No issues flagged');
    });

    it('should deduplicate similar issues (Jaccard > 0.6)', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          {
            dimension: 'evidenceQuality',
            severity: 'medium',
            description: 'Evidence is lacking in several sections',
          },
        ]),
        createMockVerdict('Advocate', 7.0, undefined, [
          {
            dimension: 'evidenceQuality',
            severity: 'medium',
            description: 'Evidence lacking in multiple sections',
          },
        ]),
        createMockVerdict('Generalist', 7.0, undefined, [
          {
            dimension: 'evidenceQuality',
            severity: 'high',
            description: 'Evidence is lacking throughout sections',
          },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      // Should have issues about evidence quality
      const evidenceIssues = result.issues.filter(i => i.dimension === 'evidenceQuality');
      expect(evidenceIssues.length).toBeGreaterThanOrEqual(1);
      // Total should be limited to 5
      expect(result.issues.length).toBeLessThanOrEqual(5);
    });

    it('should prioritize by agreement count', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          { dimension: 'evidenceQuality', severity: 'medium', description: 'Weak evidence' },
          { dimension: 'accessibility', severity: 'low', description: 'Jargon issue' },
        ]),
        createMockVerdict('Advocate', 7.0, undefined, [
          { dimension: 'evidenceQuality', severity: 'medium', description: 'Weak evidence' },
        ]),
        createMockVerdict('Generalist', 7.0, undefined, [
          { dimension: 'evidenceQuality', severity: 'medium', description: 'Weak evidence' },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      // The issue agreed by all 3 should have higher priority
      expect(result.topPriority?.dimension).toBe('evidenceQuality');
      expect(result.topPriority?.agreedByEvaluators).toBe(3);
    });

    it('should prioritize by severity', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          { dimension: 'evidenceQuality', severity: 'high', description: 'Major evidence gap' },
          { dimension: 'accessibility', severity: 'low', description: 'Minor jargon' },
        ]),
        createMockVerdict('Advocate', 7.0, undefined, []),
        createMockVerdict('Generalist', 7.0, undefined, []),
      ];

      const result = aggregateCritiques(verdicts);

      // High severity issue should rank higher
      const highSeverityIssue = result.issues.find(i => i.dimension === 'evidenceQuality');
      const lowSeverityIssue = result.issues.find(i => i.dimension === 'accessibility');

      if (highSeverityIssue && lowSeverityIssue) {
        const highIdx = result.issues.indexOf(highSeverityIssue);
        const lowIdx = result.issues.indexOf(lowSeverityIssue);
        expect(highIdx).toBeLessThan(lowIdx);
      }
    });

    it('should limit to top 5 issues', () => {
      const manyIssues: Issue[] = Array.from({ length: 10 }, (_, i) => ({
        dimension: 'evidenceQuality' as DimensionName,
        severity: 'medium' as const,
        description: `Issue number ${i + 1}`,
      }));

      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 6.0, undefined, manyIssues),
      ];

      const result = aggregateCritiques(verdicts);

      expect(result.issues.length).toBeLessThanOrEqual(5);
    });

    it('should include suggested fixes when available', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          {
            dimension: 'evidenceQuality',
            severity: 'medium',
            description: 'Weak sources',
            suggestedFix: 'Add peer-reviewed sources',
          },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      expect(result.issues[0]?.suggestedFix).toBe('Add peer-reviewed sources');
    });

    it('should include quotes when available', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          {
            dimension: 'factualAccuracy',
            severity: 'high',
            description: 'Incorrect statistic',
            quote: 'The rate increased by 500%',
          },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      expect(result.issues[0]?.quote).toBe('The rate increased by 500%');
    });

    it('should generate appropriate summary for critical issues', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 5.0, undefined, [
          { dimension: 'factualAccuracy', severity: 'high', description: 'Major factual errors' },
        ]),
        createMockVerdict('Advocate', 5.0, undefined, [
          { dimension: 'factualAccuracy', severity: 'high', description: 'Major factual errors' },
        ]),
        createMockVerdict('Generalist', 5.0, undefined, [
          { dimension: 'factualAccuracy', severity: 'high', description: 'Major factual errors' },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      // High agreement + high severity = critical priority
      expect(result.summary).toContain('critical');
    });

    it('should assign priority based on score', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.0, undefined, [
          { dimension: 'biasDetection', severity: 'low', description: 'Minor framing bias' },
        ]),
      ];

      const result = aggregateCritiques(verdicts);

      // Single low-severity issue should have some priority assigned
      expect(result.issues.length).toBeGreaterThanOrEqual(1);
      expect(result.issues[0]?.priority).toBeDefined();
    });
  });

  describe('Integration: Full Scoring Flow', () => {
    it('should handle complete scoring flow without disagreement', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 7.5, createDimensionScores({
          firstPrinciplesCoherence: 7.5,
          evidenceQuality: 7.0,
        })),
        createMockVerdict('Advocate', 8.0, createDimensionScores({
          firstPrinciplesCoherence: 8.0,
          evidenceQuality: 7.5,
        })),
        createMockVerdict('Generalist', 7.8, createDimensionScores({
          firstPrinciplesCoherence: 7.8,
          evidenceQuality: 7.2,
        })),
      ];

      const disagreement = detectDisagreement(verdicts);
      expect(disagreement.hasDisagreement).toBe(false);

      const finalScore = calculateFinalScore({
        verdicts,
        disagreement,
      });

      expect(finalScore.consensusMethod).toBe('median');
      expect(finalScore.overallScore).toBeGreaterThan(0);
      expect(finalScore.dimensionBreakdown).toHaveLength(7);
    });

    it('should handle complete scoring flow with tiebreaker', () => {
      const verdicts: EvaluatorVerdict[] = [
        createMockVerdict('Skeptic', 5.0, createDimensionScores({
          evidenceQuality: 4.0,
          objectivity: 4.5,
        })),
        createMockVerdict('Advocate', 9.0, createDimensionScores({
          evidenceQuality: 9.5,
          objectivity: 9.0,
        })),
        createMockVerdict('Generalist', 7.0, createDimensionScores({
          evidenceQuality: 7.0,
          objectivity: 7.0,
        })),
      ];

      const disagreement = detectDisagreement(verdicts);
      expect(disagreement.hasDisagreement).toBe(true);
      expect(disagreement.disagreeingDimensions.length).toBeGreaterThan(0);

      const arbiterVerdict = createMockVerdict('Arbiter', 7.5, createDimensionScores({
        evidenceQuality: 7.5,
        objectivity: 7.0,
      }));

      const finalScore = calculateFinalScore({
        verdicts,
        disagreement,
        arbiterVerdict,
      });

      expect(finalScore.consensusMethod).toBe('tiebreaker');
      expect(finalScore.needsHumanReview).toBe(true);
      expect(finalScore.evaluatorVerdicts).toHaveLength(4);
    });
  });
});
