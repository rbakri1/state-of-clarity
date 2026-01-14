/**
 * Evidence Fixer Unit Tests
 *
 * Tests for the evidence quality fixer agent.
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

import { EvidenceFixer } from '@/lib/agents/fixers/evidence-fixer';

describe('EvidenceFixer', () => {
  let fixer: EvidenceFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new EvidenceFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.evidenceQuality);
    });

    it('should have description about evidence and citations', () => {
      expect(fixer.description).toContain('evidence');
    });
  });

  describe('suggestEdits', () => {
    it('should suggest adding citations for unsupported claims', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'Studies show that 70% of voters support this policy.',
            suggestedText: 'According to a 2024 survey by the Pew Research Center, 70% of voters support this policy.',
            rationale: 'Add specific citation for statistical claim',
            priority: 'critical',
          },
        ],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Studies show that 70% of voters...',
        dimensionScore: 5.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.evidenceQuality);
      expect(result.suggestedEdits[0].priority).toBe('critical');
    });

    it('should identify weak citations', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Sources',
            originalText: 'As mentioned in a blog post...',
            suggestedText: 'As reported by the Congressional Budget Office...',
            rationale: 'Replace informal source with authoritative source',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'As mentioned in a blog post...',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].rationale).toContain('source');
    });

    it('should flag over-reliance on single source', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Key Arguments',
            originalText: 'According to the report, inflation rose. The report also notes unemployment fell. The report further indicates...',
            suggestedText: 'According to the Treasury report, inflation rose. Independent analysis from the Federal Reserve corroborates that unemployment fell. The Bureau of Labor Statistics data further indicates...',
            rationale: 'Diversify sources to avoid over-reliance on single reference',
            priority: 'high',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'According to the report... The report also... The report further...',
        dimensionScore: 5.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.8);
    });

    it('should check source-claim alignment', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'The study proves that the policy works.',
            suggestedText: 'The study suggests that the policy may have positive effects, though the authors note limitations.',
            rationale: 'Align claim strength with what source actually states',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The study proves that the policy works.',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits[0].section).toBe('Conclusion');
    });

    it('should use provided sources for context', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Body',
            originalText: 'Experts agree...',
            suggestedText: 'According to Professor Jane Smith, quoted in the provided Reuters article...',
            rationale: 'Reference specific source from research',
            priority: 'medium',
          },
        ],
        confidence: 0.75,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Experts agree...',
        dimensionScore: 6.5,
        sources: [
          { url: 'https://reuters.com/article', title: 'Expert Analysis', content: 'Prof. Jane Smith states...' },
        ],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should return no edits for well-cited content', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.95,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'According to the 2024 CBO report (Smith et al., 2024)...',
        dimensionScore: 9.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
