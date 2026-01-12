/**
 * Quality Gate Unit Tests
 *
 * Tests for the quality gate orchestrator including tier classification,
 * consensus scoring, and refinement loop coordination.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueMockResponse, resetAnthropicMocks } from '../../mocks/anthropic';

// Mock Anthropic before importing quality-gate
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
  };
});

import { runQualityGate, getTierDecision } from '@/lib/agents/quality-gate';
import { QualityTier } from '@/lib/types/quality-gate';

describe('Quality Gate', () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  describe('getTierDecision', () => {
    it('should classify score >= 8.0 as HIGH tier', () => {
      const decision = getTierDecision(8.0);

      expect(decision.tier).toBe(QualityTier.HIGH);
      expect(decision.publishable).toBe(true);
      expect(decision.warningBadge).toBe(false);
      expect(decision.refundRequired).toBe(false);
    });

    it('should classify score 8.5 as HIGH tier', () => {
      const decision = getTierDecision(8.5);

      expect(decision.tier).toBe(QualityTier.HIGH);
      expect(decision.publishable).toBe(true);
    });

    it('should classify score 10.0 as HIGH tier', () => {
      const decision = getTierDecision(10.0);

      expect(decision.tier).toBe(QualityTier.HIGH);
      expect(decision.publishable).toBe(true);
    });

    it('should classify score 7.9 as ACCEPTABLE tier', () => {
      const decision = getTierDecision(7.9);

      expect(decision.tier).toBe(QualityTier.ACCEPTABLE);
      expect(decision.publishable).toBe(true);
      expect(decision.warningBadge).toBe(true);
      expect(decision.refundRequired).toBe(false);
    });

    it('should classify score 6.0 as ACCEPTABLE tier', () => {
      const decision = getTierDecision(6.0);

      expect(decision.tier).toBe(QualityTier.ACCEPTABLE);
      expect(decision.publishable).toBe(true);
      expect(decision.warningBadge).toBe(true);
    });

    it('should classify score 6.5 as ACCEPTABLE tier', () => {
      const decision = getTierDecision(6.5);

      expect(decision.tier).toBe(QualityTier.ACCEPTABLE);
      expect(decision.publishable).toBe(true);
    });

    it('should classify score 5.9 as FAILED tier', () => {
      const decision = getTierDecision(5.9);

      expect(decision.tier).toBe(QualityTier.FAILED);
      expect(decision.publishable).toBe(false);
      expect(decision.warningBadge).toBe(false);
      expect(decision.refundRequired).toBe(true);
    });

    it('should classify score 0 as FAILED tier', () => {
      const decision = getTierDecision(0);

      expect(decision.tier).toBe(QualityTier.FAILED);
      expect(decision.publishable).toBe(false);
      expect(decision.refundRequired).toBe(true);
    });

    it('should classify score 3.0 as FAILED tier', () => {
      const decision = getTierDecision(3.0);

      expect(decision.tier).toBe(QualityTier.FAILED);
      expect(decision.publishable).toBe(false);
      expect(decision.refundRequired).toBe(true);
    });

    it('should include reasoning in decision', () => {
      const highDecision = getTierDecision(9.0);
      expect(highDecision.reasoning).toContain('High quality');

      const acceptableDecision = getTierDecision(7.0);
      expect(acceptableDecision.reasoning).toContain('Acceptable');

      const failedDecision = getTierDecision(4.0);
      expect(failedDecision.reasoning).toContain('Failed');
    });
  });

  describe('runQualityGate', () => {
    const mockBrief = {
      title: 'Test Brief',
      summary: 'This is a test summary',
      content: 'This is the test content of the brief.',
      sources: [],
    };

    const mockSources = [
      {
        url: 'https://example.com',
        title: 'Test Source',
        publisher: 'Test Publisher',
        source_type: 'primary' as const,
        political_lean: 'center' as const,
        credibility_score: 0.9,
        relevance_score: 0.8,
        published_date: '2025-01-01',
        excerpt: 'Test excerpt',
      },
    ];

    it('should return HIGH tier result for high-scoring brief', async () => {
      // Mock all 3 evaluators returning high scores
      queueMockResponse(JSON.stringify({ score: 9.0, reasoning: 'Excellent clarity' }));
      queueMockResponse(JSON.stringify({ score: 8.5, reasoning: 'Strong evidence' }));
      queueMockResponse(JSON.stringify({ score: 9.0, reasoning: 'Very objective' }));

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.tier).toBe(QualityTier.HIGH);
      expect(result.finalScore).toBeGreaterThanOrEqual(8.0);
      expect(result.publishable).toBe(true);
    });

    it('should return ACCEPTABLE tier for moderate scores', async () => {
      // Mock evaluators returning moderate scores
      queueMockResponse(JSON.stringify({ score: 7.0, reasoning: 'Good clarity' }));
      queueMockResponse(JSON.stringify({ score: 6.5, reasoning: 'Adequate evidence' }));
      queueMockResponse(JSON.stringify({ score: 7.5, reasoning: 'Fairly objective' }));

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.tier).toBe(QualityTier.ACCEPTABLE);
      expect(result.finalScore).toBeGreaterThanOrEqual(6.0);
      expect(result.finalScore).toBeLessThan(8.0);
      expect(result.publishable).toBe(true);
    });

    it('should attempt refinement for low scores', async () => {
      // First attempt: low scores
      queueMockResponse(JSON.stringify({ score: 4.0, reasoning: 'Poor clarity' }));
      queueMockResponse(JSON.stringify({ score: 5.0, reasoning: 'Weak evidence' }));
      queueMockResponse(JSON.stringify({ score: 4.5, reasoning: 'Biased' }));

      // Refinement response
      queueMockResponse(JSON.stringify({
        improved: true,
        title: 'Improved Title',
        summary: 'Improved summary',
        content: 'Improved content',
        changes_made: 'Enhanced clarity',
      }));

      // Second attempt after refinement: better scores
      queueMockResponse(JSON.stringify({ score: 7.0, reasoning: 'Better clarity' }));
      queueMockResponse(JSON.stringify({ score: 7.5, reasoning: 'Improved evidence' }));
      queueMockResponse(JSON.stringify({ score: 7.0, reasoning: 'More balanced' }));

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.attempts).toBeGreaterThan(1);
    });

    it('should return FAILED tier when refinement cannot improve score', async () => {
      // First attempt: very low scores
      queueMockResponse(JSON.stringify({ score: 2.0, reasoning: 'Incomprehensible' }));
      queueMockResponse(JSON.stringify({ score: 2.5, reasoning: 'No evidence' }));
      queueMockResponse(JSON.stringify({ score: 2.0, reasoning: 'Completely biased' }));

      // Refinement fails
      queueMockResponse(JSON.stringify({
        improved: false,
        reason: 'Content cannot be salvaged',
      }));

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.tier).toBe(QualityTier.FAILED);
      expect(result.publishable).toBe(false);
    });

    it('should not exceed max refinement attempts', async () => {
      // Queue responses for 3 attempts, all failing
      for (let i = 0; i < 3; i++) {
        queueMockResponse(JSON.stringify({ score: 3.0, reasoning: 'Still poor' }));
        queueMockResponse(JSON.stringify({ score: 3.5, reasoning: 'Still weak' }));
        queueMockResponse(JSON.stringify({ score: 3.0, reasoning: 'Still biased' }));

        if (i < 2) {
          queueMockResponse(JSON.stringify({
            improved: true,
            title: 'Attempt ' + (i + 1),
            summary: 'Improved summary',
            content: 'Improved content',
            changes_made: 'Minor fixes',
          }));
        }
      }

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.attempts).toBeLessThanOrEqual(3);
    });

    it('should track attempt count', async () => {
      // First attempt succeeds with high score
      queueMockResponse(JSON.stringify({ score: 9.0, reasoning: 'Excellent' }));
      queueMockResponse(JSON.stringify({ score: 9.5, reasoning: 'Outstanding' }));
      queueMockResponse(JSON.stringify({ score: 9.0, reasoning: 'Very fair' }));

      const result = await runQualityGate(mockBrief, mockSources);

      expect(result.attempts).toBe(1);
    });
  });

  describe('Threshold Edge Cases', () => {
    it('should handle exactly 8.0 score as HIGH', () => {
      const decision = getTierDecision(8.0);
      expect(decision.tier).toBe(QualityTier.HIGH);
    });

    it('should handle 7.99999 as ACCEPTABLE', () => {
      const decision = getTierDecision(7.99999);
      expect(decision.tier).toBe(QualityTier.ACCEPTABLE);
    });

    it('should handle exactly 6.0 as ACCEPTABLE', () => {
      const decision = getTierDecision(6.0);
      expect(decision.tier).toBe(QualityTier.ACCEPTABLE);
    });

    it('should handle 5.99999 as FAILED', () => {
      const decision = getTierDecision(5.99999);
      expect(decision.tier).toBe(QualityTier.FAILED);
    });

    it('should handle negative scores as FAILED', () => {
      const decision = getTierDecision(-1);
      expect(decision.tier).toBe(QualityTier.FAILED);
      expect(decision.refundRequired).toBe(true);
    });

    it('should handle scores above 10 as HIGH', () => {
      const decision = getTierDecision(11);
      expect(decision.tier).toBe(QualityTier.HIGH);
    });
  });
});
