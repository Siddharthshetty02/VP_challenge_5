import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseAIPlanResponse } from "../../src/lib/ai/response-parser.ts";

describe("AI Response Parser", () => {
  test("parses pure JSON string matching schema", () => {
    const raw = JSON.stringify({
      budgetBreakdown: [
        { category: "VENUE", name: "Garden Hall", estimatedCost: 3000, percentOfBudget: 30, notes: "Deposit paid" },
      ],
      timeline: [
        { phase: "PLANNING", title: "Book DJ", description: "Audition sample sets", daysBeforeEvent: 60 },
      ],
      vendorChecklist: [
        { category: "DJ", name: "Groove Masters", priority: "HIGH", estimatedCost: 1500, bookByDaysBeforeEvent: 45 },
      ],
      creativeIdeas: [
        { title: "Sparkler Grand Exit", description: "Guests line up with 36-inch gold sparklers", estimatedCost: 120, category: "Favors" },
      ],
      tips: ["Keep a spare phone charger in the emergency pouch."],
    });

    const parsed = parseAIPlanResponse(raw);
    assert.equal(parsed.budgetBreakdown.length, 1);
    assert.equal(parsed.budgetBreakdown[0].name, "Garden Hall");
    assert.equal(parsed.timeline[0].title, "Book DJ");
    assert.equal(parsed.vendorChecklist[0].priority, "HIGH");
    assert.equal(parsed.creativeIdeas[0].title, "Sparkler Grand Exit");
  });

  test("strips markdown code blocks and conversational text around JSON", () => {
    const rawWithMarkdown = `
    Here is the custom event plan you requested:
    \`\`\`json
    {
      "budgetBreakdown": [
        { "category": "CATERING", "name": "Bao Bar", "estimatedCost": 2000, "percentOfBudget": 20 }
      ],
      "timeline": [],
      "vendorChecklist": [],
      "creativeIdeas": [],
      "tips": []
    }
    \`\`\`
    Hope this helps with your planning!
    `;

    const parsed = parseAIPlanResponse(rawWithMarkdown);
    assert.equal(parsed.budgetBreakdown.length, 1);
    assert.equal(parsed.budgetBreakdown[0].name, "Bao Bar");
  });

  test("throws error when JSON is completely invalid", () => {
    const invalidRaw = "I am an AI and I cannot generate that.";
    assert.throws(() => parseAIPlanResponse(invalidRaw));
  });
});
