/**
 * Gemini API client wrapper with automatic error handling, structured output,
 * and high-fidelity fallback generation.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { buildPlanPrompt, buildIdeasPrompt, generateFallbackPlan } from "./prompts";
import { parseAIPlanResponse } from "./response-parser";
import type { AIPlanRequest, AIPlanResponse, AIIdeasRequest } from "../../types/ai.ts";

/** Return structure for creative ideas */
export interface CreativeIdeasResult {
  creativeIdeas: Array<{
    title: string;
    description: string;
    estimatedCost: number;
    category: string;
  }>;
  signatureDrinkOrSnack?: string;
  recommendedColorPalette?: string[];
  playlistVibe?: string;
  source: "gemini" | "fallback";
}

/** Singleton instance of Gemini client */
let genAIInstance: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Generates an end-to-end event plan using Gemini 1.5, or fallback generator if unavailable.
 */
export async function generateEventPlan(input: AIPlanRequest): Promise<{
  plan: AIPlanResponse;
  source: "gemini" | "fallback";
}> {
  const client = getGeminiClient();

  if (!client) {
    console.info("[GenAI Assistant] No GEMINI_API_KEY configured. Utilizing built-in expert planning engine.");
    return {
      plan: generateFallbackPlan(input),
      source: "fallback",
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPlanPrompt(input);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedPlan = parseAIPlanResponse(responseText);

    return {
      plan: parsedPlan,
      source: "gemini",
    };
  } catch (error) {
    console.warn("[GenAI Assistant] Gemini call encountered an error. Falling back gracefully:", error);
    return {
      plan: generateFallbackPlan(input),
      source: "fallback",
    };
  }
}

/**
 * Generates personalized creative ideas for the event.
 */
export async function generateCreativeIdeas(input: AIIdeasRequest): Promise<CreativeIdeasResult> {
  const client = getGeminiClient();

  if (!client) {
    const fallback = generateFallbackPlan({
      eventId: input.eventId,
      eventType: input.eventType,
      guestCount: input.guestCount,
      totalBudget: input.budget,
      date: new Date().toISOString(),
      preferences: input.preferences,
    });
    return {
      creativeIdeas: fallback.creativeIdeas,
      signatureDrinkOrSnack: input.eventType === "WEDDING" ? "Golden Hour Bellini & Truffle Crostini" : "Neon Cyber Citrus Fizz",
      recommendedColorPalette: ["#6366f1", "#ec4899", "#f59e0b", "#10b981"],
      playlistVibe: "Curated ambient lounge into celebratory peak-hour anthems",
      source: "fallback",
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildIdeasPrompt(input);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      source: "gemini",
    };
  } catch (err) {
    console.warn("AI ideas generation fallback:", err);
    const fallback = generateFallbackPlan({
      eventId: input.eventId,
      eventType: input.eventType,
      guestCount: input.guestCount,
      totalBudget: input.budget,
      date: new Date().toISOString(),
      preferences: input.preferences,
    });
    return {
      creativeIdeas: fallback.creativeIdeas,
      signatureDrinkOrSnack: "Celebration Sparkling Spritz",
      recommendedColorPalette: ["#6366f1", "#f59e0b", "#ec4899", "#10b981"],
      playlistVibe: "Uplifting celebratory rhythm",
      source: "fallback",
    };
  }
}
