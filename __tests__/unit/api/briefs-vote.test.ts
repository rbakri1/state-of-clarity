/**
 * Brief Vote API Route Unit Tests
 *
 * Tests for the voting endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { GET, POST, DELETE } from '@/app/api/briefs/[id]/vote/route';

describe('Brief Vote API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs/[id]/vote', () => {
    it('should return vote counts', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { vote_type: 'up', user_id: 'user-1' },
              { vote_type: 'up', user_id: 'user-2' },
              { vote_type: 'down', user_id: 'user-3' },
            ],
            error: null,
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.upvotes).toBe(2);
      expect(data.downvotes).toBe(1);
      expect(data.userVote).toBeNull();
    });

    it('should include user vote when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { vote_type: 'up', user_id: 'user-1' },
            ],
            error: null,
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.userVote).toBe('up');
    });

    it('should return 500 on database error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/briefs/[id]/vote', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote_type: 'up' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(401);
    });

    it('should create new vote', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote_type: 'up' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should update existing vote', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'vote-1' }],
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote_type: 'down' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid vote_type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'POST',
        body: JSON.stringify({ vote_type: 'invalid' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid JSON', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'POST',
        body: 'not json',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/briefs/[id]/vote', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(401);
    });

    it('should delete vote successfully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should return 500 on delete error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/vote', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(500);
    });
  });
});
