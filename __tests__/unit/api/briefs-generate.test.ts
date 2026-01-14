/**
 * Brief Generate API Route Unit Tests
 *
 * Tests for the brief generation endpoint with streaming SSE responses.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
const mockCookiesGetAll = vi.fn(() => []);
const mockCookiesSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: mockCookiesGetAll,
    set: mockCookiesSet,
  })),
}));

// Mock Supabase SSR client
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock credit service
const mockHasCredits = vi.fn();
const mockDeductCredits = vi.fn();
const mockRefundCredits = vi.fn();

vi.mock('@/lib/services/credit-service', () => ({
  hasCredits: (...args: unknown[]) => mockHasCredits(...args),
  deductCredits: (...args: unknown[]) => mockDeductCredits(...args),
  refundCredits: (...args: unknown[]) => mockRefundCredits(...args),
}));

// Mock brief generation orchestrator
const mockGenerateBrief = vi.fn();

vi.mock('@/lib/agents/langgraph-orchestrator', () => ({
  generateBrief: (...args: unknown[]) => mockGenerateBrief(...args),
}));

// Mock brief service
const mockCreateBrief = vi.fn();
const mockCompleteBriefGeneration = vi.fn();

vi.mock('@/lib/services/brief-service', () => ({
  createBrief: (...args: unknown[]) => mockCreateBrief(...args),
  completeBriefGeneration: (...args: unknown[]) => mockCompleteBriefGeneration(...args),
}));

// Mock text formatting
vi.mock('@/lib/text-formatting', () => ({
  formatQuestionTitle: (q: string) => q.trim(),
}));

// Set up environment variables
const originalEnv = process.env;

describe('Brief Generate API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      TAVILY_API_KEY: 'test-tavily-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    };
  });

  describe('POST /api/briefs/generate', () => {
    it('should return 500 when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'Test question?' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('should return 500 when TAVILY_API_KEY is missing', async () => {
      delete process.env.TAVILY_API_KEY;

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'Test question?' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'Test question?' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 when question is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Question is required');
    });

    it('should return 400 when question is empty', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: '   ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Question is required');
    });

    it('should return 400 when question is not a string', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Question is required');
    });

    it('should return 402 when user has insufficient credits', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockHasCredits.mockResolvedValue(false);

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'What is climate change?' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain('Insufficient credits');
      expect(data.creditsLink).toBe('/credits');
    });

    it('should return SSE stream with correct headers when generation starts', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockHasCredits.mockResolvedValue(true);
      mockCreateBrief.mockResolvedValue({ id: 'brief-123', error: null });
      mockDeductCredits.mockResolvedValue(true);
      mockGenerateBrief.mockResolvedValue({
        clarityScore: { overall: 75 },
        error: null,
      });
      mockCompleteBriefGeneration.mockResolvedValue({ error: null });

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'What is climate change?' }),
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should call hasCredits with correct parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });
      mockHasCredits.mockResolvedValue(false);

      vi.resetModules();
      const { POST } = await import('@/app/api/briefs/generate/route');
      const request = new NextRequest('http://localhost/api/briefs/generate', {
        method: 'POST',
        body: JSON.stringify({ question: 'Test question?' }),
      });

      await POST(request);

      expect(mockHasCredits).toHaveBeenCalledWith('user-456', 1);
    });
  });
});
