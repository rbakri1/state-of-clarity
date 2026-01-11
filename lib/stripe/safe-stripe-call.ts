/**
 * Safe Stripe Call Wrapper
 * 
 * Provides utilities for wrapping Stripe API calls with error handling,
 * Sentry logging, and graceful degradation.
 */

import * as Sentry from "@sentry/nextjs";

export interface SafeStripeCallResult<T> {
  data: T | null;
  error: Error | null;
  isStripeServiceError: boolean;
}

export interface SafeStripeCallOptions {
  operation: string;
  userId?: string;
  packageId?: string;
  paymentIntentId?: string;
  additionalContext?: Record<string, unknown>;
}

const STRIPE_SERVICE_ERROR_TYPES = [
  "StripeConnectionError",
  "StripeAPIError",
  "StripeRateLimitError",
  "StripeIdempotencyError",
];

const STRIPE_SERVICE_ERROR_CODES = [
  "rate_limit",
  "api_error",
  "idempotency_error",
];

function isStripeServiceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as { type?: string; code?: string; message?: string };
  
  if (err.type && STRIPE_SERVICE_ERROR_TYPES.includes(err.type)) {
    return true;
  }
  
  if (err.code && STRIPE_SERVICE_ERROR_CODES.includes(err.code)) {
    return true;
  }
  
  const message = err.message?.toLowerCase() || "";
  return (
    message.includes("connection") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("service unavailable")
  );
}

function sanitizeStripeError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Payment service error";
  }
  
  const err = error as { type?: string; code?: string; message?: string };
  
  // Don't expose raw Stripe errors - return user-friendly messages
  if (err.type === "StripeCardError") {
    return err.message || "Your card was declined. Please try a different payment method.";
  }
  
  if (isStripeServiceError(error)) {
    return "Payment service temporarily unavailable";
  }
  
  // Generic fallback - never expose raw error details
  return "Failed to process payment. Please try again.";
}

/**
 * Execute a Stripe API call safely with error handling and Sentry logging
 */
export async function safeStripeCall<T>(
  stripeFn: () => Promise<T>,
  options: SafeStripeCallOptions
): Promise<SafeStripeCallResult<T>> {
  try {
    const data = await stripeFn();
    
    return {
      data,
      error: null,
      isStripeServiceError: false,
    };
  } catch (err) {
    const serviceError = isStripeServiceError(err);
    const userMessage = sanitizeStripeError(err);
    
    // Log to Sentry with context (but not raw error messages to users)
    Sentry.captureException(err, {
      tags: {
        component: "stripe",
        operation: options.operation,
        isServiceError: serviceError,
      },
      extra: {
        userId: options.userId,
        packageId: options.packageId,
        paymentIntentId: options.paymentIntentId,
        ...options.additionalContext,
      },
    });

    console.error(`[SafeStripeCall] ${options.operation} failed:`, err instanceof Error ? err.message : err);

    return {
      data: null,
      error: new Error(userMessage),
      isStripeServiceError: serviceError,
    };
  }
}

/**
 * Check if Stripe is reachable by making a lightweight API call
 */
export async function checkStripeHealth(): Promise<boolean> {
  try {
    // Dynamically import to avoid build-time issues
    const { getStripe } = await import("./client");
    const stripe = getStripe();
    
    // Use balance.retrieve as a lightweight health check
    await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}
