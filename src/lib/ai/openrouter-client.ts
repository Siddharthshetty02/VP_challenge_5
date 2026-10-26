/**
 * OpenRouter AI Client Integration.
 * Provides access to state-of-the-art models (e.g. Anthropic Claude, OpenAI GPT-4o, Meta LLaMA 3.3)
 * with full conversational event context.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface EventContextPayload {
  name: string;
  type: string;
  date: string;
  location?: string;
  guestCount: number;
  totalBudget: number;
  description?: string;
  budgetBreakdownSummary?: string;
  milestonesSummary?: string;
  vendorsSummary?: string;
}

/**
 * Strips all asterisks (bold/italic markdown) and formats text into clean bullet points.
 */
export function cleanAndRefinePoints(text: string): string {
  if (!text) return "";

  // 1. Remove markdown bold (**text**) and italics (*text*) while preserving the words
  let cleaned = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");

  // 2. Remove any remaining stray asterisks
  cleaned = cleaned.replace(/\*/g, "");

  // 3. Format lines into clean, consistent bullet points
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // If line begins with a dash, replace with a clean round bullet
      if (/^[-–—]\s+/.test(trimmed)) {
        return "• " + trimmed.replace(/^[-–—]\s+/, "");
      }
      return line;
    })
    .join("\n");

  // 4. Normalize excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

export async function sendOpenRouterChat(
  messages: Array<{ sender: "user" | "ai"; text: string }>,
  eventContext: EventContextPayload
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/auto";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemPrompt = `You are EventGenie, an elite master event planning consultant and concierge specializing in weddings, milestone birthdays, and community festivals.
You are assisting a client in planning this specific event:

EVENT PROFILE:
- Title: ${eventContext.name}
- Event Type: ${eventContext.type}
- Target Date: ${eventContext.date}
- Guest Count: ${eventContext.guestCount} attendees
- Total Allocated Budget: $${eventContext.totalBudget.toLocaleString()} USD
${eventContext.location ? `- Location / Venue: ${eventContext.location}` : ""}
${eventContext.description ? `- Thematic Notes / Description: ${eventContext.description}` : ""}
${eventContext.budgetBreakdownSummary ? `- Current Budget Status: ${eventContext.budgetBreakdownSummary}` : ""}
${eventContext.milestonesSummary ? `- Timeline Milestones: ${eventContext.milestonesSummary}` : ""}
${eventContext.vendorsSummary ? `- Vendors & Bookings: ${eventContext.vendorsSummary}` : ""}

CRITICAL FORMATTING RULES:
1. NEVER USE ASTERISKS: Do not use asterisks for bolding, italics, or bullets (no **bold**, no *italic*, no * bullets). Asterisks are strictly prohibited.
2. ANSWER IN CLEAR POINTS: Structure your entire response in clear, concise bullet points (using "• ") or numbered points (1., 2., 3.).
3. ACTIONABLE & SPECIFIC: Provide concrete figures, realistic timeline lead-times, and specific vendor tips tailored to this event.
4. Keep each point focused and easy to read.`;

  const formattedMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.sender === "ai" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    })),
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "EventGenie Planning Assistant",
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error response:", errorText);
    throw new Error(`OpenRouter API responded with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawReply = data.choices?.[0]?.message?.content;

  if (!rawReply) {
    throw new Error("No content received from OpenRouter API");
  }

  // Refine and clean output to guarantee no asterisks and clean points
  return cleanAndRefinePoints(rawReply);
}
