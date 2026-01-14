/**
 * Safe AI Call Unit Tests
 *
 * Tests for the AI call wrapper with retry logic and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { safeAICall, wrapAICall, SafeAICallOptions } from '@/lib/ai/safe-ai-call';

describe('Safe AI Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('safeAICall', () => {
    it('should return data on successful call', async () => {
      const mockFn = vi.fn().mockResolvedValue({ result: 'success' });
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const result = await safeAICall(mockFn, options);

      expect(result.data).toEqual({ result: 'success' });
      expect(result.error).toBeNull();
      expect(result.isAIServiceError).toBe(false);
    });

    it('should return error on failed call after retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 2 });

      // Advance timers for retries
      await vi.advanceTimersByTimeAsync(5000);

      const result = await resultPromise;

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.isAIServiceError).toBe(true);
    });

    it('should retry on transient errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({ result: 'success' });

      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options);

      // Advance timers for retry delay
      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ result: 'success' });
    });

    it('should not retry on authentication errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const result = await safeAICall(mockFn, options, { maxRetries: 3 });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result.error).toBeDefined();
    });

    it('should not retry on forbidden errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('403 Forbidden'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const result = await safeAICall(mockFn, options);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on invalid API key errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Invalid API key'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const result = await safeAICall(mockFn, options);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should log to Sentry on final failure', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Persistent error'));
      const options: SafeAICallOptions = {
        operationName: 'test-operation',
        model: 'claude-3',
        userId: 'user-123',
        briefId: 'brief-456',
      };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 2 });

      await vi.advanceTimersByTimeAsync(10000);

      await resultPromise;

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            operationName: 'test-operation',
            model: 'claude-3',
          }),
          extra: expect.objectContaining({
            userId: 'user-123',
            briefId: 'brief-456',
          }),
        })
      );
    });

    it('should use exponential backoff for retries', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ result: 'success' });

      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });

      // First retry after ~100ms
      await vi.advanceTimersByTimeAsync(200);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Second retry after ~200ms
      await vi.advanceTimersByTimeAsync(300);

      const result = await resultPromise;
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result.data).toEqual({ result: 'success' });
    });
  });

  describe('Error Classification', () => {
    it('should identify rate limit errors as AI service errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(result.isAIServiceError).toBe(true);
    });

    it('should identify 503 errors as AI service errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('503 Service Unavailable'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(result.isAIServiceError).toBe(true);
    });

    it('should identify overloaded errors as AI service errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('API is overloaded'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(result.isAIServiceError).toBe(true);
    });

    it('should identify timeout errors as AI service errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Request timeout'));
      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(result.isAIServiceError).toBe(true);
    });
  });

  describe('Prompt Sanitization', () => {
    it('should sanitize email addresses in prompt summary', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Error'));
      const options: SafeAICallOptions = {
        operationName: 'test-operation',
        promptSummary: 'User john@example.com asked about...',
      };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      await resultPromise;

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            promptSummary: expect.stringContaining('[email]'),
          }),
        })
      );
    });

    it('should truncate long prompts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Error'));
      const longPrompt = 'x'.repeat(500);
      const options: SafeAICallOptions = {
        operationName: 'test-operation',
        promptSummary: longPrompt,
      };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      await resultPromise;

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            promptSummary: expect.stringMatching(/\.\.\.$/),
          }),
        })
      );
    });
  });

  describe('wrapAICall', () => {
    it('should create a wrapped function with retry logic', async () => {
      const originalFn = vi.fn().mockResolvedValue({ data: 'test' });
      const wrappedFn = wrapAICall('test-op', originalFn);

      const result = await wrappedFn();

      expect(result.data).toEqual({ data: 'test' });
      expect(result.error).toBeNull();
    });

    it('should pass arguments to wrapped function', async () => {
      const originalFn = vi.fn().mockResolvedValue('result');
      const wrappedFn = wrapAICall('test-op', originalFn);

      await wrappedFn('arg1', 'arg2');

      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use provided retry options', async () => {
      const originalFn = vi.fn()
        .mockRejectedValueOnce(new Error('Temp error'))
        .mockResolvedValueOnce('success');

      const wrappedFn = wrapAICall(
        'test-op',
        originalFn,
        {},
        { maxRetries: 2, initialDelayMs: 50 }
      );

      const resultPromise = wrappedFn();
      await vi.advanceTimersByTimeAsync(200);
      const result = await resultPromise;

      expect(result.data).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Default Options', () => {
    it('should use default retry options when not specified', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'));

      const options: SafeAICallOptions = { operationName: 'test-operation' };

      const resultPromise = safeAICall(mockFn, options);

      // Wait for all 3 default retries
      await vi.advanceTimersByTimeAsync(20000);

      await resultPromise;

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Additional Context', () => {
    it('should include additional context in Sentry logs', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Error'));
      const options: SafeAICallOptions = {
        operationName: 'test-operation',
        additionalContext: {
          customField: 'customValue',
          attemptedAction: 'generateBrief',
        },
      };

      const resultPromise = safeAICall(mockFn, options, { maxRetries: 1 });
      await vi.advanceTimersByTimeAsync(5000);
      await resultPromise;

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            customField: 'customValue',
            attemptedAction: 'generateBrief',
          }),
        })
      );
    });
  });
});
