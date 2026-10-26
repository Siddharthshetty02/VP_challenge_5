/**
 * /api/ai/generate-plan - GenAI planning endpoint.
 * Generates full plans with budgets, milestones, vendors, and creative concepts.
 */

import { NextResponse } from "next/server";
import { generateEventPlan } from "@/lib/ai/gemini-client";
import { dbRepository } from "@/lib/db/database";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const GeneratePlanRequestSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["WEDDING", "BIRTHDAY", "COMMUNITY"]),
  guestCount: z.number().int().min(1),
  totalBudget: z.number().positive(),
  date: z.string(),
  location: z.string().optional(),
  preferences: z.string().optional(),
  applyToEvent: z.boolean().optional().default(false),
});


export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "client";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment before generating another plan." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeInput(body);
    const validated = GeneratePlanRequestSchema.parse(sanitized);

    // Call GenAI (or fallback engine)
    const { plan, source } = await generateEventPlan(validated);

    // Save suggestion audit record
    dbRepository.createAISuggestion({
      eventId: validated.eventId,
      type: "plan",
      prompt: `Plan for ${validated.eventType} with ${validated.guestCount} guests, budget $${validated.totalBudget}`,
      content: JSON.stringify(plan),
    });

    // Optionally apply to event directly
    if (validated.applyToEvent) {
      dbRepository.applyAIPlanToEvent(validated.eventId, plan);
    }

    return NextResponse.json({
      success: true,
      data: plan,
      meta: { source, applied: validated.applyToEvent },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("AI Plan Generation Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate event plan. Please try again." },
      { status: 500 }
    );
  }
}
