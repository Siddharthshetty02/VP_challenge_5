/**
 * Prompt engineering templates and fallback generators for GenAI Event Planning.
 * Generates tailored plans for Weddings, Birthdays, and Community events.
 */

import type { AIPlanRequest, AIPlanResponse, AIBudgetRequest, AIIdeasRequest } from "../../types/ai.ts";

/**
 * Builds the comprehensive prompt for generating a complete event plan.
 */
export function buildPlanPrompt(input: AIPlanRequest): string {
  return `You are an elite, award-winning event planner specializing in weddings, milestone celebrations, and high-impact community events.
Generate a structured, highly realistic, and actionable plan for the following event:

EVENT DETAILS:
- Type: ${input.eventType}
- Guest Count: ${input.guestCount}
- Total Budget: $${input.totalBudget.toLocaleString()} USD
- Target Date: ${input.date}
${input.location ? `- Location / Venue Style: ${input.location}` : ""}
${input.preferences ? `- Specific Themes or Preferences: ${input.preferences}` : ""}

CRITICAL INSTRUCTIONS:
1. Budget numbers must sum up close to the total budget ($${input.totalBudget}).
2. The response MUST be ONLY valid JSON matching this exact structure without markdown or preamble:

{
  "budgetBreakdown": [
    {
      "category": "VENUE|CATERING|DECORATION|ENTERTAINMENT|PHOTOGRAPHY|ATTIRE|FLOWERS|TRANSPORTATION|STATIONERY|MISCELLANEOUS",
      "name": "Detailed item name",
      "estimatedCost": 5000,
      "percentOfBudget": 20,
      "notes": "Cost rationale or vendor negotiation tip"
    }
  ],
  "timeline": [
    {
      "phase": "INITIAL|PLANNING|BOOKING|PREPARATION|WEEK_OF|DAY_OF|POST_EVENT",
      "title": "Actionable milestone title",
      "description": "Specific guidance and deliverables",
      "daysBeforeEvent": 90
    }
  ],
  "vendorChecklist": [
    {
      "category": "Catering|Venue|Photography|Music|Decor|Lighting|Transportation|Floral",
      "name": "Recommended Vendor / Service Role",
      "priority": "HIGH|MEDIUM|LOW",
      "estimatedCost": 3500,
      "bookByDaysBeforeEvent": 120
    }
  ],
  "creativeIdeas": [
    {
      "title": "Unique Creative Concept",
      "description": "Vivid description of memorable guest experience",
      "estimatedCost": 400,
      "category": "Theme|Decor|Food & Drink|Entertainment|Guest Favors"
    }
  ],
  "tips": [
    "Practical money-saving, stress-reduction, or accessibility tip tailored to this event"
  ]
}`;
}

/**
 * Builds prompt for budget optimization.
 */
export function buildBudgetPrompt(input: AIBudgetRequest): string {
  return `You are an expert event financial planner. Optimize the following event budget for maximum guest impact:
Event Type: ${input.eventType}
Total Budget: $${input.totalBudget}
Guest Count: ${input.guestCount}
${input.priorities ? `User Priorities: ${input.priorities}` : ""}

Respond with a JSON object:
{
  "budgetBreakdown": [
    {
      "category": "VENUE|CATERING|DECORATION|ENTERTAINMENT|PHOTOGRAPHY|ATTIRE|FLOWERS|TRANSPORTATION|STATIONERY|MISCELLANEOUS",
      "name": "Category name",
      "estimatedCost": 1000,
      "percentOfBudget": 15,
      "notes": "Optimization strategy"
    }
  ],
  "costSavingStrategies": [
    "Specific actionable technique to save money without compromising quality"
  ],
  "highImpactSplurges": [
    "Where to allocate extra dollars for maximum memorable effect"
  ]
}`;
}

/**
 * Builds prompt for creative ideas and personalized concepts.
 */
export function buildIdeasPrompt(input: AIIdeasRequest): string {
  return `You are an avant-garde creative director for celebrations and public gatherings.
Generate distinctive, unforgettable ideas for:
Event Type: ${input.eventType}
Guest Count: ${input.guestCount}
Budget: $${input.budget}
${input.theme ? `Desired Theme/Vibe: ${input.theme}` : ""}
${input.preferences ? `Preferences: ${input.preferences}` : ""}

Respond with JSON:
{
  "creativeIdeas": [
    {
      "title": "Catchy concept title",
      "description": "Inspiring explanation of how it works and delights guests",
      "estimatedCost": 300,
      "category": "Theme|Decor|Food & Drink|Entertainment|Guest Favors"
    }
  ],
  "signatureDrinkOrSnack": "Creative signature recipe or food concept",
  "recommendedColorPalette": ["Hex or Color Name 1", "Color 2", "Color 3", "Color 4"],
  "playlistVibe": "Curated musical direction and genres"
}`;
}

/**
 * High-fidelity fallback plan generator.
 * Guarantees instantaneous, rich, and tailored responses even if no Gemini API key is configured.
 */
export function generateFallbackPlan(input: AIPlanRequest): AIPlanResponse {
  const budget = input.totalBudget;
  const guests = input.guestCount;
  const isWedding = input.eventType === "WEDDING";
  const isBirthday = input.eventType === "BIRTHDAY";

  if (isWedding) {
    return {
      budgetBreakdown: [
        { category: "VENUE", name: "Ceremony & Reception Venue Rental", estimatedCost: Math.round(budget * 0.32), percentOfBudget: 32, notes: "Allows 8-10 hour exclusive use with bridal suite" },
        { category: "CATERING", name: `Catering & Open Bar (${guests} guests)`, estimatedCost: Math.round(budget * 0.28), percentOfBudget: 28, notes: "3-course farm-to-table service plus signature cocktails" },
        { category: "PHOTOGRAPHY", name: "Lead Photographer + Drone Coverage", estimatedCost: Math.round(budget * 0.10), percentOfBudget: 10, notes: "Full-day documentary coverage & digital prints gallery" },
        { category: "FLOWERS", name: "Floral Arches, Bouquets & Centerpieces", estimatedCost: Math.round(budget * 0.08), percentOfBudget: 8, notes: "Locally sourced seasonal blooms with foliage table runners" },
        { category: "ENTERTAINMENT", name: "Ceremony Strings & Reception Live Band", estimatedCost: Math.round(budget * 0.09), percentOfBudget: 9, notes: "Acoustic duo for vows + 4-piece reception party ensemble" },
        { category: "ATTIRE", name: "Wedding Attire, Tailoring & Beauty", estimatedCost: Math.round(budget * 0.06), percentOfBudget: 6, notes: "Attire alterations, hair, makeup, and veil" },
        { category: "TRANSPORTATION", name: "Guest Shuttles & Bridal Getaway Car", estimatedCost: Math.round(budget * 0.04), percentOfBudget: 4, notes: "Ensures guest safety to and from local hotels" },
        { category: "MISCELLANEOUS", name: "Contingency Fund & Vendor Gratuities", estimatedCost: Math.round(budget * 0.03), percentOfBudget: 3, notes: "Recommended 3-5% safety buffer for unexpected needs" },
      ],
      timeline: [
        { phase: "INITIAL", title: "Establish Wedding Vision & Reserve Anchor Venue", description: "Define aesthetic moodboard, draft guest list, and secure key venue dates.", daysBeforeEvent: 270 },
        { phase: "BOOKING", title: "Contract Primary Vendors (Photo, Video, Band)", description: "Top photographers and live bands book 9-12 months in advance.", daysBeforeEvent: 210 },
        { phase: "PLANNING", title: "Menu Tasting & Floral Design Review", description: "Sample plated entrees, select wedding cake flavors, and approve floral mockups.", daysBeforeEvent: 120 },
        { phase: "PREPARATION", title: "Mail Formal Foil Invitations & Track RSVPs", description: "Collect meal dietary restrictions and finalize seating chart arrangement.", daysBeforeEvent: 60 },
        { phase: "WEEK_OF", title: "Ceremony Rehearsal & Final Vendor Confirmation", description: "Walk through timing, deliver day-of timeline packets to wedding party.", daysBeforeEvent: 2 },
        { phase: "DAY_OF", title: "Wedding Day Celebrations & Reception", description: "Hair and makeup starting at 9 AM; guest arrival 3:30 PM; grand exit 11 PM.", daysBeforeEvent: 0 },
        { phase: "POST_EVENT", title: "Preserve Bouquet & Send Thank You Notes", description: "Complete digital gallery review and send handwritten gratitude cards.", daysBeforeEvent: -14 },
      ],
      vendorChecklist: [
        { category: "Venue", name: "Historic Garden or Vineyard Estate", priority: "HIGH", estimatedCost: Math.round(budget * 0.32), bookByDaysBeforeEvent: 270 },
        { category: "Catering", name: "Artisanal Plated Catering Team", priority: "HIGH", estimatedCost: Math.round(budget * 0.28), bookByDaysBeforeEvent: 210 },
        { category: "Photography", name: "Fine Art Documentary Photographer", priority: "HIGH", estimatedCost: Math.round(budget * 0.10), bookByDaysBeforeEvent: 180 },
        { category: "Music", name: "High-Energy Live Party Band & DJ", priority: "MEDIUM", estimatedCost: Math.round(budget * 0.09), bookByDaysBeforeEvent: 150 },
        { category: "Flowers", name: "Botanical Floral Stylist", priority: "MEDIUM", estimatedCost: Math.round(budget * 0.08), bookByDaysBeforeEvent: 120 },
      ],
      creativeIdeas: [
        { title: "Audio Guestbook Rotary Phone", description: "Vintage telephone station where guests record heartfelt spoken voice messages and toasts.", estimatedCost: 350, category: "Guest Favors" },
        { title: "Twilight Champagne Tower Pour", description: "Dramatic coupe champagne tower poured during sunset speeches under warm twinkle lights.", estimatedCost: 450, category: "Food & Drink" },
        { title: "Live Event Painter", description: "An artist paints the first dance live on canvas, creating an instant family heirloom for guests to watch.", estimatedCost: 1200, category: "Entertainment" },
      ],
      tips: [
        "Ask your venue for their preferred vendor list; vendors who know the property can save 2+ hours during load-in.",
        "Designate an 'emergency kit' bag with stain removers, safety pins, blister patches, and phone chargers.",
        "Schedule 15 minutes of private couple time immediately after the ceremony before joining the cocktail reception.",
      ],
    };
  }

  if (isBirthday) {
    return {
      budgetBreakdown: [
        { category: "VENUE", name: "Lounge or Terrace Private Rental", estimatedCost: Math.round(budget * 0.35), percentOfBudget: 35, notes: "Private space with AV and lounge seating" },
        { category: "CATERING", name: `Passed Hors D'oeuvres & Drinks (${guests} guests)`, estimatedCost: Math.round(budget * 0.30), percentOfBudget: 30, notes: "Gourmet sliders, skewers, charcuterie & signature punch" },
        { category: "ENTERTAINMENT", name: "DJ, Lighting & Sound System", estimatedCost: Math.round(budget * 0.15), percentOfBudget: 15, notes: "Curated party playlist with dance floor lighting" },
        { category: "DECORATION", name: "Custom Neon Sign & Balloon Installation", estimatedCost: Math.round(budget * 0.10), percentOfBudget: 10, notes: "Personalized backdrop for photo opportunities" },
        { category: "PHOTOGRAPHY", name: "Instant Mirror / 360 Photo Booth", estimatedCost: Math.round(budget * 0.07), percentOfBudget: 7, notes: "Unlimited digital sharing and printed keepsake strips" },
        { category: "MISCELLANEOUS", name: "Custom Birthday Cake & Party Favors", estimatedCost: Math.round(budget * 0.03), percentOfBudget: 3, notes: "Sculpted bakery cake with sparkler candles" },
      ],
      timeline: [
        { phase: "INITIAL", title: "Select Theme & Book Private Party Space", description: "Confirm date, headcount estimate, and venue deposit.", daysBeforeEvent: 45 },
        { phase: "BOOKING", title: "Lock in DJ, Bartender & Photo Booth", description: "Send playlist preferences and drink ingredient requests.", daysBeforeEvent: 30 },
        { phase: "PREPARATION", title: "Send Digital Invitations with RSVP Link", description: "Collect music song requests and dietary preferences.", daysBeforeEvent: 21 },
        { phase: "WEEK_OF", title: "Pick Up Decor & Finalize Drink Menu", description: "Confirm final head count with catering and venue staff.", daysBeforeEvent: 3 },
        { phase: "DAY_OF", title: "Party Celebration!", description: "Host arrival 1 hour early for sound check and cake drop-off.", daysBeforeEvent: 0 },
      ],
      vendorChecklist: [
        { category: "Venue", name: "Boutique Rooftop or Loft Space", priority: "HIGH", estimatedCost: Math.round(budget * 0.35), bookByDaysBeforeEvent: 45 },
        { category: "Catering", name: "Mobile Craft Cocktail & Tapas Bar", priority: "HIGH", estimatedCost: Math.round(budget * 0.30), bookByDaysBeforeEvent: 30 },
        { category: "Entertainment", name: "Club & Open-Format Party DJ", priority: "MEDIUM", estimatedCost: Math.round(budget * 0.15), bookByDaysBeforeEvent: 25 },
        { category: "Photo Booth", name: "Glam Mirror Photo Booth", priority: "MEDIUM", estimatedCost: Math.round(budget * 0.07), bookByDaysBeforeEvent: 20 },
      ],
      creativeIdeas: [
        { title: "Bespoke Birthday Cocktail Flight", description: "Three mini craft cocktails themed after milestones from the celebrant's life.", estimatedCost: 250, category: "Food & Drink" },
        { title: "Illuminated Custom Neon Backdrop", description: "Bright neon quote sign set against a lush greenery wall for viral social media photos.", estimatedCost: 350, category: "Decor" },
        { title: "Midnight Snack Delivery Surprise", description: "Surprise hot late-night mini burger sliders or churros brought out on neon trays.", estimatedCost: 300, category: "Food & Drink" },
      ],
      tips: [
        "Include an open box on invitations asking guests to submit their favorite dance song.",
        "Set up an ambient hydration station with citrus-infused waters to keep energy high all night.",
        "Have the birthday cake cut and sliced behind the scenes for effortless self-serve dessert display.",
      ],
    };
  }

  // Community Event
  return {
    budgetBreakdown: [
      { category: "VENUE", name: "Public Park or Plaza Permit & Security Fee", estimatedCost: Math.round(budget * 0.20), percentOfBudget: 20, notes: "Municipal permitting, sound variance, and police liaison" },
      { category: "ENTERTAINMENT", name: "Main Stage PA, Sound Engineer & Performers", estimatedCost: Math.round(budget * 0.25), percentOfBudget: 25, notes: "All-day sound coverage for civic performers and local bands" },
      { category: "MISCELLANEOUS", name: "Portable Restrooms, Sanitation & First Aid", estimatedCost: Math.round(budget * 0.18), percentOfBudget: 18, notes: "Compliant waste stations, hand sanitizers, and medic tent" },
      { category: "DECORATION", name: "Canopy Tents, Perimeter Banners & Signage", estimatedCost: Math.round(budget * 0.14), percentOfBudget: 14, notes: "Accessible directional maps, stage backdrops, and flags" },
      { category: "STATIONERY", name: "Flyers, Community Outreach & Social Ads", estimatedCost: Math.round(budget * 0.10), percentOfBudget: 10, notes: "Multilingual neighborhood promotion and digital marketing" },
      { category: "TRANSPORTATION", name: "Shuttles, Traffic Cones & Volunteer Gear", estimatedCost: Math.round(budget * 0.08), percentOfBudget: 8, notes: "Safety vests, walkie-talkies, and accessible golf carts" },
      { category: "MISCELLANEOUS", name: "Emergency Contingency & Weather Plan", estimatedCost: Math.round(budget * 0.05), percentOfBudget: 5, notes: "Rain ponchos, water refill stations, and backup power" },
    ],
    timeline: [
      { phase: "INITIAL", title: "Submit Municipal Special Event Permit", description: "File application with city council, park board, and fire department.", daysBeforeEvent: 90 },
      { phase: "BOOKING", title: "Recruit Artisan Vendors & Stage Performers", description: "Open public call for local food trucks, artists, and musical acts.", daysBeforeEvent: 60 },
      { phase: "PLANNING", title: "Volunteer Mobilization & Safety Briefing", description: "Organize 25+ community volunteers for setup, greeting, and cleanup.", daysBeforeEvent: 30 },
      { phase: "PREPARATION", title: "Launch Public Community Marketing Campaign", description: "Distribute posters to local businesses, libraries, and neighborhood apps.", daysBeforeEvent: 14 },
      { phase: "WEEK_OF", title: "Site Walkthrough & Vendor Load-In Briefing", description: "Mark booth chalk squares and verify generator power hookups.", daysBeforeEvent: 3 },
      { phase: "DAY_OF", title: "Festival Day!", description: "Volunteer check-in at 7 AM; opening ceremony at 10 AM; cleanup at 6 PM.", daysBeforeEvent: 0 },
    ],
    vendorChecklist: [
      { category: "AV & Sound", name: "Concert Audio Stage Rig & Engineer", priority: "HIGH", estimatedCost: Math.round(budget * 0.25), bookByDaysBeforeEvent: 60 },
      { category: "Sanitation", name: "Eco Waste & Portable Restrooms Supplier", priority: "HIGH", estimatedCost: Math.round(budget * 0.18), bookByDaysBeforeEvent: 45 },
      { category: "Tents & Rentals", name: "Commercial Event Tents & Folding Chairs", priority: "MEDIUM", estimatedCost: Math.round(budget * 0.14), bookByDaysBeforeEvent: 40 },
    ],
    creativeIdeas: [
      { title: "Community Hands-On Art Mural", description: "Large wooden canvas where attendees of all ages paint a permanent civic mural.", estimatedCost: 350, category: "Entertainment" },
      { title: "Neighborhood Scavenger Passport", description: "Printed passport encouraging families to visit diverse cultural booths for stamps and prizes.", estimatedCost: 200, category: "Guest Favors" },
      { title: "Local Culinary Cook-Off Contest", description: "Friendly bake-off or chili cook-off judged by community heroes with ribbon prizes.", estimatedCost: 300, category: "Food & Drink" },
    ],
    tips: [
      "Ensure ADA-compliant accessible walkways and shaded seating areas for elderly attendees.",
      "Partner with local student volunteer groups or scouts for setup and tear-down credit hours.",
      "Provide free touchless water refill stations to promote environmental sustainability.",
    ],
  };
}
