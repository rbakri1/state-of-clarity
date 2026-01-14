/**
 * Credits API Route Unit Tests
 *
 * Tests for the credits endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock credit service
const mockGetBalance = vi.fn();

vi.mock('@/lib/services/credit-service', () => ({
  getBalance: (...args: any[]) => mockGetBalance(...args),
}));

import { GET } from '@/app/api/credits/route';

describe('Credits API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/credits', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return balance and packages when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockGetBalance.mockResolvedValue(100);

      const mockPackages = [
        { id: 'pkg-1', credits: 10, price: 5 },
        { id: 'pkg-2', credits: 50, price: 20 },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockPackages,
              error: null,
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balance).toBe(100);
      expect(data.packages).toEqual(mockPackages);
    });

    it('should return 500 on packages fetch error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });
});
