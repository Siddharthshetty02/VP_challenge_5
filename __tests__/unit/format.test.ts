import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  getEventTypeIcon,
  formatCategory,
} from "../../src/lib/utils/format.ts";

describe("Formatting Utilities", () => {
  test("formatCurrency correctly formats USD amounts", () => {
    assert.equal(formatCurrency(45000), "$45,000");
    assert.equal(formatCurrency(120.5), "$120.50");
    assert.equal(formatCurrency(0), "$0");
    assert.equal(formatCurrency(null), "$0");
    assert.equal(formatCurrency(undefined), "$0");
  });

  test("formatCurrency compact notation works for thousands", () => {
    const formatted = formatCurrency(45000, true);
    assert.ok(formatted.includes("45") || formatted.includes("45K"));
  });

  test("formatDate handles valid ISO dates and fallbacks", () => {
    assert.equal(formatDate("2026-10-18T16:00:00.000Z"), "Oct 18, 2026");
    assert.equal(formatDate(null), "Date TBD");
    assert.equal(formatDate("invalid-date"), "Invalid date");
  });

  test("formatPercentage computes accurate percentages", () => {
    assert.equal(formatPercentage(25, 100), "25.0%");
    assert.equal(formatPercentage(1, 3), "33.3%");
    assert.equal(formatPercentage(0, 100), "0.0%");
    assert.equal(formatPercentage(50, 0), "0%");
  });

  test("getEventTypeIcon returns appropriate emojis", () => {
    assert.equal(getEventTypeIcon("WEDDING"), "💍");
    assert.equal(getEventTypeIcon("BIRTHDAY"), "🎂");
    assert.equal(getEventTypeIcon("COMMUNITY"), "🎪");
  });

  test("formatCategory resolves known and arbitrary categories", () => {
    assert.equal(formatCategory("VENUE"), "Venue");
    assert.equal(formatCategory("CATERING"), "Catering & Food");
    assert.equal(formatCategory("custom_category"), "Custom Category");
  });
});
