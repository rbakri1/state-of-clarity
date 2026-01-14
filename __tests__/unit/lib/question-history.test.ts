/**
 * useQuestionHistory Hook Unit Tests
 *
 * Tests for the question history functionality hook.
 * This hook fetches question history from the brief_jobs table.
 *
 * Note: These tests use a stateless mock pattern to ensure proper isolation.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Create a factory that returns mock behavior based on test configuration
const createMockSupabaseClient = (config: {
  user: { id: string; email: string } | null;
  data?: unknown;
  error?: unknown;
  shouldRejectAuth?: boolean;
  authError?: unknown;
  shouldRejectQuery?: boolean;
  queryError?: unknown;
}) => ({
  auth: {
    getUser: async () => {
      if (config.shouldRejectAuth) {
        throw config.authError;
      }
      return { data: { user: config.user } };
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: async () => {
          if (config.shouldRejectQuery) {
            throw config.queryError;
          }
          return { data: config.data ?? [], error: config.error ?? null };
        },
      }),
    }),
  }),
});

// Default mock configuration
let mockConfig = {
  user: null as { id: string; email: string } | null,
  data: [] as unknown,
  error: null as unknown,
  shouldRejectAuth: false,
  authError: null as unknown,
  shouldRejectQuery: false,
  queryError: null as unknown,
};

// Mock the browser client
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => createMockSupabaseClient(mockConfig),
}));

// Dynamic import to get fresh hook with new mock config
async function getHookWithConfig(config: Partial<typeof mockConfig>) {
  // Update the mock config
  mockConfig = { ...mockConfig, ...config };

  // Reset module cache to get fresh hook with new config
  vi.resetModules();

  // Re-import the hook with fresh mock
  const { useQuestionHistory } = await import('@/lib/question-history/useQuestionHistory');
  return useQuestionHistory;
}

describe('useQuestionHistory', () => {
  describe('Initial State', () => {
    it('should start with loading state', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.isLoading).toBe(true);
    });

    it('should have empty questions array initially', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.questions).toEqual([]);
    });

    it('should have null error initially', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.error).toBe(null);
    });

    it('should provide refetch function', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Unauthenticated User', () => {
    it('should return empty questions for unauthenticated user', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Authenticated User - Fetching Questions', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should fetch questions for authenticated user', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: 'What is the weather today?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
        {
          id: 'job-2',
          question: 'How does AI work?',
          created_at: '2025-01-02T10:00:00Z',
          brief_id: 'brief-2',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions[0]).toEqual({
        id: 'job-1',
        question: 'What is the weather today?',
        asked_at: '2025-01-01T10:00:00Z',
        brief_id: 'brief-1',
      });
    });

    it('should handle null brief_id in response', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: 'Anonymous question',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: null,
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].brief_id).toBe(null);
    });

    it('should handle empty response data', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: [] });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
    });

    it('should handle null response data', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: null });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should handle PGRST116 error (table does not exist)', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: mockUser,
        data: null,
        error: { code: 'PGRST116', message: 'Table not found' },
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.questions).toEqual([]);
    });

    it('should handle 42P01 error (PostgreSQL table does not exist)', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: mockUser,
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.questions).toEqual([]);
    });

    it('should set error for other fetch errors', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: mockUser,
        data: null,
        error: { code: 'PGRST301', message: 'Permission denied' },
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.questions).toEqual([]);
    });

    it('should handle auth getUser errors', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: null,
        shouldRejectAuth: true,
        authError: new Error('Auth service unavailable'),
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Auth service unavailable');
    });

    it('should wrap non-Error exceptions in Error object', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: null,
        shouldRejectAuth: true,
        authError: 'String error',
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch question history');
    });

    it('should handle database query errors', async () => {
      const useQuestionHistory = await getHookWithConfig({
        user: mockUser,
        shouldRejectQuery: true,
        queryError: new Error('Database connection failed'),
      });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Database connection failed');
    });
  });

  describe('Data Mapping', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should map created_at to asked_at', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: 'Test question',
          created_at: '2025-01-15T14:30:00Z',
          brief_id: 'brief-1',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].asked_at).toBe('2025-01-15T14:30:00Z');
      expect((result.current.questions[0] as Record<string, unknown>).created_at).toBeUndefined();
    });

    it('should preserve all required fields in mapped entry', async () => {
      const mockData = [
        {
          id: 'unique-id-123',
          question: 'What is the capital of France?',
          created_at: '2025-06-20T08:00:00Z',
          brief_id: 'brief-abc',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0]).toEqual({
        id: 'unique-id-123',
        question: 'What is the capital of France?',
        asked_at: '2025-06-20T08:00:00Z',
        brief_id: 'brief-abc',
      });
    });
  });

  describe('Multiple Questions', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should handle large number of questions', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        id: `job-${i}`,
        question: `Question ${i}`,
        created_at: `2025-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`,
        brief_id: `brief-${i}`,
      }));

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(100);
    });

    it('should maintain order from database response', async () => {
      const mockData = [
        { id: 'job-3', question: 'Third', created_at: '2025-01-03T10:00:00Z', brief_id: null },
        { id: 'job-2', question: 'Second', created_at: '2025-01-02T10:00:00Z', brief_id: null },
        { id: 'job-1', question: 'First', created_at: '2025-01-01T10:00:00Z', brief_id: null },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].id).toBe('job-3');
      expect(result.current.questions[1].id).toBe('job-2');
      expect(result.current.questions[2].id).toBe('job-1');
    });
  });

  describe('Hook Lifecycle', () => {
    it('should not cause memory leaks on unmount', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { unmount, result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should handle questions with special characters', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: 'What about <script>alert("xss")</script>?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
        {
          id: 'job-2',
          question: "How's the weather & what's the time?",
          created_at: '2025-01-02T10:00:00Z',
          brief_id: 'brief-2',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].question).toBe('What about <script>alert("xss")</script>?');
      expect(result.current.questions[1].question).toBe("How's the weather & what's the time?");
    });

    it('should handle questions with unicode characters', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: "Qu'est-ce que c'est? 日本語 emoji 🎉",
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].question).toBe("Qu'est-ce que c'est? 日本語 emoji 🎉");
    });

    it('should handle very long questions', async () => {
      const longQuestion = 'A'.repeat(10000);
      const mockData = [
        {
          id: 'job-1',
          question: longQuestion,
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].question).toBe(longQuestion);
      expect(result.current.questions[0].question.length).toBe(10000);
    });

    it('should handle empty string questions', async () => {
      const mockData = [
        {
          id: 'job-1',
          question: '',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].question).toBe('');
    });
  });

  describe('Type Safety', () => {
    it('should return correct types for all hook values', async () => {
      const useQuestionHistory = await getHookWithConfig({ user: null });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.questions)).toBe(true);
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should return QuestionHistoryEntry with correct shape', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockData = [
        {
          id: 'job-1',
          question: 'Test',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      const useQuestionHistory = await getHookWithConfig({ user: mockUser, data: mockData });
      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const entry = result.current.questions[0];
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.question).toBe('string');
      expect(typeof entry.asked_at).toBe('string');
      expect(entry.brief_id === null || typeof entry.brief_id === 'string').toBe(true);
    });
  });
});
