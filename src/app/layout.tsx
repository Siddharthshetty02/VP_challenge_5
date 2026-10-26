import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventGenie | GenAI Event Planning Assistant",
  description:
    "Intelligent planning assistant for weddings, milestone birthdays, and community events with AI budgets, dynamic timelines, vendor checklists, and personalized creative concepts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Accessibility Skip Link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Global Screen Reader Live Region */}
        <div id="sr-announcements" aria-live="polite" className="sr-only" />

        {/* Application Header Navigation */}
        <header className="navbar" role="banner">
          <div className="app-container navbar-inner">
            <Link href="/" className="brand-link" aria-label="EventGenie Home">
              <span aria-hidden="true" style={{ fontSize: "1.5rem" }}>✨</span>
              <span>EventGenie</span>
              <span className="brand-badge">GenAI Assistant</span>
            </Link>

            <nav aria-label="Main Navigation">
              <ul className="nav-links">
                <li>
                  <Link href="/" className="nav-link">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/events/new" className="btn btn-ai btn-sm" aria-label="Plan New Event with AI">
                    <span aria-hidden="true">🪄</span> Plan New Event
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Main Content Landmark */}
        <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: "2rem 0" }}>
          {children}
        </main>

        {/* Accessible Footer */}
        <footer
          role="contentinfo"
          style={{
            borderTop: "1px solid var(--border)",
            padding: "2rem 0",
            backgroundColor: "rgba(9, 13, 22, 0.9)",
            color: "var(--text-muted)",
            fontSize: "0.875rem",
          }}
        >
          <div className="app-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <p>
              © 2026 EventGenie — GenAI Planning Assistant for Weddings, Birthdays & Community Gatherings.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--status-success)" }}></span>
                Powered by Google Gemini 1.5
              </span>
              <span>•</span>
              <span>WCAG AA Accessible</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
