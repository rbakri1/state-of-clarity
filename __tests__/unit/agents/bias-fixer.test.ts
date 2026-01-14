/**
 * Bias Fixer Unit Tests
 *
 * Tests for the bias detection fixer agent.
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

import { BiasFixer } from '@/lib/agents/fixers/bias-fixer';

describe('BiasFixer', () => {
  let fixer: BiasFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new BiasFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.biasDetection);
    });

    it('should have description about bias and neutrality', () => {
      expect(fixer.description).toContain('bias');
    });
  });

  describe('suggestEdits', () => {
    it('should suggest removing loaded language', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'The government\'s reckless spending has devastated...',
            suggestedText: 'The government\'s increased spending has significantly impacted...',
            rationale: 'Replace loaded language (reckless, devastated) with neutral alternatives',
            priority: 'critical',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The government\'s reckless spending...',
        dimensionScore: 5.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.biasDetection);
      expect(result.suggestedEdits[0].priority).toBe('critical');
    });

    it('should identify selective emphasis', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'Critics argue that the policy failed. Supporters point to minor gains.',
            suggestedText: 'Critics argue that the policy failed to meet its primary objectives. Supporters point to measurable gains in secondary outcomes.',
            rationale: 'Balance emphasis between critic and supporter perspectives',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Critics argue... Supporters point...',
        dimensionScore: 5.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('emphasis');
    });

    it('should detect framing bias', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Key Arguments',
            originalText: 'The question is whether we can afford to continue this program.',
            suggestedText: 'The question is whether the program\'s costs outweigh its benefits.',
            rationale: 'Reframe to avoid presupposing the answer',
            priority: 'high',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The question is whether we can afford...',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toHaveLength(1);
    });

    it('should address attribution bias', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Sources',
            originalText: 'Renowned expert Dr. Smith claims... while a critic says...',
            suggestedText: 'Dr. Smith, a professor of economics, claims... Dr. Jones, a professor of public policy, counters...',
            rationale: 'Balance credibility markers for both sources',
            priority: 'medium',
          },
        ],
        confidence: 0.75,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Renowned expert Dr. Smith...',
        dimensionScore: 6.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.75);
    });

    it('should handle neutral content with no edits', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.95,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'This is a neutral, factual description.',
        dimensionScore: 9.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
      expect(result.confidence).toBe(0.95);
    });
  });
});
