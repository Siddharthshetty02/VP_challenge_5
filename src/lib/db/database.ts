/**
 * Database storage and repository layer for the GenAI Event Planning Assistant.
 * Uses atomic JSON file persistence with in-memory caching for zero-setup,
 * sub-millisecond execution, and 100% cross-platform reliability.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import type { Event, CreateEventInput, UpdateEventInput, EventWithDetails } from "../../types/event.ts";
import type { BudgetItem, CreateBudgetInput, BudgetCategory } from "../../types/budget.ts";
import type { Milestone, CreateMilestoneInput, TimelinePhase } from "../../types/timeline.ts";
import type { Vendor, CreateVendorInput } from "../../types/vendor.ts";
import type { AISuggestion } from "../../types/ai.ts";

/** Database structure interface */
export interface DatabaseSchema {
  events: Event[];
  budgetItems: BudgetItem[];
  milestones: Milestone[];
  vendors: Vendor[];
  aiSuggestions: AISuggestion[];
}

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DB_FILE = path.join(process.cwd(), "data", "eventplanner.json");
const DATA_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), "eventgenie-data")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "eventplanner.json");

/** In-memory cached database instance */
let memoryDb: DatabaseSchema | null = null;

/**
 * Generates initial rich seed data for Weddings, Birthdays, and Community events.
 */
function createSeedData(): DatabaseSchema {
  const weddingId = "event-wedding-01";
  const birthdayId = "event-birthday-02";
  const communityId = "event-community-03";

  return {
    events: [
      {
        id: weddingId,
        name: "Sophia & Liam's Autumn Vineyard Wedding",
        type: "WEDDING",
        date: "2026-10-18T16:00:00.000Z",
        location: "St. Helena Vineyard Estate, Napa Valley, CA",
        guestCount: 120,
        totalBudget: 45000,
        description: "An elegant rustic autumnal celebration among golden vines, featuring farm-to-table cuisine, acoustic live music, and twilight fairy-light ambiance.",
        status: "PLANNING",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-15T14:30:00.000Z",
      },
      {
        id: birthdayId,
        name: "Maya's 30th Cyberpunk Rooftop Celebration",
        type: "BIRTHDAY",
        date: "2026-11-07T20:00:00.000Z",
        location: "Skyline Glasshouse Lounge, Downtown District",
        guestCount: 50,
        totalBudget: 7500,
        description: "An electrifying neon-cyberpunk milestone 30th bash with synthwave DJ, bespoke neon cocktail bar, holographic photo booth, and futuristic street food skewers.",
        status: "IN_PROGRESS",
        createdAt: "2026-09-10T12:00:00.000Z",
        updatedAt: "2026-09-20T16:45:00.000Z",
      },
      {
        id: communityId,
        name: "Greenwood Valley Annual Harvest Festival & Maker Market",
        type: "COMMUNITY",
        date: "2026-10-24T10:00:00.000Z",
        location: "Greenwood Valley Community Park & Pavilion",
        guestCount: 850,
        totalBudget: 18000,
        description: "A free-entry public harvest festival featuring 40+ local artisan booths, pumpkin carving contests, live folk bands, cider pressing, and family scavenger hunts.",
        status: "IN_PROGRESS",
        createdAt: "2026-08-15T09:00:00.000Z",
        updatedAt: "2026-09-18T11:15:00.000Z",
      },
    ],
    budgetItems: [
      // Wedding Budget
      { id: "b-01", eventId: weddingId, category: "VENUE", name: "Vineyard Estate Rental & Ceremony Lawn", estimated: 14000, actual: 13500, notes: "Includes tables, chairs, and barrel room for dance floor" },
      { id: "b-02", eventId: weddingId, category: "CATERING", name: "Farm-to-Table 3-Course Plated Dinner & Wine Pairing", estimated: 12500, actual: 12800, notes: "120 guests @ $105/person + wine pairing" },
      { id: "b-03", eventId: weddingId, category: "PHOTOGRAPHY", name: "10-Hour Photography & Drone Footage", estimated: 4200, actual: 4000, notes: "Includes engagement shoot and digital prints album" },
      { id: "b-04", eventId: weddingId, category: "FLOWERS", name: "Autumnal Floral Arches & Centerpieces", estimated: 3800, actual: 3600, notes: "Deep burgundy dahlias, eucalyptus, amber tea roses" },
      { id: "b-05", eventId: weddingId, category: "ENTERTAINMENT", name: "Acoustic String Trio + Evening Live 5-Piece Band", estimated: 4500, actual: 4500, notes: "Ceremony strings and high-energy dinner/party band" },
      { id: "b-06", eventId: weddingId, category: "ATTIRE", name: "Bespoke Suit & Bridal Gown Alterations", estimated: 3200, actual: 2900, notes: "Veil, accessories, and shoes included" },
      { id: "b-07", eventId: weddingId, category: "TRANSPORTATION", name: "Guest Shuttles from Napa Hotels", estimated: 1500, actual: null, notes: "Two 30-passenger luxury coach shuttles" },
      { id: "b-08", eventId: weddingId, category: "STATIONERY", name: "Wax-Sealed Foil Invitations & Menu Cards", estimated: 800, actual: 750, notes: "Pressed autumn leaf design" },
      { id: "b-09", eventId: weddingId, category: "MISCELLANEOUS", name: "Emergency Kit, Gratuities & Marriage License", estimated: 500, actual: 350, notes: "Buffer fund" },

      // Birthday Budget
      { id: "b-10", eventId: birthdayId, category: "VENUE", name: "Rooftop Glasshouse Lounge Buyout (6h)", estimated: 2500, actual: 2500, notes: "Includes panoramic city views and existing lounge seating" },
      { id: "b-11", eventId: birthdayId, category: "CATERING", name: "Gourmet Asian Street Food Skewers & Dim Sum", estimated: 2000, actual: 1950, notes: "Bao buns, yakitori, vegetarian gyoza" },
      { id: "b-12", eventId: birthdayId, category: "ENTERTAINMENT", name: "Synthwave DJ & Custom Laser Lighting Rig", estimated: 1400, actual: 1400, notes: "4-hour DJ set with custom cyber visuals" },
      { id: "b-13", eventId: birthdayId, category: "DECORATION", name: "Custom LED Neon Signs & Cyberpunk Balloon Clouds", estimated: 900, actual: 850, notes: "'Maya 30.0' neon sign centerpiece" },
      { id: "b-14", eventId: birthdayId, category: "PHOTOGRAPHY", name: "Retro Polaroid & Mirror Photo Booth", estimated: 700, actual: 650, notes: "Instant print guestbook with cyber props" },

      // Community Event Budget
      { id: "b-15", eventId: communityId, category: "VENUE", name: "City Park Special Event Permit & Park Ranger Fee", estimated: 1800, actual: 1800, notes: "Approved municipal park use permit" },
      { id: "b-16", eventId: communityId, category: "ENTERTAINMENT", name: "Stage Audio System, 3 Local Bands & Sound Engineer", estimated: 3600, actual: 3400, notes: "Full-day stage entertainment program" },
      { id: "b-17", eventId: communityId, category: "DECORATION", name: "Hay Bales, Autumn Bunting & Directional Signage", estimated: 1200, actual: 1100, notes: "Eco-friendly compostable signage" },
      { id: "b-18", eventId: communityId, category: "MISCELLANEOUS", name: "Portable Restrooms, Handwash Stations & Waste Dumpsters", estimated: 3200, actual: 3100, notes: "Sanitation compliance for 1000+ attendance" },
      { id: "b-19", eventId: communityId, category: "STATIONERY", name: "Flyers, Community Banners & Park Maps", estimated: 1500, actual: 1400, notes: "Printed on recycled kraft paper" },
      { id: "b-20", eventId: communityId, category: "TRANSPORTATION", name: "Volunteer Golf Carts & Traffic Cones Rental", estimated: 900, actual: 850, notes: "For senior citizen mobility and parking crew" },
    ],
    milestones: [
      // Wedding Milestones
      { id: "m-01", eventId: weddingId, title: "Lock in Vineyard Venue & Date", description: "Sign estate lease and pay initial reservation deposit.", dueDate: "2026-03-01T00:00:00.000Z", completed: true, phase: "INITIAL", sortOrder: 1 },
      { id: "m-02", eventId: weddingId, title: "Book Photographer and Drone Crew", description: "Review portfolios and confirm golden-hour shot list.", dueDate: "2026-04-15T00:00:00.000Z", completed: true, phase: "BOOKING", sortOrder: 2 },
      { id: "m-03", eventId: weddingId, title: "Finalize Tasting Menu & Wine Selection", description: "Menu tasting session with Head Chef at the estate.", dueDate: "2026-07-20T00:00:00.000Z", completed: true, phase: "PREPARATION", sortOrder: 3 },
      { id: "m-04", eventId: weddingId, title: "Send Formal Foil Invitations", description: "Track RSVPs and capture meal preference dietary notes.", dueDate: "2026-08-01T00:00:00.000Z", completed: true, phase: "PREPARATION", sortOrder: 4 },
      { id: "m-05", eventId: weddingId, title: "Final RSVP Count to Caterer", description: "Submit confirmed 120 head count and seating chart.", dueDate: "2026-10-01T00:00:00.000Z", completed: false, phase: "WEEK_OF", sortOrder: 5 },
      { id: "m-06", eventId: weddingId, title: "Ceremony Rehearsal & Welcome Dinner", description: "Walkthrough with bridal party and parents at 5 PM.", dueDate: "2026-10-17T17:00:00.000Z", completed: false, phase: "WEEK_OF", sortOrder: 6 },
      { id: "m-07", eventId: weddingId, title: "Wedding Day Execution", description: "Vendor load-in at 10 AM, guest arrival 3:30 PM, ceremony 4 PM.", dueDate: "2026-10-18T10:00:00.000Z", completed: false, phase: "DAY_OF", sortOrder: 7 },

      // Birthday Milestones
      { id: "m-08", eventId: birthdayId, title: "Confirm Rooftop Booking & Bar Minimum", description: "Signed agreement for exclusive terrace buyout.", dueDate: "2026-09-15T00:00:00.000Z", completed: true, phase: "INITIAL", sortOrder: 1 },
      { id: "m-09", eventId: birthdayId, title: "Commission Neon Sign 'Maya 30.0'", description: "Approve mockup and order bespoke pink/cyan LED neon.", dueDate: "2026-10-05T00:00:00.000Z", completed: true, phase: "BOOKING", sortOrder: 2 },
      { id: "m-10", eventId: birthdayId, title: "Finalize DJ Synthwave Playlist & Cue Times", description: "Coordinate with DJ Kai on birthday toast track.", dueDate: "2026-10-25T00:00:00.000Z", completed: false, phase: "PREPARATION", sortOrder: 3 },
      { id: "m-11", eventId: birthdayId, title: "Door Host & Wristband Setup", description: "Private elevator access code for rooftop guests.", dueDate: "2026-11-07T19:00:00.000Z", completed: false, phase: "DAY_OF", sortOrder: 4 },

      // Community Milestones
      { id: "m-12", eventId: communityId, title: "Submit City Parks Department Permit", description: "Include sound variance and emergency egress map.", dueDate: "2026-08-20T00:00:00.000Z", completed: true, phase: "INITIAL", sortOrder: 1 },
      { id: "m-13", eventId: communityId, title: "Curate 40 Artisan Vendor Applications", description: "Review maker applications and send booth acceptance emails.", dueDate: "2026-09-25T00:00:00.000Z", completed: true, phase: "BOOKING", sortOrder: 2 },
      { id: "m-14", eventId: communityId, title: "Volunteer Briefing & Walkie-Talkie Check", description: "Coordinate 35 neighborhood volunteer marshals.", dueDate: "2026-10-23T18:00:00.000Z", completed: false, phase: "WEEK_OF", sortOrder: 3 },
      { id: "m-15", eventId: communityId, title: "Festival Morning Setup & Booth Load-In", description: "Vendor load-in opens at 7 AM; public gates open at 10 AM.", dueDate: "2026-10-24T07:00:00.000Z", completed: false, phase: "DAY_OF", sortOrder: 4 },
    ],
    vendors: [
      // Wedding Vendors
      { id: "v-01", eventId: weddingId, name: "Valley Oak Harvest Catering", category: "Catering", contact: "Chef Marcus Vance", email: "chef@valleyoaknapa.com", phone: "(707) 555-0142", cost: 12800, status: "BOOKED", notes: "Award-winning wine country seasonal menu. Deposit paid.", rating: 5 },
      { id: "v-02", eventId: weddingId, name: "Golden Light Cinema & Photo", category: "Photography", contact: "Elena Rostova", email: "elena@goldenlightphoto.com", phone: "(415) 555-0198", cost: 4000, status: "BOOKED", notes: "Shoots with vintage Leica + 4K aerial drone.", rating: 5 },
      { id: "v-03", eventId: weddingId, name: "Wildflower & Thistle Florals", category: "Flowers", contact: "Chloe Bennett", email: "chloe@wildflowerthistle.com", phone: "(707) 555-0177", cost: 3600, status: "BOOKED", notes: "Local sustainable organic blooms with copper accents.", rating: 4 },
      { id: "v-04", eventId: weddingId, name: "The Midnight Groove Band", category: "Entertainment", contact: "David 'Groove' Evans", email: "booking@midnightgroove.live", phone: "(510) 555-0133", cost: 4500, status: "BOOKED", notes: "5-piece funk, soul, pop cover band with horn section.", rating: 5 },
      { id: "v-05", eventId: weddingId, name: "Napa Valley Executive Shuttles", category: "Transportation", contact: "Operations Desk", email: "charters@napashuttles.com", phone: "(707) 555-0111", cost: 1500, status: "QUOTED", notes: "Awaiting final pickup route itinerary.", rating: 4 },

      // Birthday Vendors
      { id: "v-06", eventId: birthdayId, name: "Skyline Lounge Events", category: "Venue", contact: "Sarah Chen", email: "events@skylinelounge.com", phone: "(415) 555-0210", cost: 2500, status: "PAID", notes: "Full glasshouse rooftop buyout, sound system included.", rating: 5 },
      { id: "v-07", eventId: birthdayId, name: "Bao & Blade Night Market", category: "Catering", contact: "Chef Tony Li", email: "tony@baoblade.com", phone: "(415) 555-0245", cost: 1950, status: "BOOKED", notes: "Live steam bun bar and glazed pork belly skewers.", rating: 5 },
      { id: "v-08", eventId: birthdayId, name: "DJ Kai (Neon Beat Lab)", category: "Entertainment", contact: "Kai Sorenson", email: "kai@neonbeatlab.io", phone: "(415) 555-0288", cost: 1400, status: "BOOKED", notes: "Cyberpunk visuals synced to custom audio tracks.", rating: 5 },

      // Community Vendors
      { id: "v-09", eventId: communityId, name: "Valley Acoustic Pro Audio", category: "AV & Sound", contact: "Jim Bradley", email: "sound@valleyacoustic.org", phone: "(510) 555-0312", cost: 3400, status: "BOOKED", notes: "Outdoor stage PA, microphones, generator power.", rating: 4 },
      { id: "v-10", eventId: communityId, name: "GreenWaste Eco Solutions", category: "Sanitation", contact: "Carla Gomez", email: "events@greenwaste.org", phone: "(510) 555-0374", cost: 3100, status: "BOOKED", notes: "Eco compost and recycle sort stations with on-site staff.", rating: 4 },
    ],
    aiSuggestions: [
      {
        id: "ai-01",
        eventId: weddingId,
        type: "plan",
        prompt: "Generate wedding plan for 120 guests with $45,000 budget in Napa Valley vineyard",
        content: JSON.stringify({
          summary: "A seamless romantic celebration accentuating Napa's golden hour light with farm-to-table cuisine and acoustic harmony.",
          keyRecommendations: [
            "Opt for an early ceremony (4:00 PM) to capture golden hour vineyard portraits before sunset.",
            "Utilize family-style wine pairing to encourage guest conversation at long rustic wooden tables.",
            "Install soft festoon lighting across the outdoor trellis to reduce auxiliary generator needs.",
          ],
        }),
        createdAt: "2026-09-01T10:05:00.000Z",
      },
      {
        id: "ai-02",
        eventId: birthdayId,
        type: "idea",
        prompt: "Generate cyberpunk rooftop 30th birthday themes and activities",
        content: JSON.stringify({
          cocktails: ["The Neon Matrix (butterfly pea gin + tonic glow)", "Cyber-Mule (spiced ginger beer + edible silver shimmer)"],
          experiences: ["Glow-in-the-dark temporary cyber tattoo station", "Retro arcade CRT cabinet tournament (Street Fighter / Tetris)"],
          playlistMood: "Carpenter Brut, The Midnight, Gunship, Kavinsky",
        }),
        createdAt: "2026-09-10T12:10:00.000Z",
      },
    ],
  };
}

/**
 * Loads the database into memory, creating directory and seed data if needed.
 */
function loadDatabase(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw);
    } else if (fs.existsSync(BUNDLED_DB_FILE)) {
      const raw = fs.readFileSync(BUNDLED_DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw);
      try {
        fs.writeFileSync(DB_FILE, raw, "utf-8");
      } catch {
        // Ignored in read-only environments
      }
    } else {
      const seed = createSeedData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
      } catch {
        // Ignored
      }
      memoryDb = seed;
    }
  } catch (err) {
    console.error("Failed to read database file, initializing with seed data:", err);
    memoryDb = createSeedData();
  }

  return memoryDb!;
}

/**
 * Flushes memory database to disk synchronously and safely.
 */
function saveDatabase(): void {
  if (!memoryDb) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Failed to write database file:", err);
  }
}

// ==========================================
// REPOSITORY METHODS
// ==========================================

export const dbRepository = {
  // --- EVENTS ---
  getAllEvents(): Event[] {
    const db = loadDatabase();
    return [...db.events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getEventById(id: string): Event | null {
    const db = loadDatabase();
    return db.events.find((e) => e.id === id) || null;
  },

  getEventWithDetails(id: string): EventWithDetails | null {
    const db = loadDatabase();
    const event = db.events.find((e) => e.id === id);
    if (!event) return null;

    return {
      ...event,
      budgetItems: db.budgetItems.filter((b) => b.eventId === id),
      milestones: db.milestones
        .filter((m) => m.eventId === id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      vendors: db.vendors.filter((v) => v.eventId === id),
    };
  },

  createEvent(input: CreateEventInput): Event {
    const db = loadDatabase();
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: `event-${uuidv4().substring(0, 8)}`,
      name: input.name,
      type: input.type,
      date: input.date,
      location: input.location || "",
      guestCount: input.guestCount,
      totalBudget: input.totalBudget,
      description: input.description || "",
      status: "PLANNING",
      createdAt: now,
      updatedAt: now,
    };

    db.events.unshift(newEvent);
    saveDatabase();
    return newEvent;
  },

  updateEvent(id: string, input: UpdateEventInput): Event | null {
    const db = loadDatabase();
    const index = db.events.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const existing = db.events[index];
    const updated: Event = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    db.events[index] = updated;
    saveDatabase();
    return updated;
  },

  deleteEvent(id: string): boolean {
    const db = loadDatabase();
    const initialLen = db.events.length;
    db.events = db.events.filter((e) => e.id !== id);
    // Cascade delete related records
    db.budgetItems = db.budgetItems.filter((b) => b.eventId !== id);
    db.milestones = db.milestones.filter((m) => m.eventId !== id);
    db.vendors = db.vendors.filter((v) => v.eventId !== id);
    db.aiSuggestions = db.aiSuggestions.filter((a) => a.eventId !== id);

    const deleted = db.events.length < initialLen;
    if (deleted) saveDatabase();
    return deleted;
  },

  // --- BUDGET ITEMS ---
  getBudgetItems(eventId: string): BudgetItem[] {
    const db = loadDatabase();
    return db.budgetItems.filter((b) => b.eventId === eventId);
  },

  createBudgetItem(input: CreateBudgetInput): BudgetItem {
    const db = loadDatabase();
    const newItem: BudgetItem = {
      id: `b-${uuidv4().substring(0, 8)}`,
      eventId: input.eventId,
      category: input.category,
      name: input.name,
      estimated: input.estimated,
      actual: input.actual ?? null,
      notes: input.notes || "",
    };

    db.budgetItems.push(newItem);
    saveDatabase();
    return newItem;
  },

  updateBudgetItem(id: string, updates: Partial<Omit<BudgetItem, "id" | "eventId">>): BudgetItem | null {
    const db = loadDatabase();
    const index = db.budgetItems.findIndex((b) => b.id === id);
    if (index === -1) return null;

    db.budgetItems[index] = { ...db.budgetItems[index], ...updates };
    saveDatabase();
    return db.budgetItems[index];
  },

  deleteBudgetItem(id: string): boolean {
    const db = loadDatabase();
    const initialLen = db.budgetItems.length;
    db.budgetItems = db.budgetItems.filter((b) => b.id !== id);
    const deleted = db.budgetItems.length < initialLen;
    if (deleted) saveDatabase();
    return deleted;
  },

  // --- MILESTONES ---
  getMilestones(eventId: string): Milestone[] {
    const db = loadDatabase();
    return db.milestones
      .filter((m) => m.eventId === eventId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  createMilestone(input: CreateMilestoneInput): Milestone {
    const db = loadDatabase();
    const existingForEvent = db.milestones.filter((m) => m.eventId === input.eventId);
    const newItem: Milestone = {
      id: `m-${uuidv4().substring(0, 8)}`,
      eventId: input.eventId,
      title: input.title,
      description: input.description || "",
      dueDate: input.dueDate,
      completed: false,
      phase: input.phase,
      sortOrder: input.sortOrder ?? existingForEvent.length + 1,
    };

    db.milestones.push(newItem);
    saveDatabase();
    return newItem;
  },

  updateMilestone(id: string, updates: Partial<Omit<Milestone, "id" | "eventId">>): Milestone | null {
    const db = loadDatabase();
    const index = db.milestones.findIndex((m) => m.id === id);
    if (index === -1) return null;

    db.milestones[index] = { ...db.milestones[index], ...updates };
    saveDatabase();
    return db.milestones[index];
  },

  deleteMilestone(id: string): boolean {
    const db = loadDatabase();
    const initialLen = db.milestones.length;
    db.milestones = db.milestones.filter((m) => m.id !== id);
    const deleted = db.milestones.length < initialLen;
    if (deleted) saveDatabase();
    return deleted;
  },

  // --- VENDORS ---
  getVendors(eventId: string): Vendor[] {
    const db = loadDatabase();
    return db.vendors.filter((v) => v.eventId === eventId);
  },

  createVendor(input: CreateVendorInput): Vendor {
    const db = loadDatabase();
    const newItem: Vendor = {
      id: `v-${uuidv4().substring(0, 8)}`,
      eventId: input.eventId,
      name: input.name,
      category: input.category,
      contact: input.contact || "",
      email: input.email || "",
      phone: input.phone || "",
      cost: input.cost ?? null,
      status: input.status || "RESEARCHING",
      notes: input.notes || "",
      rating: input.rating ?? null,
    };

    db.vendors.push(newItem);
    saveDatabase();
    return newItem;
  },

  updateVendor(id: string, updates: Partial<Omit<Vendor, "id" | "eventId">>): Vendor | null {
    const db = loadDatabase();
    const index = db.vendors.findIndex((v) => v.id === id);
    if (index === -1) return null;

    db.vendors[index] = { ...db.vendors[index], ...updates };
    saveDatabase();
    return db.vendors[index];
  },

  deleteVendor(id: string): boolean {
    const db = loadDatabase();
    const initialLen = db.vendors.length;
    db.vendors = db.vendors.filter((v) => v.id !== id);
    const deleted = db.vendors.length < initialLen;
    if (deleted) saveDatabase();
    return deleted;
  },

  // --- AI SUGGESTIONS ---
  getAISuggestions(eventId: string): AISuggestion[] {
    const db = loadDatabase();
    return db.aiSuggestions
      .filter((a) => a.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createAISuggestion(data: { eventId: string; type: "plan" | "budget" | "idea" | "vendor"; content: string; prompt: string }): AISuggestion {
    const db = loadDatabase();
    const newSuggestion: AISuggestion = {
      id: `ai-${uuidv4().substring(0, 8)}`,
      eventId: data.eventId,
      type: data.type,
      content: data.content,
      prompt: data.prompt,
      createdAt: new Date().toISOString(),
    };

    db.aiSuggestions.unshift(newSuggestion);
    saveDatabase();
    return newSuggestion;
  },

  // --- BULK IMPORT FROM AI PLAN ---
  applyAIPlanToEvent(
    eventId: string,
    plan: {
      budgetBreakdown?: Array<{ category: string; name: string; estimatedCost: number; notes?: string }>;
      timeline?: Array<{ phase: string; title: string; description: string; daysBeforeEvent?: number }>;
      vendorChecklist?: Array<{ category: string; name: string; estimatedCost: number; notes?: string }>;
    }
  ): void {
    const db = loadDatabase();
    const event = db.events.find((e) => e.id === eventId);
    if (!event) return;

    const eventDate = new Date(event.date);

    // Apply budget items
    if (plan.budgetBreakdown && plan.budgetBreakdown.length > 0) {
      for (const item of plan.budgetBreakdown) {
        db.budgetItems.push({
          id: `b-${uuidv4().substring(0, 8)}`,
          eventId,
          category: (item.category as BudgetCategory) || "MISCELLANEOUS",
          name: item.name,
          estimated: item.estimatedCost || 0,
          actual: null,
          notes: item.notes || "Generated by GenAI Assistant",
        });
      }
    }

    // Apply timeline milestones
    if (plan.timeline && plan.timeline.length > 0) {
      plan.timeline.forEach((item, idx) => {
        const days = item.daysBeforeEvent ?? (10 - idx * 2);
        const milestoneDate = new Date(eventDate);
        milestoneDate.setDate(milestoneDate.getDate() - Math.max(0, days));

        db.milestones.push({
          id: `m-${uuidv4().substring(0, 8)}`,
          eventId,
          title: item.title,
          description: item.description || "",
          dueDate: milestoneDate.toISOString(),
          completed: false,
          phase: (item.phase as TimelinePhase) || "PLANNING",
          sortOrder: idx + 1,
        });
      });
    }

    // Apply vendor checklist
    if (plan.vendorChecklist && plan.vendorChecklist.length > 0) {
      for (const v of plan.vendorChecklist) {
        db.vendors.push({
          id: `v-${uuidv4().substring(0, 8)}`,
          eventId,
          name: v.name,
          category: v.category || "Service",
          contact: "",
          email: "",
          phone: "",
          cost: v.estimatedCost || null,
          status: "RESEARCHING",
          notes: v.notes || "Recommended by GenAI Assistant",
          rating: null,
        });
      }
    }

    saveDatabase();
  },
};
