/**
 * Account Restore API Route Unit Tests
 *
 * Tests for the account restore endpoint that restores soft-deleted accounts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

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
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('Account Restore API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('POST /api/account/restore', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { POST } = await import('@/app/api/account/restore/route');
      const request = new NextRequest('http://localhost/api/account/restore', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should successfully restore a soft-deleted account', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      const { POST } = await import('@/app/api/account/restore/route');
      const request = new NextRequest('http://localhost/api/account/restore', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account restored successfully');
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        deleted_at: null,
        deletion_scheduled_at: null,
      });
    });

    it('should return 500 when database update fails', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      const { POST } = await import('@/app/api/account/restore/route');
      const request = new NextRequest('http://localhost/api/account/restore', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to restore account');
    });

    it('should call update with correct user ID', async () => {
      const mockUser = { id: 'specific-user-456', email: 'test@example.com' };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      const { POST } = await import('@/app/api/account/restore/route');
      const request = new NextRequest('http://localhost/api/account/restore', {
        method: 'POST',
      });
      await POST(request);

      expect(mockEq).toHaveBeenCalledWith('id', 'specific-user-456');
    });

    it('should handle different user IDs correctly', async () => {
      const testUserIds = ['user-abc', 'user-def-789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'];

      for (const userId of testUserIds) {
        vi.clearAllMocks();

        mockGetUser.mockResolvedValue({
          data: { user: { id: userId, email: 'test@example.com' } },
          error: null,
        });

        const mockEq = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockFrom.mockReturnValue({
          update: mockUpdate,
        });

        const { POST } = await import('@/app/api/account/restore/route');
        const request = new NextRequest('http://localhost/api/account/restore', {
          method: 'POST',
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockEq).toHaveBeenCalledWith('id', userId);
      }
    });

    it('should handle auth error gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const { POST } = await import('@/app/api/account/restore/route');
      const request = new NextRequest('http://localhost/api/account/restore', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });
});
