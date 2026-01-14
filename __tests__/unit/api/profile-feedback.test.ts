/**
 * Profile Feedback API Route Unit Tests
 *
 * Tests for the user feedback endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { GET } from '@/app/api/profile/feedback/route';

describe('Profile Feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/profile/feedback', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return all user feedback when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockVotes = [{ id: '1', vote_type: 'up' }];
      const mockSources = [{ id: '2', url: 'https://example.com' }];
      const mockErrors = [{ id: '3', description: 'Error' }];
      const mockEdits = [{ id: '4', suggestion: 'Edit' }];

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockVotes,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSources,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockErrors,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockEdits,
                error: null,
              }),
            }),
          }),
        });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.votes).toEqual(mockVotes);
      expect(data.source_suggestions).toEqual(mockSources);
      expect(data.error_reports).toEqual(mockErrors);
      expect(data.edit_proposals).toEqual(mockEdits);
    });

    it('should return empty arrays when no feedback exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.votes).toEqual([]);
      expect(data.source_suggestions).toEqual([]);
      expect(data.error_reports).toEqual([]);
      expect(data.edit_proposals).toEqual([]);
    });
  });
});
