/**
 * Question Classifier Unit Tests
 *
 * Tests for classifying policy questions by domain, controversy level,
 * question type, and temporal scope.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueMockResponse, resetAnthropicMocks } from '../../mocks/anthropic';

// Mock Anthropic before importing the classifier
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../../mocks/anthropic');
  return {
    default: MockAnthropic,
  };
});

import { classifyQuestion } from '@/lib/agents/question-classifier';

describe('Question Classifier', () => {
  beforeEach(() => {
    resetAnthropicMocks();
  });

  describe('Domain Classification', () => {
    it('should classify economics questions correctly', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'medium',
        questionType: 'analytical',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is the impact of inflation on UK wages?");

      expect(result.domain).toBe('economics');
    });

    it('should classify healthcare questions correctly', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'healthcare',
        controversyLevel: 'medium',
        questionType: 'analytical',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("Why are NHS waiting times increasing?");

      expect(result.domain).toBe('healthcare');
    });

    it('should classify climate questions correctly', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'climate',
        controversyLevel: 'high',
        questionType: 'opinion',
        temporalScope: 'future',
      }));

      const result = await classifyQuestion("Should the UK ban petrol cars by 2030?");

      expect(result.domain).toBe('climate');
    });

    it('should classify technology questions correctly', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'technology',
        controversyLevel: 'medium',
        questionType: 'analytical',
        temporalScope: 'future',
      }));

      const result = await classifyQuestion("How will AI regulation affect UK tech startups?");

      expect(result.domain).toBe('technology');
    });

    it('should default to "other" for invalid domain', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'invalid-domain',
        controversyLevel: 'low',
        questionType: 'factual',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is the meaning of life?");

      expect(result.domain).toBe('other');
    });
  });

  describe('Controversy Level Classification', () => {
    it('should classify low controversy questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'factual',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is GDP?");

      expect(result.controversyLevel).toBe('low');
    });

    it('should classify medium controversy questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'medium',
        questionType: 'opinion',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("Should the UK adopt a 4-day work week?");

      expect(result.controversyLevel).toBe('medium');
    });

    it('should classify high controversy questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'governance',
        controversyLevel: 'high',
        questionType: 'opinion',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("Should the UK rejoin the European Union?");

      expect(result.controversyLevel).toBe('high');
    });

    it('should default to "medium" for invalid controversy level', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'extreme', // invalid
        questionType: 'factual',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is the interest rate?");

      expect(result.controversyLevel).toBe('medium');
    });
  });

  describe('Question Type Classification', () => {
    it('should classify factual questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'factual',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is the current UK unemployment rate?");

      expect(result.questionType).toBe('factual');
    });

    it('should classify analytical questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'analytical',
        temporalScope: 'historical',
      }));

      const result = await classifyQuestion("Why did inflation rise in 2022?");

      expect(result.questionType).toBe('analytical');
    });

    it('should classify opinion questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'medium',
        questionType: 'opinion',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("Should we raise interest rates?");

      expect(result.questionType).toBe('opinion');
    });

    it('should classify comparative questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'healthcare',
        controversyLevel: 'medium',
        questionType: 'comparative',
        temporalScope: 'timeless',
      }));

      const result = await classifyQuestion("How does UK healthcare compare to France?");

      expect(result.questionType).toBe('comparative');
    });

    it('should default to "analytical" for invalid question type', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'speculative', // invalid
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What might happen to prices?");

      expect(result.questionType).toBe('analytical');
    });
  });

  describe('Temporal Scope Classification', () => {
    it('should classify historical questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'analytical',
        temporalScope: 'historical',
      }));

      const result = await classifyQuestion("What caused the 2008 financial crisis?");

      expect(result.temporalScope).toBe('historical');
    });

    it('should classify current questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'factual',
        temporalScope: 'current',
      }));

      const result = await classifyQuestion("What is the current inflation rate?");

      expect(result.temporalScope).toBe('current');
    });

    it('should classify future questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'technology',
        controversyLevel: 'medium',
        questionType: 'opinion',
        temporalScope: 'future',
      }));

      const result = await classifyQuestion("Will AI replace most jobs?");

      expect(result.temporalScope).toBe('future');
    });

    it('should classify timeless questions', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'analytical',
        temporalScope: 'timeless',
      }));

      const result = await classifyQuestion("How does inflation affect purchasing power?");

      expect(result.temporalScope).toBe('timeless');
    });

    it('should default to "current" for invalid temporal scope', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'economics',
        controversyLevel: 'low',
        questionType: 'factual',
        temporalScope: 'eternal', // invalid
      }));

      const result = await classifyQuestion("What is money?");

      expect(result.temporalScope).toBe('current');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when JSON cannot be extracted', async () => {
      queueMockResponse('This is not JSON');

      await expect(classifyQuestion("What is GDP?")).rejects.toThrow();
    });

    it('should handle JSON embedded in text', async () => {
      queueMockResponse(`Here is my classification:
        {"domain": "economics", "controversyLevel": "low", "questionType": "factual", "temporalScope": "current"}
        I hope this helps!`);

      const result = await classifyQuestion("What is GDP?");

      expect(result.domain).toBe('economics');
      expect(result.controversyLevel).toBe('low');
      expect(result.questionType).toBe('factual');
      expect(result.temporalScope).toBe('current');
    });

    it('should apply all defaults for completely invalid response', async () => {
      queueMockResponse(JSON.stringify({
        domain: 'xyz',
        controversyLevel: 'xyz',
        questionType: 'xyz',
        temporalScope: 'xyz',
      }));

      const result = await classifyQuestion("Random question");

      expect(result.domain).toBe('other');
      expect(result.controversyLevel).toBe('medium');
      expect(result.questionType).toBe('analytical');
      expect(result.temporalScope).toBe('current');
    });
  });

  describe('All Valid Domains', () => {
    const validDomains = [
      'economics', 'healthcare', 'climate', 'education', 'defense',
      'immigration', 'housing', 'justice', 'technology', 'governance', 'other',
    ];

    validDomains.forEach(domain => {
      it(`should accept "${domain}" as valid domain`, async () => {
        queueMockResponse(JSON.stringify({
          domain,
          controversyLevel: 'low',
          questionType: 'factual',
          temporalScope: 'current',
        }));

        const result = await classifyQuestion(`Question about ${domain}`);

        expect(result.domain).toBe(domain);
      });
    });
  });
});
