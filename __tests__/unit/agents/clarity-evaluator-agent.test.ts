/**
 * Clarity Evaluator Agent Unit Tests
 *
 * Tests for the single-evaluator brief scoring agent.
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
import { evaluateBrief, EvaluateBriefInput, Brief } from '@/lib/agents/clarity-evaluator-agent';
import { EvaluatorPersona, getEvaluatorPersona } from '@/lib/agents/clarity-evaluator-personas';
import { DimensionName, CLARITY_DIMENSIONS } from '@/lib/types/clarity-scoring';

describe('Clarity Evaluator Agent', () => {
  const mockEvaluationResponse = {
    dimensions: [
      { dimension: 'firstPrinciplesCoherence', score: 7.5, reasoning: 'Good structure', issues: [] },
      { dimension: 'internalConsistency', score: 8.0, reasoning: 'No contradictions', issues: [] },
      { dimension: 'evidenceQuality', score: 7.2, reasoning: 'Decent sources', issues: ['Some claims lack citations'] },
      { dimension: 'accessibility', score: 8.5, reasoning: 'Clear language', issues: [] },
      { dimension: 'objectivity', score: 7.8, reasoning: 'Balanced', issues: [] },
      { dimension: 'factualAccuracy', score: 8.0, reasoning: 'Accurate', issues: [] },
      { dimension: 'biasDetection', score: 7.5, reasoning: 'Minimal bias', issues: [] },
    ],
    overallCritique: 'A solid brief with room for improvement.',
    issues: [
      {
        dimension: 'evidenceQuality',
        severity: 'medium',
        description: 'Some claims need citation support',
        quote: 'Studies show that...',
        suggestedFix: 'Add specific study citations',
      },
    ],
    confidence: 0.85,
  };

  const mockBriefInput: EvaluateBriefInput = {
    question: 'What is the impact of inflation on wages?',
    narrative: 'This is a test narrative about inflation and wages. Studies show that inflation affects purchasing power significantly.',
    summaries: {
      child: 'Simple explanation',
      teen: 'More detailed explanation',
    },
  };

  const mockBrief: Brief = {
    id: 'brief-123',
    question: 'Test question',
    narrative: 'Test narrative content',
    summaries: { child: 'Summary' },
    structured_data: { factors: [], policies: [] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user-123',
    version: 1,
    clarity_score: null,
    clarity_critique: null,
    metadata: {},
    posit: null,
    historical_summary: null,
    foundational_principles: null,
    fork_of: null,
  } as Brief;

  beforeEach(() => {
    vi.clearAllMocks();
    resetAnthropicMocks();
  });

  describe('evaluateBrief', () => {
    it('should return an EvaluatorVerdict', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result).toBeDefined();
      expect(result.evaluatorRole).toBe('Skeptic');
      expect(result.dimensionScores).toBeDefined();
      expect(result.overallScore).toBeDefined();
    });

    it('should calculate weighted overall score from dimension scores', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      // Overall score should be calculated from dimension scores
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(10);
    });

    it('should include all 7 dimension scores', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.dimensionScores).toHaveLength(7);

      const dimensions = result.dimensionScores.map(d => d.dimension);
      expect(dimensions).toContain('firstPrinciplesCoherence');
      expect(dimensions).toContain('internalConsistency');
      expect(dimensions).toContain('evidenceQuality');
      expect(dimensions).toContain('accessibility');
      expect(dimensions).toContain('objectivity');
      expect(dimensions).toContain('factualAccuracy');
      expect(dimensions).toContain('biasDetection');
    });

    it('should include dimension reasoning', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Advocate');

      const result = await evaluateBrief(mockBriefInput, persona);

      result.dimensionScores.forEach(dimScore => {
        expect(dimScore.reasoning).toBeDefined();
        expect(typeof dimScore.reasoning).toBe('string');
      });
    });

    it('should include critique text', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Generalist');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.critique).toBeDefined();
      expect(typeof result.critique).toBe('string');
      expect(result.critique.length).toBeGreaterThan(0);
    });

    it('should include confidence score', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include evaluatedAt timestamp', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.evaluatedAt).toBeDefined();
      // Should be a valid ISO date string
      expect(() => new Date(result.evaluatedAt)).not.toThrow();
    });

    it('should extract issues from evaluation', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should include issue details', async () => {
      const responseWithIssues = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'evidenceQuality' as DimensionName,
            severity: 'high',
            description: 'Major claim without evidence',
            quote: 'This always happens',
            suggestedFix: 'Add supporting data',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithIssues));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues.length).toBeGreaterThan(0);
      const issue = result.issues[0];
      expect(issue.dimension).toBe('evidenceQuality');
      expect(issue.severity).toBe('high');
      expect(issue.description).toBeDefined();
    });
  });

  describe('Different Personas', () => {
    it('should work with Skeptic persona', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.evaluatorRole).toBe('Skeptic');
    });

    it('should work with Advocate persona', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Advocate');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.evaluatorRole).toBe('Advocate');
    });

    it('should work with Generalist persona', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Generalist');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.evaluatorRole).toBe('Generalist');
    });

    it('should work with Arbiter persona', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Arbiter');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.evaluatorRole).toBe('Arbiter');
    });
  });

  describe('Brief Input Types', () => {
    it('should accept EvaluateBriefInput directly', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result).toBeDefined();
    });

    it('should accept Brief database row type', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBrief, persona);

      expect(result).toBeDefined();
    });

    it('should handle brief without summaries', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const briefWithoutSummaries: EvaluateBriefInput = {
        question: 'Test question',
        narrative: 'Test narrative',
      };

      const result = await evaluateBrief(briefWithoutSummaries, persona);

      expect(result).toBeDefined();
    });

    it('should handle brief without structured data', async () => {
      queueMockResponse(JSON.stringify(mockEvaluationResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const briefWithoutStructured: EvaluateBriefInput = {
        question: 'Test question',
        narrative: 'Test narrative',
        summaries: { child: 'Summary' },
      };

      const result = await evaluateBrief(briefWithoutStructured, persona);

      expect(result).toBeDefined();
    });
  });

  describe('Score Calculation', () => {
    it('should calculate weighted score respecting dimension weights', async () => {
      // Create response with known scores
      const knownScoresResponse = {
        dimensions: [
          { dimension: 'firstPrinciplesCoherence', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'internalConsistency', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'evidenceQuality', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'accessibility', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'objectivity', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'factualAccuracy', score: 10.0, reasoning: 'Perfect', issues: [] },
          { dimension: 'biasDetection', score: 10.0, reasoning: 'Perfect', issues: [] },
        ],
        overallCritique: 'Perfect brief.',
        issues: [],
        confidence: 1.0,
      };
      queueMockResponse(JSON.stringify(knownScoresResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      // With all 10s, overall should be 10
      expect(result.overallScore).toBe(10);
    });

    it('should handle mixed scores correctly', async () => {
      const mixedScoresResponse = {
        dimensions: [
          { dimension: 'firstPrinciplesCoherence', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'internalConsistency', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'evidenceQuality', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'accessibility', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'objectivity', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'factualAccuracy', score: 5.0, reasoning: 'Average', issues: [] },
          { dimension: 'biasDetection', score: 5.0, reasoning: 'Average', issues: [] },
        ],
        overallCritique: 'Average brief.',
        issues: [],
        confidence: 0.7,
      };
      queueMockResponse(JSON.stringify(mixedScoresResponse));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      // With all 5s, overall should be 5
      expect(result.overallScore).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when JSON cannot be extracted', async () => {
      queueMockResponse('This is not valid JSON');
      const persona = getEvaluatorPersona('Skeptic');

      await expect(evaluateBrief(mockBriefInput, persona)).rejects.toThrow();
    });

    it('should throw error when response is empty', async () => {
      queueMockResponse('');
      const persona = getEvaluatorPersona('Skeptic');

      await expect(evaluateBrief(mockBriefInput, persona)).rejects.toThrow();
    });
  });

  describe('Issue Severity Levels', () => {
    it('should handle low severity issues', async () => {
      const responseWithLowSeverity = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'accessibility',
            severity: 'low',
            description: 'Minor jargon usage',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithLowSeverity));
      const persona = getEvaluatorPersona('Generalist');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].severity).toBe('low');
    });

    it('should handle medium severity issues', async () => {
      const responseWithMediumSeverity = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'evidenceQuality',
            severity: 'medium',
            description: 'Some claims lack support',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithMediumSeverity));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].severity).toBe('medium');
    });

    it('should handle high severity issues', async () => {
      const responseWithHighSeverity = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'factualAccuracy',
            severity: 'high',
            description: 'Factual error detected',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithHighSeverity));
      const persona = getEvaluatorPersona('Skeptic');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].severity).toBe('high');
    });
  });

  describe('Optional Issue Fields', () => {
    it('should handle issues with quote', async () => {
      const responseWithQuote = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'biasDetection',
            severity: 'medium',
            description: 'Biased language',
            quote: 'This always fails',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithQuote));
      const persona = getEvaluatorPersona('Advocate');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].quote).toBe('This always fails');
    });

    it('should handle issues with suggestedFix', async () => {
      const responseWithFix = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'accessibility',
            severity: 'low',
            description: 'Technical jargon',
            suggestedFix: 'Define terms before use',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseWithFix));
      const persona = getEvaluatorPersona('Generalist');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].suggestedFix).toBe('Define terms before use');
    });

    it('should handle issues without optional fields', async () => {
      const responseMinimalIssue = {
        ...mockEvaluationResponse,
        issues: [
          {
            dimension: 'objectivity',
            severity: 'medium',
            description: 'Slight bias detected',
          },
        ],
      };
      queueMockResponse(JSON.stringify(responseMinimalIssue));
      const persona = getEvaluatorPersona('Advocate');

      const result = await evaluateBrief(mockBriefInput, persona);

      expect(result.issues[0].quote).toBeUndefined();
      expect(result.issues[0].suggestedFix).toBeUndefined();
    });
  });
});
