/**
 * Auth Middleware Unit Tests
 *
 * Tests for the authentication middleware used in API routes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

import { withAuth, withAdmin, withOptionalAuth, withRateLimit, compose } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(options?: { headers?: Record<string, string> }): NextRequest {
    const headers = new Headers(options?.headers || {});
    return {
      headers,
      url: 'http://localhost:3000/api/test',
    } as unknown as NextRequest;
  }

  describe('withAuth', () => {
    it('should call handler with user context when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          },
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 on auth error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
    });

    it('should pass route params to handler', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = createMockRequest();
      await wrappedHandler(request, { params: { id: 'brief-123' } });

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          params: { id: 'brief-123' },
        })
      );
    });
  });

  describe('withAdmin', () => {
    it('should allow access for admin role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should allow access for admin email', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@example.com',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn();
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();

      const body = await response.json();
      expect(body.error).toBe('Forbidden');
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const handler = vi.fn();
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
    });

    it('should handle multiple admin emails', async () => {
      process.env.ADMIN_EMAILS = 'admin1@example.com, admin2@example.com, admin3@example.com';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin2@example.com',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should be case-insensitive for admin emails', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'ADMIN@EXAMPLE.COM',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withAdmin(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('withOptionalAuth', () => {
    it('should call handler with user when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          },
        },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withOptionalAuth(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
          }),
        })
      );
    });

    it('should call handler with null user when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withOptionalAuth(handler);

      const request = createMockRequest();
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          user: null,
        })
      );
    });

    it('should pass route params', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const handler = vi.fn().mockResolvedValue(Response.json({ success: true }));
      const wrappedHandler = withOptionalAuth(handler);

      const request = createMockRequest();
      await wrappedHandler(request, { params: { id: 'test' } });

      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          params: { id: 'test' },
        })
      );
    });
  });

  describe('withRateLimit', () => {
    it('should allow requests within limit', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 10, window: 60 });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': 'test-ip-1' },
      });

      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('should include rate limit headers', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 10, window: 60 });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': 'test-ip-2' },
      });

      const response = await wrappedHandler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should return 429 when rate limit exceeded', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 2, window: 60 });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': 'test-ip-3' },
      });

      // Make requests until limit is exceeded
      await wrappedHandler(request);
      await wrappedHandler(request);
      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe('Rate limit exceeded');
    });

    it('should use default config if not provided', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler);

      const request = createMockRequest({
        headers: { 'x-forwarded-for': 'test-ip-4' },
      });

      const response = await wrappedHandler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('should track limits per IP', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 1, window: 60 });

      // First IP
      const request1 = createMockRequest({
        headers: { 'x-forwarded-for': 'ip-1-unique' },
      });
      await wrappedHandler(request1);
      const response1 = await wrappedHandler(request1);
      expect(response1.status).toBe(429);

      // Second IP should still work
      const request2 = createMockRequest({
        headers: { 'x-forwarded-for': 'ip-2-unique' },
      });
      const response2 = await wrappedHandler(request2);
      expect(response2.status).not.toBe(429);
    });

    it('should use x-real-ip if x-forwarded-for not available', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 10, window: 60 });

      const request = createMockRequest({
        headers: { 'x-real-ip': 'real-ip-test' },
      });

      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should include retry-after header on rate limit', async () => {
      const handler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          headers: new Headers({ 'content-type': 'application/json' }),
        })
      );
      const wrappedHandler = withRateLimit(handler, { requests: 1, window: 60 });

      const request = createMockRequest({
        headers: { 'x-forwarded-for': 'retry-test-ip' },
      });

      await wrappedHandler(request);
      const response = await wrappedHandler(request);

      expect(response.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('compose', () => {
    it('should compose multiple middleware', () => {
      const middleware1 = vi.fn((handler) => handler);
      const middleware2 = vi.fn((handler) => handler);
      const handler = vi.fn();

      const composed = compose(handler, middleware1, middleware2);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
  });
});
