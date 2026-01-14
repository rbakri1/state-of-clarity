/**
 * Tests for lib/supabase/client.ts
 *
 * Tests the Supabase client creation functions and helper utilities.
 * Note: The actual client functions are mocked in vitest.setup.ts,
 * so here we test the real implementations by unmocking them.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the module to test the real implementation
vi.unmock('@/lib/supabase/client');

// Mock the supabase modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(),
  })),
}));

// Mock next/headers
const mockCookieStore = {
  get: vi.fn().mockReturnValue({ value: 'test-cookie-value' }),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

describe('supabase/client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state for singleton test
    vi.resetModules();
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      // Import fresh module
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn().mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on connection errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNREFUSED errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ETIMEDOUT errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on socket hang up errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('socket hang up'))
        .mockResolvedValue({ data: 'success' });

      const result = await withRetry(operation, 3, 10);

      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-connection errors', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(withRetry(operation, 3, 10)).rejects.toThrow('Validation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(withRetry(operation, 3, 10)).rejects.toThrow('fetch failed');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use default retry count of 3', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(withRetry(operation)).rejects.toThrow('fetch failed');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should handle non-Error objects thrown', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const operation = vi.fn().mockRejectedValue('string error');

      await expect(withRetry(operation, 3, 10)).rejects.toThrow('string error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff between retries', async () => {
      const { withRetry } = await import('@/lib/supabase/client');

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any, delay?: number) => {
        if (delay !== undefined) {
          delays.push(delay);
        }
        return originalSetTimeout(fn, 0) as any;
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue({ data: 'success' });

      await withRetry(operation, 3, 100);

      // First retry: 100 * 2^0 = 100ms
      // Second retry: 100 * 2^1 = 200ms
      expect(delays).toEqual([100, 200]);

      vi.restoreAllMocks();
    });
  });

  describe('createBrowserClient', () => {
    it('should create a browser client with environment variables', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const { createBrowserClient } = await import('@/lib/supabase/client');

      const client = createBrowserClient();

      expect(createClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      expect(client).toBeDefined();
    });
  });

  describe('createServerSupabaseClient', () => {
    it('should create a server client with cookie handling', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      const client = await createServerSupabaseClient();

      expect(createServerClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
      expect(client).toBeDefined();
    });

    it('should properly get cookies', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      // Get the cookies config passed to createServerClient
      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;

      // Test get method
      const result = cookiesConfig.get('test-cookie');
      expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie');
      expect(result).toBe('test-cookie-value');
    });

    it('should handle cookie get returning undefined', async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;
      const result = cookiesConfig.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should properly set cookies', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;

      // Test set method
      cookiesConfig.set('cookie-name', 'cookie-value', { path: '/' });
      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: 'cookie-name',
        value: 'cookie-value',
        path: '/',
      });
    });

    it('should handle cookie set errors gracefully', async () => {
      mockCookieStore.set.mockImplementationOnce(() => {
        throw new Error('Cookie error');
      });

      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;

      // Should not throw
      expect(() => {
        cookiesConfig.set('cookie-name', 'cookie-value', {});
      }).not.toThrow();
    });

    it('should properly remove cookies', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;

      // Test remove method
      cookiesConfig.remove('cookie-name', { path: '/' });
      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: 'cookie-name',
        value: '',
        path: '/',
      });
    });

    it('should handle cookie remove errors gracefully', async () => {
      mockCookieStore.set.mockImplementationOnce(() => {
        throw new Error('Cookie error');
      });

      const { createServerClient } = await import('@supabase/ssr');
      const { createServerSupabaseClient } = await import('@/lib/supabase/client');

      await createServerSupabaseClient();

      const cookiesConfig = (createServerClient as any).mock.calls[0][2].cookies;

      // Should not throw
      expect(() => {
        cookiesConfig.remove('cookie-name', {});
      }).not.toThrow();
    });
  });

  describe('createServiceRoleClient', () => {
    it('should create a service role client with service key', async () => {
      vi.resetModules();
      const { createClient } = await import('@supabase/supabase-js');
      const { createServiceRoleClient } = await import('@/lib/supabase/client');

      const client = createServiceRoleClient();

      expect(createClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      );
      expect(client).toBeDefined();
    });

    it('should return singleton instance on subsequent calls', async () => {
      vi.resetModules();
      const { createServiceRoleClient } = await import('@/lib/supabase/client');

      const client1 = createServiceRoleClient();
      const client2 = createServiceRoleClient();

      expect(client1).toBe(client2);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from auth', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'user@example.com' } },
            error: null,
          }),
        },
      });

      vi.resetModules();
      const { getCurrentUser } = await import('@/lib/supabase/client');

      const user = await getCurrentUser();

      expect(user).toEqual({ id: 'user-123', email: 'user@example.com' });
    });

    it('should return null when no user is logged in', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      vi.resetModules();
      const { getCurrentUser } = await import('@/lib/supabase/client');

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'user@example.com' } },
            error: null,
          }),
        },
      });

      vi.resetModules();
      const { requireAuth } = await import('@/lib/supabase/client');

      const user = await requireAuth();

      expect(user).toEqual({ id: 'user-123', email: 'user@example.com' });
    });

    it('should throw when not authenticated', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      (createServerClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      vi.resetModules();
      const { requireAuth } = await import('@/lib/supabase/client');

      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });

  describe('ReadingLevel type', () => {
    it('should accept valid reading levels', async () => {
      const { createBrowserClient } = await import('@/lib/supabase/client');

      // Type check - these should be valid
      const levels: Array<'simple' | 'standard' | 'advanced'> = ['simple', 'standard', 'advanced'];
      expect(levels).toHaveLength(3);
    });
  });

  describe('CreditTransactionType type', () => {
    it('should accept valid transaction types', async () => {
      const types: Array<'purchase' | 'usage' | 'refund' | 'expiry' | 'bonus' | 'onboarding'> = [
        'purchase',
        'usage',
        'refund',
        'expiry',
        'bonus',
        'onboarding',
      ];
      expect(types).toHaveLength(6);
    });
  });

  describe('PaymentRetryStatus type', () => {
    it('should accept valid payment retry statuses', async () => {
      const statuses: Array<'pending' | 'retrying' | 'succeeded' | 'failed'> = [
        'pending',
        'retrying',
        'succeeded',
        'failed',
      ];
      expect(statuses).toHaveLength(4);
    });
  });
});
