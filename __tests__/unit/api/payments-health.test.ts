/**
 * Payments Health API Route Unit Tests
 *
 * Tests for the payments health check endpoint.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the stripe health check
const mockCheckStripeHealth = vi.fn();

vi.mock('@/lib/stripe/safe-stripe-call', () => ({
  checkStripeHealth: () => mockCheckStripeHealth(),
}));

describe('Payments Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/payments/health', () => {
    it('should return healthy status when Stripe is healthy', async () => {
      mockCheckStripeHealth.mockResolvedValue(true);

      const { GET } = await import('@/app/api/payments/health/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.healthy).toBe(true);
      expect(data.cached).toBe(false);
    });

    it('should return unhealthy status when Stripe is down', async () => {
      mockCheckStripeHealth.mockResolvedValue(false);

      const { GET } = await import('@/app/api/payments/health/route');
      const response = await GET();
      const data = await response.json();

      expect(data.healthy).toBe(false);
    });

    it('should return cached result within cache duration', async () => {
      mockCheckStripeHealth.mockResolvedValue(true);

      const { GET } = await import('@/app/api/payments/health/route');

      // First call
      const response1 = await GET();
      const data1 = await response1.json();
      expect(data1.cached).toBe(false);

      // Second call (within cache duration) - should be cached
      const response2 = await GET();
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);
    });
  });
});
