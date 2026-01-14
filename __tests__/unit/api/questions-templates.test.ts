/**
 * Question Templates API Route Unit Tests
 *
 * Tests for the question templates endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/questions/templates/route';

describe('Question Templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/questions/templates', () => {
    it('should return featured templates when no category specified', async () => {
      const mockTemplates = [
        { id: '1', category: 'Economy', question_text: 'What is GDP?' },
        { id: '2', category: 'Healthcare', question_text: 'How does NHS work?' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/questions/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTemplates);
    });

    it('should filter by category when specified', async () => {
      const mockTemplates = [
        { id: '1', category: 'Economy', question_text: 'What is GDP?' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/questions/templates?category=Economy');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual(mockTemplates);
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/questions/templates');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should return empty array when no templates found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost/api/questions/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });
  });
});
