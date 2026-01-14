/**
 * Credits Balance API Route Unit Tests
 *
 * Tests for the credits balance endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock credit service
const mockGetBalance = vi.fn();

vi.mock('@/lib/services/credit-service', () => ({
  getBalance: (...args: any[]) => mockGetBalance(...args),
}));

import { GET } from '@/app/api/credits/balance/route';

describe('Credits Balance API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/credits/balance', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return balance when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockGetBalance.mockResolvedValue(50);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balance).toBe(50);
    });

    it('should return 0 balance for new user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-new' } },
      });

      mockGetBalance.mockResolvedValue(0);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balance).toBe(0);
    });

    it('should return 500 on error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockGetBalance.mockRejectedValue(new Error('Database error'));

      const response = await GET();

      expect(response.status).toBe(500);
    });
  });
});
