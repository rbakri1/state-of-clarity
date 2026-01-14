/**
 * Feedback Screening Service Unit Tests
 *
 * Tests for the AI-powered feedback screening that evaluates user submissions
 * for spam, abuse, and quality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use vi.hoisted to declare mock function before vi.mock is hoisted
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

import {
  screenFeedback,
  type FeedbackType,
  type ScreeningResult,
} from '@/lib/services/feedback-screening';

describe('Feedback Screening Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  describe('screenFeedback - source_suggestion', () => {
    it('should approve legitimate source suggestion', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Legitimate news source suggestion',
              confidence: 0.95,
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://www.bbc.co.uk/news/article-123',
        notes: 'This BBC article provides additional context on the topic',
      });

      expect(result.approved).toBe(true);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toBe('Legitimate news source suggestion');
    });

    it('should flag spam URL', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: true,
              reason: 'Spam URL detected - domain appears to be malicious',
              confidence: 0.99,
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://spam-site.xyz/free-money',
        notes: 'Click here for free stuff!',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(true);
      expect(result.confidence).toBe(0.99);
    });

    it('should handle missing URL gracefully', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: false,
              reason: 'No URL provided - needs review',
              confidence: 0.6,
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        notes: 'I have a source but forgot the URL',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
    });
  });

  describe('screenFeedback - error_report', () => {
    it('should approve legitimate error report', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Valid factual error report with clear description',
              confidence: 0.9,
            }),
          },
        ],
      });

      const result = await screenFeedback('error_report', {
        error_type: 'factual_error',
        description: 'The article states the event happened in 2022, but it was actually in 2021',
      });

      expect(result.approved).toBe(true);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0.9);
    });

    it('should flag abusive error report', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: true,
              reason: 'Contains abusive language',
              confidence: 0.98,
            }),
          },
        ],
      });

      const result = await screenFeedback('error_report', {
        error_type: 'other',
        description: 'This is terrible content with offensive language',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(true);
    });

    it('should handle missing description', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: false,
              reason: 'No description provided - low effort submission',
              confidence: 0.7,
            }),
          },
        ],
      });

      const result = await screenFeedback('error_report', {
        error_type: 'typo',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
    });
  });

  describe('screenFeedback - edit_proposal', () => {
    it('should approve legitimate edit proposal', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Constructive edit proposal with clear rationale',
              confidence: 0.85,
            }),
          },
        ],
      });

      const result = await screenFeedback('edit_proposal', {
        original_text: 'The Prime Miniser announced...',
        proposed_text: 'The Prime Minister announced...',
        rationale: 'Typo correction - missing letter in "Minister"',
      });

      expect(result.approved).toBe(true);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0.85);
    });

    it('should flag vandalism attempt', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: true,
              reason: 'Vandalism attempt - proposed text contains inappropriate content',
              confidence: 0.99,
            }),
          },
        ],
      });

      const result = await screenFeedback('edit_proposal', {
        original_text: 'The government policy...',
        proposed_text: 'Complete nonsense and spam...',
        rationale: 'Improvement',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(true);
    });

    it('should handle missing fields', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: false,
              reason: 'Incomplete edit proposal - missing original or proposed text',
              confidence: 0.5,
            }),
          },
        ],
      });

      const result = await screenFeedback('edit_proposal', {
        rationale: 'Just a general improvement',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
    });
  });

  describe('screenFeedback - error handling', () => {
    it('should return default pending result when AI response has no JSON', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON response',
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.reason).toBe('AI screening unavailable - pending manual review');
      expect(result.confidence).toBe(0);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not extract JSON from Claude screening response'
      );

      consoleSpy.mockRestore();
    });

    it('should return default pending result on API error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const result = await screenFeedback('error_report', {
        description: 'Test error',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.reason).toBe('AI screening unavailable - pending manual review');
      expect(result.confidence).toBe(0);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return default pending result for invalid result structure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: 'yes', // Should be boolean
              flagged: false,
              confidence: 0.8,
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.reason).toBe('AI screening unavailable - pending manual review');
      expect(result.confidence).toBe(0);

      expect(consoleSpy).toHaveBeenCalledWith('Invalid screening result structure');

      consoleSpy.mockRestore();
    });

    it('should return default pending result for missing confidence', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Good content',
              // Missing confidence
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0);

      consoleSpy.mockRestore();
    });

    it('should handle non-text response type', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'image', // Not 'text'
            data: 'base64data',
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.approved).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('screenFeedback - confidence clamping', () => {
    it('should clamp confidence to max 1.0', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Definitely legitimate',
              confidence: 1.5, // Over 1.0
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.confidence).toBe(1);
    });

    it('should clamp confidence to min 0', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: false,
              flagged: false,
              reason: 'Very uncertain',
              confidence: -0.5, // Below 0
            }),
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.confidence).toBe(0);
    });
  });

  describe('screenFeedback - JSON extraction', () => {
    it('should extract JSON from text with surrounding content', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: `Here is my analysis:

{
  "approved": true,
  "flagged": false,
  "reason": "Valid submission",
  "confidence": 0.8
}

Based on the above evaluation...`,
          },
        ],
      });

      const result = await screenFeedback('source_suggestion', {
        url: 'https://example.com',
      });

      expect(result.approved).toBe(true);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(0.8);
    });

    it('should handle multiline JSON in response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: `{
  "approved": true,
  "flagged": false,
  "reason": "This is a multiline reason that spans across several lines and includes details about the evaluation",
  "confidence": 0.75
}`,
          },
        ],
      });

      const result = await screenFeedback('error_report', {
        description: 'Test',
      });

      expect(result.approved).toBe(true);
      expect(result.confidence).toBe(0.75);
    });
  });

  describe('screenFeedback - model parameters', () => {
    it('should call Anthropic API with correct model', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Valid',
              confidence: 0.9,
            }),
          },
        ],
      });

      await screenFeedback('source_suggestion', {
        url: 'https://example.com',
        notes: 'Test notes',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('source suggestion'),
          },
        ],
      });
    });

    it('should include URL and notes in prompt for source_suggestion', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Valid',
              confidence: 0.9,
            }),
          },
        ],
      });

      await screenFeedback('source_suggestion', {
        url: 'https://test.com/article',
        notes: 'Important context here',
      });

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('https://test.com/article');
      expect(callArgs.messages[0].content).toContain('Important context here');
    });

    it('should include error type and description in prompt for error_report', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Valid',
              confidence: 0.9,
            }),
          },
        ],
      });

      await screenFeedback('error_report', {
        error_type: 'factual_error',
        description: 'The date is wrong',
      });

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('factual_error');
      expect(callArgs.messages[0].content).toContain('The date is wrong');
    });

    it('should include original text, proposed text, and rationale in prompt for edit_proposal', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              approved: true,
              flagged: false,
              reason: 'Valid',
              confidence: 0.9,
            }),
          },
        ],
      });

      await screenFeedback('edit_proposal', {
        original_text: 'Original content here',
        proposed_text: 'Proposed content here',
        rationale: 'Improvement rationale',
      });

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('Original content here');
      expect(callArgs.messages[0].content).toContain('Proposed content here');
      expect(callArgs.messages[0].content).toContain('Improvement rationale');
    });
  });
});
