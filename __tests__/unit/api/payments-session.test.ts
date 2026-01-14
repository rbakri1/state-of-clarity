/**
 * Payments Session API Route Unit Tests
 *
 * Tests for the Stripe checkout session retrieval endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock Stripe client
const mockStripeSessionsRetrieve = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: (...args: unknown[]) => mockStripeSessionsRetrieve(...args),
      },
    },
  },
}));

// Mock credit service
const mockGetBalance = vi.fn();

vi.mock('@/lib/services/credit-service', () => ({
  getBalance: (...args: unknown[]) => mockGetBalance(...args),
}));

describe('Payments Session API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET /api/payments/session', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when session_id is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing session_id');
    });

    it('should return 404 when session does not have user_id in metadata', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: {},
        payment_status: 'paid',
      });

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should return 404 when session user_id does not match authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'different-user-456', credits: '10' },
        payment_status: 'paid',
      });

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should successfully return session details with credits and balance', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'user-123', credits: '50' },
        payment_status: 'paid',
      });

      mockGetBalance.mockResolvedValue(100);

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.creditsAdded).toBe(50);
      expect(data.balance).toBe(100);
      expect(data.status).toBe('paid');
      expect(data.expiresAt).toBeDefined();
      // Verify expiresAt is approximately 12 months from now
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const monthsDiff = (expiresAt.getFullYear() - now.getFullYear()) * 12 + (expiresAt.getMonth() - now.getMonth());
      expect(monthsDiff).toBe(12);
    });

    it('should call stripe.checkout.sessions.retrieve with correct session_id', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_abc123',
        metadata: { user_id: 'user-123', credits: '25' },
        payment_status: 'paid',
      });

      mockGetBalance.mockResolvedValue(75);

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_abc123');

      await GET(request);

      expect(mockStripeSessionsRetrieve).toHaveBeenCalledWith('sess_abc123');
    });

    it('should call getBalance with correct user ID', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'user-456', credits: '10' },
        payment_status: 'paid',
      });

      mockGetBalance.mockResolvedValue(50);

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      await GET(request);

      expect(mockGetBalance).toHaveBeenCalledWith('user-456');
    });

    it('should handle session with missing credits metadata (defaults to 0)', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'user-123' }, // credits not present
        payment_status: 'paid',
      });

      mockGetBalance.mockResolvedValue(100);

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.creditsAdded).toBe(0);
    });

    it('should return payment status from stripe session', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'user-123', credits: '10' },
        payment_status: 'unpaid',
      });

      mockGetBalance.mockResolvedValue(10);

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unpaid');
    });

    it('should return 500 when Stripe throws an error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockRejectedValue(new Error('Stripe API error'));

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve session');
    });

    it('should return 500 when getBalance throws an error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: { user_id: 'user-123', credits: '10' },
        payment_status: 'paid',
      });

      mockGetBalance.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve session');
    });

    it('should handle session with null metadata', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockStripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_123',
        metadata: null,
        payment_status: 'paid',
      });

      const { GET } = await import('@/app/api/payments/session/route');
      const request = new NextRequest('http://localhost/api/payments/session?session_id=sess_123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });
});
