export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
};

function addJitter(delay: number): number {
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options };
  const { shouldRetry } = options;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      const baseDelay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      const delayWithJitter = addJitter(baseDelay);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delayWithJitter)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));
    }
  }
  
  throw lastError;
}
