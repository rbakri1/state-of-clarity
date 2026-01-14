/**
 * Tests for lib/supabase/browser.ts
 *
 * Tests the browser-side Supabase client with cookie handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the module to test the real implementation
vi.unmock('@/lib/supabase/browser');

// Store the cookies config for testing
let capturedCookiesConfig: any = null;

// Mock @supabase/ssr createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url: string, key: string, options: any) => {
    capturedCookiesConfig = options?.cookies;
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'browser-user-id' } },
          error: null,
        }),
      },
      from: vi.fn(),
    };
  }),
}));

describe('supabase/browser', () => {
  // Mock document.cookie
  let mockCookies: string = '';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    capturedCookiesConfig = null;
    mockCookies = '';

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      get: vi.fn(() => mockCookies),
      set: vi.fn((value: string) => {
        // Parse the cookie being set
        const parts = value.split(';');
        const [nameValue] = parts;
        const [name, val] = nameValue.split('=');

        // If max-age=0, remove the cookie
        if (value.includes('max-age=0')) {
          const cookieList = mockCookies.split('; ').filter(c => !c.startsWith(`${name}=`));
          mockCookies = cookieList.join('; ');
        } else {
          // Add or update the cookie
          const cookieList = mockCookies ? mockCookies.split('; ') : [];
          const existingIndex = cookieList.findIndex(c => c.startsWith(`${name}=`));
          if (existingIndex >= 0) {
            cookieList[existingIndex] = `${name}=${val}`;
          } else {
            cookieList.push(`${name}=${val}`);
          }
          mockCookies = cookieList.join('; ');
        }
      }),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBrowserClient', () => {
    it('should create a browser client with environment variables', async () => {
      const { createBrowserClient: mockCreateBrowserClient } = await import('@supabase/ssr');
      const { createBrowserClient } = await import('@/lib/supabase/browser');

      const client = createBrowserClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
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

    it('should return a client with auth capabilities', async () => {
      const { createBrowserClient } = await import('@/lib/supabase/browser');

      const client = createBrowserClient();

      expect(client.auth).toBeDefined();
      expect(client.auth.getUser).toBeDefined();
    });

    describe('cookie handling', () => {
      describe('get', () => {
        it('should get an existing cookie value', async () => {
          mockCookies = 'session=abc123; other=xyz';

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('session');
          expect(result).toBe('abc123');
        });

        it('should return null for non-existent cookie', async () => {
          mockCookies = 'other=xyz';

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('nonexistent');
          expect(result).toBeNull();
        });

        it('should return null when document.cookie is empty', async () => {
          mockCookies = '';

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('any');
          expect(result).toBeNull();
        });

        it('should handle URL-encoded cookie values', async () => {
          mockCookies = 'data=' + encodeURIComponent('value with spaces');

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('data');
          expect(result).toBe('value with spaces');
        });

        it('should handle cookies with equals sign in value (limitation: only gets first part)', async () => {
          // Note: The current implementation only gets the first part after '='
          // This is a known limitation. Proper cookie values with '=' should be URL-encoded.
          mockCookies = 'token=abc=def=ghi';

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('token');
          // Due to split('=')[1], only 'abc' is returned (not 'abc=def=ghi')
          expect(result).toBe('abc');
        });

        it('should handle URL-encoded values containing equals signs', async () => {
          // Proper way: URL-encode values with special characters
          mockCookies = 'token=' + encodeURIComponent('abc=def=ghi');

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          const result = capturedCookiesConfig.get('token');
          expect(result).toBe('abc=def=ghi');
        });

        it('should get first cookie when multiple cookies exist', async () => {
          mockCookies = 'a=1; b=2; c=3; d=4';

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          expect(capturedCookiesConfig.get('a')).toBe('1');
          expect(capturedCookiesConfig.get('b')).toBe('2');
          expect(capturedCookiesConfig.get('c')).toBe('3');
          expect(capturedCookiesConfig.get('d')).toBe('4');
        });
      });

      describe('set', () => {
        it('should set a cookie with basic options', async () => {
          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', {});

          expect(mockCookies).toContain('session=' + encodeURIComponent('token123'));
        });

        it('should set a cookie with maxAge option', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', { maxAge: 3600 });

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining('max-age=3600')
          );
        });

        it('should set a cookie with path option', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', { path: '/app' });

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining('path=/app')
          );
        });

        it('should set a cookie with sameSite option', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', { sameSite: 'strict' });

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining('samesite=strict')
          );
        });

        it('should set a cookie with secure flag', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', { secure: true });

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining('; secure')
          );
        });

        it('should set a cookie with all options', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('session', 'token123', {
            maxAge: 3600,
            path: '/',
            sameSite: 'lax',
            secure: true,
          });

          const setCall = cookieSetSpy.mock.calls[0][0];
          expect(setCall).toContain('session=' + encodeURIComponent('token123'));
          expect(setCall).toContain('max-age=3600');
          expect(setCall).toContain('path=/');
          expect(setCall).toContain('samesite=lax');
          expect(setCall).toContain('; secure');
        });

        it('should URL-encode the cookie value', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => mockCookies,
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.set('data', 'value with spaces & special=chars', {});

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining(encodeURIComponent('value with spaces & special=chars'))
          );
        });
      });

      describe('remove', () => {
        it('should remove a cookie by setting max-age to 0', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => 'session=token123',
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.remove('session', {});

          expect(cookieSetSpy).toHaveBeenCalledWith(
            expect.stringContaining('session=; max-age=0')
          );
        });

        it('should include path option when removing', async () => {
          const cookieSetSpy = vi.fn();
          Object.defineProperty(document, 'cookie', {
            get: () => 'session=token123',
            set: cookieSetSpy,
            configurable: true,
          });

          const { createBrowserClient } = await import('@/lib/supabase/browser');
          createBrowserClient();

          capturedCookiesConfig.remove('session', { path: '/' });

          const setCall = cookieSetSpy.mock.calls[0][0];
          expect(setCall).toContain('session=; max-age=0');
          expect(setCall).toContain('path=/');
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty cookie name', async () => {
      mockCookies = '';

      const { createBrowserClient } = await import('@/lib/supabase/browser');
      createBrowserClient();

      const result = capturedCookiesConfig.get('');
      expect(result).toBeNull();
    });

    it('should handle cookie with empty value', async () => {
      mockCookies = 'empty=';

      const { createBrowserClient } = await import('@/lib/supabase/browser');
      createBrowserClient();

      const result = capturedCookiesConfig.get('empty');
      expect(result).toBe('');
    });

    it('should handle cookies with special characters in names', async () => {
      mockCookies = 'sb-auth-token=abc123';

      const { createBrowserClient } = await import('@/lib/supabase/browser');
      createBrowserClient();

      const result = capturedCookiesConfig.get('sb-auth-token');
      expect(result).toBe('abc123');
    });
  });
});
