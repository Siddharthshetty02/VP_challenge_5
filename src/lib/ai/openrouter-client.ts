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

export async function sendOpenRouterChat(
  messages: Array<{ sender: "user" | "ai"; text: string }>,
  eventContext: EventContextPayload
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

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

GUIDELINES FOR YOUR RESPONSES:
1. Provide concrete, highly practical, and actionable advice tailored to their specific event type, guest count, and budget.
2. If discussing budgets, give realistic dollar allocations or percentages.
3. If discussing timelines, recommend realistic lead times.
4. If discussing vendors, suggest what questions to ask or negotiation tactics.
5. Keep your tone encouraging, sophisticated, organized, and clear. Format with bullet points or short paragraphs for readability.`;

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
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error response:", errorText);
    throw new Error(`OpenRouter API responded with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const assistantReply = data.choices?.[0]?.message?.content;

  if (!assistantReply) {
    throw new Error("No content received from OpenRouter API");
  }

  return assistantReply;
}
