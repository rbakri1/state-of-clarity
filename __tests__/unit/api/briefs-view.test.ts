/**
 * Brief View Tracking API Route Unit Tests
 *
 * Tests for the view count tracking endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: () => mockCookies,
}));

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/briefs/[id]/view/route';

describe('Brief View Tracking API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/briefs/[id]/view', () => {
    it('should increment view count for new viewer', async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { view_count: 5 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: 'brief-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incremented).toBe(true);
      expect(data.viewCount).toBe(6);
    });

    it('should not increment for already viewed session', async () => {
      mockCookies.get.mockReturnValue({ value: '1' });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: 'brief-123' } });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.incremented).toBe(false);
      expect(data.message).toContain('Already viewed');
    });

    it('should return 400 when ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/briefs//view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: '' } });

      expect(response.status).toBe(400);
    });

    it('should return 404 when brief not found', async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/nonexistent/view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });

    it('should return 500 on update error', async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { view_count: 5 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: 'brief-123' } });

      expect(response.status).toBe(500);
    });

    it('should handle null view_count', async () => {
      mockCookies.get.mockReturnValue(undefined);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { view_count: null },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/briefs/brief-123/view', {
        method: 'POST',
      });
      const response = await POST(request, { params: { id: 'brief-123' } });
      const data = await response.json();

      expect(data.viewCount).toBe(1);
    });
  });
});
