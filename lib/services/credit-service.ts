/**
 * Credit Service (Placeholder for Theme 6)
 *
 * Handles credit refunds when briefs fail the quality gate.
 * Actual credit system will be implemented in Theme 6.
 */

import { createServiceRoleClient, type Database } from "../supabase/client";

type CreditRefundInsert =
  Database["public"]["Tables"]["credit_refunds"]["Insert"];

/**
 * Refund credits to a user when their brief fails the quality gate
 *
 * @param userId - The user to refund credits to
 * @param amount - Number of credits to refund
 * @param reason - Reason for the refund
 * @param briefId - Optional brief ID associated with the refund
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  briefId?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  console.log(
    `[CreditService] Refunding ${amount} credits to user ${userId}. Reason: ${reason}`
  );

  const insertData: CreditRefundInsert = {
    user_id: userId,
    amount,
    reason,
    brief_id: briefId || null,
  };

  const { error } = await supabase
    .from("credit_refunds")
    .insert(insertData as never);

  if (error) {
    console.error("[CreditService] Failed to record refund:", error);
    throw new Error(`Failed to record credit refund: ${error.message}`);
  }

  console.log(
    `[CreditService] Credit refund recorded successfully. Brief: ${briefId || "N/A"}`
  );
}
