"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { BudgetItem, BudgetCategory } from "@/types/budget";
import { formatCurrency, formatCategory } from "@/lib/utils/format";
import { BUDGET_CATEGORY_LABELS, BUDGET_CATEGORY_COLORS } from "@/types/budget";

const BudgetDonutChart = dynamic(
  () => import("@/components/budget/BudgetDonutChart").then((mod) => mod.BudgetDonutChart),
  { ssr: false }
);

interface BudgetTabProps {
  items: BudgetItem[];
  totalBudget: number;
  eventName: string;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: BudgetItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export function BudgetTab({
  items,
  totalBudget,
  eventName,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteItem,
}: BudgetTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | BudgetCategory>("ALL");
  const [varianceFilter, setVarianceFilter] = useState<"ALL" | "OVER" | "UNDER" | "PENDING">("ALL");

  // Totals calculations
  const totalEstimated = items.reduce((acc, i) => acc + i.estimated, 0);
  const totalActual = items.reduce((acc, i) => acc + (i.actual || 0), 0);
  const netVariance = totalBudget - totalEstimated;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

    let matchesVariance = true;
    if (varianceFilter === "OVER") {
      matchesVariance = item.actual !== null && item.actual > item.estimated;
    } else if (varianceFilter === "UNDER") {
      matchesVariance = item.actual !== null && item.actual <= item.estimated;
    } else if (varianceFilter === "PENDING") {
      matchesVariance = item.actual === null;
    }

    return matchesSearch && matchesCategory && matchesVariance;
  });

  // Export to CSV function
  function exportBudgetToCsv() {
    const headers = ["Item Name", "Category", "Estimated Cost ($)", "Actual Cost ($)", "Variance ($)", "Notes"];
    const rows = items.map((i) => {
      const varVal = i.actual !== null ? i.estimated - i.actual : "";
      return [
        `"${i.name.replace(/"/g, '""')}"`,
        `"${formatCategory(i.category)}"`,
        i.estimated,
        i.actual !== null ? i.actual : "",
        varVal,
        `"${(i.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventName.replace(/\s+/g, "_")}_Budget.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section aria-labelledby="budget-heading">
      {/* Tab Header & Action Controls */}
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
          <h2 id="budget-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Budget & Expense Ledger
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Compare planned allocations against actual vendor invoices with automatic variance accounting.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={exportBudgetToCsv}
            className="btn btn-secondary"
            title="Download budget as a CSV spreadsheet"
            aria-label="Export budget to CSV"
          >
            <span>📊</span> Export CSV
          </button>
          <button
            onClick={onOpenAddModal}
            className="btn btn-primary"
            aria-label="Add new budget line item"
          >
            <span>➕</span> Add Line Item
          </button>
        </div>
      </div>

      {/* Top Chart & Financial Summary Split */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Donut Chart Visualizer */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Expense Distribution by Category
          </h3>
          <BudgetDonutChart items={items} totalBudget={totalBudget} />
        </div>

        {/* 4 Financial Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="card">
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Total Target
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              {formatCurrency(totalBudget)}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Allocated ceiling
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Total Estimated
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#818cf8", marginTop: "0.25rem" }}>
              {formatCurrency(totalEstimated)}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {items.length} line items
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Actual Paid / Invoiced
            </span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399", marginTop: "0.25rem" }}>
              {formatCurrency(totalActual)}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Realized cost
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Available Balance
            </span>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: netVariance >= 0 ? "var(--status-success)" : "var(--status-danger)",
                marginTop: "0.25rem",
              }}
            >
              {netVariance >= 0 ? formatCurrency(netVariance) : `-${formatCurrency(Math.abs(netVariance))}`}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {netVariance >= 0 ? "Under budget" : "Exceeds allocation"}
            </p>
          </div>
        </div>
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
            placeholder="Search items or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "280px" }}
            aria-label="Search budget items"
          />

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "ALL" | BudgetCategory)}
            style={{ width: "auto" }}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(BUDGET_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={varianceFilter}
            onChange={(e) => setVarianceFilter(e.target.value as "ALL" | "OVER" | "UNDER" | "PENDING")}
            style={{ width: "auto" }}
            aria-label="Filter by variance"
          >
            <option value="ALL">All Invoices</option>
            <option value="UNDER">Under / On Budget</option>
            <option value="OVER">Over Budget</option>
            <option value="PENDING">Pending Actual Quote</option>
          </select>
        </div>

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Showing {filteredItems.length} of {items.length} items
        </span>
      </div>

      {/* Granular Budget Line-Items Table */}
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(15, 23, 42, 0.6)" }}>
              <th style={{ padding: "1rem" }}>Item & Category</th>
              <th style={{ padding: "1rem" }}>Estimated Cost</th>
              <th style={{ padding: "1rem" }}>Actual Invoice</th>
              <th style={{ padding: "1rem" }}>Variance</th>
              <th style={{ padding: "1rem" }}>Contract Notes</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const variance = item.actual !== null ? item.estimated - item.actual : 0;
              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    fontSize: "0.95rem",
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    <p style={{ fontWeight: 600 }}>{item.name}</p>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: BUDGET_CATEGORY_COLORS[item.category] || "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      {formatCategory(item.category)}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {formatCurrency(item.estimated)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {item.actual !== null ? (
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {formatCurrency(item.actual)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {item.actual !== null ? (
                      <span
                        style={{
                          fontWeight: 700,
                          color: variance >= 0 ? "var(--status-success)" : "var(--status-danger)",
                        }}
                      >
                        {variance >= 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "250px" }}>
                    {item.notes || "—"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => onOpenEditModal(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: "0.5rem" }}
                      aria-label={`Edit ${item.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="btn btn-danger btn-sm"
                      aria-label={`Delete ${item.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No budget items match your current filter. Click &quot;Add Line Item&quot; or clear search filters.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr style={{ background: "rgba(15, 23, 42, 0.8)", borderTop: "2px solid var(--border)", fontWeight: 700 }}>
                <td style={{ padding: "1rem" }}>Total ({items.length} items)</td>
                <td style={{ padding: "1rem", color: "#818cf8" }}>{formatCurrency(totalEstimated)}</td>
                <td style={{ padding: "1rem", color: "#34d399" }}>{formatCurrency(totalActual)}</td>
                <td
                  style={{
                    padding: "1rem",
                    color: netVariance >= 0 ? "var(--status-success)" : "var(--status-danger)",
                  }}
                >
                  {netVariance >= 0 ? `+${formatCurrency(netVariance)}` : formatCurrency(netVariance)}
                </td>
                <td colSpan={2} style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Budget Ceiling: {formatCurrency(totalBudget)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
