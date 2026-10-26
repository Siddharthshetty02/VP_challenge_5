/**
 * Zod validation schemas for budget-related API inputs.
 * Compatible with Zod v3 and v4.
 */

import { z } from "zod";

const BUDGET_CATEGORIES = [
  "VENUE",
  "CATERING",
  "DECORATION",
  "ENTERTAINMENT",
  "PHOTOGRAPHY",
  "ATTIRE",
  "FLOWERS",
  "TRANSPORTATION",
  "STATIONERY",
  "MISCELLANEOUS",
] as const;

/** Schema for creating a budget item */
export const CreateBudgetItemSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  category: z.enum(BUDGET_CATEGORIES),
  name: z
    .string()
    .min(1, "Item name is required")
    .max(100, "Item name must be under 100 characters")
    .trim(),
  estimated: z
    .number()
    .nonnegative("Estimated cost cannot be negative")
    .max(10_000_000, "Estimated cost too high"),
  actual: z
    .number()
    .nonnegative("Actual cost cannot be negative")
    .max(10_000_000, "Actual cost too high")
    .optional()
    .nullable(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().default(""),
});

/** Schema for updating a budget item */
export const UpdateBudgetItemSchema = CreateBudgetItemSchema.partial().omit({ eventId: true });

export type CreateBudgetItemInput = z.infer<typeof CreateBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof UpdateBudgetItemSchema>;
