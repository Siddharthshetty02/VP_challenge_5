"use client";

import type { EventWithDetails } from "@/types/event";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { BUDGET_CATEGORY_LABELS, BUDGET_CATEGORY_COLORS, type BudgetCategory } from "@/types/budget";
import { TIMELINE_PHASE_LABELS, TIMELINE_PHASE_COLORS } from "@/types/timeline";

interface EventOverviewTabProps {
  event: EventWithDetails;
  onSelectTab: (tab: "budget" | "timeline" | "vendors" | "ideas" | "ai") => void;
  onToggleMilestone: (id: string, completed: boolean) => void;
}

export function EventOverviewTab({
  event,
  onSelectTab,
  onToggleMilestone,
}: EventOverviewTabProps) {
  // Financial calculations
  const totalEstimated = event.budgetItems.reduce((acc, i) => acc + i.estimated, 0);
  const totalActual = event.budgetItems.reduce((acc, i) => acc + (i.actual || 0), 0);
  const remainingBudget = event.totalBudget - totalEstimated;
  const budgetUtilizationPct =
    event.totalBudget > 0 ? Math.min(100, Math.round((totalEstimated / event.totalBudget) * 100)) : 0;

  // Milestone calculations
  const completedMilestones = event.milestones.filter((m) => m.completed).length;
  const totalMilestones = event.milestones.length;
  const milestonePct =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Vendor calculations
  const bookedVendors = event.vendors.filter((v) => v.status === "BOOKED" || v.status === "PAID").length;
  const totalVendors = event.vendors.length;

  // Countdown calculations
  const eventDate = new Date(event.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  event.budgetItems.forEach((b) => {
    categoryMap[b.category] = (categoryMap[b.category] || 0) + b.estimated;
  });

  return (
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading" className="sr-only">
        Event Executive Overview
      </h2>

      {/* Top 4 Metric Highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Metric 1: Budget Utilization */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Budget Utilization
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: remainingBudget >= 0 ? "var(--status-success)" : "var(--status-danger)" }}>
              {remainingBudget >= 0 ? `${formatCurrency(remainingBudget)} left` : `${formatCurrency(Math.abs(remainingBudget))} over`}
            </span>
          </div>
          <p style={{ fontSize: "1.85rem", fontWeight: 800, color: "#818cf8" }}>
            {formatCurrency(totalEstimated)}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            of {formatCurrency(event.totalBudget)} allocated target
          </p>
          <div className="progress-container">
            <div
              className="progress-fill"
              style={{
                width: `${budgetUtilizationPct}%`,
                background: remainingBudget >= 0 ? "var(--primary)" : "var(--status-danger)",
              }}
            />
          </div>
        </div>

        {/* Metric 2: Actual Spent */}
        <div className="card">
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Actual Spend Realized
          </span>
          <p style={{ fontSize: "1.85rem", fontWeight: 800, marginTop: "0.25rem", color: "#34d399" }}>
            {formatCurrency(totalActual)}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {event.budgetItems.filter((i) => i.actual !== null).length} of {event.budgetItems.length} items invoiced/paid
          </p>
        </div>

        {/* Metric 3: Milestones Completed */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Planning Progress
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c084fc" }}>
              {milestonePct}%
            </span>
          </div>
          <p style={{ fontSize: "1.85rem", fontWeight: 800, color: "#c084fc" }}>
            {completedMilestones} / {totalMilestones}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            milestones finalized
          </p>
          <div className="progress-container">
            <div
              className="progress-fill"
              style={{ width: `${milestonePct}%`, background: "var(--accent-birthday)" }}
            />
          </div>
        </div>

        {/* Metric 4: Days Remaining / Countdown */}
        <div className="card">
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Event Countdown
          </span>
          <p style={{ fontSize: "1.85rem", fontWeight: 800, marginTop: "0.25rem", color: diffDays > 0 ? "#fbbf24" : "var(--text-muted)" }}>
            {diffDays > 0 ? `${diffDays} Days` : diffDays === 0 ? "Today! 🎉" : "Past Event"}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Target: {formatDate(event.date)}
          </p>
        </div>
      </div>

      {/* Two Column Section: Budget Allocation & Upcoming Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {/* Left: Category Allocations */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Category Allocations
            </h3>
            <button
              onClick={() => onSelectTab("budget")}
              className="btn btn-secondary btn-sm"
            >
              Full Budget →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {Object.entries(categoryMap).map(([cat, amount]) => {
              const label = BUDGET_CATEGORY_LABELS[cat as BudgetCategory] || cat;
              const color = BUDGET_CATEGORY_COLORS[cat as BudgetCategory] || "#94a3b8";
              const pct = event.totalBudget > 0 ? ((amount / event.totalBudget) * 100).toFixed(1) : 0;

              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-container" style={{ height: "6px" }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, Number(pct))}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(categoryMap).length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
                No budget line items yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Upcoming Milestones & Vendor Progress */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Milestone Checklist Preview
            </h3>
            <button
              onClick={() => onSelectTab("timeline")}
              className="btn btn-secondary btn-sm"
            >
              All Milestones →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {event.milestones.slice(0, 5).map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  background: "rgba(15, 23, 42, 0.4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => onToggleMilestone(m.id, m.completed)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary)", cursor: "pointer" }}
                    aria-label={`Mark milestone ${m.title} as completed`}
                  />
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      textDecoration: m.completed ? "line-through" : "none",
                      color: m.completed ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                  >
                    {m.title}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: `${TIMELINE_PHASE_COLORS[m.phase]}20`,
                    color: TIMELINE_PHASE_COLORS[m.phase],
                  }}
                >
                  {TIMELINE_PHASE_LABELS[m.phase]}
                </span>
              </div>
            ))}

            {event.milestones.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
                No milestones scheduled yet.
              </p>
            )}
          </div>

          {/* Quick Vendor Ratio Card */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Vendor Procurement
              </p>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {bookedVendors} of {totalVendors} vendors locked & confirmed
              </p>
            </div>
            <button
              onClick={() => onSelectTab("vendors")}
              className="btn btn-secondary btn-sm"
            >
              Manage Vendors →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
