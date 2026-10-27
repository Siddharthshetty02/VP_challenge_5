"use client";

import { useState, useEffect } from "react";
import type { BudgetItem, BudgetCategory } from "@/types/budget";
import { BUDGET_CATEGORY_LABELS } from "@/types/budget";

interface BudgetItemModalProps {
  isOpen: boolean;
  itemToEdit?: BudgetItem | null;
  onClose: () => void;
  onSave: (data: {
    category: BudgetCategory;
    name: string;
    estimated: number;
    actual: number | null;
    notes: string;
  }) => Promise<void>;
}

export function BudgetItemModal({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}: BudgetItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("VENUE");
  const [estimated, setEstimated] = useState<number>(1000);
  const [actual, setActual] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setEstimated(itemToEdit.estimated);
      setActual(itemToEdit.actual !== null ? itemToEdit.actual : "");
      setNotes(itemToEdit.notes || "");
    } else {
      setName("");
      setCategory("VENUE");
      setEstimated(1000);
      setActual("");
      setNotes("");
    }
    setError(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        category,
        name: name.trim(),
        estimated: Number(estimated),
        actual: actual !== "" ? Number(actual) : null,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget item.");
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = !!itemToEdit;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-item-modal-title"
    >
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 id="budget-item-modal-title" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {isEditing ? "Edit Budget Line Item" : "Add Budget Line Item"}
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
            <label htmlFor="budget-name-input" className="form-label">
              Item Name *
            </label>
            <input
              id="budget-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Ceremony String Quartet or Venue Deposit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget-cat-select" className="form-label">
              Category *
            </label>
            <select
              id="budget-cat-select"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
            >
              {Object.entries(BUDGET_CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="budget-est-input" className="form-label">
                Estimated Cost ($) *
              </label>
              <input
                id="budget-est-input"
                type="number"
                min="0"
                step="10"
                className="form-input"
                value={estimated}
                onChange={(e) => setEstimated(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="budget-act-input" className="form-label">
                Actual Cost ($) (optional)
              </label>
              <input
                id="budget-act-input"
                type="number"
                min="0"
                step="10"
                className="form-input"
                placeholder="Leave blank if pending"
                value={actual}
                onChange={(e) => setActual(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget-notes-input" className="form-label">
              Notes & Contract Terms
            </label>
            <textarea
              id="budget-notes-input"
              className="form-textarea"
              rows={2}
              placeholder="e.g. 50% deposit paid, includes sound engineer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? "Saving..." : isEditing ? "Update Item" : "Add Line Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
