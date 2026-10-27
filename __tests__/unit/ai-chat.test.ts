import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cleanAndRefinePoints } from "../../src/lib/ai/openrouter-client.ts";

describe("OpenRouter Chat Formatter Unit Tests", () => {
  test("strips markdown bold and italics asterisks while preserving text", () => {
    const raw = "Here is **essential** guidance on *catering* and ***budgeting***.";
    const cleaned = cleanAndRefinePoints(raw);
    assert.equal(cleaned.includes("*"), false);
    assert.equal(cleaned.includes("essential"), true);
    assert.equal(cleaned.includes("catering"), true);
    assert.equal(cleaned.includes("budgeting"), true);
  });

  test("converts leading dashes into clean round bullet points", () => {
    const raw = "- First priority: Reserve venue\n- Second priority: Book photographer\n– Third priority: Send invites";
    const cleaned = cleanAndRefinePoints(raw);
    assert.ok(cleaned.includes("• First priority: Reserve venue"));
    assert.ok(cleaned.includes("• Second priority: Book photographer"));
    assert.ok(cleaned.includes("• Third priority: Send invites"));
  });

  test("handles empty or falsy text gracefully", () => {
    assert.equal(cleanAndRefinePoints(""), "");
  });

  test("normalizes excessive newlines into clean double returns", () => {
    const raw = "Paragraph 1\n\n\n\n\nParagraph 2";
    const cleaned = cleanAndRefinePoints(raw);
    assert.equal(cleaned, "Paragraph 1\n\nParagraph 2");
  });
});
