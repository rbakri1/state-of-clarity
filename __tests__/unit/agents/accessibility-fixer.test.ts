/**
 * Accessibility Fixer Unit Tests
 *
 * Tests for the accessibility-focused fixer agent.
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

import { AccessibilityFixer } from '@/lib/agents/fixers/accessibility-fixer';

describe('AccessibilityFixer', () => {
  let fixer: AccessibilityFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new AccessibilityFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.accessibility);
    });

    it('should have description about clarity and readability', () => {
      expect(fixer.description).toContain('clarity');
      expect(fixer.description).toContain('readability');
    });
  });

  describe('suggestEdits', () => {
    it('should suggest edits for jargon and technical terms', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Introduction',
            originalText: 'The QE measures implemented by the central bank...',
            suggestedText: 'The quantitative easing (QE) measures implemented by the central bank...',
            rationale: 'Spell out acronym on first use for clarity',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The QE measures implemented by the central bank...',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.accessibility);
      expect(result.suggestedEdits).toHaveLength(1);
      expect(result.suggestedEdits[0].section).toBe('Introduction');
    });

    it('should suggest breaking complex sentences', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'While the government has stated its intention to implement reforms, the opposition has consistently argued that the proposed changes, which include tax increases and spending cuts, would disproportionately affect lower-income households, leading to significant protests.',
            suggestedText: 'The government has stated its intention to implement reforms. However, the opposition argues that the proposed changes—including tax increases and spending cuts—would disproportionately affect lower-income households. This has led to significant protests.',
            rationale: 'Break complex sentence into shorter, clearer sentences',
            priority: 'high',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'While the government has stated...',
        dimensionScore: 5.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('sentence');
    });

    it('should suggest simplifying academic language', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'The aforementioned considerations necessitate a paradigm shift.',
            suggestedText: 'These factors require a fundamental change in approach.',
            rationale: 'Simplify academic language for general audience',
            priority: 'medium',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The aforementioned considerations...',
        dimensionScore: 6.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.8);
    });

    it('should include critique in prompt when provided', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.7,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Test brief content',
        dimensionScore: 6.0,
        critique: 'Too much jargon for general readers',
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty edits when brief is already clear', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'This brief is written in plain language.',
        dimensionScore: 8.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
