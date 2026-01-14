/**
 * useSavedBriefs Hook Unit Tests
 *
 * Tests for the saved briefs functionality hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: (table: string) => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    }),
  }),
}));

import { useSavedBriefs } from '@/lib/saved-briefs/useSavedBriefs';

describe('useSavedBriefs', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      expect(result.current.isLoading).toBe(true);
    });

    it('should have empty saved briefs initially', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      expect(result.current.savedBriefs).toEqual([]);
      expect(result.current.savedCount).toBe(0);
    });

    it('should provide saveBrief function', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      expect(typeof result.current.saveBrief).toBe('function');
    });

    it('should provide unsaveBrief function', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      expect(typeof result.current.unsaveBrief).toBe('function');
    });

    it('should provide isSaved function', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      expect(typeof result.current.isSaved).toBe('function');
    });
  });

  describe('Fetching Saved Briefs', () => {
    it('should fetch saved briefs for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
      });

      const mockData = [
        { id: 'sb-1', brief_id: 'brief-1', created_at: '2025-01-01T00:00:00Z' },
        { id: 'sb-2', brief_id: 'brief-2', created_at: '2025-01-02T00:00:00Z' },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.savedBriefs).toHaveLength(2);
      expect(result.current.savedCount).toBe(2);
    });

    it('should not fetch for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.savedBriefs).toEqual([]);
    });

    it('should handle fetch errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Fetch failed'),
          }),
        }),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.savedBriefs).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('saveBrief', () => {
    it('should save a brief for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'sb-new', brief_id: 'brief-new', created_at: '2025-01-10T00:00:00Z' },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.saveBrief('brief-new');
      });

      expect(result.current.savedBriefs).toContainEqual(
        expect.objectContaining({ briefId: 'brief-new' })
      );
    });

    it('should throw error for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.saveBrief('brief-1')).rejects.toThrow(
        'Must be authenticated to save briefs'
      );
    });

    it('should handle save errors', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Insert failed'),
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.saveBrief('brief-1')).rejects.toThrow();
    });
  });

  describe('unsaveBrief', () => {
    it('should unsave a brief for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockData = [
        { id: 'sb-1', brief_id: 'brief-1', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.savedBriefs.length).toBe(1);
      });

      await act(async () => {
        await result.current.unsaveBrief('brief-1');
      });

      expect(result.current.savedBriefs).not.toContainEqual(
        expect.objectContaining({ briefId: 'brief-1' })
      );
    });

    it('should throw error for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.unsaveBrief('brief-1')).rejects.toThrow(
        'Must be authenticated to unsave briefs'
      );
    });

    it('should handle unsave errors', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: new Error('Delete failed'),
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.unsaveBrief('brief-1')).rejects.toThrow();
    });
  });

  describe('isSaved', () => {
    it('should return true for saved brief', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockData = [
        { id: 'sb-1', brief_id: 'brief-1', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.savedBriefs.length).toBe(1);
      });

      expect(result.current.isSaved('brief-1')).toBe(true);
    });

    it('should return false for unsaved brief', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSaved('brief-not-saved')).toBe(false);
    });
  });

  describe('savedBriefIds Set', () => {
    it('should provide set of saved brief IDs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockData = [
        { id: 'sb-1', brief_id: 'brief-1', created_at: '2025-01-01T00:00:00Z' },
        { id: 'sb-2', brief_id: 'brief-2', created_at: '2025-01-02T00:00:00Z' },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.savedBriefs.length).toBe(2);
      });

      expect(result.current.savedBriefIds).toBeInstanceOf(Set);
      expect(result.current.savedBriefIds.has('brief-1')).toBe(true);
      expect(result.current.savedBriefIds.has('brief-2')).toBe(true);
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      renderHook(() => useSavedBriefs());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should clear briefs on sign out', async () => {
      let authCallback: ((event: string, session: any) => void) | null = null;

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockData = [
        { id: 'sb-1', brief_id: 'brief-1', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSavedBriefs());

      await waitFor(() => {
        expect(result.current.savedBriefs.length).toBe(1);
      });

      // Simulate sign out
      if (authCallback) {
        act(() => {
          authCallback!('SIGNED_OUT', { user: null });
        });
      }

      expect(result.current.savedBriefs).toEqual([]);
    });

    it('should unsubscribe on unmount', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { unmount } = renderHook(() => useSavedBriefs());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
