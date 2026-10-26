/**
 * Event type definitions for the GenAI Event Planning Assistant.
 * These types define the core event model and related enumerations.
 */

/** Supported event types */
export type EventType = "WEDDING" | "BIRTHDAY" | "COMMUNITY";

/** Event lifecycle statuses */
export type EventStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

/** Core event interface */
export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  description: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new event */
export interface CreateEventInput {
  name: string;
  type: EventType;
  date: string;
  location?: string;
  guestCount: number;
  totalBudget: number;
  description?: string;
}

/** Input for updating an existing event */
export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

/** Event with all related data */
export interface EventWithDetails extends Event {
  budgetItems: import("./budget").BudgetItem[];
  milestones: import("./timeline").Milestone[];
  vendors: import("./vendor").Vendor[];
}

/** Human-readable labels for event types */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEDDING: "Wedding",
  BIRTHDAY: "Birthday Party",
  COMMUNITY: "Community Event",
} as const;

/** Human-readable labels for event statuses */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;
