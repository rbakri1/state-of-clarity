/**
 * First Principles Fixer Unit Tests
 *
 * Tests for the first-principles coherence fixer agent.
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

import { FirstPrinciplesFixer } from '@/lib/agents/fixers/first-principles-fixer';

describe('FirstPrinciplesFixer', () => {
  let fixer: FirstPrinciplesFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new FirstPrinciplesFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.firstPrinciplesCoherence);
    });

    it('should have description about logical coherence', () => {
      expect(fixer.description).toContain('logical');
      expect(fixer.description).toContain('coherence');
    });
  });

  describe('suggestEdits', () => {
    it('should identify gaps in logical chain', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Key Arguments',
            originalText: 'Interest rates rose. Therefore, housing prices must fall.',
            suggestedText: 'Interest rates rose, which increases the cost of mortgages. Higher mortgage costs reduce demand for housing purchases. With reduced demand, housing prices are likely to fall.',
            rationale: 'Add intermediate steps in logical reasoning chain',
            priority: 'high',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Interest rates rose. Therefore, housing prices must fall.',
        dimensionScore: 5.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.firstPrinciplesCoherence);
      expect(result.suggestedEdits[0].rationale).toContain('logical');
    });

    it('should make unstated assumptions explicit', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'Since markets are efficient, the policy will work.',
            suggestedText: 'This analysis assumes efficient market conditions—that is, prices quickly reflect available information and resources flow to highest-value uses. Under these conditions, the policy is expected to work.',
            rationale: 'Make economic assumption explicit',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Since markets are efficient, the policy will work.',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].section).toBe('Introduction');
    });

    it('should flag incomplete reasoning', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'Given these factors, the outcome is inevitable.',
            suggestedText: 'Given these factors—rising costs, declining demand, and regulatory pressure—the outcome of market consolidation becomes increasingly likely, though not inevitable given potential policy interventions.',
            rationale: 'Strengthen reasoning chain and qualify conclusion',
            priority: 'medium',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Given these factors, the outcome is inevitable.',
        dimensionScore: 6.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.8);
    });

    it('should handle well-reasoned content', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.95,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Given assumption A, we can derive B. From B, it follows that C.',
        dimensionScore: 9.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
