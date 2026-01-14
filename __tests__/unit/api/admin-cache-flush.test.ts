/**
 * Admin Cache Flush API Route Unit Tests
 *
 * Tests for the admin cache flush endpoint that clears cached data.
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

// Mock Supabase client (used by withAdmin middleware)
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock cache functions
const mockKeys = vi.fn();
const mockDel = vi.fn();

vi.mock('@/lib/cache/kv-client', () => ({
  kv: {
    keys: (...args: unknown[]) => mockKeys(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

const mockInvalidateCache = vi.fn();
const mockInvalidatePattern = vi.fn();

vi.mock('@/lib/cache/invalidate', () => ({
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
  invalidatePattern: (...args: unknown[]) => mockInvalidatePattern(...args),
}));

describe('Admin Cache Flush API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.ADMIN_EMAILS = 'admin@example.com,superadmin@example.com';
  });

  describe('POST /api/admin/cache-flush', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not an admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'regular@example.com', role: 'user' } },
        error: null,
      });

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow admin role user to flush cache', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'someone@example.com', role: 'admin' } },
        error: null,
      });

      mockKeys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockInvalidateCache.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.keysCleared).toBe(3);
      expect(data.flushedBy).toBe('someone@example.com');
    });

    it('should allow admin email user to flush cache', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-456', email: 'admin@example.com', role: 'user' } },
        error: null,
      });

      mockKeys.mockResolvedValue(['cache:key1', 'cache:key2']);
      mockInvalidateCache.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.keysCleared).toBe(2);
    });

    it('should flush all keys when no pattern provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      mockKeys.mockResolvedValue(['key1', 'key2', 'key3', 'key4']);
      mockInvalidateCache.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.keysCleared).toBe(4);
      expect(data.message).toContain('Flushed all');
      expect(mockKeys).toHaveBeenCalledWith('*');
    });

    it('should flush keys matching pattern when provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      mockKeys.mockResolvedValue(['brief:123', 'brief:456']);
      mockInvalidatePattern.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({ pattern: 'brief:*' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.keysCleared).toBe(2);
      expect(data.message).toContain('brief:*');
      expect(mockInvalidatePattern).toHaveBeenCalledWith('brief:*');
    });

    it('should return 400 for empty pattern string', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({ pattern: '' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for pattern that is too long', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const longPattern = 'a'.repeat(201);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({ pattern: longPattern }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should handle empty body gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      mockKeys.mockResolvedValue([]);
      mockInvalidateCache.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.keysCleared).toBe(0);
    });

    it('should include timestamp in response', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      mockKeys.mockResolvedValue([]);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should be case-insensitive for admin email check', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'ADMIN@EXAMPLE.COM' } },
        error: null,
      });

      mockKeys.mockResolvedValue(['key1']);
      mockInvalidateCache.mockResolvedValue(undefined);

      const { POST } = await import('@/app/api/admin/cache-flush/route');
      const request = new NextRequest('http://localhost/api/admin/cache-flush', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
