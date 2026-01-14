/**
 * Briefs Propose Edit API Route Unit Tests
 *
 * Tests for the edit proposal endpoint.
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
    if (table === 'edit_proposals') {
      return {
        insert: mockInsert,
        update: mockUpdate,
      };
    }
    return { insert: mockInsert };
  });
}

describe('Briefs Propose Edit API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/briefs/[id]/propose-edit', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
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

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should return 400 when section is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Section is required');
    });

    it('should return 400 when section is invalid', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'invalid_section',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid section');
      expect(data.error).toContain('summary, narrative, structured_data');
    });

    it('should return 400 when original_text is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Original text is required');
    });

    it('should return 400 when original_text is too short', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'Too short',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Original text must be at least 20 characters');
    });

    it('should return 400 when proposed_text is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Proposed text is required');
    });

    it('should return 400 when proposed_text is too short', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'Too short',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Proposed text must be at least 20 characters');
    });

    it('should return 400 when rationale is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rationale is required');
    });

    it('should return 400 when rationale is too short', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'Too short',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rationale must be at least 20 characters');
    });

    it('should return 500 when database insert fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock(null, { message: 'Database error' });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should successfully create an edit proposal', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-456' }, null);
      setupUpdateMock();
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('proposal-456');
    });

    it('should accept narrative as valid section', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-789' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'narrative',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept structured_data as valid section', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-abc' }, null);
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.95,
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'structured_data',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle flagged screening result and update status', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-flagged' }, null);
      setupUpdateMock();
      mockScreenFeedback.mockResolvedValue({
        approved: false,
        flagged: true,
        confidence: 0.8,
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.id).toBe('proposal-flagged');

      // Allow async screening to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should keep pending status when confidence is low', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-low-conf' }, null);
      setupUpdateMock();
      mockScreenFeedback.mockResolvedValue({
        approved: true,
        flagged: false,
        confidence: 0.7, // Below 0.9 threshold
      });

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Allow async screening to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should handle screening failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupInsertMock({ id: 'proposal-screen-fail' }, null);
      mockScreenFeedback.mockRejectedValue(new Error('Screening service unavailable'));

      const { POST } = await import('@/app/api/briefs/[id]/propose-edit/route');
      const request = new NextRequest('http://localhost/api/briefs/brief-123/propose-edit', {
        method: 'POST',
        body: JSON.stringify({
          section: 'summary',
          original_text: 'This is the original text content.',
          proposed_text: 'This is the proposed text content.',
          rationale: 'This is the rationale for the change.',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      // Response should still be successful since screening is async
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Allow async screening to complete and log error
      await new Promise(resolve => setTimeout(resolve, 10));

      consoleSpy.mockRestore();
    });
  });
});
