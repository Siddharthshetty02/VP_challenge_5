"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventType } from "@/types/event";
import { formatCurrency } from "@/lib/utils/format";

export default function NewEventPage() {
  const router = useRouter();

  const [eventType, setEventType] = useState<EventType>("WEDDING");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState<number>(100);
  const [totalBudget, setTotalBudget] = useState<number>(25000);
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  const [autoGenerateAI, setAutoGenerateAI] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Event name is required.";
    if (!date) errs.date = "Event date is required.";
    if (!guestCount || guestCount <= 0) errs.guestCount = "Guest count must be at least 1.";
    if (!totalBudget || totalBudget <= 0) errs.totalBudget = "Budget must be greater than $0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setAiStatus("Creating event record...");

      // 1. Create base event
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: eventType,
          date: new Date(date).toISOString(),
          location: location.trim(),
          guestCount: Number(guestCount),
          totalBudget: Number(totalBudget),
          description: description.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to create event");
      }

      const createdEvent = json.data;

      // 2. If autoGenerateAI is checked, trigger GenAI plan generation
      if (autoGenerateAI) {
        setAiStatus("✨ GenAI is designing your budget, timeline & vendor checklist...");
        await fetch("/api/ai/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: createdEvent.id,
            eventType: createdEvent.type,
            guestCount: createdEvent.guestCount,
            totalBudget: createdEvent.totalBudget,
            date: createdEvent.date,
            location: createdEvent.location,
            preferences: preferences.trim(),
            applyToEvent: true, // Automatically populates budget, milestones, vendors!
          }),
        });
      }

      // 3. Redirect to the newly created event dashboard
      router.push(`/events/${createdEvent.id}`);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrors({ form: msg });
      setSubmitting(false);
      setAiStatus("");
    }
  }

  return (
    <div className="app-container" style={{ maxWidth: "840px" }}>
      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
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
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="card" style={{ padding: "2.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--primary-light)",
              color: "#a5b4fc",
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            <span>🪄</span> GenAI Event Architect
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Plan a New Event
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            Select your event type and provide key parameters. Our GenAI assistant will synthesize a
            comprehensive plan with budget items, timeline milestones, and vendor checklists.
          </p>
        </div>

        {errors.form && (
          <div className="alert-banner" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <span>⚠️</span> {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Step 1: Event Type Picker */}
          <fieldset style={{ border: "none", padding: 0, marginBottom: "2rem" }}>
            <legend className="form-label" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
              1. Choose Event Type
            </legend>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {[
                {
                  type: "WEDDING" as EventType,
                  title: "Wedding",
                  icon: "💍",
                  desc: "Ceremony, plated reception, rehearsal dinner, floral arches, attire & photo timeline.",
                  borderActive: "var(--accent-wedding)",
                  bgActive: "var(--accent-wedding-bg)",
                },
                {
                  type: "BIRTHDAY" as EventType,
                  title: "Birthday Party",
                  icon: "🎂",
                  desc: "Milestone birthdays, rooftop/lounge buyouts, custom decor, DJ, cake & party favors.",
                  borderActive: "var(--accent-birthday)",
                  bgActive: "var(--accent-birthday-bg)",
                },
                {
                  type: "COMMUNITY" as EventType,
                  title: "Community Event",
                  icon: "🎪",
                  desc: "Public festivals, maker markets, neighborhood gatherings, permits & stage audio.",
                  borderActive: "var(--accent-community)",
                  bgActive: "var(--accent-community-bg)",
                },
              ].map((opt) => {
                const isSelected = eventType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setEventType(opt.type);
                      // Adjust default budgets based on type
                      if (opt.type === "WEDDING") {
                        setGuestCount(120);
                        setTotalBudget(35000);
                      } else if (opt.type === "BIRTHDAY") {
                        setGuestCount(45);
                        setTotalBudget(5000);
                      } else {
                        setGuestCount(500);
                        setTotalBudget(15000);
                      }
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-lg)",
                      background: isSelected ? opt.bgActive : "rgba(15, 23, 42, 0.5)",
                      border: `2px solid ${isSelected ? opt.borderActive : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                    aria-pressed={isSelected}
                  >
                    <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{opt.icon}</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {opt.title}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Step 2: Essential Details */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "1rem" }}>
              2. Event Parameters
            </h2>

            <div className="form-group">
              <label htmlFor="event-name" className="form-label">
                Event Name *
              </label>
              <input
                id="event-name"
                type="text"
                className="form-input"
                placeholder={
                  eventType === "WEDDING"
                    ? "e.g., Sarah & Jordan's Summer Garden Wedding"
                    : eventType === "BIRTHDAY"
                    ? "e.g., Alex's 40th Neon Speakeasy Bash"
                    : "e.g., Maplewood Valley Annual Food & Jazz Festival"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-invalid={!!errors.name}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="event-date" className="form-label">
                  Target Date *
                </label>
                <input
                  id="event-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  aria-invalid={!!errors.date}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="event-location" className="form-label">
                  Location or Venue Style
                </label>
                <input
                  id="event-location"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Napa Valley, CA or Downtown Rooftop"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="event-guests" className="form-label">
                  Estimated Headcount (Guests) *
                </label>
                <input
                  id="event-guests"
                  type="number"
                  min="1"
                  max="10000"
                  className="form-input"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  required
                />
                {errors.guestCount && <span className="form-error">{errors.guestCount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="event-budget" className="form-label">
                  Target Budget (USD) *
                </label>
                <input
                  id="event-budget"
                  type="number"
                  min="100"
                  step="500"
                  className="form-input"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  required
                />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Preview: {formatCurrency(totalBudget)}
                </span>
                {errors.totalBudget && <span className="form-error">{errors.totalBudget}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-description" className="form-label">
                Event Description & Vision
              </label>
              <textarea
                id="event-description"
                className="form-textarea"
                placeholder="Share your overall vision, aesthetic, vibe, or key highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Step 3: GenAI Options */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
              <input
                id="auto-ai"
                type="checkbox"
                checked={autoGenerateAI}
                onChange={(e) => setAutoGenerateAI(e.target.checked)}
                style={{ width: "20px", height: "20px", marginTop: "0.2rem", accentColor: "var(--primary)" }}
              />
              <div>
                <label htmlFor="auto-ai" style={{ fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
                  Auto-generate Full Plan with GenAI Assistant
                </label>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  Our AI will synthesize a custom budget allocation, milestone timeline, vendor sourcing
                  checklist, and tailored creative ideas right upon creation.
                </p>
              </div>
            </div>

            {autoGenerateAI && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="ai-preferences" className="form-label">
                  Special AI Directives or Style Preferences (Optional)
                </label>
                <input
                  id="ai-preferences"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Focus on farm-to-table food, keep floral costs low, prioritize live acoustic music"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Submission and AI Status Indicator */}
          {submitting && (
            <div
              className="alert-banner alert-info"
              role="status"
              aria-live="polite"
              style={{ marginBottom: "1.5rem" }}
            >
              <span style={{ animation: "spin 1s linear infinite" }}>🪄</span>
              <span>{aiStatus || "Processing..."}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Link href="/" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-ai btn-lg"
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Synthesizing Plan..." : "✨ Create & Generate Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
