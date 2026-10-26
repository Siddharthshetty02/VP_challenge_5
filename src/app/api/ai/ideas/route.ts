/**
 * /api/ai/ideas - Personalized ideas generator.
 */

import { NextResponse } from "next/server";
import { generateCreativeIdeas } from "@/lib/ai/gemini-client";
import { dbRepository } from "@/lib/db/database";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const IdeasRequestSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["WEDDING", "BIRTHDAY", "COMMUNITY"]),
  guestCount: z.number().int().min(1),
  budget: z.number().positive(),
  theme: z.string().optional(),
  preferences: z.string().optional(),
});


export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "client";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeInput(body);
    const validated = IdeasRequestSchema.parse(sanitized);

    const result = await generateCreativeIdeas(validated);

    // Persist idea audit record
    dbRepository.createAISuggestion({
      eventId: validated.eventId,
      type: "idea",
      prompt: `Ideas for ${validated.eventType}: ${validated.theme || "General"}`,
      content: JSON.stringify(result),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("AI Ideas Generation Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
