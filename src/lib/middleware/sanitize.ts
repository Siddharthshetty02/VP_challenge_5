/**
 * Input sanitization middleware to prevent XSS and injection attacks.
 * Recursively sanitizes all string fields in incoming request data.
 */

/**
 * Strips script tags, style tags, HTML markup, and dangerous protocols from a string.
 */
function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove <script>...</script>
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Remove <style>...</style>
    .replace(/<[^>]*>/g, "") // Remove remaining HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: protocol
    .trim();
}

/**
 * Recursively sanitizes all string values in an object, array, or primitive.
 * Non-string values are returned as-is.
 *
 * @param input - The data to sanitize
 * @returns Sanitized copy of the input
 */
export function sanitizeInput<T>(input: T): T {
  if (typeof input === "string") {
    return stripHtml(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput) as T;
  }

  if (input !== null && typeof input === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized as T;
  }

  return input;
}
