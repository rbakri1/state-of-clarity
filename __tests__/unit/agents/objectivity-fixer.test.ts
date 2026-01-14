/**
 * Objectivity Fixer Unit Tests
 *
 * Tests for the objectivity fixer agent.
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

import { ObjectivityFixer } from '@/lib/agents/fixers/objectivity-fixer';

describe('ObjectivityFixer', () => {
  let fixer: ObjectivityFixer;

  beforeEach(() => {
    resetAnthropicMocks();
    fixer = new ObjectivityFixer();
  });

  describe('Configuration', () => {
    it('should have correct fixer type', () => {
      expect(fixer.fixerType).toBe(FixerType.objectivity);
    });

    it('should have description about balance and perspectives', () => {
      expect(fixer.description).toContain('balance');
    });
  });

  describe('suggestEdits', () => {
    it('should suggest adding missing perspectives', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Key Arguments',
            originalText: 'Proponents argue that the policy will stimulate growth.',
            suggestedText: 'Proponents argue that the policy will stimulate growth. However, critics from labor unions contend that the benefits may not reach workers.',
            rationale: 'Add underrepresented labor perspective',
            priority: 'high',
          },
        ],
        confidence: 0.85,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Proponents argue...',
        dimensionScore: 5.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.fixerType).toBe(FixerType.objectivity);
      expect(result.suggestedEdits[0].rationale).toContain('perspective');
    });

    it('should identify missing counterarguments', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [
          {
            section: 'Conclusion',
            originalText: 'The evidence clearly supports implementing the policy.',
            suggestedText: 'The evidence generally supports implementing the policy, though some economists note potential risks including inflation and market distortion.',
            rationale: 'Include counterarguments for balance',
            priority: 'high',
          },
        ],
        confidence: 0.8,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'The evidence clearly supports...',
        dimensionScore: 6.0,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.confidence).toBe(0.8);
    });

    it('should handle already balanced content', async () => {
      queueMockResponse(JSON.stringify({
        suggestedEdits: [],
        confidence: 0.9,
      }));

      const input: FixerInput = {
        briefId: 'brief-123',
        narrativeToFix: 'Both proponents and critics make valid points...',
        dimensionScore: 8.5,
        sources: [],
      };

      const result = await fixer.suggestEdits(input);

      expect(result.suggestedEdits).toEqual([]);
    });
  });
});
