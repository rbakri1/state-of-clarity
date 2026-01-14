/**
 * Profile Export API Route Unit Tests
 *
 * Tests for the profile export endpoint that downloads user data as JSON.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock cookies
const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockCookiesGet,
    set: mockCookiesSet,
  })),
}));

// Mock Supabase SSR client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('Profile Export API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('GET /api/profile/export', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should export user data successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        bio: 'Test bio',
        username: 'testuser',
      };

      const mockSavedBriefs = [
        {
          saved_at: '2024-01-15T10:00:00Z',
          briefs: {
            id: 'brief-1',
            question: 'Test question 1?',
            clarity_score: 85,
            created_at: '2024-01-10T00:00:00Z',
          },
        },
      ];

      const mockReadingHistory = [
        {
          first_viewed_at: '2024-01-12T10:00:00Z',
          last_viewed_at: '2024-01-13T15:00:00Z',
          time_spent: 120,
          scroll_depth: 0.8,
          briefs: {
            id: 'brief-1',
            question: 'Test question 1?',
            clarity_score: 85,
          },
        },
      ];

      const mockFeedback = [
        {
          id: 'feedback-1',
          type: 'upvote',
          content: null,
          section: null,
          status: 'pending',
          created_at: '2024-01-14T12:00:00Z',
          briefs: {
            id: 'brief-1',
            question: 'Test question 1?',
          },
        },
      ];

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Setup mock chain for profiles
      const mockProfileSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockProfileEq = vi.fn().mockReturnValue({ single: mockProfileSingle });
      const mockProfileSelect = vi.fn().mockReturnValue({ eq: mockProfileEq });

      // Setup mock chain for saved_briefs
      const mockSavedBriefsOrder = vi.fn().mockResolvedValue({
        data: mockSavedBriefs,
        error: null,
      });
      const mockSavedBriefsEq = vi.fn().mockReturnValue({ order: mockSavedBriefsOrder });
      const mockSavedBriefsSelect = vi.fn().mockReturnValue({ eq: mockSavedBriefsEq });

      // Setup mock chain for reading_history
      const mockHistoryOrder = vi.fn().mockResolvedValue({
        data: mockReadingHistory,
        error: null,
      });
      const mockHistoryEq = vi.fn().mockReturnValue({ order: mockHistoryOrder });
      const mockHistorySelect = vi.fn().mockReturnValue({ eq: mockHistoryEq });

      // Setup mock chain for feedback
      const mockFeedbackOrder = vi.fn().mockResolvedValue({
        data: mockFeedback,
        error: null,
      });
      const mockFeedbackEq = vi.fn().mockReturnValue({ order: mockFeedbackOrder });
      const mockFeedbackSelect = vi.fn().mockReturnValue({ eq: mockFeedbackEq });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'profiles':
            return { select: mockProfileSelect };
          case 'saved_briefs':
            return { select: mockSavedBriefsSelect };
          case 'reading_history':
            return { select: mockHistorySelect };
          case 'feedback':
            return { select: mockFeedbackSelect };
          default:
            return { select: vi.fn() };
        }
      });

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      expect(response.status).toBe(200);
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');
      expect(data.profile).toEqual(mockProfile);
      expect(data.saved_briefs).toEqual(mockSavedBriefs);
      expect(data.reading_history).toEqual(mockReadingHistory);
      expect(data.feedback).toEqual(mockFeedback);
      expect(data.exported_at).toBeDefined();
    });

    it('should set correct headers for file download', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('state-of-clarity-data-export');
      expect(response.headers.get('Content-Disposition')).toContain('.json');
    });

    it('should handle null profile gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      expect(response.status).toBe(200);
      expect(data.profile).toBeNull();
    });

    it('should handle empty saved briefs', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      expect(response.status).toBe(200);
      expect(data.saved_briefs).toEqual([]);
      expect(data.reading_history).toEqual([]);
      expect(data.feedback).toEqual([]);
    });

    it('should include exported_at timestamp', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data.exported_at).toBeDefined();
      expect(new Date(data.exported_at)).toBeInstanceOf(Date);
    });

    it('should include user created_at in export', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data.user.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should format JSON with indentation for readability', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();

      // Check that it's formatted with newlines (indented JSON)
      expect(text).toContain('\n');
      expect(text).toContain('  '); // 2-space indentation
    });

    it('should handle database error on profile fetch gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      // Should still return 200 with null profile
      expect(response.status).toBe(200);
      expect(data.profile).toBeNull();
    });

    it('should handle database error on saved_briefs fetch gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };

      mockFrom.mockReturnValue(mockChain);

      const { GET } = await import('@/app/api/profile/export/route');
      const response = await GET();
      const text = await response.text();
      const data = JSON.parse(text);

      // Should still return 200 with empty arrays
      expect(response.status).toBe(200);
      expect(data.saved_briefs).toEqual([]);
    });
  });
});
