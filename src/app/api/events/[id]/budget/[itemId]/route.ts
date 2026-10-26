/**
 * /api/events/[id]/budget/[itemId] - Individual budget item operations.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { UpdateBudgetItemSchema } from "@/lib/validators/budget.schema";
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
    const parsed = UpdateBudgetItemSchema.parse(sanitized);

    const updated = dbRepository.updateBudgetItem(itemId, parsed);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Budget item not found" },
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
    console.error("PUT /api/events/[id]/budget/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update budget item" },
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
    const deleted = dbRepository.deleteBudgetItem(itemId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Budget item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Budget item deleted" });
  } catch (error) {
    console.error("DELETE /api/events/[id]/budget/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete budget item" },
      { status: 500 }
    );
  }
}
