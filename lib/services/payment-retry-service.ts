/**
 * Payment Retry Service
 * 
 * Handles auto-retry logic for failed payments.
 * Retry schedule: 1 hour, 6 hours, 24 hours (3 attempts max)
 */

import { createServiceRoleClient, type Database, type PaymentRetryStatus } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "../stripe/client";
import { safeStripeCall } from "../stripe/safe-stripe-call";
import * as Sentry from "@sentry/nextjs";

type PaymentRetry = Database["public"]["Tables"]["payment_retries"]["Row"];
type PaymentRetryInsert = Database["public"]["Tables"]["payment_retries"]["Insert"];

const RETRY_DELAYS_MS = [
  1 * 60 * 60 * 1000,      // 1 hour
  6 * 60 * 60 * 1000,      // 6 hours
  24 * 60 * 60 * 1000,     // 24 hours
];
const MAX_ATTEMPTS = 3;

function getClient(): SupabaseClient<Database> {
  return createServiceRoleClient();
}

async function insertPaymentRetry(retry: PaymentRetryInsert): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("payment_retries")
    .insert(retry);
  if (error) throw new Error(`Failed to create payment retry: ${error.message}`);
}

async function updatePaymentRetry(
  id: string,
  updates: {
    attempts?: number;
    last_attempt_at?: string;
    next_retry_at?: string | null;
    status?: PaymentRetryStatus;
    error_message?: string | null;
  }
): Promise<void> {
  const supabase = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("payment_retries")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(`Failed to update payment retry: ${error.message}`);
}

/**
 * Create a payment retry record for a failed payment
 */
export async function createPaymentRetry(
  userId: string,
  stripePaymentIntentId: string,
  packageId: string | null,
  errorMessage: string | null
): Promise<void> {
  const now = new Date();
  const nextRetryAt = new Date(now.getTime() + RETRY_DELAYS_MS[0]);

  await insertPaymentRetry({
    user_id: userId,
    stripe_payment_intent_id: stripePaymentIntentId,
    attempts: 0,
    last_attempt_at: now.toISOString(),
    next_retry_at: nextRetryAt.toISOString(),
    status: "pending",
    package_id: packageId,
    error_message: errorMessage,
  });

  console.log(
    `[PAYMENT RETRY] Created retry for user ${userId}, payment intent ${stripePaymentIntentId}. ` +
    `Next retry at ${nextRetryAt.toISOString()}`
  );
}

/**
 * Get payment retry by stripe payment intent ID
 */
export async function getPaymentRetryByPaymentIntent(
  stripePaymentIntentId: string
): Promise<PaymentRetry | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("payment_retries")
    .select("*")
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment retry: ${error.message}`);
  }

  return data as PaymentRetry | null;
}

/**
 * Get all pending retries that are due
 */
export async function getPendingRetries(): Promise<PaymentRetry[]> {
  const supabase = getClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payment_retries")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", now)
    .order("next_retry_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pending retries: ${error.message}`);
  }

  return (data as PaymentRetry[] | null) ?? [];
}

/**
 * Process a single retry attempt
 */
export async function processRetry(retry: PaymentRetry): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe();
  const now = new Date();
  const attemptNumber = retry.attempts + 1;

  try {
    await updatePaymentRetry(retry.id, {
      status: "retrying",
      attempts: attemptNumber,
      last_attempt_at: now.toISOString(),
    });

    const { data: paymentIntent, error: stripeError, isStripeServiceError } = await safeStripeCall(
      () => stripe.paymentIntents.confirm(retry.stripe_payment_intent_id),
      {
        operation: "payment_intent_confirm",
        userId: retry.user_id,
        paymentIntentId: retry.stripe_payment_intent_id,
      }
    );

    if (stripeError) {
      if (isStripeServiceError) {
        Sentry.captureMessage("Stripe service unavailable during payment retry", {
          level: "warning",
          tags: { component: "payment-retry" },
          extra: { paymentIntentId: retry.stripe_payment_intent_id, attemptNumber },
        });
      }
      throw stripeError;
    }

    if (paymentIntent?.status === "succeeded") {
      await updatePaymentRetry(retry.id, {
        status: "succeeded",
        next_retry_at: null,
        error_message: null,
      });

      console.log(
        `[PAYMENT RETRY] Retry succeeded for payment intent ${retry.stripe_payment_intent_id} on attempt ${attemptNumber}`
      );

      return { success: true };
    }

    throw new Error(`Payment intent status: ${paymentIntent?.status}`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    if (attemptNumber >= MAX_ATTEMPTS) {
      await updatePaymentRetry(retry.id, {
        status: "failed",
        next_retry_at: null,
        error_message: errorMessage,
      });

      console.log(
        `[PAYMENT RETRY FAILED] All ${MAX_ATTEMPTS} attempts exhausted for payment intent ${retry.stripe_payment_intent_id}. ` +
        `User ${retry.user_id} should be notified.`
      );

      await sendPaymentFailureNotification(retry.user_id, retry.stripe_payment_intent_id);

      return { success: false, error: errorMessage };
    }

    const nextRetryAt = new Date(now.getTime() + RETRY_DELAYS_MS[attemptNumber]);

    await updatePaymentRetry(retry.id, {
      status: "pending",
      next_retry_at: nextRetryAt.toISOString(),
      error_message: errorMessage,
    });

    console.log(
      `[PAYMENT RETRY] Attempt ${attemptNumber} failed for payment intent ${retry.stripe_payment_intent_id}. ` +
      `Next retry at ${nextRetryAt.toISOString()}`
    );

    return { success: false, error: errorMessage };
  }
}

/**
 * Process all pending retries
 * This should be called periodically (e.g., via cron job every 15 minutes)
 */
export async function processAllPendingRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  pending: number;
}> {
  const pendingRetries = await getPendingRetries();

  let succeeded = 0;
  let failed = 0;
  let pending = 0;

  for (const retry of pendingRetries) {
    const result = await processRetry(retry);

    if (result.success) {
      succeeded++;
    } else {
      const updatedRetry = await getPaymentRetryByPaymentIntent(retry.stripe_payment_intent_id);
      if (updatedRetry?.status === "failed") {
        failed++;
      } else {
        pending++;
      }
    }
  }

  return {
    processed: pendingRetries.length,
    succeeded,
    failed,
    pending,
  };
}

/**
 * Handle payment failure (called from webhook)
 * Creates or updates retry record
 */
export async function handlePaymentFailure(
  userId: string,
  stripePaymentIntentId: string,
  packageId: string | null,
  errorMessage: string | null
): Promise<void> {
  const existingRetry = await getPaymentRetryByPaymentIntent(stripePaymentIntentId);

  if (existingRetry) {
    const attemptNumber = existingRetry.attempts + 1;
    const now = new Date();

    if (attemptNumber >= MAX_ATTEMPTS) {
      await updatePaymentRetry(existingRetry.id, {
        attempts: attemptNumber,
        last_attempt_at: now.toISOString(),
        status: "failed",
        next_retry_at: null,
        error_message: errorMessage,
      });

      console.log(
        `[PAYMENT RETRY FAILED] All ${MAX_ATTEMPTS} attempts exhausted for payment intent ${stripePaymentIntentId}. ` +
        `User ${userId} should be notified.`
      );

      await sendPaymentFailureNotification(userId, stripePaymentIntentId);
    } else {
      const nextRetryAt = new Date(now.getTime() + RETRY_DELAYS_MS[attemptNumber]);

      await updatePaymentRetry(existingRetry.id, {
        attempts: attemptNumber,
        last_attempt_at: now.toISOString(),
        next_retry_at: nextRetryAt.toISOString(),
        error_message: errorMessage,
      });

      console.log(
        `[PAYMENT RETRY] Updated retry record. Attempt ${attemptNumber}, next retry at ${nextRetryAt.toISOString()}`
      );
    }
  } else {
    await createPaymentRetry(userId, stripePaymentIntentId, packageId, errorMessage);
  }
}

/**
 * Send payment failure notification (placeholder)
 * TODO: Integrate with actual notification system (email, in-app, etc.)
 */
async function sendPaymentFailureNotification(
  userId: string,
  stripePaymentIntentId: string
): Promise<void> {
  console.log(
    `[NOTIFICATION PLACEHOLDER] User ${userId}: Payment failed after ${MAX_ATTEMPTS} attempts. ` +
    `Payment Intent: ${stripePaymentIntentId}. Please update your payment method.`
  );
}

/**
 * Mark a retry as succeeded (e.g., if payment succeeds through manual intervention)
 */
export async function markRetrySucceeded(stripePaymentIntentId: string): Promise<void> {
  const retry = await getPaymentRetryByPaymentIntent(stripePaymentIntentId);

  if (retry && retry.status !== "succeeded") {
    await updatePaymentRetry(retry.id, {
      status: "succeeded",
      next_retry_at: null,
      error_message: null,
    });

    console.log(`[PAYMENT RETRY] Marked as succeeded: ${stripePaymentIntentId}`);
  }
}

/**
 * Get retry status for a user (for display in UI)
 */
export async function getUserPendingRetries(userId: string): Promise<PaymentRetry[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("payment_retries")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "retrying"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user retries: ${error.message}`);
  }

  return (data as PaymentRetry[] | null) ?? [];
}
