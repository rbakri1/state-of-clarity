import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ApiError, formatErrorResponse, ErrorCodes } from './api-error';

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        Sentry.captureException(error, {
          level: error.statusCode >= 500 ? 'error' : 'warning',
          extra: {
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
            path: request.nextUrl.pathname,
            method: request.method,
          },
        });

        return NextResponse.json(
          formatErrorResponse(error),
          { status: error.statusCode }
        );
      }

      const unexpectedError = error instanceof Error ? error : new Error(String(error));
      
      Sentry.captureException(unexpectedError, {
        level: 'error',
        extra: {
          path: request.nextUrl.pathname,
          method: request.method,
        },
      });

      const serviceError = ApiError.serviceUnavailable(
        'An unexpected error occurred. Please try again later.'
      );

      return NextResponse.json(
        formatErrorResponse(serviceError),
        { status: serviceError.statusCode }
      );
    }
  };
}
