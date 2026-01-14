/**
 * Retry Queue Service Unit Tests
 *
 * Tests for managing the retry queue for failed briefs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedMockData, clearMockData, getMockData } from '../../mocks/supabase';

// Mock the Supabase client before importing the service
vi.mock('@/lib/supabase/client', async () => {
  const { createMockSupabaseClient } = await import('../../mocks/supabase');
  return {
    createServiceRoleClient: () => createMockSupabaseClient(),
    createBrowserClient: () => createMockSupabaseClient(),
    createServerSupabaseClient: async () => createMockSupabaseClient(),
  };
});

import {
  addToRetryQueue,
  getNextRetryItem,
  markRetryComplete,
  generateRetryParams,
} from '@/lib/services/retry-queue-service';
import type { RetryParams } from '@/lib/types/quality-gate';

describe('Retry Queue Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockData();
  });

  describe('addToRetryQueue', () => {
    it('should add a failed brief to the retry queue', async () => {
      const briefId = 'brief-123';
      const question = 'What is the impact of Brexit on trade?';
      const classification = { topic: 'politics', complexity: 'high' };
      const failureReason = 'Score below 6.0 threshold';
      const retryParams: RetryParams = {
        increasedSourceDiversity: true,
        forceOpposingViews: true,
      };

      await addToRetryQueue(briefId, question, classification, failureReason, retryParams);

      const queueItems = getMockData('retry_queue');
      expect(queueItems.length).toBe(1);
      expect(queueItems[0].brief_id).toBe(briefId);
      expect(queueItems[0].original_question).toBe(question);
      expect(queueItems[0].classification).toEqual(classification);
      expect(queueItems[0].failure_reason).toBe(failureReason);
      expect(queueItems[0].retry_params).toEqual(retryParams);
      expect(queueItems[0].attempts).toBe(0);
      expect(queueItems[0].status).toBe('pending');
    });

    it('should schedule retry for 1 hour in the future', async () => {
      const before = Date.now();

      await addToRetryQueue(
        'brief-time',
        'Test question',
        {},
        'Low score',
        {}
      );

      const after = Date.now();
      const queueItems = getMockData('retry_queue');
      const scheduledAt = new Date(queueItems[0].scheduled_at).getTime();

      // Should be approximately 1 hour (3600000ms) from now
      const expectedMin = before + 60 * 60 * 1000;
      const expectedMax = after + 60 * 60 * 1000;

      expect(scheduledAt).toBeGreaterThanOrEqual(expectedMin);
      expect(scheduledAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should handle null briefId', async () => {
      await addToRetryQueue(
        null,
        'Question without brief',
        { source: 'test' },
        'Initial generation failed',
        { minSources: 5 }
      );

      const queueItems = getMockData('retry_queue');
      expect(queueItems.length).toBe(1);
      expect(queueItems[0].brief_id).toBeNull();
    });

    it('should store complex retry params', async () => {
      const retryParams: RetryParams = {
        specialistPersona: 'Neutral Analyst',
        adjustedPrompts: ['Use shorter sentences', 'Define technical terms'],
        increasedSourceDiversity: true,
        forceOpposingViews: true,
        minSources: 10,
      };

      await addToRetryQueue(
        'brief-complex',
        'Complex topic question',
        { topic: 'economics' },
        'Multiple quality issues',
        retryParams
      );

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].retry_params).toEqual(retryParams);
    });
  });

  describe('getNextRetryItem', () => {
    it('should return null when queue is empty', async () => {
      const result = await getNextRetryItem();

      expect(result).toBeNull();
    });

    it('should return null when no items are ready', async () => {
      const futureTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      seedMockData('retry_queue', [
        {
          id: 'retry-future',
          brief_id: 'brief-1',
          original_question: 'Future question',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: futureTime.toISOString(),
          attempts: 0,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await getNextRetryItem();

      expect(result).toBeNull();
    });

    it('should return the oldest ready item', async () => {
      const now = new Date();
      const olderTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const newerTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      seedMockData('retry_queue', [
        {
          id: 'retry-newer',
          brief_id: 'brief-newer',
          original_question: 'Newer question',
          classification: {},
          failure_reason: 'Test',
          retry_params: { minSources: 5 },
          scheduled_at: newerTime.toISOString(),
          attempts: 0,
          status: 'pending',
          created_at: newerTime.toISOString(),
        },
        {
          id: 'retry-older',
          brief_id: 'brief-older',
          original_question: 'Older question',
          classification: { topic: 'politics' },
          failure_reason: 'Low score',
          retry_params: { forceOpposingViews: true },
          scheduled_at: olderTime.toISOString(),
          attempts: 1,
          status: 'pending',
          created_at: olderTime.toISOString(),
        },
      ]);

      const result = await getNextRetryItem();

      expect(result).not.toBeNull();
      expect(result!.id).toBe('retry-older');
      expect(result!.briefId).toBe('brief-older');
      expect(result!.originalQuestion).toBe('Older question');
      expect(result!.attempts).toBe(1);
    });

    it('should update status to processing when fetching', async () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000);

      seedMockData('retry_queue', [
        {
          id: 'retry-process',
          brief_id: 'brief-process',
          original_question: 'Question to process',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: pastTime.toISOString(),
          attempts: 0,
          status: 'pending',
          created_at: pastTime.toISOString(),
        },
      ]);

      await getNextRetryItem();

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('processing');
    });

    it('should skip items that are not pending', async () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000);

      seedMockData('retry_queue', [
        {
          id: 'retry-processing',
          brief_id: 'brief-1',
          original_question: 'Already processing',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: pastTime.toISOString(),
          attempts: 0,
          status: 'processing', // Not pending
          created_at: pastTime.toISOString(),
        },
        {
          id: 'retry-completed',
          brief_id: 'brief-2',
          original_question: 'Already completed',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: pastTime.toISOString(),
          attempts: 1,
          status: 'completed', // Not pending
          created_at: pastTime.toISOString(),
        },
      ]);

      const result = await getNextRetryItem();

      expect(result).toBeNull();
    });

    it('should map row to RetryQueueItem correctly', async () => {
      const scheduledTime = new Date(Date.now() - 30 * 60 * 1000);
      const createdTime = new Date(Date.now() - 2 * 60 * 60 * 1000);

      seedMockData('retry_queue', [
        {
          id: 'retry-map',
          brief_id: 'brief-map',
          original_question: 'Mapped question?',
          classification: { topic: 'health', region: 'UK' },
          failure_reason: 'Evidence lacking',
          retry_params: {
            increasedSourceDiversity: true,
            minSources: 8,
          },
          scheduled_at: scheduledTime.toISOString(),
          attempts: 2,
          status: 'pending',
          created_at: createdTime.toISOString(),
        },
      ]);

      const result = await getNextRetryItem();

      expect(result).not.toBeNull();
      expect(result!.id).toBe('retry-map');
      expect(result!.briefId).toBe('brief-map');
      expect(result!.originalQuestion).toBe('Mapped question?');
      expect(result!.classification).toEqual({ topic: 'health', region: 'UK' });
      expect(result!.failureReason).toBe('Evidence lacking');
      expect(result!.retryParams).toEqual({
        increasedSourceDiversity: true,
        minSources: 8,
      });
      expect(result!.attempts).toBe(2);
      // Note: In the real implementation, status would be 'pending' in the returned item
      // (mapped from original row), but the mock updates data in-place, so we see 'processing'
      // This is acceptable for testing the mapping logic
      expect(result!.scheduledAt).toBeInstanceOf(Date);
      expect(result!.createdAt).toBeInstanceOf(Date);

      // Verify the database was updated to processing
      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('processing');
    });

    it('should handle null brief_id in mapping', async () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000);

      seedMockData('retry_queue', [
        {
          id: 'retry-null-brief',
          brief_id: null,
          original_question: 'Question without brief',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: pastTime.toISOString(),
          attempts: 0,
          status: 'pending',
          created_at: pastTime.toISOString(),
        },
      ]);

      const result = await getNextRetryItem();

      expect(result).not.toBeNull();
      expect(result!.briefId).toBe('');
    });
  });

  describe('markRetryComplete', () => {
    it('should mark successful retry as completed', async () => {
      seedMockData('retry_queue', [
        {
          id: 'retry-success',
          brief_id: 'brief-success',
          original_question: 'Success question',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: new Date().toISOString(),
          attempts: 0,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ]);

      await markRetryComplete('retry-success', true);

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('completed');
      expect(queueItems[0].attempts).toBe(1);
    });

    it('should reschedule failed retry for another attempt', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      seedMockData('retry_queue', [
        {
          id: 'retry-fail-1',
          brief_id: 'brief-fail',
          original_question: 'Fail question',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: new Date().toISOString(),
          attempts: 0,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ]);

      const beforeMark = Date.now();
      await markRetryComplete('retry-fail-1', false);
      const afterMark = Date.now();

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('pending');
      expect(queueItems[0].attempts).toBe(1);

      // Should be rescheduled for 1 hour later
      const scheduledAt = new Date(queueItems[0].scheduled_at).getTime();
      expect(scheduledAt).toBeGreaterThanOrEqual(beforeMark + 60 * 60 * 1000);
      expect(scheduledAt).toBeLessThanOrEqual(afterMark + 60 * 60 * 1000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('will retry again (attempt 1/2)')
      );

      consoleSpy.mockRestore();
    });

    it('should abandon retry after max attempts (2)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      seedMockData('retry_queue', [
        {
          id: 'retry-max',
          brief_id: 'brief-max',
          original_question: 'Max attempts question',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: new Date().toISOString(),
          attempts: 1, // Already attempted once
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ]);

      await markRetryComplete('retry-max', false);

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('abandoned');
      expect(queueItems[0].attempts).toBe(2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('abandoned after 2 attempts')
      );

      consoleSpy.mockRestore();
    });

    it('should handle retry success on second attempt', async () => {
      seedMockData('retry_queue', [
        {
          id: 'retry-second',
          brief_id: 'brief-second',
          original_question: 'Second attempt question',
          classification: {},
          failure_reason: 'Test',
          retry_params: {},
          scheduled_at: new Date().toISOString(),
          attempts: 1,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ]);

      await markRetryComplete('retry-second', true);

      const queueItems = getMockData('retry_queue');
      expect(queueItems[0].status).toBe('completed');
      expect(queueItems[0].attempts).toBe(2);
    });
  });

  describe('generateRetryParams', () => {
    it('should set increasedSourceDiversity for evidence issues', () => {
      const params = generateRetryParams('Low evidence score - insufficient sources');

      expect(params.increasedSourceDiversity).toBe(true);
      expect(params.minSources).toBe(10);
    });

    it('should set increasedSourceDiversity for source issues', () => {
      const params = generateRetryParams('Source quality is below acceptable threshold');

      expect(params.increasedSourceDiversity).toBe(true);
      expect(params.minSources).toBe(10);
    });

    it('should set forceOpposingViews for objectivity issues', () => {
      const params = generateRetryParams('Objectivity score too low - lacks balance');

      expect(params.forceOpposingViews).toBe(true);
      expect(params.specialistPersona).toBe('Neutral Analyst');
    });

    it('should set forceOpposingViews for bias issues', () => {
      const params = generateRetryParams('Detected bias towards one perspective');

      expect(params.forceOpposingViews).toBe(true);
      expect(params.specialistPersona).toBe('Neutral Analyst');
    });

    it('should set adjustedPrompts for clarity issues', () => {
      const params = generateRetryParams('Clarity score below threshold');

      expect(params.adjustedPrompts).toEqual([
        'Use shorter sentences',
        'Define technical terms',
        'Structure with clear headings',
      ]);
    });

    it('should set adjustedPrompts for unclear content', () => {
      const params = generateRetryParams('Content is unclear and hard to follow');

      expect(params.adjustedPrompts).toEqual([
        'Use shorter sentences',
        'Define technical terms',
        'Structure with clear headings',
      ]);
    });

    it('should handle multiple issue types', () => {
      const params = generateRetryParams(
        'Issues detected: low evidence, bias, and unclear writing'
      );

      expect(params.increasedSourceDiversity).toBe(true);
      expect(params.minSources).toBe(10);
      expect(params.forceOpposingViews).toBe(true);
      expect(params.specialistPersona).toBe('Neutral Analyst');
      expect(params.adjustedPrompts).toEqual([
        'Use shorter sentences',
        'Define technical terms',
        'Structure with clear headings',
      ]);
    });

    it('should use default params for unrecognized failure reason', () => {
      const params = generateRetryParams('Unknown error occurred during generation');

      expect(params.increasedSourceDiversity).toBe(true);
      expect(params.forceOpposingViews).toBe(true);
    });

    it('should be case insensitive', () => {
      const params1 = generateRetryParams('EVIDENCE lacking in article');
      const params2 = generateRetryParams('Evidence lacking in article');
      const params3 = generateRetryParams('evidence lacking in article');

      expect(params1.increasedSourceDiversity).toBe(true);
      expect(params2.increasedSourceDiversity).toBe(true);
      expect(params3.increasedSourceDiversity).toBe(true);
    });

    it('should return empty object structure for generic issues with defaults', () => {
      const params = generateRetryParams('General quality failure');

      // Default behavior when no specific issue detected
      expect(params.increasedSourceDiversity).toBe(true);
      expect(params.forceOpposingViews).toBe(true);
      expect(params.adjustedPrompts).toBeUndefined();
      expect(params.minSources).toBeUndefined();
      expect(params.specialistPersona).toBeUndefined();
    });
  });
});
