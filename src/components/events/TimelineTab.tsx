"use client";

import { useState } from "react";
import type { Milestone, TimelinePhase } from "@/types/timeline";
import { formatDate } from "@/lib/utils/format";
import { TIMELINE_PHASE_LABELS, TIMELINE_PHASE_COLORS } from "@/types/timeline";

interface TimelineTabProps {
  milestones: Milestone[];
  onOpenAddModal: () => void;
  onOpenEditModal: (milestone: Milestone) => void;
  onToggleMilestone: (id: string, currentCompleted: boolean) => void;
  onDeleteMilestone: (id: string) => void;
}

export function TimelineTab({
  milestones,
  onOpenAddModal,
  onOpenEditModal,
  onToggleMilestone,
  onDeleteMilestone,
}: TimelineTabProps) {
  const [phaseFilter, setPhaseFilter] = useState<"ALL" | TimelinePhase>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const completedCount = milestones.filter((m) => m.completed).length;

  const filteredMilestones = milestones.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPhase = phaseFilter === "ALL" || m.phase === phaseFilter;

    let matchesStatus = true;
    if (statusFilter === "PENDING") {
      matchesStatus = !m.completed;
    } else if (statusFilter === "COMPLETED") {
      matchesStatus = m.completed;
    }

    return matchesSearch && matchesPhase && matchesStatus;
  });

  return (
    <section aria-labelledby="timeline-heading">
      {/* Header and Add Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 id="timeline-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Milestone Timeline & Deliverables
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Track chronological execution across 7 organized planning phases from initial concept to post-event wrap-up.
          </p>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary" aria-label="Add new milestone">
          <span>➕</span> Add Milestone
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flex: "1 1 300px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "260px" }}
            aria-label="Search milestones"
          />

          <select
            className="form-select"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value as "ALL" | TimelinePhase)}
            style={{ width: "auto" }}
            aria-label="Filter by phase"
          >
            <option value="ALL">All Planning Phases</option>
            {Object.entries(TIMELINE_PHASE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "COMPLETED")}
            style={{ width: "auto" }}
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="COMPLETED">Completed Only</option>
          </select>
        </div>

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {completedCount} of {milestones.length} milestones complete
        </span>
      </div>

      {/* Milestone List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredMilestones.map((m) => (
          <div
            key={m.id}
            className="card card-hover"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.25rem",
              padding: "1.25rem",
              borderLeft: `4px solid ${TIMELINE_PHASE_COLORS[m.phase] || "var(--primary)"}`,
            }}
          >
            <input
              type="checkbox"
              checked={m.completed}
              onChange={() => onToggleMilestone(m.id, m.completed)}
              style={{
                width: "22px",
                height: "22px",
                accentColor: "var(--primary)",
                marginTop: "0.2rem",
                cursor: "pointer",
              }}
              aria-label={`Toggle completion for ${m.title}`}
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      textDecoration: m.completed ? "line-through" : "none",
                      color: m.completed ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                  >
                    {m.title}
                  </h3>
                  {m.description && (
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {m.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: `${TIMELINE_PHASE_COLORS[m.phase]}20`,
                      color: TIMELINE_PHASE_COLORS[m.phase],
                    }}
                  >
                    {TIMELINE_PHASE_LABELS[m.phase]}
                  </span>
                  <button
                    onClick={() => onOpenEditModal(m)}
                    className="btn btn-secondary btn-sm"
                    aria-label={`Edit milestone ${m.title}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteMilestone(m.id)}
                    className="btn btn-danger btn-sm"
                    aria-label={`Delete milestone ${m.title}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span>📅 Target Due Date: {formatDate(m.dueDate, "MMMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredMilestones.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No milestones match your current filters. Add a milestone or adjust search filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
