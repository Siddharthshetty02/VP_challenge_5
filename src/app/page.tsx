"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Event, EventType } from "@/types/event";
import { formatCurrency, formatDate, getEventTypeIcon } from "@/lib/utils/format";

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | EventType>("ALL");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const filteredEvents =
    filterType === "ALL"
      ? events
      : events.filter((e) => e.type === filterType);

  const totalBudget = events.reduce((sum, e) => sum + e.totalBudget, 0);
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0);

  return (
    <div className="app-container">
      {/* Hero Header */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.1) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "var(--radius-xl)",
          padding: "3rem 2.5rem",
          marginBottom: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
        aria-labelledby="hero-title"
      >
        <div style={{ maxWidth: "760px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "0.35rem 0.85rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#c084fc",
              marginBottom: "1rem",
              border: "1px solid rgba(168, 85, 247, 0.25)",
            }}
          >
            <span>✨</span> Next-Gen Event Intelligence
          </div>
          <h1
            id="hero-title"
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Organize Unforgettable Weddings, Birthdays & Community Events
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "1.75rem",
            }}
          >
            Harness GenAI to automatically draft precision budgets, schedule milestones,
            organize vendor checklists, and spark tailored creative themes in seconds.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/events/new" className="btn btn-ai btn-lg">
              <span aria-hidden="true">🪄</span> Launch AI Event Wizard
            </Link>
          </div>
        </div>
      </section>

      {/* Metric Highlights */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
        aria-label="Summary Statistics"
      >
        <div className="card">
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>
            Active Events
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>
            {events.length}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--status-success)", marginTop: "0.25rem" }}>
            Weddings, Birthdays & Community
          </p>
        </div>

        <div className="card">
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>
            Total Budget Managed
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "#818cf8" }}>
            {formatCurrency(totalBudget, true)}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Across all active plans
          </p>
        </div>

        <div className="card">
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>
            Total Projected Guests
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "#f472b6" }}>
            {totalGuests.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Attendees & Participants
          </p>
        </div>

        <div className="card">
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>
            GenAI Assistant Engine
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "#34d399" }}>
            Active
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Budgets • Timelines • Vendors
          </p>
        </div>
      </section>

      {/* Filter Tabs & Event List */}
      <section aria-labelledby="events-list-heading">
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
            <h2 id="events-list-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              Your Planned Events
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Select an event to view full budgets, milestone timelines, vendor checklists, and AI ideas.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter events by category"
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "rgba(15, 23, 42, 0.6)",
              padding: "0.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            {(["ALL", "WEDDING", "BIRTHDAY", "COMMUNITY"] as const).map((type) => {
              const label =
                type === "ALL"
                  ? "All Events"
                  : type === "WEDDING"
                  ? "💍 Weddings"
                  : type === "BIRTHDAY"
                  ? "🎂 Birthdays"
                  : "🎪 Community";
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  aria-pressed={filterType === type}
                  style={{
                    background: filterType === type ? "var(--primary)" : "transparent",
                    color: filterType === type ? "#ffffff" : "var(--text-secondary)",
                    border: "none",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1.1rem" }}>Loading your events...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              border: "2px dashed var(--border)",
            }}
          >
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>
              🎈
            </span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No events found in this category
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
              Create a new wedding, birthday party, or community gathering with our GenAI assistant in just a few clicks!
            </p>
            <Link href="/events/new" className="btn btn-primary">
              Create an Event
            </Link>
          </div>
        )}

        {/* Event Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredEvents.map((event) => {
            const badgeClass =
              event.type === "WEDDING"
                ? "badge-wedding"
                : event.type === "BIRTHDAY"
                ? "badge-birthday"
                : "badge-community";

            return (
              <article
                key={event.id}
                className="card card-hover"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span className={`badge ${badgeClass}`}>
                      <span>{getEventTypeIcon(event.type)}</span>
                      <span>{event.type}</span>
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(event.date)}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    <Link
                      href={`/events/${event.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {event.name}
                    </Link>
                  </h3>

                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {event.description || "No description provided."}
                  </p>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span aria-hidden="true">📍</span>
                      <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {event.location || "Location TBD"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span aria-hidden="true">👥</span>
                      <span>{event.guestCount} Estimated Guests</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Target Budget
                    </span>
                    <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {formatCurrency(event.totalBudget)}
                    </p>
                  </div>

                  <Link
                    href={`/events/${event.id}`}
                    className="btn btn-secondary btn-sm"
                    aria-label={`Manage ${event.name}`}
                  >
                    Manage Plan →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
