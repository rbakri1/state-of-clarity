/**
 * Briefs Suggest Source API Route Unit Tests
 *
 * Tests for the source suggestion endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock feedback screening
const mockScreenFeedback = vi.fn();

vi.mock('@/lib/services/feedback-screening', () => ({
  screenFeedback: (...args: unknown[]) => mockScreenFeedback(...args),
}));

// Setup mock chain
function setupInsertMock(data: { id: string } | null, error: { message: string } | null) {
  mockSingle.mockResolvedValue({ data, error });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockFrom.mockReturnValue({ insert: mockInsert });
}

function setupUpdateMock() {
  mockEq.mockResolvedValue({ data: null, error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'source_suggestions') {
      return {
        insert: mockInsert,
        update: mockUpdate,
      };
    }
    return { insert: mockInsert };
  });
}

describe('Briefs Suggest Source API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/briefs/[id]/suggest-source', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should return 400 when URL is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('should return 400 when URL format is invalid', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'not-a-valid-url',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format');
    });

    it('should return 400 for URL without protocol', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'example.com/article',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format');
    });

    it('should return 500 when database insert fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock(null, { message: 'Database error' });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should successfully create a source suggestion with URL only', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-456' }, null);
      setupUpdateMock();
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('suggestion-456');
    });

    it('should accept optional title', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-789' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
          title: 'Article Title',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept optional publisher', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-abc' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
          publisher: 'Example Publisher',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept optional political_lean', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-def' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
          political_lean: 'center',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept optional notes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-ghi' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
          notes: 'This source provides additional context.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept all optional fields together', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-jkl' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/article',
          title: 'Article Title',
          publisher: 'Example Publisher',
          political_lean: 'center-left',
          notes: 'This source provides additional context.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('suggestion-jkl');
    });

    it('should accept https URLs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-mno' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.bbc.co.uk/news/article-123',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept http URLs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-pqr' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'http://example.org/page',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept URLs with query parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'suggestion-stu' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/suggest-source/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/suggest-source', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/search?q=policy&page=1',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
