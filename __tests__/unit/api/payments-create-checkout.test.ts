/**
 * Payments Create Checkout API Route Unit Tests
 *
 * Tests for the Stripe checkout session creation endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock Stripe client
const mockStripeCheckoutCreate = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockStripeCheckoutCreate(...args),
      },
    },
  },
}));

// Mock safeStripeCall
const mockSafeStripeCall = vi.fn();

vi.mock('@/lib/stripe/safe-stripe-call', () => ({
  safeStripeCall: (...args: unknown[]) => mockSafeStripeCall(...args),
}));

// Setup Supabase mock chain for package lookup
function setupPackageLookup(packageData: object | null, error: { message: string } | null) {
  mockSingle.mockResolvedValue({ data: packageData, error });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

describe('Payments Create Checkout API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  describe('POST /api/payments/create-checkout', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 400 when package_id is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing package_id');
    });

    it('should return 404 when package is not found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(null, { message: 'Not found' });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'nonexistent-pkg' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Package not found');
    });

    it('should return 400 when package is not active', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-123',
          name: 'Basic Pack',
          credits: 10,
          price_gbp: 5.00,
          active: false,
        },
        null
      );

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This package is no longer available');
    });

    it('should return 503 when Stripe service error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-123',
          name: 'Basic Pack',
          credits: 10,
          price_gbp: 5.00,
          active: true,
        },
        null
      );

      mockSafeStripeCall.mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
        isStripeServiceError: true,
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.code).toBe('PAYMENT_SERVICE_ERROR');
    });

    it('should return 400 when Stripe returns non-service error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-123',
          name: 'Basic Pack',
          credits: 10,
          price_gbp: 5.00,
          active: true,
        },
        null
      );

      mockSafeStripeCall.mockResolvedValue({
        data: null,
        error: { message: 'Card declined' },
        isStripeServiceError: false,
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PAYMENT_ERROR');
    });

    it('should successfully create checkout session and return URL', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-123',
          name: 'Basic Pack',
          credits: 10,
          price_gbp: 5.00,
          active: true,
        },
        null
      );

      mockSafeStripeCall.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session-123' },
        error: null,
        isStripeServiceError: false,
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/session-123');
    });

    it('should call safeStripeCall with correct parameters', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-789',
          name: 'Premium Pack',
          credits: 50,
          price_gbp: 20.00,
          active: true,
        },
        null
      );

      mockSafeStripeCall.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session-xyz' },
        error: null,
        isStripeServiceError: false,
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-789' }),
      });

      await POST(request);

      expect(mockSafeStripeCall).toHaveBeenCalledWith(
        expect.any(Function),
        {
          operation: 'create_checkout_session',
          userId: 'user-456',
          packageId: 'pkg-789',
        }
      );
    });

    it('should return 500 when unexpected error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Make the from call throw
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should use default base URL when environment variable is not set', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      setupPackageLookup(
        {
          id: 'pkg-123',
          name: 'Basic Pack',
          credits: 10,
          price_gbp: 5.00,
          active: true,
        },
        null
      );

      mockSafeStripeCall.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session-123' },
        error: null,
        isStripeServiceError: false,
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/payments/create-checkout/route');
      const request = new NextRequest('http://localhost/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ package_id: 'pkg-123' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
