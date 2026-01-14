/**
 * Profile Delete API Route Unit Tests
 *
 * Tests for the profile deletion endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock cookies
const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockCookiesGet,
    set: mockCookiesSet,
  })),
}));

// Mock Supabase SSR client
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
  })),
}));

// Mock Supabase admin client
const mockAdminDeleteUser = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUser,
      },
    },
  })),
}));

describe('Profile Delete API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Setup default environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('DELETE /api/profile/delete', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should successfully delete user and sign out', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: null,
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAdminDeleteUser).toHaveBeenCalledWith('user-123');
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should return 500 when admin delete user fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Failed to delete user from auth' },
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete account');
    });

    it('should call adminDeleteUser with correct user ID', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'specific-user-456' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: null,
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      await DELETE();

      expect(mockAdminDeleteUser).toHaveBeenCalledWith('specific-user-456');
    });

    it('should call signOut after successful deletion', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: null,
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      await DELETE();

      expect(mockAdminDeleteUser).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should not call signOut when deletion fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      await DELETE();

      expect(mockAdminDeleteUser).toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should handle various delete error types', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Test with different error messages
      const errorCases = [
        { message: 'User not found' },
        { message: 'Database connection error' },
        { message: 'Permission denied' },
        { message: 'Service unavailable' },
      ];

      for (const errorCase of errorCases) {
        vi.resetModules();

        mockAdminDeleteUser.mockResolvedValue({
          data: null,
          error: errorCase,
        });

        const { DELETE } = await import('@/app/api/profile/delete/route');
        const response = await DELETE();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to delete account');
      }
    });

    it('should complete successfully with different user IDs', async () => {
      const testUserIds = ['user-abc', 'user-def-789', 'test-user-id'];

      for (const userId of testUserIds) {
        vi.clearAllMocks();

        mockGetUser.mockResolvedValue({
          data: { user: { id: userId } },
        });

        mockAdminDeleteUser.mockResolvedValue({
          data: {},
          error: null,
        });

        mockSignOut.mockResolvedValue({
          error: null,
        });

        const { DELETE } = await import('@/app/api/profile/delete/route');
        const response = await DELETE();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockAdminDeleteUser).toHaveBeenCalledWith(userId);
      }
    });

    it('should handle authenticated user with complex ID', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } },
      });

      mockAdminDeleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: null,
      });

      const { DELETE } = await import('@/app/api/profile/delete/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockAdminDeleteUser).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });
  });
});
