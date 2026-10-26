import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit } from "../../src/lib/middleware/rate-limit.ts";

describe("Rate Limiter Middleware", () => {
  test("allows requests under the maximum burst quota", () => {
    const ip = "test-client-1";
    // 5 rapid requests with max 10 tokens
    for (let i = 0; i < 5; i++) {
      assert.equal(checkRateLimit(ip, 10, 1), true);
    }
  });

  test("blocks requests once token bucket is exhausted", () => {
    const ip = "test-client-exhaust";
    const maxTokens = 3;

    // Consume all 3 tokens
    assert.equal(checkRateLimit(ip, maxTokens, 0), true);
    assert.equal(checkRateLimit(ip, maxTokens, 0), true);
    assert.equal(checkRateLimit(ip, maxTokens, 0), true);

    // 4th request should be blocked
    assert.equal(checkRateLimit(ip, maxTokens, 0), false);
  });

  test("isolates quotas across distinct client identifiers", () => {
    const ipA = "client-alpha";
    const ipB = "client-beta";

    // Exhaust client A
    checkRateLimit(ipA, 1, 0);
    checkRateLimit(ipA, 1, 0);
    assert.equal(checkRateLimit(ipA, 1, 0), false);

    // Client B should still have full quota
    assert.equal(checkRateLimit(ipB, 1, 0), true);
  });
});
