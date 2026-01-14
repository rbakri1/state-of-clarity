/**
 * Credit Service Unit Tests
 *
 * Tests for credit operations: balance checks, deductions, additions, and refunds.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedMockData, clearMockData, getMockData } from '../../mocks/supabase';

// Mock the Supabase client before importing credit-service
vi.mock('@/lib/supabase/client', async () => {
  const { createMockSupabaseClient } = await import('../../mocks/supabase');
  return {
    createServiceRoleClient: () => createMockSupabaseClient(),
    createBrowserClient: () => createMockSupabaseClient(),
    createServerSupabaseClient: async () => createMockSupabaseClient(),
  };
});

// Now import the credit service functions
import {
  getBalance,
  hasCredits,
  deductCredits,
  addCredits,
  refundCredits,
  expireOldCredits,
  getExpiringCreditsWarnings,
  sendExpiryWarningNotifications,
} from '@/lib/services/credit-service';

describe('Credit Service', () => {
  beforeEach(() => {
    clearMockData();
  });

  describe('getBalance', () => {
    it('should return 0 for user with no credits', async () => {
      const balance = await getBalance('user-without-credits');
      expect(balance).toBe(0);
    });

    it('should return correct balance for existing user', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 25 },
      ]);

      const balance = await getBalance('test-user');
      expect(balance).toBe(25);
    });

    it('should return 0 when balance is explicitly 0', async () => {
      seedMockData('user_credits', [
        { user_id: 'zero-balance-user', balance: 0 },
      ]);

      const balance = await getBalance('zero-balance-user');
      expect(balance).toBe(0);
    });
  });

  describe('hasCredits', () => {
    it('should return true when balance equals requested amount', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 5 },
      ]);

      const result = await hasCredits('test-user', 5);
      expect(result).toBe(true);
    });

    it('should return true when balance exceeds requested amount', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 10 },
      ]);

      const result = await hasCredits('test-user', 5);
      expect(result).toBe(true);
    });

    it('should return false when balance is less than requested amount', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 3 },
      ]);

      const result = await hasCredits('test-user', 5);
      expect(result).toBe(false);
    });

    it('should return false for user with no credit record', async () => {
      const result = await hasCredits('new-user', 1);
      expect(result).toBe(false);
    });

    it('should return false for zero balance when requesting any amount', async () => {
      seedMockData('user_credits', [
        { user_id: 'empty-user', balance: 0 },
      ]);

      const result = await hasCredits('empty-user', 1);
      expect(result).toBe(false);
    });
  });

  describe('deductCredits', () => {
    it('should return false for insufficient credits', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 2 },
      ]);

      const result = await deductCredits('test-user', 5, null, 'Test deduction');
      expect(result).toBe(false);
    });

    it('should return false for user with no credits', async () => {
      const result = await deductCredits('new-user', 1, null, 'Test deduction');
      expect(result).toBe(false);
    });

    it('should deduct from single batch successfully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 10 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'test-user',
          credits_remaining: 10,
          purchased_at: new Date().toISOString(),
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await deductCredits('test-user', 3, 'brief-123', 'Brief generation');
      expect(result).toBe(true);

      // Check batch was updated
      const batches = getMockData('credit_batches');
      expect(batches[0].credits_remaining).toBe(7);

      // Check transaction was created
      const transactions = getMockData('credit_transactions');
      expect(transactions.length).toBe(1);
      expect(transactions[0].amount).toBe(-3);
      expect(transactions[0].transaction_type).toBe('usage');
      expect(transactions[0].brief_id).toBe('brief-123');
    });

    it('should deduct from oldest batch first (FIFO)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 15 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-old',
          user_id: 'test-user',
          credits_remaining: 5,
          purchased_at: '2024-01-01T00:00:00Z',
          expires_at: futureDate.toISOString(),
        },
        {
          id: 'batch-new',
          user_id: 'test-user',
          credits_remaining: 10,
          purchased_at: '2024-06-01T00:00:00Z',
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await deductCredits('test-user', 3, null, 'Test');
      expect(result).toBe(true);

      const batches = getMockData('credit_batches');
      const oldBatch = batches.find((b: any) => b.id === 'batch-old');
      const newBatch = batches.find((b: any) => b.id === 'batch-new');

      // Should deduct from older batch
      expect(oldBatch.credits_remaining).toBe(2);
      expect(newBatch.credits_remaining).toBe(10);
    });

    it('should deduct across multiple batches when needed', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 8 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'test-user',
          credits_remaining: 3,
          purchased_at: '2024-01-01T00:00:00Z',
          expires_at: futureDate.toISOString(),
        },
        {
          id: 'batch-2',
          user_id: 'test-user',
          credits_remaining: 5,
          purchased_at: '2024-02-01T00:00:00Z',
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await deductCredits('test-user', 5, null, 'Cross-batch deduction');
      expect(result).toBe(true);

      const batches = getMockData('credit_batches');
      const batch1 = batches.find((b: any) => b.id === 'batch-1');
      const batch2 = batches.find((b: any) => b.id === 'batch-2');

      // First batch should be fully depleted
      expect(batch1.credits_remaining).toBe(0);
      // Remaining 2 deducted from second batch
      expect(batch2.credits_remaining).toBe(3);
    });

    it('should skip expired batches during deduction', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 15 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-expired',
          user_id: 'test-user',
          credits_remaining: 10,
          purchased_at: '2023-01-01T00:00:00Z',
          expires_at: pastDate.toISOString(), // Expired
        },
        {
          id: 'batch-valid',
          user_id: 'test-user',
          credits_remaining: 5,
          purchased_at: '2024-01-01T00:00:00Z',
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await deductCredits('test-user', 3, null, 'Test');
      expect(result).toBe(true);

      const batches = getMockData('credit_batches');
      const expiredBatch = batches.find((b: any) => b.id === 'batch-expired');
      const validBatch = batches.find((b: any) => b.id === 'batch-valid');

      // Expired batch should be unchanged
      expect(expiredBatch.credits_remaining).toBe(10);
      // Valid batch should be deducted
      expect(validBatch.credits_remaining).toBe(2);
    });
  });

  describe('addCredits', () => {
    it('should create new user_credits record for new user', async () => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await addCredits('new-user', 10, 'purchase', 'stripe_123', expiresAt);

      const userCredits = getMockData('user_credits');
      const newUserCredit = userCredits.find((uc: any) => uc.user_id === 'new-user');
      expect(newUserCredit).toBeDefined();
      expect(newUserCredit.balance).toBe(10);
    });

    it('should update existing balance for existing user', async () => {
      seedMockData('user_credits', [
        { user_id: 'existing-user', balance: 5 },
      ]);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await addCredits('existing-user', 10, 'purchase', 'stripe_456', expiresAt);

      const userCredits = getMockData('user_credits');
      const existingUser = userCredits.find((uc: any) => uc.user_id === 'existing-user');
      expect(existingUser.balance).toBe(15);
    });

    it('should create credit batch with expiry', async () => {
      const expiresAt = new Date('2026-06-01T00:00:00Z');

      await addCredits('test-user', 20, 'purchase', null, expiresAt);

      const batches = getMockData('credit_batches');
      expect(batches.length).toBe(1);
      expect(batches[0].user_id).toBe('test-user');
      expect(batches[0].credits_remaining).toBe(20);
      expect(batches[0].expires_at).toBe(expiresAt.toISOString());
    });

    it('should create transaction record for purchase', async () => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await addCredits('test-user', 50, 'purchase', 'stripe_789', expiresAt);

      const transactions = getMockData('credit_transactions');
      expect(transactions.length).toBe(1);
      expect(transactions[0].user_id).toBe('test-user');
      expect(transactions[0].amount).toBe(50);
      expect(transactions[0].transaction_type).toBe('purchase');
      expect(transactions[0].stripe_payment_id).toBe('stripe_789');
      expect(transactions[0].description).toContain('Purchased 50 credits');
    });

    it('should create transaction record for bonus credits', async () => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await addCredits('test-user', 5, 'bonus', null, expiresAt);

      const transactions = getMockData('credit_transactions');
      expect(transactions[0].transaction_type).toBe('bonus');
      expect(transactions[0].description).toContain('bonus');
    });
  });

  describe('refundCredits', () => {
    it('should add credits back to existing user balance', async () => {
      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 5 },
      ]);

      await refundCredits('test-user', 1, 'brief-failed', 'Quality gate failure');

      const userCredits = getMockData('user_credits');
      expect(userCredits[0].balance).toBe(6);
    });

    it('should create user_credits for user without record', async () => {
      await refundCredits('new-user', 1, null, 'API error refund');

      const userCredits = getMockData('user_credits');
      const newUser = userCredits.find((uc: any) => uc.user_id === 'new-user');
      expect(newUser).toBeDefined();
      expect(newUser.balance).toBe(1);
    });

    it('should create batch with 12-month expiry', async () => {
      await refundCredits('test-user', 1, 'brief-123', 'Failed generation');

      const batches = getMockData('credit_batches');
      expect(batches.length).toBe(1);
      expect(batches[0].credits_remaining).toBe(1);

      // Check expiry is approximately 12 months from now
      const expiryDate = new Date(batches[0].expires_at);
      const expectedExpiry = new Date();
      expectedExpiry.setMonth(expectedExpiry.getMonth() + 12);

      // Within 1 day tolerance
      const diffDays = Math.abs((expiryDate.getTime() - expectedExpiry.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeLessThan(1);
    });

    it('should create refund transaction record', async () => {
      await refundCredits('test-user', 1, 'brief-456', 'Score below 6.0');

      const transactions = getMockData('credit_transactions');
      expect(transactions.length).toBe(1);
      expect(transactions[0].user_id).toBe('test-user');
      expect(transactions[0].amount).toBe(1);
      expect(transactions[0].transaction_type).toBe('refund');
      expect(transactions[0].brief_id).toBe('brief-456');
      expect(transactions[0].description).toContain('Refund');
      expect(transactions[0].description).toContain('Score below 6.0');
    });
  });

  describe('expireOldCredits', () => {
    it('should return zeros when no expired batches exist', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      seedMockData('credit_batches', [
        {
          id: 'batch-valid',
          user_id: 'test-user',
          credits_remaining: 10,
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await expireOldCredits();
      expect(result.usersAffected).toBe(0);
      expect(result.creditsExpired).toBe(0);
    });

    it('should expire batches past expiry date', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 10 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-expired',
          user_id: 'test-user',
          credits_remaining: 5,
          expires_at: pastDate.toISOString(),
        },
      ]);

      const result = await expireOldCredits();
      expect(result.usersAffected).toBe(1);
      expect(result.creditsExpired).toBe(5);

      // Check batch was zeroed
      const batches = getMockData('credit_batches');
      expect(batches[0].credits_remaining).toBe(0);

      // Check balance was reduced
      const userCredits = getMockData('user_credits');
      expect(userCredits[0].balance).toBe(5);

      // Check transaction was created
      const transactions = getMockData('credit_transactions');
      expect(transactions.length).toBe(1);
      expect(transactions[0].transaction_type).toBe('expiry');
      expect(transactions[0].amount).toBe(-5);
    });

    it('should handle multiple users with expired credits', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      seedMockData('user_credits', [
        { user_id: 'user-1', balance: 10 },
        { user_id: 'user-2', balance: 20 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'user-1',
          credits_remaining: 3,
          expires_at: pastDate.toISOString(),
        },
        {
          id: 'batch-2',
          user_id: 'user-2',
          credits_remaining: 7,
          expires_at: pastDate.toISOString(),
        },
      ]);

      const result = await expireOldCredits();
      expect(result.usersAffected).toBe(2);
      expect(result.creditsExpired).toBe(10);
    });

    it('should not reduce balance below zero', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      seedMockData('user_credits', [
        { user_id: 'test-user', balance: 3 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-expired',
          user_id: 'test-user',
          credits_remaining: 10, // More than balance
          expires_at: pastDate.toISOString(),
        },
      ]);

      await expireOldCredits();

      const userCredits = getMockData('user_credits');
      expect(userCredits[0].balance).toBe(0); // Should be 0, not negative
    });
  });

  describe('getExpiringCreditsWarnings', () => {
    it('should return empty array when no credits expiring soon', async () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2);

      seedMockData('credit_batches', [
        {
          id: 'batch-far',
          user_id: 'test-user',
          credits_remaining: 10,
          expires_at: farFuture.toISOString(),
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings).toEqual([]);
    });

    it('should return warnings for credits expiring within 30 days', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 15); // 15 days from now

      seedMockData('credit_batches', [
        {
          id: 'batch-soon',
          user_id: 'test-user',
          credits_remaining: 5,
          expires_at: soon.toISOString(),
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings.length).toBe(1);
      expect(warnings[0].userId).toBe('test-user');
      expect(warnings[0].creditsExpiring).toBe(5);
    });

    it('should aggregate multiple expiring batches per user', async () => {
      const soon1 = new Date();
      soon1.setDate(soon1.getDate() + 10);
      const soon2 = new Date();
      soon2.setDate(soon2.getDate() + 20);

      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'test-user',
          credits_remaining: 3,
          expires_at: soon1.toISOString(),
        },
        {
          id: 'batch-2',
          user_id: 'test-user',
          credits_remaining: 7,
          expires_at: soon2.toISOString(),
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings.length).toBe(1);
      expect(warnings[0].creditsExpiring).toBe(10); // 3 + 7
    });

    it('should not include already expired batches', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);

      seedMockData('credit_batches', [
        {
          id: 'batch-expired',
          user_id: 'test-user',
          credits_remaining: 10,
          expires_at: pastDate.toISOString(),
        },
        {
          id: 'batch-soon',
          user_id: 'test-user',
          credits_remaining: 5,
          expires_at: soonDate.toISOString(),
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings.length).toBe(1);
      expect(warnings[0].creditsExpiring).toBe(5); // Only the soon-expiring batch
    });

    it('should use earliest expiry date when user has multiple expiring batches', async () => {
      const soon1 = new Date();
      soon1.setDate(soon1.getDate() + 5); // Expires first
      const soon2 = new Date();
      soon2.setDate(soon2.getDate() + 25); // Expires later

      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'test-user',
          credits_remaining: 3,
          expires_at: soon2.toISOString(), // Later date first in mock
        },
        {
          id: 'batch-2',
          user_id: 'test-user',
          credits_remaining: 7,
          expires_at: soon1.toISOString(), // Earlier date second in mock
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings.length).toBe(1);
      expect(warnings[0].creditsExpiring).toBe(10);
      // Should use the earliest expiry date
      expect(warnings[0].expiresAt.getTime()).toBeLessThanOrEqual(soon1.getTime() + 1000);
    });

    it('should handle batches with zero credits remaining', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 15);

      seedMockData('credit_batches', [
        {
          id: 'batch-empty',
          user_id: 'test-user',
          credits_remaining: 0,
          expires_at: soon.toISOString(),
        },
      ]);

      const warnings = await getExpiringCreditsWarnings();
      expect(warnings).toEqual([]);
    });
  });

  describe('sendExpiryWarningNotifications', () => {
    it('should log warnings for users with expiring credits', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const soon = new Date();
      soon.setDate(soon.getDate() + 10);

      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'user-with-expiring',
          credits_remaining: 15,
          expires_at: soon.toISOString(),
        },
      ]);

      await sendExpiryWarningNotifications();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[NOTIFICATION PLACEHOLDER]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-with-expiring')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('15 credits expiring')
      );

      consoleSpy.mockRestore();
    });

    it('should not log anything when no credits are expiring', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2);

      seedMockData('credit_batches', [
        {
          id: 'batch-far',
          user_id: 'test-user',
          credits_remaining: 10,
          expires_at: farFuture.toISOString(),
        },
      ]);

      await sendExpiryWarningNotifications();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log warnings for multiple users', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const soon = new Date();
      soon.setDate(soon.getDate() + 10);

      seedMockData('credit_batches', [
        {
          id: 'batch-1',
          user_id: 'user-1',
          credits_remaining: 5,
          expires_at: soon.toISOString(),
        },
        {
          id: 'batch-2',
          user_id: 'user-2',
          credits_remaining: 10,
          expires_at: soon.toISOString(),
        },
      ]);

      await sendExpiryWarningNotifications();

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user-2')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deduction when balance exactly matches amount', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      seedMockData('user_credits', [
        { user_id: 'exact-user', balance: 5 },
      ]);
      seedMockData('credit_batches', [
        {
          id: 'batch-exact',
          user_id: 'exact-user',
          credits_remaining: 5,
          purchased_at: new Date().toISOString(),
          expires_at: futureDate.toISOString(),
        },
      ]);

      const result = await deductCredits('exact-user', 5, 'brief-1', 'Exact deduction');
      expect(result).toBe(true);

      const batches = getMockData('credit_batches');
      expect(batches[0].credits_remaining).toBe(0);

      const userCredits = getMockData('user_credits');
      expect(userCredits[0].balance).toBe(0);
    });

    it('should handle hasCredits with amount of 0', async () => {
      seedMockData('user_credits', [
        { user_id: 'any-user', balance: 10 },
      ]);

      const result = await hasCredits('any-user', 0);
      expect(result).toBe(true);
    });

    it('should handle getBalance for user with null balance in record', async () => {
      seedMockData('user_credits', [
        { user_id: 'null-balance-user', balance: null },
      ]);

      const balance = await getBalance('null-balance-user');
      // null should be treated as 0
      expect(balance).toBe(0);
    });
  });
});
