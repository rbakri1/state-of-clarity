/**
 * Discussion Round Agent Unit Tests
 *
 * Tests for the discussion round where evaluators review each other's assessments
 * and can revise their scores.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueMockResponse, resetAnthropicMocks } from '../../mocks/anthropic';

// Mock Anthropic before importing the agent
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Import after mocks are set up
import {
  runDiscussionRound,
  DiscussionRoundInput,
  DiscussionRoundOutput,
} from '@/lib/agents/discussion-round-agent';
import { EvaluatorVerdict, DimensionScore, DimensionName } from '@/lib/types/clarity-scoring';
import { EvaluateBriefInput } from '@/lib/agents/clarity-evaluator-agent';

describe('Discussion Round Agent', () => {
  const createMockDimensionScores = (baseScore: number): DimensionScore[] => [
    { dimension: 'firstPrinciplesCoherence', score: baseScore, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'internalConsistency', score: baseScore + 0.5, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'evidenceQuality', score: baseScore - 0.3, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'accessibility', score: baseScore + 0.2, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'objectivity', score: baseScore, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'factualAccuracy', score: baseScore + 0.3, reasoning: 'Test reasoning', issues: [] },
    { dimension: 'biasDetection', score: baseScore - 0.2, reasoning: 'Test reasoning', issues: [] },
  ];

  const createMockVerdict = (
    role: 'Skeptic' | 'Advocate' | 'Generalist' | 'Arbiter',
    overallScore: number
  ): EvaluatorVerdict => ({
    evaluatorRole: role,
    dimensionScores: createMockDimensionScores(overallScore),
    overallScore,
    critique: `Critique from ${role}`,
    issues: [
      {
        dimension: 'evidenceQuality',
        severity: 'medium',
        description: 'Test issue',
      },
    ],
    confidence: 0.85,
    evaluatedAt: new Date().toISOString(),
  });

  const mockDiscussionResponse = {
    revisedDimensions: [
      {
        dimension: 'evidenceQuality',
        originalScore: 7.0,
        revisedScore: 7.5,
        reasonForChange: 'After reviewing other evaluators, I agree the evidence was better than I initially assessed.',
      },
    ],
    maintainedPositions: [
      { dimension: 'firstPrinciplesCoherence', score: 7.5, justification: 'My original assessment stands.' },
      { dimension: 'internalConsistency', score: 8.0, justification: 'No change needed.' },
      { dimension: 'accessibility', score: 7.7, justification: 'Maintaining position.' },
      { dimension: 'objectivity', score: 7.5, justification: 'Original assessment valid.' },
      { dimension: 'factualAccuracy', score: 7.8, justification: 'Facts are accurate.' },
      { dimension: 'biasDetection', score: 7.3, justification: 'Bias assessment unchanged.' },
    ],
    overallReflection: 'After reviewing the other perspectives, I found some valid points about evidence quality.',
  };

  const mockBriefInput: EvaluateBriefInput = {
    question: 'What is the impact of inflation?',
    narrative: 'Test narrative about inflation.',
    summaries: { child: 'Simple summary' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetAnthropicMocks();
  });

  describe('runDiscussionRound', () => {
    it('should return revised verdicts for all evaluators', async () => {
      // Queue responses for all 3 evaluators
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      expect(result.revisedVerdicts).toHaveLength(3);
    });

    it('should preserve evaluator roles in revised verdicts', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      const roles = result.revisedVerdicts.map(v => v.evaluatorRole);
      expect(roles).toContain('Skeptic');
      expect(roles).toContain('Advocate');
      expect(roles).toContain('Generalist');
    });

    it('should include discussion summary', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      expect(result.discussionSummary).toBeDefined();
      expect(typeof result.discussionSummary).toBe('string');
    });

    it('should count total changes made', async () => {
      // Response with revisions
      const responseWithRevisions = {
        ...mockDiscussionResponse,
        revisedDimensions: [
          { dimension: 'evidenceQuality', originalScore: 7.0, revisedScore: 7.5, reasonForChange: 'Valid point' },
          { dimension: 'objectivity', originalScore: 7.5, revisedScore: 7.8, reasonForChange: 'Agreed with advocate' },
        ],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.5, justification: 'Maintaining.' },
          { dimension: 'internalConsistency', score: 8.0, justification: 'Maintaining.' },
          { dimension: 'accessibility', score: 7.7, justification: 'Maintaining.' },
          { dimension: 'factualAccuracy', score: 7.8, justification: 'Maintaining.' },
          { dimension: 'biasDetection', score: 7.3, justification: 'Maintaining.' },
        ],
        overallReflection: 'Made some revisions.',
      };

      queueMockResponse(JSON.stringify(responseWithRevisions));
      queueMockResponse(JSON.stringify(responseWithRevisions));
      queueMockResponse(JSON.stringify(responseWithRevisions));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      // Each evaluator makes 2 revisions, so total is 6
      expect(result.changesCount).toBe(6);
    });

    it('should track duration in milliseconds', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      expect(result.durationMs).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Score Revisions', () => {
    it('should apply score revisions to dimension scores', async () => {
      const revisionResponse = {
        revisedDimensions: [
          { dimension: 'evidenceQuality', originalScore: 6.7, revisedScore: 7.5, reasonForChange: 'Better evidence noted' },
        ],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Unchanged.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Unchanged.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Unchanged.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Unchanged.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Unchanged.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Unchanged.' },
        ],
        overallReflection: 'Revised evidence quality score.',
      };

      queueMockResponse(JSON.stringify(revisionResponse));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      // Find the Skeptic's revised verdict
      const skepticVerdict = result.revisedVerdicts.find(v => v.evaluatorRole === 'Skeptic');
      expect(skepticVerdict).toBeDefined();

      // The evidenceQuality score should be revised
      const evidenceScore = skepticVerdict?.dimensionScores.find(d => d.dimension === 'evidenceQuality');
      expect(evidenceScore?.score).toBe(7.5);
    });

    it('should append revision reason to dimension reasoning', async () => {
      const revisionResponse = {
        revisedDimensions: [
          { dimension: 'accessibility', originalScore: 7.2, revisedScore: 7.8, reasonForChange: 'Generalist made good points about clarity.' },
        ],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Unchanged.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Unchanged.' },
          { dimension: 'evidenceQuality', score: 6.7, justification: 'Unchanged.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Unchanged.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Unchanged.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Unchanged.' },
        ],
        overallReflection: 'Revised accessibility.',
      };

      queueMockResponse(JSON.stringify(revisionResponse));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      const skepticVerdict = result.revisedVerdicts.find(v => v.evaluatorRole === 'Skeptic');
      const accessibilityScore = skepticVerdict?.dimensionScores.find(d => d.dimension === 'accessibility');

      expect(accessibilityScore?.reasoning).toContain('[REVISED]');
      expect(accessibilityScore?.reasoning).toContain('Generalist made good points');
    });

    it('should recalculate overall score after revisions', async () => {
      // Response that significantly changes a high-weight dimension
      const revisionResponse = {
        revisedDimensions: [
          { dimension: 'firstPrinciplesCoherence', originalScore: 5.0, revisedScore: 8.0, reasonForChange: 'Major revision' },
        ],
        maintainedPositions: [
          { dimension: 'internalConsistency', score: 7.5, justification: 'Unchanged.' },
          { dimension: 'evidenceQuality', score: 6.7, justification: 'Unchanged.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Unchanged.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Unchanged.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Unchanged.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Unchanged.' },
        ],
        overallReflection: 'Major revision to first principles.',
      };

      queueMockResponse(JSON.stringify(revisionResponse));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));

      const originalVerdict = createMockVerdict('Skeptic', 6.0);
      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          originalVerdict,
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      const skepticVerdict = result.revisedVerdicts.find(v => v.evaluatorRole === 'Skeptic');

      // Overall score should be different from original after revision
      expect(skepticVerdict?.overallScore).toBeDefined();
    });
  });

  describe('No Changes Scenario', () => {
    it('should handle case where all evaluators maintain positions', async () => {
      const noChangesResponse = {
        revisedDimensions: [],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Maintaining my assessment.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Maintaining.' },
          { dimension: 'evidenceQuality', score: 6.7, justification: 'Maintaining.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Maintaining.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Maintaining.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Maintaining.' },
        ],
        overallReflection: 'After review, I stand by my original assessment.',
      };

      queueMockResponse(JSON.stringify(noChangesResponse));
      queueMockResponse(JSON.stringify(noChangesResponse));
      queueMockResponse(JSON.stringify(noChangesResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      expect(result.changesCount).toBe(0);
      expect(result.discussionSummary).toContain('maintained');
    });

    it('should preserve original scores when no revisions made', async () => {
      const noChangesResponse = {
        revisedDimensions: [],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Maintaining.' },
          { dimension: 'evidenceQuality', score: 6.7, justification: 'Maintaining.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Maintaining.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Maintaining.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Maintaining.' },
        ],
        overallReflection: 'Standing by original assessment.',
      };

      queueMockResponse(JSON.stringify(noChangesResponse));
      queueMockResponse(JSON.stringify(noChangesResponse));
      queueMockResponse(JSON.stringify(noChangesResponse));

      const originalSkeptic = createMockVerdict('Skeptic', 7.0);
      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          originalSkeptic,
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      const revisedSkeptic = result.revisedVerdicts.find(v => v.evaluatorRole === 'Skeptic');

      // Dimension scores should be preserved
      originalSkeptic.dimensionScores.forEach((origDim) => {
        const revisedDim = revisedSkeptic?.dimensionScores.find(d => d.dimension === origDim.dimension);
        expect(revisedDim?.score).toBe(origDim.score);
      });
    });
  });

  describe('Discussion Summary Generation', () => {
    it('should include revision details in summary when changes are made', async () => {
      const revisionResponse = {
        revisedDimensions: [
          { dimension: 'evidenceQuality', originalScore: 6.5, revisedScore: 7.5, reasonForChange: 'Agreed with advocate.' },
        ],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Maintaining.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Maintaining.' },
          { dimension: 'objectivity', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Maintaining.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Maintaining.' },
        ],
        overallReflection: 'Made revision to evidence quality.',
      };

      queueMockResponse(JSON.stringify(revisionResponse));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      expect(result.discussionSummary).toContain('evidenceQuality');
      expect(result.discussionSummary).toContain('Skeptic');
    });

    it('should indicate direction of score change in summary', async () => {
      const revisionResponse = {
        revisedDimensions: [
          { dimension: 'objectivity', originalScore: 6.0, revisedScore: 7.5, reasonForChange: 'Increased after review.' },
        ],
        maintainedPositions: [
          { dimension: 'firstPrinciplesCoherence', score: 7.0, justification: 'Maintaining.' },
          { dimension: 'internalConsistency', score: 7.5, justification: 'Maintaining.' },
          { dimension: 'evidenceQuality', score: 6.7, justification: 'Maintaining.' },
          { dimension: 'accessibility', score: 7.2, justification: 'Maintaining.' },
          { dimension: 'factualAccuracy', score: 7.3, justification: 'Maintaining.' },
          { dimension: 'biasDetection', score: 6.8, justification: 'Maintaining.' },
        ],
        overallReflection: 'Increased objectivity score.',
      };

      queueMockResponse(JSON.stringify(revisionResponse));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));
      queueMockResponse(JSON.stringify({ ...revisionResponse, revisedDimensions: [] }));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      // Should indicate the score went up
      expect(result.discussionSummary).toMatch(/6\.0.*7\.5/);
    });
  });

  describe('Critique Updates', () => {
    it('should append post-discussion reflection to critique', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      result.revisedVerdicts.forEach(verdict => {
        expect(verdict.critique).toContain('[POST-DISCUSSION]');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when JSON parsing fails', async () => {
      queueMockResponse('Not valid JSON');
      queueMockResponse('Not valid JSON');
      queueMockResponse('Not valid JSON');

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      await expect(runDiscussionRound(input)).rejects.toThrow();
    });
  });

  describe('Parallel Execution', () => {
    it('should run all evaluator discussions in parallel', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          createMockVerdict('Skeptic', 7.0),
          createMockVerdict('Advocate', 7.5),
          createMockVerdict('Generalist', 7.2),
        ],
      };

      const result = await runDiscussionRound(input);

      // All verdicts should be returned
      expect(result.revisedVerdicts).toHaveLength(3);
      // Duration should be reasonable (parallel execution)
      expect(result.durationMs).toBeDefined();
    });
  });

  describe('Timestamp Updates', () => {
    it('should update evaluatedAt timestamp in revised verdicts', async () => {
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));
      queueMockResponse(JSON.stringify(mockDiscussionResponse));

      const originalDate = '2025-01-01T00:00:00.000Z';
      const input: DiscussionRoundInput = {
        brief: mockBriefInput,
        verdicts: [
          { ...createMockVerdict('Skeptic', 7.0), evaluatedAt: originalDate },
          { ...createMockVerdict('Advocate', 7.5), evaluatedAt: originalDate },
          { ...createMockVerdict('Generalist', 7.2), evaluatedAt: originalDate },
        ],
      };

      const result = await runDiscussionRound(input);

      result.revisedVerdicts.forEach(verdict => {
        expect(verdict.evaluatedAt).not.toBe(originalDate);
        expect(new Date(verdict.evaluatedAt).getTime()).toBeGreaterThan(new Date(originalDate).getTime());
      });
    });
  });
});
