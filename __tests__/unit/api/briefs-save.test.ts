/**
 * Brief Save API Route Unit Tests
 *
 * Tests for saving and unsaving briefs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({ value: `mock-${name}` })),
    set: vi.fn(),
  })),
}));

// Mock Supabase SSR
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { GET, POST, DELETE } from '@/app/api/briefs/[id]/save/route';

describe('Brief Save API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs/[id]/save', () => {
    it('should return saved: false when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(false);
      expect(data.authenticated).toBe(false);
    });

    it('should return saved: true when brief is saved', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'saved-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(true);
      expect(data.authenticated).toBe(true);
    });

    it('should return saved: false when brief is not saved', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save');
      const response = await GET(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(false);
      expect(data.authenticated).toBe(true);
    });
  });

  describe('POST /api/briefs/[id]/save', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(401);
    });

    it('should return already saved message when brief exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-save' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(true);
      expect(data.message).toContain('already');
    });

    it('should save brief when not already saved', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-save-id' },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(true);
      expect(data.id).toBe('new-save-id');
    });

    it('should return 500 on insert error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/briefs/[id]/save', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(401);
    });

    it('should unsave brief successfully', async () => {
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

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });
      const data = await response.json();

      expect(data.saved).toBe(false);
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

      const request = new NextRequest('http://localhost/api/briefs/brief-123/save', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'brief-123' }) });

      expect(response.status).toBe(500);
    });
  });
});
