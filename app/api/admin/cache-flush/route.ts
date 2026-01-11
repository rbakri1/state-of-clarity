import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/middleware";
import { invalidateCache, invalidatePattern } from "@/lib/cache/invalidate";
import { kv } from "@/lib/cache/kv-client";
import { cacheFlushSchema } from "@/lib/validation/admin-schemas";

export const POST = withAdmin(async (req: NextRequest, { user }) => {
  let rawBody: unknown = {};
  
  try {
    rawBody = await req.json();
  } catch {
    // Empty body is allowed - will use defaults
  }

  const parsed = cacheFlushSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsed.error.errors[0].message,
      },
      { status: 400 }
    );
  }

  const { pattern } = parsed.data;
  let keysCleared = 0;
  let message: string;

  if (pattern) {
    // Selective flush by pattern
    const keys = await kv.keys(pattern);
    keysCleared = keys.length;
    await invalidatePattern(pattern);
    message = `Flushed ${keysCleared} keys matching pattern: ${pattern}`;
  } else {
    // Full flush - get all keys
    const keys = await kv.keys("*");
    keysCleared = keys.length;
    for (const key of keys) {
      await invalidateCache(key);
    }
    message = `Flushed all ${keysCleared} cached keys`;
  }

  console.log(`[Admin] Cache flush by ${user.email} (${user.id}): ${message}`);

  return NextResponse.json({
    success: true,
    message,
    keysCleared,
    flushedBy: user.email,
    timestamp: new Date().toISOString(),
  });
});
