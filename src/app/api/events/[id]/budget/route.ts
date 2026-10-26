/**
 * /api/events/[id]/budget - Budget collection operations.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { CreateBudgetItemSchema } from "@/lib/validators/budget.schema";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { ZodError } from "zod";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = dbRepository.getBudgetItems(id);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/events/[id]/budget error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve budget items" },
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
    const parsed = CreateBudgetItemSchema.parse(sanitized);

    const item = dbRepository.createBudgetItem(parsed);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/events/[id]/budget error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create budget item" },
      { status: 500 }
    );
  }
}
