/**
 * Tests for lib/auth/providers.ts
 *
 * Tests authentication provider functions including:
 * - Email/password validation
 * - Email sign in/up
 * - Magic link authentication
 * - Password reset
 * - OAuth authentication
 * - Sign out
 * - Session/User retrieval
 * - Social provider constants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock auth methods using vi.hoisted so they're available for mock
const mockAuth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOtp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
}));

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: mockAuth,
  })),
}));

// Mock window.location for redirect URL tests
const mockOrigin = 'https://example.com';
Object.defineProperty(globalThis, 'window', {
  value: {
    location: {
      origin: mockOrigin,
    },
  },
  writable: true,
});

import {
  isValidEmail,
  isValidPassword,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  resetPassword,
  signInWithOAuth,
  signOut,
  getSession,
  getUser,
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/lib/auth/providers';

describe('auth/providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidEmail', () => {
    it('should return true for valid email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
      expect(isValidEmail('user123@domain123.com')).toBe(true);
    });

    it('should return false for invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user domain.com')).toBe(false);
      expect(isValidEmail('user@domain .com')).toBe(false);
    });

    it('should return false for emails with spaces', () => {
      expect(isValidEmail(' test@example.com')).toBe(false);
      expect(isValidEmail('test@example.com ')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('test@ example.com')).toBe(false);
    });

    it('should return false for emails without proper domain', () => {
      expect(isValidEmail('test@domain')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@domain.')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return valid:true for passwords with 8+ characters', () => {
      expect(isValidPassword('12345678')).toEqual({ valid: true });
      expect(isValidPassword('password123')).toEqual({ valid: true });
      expect(isValidPassword('a'.repeat(100))).toEqual({ valid: true });
    });

    it('should return valid:false with message for passwords under 8 characters', () => {
      expect(isValidPassword('')).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters',
      });
      expect(isValidPassword('1234567')).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters',
      });
      expect(isValidPassword('short')).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters',
      });
    });

    it('should handle exactly 8 character password as valid', () => {
      expect(isValidPassword('exactly8')).toEqual({ valid: true });
    });

    it('should handle exactly 7 character password as invalid', () => {
      expect(isValidPassword('seven77')).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters',
      });
    });
  });

  describe('signInWithEmail', () => {
    it('should call supabase.auth.signInWithPassword with email and password', async () => {
      const mockResponse = {
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      };
      mockAuth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(mockAuth.signInWithPassword).toHaveBeenCalledTimes(1);
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return error when sign in fails', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      };
      mockAuth.signInWithPassword.mockResolvedValue(mockError);

      const result = await signInWithEmail('test@example.com', 'wrongpassword');

      expect(result.error).toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('signUpWithEmail', () => {
    it('should call supabase.auth.signUp with email, password, and redirect URL', async () => {
      const mockResponse = {
        data: { user: { id: 'new-user-123' }, session: null },
        error: null,
      };
      mockAuth.signUp.mockResolvedValue(mockResponse);

      const result = await signUpWithEmail('newuser@example.com', 'password123');

      expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: `${mockOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return error when sign up fails', async () => {
      const mockError = {
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      };
      mockAuth.signUp.mockResolvedValue(mockError);

      const result = await signUpWithEmail('existing@example.com', 'password123');

      expect(result.error).toEqual({ message: 'Email already registered' });
    });
  });

  describe('signInWithMagicLink', () => {
    it('should call supabase.auth.signInWithOtp with email and redirect URL', async () => {
      const mockResponse = {
        data: {},
        error: null,
      };
      mockAuth.signInWithOtp.mockResolvedValue(mockResponse);

      const result = await signInWithMagicLink('user@example.com');

      expect(mockAuth.signInWithOtp).toHaveBeenCalledTimes(1);
      expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        options: {
          emailRedirectTo: `${mockOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return error when magic link fails', async () => {
      const mockError = {
        data: {},
        error: { message: 'Rate limit exceeded' },
      };
      mockAuth.signInWithOtp.mockResolvedValue(mockError);

      const result = await signInWithMagicLink('user@example.com');

      expect(result.error).toEqual({ message: 'Rate limit exceeded' });
    });
  });

  describe('resetPassword', () => {
    it('should call supabase.auth.resetPasswordForEmail with email and redirect URL', async () => {
      const mockResponse = {
        data: {},
        error: null,
      };
      mockAuth.resetPasswordForEmail.mockResolvedValue(mockResponse);

      const result = await resetPassword('user@example.com');

      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        {
          redirectTo: `${mockOrigin}/auth/reset-password`,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return error when password reset fails', async () => {
      const mockError = {
        data: {},
        error: { message: 'User not found' },
      };
      mockAuth.resetPasswordForEmail.mockResolvedValue(mockError);

      const result = await resetPassword('nonexistent@example.com');

      expect(result.error).toEqual({ message: 'User not found' });
    });
  });

  describe('signInWithOAuth', () => {
    it('should call supabase.auth.signInWithOAuth with google provider', async () => {
      const mockResponse = {
        data: { url: 'https://accounts.google.com/...' },
        error: null,
      };
      mockAuth.signInWithOAuth.mockResolvedValue(mockResponse);

      const result = await signInWithOAuth('google');

      expect(mockAuth.signInWithOAuth).toHaveBeenCalledTimes(1);
      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${mockOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call supabase.auth.signInWithOAuth with apple provider', async () => {
      const mockResponse = {
        data: { url: 'https://appleid.apple.com/...' },
        error: null,
      };
      mockAuth.signInWithOAuth.mockResolvedValue(mockResponse);

      const result = await signInWithOAuth('apple');

      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'apple',
        options: {
          redirectTo: `${mockOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call supabase.auth.signInWithOAuth with twitter provider', async () => {
      const mockResponse = {
        data: { url: 'https://twitter.com/...' },
        error: null,
      };
      mockAuth.signInWithOAuth.mockResolvedValue(mockResponse);

      const result = await signInWithOAuth('twitter');

      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'twitter',
        options: {
          redirectTo: `${mockOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return error when OAuth fails', async () => {
      const mockError = {
        data: { url: null },
        error: { message: 'OAuth provider not configured' },
      };
      mockAuth.signInWithOAuth.mockResolvedValue(mockError);

      const result = await signInWithOAuth('google');

      expect(result.error).toEqual({ message: 'OAuth provider not configured' });
    });
  });

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      const mockResponse = { error: null };
      mockAuth.signOut.mockResolvedValue(mockResponse);

      const result = await signOut();

      expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return error when sign out fails', async () => {
      const mockError = { error: { message: 'Sign out failed' } };
      mockAuth.signOut.mockResolvedValue(mockError);

      const result = await signOut();

      expect(result.error).toEqual({ message: 'Sign out failed' });
    });
  });

  describe('getSession', () => {
    it('should call supabase.auth.getSession', async () => {
      const mockResponse = {
        data: { session: { user: { id: 'user-123' }, access_token: 'token' } },
        error: null,
      };
      mockAuth.getSession.mockResolvedValue(mockResponse);

      const result = await getSession();

      expect(mockAuth.getSession).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return null session when not authenticated', async () => {
      const mockResponse = {
        data: { session: null },
        error: null,
      };
      mockAuth.getSession.mockResolvedValue(mockResponse);

      const result = await getSession();

      expect(result.data.session).toBeNull();
    });

    it('should return error when getSession fails', async () => {
      const mockError = {
        data: { session: null },
        error: { message: 'Session expired' },
      };
      mockAuth.getSession.mockResolvedValue(mockError);

      const result = await getSession();

      expect(result.error).toEqual({ message: 'Session expired' });
    });
  });

  describe('getUser', () => {
    it('should call supabase.auth.getUser', async () => {
      const mockResponse = {
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      };
      mockAuth.getUser.mockResolvedValue(mockResponse);

      const result = await getUser();

      expect(mockAuth.getUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return null user when not authenticated', async () => {
      const mockResponse = {
        data: { user: null },
        error: null,
      };
      mockAuth.getUser.mockResolvedValue(mockResponse);

      const result = await getUser();

      expect(result.data.user).toBeNull();
    });

    it('should return error when getUser fails', async () => {
      const mockError = {
        data: { user: null },
        error: { message: 'Invalid token' },
      };
      mockAuth.getUser.mockResolvedValue(mockError);

      const result = await getUser();

      expect(result.error).toEqual({ message: 'Invalid token' });
    });
  });

  describe('SOCIAL_PROVIDERS', () => {
    it('should have google provider with correct configuration', () => {
      expect(SOCIAL_PROVIDERS.google).toBeDefined();
      expect(SOCIAL_PROVIDERS.google.name).toBe('Google');
      expect(SOCIAL_PROVIDERS.google.bgColor).toBe('#ffffff');
      expect(SOCIAL_PROVIDERS.google.textColor).toBe('#1f2937');
    });

    it('should have apple provider with correct configuration', () => {
      expect(SOCIAL_PROVIDERS.apple).toBeDefined();
      expect(SOCIAL_PROVIDERS.apple.name).toBe('Apple');
      expect(SOCIAL_PROVIDERS.apple.bgColor).toBe('#000000');
      expect(SOCIAL_PROVIDERS.apple.textColor).toBe('#ffffff');
    });

    it('should have twitter provider with correct configuration', () => {
      expect(SOCIAL_PROVIDERS.twitter).toBeDefined();
      expect(SOCIAL_PROVIDERS.twitter.name).toBe('X');
      expect(SOCIAL_PROVIDERS.twitter.bgColor).toBe('#000000');
      expect(SOCIAL_PROVIDERS.twitter.textColor).toBe('#ffffff');
    });

    it('should have exactly three providers', () => {
      const providerKeys = Object.keys(SOCIAL_PROVIDERS);
      expect(providerKeys).toHaveLength(3);
      expect(providerKeys).toContain('google');
      expect(providerKeys).toContain('apple');
      expect(providerKeys).toContain('twitter');
    });

    it('should have consistent structure for all providers', () => {
      const providers: SocialProvider[] = ['google', 'apple', 'twitter'];

      providers.forEach(provider => {
        expect(SOCIAL_PROVIDERS[provider]).toHaveProperty('name');
        expect(SOCIAL_PROVIDERS[provider]).toHaveProperty('bgColor');
        expect(SOCIAL_PROVIDERS[provider]).toHaveProperty('textColor');
        expect(typeof SOCIAL_PROVIDERS[provider].name).toBe('string');
        expect(typeof SOCIAL_PROVIDERS[provider].bgColor).toBe('string');
        expect(typeof SOCIAL_PROVIDERS[provider].textColor).toBe('string');
      });
    });

    it('should have valid hex color values for all providers', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      const providers: SocialProvider[] = ['google', 'apple', 'twitter'];

      providers.forEach(provider => {
        expect(SOCIAL_PROVIDERS[provider].bgColor).toMatch(hexColorRegex);
        expect(SOCIAL_PROVIDERS[provider].textColor).toMatch(hexColorRegex);
      });
    });
  });

  describe('SocialProvider type', () => {
    it('should accept valid provider types', () => {
      const providers: SocialProvider[] = ['google', 'apple', 'twitter'];
      expect(providers).toHaveLength(3);
    });
  });
});
