export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiErrorDetails {
  field?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetails;
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ApiErrorDetails;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode,
    details?: ApiErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static unauthorized(message = 'Unauthorized', details?: ApiErrorDetails): ApiError {
    return new ApiError(401, message, ErrorCodes.UNAUTHORIZED, details);
  }

  static notFound(message = 'Resource not found', details?: ApiErrorDetails): ApiError {
    return new ApiError(404, message, ErrorCodes.NOT_FOUND, details);
  }

  static validationError(message = 'Validation failed', details?: ApiErrorDetails): ApiError {
    return new ApiError(400, message, ErrorCodes.VALIDATION_ERROR, details);
  }

  static rateLimited(message = 'Rate limit exceeded', details?: ApiErrorDetails): ApiError {
    return new ApiError(429, message, ErrorCodes.RATE_LIMITED, details);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', details?: ApiErrorDetails): ApiError {
    return new ApiError(503, message, ErrorCodes.SERVICE_UNAVAILABLE, details);
  }
}

export function formatErrorResponse(error: ApiError): ApiErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}
