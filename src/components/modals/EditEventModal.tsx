"use client";

import { useState } from "react";
import type { Event, EventType, EventStatus } from "@/types/event";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/types/event";

interface EditEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: Partial<Event>) => Promise<void>;
}

export function EditEventModal({ event, isOpen, onClose, onSave }: EditEventModalProps) {
  const [name, setName] = useState(event.name);
  const [type, setType] = useState<EventType>(event.type);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [date, setDate] = useState(
    event.date ? new Date(event.date).toISOString().slice(0, 16) : ""
  );
  const [location, setLocation] = useState(event.location || "");
  const [guestCount, setGuestCount] = useState(event.guestCount);
  const [totalBudget, setTotalBudget] = useState(event.totalBudget);
  const [description, setDescription] = useState(event.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!date) {
      setError("Event date is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        type,
        status,
        date: new Date(date).toISOString(),
        location: location.trim(),
        guestCount: Number(guestCount),
        totalBudget: Number(totalBudget),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-modal-title"
    >
      <div className="modal-content" style={{ maxWidth: "680px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 id="edit-event-modal-title" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
            Edit Event Parameters
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
            <label htmlFor="edit-event-name" className="form-label">
              Event Title *
            </label>
            <input
              id="edit-event-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="edit-event-type" className="form-label">
                Event Archetype *
              </label>
              <select
                id="edit-event-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-event-status" className="form-label">
                Lifecycle Status *
              </label>
              <select
                id="edit-event-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                {Object.entries(EVENT_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="edit-event-date" className="form-label">
                Event Date & Time *
              </label>
              <input
                id="edit-event-date"
                type="datetime-local"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-event-location" className="form-label">
                Venue Location
              </label>
              <input
                id="edit-event-location"
                type="text"
                className="form-input"
                placeholder="e.g. Skyline Lounge, Napa Valley"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="edit-event-guests" className="form-label">
                Estimated Attendees *
              </label>
              <input
                id="edit-event-guests"
                type="number"
                min="1"
                className="form-input"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-event-budget" className="form-label">
                Total Allocated Budget ($) *
              </label>
              <input
                id="edit-event-budget"
                type="number"
                min="0"
                step="100"
                className="form-input"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-event-desc" className="form-label">
              Description & Thematic Preferences
            </label>
            <textarea
              id="edit-event-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
