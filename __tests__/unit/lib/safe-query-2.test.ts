/**
 * Safe Query 2 Unit Tests
 *
 * Tests for the simplified Supabase query wrapper with error handling and Sentry logging.
 * This tests the "safe-query 2.ts" file which is a simpler version without performance tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Sentry before imports
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { safeQuery, safeQueryAll, type SafeQueryOptions } from '@/lib/supabase/safe-query 2';

describe('Safe Query 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('safeQuery', () => {
    describe('Successful Queries', () => {
      it('should return data on successful query', async () => {
        const mockData = { id: '123', name: 'Test Brief' };
        const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });
        const options: SafeQueryOptions = { queryName: 'getBrief' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toEqual(mockData);
        expect(result.error).toBeNull();
        expect(result.isConnectionError).toBe(false);
      });

      it('should return null data when query returns null', async () => {
        const queryFn = vi.fn().mockResolvedValue({ data: null, error: null });
        const options: SafeQueryOptions = { queryName: 'getNotFound' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
        expect(result.isConnectionError).toBe(false);
      });

      it('should return array data correctly', async () => {
        const mockData = [{ id: '1' }, { id: '2' }, { id: '3' }];
        const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });
        const options: SafeQueryOptions = { queryName: 'listBriefs' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toEqual(mockData);
        expect(result.data).toHaveLength(3);
      });

      it('should not call Sentry on success', async () => {
        const queryFn = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
        const options: SafeQueryOptions = { queryName: 'testQuery' };

        await safeQuery(queryFn, options);

        expect(Sentry.captureException).not.toHaveBeenCalled();
      });
    });

    describe('Query Errors', () => {
      it('should handle query errors and return error object', async () => {
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row not found', code: 'PGRST116' },
        });
        const options: SafeQueryOptions = { queryName: 'getById' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error?.message).toBe('Row not found');
        expect(result.isConnectionError).toBe(false);
      });

      it('should log error to Sentry with correct tags', async () => {
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'PGRST500' },
        });
        const options: SafeQueryOptions = {
          queryName: 'testQuery',
          table: 'briefs',
          briefId: 'brief-123',
          userId: 'user-456',
        };

        await safeQuery(queryFn, options);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              component: 'supabase',
              queryName: 'testQuery',
              table: 'briefs',
              isConnectionError: false,
            }),
            extra: expect.objectContaining({
              errorCode: 'PGRST500',
              briefId: 'brief-123',
              userId: 'user-456',
            }),
          })
        );
      });

      it('should log error to console', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Something went wrong' },
        });
        const options: SafeQueryOptions = { queryName: 'errorQuery' };

        await safeQuery(queryFn, options);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SafeQuery] errorQuery failed:',
          'Something went wrong'
        );
      });

      it('should include additional context in Sentry logs', async () => {
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        });
        const options: SafeQueryOptions = {
          queryName: 'testQuery',
          additionalContext: {
            customField: 'customValue',
            attemptNumber: 3,
          },
        };

        await safeQuery(queryFn, options);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            extra: expect.objectContaining({
              customField: 'customValue',
              attemptNumber: 3,
            }),
          })
        );
      });

      it('should use "unknown" as default table when not provided', async () => {
        const queryFn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        });
        const options: SafeQueryOptions = { queryName: 'testQuery' };

        await safeQuery(queryFn, options);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              table: 'unknown',
            }),
          })
        );
      });
    });

    describe('Connection Error Detection by Code', () => {
      const connectionErrorCodes = [
        { code: 'PGRST000', description: 'Connection error' },
        { code: 'PGRST301', description: 'Connection timeout' },
        { code: '57P01', description: 'Admin shutdown' },
        { code: '57P02', description: 'Crash shutdown' },
        { code: '57P03', description: 'Cannot connect now' },
        { code: '08000', description: 'Connection exception' },
        { code: '08003', description: 'Connection does not exist' },
        { code: '08006', description: 'Connection failure' },
      ];

      connectionErrorCodes.forEach(({ code, description }) => {
        it(`should detect ${code} (${description}) as connection error`, async () => {
          const queryFn = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Some error', code },
          });
          const options: SafeQueryOptions = { queryName: 'testQuery' };

          const result = await safeQuery(queryFn, options);

          expect(result.isConnectionError).toBe(true);
          expect(result.error?.message).toBe('Database temporarily unavailable');
        });
      });

      it('should not mark regular error codes as connection errors', async () => {
        const regularCodes = ['PGRST116', 'PGRST200', '23505', '42P01'];

        for (const code of regularCodes) {
          const queryFn = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Regular error', code },
          });
          const options: SafeQueryOptions = { queryName: 'testQuery' };

          const result = await safeQuery(queryFn, options);

          expect(result.isConnectionError).toBe(false);
          expect(result.error?.message).toBe('Regular error');
        }
      });
    });

    describe('Connection Error Detection by Message', () => {
      const connectionMessages = [
        'connection refused',
        'Connection timeout',
        'NETWORK error occurred',
        'Request timeout exceeded',
        'ECONNREFUSED localhost:5432',
        'ENOTFOUND db.example.com',
        'Failed to establish connection',
        'Network is unreachable',
      ];

      connectionMessages.forEach((message) => {
        it(`should detect "${message}" as connection error`, async () => {
          const queryFn = vi.fn().mockResolvedValue({
            data: null,
            error: { message },
          });
          const options: SafeQueryOptions = { queryName: 'testQuery' };

          const result = await safeQuery(queryFn, options);

          expect(result.isConnectionError).toBe(true);
          expect(result.error?.message).toBe('Database temporarily unavailable');
        });
      });

      it('should not mark regular error messages as connection errors', async () => {
        const regularMessages = [
          'Row not found',
          'Invalid input syntax',
          'Permission denied',
          'Unique constraint violation',
        ];

        for (const message of regularMessages) {
          const queryFn = vi.fn().mockResolvedValue({
            data: null,
            error: { message },
          });
          const options: SafeQueryOptions = { queryName: 'testQuery' };

          const result = await safeQuery(queryFn, options);

          expect(result.isConnectionError).toBe(false);
          expect(result.error?.message).toBe(message);
        }
      });
    });

    describe('Exception Handling', () => {
      it('should handle thrown Error exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue(new Error('Unexpected exception'));
        const options: SafeQueryOptions = { queryName: 'exceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error?.message).toBe('Unexpected exception');
        expect(result.isConnectionError).toBe(false);
      });

      it('should handle thrown string exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue('String error');
        const options: SafeQueryOptions = { queryName: 'stringExceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error?.message).toBe('String error');
      });

      it('should handle thrown null exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue(null);
        const options: SafeQueryOptions = { queryName: 'nullExceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error?.message).toBe('null');
      });

      it('should handle thrown undefined exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue(undefined);
        const options: SafeQueryOptions = { queryName: 'undefinedExceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
      });

      it('should handle thrown object exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue({ code: 'ERR', detail: 'Details' });
        const options: SafeQueryOptions = { queryName: 'objectExceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
      });

      it('should detect connection errors in thrown exceptions', async () => {
        const queryFn = vi.fn().mockRejectedValue(new Error('Connection timeout'));
        const options: SafeQueryOptions = { queryName: 'connectionExceptionQuery' };

        const result = await safeQuery(queryFn, options);

        expect(result.isConnectionError).toBe(true);
        expect(result.error?.message).toBe('Database temporarily unavailable');
      });

      it('should log thrown exceptions to Sentry', async () => {
        const error = new Error('Thrown exception');
        const queryFn = vi.fn().mockRejectedValue(error);
        const options: SafeQueryOptions = {
          queryName: 'exceptionQuery',
          table: 'profiles',
          userId: 'user-789',
        };

        await safeQuery(queryFn, options);

        expect(Sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            tags: expect.objectContaining({
              component: 'supabase',
              queryName: 'exceptionQuery',
              table: 'profiles',
              isConnectionError: false,
            }),
            extra: expect.objectContaining({
              userId: 'user-789',
            }),
          })
        );
      });

      it('should log thrown exceptions to console', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        const queryFn = vi.fn().mockRejectedValue(new Error('Exception message'));
        const options: SafeQueryOptions = { queryName: 'exceptionQuery' };

        await safeQuery(queryFn, options);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SafeQuery] exceptionQuery threw exception:',
          'Exception message'
        );
      });
    });
  });

  describe('safeQueryAll', () => {
    describe('Parallel Execution', () => {
      it('should execute multiple queries in parallel', async () => {
        const query1 = vi.fn().mockResolvedValue({ data: { id: '1', type: 'brief' }, error: null });
        const query2 = vi.fn().mockResolvedValue({ data: { id: '2', type: 'source' }, error: null });
        const query3 = vi.fn().mockResolvedValue({ data: { id: '3', type: 'profile' }, error: null });

        const results = await safeQueryAll(
          [query1, query2, query3],
          [
            { queryName: 'getBrief' },
            { queryName: 'getSource' },
            { queryName: 'getProfile' },
          ]
        );

        expect(results).toHaveLength(3);
        expect(results[0].data).toEqual({ id: '1', type: 'brief' });
        expect(results[1].data).toEqual({ id: '2', type: 'source' });
        expect(results[2].data).toEqual({ id: '3', type: 'profile' });
      });

      it('should maintain order of results', async () => {
        // Create queries with different delays to verify order is maintained
        const query1 = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return { data: 'first', error: null };
        });
        const query2 = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { data: 'second', error: null };
        });
        const query3 = vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
          return { data: 'third', error: null };
        });

        const results = await safeQueryAll(
          [query1, query2, query3],
          [
            { queryName: 'query1' },
            { queryName: 'query2' },
            { queryName: 'query3' },
          ]
        );

        expect(results[0].data).toBe('first');
        expect(results[1].data).toBe('second');
        expect(results[2].data).toBe('third');
      });

      it('should call all queries', async () => {
        const query1 = vi.fn().mockResolvedValue({ data: 'a', error: null });
        const query2 = vi.fn().mockResolvedValue({ data: 'b', error: null });

        await safeQueryAll(
          [query1, query2],
          [{ queryName: 'q1' }, { queryName: 'q2' }]
        );

        expect(query1).toHaveBeenCalledTimes(1);
        expect(query2).toHaveBeenCalledTimes(1);
      });
    });

    describe('Mixed Results', () => {
      it('should handle mixed success and failure', async () => {
        const query1 = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
        const query2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query 2 failed' },
        });
        const query3 = vi.fn().mockResolvedValue({ data: { id: '3' }, error: null });

        const results = await safeQueryAll(
          [query1, query2, query3],
          [
            { queryName: 'query1' },
            { queryName: 'query2' },
            { queryName: 'query3' },
          ]
        );

        expect(results[0].data).toEqual({ id: '1' });
        expect(results[0].error).toBeNull();
        expect(results[1].data).toBeNull();
        expect(results[1].error?.message).toBe('Query 2 failed');
        expect(results[2].data).toEqual({ id: '3' });
        expect(results[2].error).toBeNull();
      });

      it('should handle all queries failing', async () => {
        const query1 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error 1' },
        });
        const query2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error 2' },
        });

        const results = await safeQueryAll(
          [query1, query2],
          [{ queryName: 'query1' }, { queryName: 'query2' }]
        );

        expect(results[0].error?.message).toBe('Error 1');
        expect(results[1].error?.message).toBe('Error 2');
      });

      it('should handle mix of errors and connection errors', async () => {
        const query1 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection timeout' },
        });
        const query2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Row not found', code: 'PGRST116' },
        });

        const results = await safeQueryAll(
          [query1, query2],
          [{ queryName: 'query1' }, { queryName: 'query2' }]
        );

        expect(results[0].isConnectionError).toBe(true);
        expect(results[1].isConnectionError).toBe(false);
      });

      it('should handle mix of success and thrown exceptions', async () => {
        const query1 = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
        const query2 = vi.fn().mockRejectedValue(new Error('Exception in query 2'));

        const results = await safeQueryAll(
          [query1, query2],
          [{ queryName: 'query1' }, { queryName: 'query2' }]
        );

        expect(results[0].data).toEqual({ id: '1' });
        expect(results[0].error).toBeNull();
        expect(results[1].data).toBeNull();
        expect(results[1].error?.message).toBe('Exception in query 2');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty query array', async () => {
        const results = await safeQueryAll([], []);

        expect(results).toEqual([]);
        expect(results).toHaveLength(0);
      });

      it('should handle single query', async () => {
        const query = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });

        const results = await safeQueryAll(
          [query],
          [{ queryName: 'singleQuery' }]
        );

        expect(results).toHaveLength(1);
        expect(results[0].data).toEqual({ id: '1' });
      });

      it('should pass correct options to each query', async () => {
        const query1 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error 1' },
        });
        const query2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error 2' },
        });

        await safeQueryAll(
          [query1, query2],
          [
            { queryName: 'query1', table: 'briefs', briefId: 'brief-1' },
            { queryName: 'query2', table: 'profiles', userId: 'user-1' },
          ]
        );

        // Verify Sentry was called with correct options for each query
        expect(Sentry.captureException).toHaveBeenCalledTimes(2);
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              queryName: 'query1',
              table: 'briefs',
            }),
            extra: expect.objectContaining({
              briefId: 'brief-1',
            }),
          })
        );
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            tags: expect.objectContaining({
              queryName: 'query2',
              table: 'profiles',
            }),
            extra: expect.objectContaining({
              userId: 'user-1',
            }),
          })
        );
      });
    });
  });

  describe('Type Safety', () => {
    it('should preserve data type through safeQuery', async () => {
      interface TestData {
        id: string;
        name: string;
        count: number;
      }

      const mockData: TestData = { id: '123', name: 'Test', count: 42 };
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null });

      const result = await safeQuery<TestData>(queryFn, { queryName: 'typedQuery' });

      expect(result.data?.id).toBe('123');
      expect(result.data?.name).toBe('Test');
      expect(result.data?.count).toBe(42);
    });

    it('should preserve array types through safeQueryAll', async () => {
      const query1 = vi.fn().mockResolvedValue({ data: { type: 'brief' }, error: null });
      const query2 = vi.fn().mockResolvedValue({ data: ['a', 'b', 'c'], error: null });
      const query3 = vi.fn().mockResolvedValue({ data: 42, error: null });

      const results = await safeQueryAll<[{ type: string }, string[], number]>(
        [query1, query2, query3],
        [
          { queryName: 'q1' },
          { queryName: 'q2' },
          { queryName: 'q3' },
        ]
      );

      expect(results[0].data?.type).toBe('brief');
      expect(results[1].data).toEqual(['a', 'b', 'c']);
      expect(results[2].data).toBe(42);
    });
  });
});
