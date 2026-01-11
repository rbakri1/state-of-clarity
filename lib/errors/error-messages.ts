import { ErrorCode, ErrorCodes } from './api-error';

export interface FriendlyError {
  title: string;
  message: string;
}

const errorMessages: Record<ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN', FriendlyError> = {
  [ErrorCodes.UNAUTHORIZED]: {
    title: 'Access Denied',
    message: 'You need to sign in to access this resource. Please log in and try again.',
  },
  [ErrorCodes.NOT_FOUND]: {
    title: 'Not Found',
    message: "We couldn't find what you're looking for. It may have been moved or deleted.",
  },
  [ErrorCodes.VALIDATION_ERROR]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again. Some fields may be missing or incorrect.',
  },
  [ErrorCodes.RATE_LIMITED]: {
    title: 'Too Many Requests',
    message: "You've made too many requests. Please wait a moment and try again.",
  },
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    title: 'Service Unavailable',
    message: "We're experiencing technical difficulties. Please try again in a few minutes.",
  },
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
  },
  UNKNOWN: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  },
};

export function getFriendlyError(code: string | undefined | null): FriendlyError {
  if (!code) {
    return errorMessages.UNKNOWN;
  }
  
  if (code in errorMessages) {
    return errorMessages[code as keyof typeof errorMessages];
  }
  
  return errorMessages.UNKNOWN;
}

export function getErrorByStatusCode(statusCode: number): FriendlyError {
  switch (statusCode) {
    case 401:
    case 403:
      return errorMessages[ErrorCodes.UNAUTHORIZED];
    case 404:
      return errorMessages[ErrorCodes.NOT_FOUND];
    case 400:
    case 422:
      return errorMessages[ErrorCodes.VALIDATION_ERROR];
    case 429:
      return errorMessages[ErrorCodes.RATE_LIMITED];
    case 500:
    case 502:
    case 503:
    case 504:
      return errorMessages[ErrorCodes.SERVICE_UNAVAILABLE];
    default:
      return errorMessages.UNKNOWN;
  }
}
