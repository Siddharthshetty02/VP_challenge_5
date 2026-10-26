import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sanitizeInput } from "../../src/lib/middleware/sanitize.ts";

describe("Sanitization Middleware", () => {
  test("strips script tags and dangerous HTML from strings", () => {
    const malicious = "<script>alert('XSS')</script>Hello World";
    const cleaned = sanitizeInput(malicious);
    assert.equal(cleaned, "Hello World");
  });

  test("removes inline javascript handlers", () => {
    const withHandler = '<img src="x" onerror="alert(1)">Photo';
    const cleaned = sanitizeInput(withHandler);
    assert.ok(!cleaned.includes("onerror"));
    assert.ok(cleaned.includes("Photo"));
  });

  test("strips javascript: pseudo-protocols", () => {
    const jsProtocol = "javascript:alert(1)";
    const cleaned = sanitizeInput(jsProtocol);
    assert.ok(!cleaned.includes("javascript:"));
  });

  test("recursively sanitizes nested objects and arrays", () => {
    const payload = {
      name: "<b>VIP Wedding</b>",
      tags: ["<i>Romantic</i>", "<script>bad()</script>Autumn"],
      details: {
        location: "<a href='javascript:x()'>Vineyard</a>",
        budget: 45000,
      },
    };

    const sanitized = sanitizeInput(payload);
    assert.equal(sanitized.name, "VIP Wedding");
    assert.deepEqual(sanitized.tags, ["Romantic", "Autumn"]);
    assert.equal(sanitized.details.location, "Vineyard");
    assert.equal(sanitized.details.budget, 45000);
  });

  test("leaves numbers, booleans, and null unharmed", () => {
    assert.equal(sanitizeInput(42), 42);
    assert.equal(sanitizeInput(true), true);
    assert.equal(sanitizeInput(null), null);
    assert.equal(sanitizeInput(undefined), undefined);
  });
});
