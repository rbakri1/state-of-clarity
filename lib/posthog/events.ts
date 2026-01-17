/**
 * PostHog Event Definitions
 *
 * Centralized event tracking for State of Clarity.
 * All events should be defined here for consistency and type safety.
 */

import posthog from "posthog-js";

// ============================================
// Event Names (use these constants everywhere)
// ============================================

export const EVENTS = {
  // Brief Events
  BRIEF_GENERATION_STARTED: "brief_generation_started",
  BRIEF_GENERATION_COMPLETED: "brief_generation_completed",
  BRIEF_GENERATION_FAILED: "brief_generation_failed",
  BRIEF_VIEWED: "brief_viewed",
  BRIEF_SHARED: "brief_shared",
  BRIEF_READING_LEVEL_CHANGED: "brief_reading_level_changed",

  // Search & Discovery
  SEARCH_PERFORMED: "search_performed",
  EXPLORE_PAGE_FILTERED: "explore_page_filtered",

  // User Actions
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",

  // Navigation
  NAV_LINK_CLICKED: "nav_link_clicked",
  CTA_CLICKED: "cta_clicked",

  // Engagement
  SOURCE_LINK_CLICKED: "source_link_clicked",
  CLARITY_SCORE_EXPANDED: "clarity_score_expanded",

  // Errors
  ERROR_OCCURRED: "error_occurred",

  // Investigations
  INVESTIGATION_STARTED: "investigation_started",
  INVESTIGATION_COMPLETED: "investigation_completed",
  INVESTIGATION_VIEWED: "investigation_viewed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ============================================
// Event Property Types
// ============================================

interface BriefGenerationStartedProps {
  question: string;
  questionLength: number;
}

interface BriefGenerationCompletedProps {
  briefId: string;
  question: string;
  clarityScore?: number;
  generationTimeMs: number;
  sourceCount: number;
}

interface BriefGenerationFailedProps {
  question: string;
  errorMessage: string;
  errorCode?: string;
}

interface BriefViewedProps {
  briefId: string;
  source: "direct" | "explore" | "search" | "shared";
}

interface BriefSharedProps {
  briefId: string;
  shareMethod: "copy_link" | "twitter" | "facebook" | "email";
}

interface BriefReadingLevelChangedProps {
  briefId: string;
  fromLevel: number;
  toLevel: number;
}

interface SearchPerformedProps {
  query: string;
  resultCount: number;
}

interface ExplorePageFilteredProps {
  filterType: string;
  filterValue: string;
}

interface NavLinkClickedProps {
  linkName: string;
  linkUrl: string;
  location: "header" | "footer" | "sidebar";
}

interface CTAClickedProps {
  ctaName: string;
  ctaLocation: string;
}

interface SourceLinkClickedProps {
  briefId: string;
  sourceUrl: string;
  sourceIndex: number;
}

interface ErrorOccurredProps {
  errorType: string;
  errorMessage: string;
  componentName?: string;
  url?: string;
}

interface InvestigationStartedProps {
  query: string;
}

interface InvestigationCompletedProps {
  investigationId: string;
  query: string;
  durationMs: number;
}

interface InvestigationViewedProps {
  investigationId: string;
  source: "direct" | "profile" | "search";
}

// ============================================
// Event Tracking Functions
// ============================================

function track(event: EventName, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

// Brief Events
export function trackBriefGenerationStarted(props: BriefGenerationStartedProps) {
  track(EVENTS.BRIEF_GENERATION_STARTED, props);
}

export function trackBriefGenerationCompleted(props: BriefGenerationCompletedProps) {
  track(EVENTS.BRIEF_GENERATION_COMPLETED, props);
}

export function trackBriefGenerationFailed(props: BriefGenerationFailedProps) {
  track(EVENTS.BRIEF_GENERATION_FAILED, props);
}

export function trackBriefViewed(props: BriefViewedProps) {
  track(EVENTS.BRIEF_VIEWED, props);
}

export function trackBriefShared(props: BriefSharedProps) {
  track(EVENTS.BRIEF_SHARED, props);
}

export function trackBriefReadingLevelChanged(props: BriefReadingLevelChangedProps) {
  track(EVENTS.BRIEF_READING_LEVEL_CHANGED, props);
}

// Search & Discovery
export function trackSearchPerformed(props: SearchPerformedProps) {
  track(EVENTS.SEARCH_PERFORMED, props);
}

export function trackExplorePageFiltered(props: ExplorePageFilteredProps) {
  track(EVENTS.EXPLORE_PAGE_FILTERED, props);
}

// User Actions
export function trackUserSignedUp(method: "email" | "google" | "apple") {
  track(EVENTS.USER_SIGNED_UP, { method });
}

export function trackUserSignedIn(method: "email" | "google" | "apple") {
  track(EVENTS.USER_SIGNED_IN, { method });
}

export function trackUserSignedOut() {
  track(EVENTS.USER_SIGNED_OUT);
}

// Navigation
export function trackNavLinkClicked(props: NavLinkClickedProps) {
  track(EVENTS.NAV_LINK_CLICKED, props);
}

export function trackCTAClicked(props: CTAClickedProps) {
  track(EVENTS.CTA_CLICKED, props);
}

// Engagement
export function trackSourceLinkClicked(props: SourceLinkClickedProps) {
  track(EVENTS.SOURCE_LINK_CLICKED, props);
}

export function trackClarityScoreExpanded(briefId: string) {
  track(EVENTS.CLARITY_SCORE_EXPANDED, { briefId });
}

// Errors
export function trackError(props: ErrorOccurredProps) {
  track(EVENTS.ERROR_OCCURRED, props);
}

// Investigations
export function trackInvestigationStarted(props: InvestigationStartedProps) {
  track(EVENTS.INVESTIGATION_STARTED, props);
}

export function trackInvestigationCompleted(props: InvestigationCompletedProps) {
  track(EVENTS.INVESTIGATION_COMPLETED, props);
}

export function trackInvestigationViewed(props: InvestigationViewedProps) {
  track(EVENTS.INVESTIGATION_VIEWED, props);
}

// ============================================
// User Identification
// ============================================

export function identifyUser(userId: string, properties?: {
  email?: string;
  name?: string;
  createdAt?: string;
}) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}
