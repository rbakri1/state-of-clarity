/**
 * Retry Queue Service
 *
 * Manages the retry queue for briefs that failed the quality gate.
 * Failed briefs are scheduled for automatic retry with adjusted parameters.
 */

import { createServiceRoleClient, type Database } from "../supabase/client";
import {
  type RetryQueueItem,
  type RetryParams,
  type RetryStatus,
} from "../types/quality-gate";

type RetryQueueRow = Database["public"]["Tables"]["retry_queue"]["Row"];
type RetryQueueInsert = Database["public"]["Tables"]["retry_queue"]["Insert"];
type RetryQueueUpdate = Database["public"]["Tables"]["retry_queue"]["Update"];

const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 hour delay before retry

/**
 * Add a failed brief to the retry queue
 */
export async function addToRetryQueue(
  briefId: string | null,
  question: string,
  classification: Record<string, unknown>,
  failureReason: string,
  retryParams: RetryParams
): Promise<void> {
  const supabase = createServiceRoleClient();

  const scheduledAt = new Date(Date.now() + RETRY_DELAY_MS);

  const insertData: RetryQueueInsert = {
    brief_id: briefId,
    original_question: question,
    classification,
    failure_reason: failureReason,
    retry_params: retryParams as Record<string, unknown>,
    scheduled_at: scheduledAt.toISOString(),
    attempts: 0,
    status: "pending",
  };

  const { error } = await supabase
    .from("retry_queue")
    .insert(insertData as never);

  if (error) {
    console.error("[RetryQueue] Failed to add to queue:", error);
    throw new Error(`Failed to add to retry queue: ${error.message}`);
  }

  console.log(
    `[RetryQueue] Added brief to retry queue. Scheduled for: ${scheduledAt.toISOString()}`
  );
}

/**
 * Get the next item from the retry queue that's ready for processing
 */
export async function getNextRetryItem(): Promise<RetryQueueItem | null> {
  const supabase = createServiceRoleClient();

  const now = new Date().toISOString();

  const { data, error } = (await supabase
    .from("retry_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single()) as { data: RetryQueueRow | null; error: { code?: string; message: string } | null };

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[RetryQueue] Failed to get next item:", error);
    throw new Error(`Failed to get next retry item: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const updateData: RetryQueueUpdate = { status: "processing" };
  await supabase
    .from("retry_queue")
    .update(updateData as never)
    .eq("id", data.id);

  return mapRowToRetryQueueItem(data);
}

/**
 * Mark a retry attempt as complete
 */
export async function markRetryComplete(
  id: string,
  success: boolean
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: currentItem, error: fetchError } = (await supabase
    .from("retry_queue")
    .select("attempts")
    .eq("id", id)
    .single()) as { data: { attempts: number } | null; error: { message: string } | null };

  if (fetchError) {
    console.error("[RetryQueue] Failed to fetch retry item:", fetchError);
    throw new Error(`Failed to fetch retry item: ${fetchError.message}`);
  }

  const newAttempts = (currentItem?.attempts ?? 0) + 1;
  const MAX_RETRY_ATTEMPTS = 2;

  let newStatus: RetryStatus;
  if (success) {
    newStatus = "completed";
  } else if (newAttempts >= MAX_RETRY_ATTEMPTS) {
    newStatus = "abandoned";
    console.log(
      `[RetryQueue] Brief ${id} abandoned after ${newAttempts} attempts`
    );
  } else {
    newStatus = "pending";
    console.log(
      `[RetryQueue] Brief ${id} will retry again (attempt ${newAttempts}/${MAX_RETRY_ATTEMPTS})`
    );
  }

  const updates: RetryQueueUpdate = {
    status: newStatus,
    attempts: newAttempts,
  };

  if (newStatus === "pending") {
    const nextScheduledAt = new Date(Date.now() + RETRY_DELAY_MS);
    updates.scheduled_at = nextScheduledAt.toISOString();
  }

  const { error } = await supabase
    .from("retry_queue")
    .update(updates as never)
    .eq("id", id);

  if (error) {
    console.error("[RetryQueue] Failed to mark retry complete:", error);
    throw new Error(`Failed to mark retry complete: ${error.message}`);
  }

  console.log(
    `[RetryQueue] Marked ${id} as ${newStatus} (success: ${success})`
  );
}

/**
 * Generate retry parameters based on failure reason
 */
export function generateRetryParams(failureReason: string): RetryParams {
  const params: RetryParams = {};

  const lowEvidence =
    failureReason.toLowerCase().includes("evidence") ||
    failureReason.toLowerCase().includes("source");
  const lowObjectivity =
    failureReason.toLowerCase().includes("objectivity") ||
    failureReason.toLowerCase().includes("bias");
  const lowClarity =
    failureReason.toLowerCase().includes("clarity") ||
    failureReason.toLowerCase().includes("unclear");

  if (lowEvidence) {
    params.increasedSourceDiversity = true;
    params.minSources = 10;
  }

  if (lowObjectivity) {
    params.forceOpposingViews = true;
    params.specialistPersona = "Neutral Analyst";
  }

  if (lowClarity) {
    params.adjustedPrompts = [
      "Use shorter sentences",
      "Define technical terms",
      "Structure with clear headings",
    ];
  }

  if (!lowEvidence && !lowObjectivity && !lowClarity) {
    params.increasedSourceDiversity = true;
    params.forceOpposingViews = true;
  }

  return params;
}

function mapRowToRetryQueueItem(
  row: Database["public"]["Tables"]["retry_queue"]["Row"]
): RetryQueueItem {
  return {
    id: row.id,
    briefId: row.brief_id || "",
    originalQuestion: row.original_question,
    classification: row.classification || {},
    failureReason: row.failure_reason,
    retryParams: row.retry_params as RetryParams,
    scheduledAt: new Date(row.scheduled_at),
    attempts: row.attempts,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}
