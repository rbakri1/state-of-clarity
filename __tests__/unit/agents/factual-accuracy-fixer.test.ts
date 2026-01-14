/**
 * Factual Accuracy Fixer Unit Tests
 *
 * Tests for the factual accuracy verification fixer agent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';
import { FixerType, FixerInput } from '@/lib/types/refinement';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

import { FactualAccuracyFixer } from '@/lib/agents/fixers/factual-accuracy-fixer';

describe('FactualAccuracyFixer', () => {
  let fixer: FactualAccuracyFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new FactualAccuracyFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.factualAccuracy);
    });

    it('should have description about verifying factual claims', () => {
      expect(fixer.description).toContain('factual');
      expect(fixer.description).toContain('verifying');
    });
  });

  describe('suggestEdits', () => {
    it('should suggest corrections for incorrect statistics', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Key Arguments',
            originalText: 'The unemployment rate is 15%.',
            suggestedText: 'The unemployment rate is 4.2%, according to the Bureau of Labor Statistics.',
            rationale: 'The original statistic was incorrect. Official BLS data shows 4.2%.',
            priority: 'critical',
          },
        ],
        confidence: 0.95,
      }));

      const input: FixerInput = {
        brief: 'The unemployment rate is 15%.',
        dimensionScore: 4.0,
        critique: 'Contains inaccurate statistics',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.factualAccuracy);
      expect(result.suggestedEdits).toHaveLength(1);
      expect(result.suggestedEdits[0].priority).toBe('critical');
      expect(result.confidence).toBe(0.95);
    });

    it('should flag unsupported claims', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'Studies prove that this policy always works.',
            suggestedText: 'Some research suggests this policy may be effective in certain contexts.',
            rationale: 'The original claim overstates the evidence. Hedging language is more appropriate.',
            priority: 'high',
          },
        ],
        confidence: 0.88,
      }));

      const input: FixerInput = {
        brief: 'Studies prove that this policy always works.',
        dimensionScore: 5.0,
        critique: 'Overstates certainty of claims',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('overstates');
    });

    it('should correct misattributed quotes', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'As Einstein said, "The definition of insanity..."',
            suggestedText: 'A commonly cited phrase states that "The definition of insanity..." (attribution uncertain)',
            rationale: 'This quote is commonly misattributed to Einstein. The actual source is unclear.',
            priority: 'medium',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        brief: 'As Einstein said, "The definition of insanity..."',
        dimensionScore: 6.0,
        critique: 'Contains potentially misattributed quote',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('misattributed');
    });

    it('should suggest hedging for uncertain claims', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'This will definitely cause economic growth.',
            suggestedText: 'This could potentially contribute to economic growth.',
            rationale: 'Economic outcomes are uncertain. Adding hedging language improves accuracy.',
            priority: 'high',
          },
        ],
        confidence: 0.82,
      }));

      const input: FixerInput = {
        brief: 'This will definitely cause economic growth.',
        dimensionScore: 5.5,
        critique: 'Claims certainty where none exists',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toHaveLength(1);
      expect(result.suggestedEdits[0].priority).toBe('high');
    });

    it('should correct date inaccuracies', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Historical Background',
            originalText: 'The treaty was signed in 1995.',
            suggestedText: 'The treaty was signed in 1992.',
            rationale: 'The correct date according to historical records is 1992.',
            priority: 'critical',
          },
        ],
        confidence: 0.98,
      }));

      const input: FixerInput = {
        brief: 'The treaty was signed in 1995.',
        dimensionScore: 4.5,
        critique: 'Contains incorrect date',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].priority).toBe('critical');
      expect(result.confidence).toBe(0.98);
    });

    it('should handle factually accurate content with no edits', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.92,
      }));

      const input: FixerInput = {
        brief: 'Water boils at 100 degrees Celsius at sea level.',
        dimensionScore: 9.0,
        critique: 'All claims are well-supported',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
      expect(result.confidence).toBe(0.92);
    });

    it('should include processing time in result', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        brief: 'Test brief content',
        dimensionScore: 7.0,
        critique: '',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });

    it('should handle sources in input for cross-referencing', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Data',
            originalText: 'The source states 50%.',
            suggestedText: 'According to the cited study, the figure is actually 45%.',
            rationale: 'Cross-referencing with the provided source shows a discrepancy.',
            priority: 'high',
          },
        ],
        confidence: 0.91,
      }));

      const input: FixerInput = {
        brief: 'The source states 50%.',
        dimensionScore: 5.0,
        critique: 'Misquotes source data',
        sources: [
          {
            url: 'https://example.com/study',
            title: 'Research Study',
            content: 'The actual figure is 45%.',
          },
        ],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('source');
    });

    it('should handle empty critique gracefully', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        brief: 'Test brief without critique.',
        dimensionScore: 7.5,
        critique: '',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.factualAccuracy);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle malformed JSON response gracefully', async () => {
      queueMockResponse('This is not valid JSON at all');
      queueMockResponse('Still not valid');
      queueMockResponse('{"suggestedEdits": [], "confidence": 0.5}');

      const input: FixerInput = {
        brief: 'Test brief',
        dimensionScore: 6.0,
        critique: 'Test critique',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.factualAccuracy);
      expect(result.suggestedEdits).toBeDefined();
    });
  });
});
