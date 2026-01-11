/**
 * Safe AI Call Wrapper
 * 
 * Provides utilities for wrapping AI API calls with:
 * - Retry logic with exponential backoff (3 attempts)
 * - Sentry logging with sanitized prompt context
 * - Graceful error messages
 */

import * as Sentry from "@sentry/nextjs";

export interface SafeAICallResult<T> {
  data: T | null;
  error: Error | null;
  isAIServiceError: boolean;
}

export interface SafeAICallOptions {
  operationName: string;
  model?: string;
  promptSummary?: string; // Sanitized summary of prompt (no user PII)
  userId?: string;
  briefId?: string;
  additionalContext?: Record<string, unknown>;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

const AI_SERVICE_ERROR_INDICATORS = [
  "overloaded",
  "rate limit",
  "rate_limit",
  "429",
  "500",
  "502",
  "503",
  "504",
  "timeout",
  "econnreset",
  "econnrefused",
  "socket hang up",
  "network error",
  "temporarily unavailable",
  "service unavailable",
  "internal server error",
];

const NON_RETRYABLE_INDICATORS = [
  "401",
  "unauthorized",
  "403",
  "forbidden",
  "invalid api key",
  "invalid_api_key",
  "authentication",
];

function isAIServiceError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return AI_SERVICE_ERROR_INDICATORS.some(indicator => 
    message.includes(indicator)
  );
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry auth errors
  if (NON_RETRYABLE_INDICATORS.some(indicator => message.includes(indicator))) {
    return false;
  }
  
  // Retry on transient errors
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sanitize prompt content before logging to Sentry
 * Removes potentially sensitive user data while keeping context
 */
function sanitizePromptForLogging(prompt: string | undefined): string {
  if (!prompt) return "[no prompt]";
  
  // Truncate long prompts
  const maxLength = 200;
  let sanitized = prompt.length > maxLength 
    ? prompt.substring(0, maxLength) + "..." 
    : prompt;
  
  // Replace potential email patterns
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[email]");
  
  // Replace potential phone patterns
  sanitized = sanitized.replace(/\+?\d{10,}/g, "[phone]");
  
  return sanitized;
}

/**
 * Execute an AI API call safely with retry logic and Sentry logging
 */
export async function safeAICall<T>(
  callFn: () => Promise<T>,
  options: SafeAICallOptions,
  retryOptions: RetryOptions = {}
): Promise<SafeAICallResult<T>> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
  };

  const errors: Error[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${options.operationName}] Attempt ${attempt}/${maxRetries}`);
      const result = await callFn();
      
      if (attempt > 1) {
        console.log(`[${options.operationName}] Succeeded on attempt ${attempt} after ${attempt - 1} retries`);
      }
      
      return {
        data: result,
        error: null,
        isAIServiceError: false,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errors.push(error);

      console.error(`[${options.operationName}] Attempt ${attempt}/${maxRetries} failed:`, {
        error: error.message,
        retryable: isRetryableError(error),
      });

      // Log to Sentry on each failure for visibility
      if (attempt === maxRetries) {
        Sentry.captureException(error, {
          tags: {
            component: "ai-service",
            operationName: options.operationName,
            model: options.model || "unknown",
            isAIServiceError: isAIServiceError(error),
            attempts: attempt,
          },
          extra: {
            promptSummary: sanitizePromptForLogging(options.promptSummary),
            userId: options.userId,
            briefId: options.briefId,
            allErrors: errors.map(e => e.message),
            ...options.additionalContext,
          },
        });
      }

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        console.error(`[${options.operationName}] Error is not retryable, failing immediately`);
        return {
          data: null,
          error: new Error("AI service temporarily unavailable"),
          isAIServiceError: true,
        };
      }

      // Wait before retrying (unless this was the last attempt)
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
        // Add jitter (±20%)
        const jitter = delayMs * 0.2 * (Math.random() - 0.5);
        const finalDelay = Math.round(delayMs + jitter);
        console.log(`[${options.operationName}] Retrying in ${finalDelay}ms...`);
        await sleep(finalDelay);
      }
    }
  }

  // All retries exhausted
  console.error(`[${options.operationName}] All ${maxRetries} attempts failed`);
  
  return {
    data: null,
    error: new Error("AI service temporarily unavailable"),
    isAIServiceError: true,
  };
}

/**
 * Create a wrapped version of an AI call function with built-in retry and error handling
 */
export function wrapAICall<TArgs extends unknown[], TResult>(
  operationName: string,
  fn: (...args: TArgs) => Promise<TResult>,
  baseOptions?: Partial<SafeAICallOptions>,
  retryOptions?: RetryOptions
): (...args: TArgs) => Promise<SafeAICallResult<TResult>> {
  return async (...args: TArgs): Promise<SafeAICallResult<TResult>> => {
    return safeAICall(
      () => fn(...args),
      { operationName, ...baseOptions },
      retryOptions
    );
  };
}
