/**
 * Popular Briefs API Route Unit Tests
 *
 * Tests for the popular briefs endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the brief service
const mockGetPopularBriefs = vi.fn();

vi.mock('@/lib/services/brief-service', () => ({
  getPopularBriefs: (...args: any[]) => mockGetPopularBriefs(...args),
}));

import { GET } from '@/app/api/briefs/popular/route';

describe('Popular Briefs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs/popular', () => {
    it('should return popular briefs with default limit', async () => {
      const mockBriefs = [
        { id: '1', question: 'Popular 1', view_count: 100 },
        { id: '2', question: 'Popular 2', view_count: 80 },
      ];

      mockGetPopularBriefs.mockResolvedValue(mockBriefs);

      const request = new NextRequest('http://localhost/api/briefs/popular');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockBriefs);
      expect(mockGetPopularBriefs).toHaveBeenCalledWith(10); // Default limit
    });

    it('should accept custom limit parameter', async () => {
      mockGetPopularBriefs.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/briefs/popular?limit=25');
      await GET(request);

      expect(mockGetPopularBriefs).toHaveBeenCalledWith(25);
    });

    it('should return 400 for invalid limit (too high)', async () => {
      const request = new NextRequest('http://localhost/api/briefs/popular?limit=101');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid limit (too low)', async () => {
      const request = new NextRequest('http://localhost/api/briefs/popular?limit=0');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for non-numeric limit', async () => {
      const request = new NextRequest('http://localhost/api/briefs/popular?limit=abc');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should include cache headers', async () => {
      mockGetPopularBriefs.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/briefs/popular');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('public');
    });
  });
});
