/**
 * Vendor type definitions for the GenAI Event Planning Assistant.
 */

/** Vendor engagement status progression */
export type VendorStatus =
  | "RESEARCHING"
  | "CONTACTED"
  | "QUOTED"
  | "BOOKED"
  | "PAID"
  | "CANCELLED";

/** A single vendor record */
export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  cost: number | null;
  status: VendorStatus;
  notes: string;
  rating: number | null;
}

/** Input for creating a vendor */
export interface CreateVendorInput {
  eventId: string;
  name: string;
  category: string;
  contact?: string;
  email?: string;
  phone?: string;
  cost?: number | null;
  status?: VendorStatus;
  notes?: string;
  rating?: number | null;
}

/** Human-readable labels for vendor statuses */
export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  RESEARCHING: "Researching",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  BOOKED: "Booked",
  PAID: "Paid",
  CANCELLED: "Cancelled",
} as const;

/** Color mapping for vendor status badges */
export const VENDOR_STATUS_COLORS: Record<VendorStatus, string> = {
  RESEARCHING: "#94a3b8",
  CONTACTED: "#f59e0b",
  QUOTED: "#3b82f6",
  BOOKED: "#10b981",
  PAID: "#6366f1",
  CANCELLED: "#ef4444",
} as const;
