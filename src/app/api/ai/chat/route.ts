/**
 * /api/ai/chat - Real-time conversational AI copilot.
 * Connects to OpenRouter (or falls back to built-in domain logic) with full event context.
 */

import { NextResponse } from "next/server";
import { sendOpenRouterChat, EventContextPayload } from "@/lib/ai/openrouter-client";
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
    let fallbackReply = `As your event planning consultant for "${ctx.name}" (${ctx.type.toLowerCase()}, ${ctx.guestCount} guests, $${ctx.totalBudget.toLocaleString()} budget):\n\n`;

    if (lastUserMessage.includes("budget") || lastUserMessage.includes("cost") || lastUserMessage.includes("save")) {
      fallbackReply += `💡 **Budget Optimization Strategy:**\n• For ${ctx.type.toLowerCase()} celebrations with ${ctx.guestCount} attendees, catering & venue typically represent 45–55% of your total spend ($${Math.round(ctx.totalBudget * 0.5).toLocaleString()}).\n• Review non-essential decor and paper goods—streamlining these can free up 7-10% to invest in high-impact guest touchpoints like signature catering or entertainment.`;
    } else if (lastUserMessage.includes("vendor") || lastUserMessage.includes("hire") || lastUserMessage.includes("book")) {
      fallbackReply += `📋 **Vendor Booking Roadmap:**\n• Ensure your anchor venue and primary photographer are locked in first.\n• For key vendors, always request itemized proposals with travel fees, overtime rates, and backup staff policies clearly outlined.\n• Don't hesitate to negotiate package bundles (e.g. DJ + ambient lighting packages).`;
    } else if (lastUserMessage.includes("timeline") || lastUserMessage.includes("schedule") || lastUserMessage.includes("when")) {
      fallbackReply += `⏱️ **Timeline & Pacing Recommendation:**\n• Send invitations or RSVPs 8–10 weeks prior to ${new Date(ctx.date).toLocaleDateString()}.\n• Schedule final headcount lock with your caterer exactly 14 days before the event.\n• Build in a 30-minute buffer into the day-of timeline before guest arrivals to accommodate inevitable transport or prep delays.`;
    } else if (lastUserMessage.includes("idea") || lastUserMessage.includes("theme") || lastUserMessage.includes("decor")) {
      fallbackReply += `✨ **Curated Creative Concept:**\n• Consider designing a cohesive sensory arrival experience (custom welcoming scent or ambient entrance music).\n• Feature an interactive element: an audio telephone guestbook or a live participatory tasting station.\n• Curate custom lighting transitions: warm golden hour illumination for early stages, shifting to dynamic celebratory lighting for peak hours.`;
    } else {
      fallbackReply += `I recommend focusing on three core pillars for an unforgettable experience:\n1. **Guest Comfort**: Seamless arrival flow, intuitive signage, and accessible seating.\n2. **Pacing**: Transitioning smoothly from welcoming cocktails to main programming without energy dips.\n3. **Signature Moments**: A standout entrance, a surprise performance or toast, and memorable departure favors.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        reply: fallbackReply,
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
