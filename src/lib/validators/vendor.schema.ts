/**
 * Zod validation schemas for vendor-related API inputs.
 */

import { z } from "zod";

const VENDOR_STATUSES = [
  "RESEARCHING", "CONTACTED", "QUOTED", "BOOKED", "PAID", "CANCELLED",
] as const;

/** Schema for creating a vendor */
export const CreateVendorSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(100, "Vendor name must be under 100 characters")
    .trim(),
  category: z
    .string()
    .min(1, "Vendor category is required")
    .max(50, "Category must be under 50 characters")
    .trim(),
  contact: z.string().max(100).optional().default(""),
  email: z
    .string()
    .email("Please enter a valid email address")
    .or(z.literal(""))
    .optional()
    .default(""),
  phone: z.string().max(20).optional().default(""),
  cost: z
    .number()
    .nonnegative("Cost cannot be negative")
    .max(10_000_000)
    .optional()
    .nullable(),
  status: z.enum(VENDOR_STATUSES).optional().default("RESEARCHING"),
  notes: z.string().max(1000, "Notes must be under 1000 characters").optional().default(""),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .optional()
    .nullable(),
});

/** Schema for updating a vendor */
export const UpdateVendorSchema = CreateVendorSchema.partial().omit({ eventId: true });

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
