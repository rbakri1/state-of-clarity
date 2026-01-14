/**
 * Briefs Report Error API Route Unit Tests
 *
 * Tests for the error reporting endpoint.
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
    if (table === 'error_reports') {
      return {
        insert: mockInsert,
        update: mockUpdate,
      };
    }
    return { insert: mockInsert };
  });
}

describe('Briefs Report Error API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/briefs/[id]/report-error', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'This is a description of the error found.',
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

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should return 400 when error_type is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          description: 'This is a description of the error found.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Error type is required');
    });

    it('should return 400 when error_type is invalid', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'invalid_type',
          description: 'This is a description of the error found.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid error type');
      expect(data.error).toContain('factual, outdated, misleading, other');
    });

    it('should return 400 when description is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Description is required');
    });

    it('should return 400 when description is too short', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'Too short',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Description must be at least 20 characters');
    });

    it('should return 500 when database insert fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock(null, { message: 'Database error' });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'This is a description of the error found.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should successfully create an error report with factual type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-456' }, null);
      setupUpdateMock();
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'The statistic mentioned is incorrect.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('report-456');
    });

    it('should accept outdated as valid error type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-789' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'outdated',
          description: 'This information is no longer current.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept misleading as valid error type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-abc' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'misleading',
          description: 'This presentation is misleading.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept other as valid error type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-def' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'other',
          description: 'There is a different issue here.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept optional location_hint', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-ghi' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'The statistic mentioned is incorrect.',
          location_hint: 'Third paragraph, second sentence',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('report-ghi');
    });

    it('should work without location_hint', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'report-jkl' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/report-error/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/report-error', {
        method: 'POST',
        body: JSON.stringify({
          error_type: 'factual',
          description: 'The statistic mentioned is incorrect.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
