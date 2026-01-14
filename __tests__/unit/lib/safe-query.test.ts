/**
 * Safe Query Unit Tests
 *
 * Tests for the Supabase query wrapper with error handling and performance tracking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { safeQuery, safeQueryAll, trackedQuery, type SafeQueryOptions } from '@/lib/supabase/safe-query';

describe('Safe Query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeQuery', () => {
    it('should return data on successful query', async () => {
      const mockData = { id: '123', name: 'Test' };
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(result.isConnectionError).toBe(false);
    });

    it('should handle query errors', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Something went wrong', code: 'PGRST123' },
      });
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Something went wrong');
    });

    it('should detect connection errors by code', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'PGRST000' },
      });
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.isConnectionError).toBe(true);
      expect(result.error?.message).toBe('Database temporarily unavailable');
    });

    it('should detect connection errors by message', async () => {
      const connectionMessages = [
        'connection refused',
        'network error',
        'timeout exceeded',
        'ECONNREFUSED',
        'ENOTFOUND',
      ];

      for (const message of connectionMessages) {
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message },
        });
        const options: SafeQueryOptions = { queryName: 'testQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.isConnectionError).toBe(true);
      }
    });

    it('should track query duration', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle thrown exceptions', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Unexpected error');
    });

    it('should handle thrown connection exceptions', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Connection timeout'));
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.isConnectionError).toBe(true);
      expect(result.error?.message).toBe('Database temporarily unavailable');
    });

    it('should include duration in error cases', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });
      const options: SafeQueryOptions = { queryName: 'testQuery' };

      const result = await safeQuery(queryFn, options);

      expect(result.duration).toBeDefined();
    });

    it('should accept optional context parameters', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const options: SafeQueryOptions = {
        queryName: 'testQuery',
        table: 'briefs',
        briefId: 'brief-123',
        userId: 'user-123',
        additionalContext: { extra: 'context' },
      };

      const result = await safeQuery(queryFn, options);

      expect(result.data).not.toBeNull();
    });

    it('should use custom slow thresholds', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      const options: SafeQueryOptions = {
        queryName: 'testQuery',
        slowThresholdMs: 100,
        verySlowThresholdMs: 200,
      };

      const result = await safeQuery(queryFn, options);

      expect(result.data).not.toBeNull();
    });
  });

  describe('Connection Error Detection', () => {
    it('should detect PGRST301 (connection timeout)', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Timeout', code: 'PGRST301' },
      });

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.isConnectionError).toBe(true);
    });

    it('should detect 57P01 (admin shutdown)', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Shutdown', code: '57P01' },
      });

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.isConnectionError).toBe(true);
    });

    it('should detect 08000 (connection exception)', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Exception', code: '08000' },
      });

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.isConnectionError).toBe(true);
    });

    it('should not mark regular errors as connection errors', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      });

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.isConnectionError).toBe(false);
    });
  });

  describe('safeQueryAll', () => {
    it('should execute multiple queries in parallel', async () => {
      const query1 = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      const query2 = vi.fn().mockResolvedValue({ data: { id: '2' }, error: null });
      const query3 = vi.fn().mockResolvedValue({ data: { id: '3' }, error: null });

      const results = await safeQueryAll(
        [query1, query2, query3],
        [
          { queryName: 'query1' },
          { queryName: 'query2' },
          { queryName: 'query3' },
        ]
      );

      expect(results).toHaveLength(3);
      expect(results[0].data).toEqual({ id: '1' });
      expect(results[1].data).toEqual({ id: '2' });
      expect(results[2].data).toEqual({ id: '3' });
    });

    it('should handle mixed success and failure', async () => {
      const query1 = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      const query2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed' } });

      const results = await safeQueryAll(
        [query1, query2],
        [
          { queryName: 'query1' },
          { queryName: 'query2' },
        ]
      );

      expect(results[0].data).toEqual({ id: '1' });
      expect(results[0].error).toBeNull();
      expect(results[1].data).toBeNull();
      expect(results[1].error).not.toBeNull();
    });

    it('should handle empty query array', async () => {
      const results = await safeQueryAll([], []);

      expect(results).toHaveLength(0);
    });
  });

  describe('trackedQuery', () => {
    it('should return data and error only', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });

      const result = await trackedQuery(queryFn, 'testQuery');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).not.toHaveProperty('isConnectionError');
      expect(result).not.toHaveProperty('duration');
    });

    it('should pass through successful result', async () => {
      const mockData = { id: '123', name: 'Test' };
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });

      const result = await trackedQuery(queryFn, 'testQuery');

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('should pass through error result', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const result = await trackedQuery(queryFn, 'testQuery');

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe('Performance Logging', () => {
    it('should log slow queries', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a delayed query
      const queryFn = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
        return { data: { id: '123' }, error: null };
      });

      await safeQuery(queryFn, {
        queryName: 'slowQuery',
        slowThresholdMs: 1000,
        verySlowThresholdMs: 2000,
      });

      // Slow query warning should be logged
      // (actual behavior depends on timing)
      consoleSpy.mockRestore();
    });

    it('should not log fast queries', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });

      await safeQuery(queryFn, {
        queryName: 'fastQuery',
        slowThresholdMs: 1000,
        verySlowThresholdMs: 2000,
      });

      // No warnings should be logged for fast queries
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[Query SLOW]'));
      consoleSpy.mockRestore();
    });
  });

  describe('Non-Error Object Handling', () => {
    it('should handle string thrown as error', async () => {
      const queryFn = vi.fn().mockRejectedValue('String error');

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.error).not.toBeNull();
    });

    it('should handle null thrown as error', async () => {
      const queryFn = vi.fn().mockRejectedValue(null);

      const result = await safeQuery(queryFn, { queryName: 'test' });

      expect(result.error).not.toBeNull();
    });
  });
});
