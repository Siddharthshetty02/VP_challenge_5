"use client";

import { useState } from "react";
import type { Vendor, VendorStatus } from "@/types/vendor";
import { formatCurrency } from "@/lib/utils/format";
import { VENDOR_STATUS_COLORS, VENDOR_STATUS_LABELS } from "@/types/vendor";

interface VendorTabProps {
  vendors: Vendor[];
  onOpenAddModal: () => void;
  onOpenEditModal: (vendor: Vendor) => void;
  onUpdateStatus: (vendorId: string, status: VendorStatus) => void;
  onDeleteVendor: (vendorId: string) => void;
}

export function VendorTab({
  vendors,
  onOpenAddModal,
  onOpenEditModal,
  onUpdateStatus,
  onDeleteVendor,
}: VendorTabProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | VendorStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section aria-labelledby="vendors-heading">
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
          <h2 id="vendors-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Vendor Checklist & Procurement Directory
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Track vendor negotiations, quotes, contact details, payment milestones, and quality ratings.
          </p>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary" aria-label="Add new vendor">
          <span>➕</span> Add Vendor
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
            placeholder="Search vendors or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "260px" }}
            aria-label="Search vendors"
          />

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | VendorStatus)}
            style={{ width: "auto" }}
            aria-label="Filter vendors by status"
          >
            <option value="ALL">All Procurement Statuses</option>
            {Object.entries(VENDOR_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Showing {filteredVendors.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Vendors Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {filteredVendors.map((v) => (
          <div
            key={v.id}
            className="card card-hover"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.6rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {v.category}
                </span>

                <select
                  className="form-select"
                  value={v.status}
                  onChange={(e) => onUpdateStatus(v.id, e.target.value as VendorStatus)}
                  style={{
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    width: "auto",
                    color: VENDOR_STATUS_COLORS[v.status],
                    borderColor: `${VENDOR_STATUS_COLORS[v.status]}40`,
                    background: "rgba(15, 23, 42, 0.7)",
                  }}
                  aria-label={`Update status for ${v.name}`}
                >
                  {Object.entries(VENDOR_STATUS_LABELS).map(([statusKey, label]) => (
                    <option key={statusKey} value={statusKey}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                {v.name}
              </h3>

              {v.rating && (
                <div style={{ marginBottom: "0.5rem", color: "#fbbf24", fontSize: "0.85rem" }}>
                  {"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.35rem", fontSize: "0.78rem" }}>
                    ({v.rating}/5)
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {v.contact && (
                  <p style={{ color: "var(--text-secondary)" }}>
                    👤 {v.contact}
                  </p>
                )}
                {v.email && (
                  <p>
                    <a
                      href={`mailto:${v.email}`}
                      style={{ color: "#818cf8", textDecoration: "none" }}
                    >
                      ✉️ {v.email}
                    </a>
                  </p>
                )}
                {v.phone && (
                  <p>
                    <a
                      href={`tel:${v.phone}`}
                      style={{ color: "#818cf8", textDecoration: "none" }}
                    >
                      📞 {v.phone}
                    </a>
                  </p>
                )}
                {v.notes && (
                  <p style={{ color: "var(--text-muted)", marginTop: "0.35rem", fontStyle: "italic", fontSize: "0.82rem" }}>
                    &ldquo;{v.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.25rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Quoted Cost
                </span>
                <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {v.cost !== null ? formatCurrency(v.cost) : "Quote Pending"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => onOpenEditModal(v)}
                  className="btn btn-secondary btn-sm"
                  aria-label={`Edit ${v.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteVendor(v.id)}
                  className="btn btn-danger btn-sm"
                  aria-label={`Delete ${v.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVendors.length === 0 && (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No vendors match this filter. Add a new vendor or reset the filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
