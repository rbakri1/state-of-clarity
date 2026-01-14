/**
 * useUserDisplay Hook Unit Tests
 *
 * Tests for the user display state management hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

import { useUserDisplay } from '@/lib/user/useUserDisplay';

describe('useUserDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUserDisplay());

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to false after fetching user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Unauthenticated Users', () => {
    it('should show Guest as display name when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.displayName).toBe('Guest');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBe(null);
    });

    it('should return null user when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
    });
  });

  describe('Authenticated Users', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should show username part of email as display name', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.displayName).toBe('test');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userId).toBe('user-123');
    });

    it('should return authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle email without domain correctly', async () => {
      const userWithShortEmail = {
        ...mockUser,
        email: 'admin@corp.co',
      };

      mockGetUser.mockResolvedValue({
        data: { user: userWithShortEmail },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.displayName).toBe('admin');
    });
  });

  describe('Auth State Changes', () => {
    it('should subscribe to auth state changes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      renderHook(() => useUserDisplay());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { unmount } = renderHook(() => useUserDisplay());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update user on auth state change', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      let authCallback: ((event: string, session: { user: object } | null) => void) | null = null;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Simulate auth state change
      const newUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      act(() => {
        authCallback?.('SIGNED_IN', { user: newUser });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.userId).toBe('user-456');
      expect(result.current.displayName).toBe('newuser');
    });

    it('should handle sign out', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
      });

      let authCallback: ((event: string, session: null) => void) | null = null;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Simulate sign out
      act(() => {
        authCallback?.('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(result.current.userId).toBe(null);
      expect(result.current.displayName).toBe('Guest');
    });
  });

  describe('Error Handling', () => {
    it('should handle getUser errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetUser.mockRejectedValue(new Error('Auth error'));

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.displayName).toBe('Guest');

      consoleSpy.mockRestore();
    });
  });

  describe('Anonymous Mode', () => {
    it('should start with isAnonymous as false', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useUserDisplay());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAnonymous).toBe(false);
    });
  });
});
