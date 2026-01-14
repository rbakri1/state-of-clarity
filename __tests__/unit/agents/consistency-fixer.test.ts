/**
 * Consistency Fixer Unit Tests
 *
 * Tests for the internal consistency fixer agent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAnthropicMocks, queueMockResponse } from '../../mocks/anthropic';
import { FixerType, FixerInput } from '@/lib/types/refinement';

vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

import { ConsistencyFixer } from '@/lib/agents/fixers/consistency-fixer';

describe('ConsistencyFixer', () => {
  let fixer: ConsistencyFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new ConsistencyFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.internalConsistency);
    });

    it('should have description about consistency', () => {
      expect(fixer.description).toContain('consistency');
    });
  });

  describe('suggestEdits', () => {
    it('should identify contradictions between sections', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'The policy has been entirely unsuccessful.',
            suggestedText: 'The policy has had mixed results, with significant challenges remaining.',
            rationale: 'Conclusion contradicts earlier section stating partial success',
            priority: 'critical',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Introduction states partial success... Conclusion states entirely unsuccessful.',
        dimensionScore: 5.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.internalConsistency);
      expect(result.suggestedEdits[0].priority).toBe('critical');
    });

    it('should ensure terminology consistency', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'the fiscal policy',
            suggestedText: 'the economic stimulus package',
            rationale: 'Use consistent terminology (economic stimulus package) as established in introduction',
            priority: 'medium',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The economic stimulus package... the fiscal policy...',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toHaveLength(1);
    });

    it('should handle brief with no consistency issues', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.95,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Consistent content throughout.',
        dimensionScore: 9.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
