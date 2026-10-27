"use client";

import { useState, useEffect } from "react";
import type { Milestone, TimelinePhase } from "@/types/timeline";
import { TIMELINE_PHASE_LABELS } from "@/types/timeline";

interface MilestoneModalProps {
  isOpen: boolean;
  milestoneToEdit?: Milestone | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    phase: TimelinePhase;
    dueDate: string;
    description: string;
  }) => Promise<void>;
}

export function MilestoneModal({
  isOpen,
  milestoneToEdit,
  onClose,
  onSave,
}: MilestoneModalProps) {
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<TimelinePhase>("PLANNING");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title);
      setPhase(milestoneToEdit.phase);
      setDueDate(
        milestoneToEdit.dueDate
          ? new Date(milestoneToEdit.dueDate).toISOString().slice(0, 10)
          : ""
      );
      setDescription(milestoneToEdit.description || "");
    } else {
      setTitle("");
      setPhase("PLANNING");
      setDueDate("");
      setDescription("");
    }
    setError(null);
  }, [milestoneToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Milestone title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        title: title.trim(),
        phase,
        dueDate: new Date(dueDate).toISOString(),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save milestone.");
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = !!milestoneToEdit;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
    >
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 id="milestone-modal-title" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {isEditing ? "Edit Timeline Milestone" : "Add Timeline Milestone"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert-banner" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="milestone-title-input" className="form-label">
              Milestone Title *
            </label>
            <input
              id="milestone-title-input"
              type="text"
              className="form-input"
              placeholder="e.g. Confirm Seating Chart & Floral Mockups"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="milestone-phase-select" className="form-label">
                Planning Phase *
              </label>
              <select
                id="milestone-phase-select"
                className="form-select"
                value={phase}
                onChange={(e) => setPhase(e.target.value as TimelinePhase)}
              >
                {Object.entries(TIMELINE_PHASE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="milestone-date-input" className="form-label">
                Target Due Date *
              </label>
              <input
                id="milestone-date-input"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="milestone-desc-input" className="form-label">
              Deliverables & Guidance Notes
            </label>
            <textarea
              id="milestone-desc-input"
              className="form-textarea"
              rows={3}
              placeholder="Key deliverables, vendor contacts, or sub-tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? "Saving..." : isEditing ? "Update Milestone" : "Add Milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
