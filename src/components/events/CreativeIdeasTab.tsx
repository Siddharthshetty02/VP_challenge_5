"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

export interface CreativeIdeaItem {
  title: string;
  category: string;
  description: string;
  estimatedCost: number;
}

export interface IdeasDataResponse {
  creativeIdeas?: CreativeIdeaItem[];
  signatureDrinkOrSnack?: string;
  playlistVibe?: string;
  recommendedColorPalette?: string[];
}

interface CreativeIdeasTabProps {
  ideasData: IdeasDataResponse | null;
  isGeneratingAI: boolean;
  onGenerateIdeas: () => void;
}

export function CreativeIdeasTab({
  ideasData,
  isGeneratingAI,
  onGenerateIdeas,
}: CreativeIdeasTabProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  function copyToClipboard(hex: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    }
  }

  const defaultIdeas: CreativeIdeaItem[] = [
    {
      title: "Memory Lane Photo Tunnel & Audio Guestbook",
      category: "Guest Experience",
      description: "An illuminated entryway draped in warm fairy lights, archival photos, and a vintage rotary phone where attendees record heartfelt spoken voice toasts.",
      estimatedCost: 350,
    },
    {
      title: "Live Interactive Culinary Station",
      category: "Food & Drink",
      description: "Chefs craft artisanal plated appetizers to order with customized dietary pairings and fresh local garnishes.",
      estimatedCost: 650,
    },
    {
      title: "Curated Sunset Ambient Music Transition",
      category: "Entertainment",
      description: "Atmospheric acoustic instruments for welcoming cocktails, smoothly shifting into high-energy dance selections as the evening unfolds.",
      estimatedCost: 500,
    },
  ];

  const ideasList = ideasData?.creativeIdeas && ideasData.creativeIdeas.length > 0
    ? ideasData.creativeIdeas
    : defaultIdeas;

  const colorPalette = ideasData?.recommendedColorPalette || ["#6366f1", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <section aria-labelledby="ideas-heading">
      {/* Header and Refresh Button */}
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
          <h2 id="ideas-heading" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Personalized Creative Concepts & Themes
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            AI-curated signature hospitality touches, color palettes, sensory highlights, and memorable guest moments.
          </p>
        </div>

        <button
          onClick={onGenerateIdeas}
          disabled={isGeneratingAI}
          className="btn btn-ai"
          aria-label="Generate fresh creative concepts with AI"
        >
          <span>✨</span> {isGeneratingAI ? "Synthesizing Concepts..." : "Generate Fresh Ideas"}
        </button>
      </div>

      {/* Signature Drink & Music Vibe Tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Signature Drink/Dish */}
        <div className="card" style={{ background: "rgba(99, 102, 241, 0.08)" }}>
          <span style={{ fontSize: "0.8rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase" }}>
            Signature Hospitality Item
          </span>
          <p style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "0.35rem" }}>
            🍸 {ideasData?.signatureDrinkOrSnack || "Sparkling Botanical Spritz & Truffle Bites"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            A bespoke hospitality highlight to welcome guests and spark immediate celebration.
          </p>
        </div>

        {/* Music / Playlist Direction */}
        <div className="card" style={{ background: "rgba(168, 85, 247, 0.08)" }}>
          <span style={{ fontSize: "0.8rem", color: "#d8b4fe", fontWeight: 700, textTransform: "uppercase" }}>
            Atmosphere & Musical Direction
          </span>
          <p style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: "0.35rem" }}>
            🎵 {ideasData?.playlistVibe || "Warm acoustic soul transitioning to upbeat celebratory anthems"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Paced perfectly to maintain vibrant energy across arrivals, speeches, and evening festivities.
          </p>
        </div>
      </div>

      {/* Color Palette Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Recommended Event Color Palette
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Click any color swatch to copy the hex code for invitations, floral arrangements, or linen orders.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {colorPalette.map((color, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => copyToClipboard(color)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              title={`Click to copy ${color}`}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {copiedHex === color ? "Copied! ✓" : color}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ideas Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {ideasList.map((idea, idx) => (
          <div
            key={idx}
            className="card card-hover"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
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
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {idea.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {idea.description}
              </p>
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Estimated Cost:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(idea.estimatedCost)}
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
