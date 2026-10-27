"use client";

import Link from "next/link";
import type { EventWithDetails } from "@/types/event";
import { formatCurrency, formatDate, getEventTypeIcon } from "@/lib/utils/format";
import { EVENT_STATUS_LABELS } from "@/types/event";

interface EventHeaderProps {
  event: EventWithDetails;
  isGeneratingAI: boolean;
  aiMessage: string | null;
  onOpenEditModal: () => void;
  onTriggerAI: () => void;
  onDeleteEvent: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}

export function EventHeader({
  event,
  isGeneratingAI,
  aiMessage,
  onOpenEditModal,
  onTriggerAI,
  onDeleteEvent,
  onExportJson,
  onExportMarkdown,
}: EventHeaderProps) {
  const badgeClass =
    event.type === "WEDDING"
      ? "badge-wedding"
      : event.type === "BIRTHDAY"
      ? "badge-birthday"
      : "badge-community";

  const statusColorMap = {
    PLANNING: "#38bdf8",
    IN_PROGRESS: "#f59e0b",
    COMPLETED: "#10b981",
    CANCELLED: "#ef4444",
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          ← Back to All Events
        </Link>
      </nav>

      {/* Header Banner */}
      <header
        className="card"
        style={{
          padding: "2rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: "1 1 500px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span className={`badge ${badgeClass}`}>
                <span>{getEventTypeIcon(event.type)}</span>
                <span>{event.type}</span>
              </span>

              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-full)",
                  background: `${statusColorMap[event.status]}20`,
                  color: statusColorMap[event.status],
                  border: `1px solid ${statusColorMap[event.status]}40`,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                ● {EVENT_STATUS_LABELS[event.status] || event.status}
              </span>
            </div>

            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              {event.name}
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.5, marginBottom: "1.25rem", maxWidth: "800px" }}>
              {event.description || "No description provided."}
            </p>

            {/* Quick Metadata Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📅</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {formatDate(event.date, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📍</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {event.location || "Location TBD"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>👥</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {event.guestCount.toLocaleString()} Estimated Guests
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>💰</span>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>
                  {formatCurrency(event.totalBudget)} Target Budget
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={onOpenEditModal}
              className="btn btn-secondary btn-sm"
              aria-label="Edit event parameters"
            >
              <span>✏️</span> Edit Event
            </button>

            <button
              onClick={onTriggerAI}
              disabled={isGeneratingAI}
              className="btn btn-ai btn-sm"
              aria-label="Regenerate full plan with AI"
            >
              <span>✨</span> {isGeneratingAI ? "Synthesizing..." : "AI Auto-Plan"}
            </button>

            <button
              onClick={onExportMarkdown}
              className="btn btn-secondary btn-sm"
              title="Download human-readable summary"
              aria-label="Export Plan as Markdown"
            >
              <span>📄</span> Export MD
            </button>

            <button
              onClick={onExportJson}
              className="btn btn-secondary btn-sm"
              title="Download structured JSON dataset"
              aria-label="Export Plan as JSON"
            >
              <span>💾</span> Export JSON
            </button>

            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              title="Print-friendly view or save as PDF"
              aria-label="Print event plan"
            >
              <span>🖨️</span> Print
            </button>

            <button
              onClick={onDeleteEvent}
              className="btn btn-danger btn-sm"
              aria-label="Delete entire event"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>

        {aiMessage && (
          <div
            className="alert-banner alert-info"
            style={{ marginTop: "1.25rem", marginBottom: 0 }}
            role="status"
          >
            <span>ℹ️</span> {aiMessage}
          </div>
        )}
      </header>
    </div>
  );
}
