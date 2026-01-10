/**
 * Credit Service
 * 
 * Manages credit operations: balance checks, deductions, additions, and refunds.
 * All operations create transaction records for audit purposes.
 */

import { createServiceRoleClient, type Database, type CreditTransactionType } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserCredits = Database["public"]["Tables"]["user_credits"]["Row"];
type CreditBatch = Database["public"]["Tables"]["credit_batches"]["Row"];
type CreditTransactionInsert = Database["public"]["Tables"]["credit_transactions"]["Insert"];

function getClient(): SupabaseClient<Database> {
  return createServiceRoleClient();
}

async function updateCreditBatch(id: string, creditsRemaining: number): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("credit_batches")
    .update({ credits_remaining: creditsRemaining })
    .eq("id", id);
  if (error) throw new Error(`Failed to update batch: ${error.message}`);
}

async function updateUserCredits(userId: string, newBalance: number): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_credits")
    .update({ balance: newBalance })
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to update balance: ${error.message}`);
}

async function insertCreditTransaction(tx: CreditTransactionInsert): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("credit_transactions")
    .insert(tx);
  if (error) throw new Error(`Failed to record transaction: ${error.message}`);
}

async function insertCreditBatch(batch: { user_id: string; credits_remaining: number; expires_at: string }): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("credit_batches")
    .insert(batch);
  if (error) throw new Error(`Failed to create batch: ${error.message}`);
}

async function insertUserCredits(userId: string, balance: number): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_credits")
    .insert({ user_id: userId, balance });
  if (error) throw new Error(`Failed to create balance: ${error.message}`);
}

/**
 * Get the credit balance for a user
 */
export async function getBalance(userId: string): Promise<number> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) {
    throw new Error(`Failed to get balance: ${error.message}`);
  }
  
  return (data as Pick<UserCredits, "balance"> | null)?.balance ?? 0;
}

/**
 * Check if user has sufficient credits
 */
export async function hasCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= amount;
}

/**
 * Deduct credits from user account (FIFO from oldest non-expired batches)
 * Returns true if deduction was successful, false if insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  briefId: string | null,
  description: string
): Promise<boolean> {
  const supabase = getClient();
  
  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    return false;
  }

  const now = new Date().toISOString();
  
  const { data, error: batchError } = await supabase
    .from("credit_batches")
    .select("id, credits_remaining")
    .eq("user_id", userId)
    .gt("credits_remaining", 0)
    .gt("expires_at", now)
    .order("purchased_at", { ascending: true });

  if (batchError) {
    throw new Error(`Failed to fetch batches: ${batchError.message}`);
  }

  const batches = data as Pick<CreditBatch, "id" | "credits_remaining">[] | null;

  let remaining = amount;
  for (const batch of batches ?? []) {
    if (remaining <= 0) break;

    const deductFromBatch = Math.min(batch.credits_remaining, remaining);
    const newRemaining = batch.credits_remaining - deductFromBatch;

    await updateCreditBatch(batch.id, newRemaining);

    remaining -= deductFromBatch;
  }

  await updateUserCredits(userId, currentBalance - amount);

  await insertCreditTransaction({
    user_id: userId,
    amount: -amount,
    transaction_type: "usage",
    description,
    brief_id: briefId,
  });

  return true;
}

/**
 * Add credits to user account (creates batch with expiry)
 */
export async function addCredits(
  userId: string,
  amount: number,
  transactionType: CreditTransactionType,
  stripePaymentId: string | null,
  expiresAt: Date
): Promise<void> {
  const supabase = getClient();
  const now = new Date().toISOString();

  const { data, error: fetchError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch balance: ${fetchError.message}`);
  }

  const existing = data as Pick<UserCredits, "balance"> | null;

  if (existing) {
    await updateUserCredits(userId, existing.balance + amount);
  } else {
    await insertUserCredits(userId, amount);
  }

  await insertCreditBatch({
    user_id: userId,
    credits_remaining: amount,
    expires_at: expiresAt.toISOString(),
  });

  await insertCreditTransaction({
    user_id: userId,
    amount: amount,
    transaction_type: transactionType,
    description: transactionType === "purchase" 
      ? `Purchased ${amount} credits`
      : `Added ${amount} credits (${transactionType})`,
    stripe_payment_id: stripePaymentId,
  });
}

/**
 * Refund credits to user account (for failed brief generation)
 */
export async function refundCredits(
  userId: string,
  amount: number,
  briefId: string | null,
  reason: string
): Promise<void> {
  const supabase = getClient();
  const now = new Date().toISOString();

  const { data, error: fetchError } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch balance: ${fetchError.message}`);
  }

  const existing = data as Pick<UserCredits, "balance"> | null;
  const currentBalance = existing?.balance ?? 0;

  if (existing) {
    await updateUserCredits(userId, currentBalance + amount);
  } else {
    await insertUserCredits(userId, amount);
  }

  const twelveMonthsFromNow = new Date();
  twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);

  await insertCreditBatch({
    user_id: userId,
    credits_remaining: amount,
    expires_at: twelveMonthsFromNow.toISOString(),
  });

  await insertCreditTransaction({
    user_id: userId,
    amount: amount,
    transaction_type: "refund",
    description: `Refund: ${reason}`,
    brief_id: briefId,
  });
}
