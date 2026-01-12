/**
 * Script to add credits to a user account
 * Usage: npx tsx scripts/add-credits.ts <email> <amount>
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServiceRoleClient } from "../lib/supabase/client";
import { addCredits } from "../lib/services/credit-service";

async function main() {
  const email = process.argv[2];
  const amount = parseInt(process.argv[3], 10);

  if (!email || !amount || isNaN(amount)) {
    console.error("Usage: npx tsx scripts/add-credits.ts <email> <amount>");
    process.exit(1);
  }

  const supabase = createServiceRoleClient();

  // Look up user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error("Failed to list users:", userError.message);
    process.exit(1);
  }

  const user = userData.users.find(u => u.email === email);

  if (!user) {
    console.error(`User not found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id} (${user.email})`);

  // Calculate expiry date (12 months from now)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  // Add credits
  try {
    await addCredits(
      user.id,
      amount,
      "bonus", // Admin-granted credits
      null, // No Stripe payment ID
      expiresAt
    );

    console.log(`✅ Successfully added ${amount} credits to ${email}`);
    console.log(`   Expires: ${expiresAt.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error("Failed to add credits:", error);
    process.exit(1);
  }
}

main();
