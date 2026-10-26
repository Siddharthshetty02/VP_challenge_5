/**
 * Formatting utilities for currency, dates, percentages, and labels.
 */

import { format, parseISO, isValid } from "date-fns";
import type { EventType } from "../../types/event.ts";
import type { BudgetCategory } from "../../types/budget.ts";
import { BUDGET_CATEGORY_LABELS } from "../../types/budget.ts";

/**
 * Formats a number as USD currency string (e.g. $45,000 or $120.50).
 */
export function formatCurrency(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0";
  }

  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an ISO date string into a user-friendly format (e.g. 'Oct 18, 2026').
 */
export function formatDate(dateString: string | null | undefined, formatPattern = "MMM d, yyyy"): string {
  if (!dateString) return "Date TBD";
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return "Invalid date";
    return format(parsed, formatPattern);
  } catch {
    return "Invalid date";
  }
}

/**
 * Formats date and time (e.g. 'Oct 18, 2026 at 4:00 PM').
 */
export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Formats a ratio as percentage (e.g. 75.4%).
 */
export function formatPercentage(value: number, total: number): string {
  if (!total || total === 0) return "0%";
  const pct = (value / total) * 100;
  return `${pct.toFixed(1)}%`;
}

/**
 * Resolves an event type into an appropriate emoji icon.
 */
export function getEventTypeIcon(type: EventType): string {
  switch (type) {
    case "WEDDING":
      return "💍";
    case "BIRTHDAY":
      return "🎂";
    case "COMMUNITY":
      return "🎪";
    default:
      return "🎉";
  }
}

/**
 * Formats category name to readable label.
 */
export function formatCategory(category: BudgetCategory | string): string {
  if (category in BUDGET_CATEGORY_LABELS) {
    return BUDGET_CATEGORY_LABELS[category as BudgetCategory];
  }
  return category
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
