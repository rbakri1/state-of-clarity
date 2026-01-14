/**
 * Brief Tags API Route Unit Tests
 *
 * Tests for the tags endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/briefs/tags/route';

describe('Brief Tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/briefs/tags', () => {
    it('should return tags with counts', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: { tags: ['Economy', 'Healthcare'] } },
              { metadata: { tags: ['Economy', 'Education'] } },
              { metadata: { tags: ['Healthcare'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tags).toContainEqual({ tag: 'Economy', count: 2 });
      expect(data.tags).toContainEqual({ tag: 'Healthcare', count: 2 });
      expect(data.tags).toContainEqual({ tag: 'Education', count: 1 });
    });

    it('should sort tags by count descending', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: { tags: ['Economy', 'Healthcare', 'Education'] } },
              { metadata: { tags: ['Economy'] } },
              { metadata: { tags: ['Economy'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags[0].tag).toBe('Economy');
      expect(data.tags[0].count).toBe(3);
    });

    it('should handle briefs without tags', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: {} },
              { metadata: null },
              { metadata: { tags: ['Test'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toHaveLength(1);
      expect(data.tags[0]).toEqual({ tag: 'Test', count: 1 });
    });

    it('should handle empty briefs list', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toEqual([]);
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const response = await GET();

      expect(response.status).toBe(500);
    });

    it('should trim whitespace from tags', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: { tags: ['  Economy  ', 'Economy'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toContainEqual({ tag: 'Economy', count: 2 });
    });

    it('should filter out empty string tags', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: { tags: ['', '  ', 'Valid'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].tag).toBe('Valid');
    });

    it('should include cache headers', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toContain('public');
    });

    it('should handle non-array tags in metadata', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { metadata: { tags: 'not-an-array' } },
              { metadata: { tags: ['Valid'] } },
            ],
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].tag).toBe('Valid');
    });
  });
});
