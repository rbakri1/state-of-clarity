/**
 * Stripe Webhook API Route Unit Tests
 *
 * Tests for the Stripe webhook endpoint handling payment events.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Stripe client
const mockConstructEvent = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  })),
}));

// Mock credit service
const mockAddCredits = vi.fn();

vi.mock('@/lib/services/credit-service', () => ({
  addCredits: (...args: unknown[]) => mockAddCredits(...args),
}));

// Mock payment retry service
const mockHandlePaymentFailure = vi.fn();
const mockMarkRetrySucceeded = vi.fn();

vi.mock('@/lib/services/payment-retry-service', () => ({
  handlePaymentFailure: (...args: unknown[]) => mockHandlePaymentFailure(...args),
  markRetrySucceeded: (...args: unknown[]) => mockMarkRetrySucceeded(...args),
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Store original env
const originalEnv = process.env;

describe('Stripe Webhook API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    };
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing stripe-signature header');
    });

    it('should return 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'sig_test_123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook configuration error');
    });

    it('should return 400 when signature verification fails', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Webhook signature verification failed');
    });

    it('should handle checkout.session.completed event and add credits', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              user_id: 'user-123',
              package_id: 'pkg-456',
              credits: '50',
            },
            payment_intent: 'pi_test_789',
          },
        },
      });
      mockAddCredits.mockResolvedValue(undefined);

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockAddCredits).toHaveBeenCalledWith(
        'user-123',
        50,
        'purchase',
        'pi_test_789',
        expect.any(Date)
      );
    });

    it('should throw error when checkout session is missing user_id metadata', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              package_id: 'pkg-456',
              credits: '50',
            },
            payment_intent: 'pi_test_789',
          },
        },
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });

    it('should throw error when checkout session has invalid credits value', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              user_id: 'user-123',
              package_id: 'pkg-456',
              credits: 'invalid',
            },
            payment_intent: 'pi_test_789',
          },
        },
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            metadata: {
              user_id: 'user-123',
              package_id: 'pkg-456',
            },
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      });
      mockHandlePaymentFailure.mockResolvedValue(undefined);

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.payment_failed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandlePaymentFailure).toHaveBeenCalledWith(
        'user-123',
        'pi_test_failed',
        'pkg-456',
        'Card declined'
      );
    });

    it('should skip retry logic when payment_intent.payment_failed has no user_id', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            metadata: {},
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.payment_failed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandlePaymentFailure).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.succeeded event', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_succeeded',
          },
        },
      });
      mockMarkRetrySucceeded.mockResolvedValue(undefined);

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.succeeded' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockMarkRetrySucceeded).toHaveBeenCalledWith('pi_test_succeeded');
    });

    it('should return 200 for unhandled event types', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test_123',
          },
        },
      });

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'customer.created' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it('should return 500 when handler throws error', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              user_id: 'user-123',
              package_id: 'pkg-456',
              credits: '50',
            },
            payment_intent: 'pi_test_789',
          },
        },
      });
      mockAddCredits.mockRejectedValue(new Error('Database error'));

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });

    it('should use default error message when last_payment_error is missing', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            metadata: {
              user_id: 'user-123',
              package_id: 'pkg-456',
            },
          },
        },
      });
      mockHandlePaymentFailure.mockResolvedValue(undefined);

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.payment_failed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockHandlePaymentFailure).toHaveBeenCalledWith(
        'user-123',
        'pi_test_failed',
        'pkg-456',
        'Payment failed'
      );
    });

    it('should handle null package_id in payment_failed', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            metadata: {
              user_id: 'user-123',
            },
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      });
      mockHandlePaymentFailure.mockResolvedValue(undefined);

      vi.resetModules();
      const { POST } = await import('@/app/api/webhooks/stripe/route');
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.payment_failed' }),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockHandlePaymentFailure).toHaveBeenCalledWith(
        'user-123',
        'pi_test_failed',
        null,
        'Card declined'
      );
    });
  });
});
