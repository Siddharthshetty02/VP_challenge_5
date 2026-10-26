import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CreateEventSchema } from "../../src/lib/validators/event.schema.ts";
import { CreateBudgetItemSchema } from "../../src/lib/validators/budget.schema.ts";
import { CreateMilestoneSchema } from "../../src/lib/validators/timeline.schema.ts";
import { CreateVendorSchema } from "../../src/lib/validators/vendor.schema.ts";

describe("Zod Validation Schemas", () => {
  describe("CreateEventSchema", () => {
    test("accepts valid Wedding, Birthday, and Community event data", () => {
      const valid = {
        name: "St. Regis Vineyard Wedding",
        type: "WEDDING",
        date: "2026-10-18T16:00:00.000Z",
        location: "Napa Valley, CA",
        guestCount: 120,
        totalBudget: 45000,
        description: "Rustic vineyard celebration with open bar.",
      };
      const result = CreateEventSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    test("rejects missing event name and negative budget", () => {
      const invalid = {
        name: "   ",
        type: "BIRTHDAY",
        date: "2026-11-01",
        guestCount: 0,
        totalBudget: -500,
      };
      const result = CreateEventSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    test("rejects unsupported event types", () => {
      const invalid = {
        name: "Corporate Gala",
        type: "CORPORATE_RETREAT",
        date: "2026-12-01",
        guestCount: 50,
        totalBudget: 10000,
      };
      const result = CreateEventSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe("CreateBudgetItemSchema", () => {
    test("validates category enum and positive estimated cost", () => {
      const valid = {
        eventId: "event-123",
        category: "VENUE",
        name: "Grand Ballroom Rental",
        estimated: 5000,
        actual: 4800,
        notes: "Includes deposit",
      };
      const result = CreateBudgetItemSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    test("rejects unknown budget category", () => {
      const invalid = {
        eventId: "event-123",
        category: "CRYPTOCURRENCY_MINING",
        name: "Rig",
        estimated: 1000,
      };
      const result = CreateBudgetItemSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe("CreateMilestoneSchema", () => {
    test("validates timeline phase enum and due date", () => {
      const valid = {
        eventId: "event-123",
        title: "Tasting Menu Finalization",
        dueDate: "2026-08-01T00:00:00.000Z",
        phase: "PREPARATION",
        description: "Choose 3 entrees",
      };
      const result = CreateMilestoneSchema.safeParse(valid);
      assert.equal(result.success, true);
    });
  });

  describe("CreateVendorSchema", () => {
    test("validates email formatting and vendor status", () => {
      const valid = {
        eventId: "event-123",
        name: "Golden Lens Photography",
        category: "Photography",
        email: "contact@goldenlens.com",
        phone: "(555) 123-4567",
        cost: 3500,
        status: "BOOKED",
      };
      const result = CreateVendorSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    test("rejects invalid email address", () => {
      const invalid = {
        eventId: "event-123",
        name: "Catering Co",
        category: "Catering",
        email: "not-an-email",
      };
      const result = CreateVendorSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });
});
