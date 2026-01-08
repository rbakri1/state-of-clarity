/**
 * Authentication Middleware for API Routes
 *
 * Usage in API routes:
 *
 * import { withAuth } from "@/lib/auth/middleware";
 *
 * export const GET = withAuth(async (req, { user }) => {
 *   // user is guaranteed to exist here
 *   return Response.json({ userId: user.id });
 * });
 */

import { createServerSupabaseClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export type AuthenticatedHandler = (
  req: NextRequest,
  context: {
    user: {
      id: string;
      email?: string;
      role?: string;
    };
    params?: any;
  }
) => Promise<Response>;

/**
 * Wrap API routes to require authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to access this resource",
        },
        { status: 401 }
      );
    }

    // Call the actual handler with user context
    return handler(req, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      params: context?.params,
    });
  };
}

/**
 * Optional authentication (user may or may not be logged in)
 */
export type OptionalAuthHandler = (
  req: NextRequest,
  context: {
    user: {
      id: string;
      email?: string;
      role?: string;
    } | null;
    params?: any;
  }
) => Promise<Response>;

export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (req: NextRequest, context?: any) => {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return handler(req, {
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        : null,
      params: context?.params,
    });
  };
}

/**
 * Rate limiting middleware
 *
 * Simple in-memory rate limiter (for production, use Redis)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  requests: number; // Number of requests allowed
  window: number; // Time window in seconds
}

export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  config: RateLimitConfig = { requests: 10, window: 60 }
) {
  return async (req: NextRequest, context?: any) => {
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const windowMs = config.window * 1000;

    let rateLimitInfo = rateLimitMap.get(identifier);

    // Reset if window expired
    if (!rateLimitInfo || now > rateLimitInfo.resetAt) {
      rateLimitInfo = {
        count: 0,
        resetAt: now + windowMs,
      };
      rateLimitMap.set(identifier, rateLimitInfo);
    }

    // Check limit
    if (rateLimitInfo.count >= config.requests) {
      const retryAfter = Math.ceil((rateLimitInfo.resetAt - now) / 1000);

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.requests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitInfo.resetAt).toISOString(),
          },
        }
      );
    }

    // Increment counter
    rateLimitInfo.count++;

    const response = await handler(req, context);

    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Limit", config.requests.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      (config.requests - rateLimitInfo.count).toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitInfo.resetAt).toISOString()
    );

    return response;
  };
}

/**
 * Combine multiple middleware
 *
 * Example:
 * export const GET = compose(
 *   withRateLimit,
 *   withAuth,
 *   async (req, { user }) => { ... }
 * );
 */
export function compose(...middlewares: any[]) {
  return middlewares.reduce((acc, middleware) => middleware(acc));
}
