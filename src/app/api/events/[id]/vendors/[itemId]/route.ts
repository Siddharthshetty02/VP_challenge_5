/**
 * /api/events/[id]/vendors/[itemId] - Individual vendor operations.
 */

import { NextResponse } from "next/server";
import { dbRepository } from "@/lib/db/database";
import { UpdateVendorSchema } from "@/lib/validators/vendor.schema";
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
    const parsed = UpdateVendorSchema.parse(sanitized);

    const updated = dbRepository.updateVendor(itemId, parsed);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
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
    console.error("PUT /api/events/[id]/vendors/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vendor" },
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
    const deleted = dbRepository.deleteVendor(itemId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    console.error("DELETE /api/events/[id]/vendors/[itemId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
