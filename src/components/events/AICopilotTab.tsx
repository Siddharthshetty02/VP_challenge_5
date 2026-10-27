"use client";

import { useState } from "react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

interface AICopilotTabProps {
  eventName: string;
  eventType: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => Promise<void>;
}

export function AICopilotTab({
  eventName,
  eventType,
  messages,
  isLoading,
  onSendMessage,
}: AICopilotTabProps) {
  const [prompt, setPrompt] = useState("");

  const promptStarters = [
    `How can I trim $1,500 from catering for our ${eventType.toLowerCase()}?`,
    "What key contract clauses should I verify before signing venue leases?",
    "How should I structure the morning schedule to avoid day-of delays?",
    "Suggest 3 interactive entertainment ideas tailored to our guests.",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const text = prompt.trim();
    setPrompt("");
    await onSendMessage(text);
  }

  function handleSelectStarter(text: string) {
    if (isLoading) return;
    void onSendMessage(text);
  }

  return (
    <section aria-labelledby="ai-copilot-heading">
      <div className="card" style={{ maxWidth: "880px", margin: "0 auto", padding: "1.75rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--ai-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            ✨
          </div>
          <div>
            <h2 id="ai-copilot-heading" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              EventGenie Planning Copilot
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Real-time strategic consulting with full contextual awareness of &ldquo;{eventName}&rdquo;
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Suggested Prompts:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {promptStarters.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectStarter(starter)}
                disabled={isLoading}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-full)",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            minHeight: "360px",
            maxHeight: "480px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1.25rem",
            border: "1px solid var(--border)",
          }}
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: msg.sender === "user" ? "var(--primary)" : "var(--bg-elevated)",
                color: "#ffffff",
                padding: "0.85rem 1.15rem",
                borderRadius: "var(--radius-lg)",
                borderBottomRightRadius: msg.sender === "user" ? "2px" : "var(--radius-lg)",
                borderBottomLeftRadius: msg.sender === "ai" ? "2px" : "var(--radius-lg)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                border: msg.sender === "ai" ? "1px solid var(--border)" : "none",
              }}
            >
              {msg.text}
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                padding: "0.85rem 1.15rem",
                borderRadius: "var(--radius-lg)",
                borderBottomLeftRadius: "2px",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
              }}
            >
              <span>✨ EventGenie is analyzing your event data...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            className="form-input"
            placeholder={isLoading ? "Thinking..." : "Ask anything about vendors, budgeting, timelines, or contingencies..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            aria-label="Ask EventGenie AI"
          />
          <button
            type="submit"
            className="btn btn-ai"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
