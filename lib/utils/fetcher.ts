import { retryWithBackoff, RetryOptions } from './retry';

export interface FetchWithRetryOptions extends Omit<RetryOptions, 'shouldRetry'> {
  retryOn5xx?: boolean;
  retryOnNetworkError?: boolean;
}

const DEFAULT_FETCH_OPTIONS: Required<Pick<FetchWithRetryOptions, 'retryOn5xx' | 'retryOnNetworkError'>> = {
  retryOn5xx: true,
  retryOnNetworkError: true,
};

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'));
}

function is5xxResponse(response: Response): boolean {
  return response.status >= 500 && response.status < 600;
}

function is4xxResponse(response: Response): boolean {
  return response.status >= 400 && response.status < 500;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: Response
  ) {
    super(message);
    this.name = 'FetchError';
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    retryOn5xx = DEFAULT_FETCH_OPTIONS.retryOn5xx,
    retryOnNetworkError = DEFAULT_FETCH_OPTIONS.retryOnNetworkError,
    ...fetchOptions
  } = options;

  const retryOptions: RetryOptions = {
    maxRetries,
    initialDelay,
    maxDelay,
    shouldRetry: (error: unknown) => {
      if (isNetworkError(error)) {
        if (retryOnNetworkError) {
          console.log(`Network error, will retry: ${(error as Error).message}`);
          return true;
        }
        return false;
      }
      
      if (error instanceof FetchError) {
        if (is5xxResponse(error.response) && retryOn5xx) {
          console.log(`Server error (${error.status}), will retry`);
          return true;
        }
        if (is4xxResponse(error.response)) {
          return false;
        }
      }
      
      return false;
    },
  };

  return retryWithBackoff(async () => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new FetchError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response
      );
    }
    
    return response;
  }, retryOptions);
}
