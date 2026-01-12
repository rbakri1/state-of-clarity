import { z } from "zod";

/**
 * Schema for validating brief ID parameter (UUID format)
 */
export const briefIdSchema = z.string().uuid({
  message: "Invalid brief ID format. Must be a valid UUID.",
});

/**
 * Schema for brief creation request body
 * Matches the BriefInsert type from database schema
 */
export const createBriefSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000, "Question too long"),
  summaries: z.any(),
  structured_data: z.any(),
  narrative: z.string().min(1, "Narrative is required"),
  user_id: z.string().uuid().nullable().optional(),
  clarity_score: z.number().min(0).max(100).nullable().optional(),
  metadata: z.any().optional(),
});

/**
 * Schema for brief update request body
 * All fields are optional for partial updates
 */
export const updateBriefSchema = z.object({
  summaries: z.any().optional(),
  structured_data: z.any().optional(),
  narrative: z.string().min(1).optional(),
  clarity_score: z.number().min(0).max(100).nullable().optional(),
});

/**
 * Schema for popular briefs query params
 */
export const popularBriefsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Schema for explore briefs query params
 */
export const exploreBriefsQuerySchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  minScore: z.coerce.number().min(0).max(10).optional(),
  sort: z.enum(["newest", "oldest", "score", "views"]).default("newest"),
  date: z.enum(["week", "month", "year", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  offset: z.coerce.number().int().min(0).default(0),
});

// Inferred types from schemas
export type BriefIdInput = z.infer<typeof briefIdSchema>;
export type CreateBriefInput = z.infer<typeof createBriefSchema>;
export type UpdateBriefInput = z.infer<typeof updateBriefSchema>;
export type PopularBriefsQueryInput = z.infer<typeof popularBriefsQuerySchema>;
export type ExploreBriefsQueryInput = z.infer<typeof exploreBriefsQuerySchema>;
