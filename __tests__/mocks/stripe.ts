/**
 * Stripe Mock
 *
 * Provides mock Stripe API for testing payment flows.
 */

import { vi } from 'vitest';

// Mock payment intent
export interface MockPaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  metadata: Record<string, string>;
  created: number;
}

// Mock checkout session
export interface MockCheckoutSession {
  id: string;
  object: 'checkout.session';
  mode: 'payment' | 'subscription';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  url: string;
  success_url: string;
  cancel_url: string;
  metadata: Record<string, string>;
  customer: string | null;
  amount_total: number;
  currency: string;
}

// Default mock data
let mockPaymentIntents: Map<string, MockPaymentIntent> = new Map();
let mockCheckoutSessions: Map<string, MockCheckoutSession> = new Map();

// Create mock payment intent
function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}): MockPaymentIntent {
  const id = `pi_test_${Date.now()}`;
  const intent: MockPaymentIntent = {
    id,
    object: 'payment_intent',
    amount: params.amount,
    currency: params.currency || 'gbp',
    status: 'requires_payment_method',
    client_secret: `${id}_secret_test`,
    metadata: params.metadata || {},
    created: Math.floor(Date.now() / 1000),
  };
  mockPaymentIntents.set(id, intent);
  return intent;
}

// Create mock checkout session
function createCheckoutSession(params: {
  mode?: 'payment' | 'subscription';
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
  line_items?: Array<{ price: string; quantity: number }>;
}): MockCheckoutSession {
  const id = `cs_test_${Date.now()}`;
  const session: MockCheckoutSession = {
    id,
    object: 'checkout.session',
    mode: params.mode || 'payment',
    payment_status: 'unpaid',
    status: 'open',
    url: `https://checkout.stripe.com/c/pay/${id}`,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    metadata: params.metadata || {},
    customer: null,
    amount_total: 1000, // Default 10.00
    currency: 'gbp',
  };
  mockCheckoutSessions.set(id, session);
  return session;
}

// Mock Stripe API
export const mockStripe = {
  paymentIntents: {
    create: vi.fn().mockImplementation(async (params) => createPaymentIntent(params)),
    retrieve: vi.fn().mockImplementation(async (id: string) => {
      const intent = mockPaymentIntents.get(id);
      if (!intent) throw new Error(`Payment intent ${id} not found`);
      return intent;
    }),
    confirm: vi.fn().mockImplementation(async (id: string) => {
      const intent = mockPaymentIntents.get(id);
      if (!intent) throw new Error(`Payment intent ${id} not found`);
      intent.status = 'succeeded';
      return intent;
    }),
    update: vi.fn().mockImplementation(async (id: string, params: Partial<MockPaymentIntent>) => {
      const intent = mockPaymentIntents.get(id);
      if (!intent) throw new Error(`Payment intent ${id} not found`);
      Object.assign(intent, params);
      return intent;
    }),
    cancel: vi.fn().mockImplementation(async (id: string) => {
      const intent = mockPaymentIntents.get(id);
      if (!intent) throw new Error(`Payment intent ${id} not found`);
      intent.status = 'canceled';
      return intent;
    }),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockImplementation(async (params) => createCheckoutSession(params)),
      retrieve: vi.fn().mockImplementation(async (id: string) => {
        const session = mockCheckoutSessions.get(id);
        if (!session) throw new Error(`Checkout session ${id} not found`);
        return session;
      }),
      expire: vi.fn().mockImplementation(async (id: string) => {
        const session = mockCheckoutSessions.get(id);
        if (!session) throw new Error(`Checkout session ${id} not found`);
        session.status = 'expired';
        return session;
      }),
    },
  },
  customers: {
    create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
    retrieve: vi.fn().mockResolvedValue({ id: 'cus_test_123', email: 'test@example.com' }),
  },
  balance: {
    retrieve: vi.fn().mockResolvedValue({ available: [{ amount: 10000, currency: 'gbp' }] }),
  },
  webhooks: {
    constructEvent: vi.fn().mockImplementation((body: string | Buffer, _sig: string, _secret: string) => {
      const payload = typeof body === 'string' ? JSON.parse(body) : JSON.parse(body.toString());
      return payload;
    }),
  },
};

// Mock Stripe constructor
export class MockStripeClient {
  paymentIntents = mockStripe.paymentIntents;
  checkout = mockStripe.checkout;
  customers = mockStripe.customers;
  balance = mockStripe.balance;
  webhooks = mockStripe.webhooks;

  constructor(_apiKey: string, _options?: any) {
    // Accept options but ignore them in mock
  }
}

// Helper to set payment intent status
export function setPaymentIntentStatus(id: string, status: MockPaymentIntent['status']) {
  const intent = mockPaymentIntents.get(id);
  if (intent) {
    intent.status = status;
  }
}

// Helper to set checkout session status
export function setCheckoutSessionStatus(id: string, status: MockCheckoutSession['status'], paymentStatus?: MockCheckoutSession['payment_status']) {
  const session = mockCheckoutSessions.get(id);
  if (session) {
    session.status = status;
    if (paymentStatus) session.payment_status = paymentStatus;
  }
}

// Helper to create a webhook event
export function createWebhookEvent(type: string, data: any) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
  };
}

// Helper to clear mock data
export function clearStripeMocks() {
  mockPaymentIntents.clear();
  mockCheckoutSessions.clear();
  mockStripe.paymentIntents.create.mockClear();
  mockStripe.paymentIntents.retrieve.mockClear();
  mockStripe.paymentIntents.confirm.mockClear();
  mockStripe.checkout.sessions.create.mockClear();
  mockStripe.checkout.sessions.retrieve.mockClear();
}

// Export default for vi.mock
export default MockStripeClient;
