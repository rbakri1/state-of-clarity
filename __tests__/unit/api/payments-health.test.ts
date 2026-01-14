/**
 * Payments Health API Route Unit Tests
 *
 * Tests for the payments health check endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the stripe health check
const mockCheckStripeHealth = vi.fn();

vi.mock('@/lib/stripe/safe-stripe-call', () => ({
  checkStripeHealth: () => mockCheckStripeHealth(),
}));

import { GET } from '@/app/api/payments/health/route';

describe('Payments Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset cached result
    vi.advanceTimersByTime(60000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/payments/health', () => {
    it('should return healthy status when Stripe is healthy', async () => {
      mockCheckStripeHealth.mockResolvedValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.healthy).toBe(true);
      expect(data.cached).toBe(false);
    });

    it('should return unhealthy status when Stripe is down', async () => {
      mockCheckStripeHealth.mockResolvedValue(false);

      const response = await GET();
      const data = await response.json();

      expect(data.healthy).toBe(false);
    });

    it('should return cached result within cache duration', async () => {
      mockCheckStripeHealth.mockResolvedValue(true);

      // First call
      const response1 = await GET();
      const data1 = await response1.json();
      expect(data1.cached).toBe(false);

      // Second call within cache duration
      vi.advanceTimersByTime(10000); // 10 seconds
      const response2 = await GET();
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);
    });

    it('should refresh cache after duration expires', async () => {
      mockCheckStripeHealth.mockResolvedValue(true);

      // First call
      await GET();

      // Advance past cache duration (30 seconds)
      vi.advanceTimersByTime(35000);

      const response = await GET();
      const data = await response.json();
      expect(data.cached).toBe(false);
    });
  });
});
