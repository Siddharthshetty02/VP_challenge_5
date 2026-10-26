/**
 * Timeline and milestone type definitions.
 */

/** Timeline phases for event planning progression */
export type TimelinePhase =
  | "INITIAL"
  | "PLANNING"
  | "BOOKING"
  | "PREPARATION"
  | "WEEK_OF"
  | "DAY_OF"
  | "POST_EVENT";

/** A single milestone in the event timeline */
export interface Milestone {
  id: string;
  eventId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  phase: TimelinePhase;
  sortOrder: number;
}

/** Input for creating a milestone */
export interface CreateMilestoneInput {
  eventId: string;
  title: string;
  description?: string;
  dueDate: string;
  phase: TimelinePhase;
  sortOrder?: number;
}

/** Human-readable labels for timeline phases */
export const TIMELINE_PHASE_LABELS: Record<TimelinePhase, string> = {
  INITIAL: "Getting Started",
  PLANNING: "Planning Phase",
  BOOKING: "Booking & Reservations",
  PREPARATION: "Preparation",
  WEEK_OF: "Week Of Event",
  DAY_OF: "Day Of Event",
  POST_EVENT: "Post Event",
} as const;

/** Color mapping for timeline phase indicators */
export const TIMELINE_PHASE_COLORS: Record<TimelinePhase, string> = {
  INITIAL: "#94a3b8",
  PLANNING: "#6366f1",
  BOOKING: "#3b82f6",
  PREPARATION: "#f59e0b",
  WEEK_OF: "#f97316",
  DAY_OF: "#10b981",
  POST_EVENT: "#8b5cf6",
} as const;
