/**
 * Questions Suggest API Route Unit Tests
 *
 * Tests for the question suggestions endpoint that provides autocomplete suggestions.
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

// Mock Supabase client
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock Anthropic
const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  })),
}));

// Mock safeAICall
const mockSafeAICall = vi.fn();

vi.mock('@/lib/ai/safe-ai-call', () => ({
  safeAICall: (...args: unknown[]) => mockSafeAICall(...args),
}));

describe('Questions Suggest API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  describe('GET /api/questions/suggest', () => {
    it('should return empty array when query is less than 2 characters', async () => {
      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=a');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return empty array when query is empty', async () => {
      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return empty array when no query param provided', async () => {
      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return template suggestions when query matches templates', async () => {
      const mockTemplates = [
        { question_text: 'What is the UK policy on NHS funding?', category: 'Healthcare' },
        { question_text: 'What is the UK stance on immigration?', category: 'Immigration' },
      ];

      const mockLimit = vi.fn().mockResolvedValue({
        data: mockTemplates,
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockIlike = vi.fn().mockReturnValue({ order: mockOrder, limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ ilike: mockIlike });

      // Mock briefs query (for history)
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      // Mock AI call returning empty (not needed)
      mockSafeAICall.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=what is');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].source).toBe('template');
      expect(data[0].text).toContain('UK');
    });

    it('should return history suggestions from briefs', async () => {
      const mockBriefs = [
        { question: 'What is the economic impact of Brexit?' },
        { question: 'What is climate change policy in UK?' },
      ];

      // Templates - empty
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs history
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: mockBriefs, error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      mockSafeAICall.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=what');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.some((s: { source: string }) => s.source === 'history')).toBe(true);
    });

    it('should include AI suggestions when templates and history have fewer than 4 results', async () => {
      const mockTemplates = [
        { question_text: 'Test template question?', category: 'Test' },
      ];

      // Templates
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: mockTemplates, error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs - empty
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      const aiSuggestions = [
        { text: 'AI generated question 1?', source: 'ai' as const },
        { text: 'AI generated question 2?', source: 'ai' as const },
      ];

      mockSafeAICall.mockResolvedValue({
        data: aiSuggestions,
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=policy');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.some((s: { source: string }) => s.source === 'ai')).toBe(true);
    });

    it('should limit total suggestions to 6', async () => {
      const mockTemplates = [
        { question_text: 'Template 1?', category: 'A' },
        { question_text: 'Template 2?', category: 'B' },
        { question_text: 'Template 3?', category: 'C' },
      ];

      const mockBriefs = [
        { question: 'History 1?' },
        { question: 'History 2?' },
      ];

      // Templates
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: mockTemplates, error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: mockBriefs, error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      const aiSuggestions = [
        { text: 'AI 1?', source: 'ai' as const },
        { text: 'AI 2?', source: 'ai' as const },
      ];

      mockSafeAICall.mockResolvedValue({
        data: aiSuggestions,
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeLessThanOrEqual(6);
    });

    it('should return 503 when templates database query fails', async () => {
      const mockTemplatesLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        return { select: vi.fn() };
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=test');
      const response = await GET(request);

      expect(response.status).toBe(503);
    });

    it('should return 503 when briefs history database query fails', async () => {
      // Templates - success but empty
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs - error
      const mockBriefsLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=test');
      const response = await GET(request);

      expect(response.status).toBe(503);
    });

    it('should deduplicate history suggestions against templates', async () => {
      const duplicateQuestion = 'What is the NHS budget?';

      const mockTemplates = [
        { question_text: duplicateQuestion, category: 'Healthcare' },
      ];

      const mockBriefs = [
        { question: duplicateQuestion }, // Same question, should be filtered out
        { question: 'A different question?' },
      ];

      // Templates
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: mockTemplates, error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: mockBriefs, error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      mockSafeAICall.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=NHS');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should have only one template and one unique history item
      const texts = data.map((s: { text: string }) => s.text.toLowerCase());
      const uniqueTexts = new Set(texts);
      expect(texts.length).toBe(uniqueTexts.size);
    });

    it('should handle AI call failure gracefully', async () => {
      // Templates - one result (need AI for more)
      const mockTemplatesLimit = vi.fn().mockResolvedValue({
        data: [{ question_text: 'Template?', category: 'Test' }],
        error: null,
      });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs - empty
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      // AI call fails
      mockSafeAICall.mockResolvedValue({
        data: null,
        error: new Error('AI service unavailable'),
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=test query');
      const response = await GET(request);
      const data = await response.json();

      // Should still return 200 with template-only results
      expect(response.status).toBe(200);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].source).toBe('template');
    });

    it('should trim whitespace from query', async () => {
      // Templates
      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      // Briefs
      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      mockSafeAICall.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=  test  ');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // The mock should have been called with trimmed query in the ilike call
      expect(mockTemplatesIlike).toHaveBeenCalledWith('question_text', '%test%');
    });

    it('should include category in template suggestions', async () => {
      const mockTemplates = [
        { question_text: 'What is the NHS policy?', category: 'Healthcare' },
      ];

      const mockTemplatesLimit = vi.fn().mockResolvedValue({ data: mockTemplates, error: null });
      const mockTemplatesOrder = vi.fn().mockReturnValue({ limit: mockTemplatesLimit });
      const mockTemplatesIlike = vi.fn().mockReturnValue({ order: mockTemplatesOrder });
      const mockTemplatesSelect = vi.fn().mockReturnValue({ ilike: mockTemplatesIlike });

      const mockBriefsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockBriefsOrder = vi.fn().mockReturnValue({ limit: mockBriefsLimit });
      const mockBriefsIlike = vi.fn().mockReturnValue({ order: mockBriefsOrder });
      const mockBriefsSelect = vi.fn().mockReturnValue({ ilike: mockBriefsIlike });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_templates') {
          return { select: mockTemplatesSelect };
        }
        if (table === 'briefs') {
          return { select: mockBriefsSelect };
        }
        return { select: vi.fn() };
      });

      mockSafeAICall.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import('@/app/api/questions/suggest/route');
      const request = new NextRequest('http://localhost/api/questions/suggest?q=NHS');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].category).toBe('Healthcare');
    });
  });
});
