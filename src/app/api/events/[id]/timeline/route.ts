/**
 * /api/events/[id]/timeline - Milestones collection operations.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { CreateMilestoneSchema } from "@/lib/validators/timeline.schema";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { ZodError } from "zod";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = dbRepository.getMilestones(id);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/events/[id]/timeline error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve milestones" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const sanitized = sanitizeInput({ ...body, eventId });
    const parsed = CreateMilestoneSchema.parse(sanitized);

    const item = dbRepository.createMilestone(parsed);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/events/[id]/timeline error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
