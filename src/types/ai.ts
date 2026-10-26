/**
 * AI request/response type definitions for Gemini integration.
 */

import type { EventType } from "./event";

/** Input for generating a full event plan via AI */
export interface AIPlanRequest {
  eventId: string;
  eventType: EventType;
  guestCount: number;
  totalBudget: number;
  date: string;
  location?: string;
  preferences?: string;
}

/** Input for AI budget optimization */
export interface AIBudgetRequest {
  eventId: string;
  eventType: EventType;
  totalBudget: number;
  guestCount: number;
  currentBudget?: Array<{ category: string; amount: number }>;
  priorities?: string;
}

/** Input for AI vendor recommendations */
export interface AIVendorRequest {
  eventId: string;
  eventType: EventType;
  location: string;
  budget: number;
  categories?: string[];
}

/** Input for AI creative idea generation */
export interface AIIdeasRequest {
  eventId: string;
  eventType: EventType;
  guestCount: number;
  budget: number;
  theme?: string;
  preferences?: string;
}

/** Structured AI plan response */
export interface AIPlanResponse {
  budgetBreakdown: Array<{
    category: string;
    name: string;
    estimatedCost: number;
    percentOfBudget: number;
    notes?: string;
  }>;
  timeline: Array<{
    phase: string;
    title: string;
    description: string;
    daysBeforeEvent: number;
  }>;
  vendorChecklist: Array<{
    category: string;
    name: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    estimatedCost: number;
    bookByDaysBeforeEvent: number;
  }>;
  creativeIdeas: Array<{
    title: string;
    description: string;
    estimatedCost: number;
    category: string;
  }>;
  tips: string[];
}

/** Persisted AI suggestion record */
export interface AISuggestion {
  id: string;
  eventId: string;
  type: "plan" | "budget" | "idea" | "vendor";
  content: string;
  prompt: string;
  createdAt: string;
}

/** Wrapper for AI API responses */
export interface AIApiResponse<T = AIPlanResponse> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
