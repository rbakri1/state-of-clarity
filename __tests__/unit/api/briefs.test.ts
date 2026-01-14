/**
 * Briefs API Route Unit Tests
 *
 * Tests for the explore briefs API endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockOr = vi.fn();
const mockGte = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Set up mock chain
function setupMockChain(data: any[], count: number, error: any = null) {
  const result = { data, count, error };

  mockRange.mockReturnValue(Promise.resolve(result));
  mockOrder.mockReturnValue({ range: mockRange });
  mockGte.mockReturnValue({ order: mockOrder, gte: mockGte });
  mockOr.mockReturnValue({ gte: mockGte, order: mockOrder });
  mockIlike.mockReturnValue({ or: mockOr, gte: mockGte, order: mockOrder });
  mockEq.mockReturnValue({ ilike: mockIlike, or: mockOr, gte: mockGte, order: mockOrder });
  mockSelect.mockReturnValue({ eq: mockEq, ilike: mockIlike });
  mockFrom.mockReturnValue({ select: mockSelect });
}

import { GET } from '@/app/api/briefs/route';

describe('Briefs API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs', () => {
    it('should return briefs with default pagination', async () => {
      const mockBriefs = [
        { id: '1', question: 'Test question 1', clarity_score: 8.5 },
        { id: '2', question: 'Test question 2', clarity_score: 7.5 },
      ];

      setupMockChain(mockBriefs, 2);

      const request = new NextRequest('http://localhost/api/briefs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.briefs).toEqual(mockBriefs);
      expect(data.total).toBe(2);
    });

    it('should handle search query parameter', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?q=climate');
      await GET(request);

      expect(mockIlike).toHaveBeenCalled();
    });

    it('should handle tags filter', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?tags=Economy,Healthcare');
      await GET(request);

      expect(mockOr).toHaveBeenCalled();
    });

    it('should handle minScore filter', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?minScore=7');
      await GET(request);

      expect(mockGte).toHaveBeenCalled();
    });

    it('should handle date filter for week', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?date=week');
      await GET(request);

      // gte should be called for date filtering
      expect(mockGte).toHaveBeenCalled();
    });

    it('should handle sort parameter - newest', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?sort=newest');
      await GET(request);

      expect(mockOrder).toHaveBeenCalled();
    });

    it('should handle sort parameter - oldest', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?sort=oldest');
      await GET(request);

      expect(mockOrder).toHaveBeenCalled();
    });

    it('should handle sort parameter - score', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?sort=score');
      await GET(request);

      expect(mockOrder).toHaveBeenCalled();
    });

    it('should handle sort parameter - views', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?sort=views');
      await GET(request);

      expect(mockOrder).toHaveBeenCalled();
    });

    it('should handle pagination with limit and offset', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs?limit=5&offset=10');
      await GET(request);

      expect(mockRange).toHaveBeenCalledWith(10, 14);
    });

    it('should return hasMore when there are more results', async () => {
      const mockBriefs = [{ id: '1', question: 'Test' }];
      setupMockChain(mockBriefs, 10);

      const request = new NextRequest('http://localhost/api/briefs?limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.hasMore).toBe(true);
    });

    it('should return hasMore false when no more results', async () => {
      const mockBriefs = [{ id: '1', question: 'Test' }];
      setupMockChain(mockBriefs, 1);

      const request = new NextRequest('http://localhost/api/briefs?limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(data.hasMore).toBe(false);
    });

    it('should return validation error for invalid minScore', async () => {
      const request = new NextRequest('http://localhost/api/briefs?minScore=15');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 500 on query error', async () => {
      setupMockChain(null, 0, { message: 'Database error' });

      const request = new NextRequest('http://localhost/api/briefs');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should include cache headers', async () => {
      setupMockChain([], 0);

      const request = new NextRequest('http://localhost/api/briefs');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('public');
    });
  });
});
