/**
 * /api/events/[id]/timeline/[itemId] - Individual milestone operations.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { UpdateMilestoneSchema } from "@/lib/validators/timeline.schema";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { ZodError } from "zod";


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const sanitized = sanitizeInput(body);
    const parsed = UpdateMilestoneSchema.parse(sanitized);

    const updated = dbRepository.updateMilestone(itemId, parsed);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/events/[id]/timeline/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const deleted = dbRepository.deleteMilestone(itemId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Milestone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Milestone deleted" });
  } catch (error) {
    console.error("DELETE /api/events/[id]/timeline/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
