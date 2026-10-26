import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { dbRepository } from "../../src/lib/db/database.ts";

describe("Database Repository Integration", () => {
  let createdEventId: string;

  test("initial seed data contains Weddings, Birthdays, and Community events", () => {
    const events = dbRepository.getAllEvents();
    assert.ok(events.length >= 3);

    const hasWedding = events.some((e) => e.type === "WEDDING");
    const hasBirthday = events.some((e) => e.type === "BIRTHDAY");
    const hasCommunity = events.some((e) => e.type === "COMMUNITY");

    assert.equal(hasWedding, true);
    assert.equal(hasBirthday, true);
    assert.equal(hasCommunity, true);
  });

  test("creates a new event successfully", () => {
    const newEvent = dbRepository.createEvent({
      name: "Integration Test Celebration",
      type: "BIRTHDAY",
      date: "2026-12-31T20:00:00.000Z",
      location: "Penthouse Suite",
      guestCount: 30,
      totalBudget: 4000,
      description: "New Year's Eve milestone party",
    });

    assert.ok(newEvent.id);
    assert.equal(newEvent.name, "Integration Test Celebration");
    createdEventId = newEvent.id;

    const fetched = dbRepository.getEventById(createdEventId);
    assert.equal(fetched?.id, createdEventId);
  });

  test("manages budget items for the event", () => {
    const item = dbRepository.createBudgetItem({
      eventId: createdEventId,
      category: "CATERING",
      name: "Champagne & Caviar Bar",
      estimated: 1200,
      notes: "Mid-tier package",
    });

    assert.ok(item.id);
    assert.equal(item.name, "Champagne & Caviar Bar");

    const items = dbRepository.getBudgetItems(createdEventId);
    assert.ok(items.some((i) => i.id === item.id));

    // Update actual cost
    const updated = dbRepository.updateBudgetItem(item.id, { actual: 1150 });
    assert.equal(updated?.actual, 1150);

    // Delete item
    const deleted = dbRepository.deleteBudgetItem(item.id);
    assert.equal(deleted, true);
  });

  test("manages milestones and completion status", () => {
    const milestone = dbRepository.createMilestone({
      eventId: createdEventId,
      title: "Confirm Penthouse Deposit",
      dueDate: "2026-11-01T00:00:00.000Z",
      phase: "INITIAL",
      description: "Transfer 50% reservation fee",
    });

    assert.ok(milestone.id);
    assert.equal(milestone.completed, false);

    // Toggle completed
    const updated = dbRepository.updateMilestone(milestone.id, { completed: true });
    assert.equal(updated?.completed, true);
  });

  test("manages vendors and status lifecycle", () => {
    const vendor = dbRepository.createVendor({
      eventId: createdEventId,
      name: "Skyline Mixology",
      category: "Bar Service",
      contact: "Leo Vance",
      email: "leo@skylinemix.com",
      cost: 800,
      status: "RESEARCHING",
    });

    assert.ok(vendor.id);
    assert.equal(vendor.status, "RESEARCHING");

    // Transition status to BOOKED
    const updated = dbRepository.updateVendor(vendor.id, { status: "BOOKED" });
    assert.equal(updated?.status, "BOOKED");
  });

  test("applies an AI plan in bulk to an event", () => {
    dbRepository.applyAIPlanToEvent(createdEventId, {
      budgetBreakdown: [
        { category: "ENTERTAINMENT", name: "Rooftop Saxophonist", estimatedCost: 600 },
      ],
      timeline: [
        { phase: "PREPARATION", title: "Midnight Countdown Music Cue", description: "Coordinate with audio engineer", daysBeforeEvent: 1 },
      ],
      vendorChecklist: [
        { category: "Photography", name: "Midnight Flash Photography", estimatedCost: 500 },
      ],
    });

    const fullDetails = dbRepository.getEventWithDetails(createdEventId);
    assert.ok(fullDetails?.budgetItems.some((b) => b.name === "Rooftop Saxophonist"));
    assert.ok(fullDetails?.milestones.some((m) => m.title === "Midnight Countdown Music Cue"));
    assert.ok(fullDetails?.vendors.some((v) => v.name === "Midnight Flash Photography"));
  });

  test("cascades deletion of event and all related items", () => {
    const deleted = dbRepository.deleteEvent(createdEventId);
    assert.equal(deleted, true);

    const checkEvent = dbRepository.getEventById(createdEventId);
    assert.equal(checkEvent, null);

    const checkBudget = dbRepository.getBudgetItems(createdEventId);
    assert.equal(checkBudget.length, 0);

    const checkMilestones = dbRepository.getMilestones(createdEventId);
    assert.equal(checkMilestones.length, 0);

    const checkVendors = dbRepository.getVendors(createdEventId);
    assert.equal(checkVendors.length, 0);
  });
});
