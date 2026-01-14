/**
 * Base Fixer Agent Unit Tests
 *
 * Tests for the abstract base fixer class functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

import { BaseFixer } from '@/lib/agents/fixers/base-fixer';
import { FixerType, FixerInput, FixerResult } from '@/lib/types/refinement';

// Create a concrete implementation for testing
class TestFixer extends BaseFixer {
  readonly fixerType = FixerType.accessibility;
  readonly description = 'Test fixer for unit testing';

  protected buildPrompt(input: FixerInput): string {
    return `Analyze this brief:\n${input.narrativeToFix}\nDimension score: ${input.dimensionScore}`;
  }
}

describe('BaseFixer', () => {
  let fixer: TestFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new TestFixer();
  });

  describe('suggestEdits', () => {
    it('should return fixer result with suggested edits', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'complex terminology here',
            suggestedText: 'simpler terminology here',
            rationale: 'Improves readability',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'This is a test narrative with complex terminology here.',
        dimensionScore: 6.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result).toHaveProperty('fixerType');
      expect(result.fixerType).toBe(FixerType.accessibility);
      expect(result).toHaveProperty('suggestedEdits');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processingTime');
    });

    it('should parse multiple edits', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'text1',
            suggestedText: 'replacement1',
            rationale: 'Reason 1',
            priority: 'high',
          },
          {
            section: 'Body',
            originalText: 'text2',
            suggestedText: 'replacement2',
            rationale: 'Reason 2',
            priority: 'medium',
          },
          {
            section: 'Conclusion',
            originalText: 'text3',
            suggestedText: 'replacement3',
            rationale: 'Reason 3',
            priority: 'low',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test narrative',
        dimensionScore: 5.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toHaveLength(3);
    });

    it('should track processing time', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.5,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 7.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response Parsing', () => {
    it('should handle JSON embedded in text', async () => {
      queueMockResponse(`Here is my analysis:
        {
          "suggestedEdits": [
            {
              "section": "Introduction",
              "originalText": "old",
              "suggestedText": "new",
              "rationale": "Better",
              "priority": "medium"
            }
          ],
          "confidence": 0.75
        }
        Hope this helps!`);

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toHaveLength(1);
      expect(result.confidence).toBe(0.75);
    });

    it('should filter out incomplete edits', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'old',
            // Missing suggestedText
            rationale: 'Reason',
            priority: 'high',
          },
          {
            section: 'Body',
            originalText: 'valid old',
            suggestedText: 'valid new',
            rationale: 'Valid reason',
            priority: 'medium',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      // Only the valid edit should be included
      expect(result.suggestedEdits).toHaveLength(1);
      expect(result.suggestedEdits[0].section).toBe('Body');
    });

    it('should handle invalid JSON gracefully', async () => {
      queueMockResponse('This is not valid JSON at all');

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('should handle malformed JSON gracefully', async () => {
      queueMockResponse('{ suggestedEdits: not-valid }');

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });

  describe('Priority Validation', () => {
    it('should accept valid priority values', async () => {
      const priorities = ['critical', 'high', 'medium', 'low'];

      for (const priority of priorities) {
        queueMockResponse(JSON.stringify({
          suggestedEdits: [
            {
              section: 'Test',
              originalText: 'old',
              suggestedText: 'new',
              rationale: 'Reason',
              priority,
            },
          ],
          confidence: 0.8,
        }));

        const input: FixerInput = {
          briefId: 'brief-123',
          narrativeToFix: 'Test',
          dimensionScore: 6.0,
          sources: [],
        };

        const result = await fixer.suggestEdits(input);

        expect(result.suggestedEdits[0].priority).toBe(priority);
      }
    });

    it('should default invalid priority to medium', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Test',
            originalText: 'old',
            suggestedText: 'new',
            rationale: 'Reason',
            priority: 'invalid-priority',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].priority).toBe('medium');
    });

    it('should default missing priority to medium', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Test',
            originalText: 'old',
            suggestedText: 'new',
            rationale: 'Reason',
            // No priority field
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].priority).toBe('medium');
    });
  });

  describe('Confidence Normalization', () => {
    it('should clamp confidence to 0-1 range', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 1.5, // Above 1
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle negative confidence', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: -0.5,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should default missing confidence to 0.5', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        // No confidence field
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.5);
    });
  });

  describe('String Coercion', () => {
    it('should coerce non-string values to strings', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 123, // Number
            originalText: 'old',
            suggestedText: 'new',
            rationale: 'Reason',
            priority: 'medium',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(typeof result.suggestedEdits[0].section).toBe('string');
      expect(result.suggestedEdits[0].section).toBe('123');
    });
  });

  describe('Empty Results', () => {
    it('should handle empty suggestedEdits array', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.5,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Perfect narrative with no issues.',
        dimensionScore: 9.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
      expect(result.fixerType).toBe(FixerType.accessibility);
    });

    it('should handle missing suggestedEdits field', async () => {
      queueMockResponse(JSON.stringify({
        confidence: 0.5,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
