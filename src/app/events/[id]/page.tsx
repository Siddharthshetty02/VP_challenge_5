"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EventWithDetails, Event } from "@/types/event";
import type { BudgetItem, BudgetCategory } from "@/types/budget";
import type { Milestone, TimelinePhase } from "@/types/timeline";
import type { Vendor, VendorStatus } from "@/types/vendor";
import { formatCurrency, formatDate } from "@/lib/utils/format";

// Modular UI Components
import { EventHeader } from "@/components/events/EventHeader";
import { EventOverviewTab } from "@/components/events/EventOverviewTab";
import { BudgetTab } from "@/components/events/BudgetTab";
import { TimelineTab } from "@/components/events/TimelineTab";
import { VendorTab } from "@/components/events/VendorTab";
import { CreativeIdeasTab, type IdeasDataResponse } from "@/components/events/CreativeIdeasTab";
import { AICopilotTab } from "@/components/events/AICopilotTab";

// Modals
import { EditEventModal } from "@/components/modals/EditEventModal";
import { BudgetItemModal } from "@/components/modals/BudgetItemModal";
import { MilestoneModal } from "@/components/modals/MilestoneModal";
import { VendorModal } from "@/components/modals/VendorModal";

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

  // Modals state
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | null>(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // AI Copilot Chat state
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your EventGenie Assistant. Ask me anything about budgeting, vendor negotiation, timeline pacing, or tailored ideas for your event!",
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

  // ==========================================
  // EVENT LEVEL ACTIONS
  // ==========================================

  async function handleSaveEvent(updatedFields: Partial<Event>) {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const json = await res.json();
      if (json.success) {
        setAiMessage("Event parameters updated successfully.");
        setTimeout(() => setAiMessage(null), 3000);
        void loadEventDetails();
      } else {
        throw new Error(json.error || "Failed to update event.");
      }
    } catch (err) {
      console.error("Save event error:", err);
      throw err;
    }
  }

  async function handleDeleteEvent() {
    if (!confirm(`Are you completely sure you want to delete "${event?.name}"? All associated budget items, milestones, and vendors will be removed permanently.`)) {
      return;
    }
    try {
      await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  }

  // ==========================================
  // BUDGET ACTIONS
  // ==========================================

  async function handleSaveBudgetItem(data: {
    category: BudgetCategory;
    name: string;
    estimated: number;
    actual: number | null;
    notes: string;
  }) {
    if (editingBudgetItem) {
      // Update existing item
      const res = await fetch(`/api/events/${eventId}/budget/${editingBudgetItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    } else {
      // Create new item
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    }
  }

  async function handleDeleteBudgetItem(itemId: string) {
    if (!confirm("Are you sure you want to remove this budget line item?")) return;
    try {
      await fetch(`/api/events/${eventId}/budget/${itemId}`, { method: "DELETE" });
      void loadEventDetails();
    } catch (err) {
      console.error("Failed to delete budget item:", err);
    }
  }

  // ==========================================
  // TIMELINE ACTIONS
  // ==========================================

  async function handleSaveMilestone(data: {
    title: string;
    phase: TimelinePhase;
    dueDate: string;
    description: string;
  }) {
    if (editingMilestone) {
      // Update existing
      const res = await fetch(`/api/events/${eventId}/timeline/${editingMilestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    } else {
      // Create new
      const res = await fetch(`/api/events/${eventId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    }
  }

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
      console.error("Failed to toggle milestone:", err);
      void loadEventDetails();
    }
  }

  async function handleDeleteMilestone(itemId: string) {
    if (!confirm("Delete this milestone?")) return;
    try {
      await fetch(`/api/events/${eventId}/timeline/${itemId}`, { method: "DELETE" });
      void loadEventDetails();
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  }

  // ==========================================
  // VENDOR ACTIONS
  // ==========================================

  async function handleSaveVendor(data: {
    name: string;
    category: string;
    contact: string;
    email: string;
    phone: string;
    cost: number | null;
    status: VendorStatus;
    rating: number | null;
    notes: string;
  }) {
    if (editingVendor) {
      // Update existing vendor
      const res = await fetch(`/api/events/${eventId}/vendors/${editingVendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    } else {
      // Create new vendor
      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) void loadEventDetails();
    }
  }

  async function handleUpdateVendorStatus(vendorId: string, status: VendorStatus) {
    try {
      await fetch(`/api/events/${eventId}/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      void loadEventDetails();
    } catch (err) {
      console.error("Failed to update vendor status:", err);
    }
  }

  async function handleDeleteVendor(itemId: string) {
    if (!confirm("Remove this vendor from directory?")) return;
    try {
      await fetch(`/api/events/${eventId}/vendors/${itemId}`, { method: "DELETE" });
      void loadEventDetails();
    } catch (err) {
      console.error("Failed to delete vendor:", err);
    }
  }

  // ==========================================
  // AI & CHAT ACTIONS
  // ==========================================

  async function handleTriggerAIGeneration() {
    if (!event) return;
    try {
      setIsGeneratingAI(true);
      setAiMessage("Synthesizing comprehensive event plan with GenAI Assistant...");

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
        setAiMessage("Full plan generated and integrated successfully!");
        void loadEventDetails();
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

  async function handleSendChatMessage(text: string) {
    if (!event || isChatLoading) return;

    const updatedMessages = [...chatMessages, { sender: "user" as const, text }];
    setChatMessages(updatedMessages);
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

  // ==========================================
  // EXPORT UTILITIES
  // ==========================================

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

  function exportPlanMarkdown() {
    if (!event) return;
    const mdLines = [
      `# 📋 Event Plan: ${event.name}`,
      `**Event Type:** ${event.type}`,
      `**Target Date:** ${formatDate(event.date, "EEEE, MMMM d, yyyy")}`,
      `**Location:** ${event.location || "TBD"}`,
      `**Guest Count:** ${event.guestCount.toLocaleString()} attendees`,
      `**Total Budget:** ${formatCurrency(event.totalBudget)}`,
      `**Description:** ${event.description || "N/A"}`,
      "",
      "---",
      "",
      "## 💰 Budget Breakdown",
      "| Item | Category | Estimated | Actual | Variance | Notes |",
      "| :--- | :--- | :--- | :--- | :--- | :--- |",
      ...event.budgetItems.map((b) => {
        const v = b.actual !== null ? b.estimated - b.actual : 0;
        return `| ${b.name} | ${b.category} | ${formatCurrency(b.estimated)} | ${b.actual !== null ? formatCurrency(b.actual) : "Pending"} | ${b.actual !== null ? formatCurrency(v) : "—"} | ${b.notes || "—"} |`;
      }),
      "",
      "---",
      "",
      "## 🗓️ Milestone Timeline",
      ...event.milestones.map((m) => `- [${m.completed ? "x" : " "}] **${m.title}** (${m.phase}, due: ${formatDate(m.dueDate)}) — ${m.description || "No details"}`),
      "",
      "---",
      "",
      "## 🤝 Vendors Directory",
      ...event.vendors.map((v) => `- **${v.name}** [${v.status}] (${v.category}): Contact: ${v.contact || "—"}, Email: ${v.email || "—"}, Cost: ${v.cost ? formatCurrency(v.cost) : "Pending"}`),
    ];

    const mdContent = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdLines.join("\n"));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", mdContent);
    downloadAnchor.setAttribute("download", `${event.name.replace(/\s+/g, "_")}_Summary.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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

  return (
    <div className="app-container">
      {/* 1. Event Header */}
      <EventHeader
        event={event}
        isGeneratingAI={isGeneratingAI}
        aiMessage={aiMessage}
        onOpenEditModal={() => setShowEditEventModal(true)}
        onTriggerAI={handleTriggerAIGeneration}
        onDeleteEvent={handleDeleteEvent}
        onExportJson={exportPlanJson}
        onExportMarkdown={exportPlanMarkdown}
      />

      {/* 2. Navigation Tabs */}
      <nav className="tabs-nav" aria-label="Event management workspaces">
        <button
          onClick={() => setActiveTab("overview")}
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          aria-selected={activeTab === "overview"}
          role="tab"
        >
          <span>📊</span> Overview
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`tab-btn ${activeTab === "budget" ? "active" : ""}`}
          aria-selected={activeTab === "budget"}
          role="tab"
        >
          <span>💰</span> Budget ({event.budgetItems.length})
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          aria-selected={activeTab === "timeline"}
          role="tab"
        >
          <span>🗓️</span> Timeline ({event.milestones.length})
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`tab-btn ${activeTab === "vendors" ? "active" : ""}`}
          aria-selected={activeTab === "vendors"}
          role="tab"
        >
          <span>🤝</span> Vendors ({event.vendors.length})
        </button>
        <button
          onClick={() => setActiveTab("ideas")}
          className={`tab-btn ${activeTab === "ideas" ? "active" : ""}`}
          aria-selected={activeTab === "ideas"}
          role="tab"
        >
          <span>✨</span> Creative Ideas
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`tab-btn ${activeTab === "ai" ? "active" : ""}`}
          aria-selected={activeTab === "ai"}
          role="tab"
        >
          <span>🪄</span> AI Copilot
        </button>
      </nav>

      {/* 3. Active Workspace Tab View */}
      {activeTab === "overview" && (
        <EventOverviewTab
          event={event}
          onSelectTab={setActiveTab}
          onToggleMilestone={handleToggleMilestone}
        />
      )}

      {activeTab === "budget" && (
        <BudgetTab
          items={event.budgetItems}
          totalBudget={event.totalBudget}
          eventName={event.name}
          onOpenAddModal={() => {
            setEditingBudgetItem(null);
            setShowBudgetModal(true);
          }}
          onOpenEditModal={(item) => {
            setEditingBudgetItem(item);
            setShowBudgetModal(true);
          }}
          onDeleteItem={handleDeleteBudgetItem}
        />
      )}

      {activeTab === "timeline" && (
        <TimelineTab
          milestones={event.milestones}
          onOpenAddModal={() => {
            setEditingMilestone(null);
            setShowMilestoneModal(true);
          }}
          onOpenEditModal={(milestone) => {
            setEditingMilestone(milestone);
            setShowMilestoneModal(true);
          }}
          onToggleMilestone={handleToggleMilestone}
          onDeleteMilestone={handleDeleteMilestone}
        />
      )}

      {activeTab === "vendors" && (
        <VendorTab
          vendors={event.vendors}
          onOpenAddModal={() => {
            setEditingVendor(null);
            setShowVendorModal(true);
          }}
          onOpenEditModal={(vendor) => {
            setEditingVendor(vendor);
            setShowVendorModal(true);
          }}
          onUpdateStatus={handleUpdateVendorStatus}
          onDeleteVendor={handleDeleteVendor}
        />
      )}

      {activeTab === "ideas" && (
        <CreativeIdeasTab
          ideasData={aiIdeasData}
          isGeneratingAI={isGeneratingAI}
          onGenerateIdeas={handleLoadIdeas}
        />
      )}

      {activeTab === "ai" && (
        <AICopilotTab
          eventName={event.name}
          eventType={event.type}
          messages={chatMessages}
          isLoading={isChatLoading}
          onSendMessage={handleSendChatMessage}
        />
      )}

      {/* 4. Modals */}
      <EditEventModal
        event={event}
        isOpen={showEditEventModal}
        onClose={() => setShowEditEventModal(false)}
        onSave={handleSaveEvent}
      />

      <BudgetItemModal
        isOpen={showBudgetModal}
        itemToEdit={editingBudgetItem}
        onClose={() => {
          setShowBudgetModal(false);
          setEditingBudgetItem(null);
        }}
        onSave={handleSaveBudgetItem}
      />

      <MilestoneModal
        isOpen={showMilestoneModal}
        milestoneToEdit={editingMilestone}
        onClose={() => {
          setShowMilestoneModal(false);
          setEditingMilestone(null);
        }}
        onSave={handleSaveMilestone}
      />

      <VendorModal
        isOpen={showVendorModal}
        vendorToEdit={editingVendor}
        onClose={() => {
          setShowVendorModal(false);
          setEditingVendor(null);
        }}
        onSave={handleSaveVendor}
      />
    </div>
  );
}
