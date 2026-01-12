/**
 * Vitest Global Setup
 *
 * Configures global test environment, mocks, and cleanup.
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { clearMockData } from '../mocks/supabase';
import { resetAnthropicMocks } from '../mocks/anthropic';
import { clearStripeMocks } from '../mocks/stripe';
import { resetKvMocks } from '../mocks/vercel-kv';
import { clearTavilyMocks } from '../mocks/tavily';

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.TAVILY_API_KEY = 'test-tavily-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.ADMIN_EMAILS = 'admin@example.com';

// Mock Supabase clients
vi.mock('@/lib/supabase/client', async () => {
  const { mockSupabaseClient, createMockSupabaseClient } = await import('../mocks/supabase');
  return {
    createBrowserClient: () => createMockSupabaseClient(),
    createServerSupabaseClient: async () => createMockSupabaseClient(),
    createServiceRoleClient: () => mockSupabaseClient,
    getCurrentUser: async () => ({ id: 'test-user-id', email: 'test@example.com' }),
    requireAuth: async () => ({ id: 'test-user-id', email: 'test@example.com' }),
    withRetry: async <T>(operation: () => Promise<T>) => operation(),
  };
});

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', async () => {
  const { MockAnthropic } = await import('../mocks/anthropic');
  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Mock Stripe
vi.mock('stripe', async () => {
  const { MockStripeClient } = await import('../mocks/stripe');
  return {
    default: MockStripeClient,
    Stripe: MockStripeClient,
  };
});

// Mock Vercel KV
vi.mock('@vercel/kv', async () => {
  const { kv } = await import('../mocks/vercel-kv');
  return { kv };
});

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn().mockReturnValue({ value: 'test-cookie' }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Map([
    ['x-forwarded-for', '127.0.0.1'],
    ['user-agent', 'test-agent'],
  ]),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  withScope: vi.fn((callback) => callback({ setTag: vi.fn(), setContext: vi.fn() })),
  startSpan: vi.fn((_, callback) => callback({})),
  init: vi.fn(),
}));

// Global setup
beforeAll(() => {
  // Suppress console errors/warnings in tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup(); // React Testing Library cleanup
  vi.clearAllMocks();
});

// Reset all mocks between test files
afterAll(() => {
  vi.resetAllMocks();
  clearMockData();
  resetAnthropicMocks();
  clearStripeMocks();
  resetKvMocks();
  clearTavilyMocks();
});

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): any;
  }
}
