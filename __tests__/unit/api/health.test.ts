/**
 * Health API Route Unit Tests
 *
 * Tests for the health check endpoint.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase
const mockFrom = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn(() => ({ limit: mockLimit }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: mockSelect,
    }),
  })),
}));

// Setup environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

describe('Health API Route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when Supabase is healthy', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services.supabase.status).toBe('healthy');
    });

    it('should return unhealthy status on connection error', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'Connection refused' },
      });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(data.services.supabase.status).toBe('unhealthy');
    });

    it('should return degraded status on non-connection errors', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: 'Query syntax error' },
      });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(data.services.supabase.status).toBe('degraded');
    });

    it('should return cached result within cache duration', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      });

      const { GET } = await import('@/app/api/health/route');

      // First call
      const response1 = await GET();
      const data1 = await response1.json();
      expect(data1.cached).toBe(false);

      // Second call (within cache duration) - should be cached
      const response2 = await GET();
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);
    });

    it('should include latency in response', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(data.services.supabase.latencyMs).toBeDefined();
      expect(typeof data.services.supabase.latencyMs).toBe('number');
    });

    it('should include checkedAt timestamp', async () => {
      mockLimit.mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const data = await response.json();

      expect(data.checkedAt).toBeDefined();
      expect(new Date(data.checkedAt)).toBeInstanceOf(Date);
    });
  });
});
