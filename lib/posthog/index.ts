/**
 * PostHog Analytics Module
 *
 * Re-exports all PostHog functionality for easy imports.
 *
 * Usage:
 *   // Client-side event tracking
 *   import { trackBriefViewed, identifyUser } from '@/lib/posthog';
 *
 *   // Server-side analytics queries
 *   import { getAnalyticsSummary, getRecentEvents } from '@/lib/posthog/api';
 */

// Client-side event tracking
export * from "./events";

// Note: API functions should be imported directly from './api'
// to ensure they only run server-side
