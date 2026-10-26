"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { EventWithDetails } from "@/types/event";
import type { BudgetCategory } from "@/types/budget";
import type { TimelinePhase } from "@/types/timeline";
import type { VendorStatus } from "@/types/vendor";
import {
  formatCurrency,
  formatDate,
  getEventTypeIcon,
  formatCategory,
} from "@/lib/utils/format";
import {
  BUDGET_CATEGORY_LABELS,
  BUDGET_CATEGORY_COLORS,
} from "@/types/budget";
import {
  TIMELINE_PHASE_LABELS,
  TIMELINE_PHASE_COLORS,
} from "@/types/timeline";
import {
  VENDOR_STATUS_LABELS,
  VENDOR_STATUS_COLORS,
} from "@/types/vendor";

// Dynamically import Recharts component to avoid SSR hydration issues
const BudgetDonutChart = dynamic(
  () =>
    import("@/components/budget/BudgetDonutChart").then(
      (mod) => mod.BudgetDonutChart
    ),
  { ssr: false }
);

interface CreativeIdeaItem {
  title: string;
  category: string;
  description: string;
  estimatedCost: number;
}

interface IdeasDataResponse {
  creativeIdeas?: CreativeIdeaItem[];
  signatureDrinkOrSnack?: string;
  playlistVibe?: string;
  recommendedColorPalette?: string[];
}

type TabType = "overview" | "budget" | "timeline" | "vendors" | "ideas" | "ai";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiIdeasData, setAiIdeasData] = useState<IdeasDataResponse | null>(null);

  // Modals for adding items
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  // New Budget Form
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetCategory, setNewBudgetCategory] = useState<BudgetCategory>("VENUE");
  const [newBudgetEstimated, setNewBudgetEstimated] = useState(1000);
  const [newBudgetActual, setNewBudgetActual] = useState<number | "">("");
  const [newBudgetNotes, setNewBudgetNotes] = useState("");

  // New Milestone Form
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestonePhase, setNewMilestonePhase] = useState<TimelinePhase>("PLANNING");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");

  // New Vendor Form
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("Catering");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorCost, setNewVendorCost] = useState<number | "">("");
  const [newVendorStatus, setNewVendorStatus] = useState<VendorStatus>("RESEARCHING");

  // Vendor filter
  const [vendorFilter, setVendorFilter] = useState<"ALL" | VendorStatus>("ALL");

  // AI Chat Assistant
  const [chatPrompt, setChatPrompt] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your GenAI Event Planning Assistant. Ask me anything about budgeting, vendor negotiation, timeline pacing, or tailored ideas for your event!",
    },
  ]);

  const loadEventDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const json = await res.json();
      if (json.success) {
        setEvent(json.data);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to load event details:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    if (eventId) {
      void loadEventDetails();
    }
  }, [eventId, loadEventDetails]);

  // --- ACTIONS ---

  async function handleToggleMilestone(milestoneId: string, currentCompleted: boolean) {
    if (!event) return;
    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setEvent({
      ...event,
      milestones: event.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: newCompleted } : m
      ),
    });

    try {
      await fetch(`/api/events/${eventId}/timeline/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch (err) {
      console.error("Failed to update milestone status:", err);
      loadEventDetails();
    }
  }

  async function handleAddBudgetItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newBudgetName.trim()) return;

    try {
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newBudgetCategory,
          name: newBudgetName.trim(),
          estimated: Number(newBudgetEstimated),
          actual: newBudgetActual !== "" ? Number(newBudgetActual) : null,
          notes: newBudgetNotes.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddBudgetModal(false);
        setNewBudgetName("");
        setNewBudgetNotes("");
        loadEventDetails();
      }
    } catch (err) {
      console.error("Failed to create budget item:", err);
    }
  }

  async function handleDeleteBudgetItem(itemId: string) {
    if (!confirm("Are you sure you want to remove this budget line item?")) return;
    try {
      await fetch(`/api/events/${eventId}/budget/${itemId}`, { method: "DELETE" });
      loadEventDetails();
    } catch (err) {
      console.error("Failed to delete budget item:", err);
    }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;

    try {
      const res = await fetch(`/api/events/${eventId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMilestoneTitle.trim(),
          dueDate: new Date(newMilestoneDate).toISOString(),
          phase: newMilestonePhase,
          description: newMilestoneDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddMilestoneModal(false);
        setNewMilestoneTitle("");
        setNewMilestoneDesc("");
        setNewMilestoneDate("");
        loadEventDetails();
      }
    } catch (err) {
      console.error("Failed to create milestone:", err);
    }
  }

  async function handleDeleteMilestone(itemId: string) {
    if (!confirm("Delete this milestone?")) return;
    try {
      await fetch(`/api/events/${eventId}/timeline/${itemId}`, { method: "DELETE" });
      loadEventDetails();
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    try {
      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVendorName.trim(),
          category: newVendorCategory.trim(),
          contact: newVendorContact.trim(),
          email: newVendorEmail.trim(),
          cost: newVendorCost !== "" ? Number(newVendorCost) : null,
          status: newVendorStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddVendorModal(false);
        setNewVendorName("");
        setNewVendorContact("");
        setNewVendorEmail("");
        setNewVendorCost("");
        loadEventDetails();
      }
    } catch (err) {
      console.error("Failed to add vendor:", err);
    }
  }

  async function handleUpdateVendorStatus(vendorId: string, status: VendorStatus) {
    try {
      await fetch(`/api/events/${eventId}/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadEventDetails();
    } catch (err) {
      console.error("Failed to update vendor status:", err);
    }
  }

  async function handleDeleteVendor(itemId: string) {
    if (!confirm("Remove this vendor?")) return;
    try {
      await fetch(`/api/events/${eventId}/vendors/${itemId}`, { method: "DELETE" });
      loadEventDetails();
    } catch (err) {
      console.error("Failed to delete vendor:", err);
    }
  }

  async function handleTriggerAIGeneration() {
    if (!event) return;
    try {
      setIsGeneratingAI(true);
      setAiMessage("Synthesizing tailored plan with GenAI Assistant...");

      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          eventType: event.type,
          guestCount: event.guestCount,
          totalBudget: event.totalBudget,
          date: event.date,
          location: event.location,
          preferences: event.description,
          applyToEvent: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAiMessage("Plan generated and applied successfully!");
        loadEventDetails();
        setTimeout(() => setAiMessage(null), 4000);
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      setAiMessage("Failed to generate plan. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  }

  async function handleLoadIdeas() {
    if (!event) return;
    try {
      setIsGeneratingAI(true);
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          eventType: event.type,
          guestCount: event.guestCount,
          budget: event.totalBudget,
          theme: event.description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiIdeasData(json.data);
      }
    } catch (err) {
      console.error("Failed to load ideas:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  }

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatPrompt.trim() || !event || isChatLoading) return;

    const userText = chatPrompt.trim();
    const updatedMessages = [...chatMessages, { sender: "user" as const, text: userText }];
    setChatMessages(updatedMessages);
    setChatPrompt("");
    setIsChatLoading(true);

    try {
      const budgetSummary = event.budgetItems?.length
        ? event.budgetItems.map((b) => `${b.category}: $${b.estimated}`).join(", ")
        : `Total budget: $${event.totalBudget}`;
      const milestonesSummary = event.milestones?.length
        ? event.milestones.map((m) => `${m.title} (${m.completed ? "Done" : "Pending"})`).join(", ")
        : "None yet";
      const vendorsSummary = event.vendors?.length
        ? event.vendors.map((v) => `${v.name} (${v.category}, ${v.status})`).join(", ")
        : "None yet";

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          messages: updatedMessages,
          eventContext: {
            name: event.name,
            type: event.type,
            date: event.date,
            location: event.location,
            guestCount: event.guestCount,
            totalBudget: event.totalBudget,
            description: event.description,
            budgetBreakdownSummary: budgetSummary,
            milestonesSummary,
            vendorsSummary,
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.reply) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: json.data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: "I encountered an issue generating a response. Please try again." },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Connection error. Please check your network and try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  function exportPlanJson() {
    if (!event) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${event.name.replace(/\s+/g, "_")}_Plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  async function handleDeleteEvent() {
    if (!confirm(`Are you completely sure you want to delete "${event?.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  }

  if (loading || !event) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "6rem 0" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
          Loading event intelligence...
        </p>
      </div>
    );
  }

  // Financial calculations
  const totalEstimated = event.budgetItems.reduce((acc, i) => acc + i.estimated, 0);
  const totalActual = event.budgetItems.reduce((acc, i) => acc + (i.actual || 0), 0);
  const remainingBudget = event.totalBudget - totalEstimated;
  const budgetUtilizationPct = event.totalBudget > 0 ? (totalEstimated / event.totalBudget) * 100 : 0;

  // Milestone statistics
  const completedMilestones = event.milestones.filter((m) => m.completed).length;
  const totalMilestones = event.milestones.length;
  const milestonePct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Filtered vendors
  const filteredVendors =
    vendorFilter === "ALL"
      ? event.vendors
      : event.vendors.filter((v) => v.status === vendorFilter);

  const badgeClass =
    event.type === "WEDDING"
      ? "badge-wedding"
      : event.type === "BIRTHDAY"
      ? "badge-birthday"
      : "badge-community";

  return (
    <div className="app-container">
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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span className={`badge ${badgeClass}`}>
                <span>{getEventTypeIcon(event.type)}</span>
                <span>{event.type}</span>
              </span>
              <span className="badge badge-status">{event.status}</span>
            </div>

            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              {event.name}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              <span>📅 {formatDate(event.date, "EEEE, MMMM d, yyyy")}</span>
              <span>📍 {event.location || "Location TBD"}</span>
              <span>👥 {event.guestCount} Guests</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleTriggerAIGeneration}
              disabled={isGeneratingAI}
              className="btn btn-ai"
              aria-label="Regenerate Plan with GenAI"
            >
              <span>✨</span>
              <span>{isGeneratingAI ? "Synthesizing..." : "AI Auto-Plan"}</span>
            </button>

            <button
              onClick={exportPlanJson}
              className="btn btn-secondary"
              aria-label="Export Plan JSON"
            >
              <span>📥</span> Export
            </button>

            <button
              onClick={handleDeleteEvent}
              className="btn btn-danger btn-sm"
              aria-label="Delete Event"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>

        {/* Global AI status banner */}
        {aiMessage && (
          <div className="alert-banner alert-success" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
            <span>🪄</span> {aiMessage}
          </div>
        )}

        {/* Summary Gauge Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Budget
            </span>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {formatCurrency(event.totalBudget)}
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Allocated (Estimated)
            </span>
            <p
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: remainingBudget < 0 ? "var(--status-danger)" : "#818cf8",
              }}
            >
              {formatCurrency(totalEstimated)}
            </p>
            <div className="progress-container" style={{ marginTop: "0.35rem" }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, budgetUtilizationPct)}%`,
                  background: remainingBudget < 0 ? "var(--status-danger)" : "var(--primary)",
                }}
              />
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Invoiced Actual
            </span>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "#38bdf8" }}>
              {formatCurrency(totalActual)}
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Remaining Buffer
            </span>
            <p
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: remainingBudget >= 0 ? "var(--status-success)" : "var(--status-danger)",
              }}
            >
              {formatCurrency(remainingBudget)}
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Milestones Progress
            </span>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "#34d399" }}>
              {completedMilestones} / {totalMilestones} ({milestonePct.toFixed(0)}%)
            </p>
            <div className="progress-container" style={{ marginTop: "0.35rem" }}>
              <div className="progress-fill" style={{ width: `${milestonePct}%`, background: "var(--status-success)" }} />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav aria-label="Event Sections" className="tabs-nav">
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "budget", label: `💰 Budget (${event.budgetItems.length})` },
          { id: "timeline", label: `⏱️ Timeline (${event.milestones.length})` },
          { id: "vendors", label: `🤝 Vendors (${event.vendors.length})` },
          { id: "ideas", label: "💡 Personalized Ideas" },
          { id: "ai", label: "✨ AI Assistant Chat" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              if (tab.id === "ideas" && !aiIdeasData) {
                handleLoadIdeas();
              }
            }}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="sr-only">
            Event Overview
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Left: Budget Chart Overview */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Budget Allocation Breakdown</h3>
                <button onClick={() => setActiveTab("budget")} className="btn btn-secondary btn-sm">
                  View Full Budget →
                </button>
              </div>
              <BudgetDonutChart items={event.budgetItems} totalBudget={event.totalBudget} />
            </div>

            {/* Right: Upcoming Milestones & Priority Vendors */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Immediate Timeline Focus</h3>
                  <button onClick={() => setActiveTab("timeline")} className="btn btn-secondary btn-sm">
                    All Milestones →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {event.milestones
                    .filter((m) => !m.completed)
                    .slice(0, 3)
                    .map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.6rem 0.8rem",
                          background: "rgba(15, 23, 42, 0.5)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => handleToggleMilestone(m.id, m.completed)}
                            style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }}
                            aria-label={`Mark milestone '${m.title}' completed`}
                          />
                          <div>
                            <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>{m.title}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDate(m.dueDate)}</p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {TIMELINE_PHASE_LABELS[m.phase]}
                        </span>
                      </div>
                    ))}

                  {event.milestones.filter((m) => !m.completed).length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      All milestones marked as completed! 🥳
                    </p>
                  )}
                </div>
              </div>

              {/* Vendors Spotlight */}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Key Vendors Status</h3>
                  <button onClick={() => setActiveTab("vendors")} className="btn btn-secondary btn-sm">
                    Manage Vendors →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {event.vendors.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        background: "rgba(15, 23, 42, 0.5)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{v.name}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                          ({v.category})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: `${VENDOR_STATUS_COLORS[v.status]}20`,
                          color: VENDOR_STATUS_COLORS[v.status],
                          border: `1px solid ${VENDOR_STATUS_COLORS[v.status]}40`,
                        }}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                  {event.vendors.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No vendors added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BUDGETS */}
      {/* ========================================================= */}
      {activeTab === "budget" && (
        <section aria-labelledby="budget-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 id="budget-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                Budget Management
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Track estimated projections against real invoiced actuals across all event categories.
              </p>
            </div>
            <button onClick={() => setShowAddBudgetModal(true)} className="btn btn-primary">
              <span>➕</span> Add Budget Line
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(15, 23, 42, 0.6)", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "1rem" }}>Item & Category</th>
                  <th style={{ padding: "1rem" }}>Estimated Cost</th>
                  <th style={{ padding: "1rem" }}>Actual Cost</th>
                  <th style={{ padding: "1rem" }}>Variance</th>
                  <th style={{ padding: "1rem" }}>Notes</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {event.budgetItems.map((item) => {
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
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{formatCurrency(item.estimated)}</td>
                      <td style={{ padding: "1rem" }}>
                        {item.actual !== null ? (
                          <span style={{ fontWeight: 600 }}>{formatCurrency(item.actual)}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {item.actual !== null ? (
                          <span
                            style={{
                              fontWeight: 600,
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
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          className="btn btn-danger btn-sm"
                          aria-label={`Delete ${item.name}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {event.budgetItems.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No budget items found. Click &quot;Add Budget Line&quot; or use the AI Auto-Plan button!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TIMELINES */}
      {/* ========================================================= */}
      {activeTab === "timeline" && (
        <section aria-labelledby="timeline-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 id="timeline-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                Milestone Timeline
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Organize deliverables across key phases from Initial Vision through Day-of Execution.
              </p>
            </div>
            <button onClick={() => setShowAddMilestoneModal(true)} className="btn btn-primary">
              <span>➕</span> Add Milestone
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {event.milestones.map((m) => (
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
                  onChange={() => handleToggleMilestone(m.id, m.completed)}
                  style={{
                    width: "22px",
                    height: "22px",
                    accentColor: "var(--primary)",
                    marginTop: "0.2rem",
                    cursor: "pointer",
                  }}
                  aria-label={`Toggle ${m.title}`}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {m.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="btn btn-danger btn-sm"
                        aria-label={`Delete milestone ${m.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span>Target Due Date: {formatDate(m.dueDate, "MMMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            ))}

            {event.milestones.length === 0 && (
              <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "var(--text-muted)" }}>
                  No milestones added yet. Add your first milestone or generate one with the AI Auto-Plan.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 4: VENDOR CHECKLISTS */}
      {/* ========================================================= */}
      {activeTab === "vendors" && (
        <section aria-labelledby="vendors-heading">
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
                Vendor Checklist & Directory
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Manage negotiations, contact details, quotes, and booking confirmations.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <select
                className="form-select"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value as "ALL" | VendorStatus)}
                style={{ width: "auto" }}
                aria-label="Filter vendors by status"
              >
                <option value="ALL">All Vendor Statuses</option>
                <option value="RESEARCHING">Researching</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUOTED">Quoted</option>
                <option value="BOOKED">Booked</option>
                <option value="PAID">Paid</option>
              </select>

              <button onClick={() => setShowAddVendorModal(true)} className="btn btn-primary">
                <span>➕</span> Add Vendor
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filteredVendors.map((v) => (
              <div key={v.id} className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase" }}>
                      {v.category}
                    </span>
                    <select
                      className="form-select"
                      value={v.status}
                      onChange={(e) => handleUpdateVendorStatus(v.id, e.target.value as VendorStatus)}
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        width: "auto",
                        color: VENDOR_STATUS_COLORS[v.status],
                        borderColor: `${VENDOR_STATUS_COLORS[v.status]}40`,
                      }}
                      aria-label={`Change status for ${v.name}`}
                    >
                      <option value="RESEARCHING">Researching</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUOTED">Quoted</option>
                      <option value="BOOKED">Booked</option>
                      <option value="PAID">Paid</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.35rem" }}>{v.name}</h3>
                  {v.contact && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>👤 {v.contact}</p>}
                  {v.email && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>✉️ {v.email}</p>}
                  {v.phone && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>📞 {v.phone}</p>}
                  {v.notes && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem", fontStyle: "italic" }}>&ldquo;{v.notes}&rdquo;</p>}
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
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {v.cost !== null ? formatCurrency(v.cost) : "No quote yet"}
                  </span>
                  <button
                    onClick={() => handleDeleteVendor(v.id)}
                    className="btn btn-danger btn-sm"
                    aria-label={`Delete vendor ${v.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredVendors.length === 0 && (
              <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
                <p style={{ color: "var(--text-muted)" }}>No vendors match this filter.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PERSONALIZED IDEAS */}
      {/* ========================================================= */}
      {activeTab === "ideas" && (
        <section aria-labelledby="ideas-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 id="ideas-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                Personalized Creative Ideas & Concepts
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                AI-curated signature drinks, decor installations, and guest experiences designed specifically for your event.
              </p>
            </div>
            <button onClick={handleLoadIdeas} disabled={isGeneratingAI} className="btn btn-ai">
              <span>✨</span> {isGeneratingAI ? "Generating..." : "Generate Fresh Ideas"}
            </button>
          </div>

          {/* AI Color Palette & Signature Concept */}
          {aiIdeasData && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div className="card" style={{ background: "rgba(99, 102, 241, 0.08)" }}>
                <span style={{ fontSize: "0.8rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
                  Signature Concept
                </span>
                <p style={{ fontSize: "1.15rem", fontWeight: 700, marginTop: "0.35rem" }}>
                  🍸 {aiIdeasData.signatureDrinkOrSnack}
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  A bespoke hospitality highlight to surprise and delight guests upon arrival.
                </p>
              </div>

              <div className="card" style={{ background: "rgba(168, 85, 247, 0.08)" }}>
                <span style={{ fontSize: "0.8rem", color: "#d8b4fe", fontWeight: 700, textTransform: "uppercase" }}>
                  Atmosphere & Music Vibe
                </span>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.35rem" }}>
                  🎵 {aiIdeasData.playlistVibe}
                </p>
              </div>
            </div>
          )}

          {/* Ideas Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {(aiIdeasData?.creativeIdeas || [
              {
                title: "Memory Lane Photo Tunnel",
                category: "Decor",
                description: "An illuminated entryway draped in fairy lights and archival photos celebrating the couple or guest of honor.",
                estimatedCost: 350,
              },
              {
                title: "Live Vinyl DJ Station",
                category: "Entertainment",
                description: "Guests can flip through wooden crates of vintage records and hand songs directly to the DJ.",
                estimatedCost: 800,
              },
              {
                title: "Midnight Gourmet Slider Bar",
                category: "Food & Drink",
                description: "Warm brioche truffle smash burgers served as the party hits its peak dancing hour.",
                estimatedCost: 450,
              },
            ]).map((idea: CreativeIdeaItem, idx: number) => (
              <div key={idx} className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#c084fc",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {idea.category}
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{idea.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {idea.description}
                  </p>
                </div>
                <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Est. Cost: <strong style={{ color: "var(--text-primary)" }}>{formatCurrency(idea.estimatedCost)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 6: GENAI ASSISTANT CHAT */}
      {/* ========================================================= */}
      {activeTab === "ai" && (
        <section aria-labelledby="ai-chat-heading">
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--ai-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                ✨
              </div>
              <div>
                <h2 id="ai-chat-heading" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  EventGenie AI Copilot
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Direct consulting for your {event.name}
                </p>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                minHeight: "340px",
                maxHeight: "450px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1rem",
                border: "1px solid var(--border)",
              }}
              role="log"
              aria-live="polite"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: msg.sender === "user" ? "var(--primary)" : "var(--bg-elevated)",
                    color: "#ffffff",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-lg)",
                    borderBottomRightRadius: msg.sender === "user" ? "2px" : "var(--radius-lg)",
                    borderBottomLeftRadius: msg.sender === "ai" ? "2px" : "var(--radius-lg)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              ))}

              {isChatLoading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "80%",
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-lg)",
                    borderBottomLeftRadius: "2px",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                  <span>Consulting EventGenie AI...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                className="form-input"
                placeholder={isChatLoading ? "Thinking..." : "Ask e.g., 'How can I trim $1,500 from catering?' or 'Suggest 3 icebreaker games'..."}
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                disabled={isChatLoading}
                aria-label="Ask AI Assistant"
              />
              <button type="submit" className="btn btn-ai" disabled={isChatLoading || !chatPrompt.trim()}>
                {isChatLoading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD BUDGET ITEM */}
      {/* ========================================================= */}
      {showAddBudgetModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-budget-title">
          <div className="modal-content">
            <h3 id="add-budget-title" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
              Add Budget Line Item
            </h3>
            <form onSubmit={handleAddBudgetItem}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DJ Sound Rig & Lights"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value as BudgetCategory)}
                >
                  {Object.entries(BUDGET_CATEGORY_LABELS).map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Estimated Cost ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-input"
                    value={newBudgetEstimated}
                    onChange={(e) => setNewBudgetEstimated(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Actual Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-input"
                    placeholder="Leave empty if pending"
                    value={newBudgetActual}
                    onChange={(e) => setNewBudgetActual(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vendor name, terms, deposit info..."
                  value={newBudgetNotes}
                  onChange={(e) => setNewBudgetNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowAddBudgetModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Line Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MILESTONE */}
      {/* ========================================================= */}
      {showAddMilestoneModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-milestone-title">
          <div className="modal-content">
            <h3 id="add-milestone-title" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
              Add Timeline Milestone
            </h3>
            <form onSubmit={handleAddMilestone}>
              <div className="form-group">
                <label className="form-label">Milestone Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mail Out Save-The-Dates"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Planning Phase *</label>
                  <select
                    className="form-select"
                    value={newMilestonePhase}
                    onChange={(e) => setNewMilestonePhase(e.target.value as TimelinePhase)}
                  >
                    {Object.entries(TIMELINE_PHASE_LABELS).map(([phase, label]) => (
                      <option key={phase} value={phase}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description & Action Steps</label>
                <textarea
                  className="form-textarea"
                  placeholder="Specific tasks or checklist items to complete this milestone..."
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowAddMilestoneModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD VENDOR */}
      {/* ========================================================= */}
      {showAddVendorModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-vendor-title">
          <div className="modal-content">
            <h3 id="add-vendor-title" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
              Add Vendor to Directory
            </h3>
            <form onSubmit={handleAddVendor}>
              <div className="form-group">
                <label className="form-label">Vendor Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Sound & Lights"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Service Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Catering, DJ, Florist"
                    value={newVendorCategory}
                    onChange={(e) => setNewVendorCategory(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={newVendorStatus}
                    onChange={(e) => setNewVendorStatus(e.target.value as VendorStatus)}
                  >
                    {Object.entries(VENDOR_STATUS_LABELS).map(([st, label]) => (
                      <option key={st} value={st}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Representative name"
                    value={newVendorContact}
                    onChange={(e) => setNewVendorContact(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quoted / Agreed Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="form-input"
                    placeholder="e.g. 2500"
                    value={newVendorCost}
                    onChange={(e) => setNewVendorCost(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="vendor@company.com"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowAddVendorModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
