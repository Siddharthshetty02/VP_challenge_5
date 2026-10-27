"use client";

import { useState, useEffect } from "react";
import type { Vendor, VendorStatus } from "@/types/vendor";
import { VENDOR_STATUS_LABELS } from "@/types/vendor";

interface VendorModalProps {
  isOpen: boolean;
  vendorToEdit?: Vendor | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: string;
    contact: string;
    email: string;
    phone: string;
    cost: number | null;
    status: VendorStatus;
    rating: number | null;
    notes: string;
  }) => Promise<void>;
}

export function VendorModal({
  isOpen,
  vendorToEdit,
  onClose,
  onSave,
}: VendorModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Catering");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cost, setCost] = useState<number | "">("");
  const [status, setStatus] = useState<VendorStatus>("RESEARCHING");
  const [rating, setRating] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name);
      setCategory(vendorToEdit.category);
      setContact(vendorToEdit.contact || "");
      setEmail(vendorToEdit.email || "");
      setPhone(vendorToEdit.phone || "");
      setCost(vendorToEdit.cost !== null ? vendorToEdit.cost : "");
      setStatus(vendorToEdit.status);
      setRating(vendorToEdit.rating !== null ? vendorToEdit.rating : "");
      setNotes(vendorToEdit.notes || "");
    } else {
      setName("");
      setCategory("Catering");
      setContact("");
      setEmail("");
      setPhone("");
      setCost("");
      setStatus("RESEARCHING");
      setRating("");
      setNotes("");
    }
    setError(null);
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        category: category.trim(),
        contact: contact.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cost: cost !== "" ? Number(cost) : null,
        status,
        rating: rating !== "" ? Number(rating) : null,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor.");
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = !!vendorToEdit;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-modal-title"
    >
      <div className="modal-content" style={{ maxWidth: "640px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 id="vendor-modal-title" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
            {isEditing ? "Edit Vendor Details" : "Add New Vendor"}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="vendor-name-input" className="form-label">
                Vendor Name *
              </label>
              <input
                id="vendor-name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Blue Ridge Sound & Light"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor-category-input" className="form-label">
                Category *
              </label>
              <input
                id="vendor-category-input"
                type="text"
                className="form-input"
                placeholder="e.g. Catering, Photography, Florist"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="vendor-contact-input" className="form-label">
                Contact Person
              </label>
              <input
                id="vendor-contact-input"
                type="text"
                className="form-input"
                placeholder="e.g. Chef Marcus"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor-email-input" className="form-label">
                Email Address
              </label>
              <input
                id="vendor-email-input"
                type="email"
                className="form-input"
                placeholder="e.g. bookings@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="vendor-phone-input" className="form-label">
                Phone Number
              </label>
              <input
                id="vendor-phone-input"
                type="tel"
                className="form-input"
                placeholder="e.g. (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vendor-cost-input" className="form-label">
                Quoted Cost ($)
              </label>
              <input
                id="vendor-cost-input"
                type="number"
                min="0"
                step="50"
                className="form-input"
                placeholder="e.g. 3500"
                value={cost}
                onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="vendor-status-select" className="form-label">
                Procurement Status
              </label>
              <select
                id="vendor-status-select"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
              >
                {Object.entries(VENDOR_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vendor-rating-select" className="form-label">
                Quality Rating (1 to 5 Stars)
              </label>
              <select
                id="vendor-rating-select"
                className="form-select"
                value={rating}
                onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">No rating yet</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                <option value="3">⭐⭐⭐ (3 - Satisfactory)</option>
                <option value="2">⭐⭐ (2 - Below Average)</option>
                <option value="1">⭐ (1 - Unsatisfactory)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-notes-input" className="form-label">
              Contract Terms & Negotiation Notes
            </label>
            <textarea
              id="vendor-notes-input"
              className="form-textarea"
              rows={2}
              placeholder="Package inclusions, deposit deadlines, overtime rates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? "Saving..." : isEditing ? "Update Vendor" : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
