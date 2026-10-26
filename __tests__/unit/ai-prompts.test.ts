import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanPrompt,
  buildBudgetPrompt,
  buildIdeasPrompt,
  generateFallbackPlan,
} from "../../src/lib/ai/prompts.ts";

describe("GenAI Prompts & Fallback Engine", () => {
  test("buildPlanPrompt injects event parameters and JSON schema", () => {
    const prompt = buildPlanPrompt({
      eventId: "e-1",
      eventType: "WEDDING",
      guestCount: 150,
      totalBudget: 50000,
      date: "2026-10-18",
      location: "Vineyard Estate",
      preferences: "Rustic aesthetic",
    });

    assert.ok(prompt.includes("WEDDING"));
    assert.ok(prompt.includes("150"));
    assert.ok(prompt.includes("$50,000"));
    assert.ok(prompt.includes("Vineyard Estate"));
    assert.ok(prompt.includes("budgetBreakdown"));
    assert.ok(prompt.includes("timeline"));
    assert.ok(prompt.includes("vendorChecklist"));
    assert.ok(prompt.includes("creativeIdeas"));
  });

  test("generateFallbackPlan outputs rich plans for Weddings", () => {
    const plan = generateFallbackPlan({
      eventId: "e-wedding",
      eventType: "WEDDING",
      guestCount: 120,
      totalBudget: 40000,
      date: "2026-10-18",
    });

    assert.ok(plan.budgetBreakdown.length >= 5);
    assert.ok(plan.timeline.length >= 5);
    assert.ok(plan.vendorChecklist.length >= 3);
    assert.ok(plan.creativeIdeas.length >= 2);
    assert.ok(plan.tips.length >= 2);

    // Sum of budget percentages should be approx 100%
    const totalPct = plan.budgetBreakdown.reduce((sum, b) => sum + b.percentOfBudget, 0);
    assert.ok(totalPct >= 90 && totalPct <= 105);
  });

  test("generateFallbackPlan outputs rich plans for Birthday celebrations", () => {
    const plan = generateFallbackPlan({
      eventId: "e-bday",
      eventType: "BIRTHDAY",
      guestCount: 50,
      totalBudget: 6000,
      date: "2026-11-07",
    });

    assert.ok(plan.budgetBreakdown.some((b) => b.name.includes("Lounge") || b.category === "VENUE"));
    assert.ok(plan.vendorChecklist.some((v) => v.category === "Entertainment" || v.category === "Venue"));
  });

  test("generateFallbackPlan outputs rich plans for Community gatherings", () => {
    const plan = generateFallbackPlan({
      eventId: "e-comm",
      eventType: "COMMUNITY",
      guestCount: 600,
      totalBudget: 15000,
      date: "2026-10-24",
    });

    assert.ok(plan.budgetBreakdown.some((b) => b.category === "VENUE" || b.name.includes("Permit")));
    assert.ok(plan.timeline.some((m) => m.title.includes("Permit") || m.title.includes("Volunteer")));
  });
});
