/**
 * /api/events - List and Create events.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { CreateEventSchema } from "@/lib/validators/event.schema";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { ZodError } from "zod";


export async function GET() {
  try {
    const events = dbRepository.getAllEvents();
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "client";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeInput(body);
    const parsed = CreateEventSchema.parse(sanitized);

    const createdEvent = dbRepository.createEvent(parsed);

    return NextResponse.json(
      { success: true, data: createdEvent },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}
