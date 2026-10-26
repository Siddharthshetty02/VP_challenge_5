/**
 * /api/ai/chat - Real-time conversational AI copilot.
 * Connects to OpenRouter (or falls back to built-in domain logic) with full event context.
 */

import { NextResponse } from "next/server";
import { sendOpenRouterChat, cleanAndRefinePoints, EventContextPayload } from "@/lib/ai/openrouter-client";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const ChatRequestSchema = z.object({
  eventId: z.string().min(1),
  messages: z.array(
    z.object({
      sender: z.enum(["user", "ai"]),
      text: z.string().min(1),
    })
  ).min(1),
  eventContext: z.object({
    name: z.string(),
    type: z.string(),
    date: z.string(),
    location: z.string().optional(),
    guestCount: z.number(),
    totalBudget: z.number(),
    description: z.string().optional(),
    budgetBreakdownSummary: z.string().optional(),
    milestonesSummary: z.string().optional(),
    vendorsSummary: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "client";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeInput(body);
    const validated = ChatRequestSchema.parse(sanitized);

    // If OpenRouter key is present, execute real LLM completion
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const reply = await sendOpenRouterChat(
          validated.messages,
          validated.eventContext as EventContextPayload
        );
        return NextResponse.json({
          success: true,
          data: {
            reply,
            source: "openrouter",
            model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          },
        });
      } catch (openRouterError) {
        console.error("OpenRouter request failed, engaging intelligent fallback:", openRouterError);
      }
    }

    // High-fidelity fallback when no key is set or OpenRouter is temporarily unreachable
    const lastUserMessage = [...validated.messages]
      .reverse()
      .find((m) => m.sender === "user")?.text.toLowerCase() || "";

    const ctx = validated.eventContext;
    let fallbackReply = `Here are specific recommendations for "${ctx.name}" (${ctx.type.toLowerCase()}, ${ctx.guestCount} guests, $${ctx.totalBudget.toLocaleString()} budget):\n\n`;

    if (lastUserMessage.includes("budget") || lastUserMessage.includes("cost") || lastUserMessage.includes("save")) {
      fallbackReply += `• Budget Allocation: For ${ctx.type.toLowerCase()} celebrations with ${ctx.guestCount} attendees, catering and venue typically account for 45-55% of your total spend ($${Math.round(ctx.totalBudget * 0.5).toLocaleString()}).\n• Cost-Cutting Strategy: Streamline non-essential decor, custom favors, and printed paper goods to free up 7-10% for high-impact guest touchpoints like signature catering or live entertainment.`;
    } else if (lastUserMessage.includes("vendor") || lastUserMessage.includes("hire") || lastUserMessage.includes("book")) {
      fallbackReply += `• Booking Priority: Lock in your anchor venue and primary photographer first, as high-demand talent books 6-9 months in advance.\n• Contract Transparency: Request itemized proposals detailing travel charges, overtime rates, and backup staff commitments.\n• Package Bundling: Inquire if your entertainment or lighting vendors provide combined equipment packages for a 10-15% discount.`;
    } else if (lastUserMessage.includes("timeline") || lastUserMessage.includes("schedule") || lastUserMessage.includes("when")) {
      fallbackReply += `• Invitations & RSVPs: Send invitations 8-10 weeks prior to ${new Date(ctx.date).toLocaleDateString()}, with an RSVP deadline 4 weeks before the event.\n• Catering Lock: Finalize guaranteed attendee headcounts with your culinary team exactly 14 days out.\n• Day-of Buffer: Build a 30-minute buffer into your morning prep schedule to absorb any transport or vendor arrival delays.`;
    } else if (lastUserMessage.includes("idea") || lastUserMessage.includes("theme") || lastUserMessage.includes("decor")) {
      fallbackReply += `• Sensory Arrival: Create a memorable first impression with ambient welcoming music and a signature arrival drink.\n• Interactive Guest Experience: Set up an audio telephone guestbook or interactive memory station.\n• Dynamic Lighting: Shift from warm ambient natural lighting during early hours into vibrant party illumination during celebrations.`;
    } else {
      fallbackReply += `• Guest Comfort: Ensure intuitive directional signage, comfortable lounge zones, and effortless dietary accessibility.\n• Program Pacing: Transition seamlessly between cocktail welcoming, speeches, and peak entertainment without lulls in momentum.\n• Signature Touch: Include a personalized surprise moment, such as a curated dessert station or memorable send-off favor.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        reply: cleanAndRefinePoints(fallbackReply),
        source: "fallback",
        notice: "Add OPENROUTER_API_KEY in .env.local to activate real-time LLM chat models.",
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
