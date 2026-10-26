/**
 * Zod validation schemas for timeline/milestone API inputs.
 */

import { z } from "zod";

const TIMELINE_PHASES = [
  "INITIAL",
  "PLANNING",
  "BOOKING",
  "PREPARATION",
  "WEEK_OF",
  "DAY_OF",
  "POST_EVENT",
] as const;

/** Schema for creating a milestone */
export const CreateMilestoneSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  title: z
    .string()
    .min(1, "Milestone title is required")
    .max(150, "Title must be under 150 characters")
    .trim(),
  description: z.string().max(1000).optional().default(""),
  dueDate: z.string().min(1, "Due date is required"),
  completed: z.boolean().optional().default(false),
  phase: z.enum(TIMELINE_PHASES),
  sortOrder: z.number().int().optional().default(0),
});

/** Schema for updating a milestone */
export const UpdateMilestoneSchema = CreateMilestoneSchema.partial().omit({ eventId: true });

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
