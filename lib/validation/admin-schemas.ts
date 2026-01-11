import { z } from "zod";

/**
 * Schema for cache-flush endpoint body
 * Pattern is optional - if not provided, all cache keys are flushed
 */
export const cacheFlushSchema = z.object({
  pattern: z
    .string()
    .min(1, "Pattern cannot be empty")
    .max(200, "Pattern too long")
    .optional(),
});

// Inferred types from schemas
export type CacheFlushInput = z.infer<typeof cacheFlushSchema>;
