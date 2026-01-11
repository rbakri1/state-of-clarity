import { retryWithBackoff, RetryOptions } from './retry';

export interface FetchWithRetryOptions extends RequestInit {
  retry?: RetryOptions;
}

export class FetchError extends Error {
  status: number;
  statusText: string;
  
  constructor(status: number, statusText: string, message?: string) {
    super(message || `HTTP ${status}: ${statusText}`);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

function shouldRetryFetch(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  
  if (error instanceof FetchError) {
    return isRetryableStatus(error.status);
  }
  
  return false;
}

export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<{ response: Response; data: T }> {
  const { retry: retryOptions, ...fetchOptions } = options;
  
  const executeRequest = async (): Promise<{ response: Response; data: T }> => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const error = new FetchError(
        response.status,
        response.statusText,
        `Request failed: ${response.status} ${response.statusText}`
      );
      
      if (!isRetryableStatus(response.status)) {
        throw error;
      }
      
      console.log(`Retryable error: ${response.status} ${response.statusText}`);
      throw error;
    }
    
    const data = await response.json() as T;
    return { response, data };
  };
  
  return retryWithBackoff(executeRequest, {
    ...retryOptions,
    shouldRetry: shouldRetryFetch,
  });
}
