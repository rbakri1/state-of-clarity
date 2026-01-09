/**
 * Retry Wrapper for Agent Execution
 *
 * Provides exponential backoff retry logic for agent functions
 * to handle transient API errors without breaking brief generation.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  agentName: string;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  attempts: number;
  errors: Error[];
}

const DEFAULT_CONFIG: Omit<RetryConfig, 'agentName'> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an agent function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (agentName is required)
 * @returns Promise with the function result or throws after max retries
 *
 * @example
 * const result = await withRetry(
 *   () => researchAgent(question),
 *   { agentName: 'Research Agent' }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> & { agentName: string }
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier, agentName } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const errors: Error[] = [];
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${agentName}] Attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      
      if (attempt > 1) {
        console.log(`[${agentName}] Succeeded on attempt ${attempt} after ${attempt - 1} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      errors.push(lastError);

      console.error(`[${agentName}] Attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        errorName: lastError.name,
        stack: lastError.stack?.split('\n').slice(0, 3).join('\n'),
      });

      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`[${agentName}] Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  const aggregatedError = new AgentRetryError(
    `${agentName} failed after ${maxRetries} attempts`,
    errors,
    agentName
  );

  console.error(`[${agentName}] All ${maxRetries} attempts failed:`, {
    agentName,
    totalAttempts: maxRetries,
    errors: errors.map(e => e.message),
  });

  throw aggregatedError;
}

/**
 * Custom error class for agent retry failures
 */
export class AgentRetryError extends Error {
  public readonly errors: Error[];
  public readonly agentName: string;
  public readonly attempts: number;

  constructor(message: string, errors: Error[], agentName: string) {
    super(message);
    this.name = 'AgentRetryError';
    this.errors = errors;
    this.agentName = agentName;
    this.attempts = errors.length;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentRetryError);
    }
  }

  getLastError(): Error | undefined {
    return this.errors[this.errors.length - 1];
  }
}

/**
 * Create a wrapped version of an agent function with built-in retry logic
 *
 * @param agentName - Name of the agent for logging
 * @param fn - The original agent function
 * @param customConfig - Optional custom retry configuration
 * @returns A new function with retry logic built in
 *
 * @example
 * const researchAgentWithRetry = wrapWithRetry(
 *   'Research Agent',
 *   researchAgent
 * );
 */
export function wrapWithRetry<TArgs extends unknown[], TResult>(
  agentName: string,
  fn: (...args: TArgs) => Promise<TResult>,
  customConfig?: Partial<Omit<RetryConfig, 'agentName'>>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return withRetry(
      () => fn(...args),
      { agentName, ...customConfig }
    );
  };
}

/**
 * Check if an error is retryable (transient vs permanent)
 * 
 * This can be used to implement smarter retry logic that doesn't
 * retry on permanent failures like 401 Unauthorized.
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  const transientIndicators = [
    'timeout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'network error',
    'rate limit',
    '429',
    '500',
    '502',
    '503',
    '504',
    'overloaded',
    'temporarily unavailable',
  ];

  const permanentIndicators = [
    '401',
    'unauthorized',
    '403',
    'forbidden',
    '404',
    'not found',
    'invalid api key',
    'invalid_api_key',
  ];

  if (permanentIndicators.some(indicator => message.includes(indicator))) {
    return false;
  }

  if (transientIndicators.some(indicator => message.includes(indicator))) {
    return true;
  }

  return true;
}

/**
 * Execute with retry, but only retry on transient errors
 */
export async function withSmartRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> & { agentName: string }
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier, agentName } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const errors: Error[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${agentName}] Attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      
      if (attempt > 1) {
        console.log(`[${agentName}] Succeeded on attempt ${attempt} after ${attempt - 1} retries`);
      }
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);

      console.error(`[${agentName}] Attempt ${attempt}/${maxRetries} failed:`, {
        error: err.message,
        retryable: isRetryableError(err),
      });

      if (!isRetryableError(err)) {
        console.error(`[${agentName}] Error is not retryable, failing immediately`);
        throw new AgentRetryError(
          `${agentName} failed with non-retryable error: ${err.message}`,
          errors,
          agentName
        );
      }

      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`[${agentName}] Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  throw new AgentRetryError(
    `${agentName} failed after ${maxRetries} attempts`,
    errors,
    agentName
  );
}
