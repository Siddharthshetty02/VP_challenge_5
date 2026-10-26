"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BUDGET_CATEGORY_COLORS, BUDGET_CATEGORY_LABELS, type BudgetCategory, type BudgetItem } from "@/types/budget";
import { formatCurrency } from "@/lib/utils/format";

interface BudgetDonutChartProps {
  items: BudgetItem[];
  totalBudget: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: {
    color: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  totalBudget?: number;
}

function CustomTooltip({ active, payload, totalBudget = 0 }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const pct = totalBudget > 0 ? ((entry.value / totalBudget) * 100).toFixed(1) : 0;
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid var(--border)",
          padding: "0.6rem 0.9rem",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{entry.name}</p>
        <p style={{ color: entry.payload.color, fontWeight: 700, fontSize: "1rem" }}>
          {formatCurrency(entry.value)} ({pct}%)
        </p>
      </div>
    );
  }
  return null;
}

export function BudgetDonutChart({ items, totalBudget }: BudgetDonutChartProps) {
  // Aggregate items by category
  const categoryTotals: Record<string, number> = {};
  items.forEach((item) => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.estimated;
  });

  const data = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: BUDGET_CATEGORY_LABELS[cat as BudgetCategory] || cat,
    value: val,
    color: BUDGET_CATEGORY_COLORS[cat as BudgetCategory] || "#94a3b8",
  }));

  if (data.length === 0) {
    return (
      <div
        style={{
          height: "260px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          border: "1px dashed var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        No budget items recorded yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15, 23, 42, 0.6)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip totalBudget={totalBudget} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
