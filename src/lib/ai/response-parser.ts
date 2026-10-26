/**
 * Robust parser and sanitizer for AI-generated JSON responses.
 * Handles markdown code block stripping, JSON repair, and validation.
 */

import { z } from "zod";
import type { AIPlanResponse } from "../../types/ai.ts";

const BudgetItemSchema = z.object({
  category: z.string().default("MISCELLANEOUS"),
  name: z.string().min(1),
  estimatedCost: z.number().nonnegative(),
  percentOfBudget: z.number().default(0),
  notes: z.string().optional().default(""),
});

const TimelineItemSchema = z.object({
  phase: z.string().default("PLANNING"),
  title: z.string().min(1),
  description: z.string().default(""),
  daysBeforeEvent: z.number().default(30),
});

const VendorItemSchema = z.object({
  category: z.string().default("General"),
  name: z.string().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  estimatedCost: z.number().nonnegative().default(0),
  bookByDaysBeforeEvent: z.number().default(60),
});

const CreativeIdeaSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  estimatedCost: z.number().nonnegative().default(0),
  category: z.string().default("Idea"),
});

export const AIPlanResponseSchema = z.object({
  budgetBreakdown: z.array(BudgetItemSchema).default([]),
  timeline: z.array(TimelineItemSchema).default([]),
  vendorChecklist: z.array(VendorItemSchema).default([]),
  creativeIdeas: z.array(CreativeIdeaSchema).default([]),
  tips: z.array(z.string()).default([]),
});

/**
 * Parses and validates an AI JSON response string.
 *
 * @param raw - Raw string returned from the AI model
 * @returns Validated AIPlanResponse object
 */
export function parseAIPlanResponse(raw: string): AIPlanResponse {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find first '{' and last '}' to handle any conversational text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const json = JSON.parse(cleaned);
    const parsed = AIPlanResponseSchema.parse(json);
    return parsed as AIPlanResponse;
  } catch (err) {
    console.error("AI response failed schema validation, raw was:", cleaned.substring(0, 200));
    throw new Error(`Failed to parse AI plan response: ${err instanceof Error ? err.message : String(err)}`);
  }
}
