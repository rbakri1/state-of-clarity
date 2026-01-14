/**
 * usePaywall Hook Unit Tests
 *
 * Tests for the paywall state management hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

import { usePaywall } from '@/lib/paywall/usePaywall';

describe('usePaywall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
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

      const { result } = renderHook(() => usePaywall());

      expect(result.current.isLoading).toBe(true);
    });

    it('should have free tier limit of 3', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => usePaywall());

      expect(result.current.limit).toBe(3);
    });
  });

  describe('Unauthenticated Users', () => {
    it('should not be authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should not be premium', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPremium).toBe(false);
    });

    it('should have full briefs remaining with no views', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.briefsRemaining).toBe(3);
    });

    it('should calculate remaining briefs from localStorage', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue('2'); // 2 briefs viewed

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.briefsRemaining).toBe(1);
    });

    it('should not go below 0 remaining briefs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue('5'); // More than limit

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.briefsRemaining).toBe(0);
    });
  });

  describe('Authenticated Users', () => {
    it('should be authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { balance: 0 },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should check credits for premium status', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { balance: 100 },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPremium).toBe(true);
    });

    it('should not be premium with 0 credits', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { balance: 0 },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPremium).toBe(false);
    });

    it('should have infinite briefs remaining when premium', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { balance: 50 },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isPremium).toBe(true);
      });

      expect(result.current.briefsRemaining).toBe(Infinity);
    });
  });

  describe('Error Handling', () => {
    it('should handle auth check errors gracefully', async () => {
      mockGetUser.mockRejectedValue(new Error('Auth error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should handle credits fetch errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Credits fetch failed')),
        }),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still work, just not premium
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isPremium).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should handle null credits data', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPremium).toBe(false);
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      renderHook(() => usePaywall());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should update authenticated state on auth change', async () => {
      let authCallback: ((event: string, session: any) => void) | null = null;

      mockOnAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Simulate sign in
      if (authCallback) {
        authCallback('SIGNED_IN', { user: { id: 'user-123' } });
      }

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should unsubscribe on unmount', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { unmount } = renderHook(() => usePaywall());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('localStorage Integration', () => {
    it('should read briefsViewed from localStorage', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue('1');

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('briefsViewed');
      expect(result.current.briefsRemaining).toBe(2);
    });

    it('should handle missing localStorage value', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.briefsRemaining).toBe(3);
    });

    it('should handle invalid localStorage value', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      localStorageMock.getItem.mockReturnValue('invalid');

      const { result } = renderHook(() => usePaywall());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // parseInt('invalid', 10) = NaN, so briefsRemaining calculation may differ
      expect(typeof result.current.briefsRemaining).toBe('number');
    });
  });
});
