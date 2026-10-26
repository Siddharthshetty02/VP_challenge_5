/**
 * Zod validation schemas for event-related API inputs.
 * Compatible with Zod v3 and v4.
 */

import { z } from "zod";

/** Schema for creating a new event */
export const CreateEventSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .max(100, "Event name must be under 100 characters")
    .trim(),
  type: z.enum(["WEDDING", "BIRTHDAY", "COMMUNITY"]),
  date: z.string().min(1, "Event date is required"),
  location: z.string().max(200, "Location must be under 200 characters").optional().default(""),
  guestCount: z
    .number()
    .int("Guest count must be a whole number")
    .min(1, "At least 1 guest is required")
    .max(10000, "Guest count cannot exceed 10,000"),
  totalBudget: z
    .number()
    .positive("Budget must be a positive number")
    .max(10_000_000, "Budget cannot exceed $10,000,000"),
  description: z.string().max(2000, "Description must be under 2000 characters").optional().default(""),
});

/** Schema for updating an existing event */
export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z
    .enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
});

/** Inferred types from schemas */
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
