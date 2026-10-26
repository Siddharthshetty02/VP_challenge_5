/**
 * Budget type definitions for the GenAI Event Planning Assistant.
 */

/** Budget categories for event expense tracking */
export type BudgetCategory =
  | "VENUE"
  | "CATERING"
  | "DECORATION"
  | "ENTERTAINMENT"
  | "PHOTOGRAPHY"
  | "ATTIRE"
  | "FLOWERS"
  | "TRANSPORTATION"
  | "STATIONERY"
  | "MISCELLANEOUS";

/** A single budget line item */
export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  estimated: number;
  actual: number | null;
  notes: string;
}

/** Input for creating a budget item */
export interface CreateBudgetInput {
  eventId: string;
  category: BudgetCategory;
  name: string;
  estimated: number;
  actual?: number | null;
  notes?: string;
}

/** Budget summary statistics */
export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  remaining: number;
  categoryBreakdown: Array<{
    category: BudgetCategory;
    estimated: number;
    actual: number;
    percentage: number;
  }>;
}

/** Human-readable labels for budget categories */
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  VENUE: "Venue",
  CATERING: "Catering & Food",
  DECORATION: "Decoration",
  ENTERTAINMENT: "Entertainment",
  PHOTOGRAPHY: "Photography & Video",
  ATTIRE: "Attire & Beauty",
  FLOWERS: "Flowers & Floral",
  TRANSPORTATION: "Transportation",
  STATIONERY: "Stationery & Invites",
  MISCELLANEOUS: "Miscellaneous",
} as const;

/** Color mapping for chart visualization */
export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, string> = {
  VENUE: "#6366f1",
  CATERING: "#f59e0b",
  DECORATION: "#ec4899",
  ENTERTAINMENT: "#10b981",
  PHOTOGRAPHY: "#3b82f6",
  ATTIRE: "#8b5cf6",
  FLOWERS: "#f43f5e",
  TRANSPORTATION: "#14b8a6",
  STATIONERY: "#f97316",
  MISCELLANEOUS: "#64748b",
} as const;
