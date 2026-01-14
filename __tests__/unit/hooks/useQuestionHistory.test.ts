/**
 * useQuestionHistory Hook Unit Tests
 *
 * Tests for the question history functionality hook that fetches
 * questions from the brief_jobs table.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(() => ({
    select: mockSelect,
  })),
};

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserClient: () => mockSupabase,
}));

import { useQuestionHistory } from '@/lib/question-history/useQuestionHistory';

describe('useQuestionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain: from().select().eq().order()
    mockOrder.mockResolvedValue({
      data: [],
      error: null,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });
  });

  describe('Initial State', () => {
    it('should start with loading state true', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.isLoading).toBe(true);
    });

    it('should have empty questions initially', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.questions).toEqual([]);
    });

    it('should have no error initially', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      expect(result.current.error).toBeNull();
    });

    it('should provide refetch function', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('No User Case', () => {
    it('should return empty questions when no user is authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should not call from() when no user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      // Wait a bit to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Successful Fetch', () => {
    it('should fetch questions successfully for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockData = [
        {
          id: 'q-1',
          question: 'What is React?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
        {
          id: 'q-2',
          question: 'How does TypeScript work?',
          created_at: '2025-01-02T10:00:00Z',
          brief_id: 'brief-2',
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should call supabase with correct parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('brief_jobs');
      });

      expect(mockSelect).toHaveBeenCalledWith('id, question, created_at, brief_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('Data Mapping', () => {
    it('should map data correctly to QuestionHistoryEntry interface', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockData = [
        {
          id: 'q-1',
          question: 'What is React?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0]).toEqual({
        id: 'q-1',
        question: 'What is React?',
        asked_at: '2025-01-01T10:00:00Z',
        brief_id: 'brief-1',
      });
    });

    it('should handle null brief_id correctly', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockData = [
        {
          id: 'q-1',
          question: 'What is React?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: null,
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].brief_id).toBeNull();
    });

    it('should handle empty data array', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors and set error state', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockError = new Error('Database connection failed');
      mockOrder.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Database connection failed');
      expect(result.current.questions).toEqual([]);
    });

    it('should handle non-Error objects in catch block', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: { code: 'UNKNOWN', message: 'Something went wrong' },
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch question history');
      expect(result.current.questions).toEqual([]);
    });
  });

  describe('Table Not Found Error (PGRST116)', () => {
    it('should handle PGRST116 error gracefully and return empty array', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Table not found' },
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle 42P01 error gracefully and return empty array', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: { code: '42P01', message: 'Relation does not exist' },
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading true to false after fetch completes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useQuestionHistory());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to true when refetch is called', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      // Should be loading again
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to false after error', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: null,
        error: new Error('Fetch failed'),
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('Refetch Function', () => {
    it('should refetch data when refetch is called', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const initialData = [
        {
          id: 'q-1',
          question: 'Initial question',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
      ];

      mockOrder.mockResolvedValue({
        data: initialData,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(1);
      expect(result.current.questions[0].question).toBe('Initial question');

      // Update mock for new data
      const newData = [
        {
          id: 'q-1',
          question: 'Initial question',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-1',
        },
        {
          id: 'q-2',
          question: 'New question',
          created_at: '2025-01-02T10:00:00Z',
          brief_id: 'brief-2',
        },
      ];

      mockOrder.mockResolvedValue({
        data: newData,
        error: null,
      });

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions[1].question).toBe('New question');
    });

    it('should retain error state after refetch (error is not auto-cleared)', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      // First call returns error
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: new Error('Initial error'),
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Initial error');

      // Setup success response for refetch
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      // Note: The hook does not clear error state on successful refetch
      // This is the current implementation behavior
      expect(result.current.error?.message).toBe('Initial error');
      expect(result.current.questions).toEqual([]);
    });

    it('should call getUser again on refetch', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountBefore = mockGetUser.mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetUser.mock.calls.length).toBeGreaterThan(callCountBefore);
    });
  });

  describe('Multiple Questions', () => {
    it('should handle multiple questions with different data', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockData = [
        {
          id: 'q-1',
          question: 'What is React?',
          created_at: '2025-01-03T10:00:00Z',
          brief_id: 'brief-1',
        },
        {
          id: 'q-2',
          question: 'How does TypeScript work?',
          created_at: '2025-01-02T10:00:00Z',
          brief_id: null,
        },
        {
          id: 'q-3',
          question: 'What is Next.js?',
          created_at: '2025-01-01T10:00:00Z',
          brief_id: 'brief-3',
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useQuestionHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(3);
      expect(result.current.questions[0].id).toBe('q-1');
      expect(result.current.questions[1].brief_id).toBeNull();
      expect(result.current.questions[2].question).toBe('What is Next.js?');
    });
  });
});
