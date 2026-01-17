/**
 * PostHog API Client
 *
 * Server-side API for querying PostHog analytics data.
 * Used for analysis and generating insights.
 */

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_API_HOST = "https://eu.posthog.com"; // EU region

interface PostHogQueryParams {
  events?: Array<{
    id: string;
    name: string;
    type: "events";
    math?: "total" | "dau" | "weekly_active" | "monthly_active";
  }>;
  date_from?: string; // e.g., "-7d", "-30d", "2024-01-01"
  date_to?: string;
  interval?: "hour" | "day" | "week" | "month";
  breakdown?: string;
  breakdown_type?: "event" | "person" | "cohort";
}

interface EventDefinition {
  id: string;
  name: string;
  description?: string;
  volume_30_day?: number;
}

interface PersonProperty {
  name: string;
  count: number;
}

interface TrendResult {
  data: number[];
  labels: string[];
  count: number;
  label: string;
}

interface InsightResult {
  result: TrendResult[];
}

interface EventsListResult {
  results: Array<{
    id: string;
    event: string;
    properties: Record<string, unknown>;
    timestamp: string;
    person: {
      distinct_ids: string[];
      properties: Record<string, unknown>;
    };
  }>;
  next?: string;
}

async function posthogFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    throw new Error("PostHog API credentials not configured");
  }

  const url = `${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PostHog API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================
// Event Definitions & Discovery
// ============================================

/**
 * Get all event definitions (event names and their metadata)
 */
export async function getEventDefinitions(): Promise<EventDefinition[]> {
  const result = await posthogFetch<{ results: EventDefinition[] }>(
    "/event_definitions/"
  );
  return result.results;
}

/**
 * Get property definitions for events
 */
export async function getPropertyDefinitions(): Promise<PersonProperty[]> {
  const result = await posthogFetch<{ results: PersonProperty[] }>(
    "/property_definitions/"
  );
  return result.results;
}

// ============================================
// Event Queries
// ============================================

/**
 * Get recent events
 */
export async function getRecentEvents(
  eventName?: string,
  limit: number = 100
): Promise<EventsListResult> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });
  if (eventName) {
    params.append("event", eventName);
  }

  return posthogFetch<EventsListResult>(`/events/?${params.toString()}`);
}

/**
 * Query event trends over time
 */
export async function queryTrends(params: PostHogQueryParams): Promise<InsightResult> {
  return posthogFetch<InsightResult>("/insights/trend/", {
    method: "POST",
    body: JSON.stringify({
      insight: "TRENDS",
      ...params,
    }),
  });
}

/**
 * Get event counts for a specific event
 */
export async function getEventCount(
  eventName: string,
  dateFrom: string = "-30d"
): Promise<number> {
  const result = await queryTrends({
    events: [{ id: eventName, name: eventName, type: "events", math: "total" }],
    date_from: dateFrom,
  });

  return result.result[0]?.count ?? 0;
}

// ============================================
// Funnel Analysis
// ============================================

interface FunnelStep {
  id: string;
  name: string;
  type: "events";
}

interface FunnelResult {
  result: Array<{
    name: string;
    count: number;
    conversion_rate: number;
  }>;
}

/**
 * Query funnel conversion
 */
export async function queryFunnel(
  steps: FunnelStep[],
  dateFrom: string = "-30d"
): Promise<FunnelResult> {
  return posthogFetch<FunnelResult>("/insights/funnel/", {
    method: "POST",
    body: JSON.stringify({
      insight: "FUNNELS",
      events: steps,
      date_from: dateFrom,
      funnel_window_days: 14,
    }),
  });
}

// ============================================
// User Analysis
// ============================================

interface PersonsResult {
  results: Array<{
    id: string;
    distinct_ids: string[];
    properties: Record<string, unknown>;
    created_at: string;
  }>;
  next?: string;
}

/**
 * Get persons/users
 */
export async function getPersons(limit: number = 100): Promise<PersonsResult> {
  return posthogFetch<PersonsResult>(`/persons/?limit=${limit}`);
}

/**
 * Get person by distinct ID
 */
export async function getPersonByDistinctId(
  distinctId: string
): Promise<PersonsResult["results"][0] | null> {
  const result = await posthogFetch<PersonsResult>(
    `/persons/?distinct_id=${encodeURIComponent(distinctId)}`
  );
  return result.results[0] ?? null;
}

// ============================================
// Session Analysis
// ============================================

interface SessionRecordingsResult {
  results: Array<{
    id: string;
    distinct_id: string;
    start_time: string;
    end_time: string;
    recording_duration: number;
    click_count: number;
    keypress_count: number;
    start_url: string;
  }>;
}

/**
 * Get session recordings metadata
 */
export async function getSessionRecordings(
  limit: number = 50
): Promise<SessionRecordingsResult> {
  return posthogFetch<SessionRecordingsResult>(
    `/session_recordings/?limit=${limit}`
  );
}

// ============================================
// Insights & Dashboards
// ============================================

interface Dashboard {
  id: number;
  name: string;
  description?: string;
  items: Array<{
    id: number;
    name: string;
    insight: string;
  }>;
}

/**
 * Get all dashboards
 */
export async function getDashboards(): Promise<{ results: Dashboard[] }> {
  return posthogFetch<{ results: Dashboard[] }>("/dashboards/");
}

/**
 * Get a specific dashboard
 */
export async function getDashboard(dashboardId: number): Promise<Dashboard> {
  return posthogFetch<Dashboard>(`/dashboards/${dashboardId}/`);
}

// ============================================
// Analytics Summary (for Claude analysis)
// ============================================

export interface AnalyticsSummary {
  period: string;
  eventCounts: Record<string, number>;
  topEvents: Array<{ name: string; count: number }>;
  uniqueUsers: number;
  totalPageviews: number;
  avgSessionDuration?: number;
}

/**
 * Generate a comprehensive analytics summary for analysis
 */
export async function getAnalyticsSummary(
  dateFrom: string = "-7d"
): Promise<AnalyticsSummary> {
  // Get event definitions to know what events exist
  const eventDefs = await getEventDefinitions();

  // Get pageview count
  const pageviewCount = await getEventCount("$pageview", dateFrom);

  // Get counts for top events
  const eventCounts: Record<string, number> = {};
  const topEventDefs = eventDefs
    .filter((e) => e.volume_30_day && e.volume_30_day > 0)
    .sort((a, b) => (b.volume_30_day ?? 0) - (a.volume_30_day ?? 0))
    .slice(0, 20);

  for (const eventDef of topEventDefs) {
    eventCounts[eventDef.name] = eventDef.volume_30_day ?? 0;
  }

  const topEvents = Object.entries(eventCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    period: dateFrom,
    eventCounts,
    topEvents,
    uniqueUsers: 0, // Would need separate query
    totalPageviews: pageviewCount,
  };
}
