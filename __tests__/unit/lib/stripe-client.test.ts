/**
 * Tests for lib/stripe/client.ts
 *
 * Tests the Stripe client creation functions, singleton pattern, and lazy exports.
 * Note: The Stripe SDK is mocked in vitest.setup.ts,
 * so here we test the real implementations by unmocking them.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the module to test the real implementation
vi.unmock('@/lib/stripe/client');

// Store original env values
const originalEnv = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

// Mock Stripe SDK objects
const mockCheckout = { sessions: { create: vi.fn() } };
const mockPaymentIntents = { create: vi.fn(), retrieve: vi.fn() };
const mockWebhooks = { constructEvent: vi.fn() };

// Track constructor calls
let stripeConstructorCalls: Array<{ apiKey: string; options: any }> = [];

// Mock Stripe as a class
class MockStripe {
  checkout = mockCheckout;
  paymentIntents = mockPaymentIntents;
  webhooks = mockWebhooks;

  constructor(apiKey: string, options?: any) {
    stripeConstructorCalls.push({ apiKey, options });
  }
}

vi.mock('stripe', () => ({
  default: MockStripe,
}));

describe('stripe/client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Clear constructor call tracking
    stripeConstructorCalls = [];
    // Restore environment variables
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_publishable_key';
  });

  afterEach(() => {
    // Restore original environment
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  describe('getStripe', () => {
    it('should create a Stripe instance with correct configuration', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

      const { getStripe } = await import('@/lib/stripe/client');
      const stripeInstance = getStripe();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].apiKey).toBe('sk_test_valid_key');
      expect(stripeConstructorCalls[0].options).toEqual({
        apiVersion: '2025-12-15.clover',
        typescript: true,
      });
      expect(stripeInstance).toBeDefined();
    });

    it('should return singleton instance on subsequent calls', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

      const { getStripe } = await import('@/lib/stripe/client');

      const instance1 = getStripe();
      const instance2 = getStripe();

      expect(instance1).toBe(instance2);
      expect(stripeConstructorCalls).toHaveLength(1);
    });

    it('should throw error when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { getStripe } = await import('@/lib/stripe/client');

      expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY environment variable');
    });

    it('should throw error when STRIPE_SECRET_KEY is empty string', async () => {
      process.env.STRIPE_SECRET_KEY = '';

      const { getStripe } = await import('@/lib/stripe/client');

      expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY environment variable');
    });

    it('should use environment variable for API key', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_live_production_key';

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe } = await import('@/lib/stripe/client');
      getStripe();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].apiKey).toBe('sk_live_production_key');
    });
  });

  describe('stripe object (lazy exports)', () => {
    describe('checkout getter', () => {
      it('should return checkout object from Stripe instance', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        const { stripe } = await import('@/lib/stripe/client');
        const checkout = stripe.checkout;

        expect(checkout).toBe(mockCheckout);
      });

      it('should lazily initialize Stripe on first access', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        // Stripe should not be initialized yet
        expect(stripeConstructorCalls).toHaveLength(0);

        // Access checkout triggers initialization
        const _checkout = stripe.checkout;

        expect(stripeConstructorCalls).toHaveLength(1);
      });

      it('should throw error when accessing checkout without API key', async () => {
        delete process.env.STRIPE_SECRET_KEY;

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        expect(() => stripe.checkout).toThrow('Missing STRIPE_SECRET_KEY environment variable');
      });
    });

    describe('paymentIntents getter', () => {
      it('should return paymentIntents object from Stripe instance', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        const { stripe } = await import('@/lib/stripe/client');
        const paymentIntents = stripe.paymentIntents;

        expect(paymentIntents).toBe(mockPaymentIntents);
      });

      it('should lazily initialize Stripe on first access', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        expect(stripeConstructorCalls).toHaveLength(0);

        const _paymentIntents = stripe.paymentIntents;

        expect(stripeConstructorCalls).toHaveLength(1);
      });

      it('should throw error when accessing paymentIntents without API key', async () => {
        delete process.env.STRIPE_SECRET_KEY;

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        expect(() => stripe.paymentIntents).toThrow('Missing STRIPE_SECRET_KEY environment variable');
      });
    });

    describe('webhooks getter', () => {
      it('should return webhooks object from Stripe instance', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        const { stripe } = await import('@/lib/stripe/client');
        const webhooks = stripe.webhooks;

        expect(webhooks).toBe(mockWebhooks);
      });

      it('should lazily initialize Stripe on first access', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        expect(stripeConstructorCalls).toHaveLength(0);

        const _webhooks = stripe.webhooks;

        expect(stripeConstructorCalls).toHaveLength(1);
      });

      it('should throw error when accessing webhooks without API key', async () => {
        delete process.env.STRIPE_SECRET_KEY;

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        expect(() => stripe.webhooks).toThrow('Missing STRIPE_SECRET_KEY environment variable');
      });
    });

    describe('shared singleton behavior', () => {
      it('should share singleton across all property accesses', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe } = await import('@/lib/stripe/client');

        // Access multiple properties
        const _checkout = stripe.checkout;
        const _paymentIntents = stripe.paymentIntents;
        const _webhooks = stripe.webhooks;

        // Should only create one Stripe instance
        expect(stripeConstructorCalls).toHaveLength(1);
      });

      it('should share singleton with getStripe function', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

        vi.resetModules();
        stripeConstructorCalls = [];
        const { stripe, getStripe } = await import('@/lib/stripe/client');

        // Access via stripe object
        const _checkout = stripe.checkout;

        // Access via getStripe
        const _instance = getStripe();

        // Should only create one instance
        expect(stripeConstructorCalls).toHaveLength(1);
      });
    });
  });

  describe('getStripePublishableKey', () => {
    it('should return publishable key when set', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_valid_publishable_key';

      const { getStripePublishableKey } = await import('@/lib/stripe/client');
      const key = getStripePublishableKey();

      expect(key).toBe('pk_test_valid_publishable_key');
    });

    it('should throw error when publishable key is missing', async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      vi.resetModules();
      const { getStripePublishableKey } = await import('@/lib/stripe/client');

      expect(() => getStripePublishableKey()).toThrow(
        'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable'
      );
    });

    it('should throw error when publishable key is empty string', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = '';

      vi.resetModules();
      const { getStripePublishableKey } = await import('@/lib/stripe/client');

      expect(() => getStripePublishableKey()).toThrow(
        'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable'
      );
    });

    it('should return live publishable key in production', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_production_publishable_key';

      vi.resetModules();
      const { getStripePublishableKey } = await import('@/lib/stripe/client');
      const key = getStripePublishableKey();

      expect(key).toBe('pk_live_production_publishable_key');
    });
  });

  describe('API version configuration', () => {
    it('should use the correct API version', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe } = await import('@/lib/stripe/client');
      getStripe();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].options.apiVersion).toBe('2025-12-15.clover');
    });

    it('should enable TypeScript support', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe } = await import('@/lib/stripe/client');
      getStripe();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].options.typescript).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should provide clear error message for missing secret key', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe } = await import('@/lib/stripe/client');

      expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY environment variable');
    });

    it('should provide clear error message for missing publishable key', async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      vi.resetModules();
      const { getStripePublishableKey } = await import('@/lib/stripe/client');

      expect(() => getStripePublishableKey()).toThrow(
        'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable'
      );
    });

    it('should not attempt to create Stripe instance with undefined key', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe } = await import('@/lib/stripe/client');

      try {
        getStripe();
      } catch {
        // Expected to throw
      }

      // Should not have called Stripe constructor
      expect(stripeConstructorCalls).toHaveLength(0);
    });
  });

  describe('module exports', () => {
    it('should export getStripe function', async () => {
      const module = await import('@/lib/stripe/client');
      expect(typeof module.getStripe).toBe('function');
    });

    it('should export stripe object', async () => {
      const module = await import('@/lib/stripe/client');
      expect(typeof module.stripe).toBe('object');
      expect(module.stripe).not.toBeNull();
    });

    it('should export getStripePublishableKey function', async () => {
      const module = await import('@/lib/stripe/client');
      expect(typeof module.getStripePublishableKey).toBe('function');
    });

    it('stripe object should have expected getters', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

      const { stripe } = await import('@/lib/stripe/client');

      // Verify getters exist by checking property descriptors
      const descriptor = Object.getOwnPropertyDescriptor(stripe, 'checkout');
      expect(descriptor?.get).toBeDefined();

      const piDescriptor = Object.getOwnPropertyDescriptor(stripe, 'paymentIntents');
      expect(piDescriptor?.get).toBeDefined();

      const webhooksDescriptor = Object.getOwnPropertyDescriptor(stripe, 'webhooks');
      expect(webhooksDescriptor?.get).toBeDefined();
    });
  });

  describe('singleton reset between test modules', () => {
    it('should create fresh instance after module reset', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_first_key';

      vi.resetModules();
      stripeConstructorCalls = [];
      const { getStripe: getStripe1 } = await import('@/lib/stripe/client');
      getStripe1();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].apiKey).toBe('sk_test_first_key');

      // Reset and import again
      vi.resetModules();
      stripeConstructorCalls = [];
      process.env.STRIPE_SECRET_KEY = 'sk_test_second_key';

      const { getStripe: getStripe2 } = await import('@/lib/stripe/client');
      getStripe2();

      expect(stripeConstructorCalls).toHaveLength(1);
      expect(stripeConstructorCalls[0].apiKey).toBe('sk_test_second_key');
    });
  });
});
