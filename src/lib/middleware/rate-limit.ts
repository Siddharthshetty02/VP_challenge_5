/**
 * In-memory sliding-window token bucket rate limiter.
 * Protects AI generation and database mutation endpoints from abuse.
 */

interface RateBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateBucket>();

// Clean up stale buckets every 10 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > 600000) {
        buckets.delete(ip);
      }
    }
  }, 600000);
  if (typeof timer === "object" && timer !== null && "unref" in timer) {
    (timer as NodeJS.Timeout).unref();
  }
}

/**
 * Checks whether an IP or client identifier has available quota.
 *
 * @param identifier - Client IP address or session token
 * @param maxTokens - Maximum burst capacity (default: 30 requests)
 * @param refillRatePerSec - Number of tokens added per second (default: 2/sec)
 * @returns boolean - true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxTokens = 30,
  refillRatePerSec = 2
): boolean {
  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: maxTokens - 1, lastRefill: now };
    buckets.set(identifier, bucket);
    return true;
  }

  // Refill tokens based on elapsed time
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsedSec * refillRatePerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}
