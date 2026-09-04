import { parseContent, projectSchema, type Project } from "./schema";
import { z } from "zod";

/**
 * COPY.md §4 — WarmChats · Intelligent restaurant search. Two, not three.
 *
 * OPAL is removed entirely (PLAN.md §12: "Dropped — ship two"). Its only asset is
 * an AI-generated mockup — garbled wordmark, "SIGH NOW" CTA, invented product
 * names — and it has no write-up, so it cannot be substantiated. Add a third here
 * when a real screenshot and a real write-up both exist; no component changes.
 *
 * Restaurant search is also `awaiting-asset`: /work/restaurant-search does not
 * exist yet (PLAN.md §6 moves the write-up there), and COPY.md forbids "a claim
 * about a project we can't link to". The schema refine() enforces this — set it
 * to "published" without both a screenshot and an href and the build fails.
 */
export const projects: Project[] = parseContent(
  z.array(projectSchema),
  [
    {
      id: "warmchats",
      name: "WarmChats",
      summary:
        "Always-first AI follow-up for real estate agents: Claude qualifies and routes every new lead, GPT-4.1 replies on email and SMS, and bookings write straight to the calendar.",
      stack: ["Claude", "GPT-4.1", "Microservices"],
      screenshot: "/projects/warmchats-ai-booking.png",
      screenshotAlt:
        "WarmChats landing page: turn new real estate leads into booked appointments automatically",
      href: "/work/warmchats",
      state: "published",
      metricIds: ["first-reply"],
      // Not yet rewritten to the nine-part template (spec §6 step 2). The body
      // stays null because problem / constraints / decisions / retrospective have
      // not been written by anyone, and none of them can be inferred from the
      // existing page copy.
      template: "summary",
      body: null,
    },
    {
      id: "restaurant-search",
      name: "Intelligent restaurant search",
      summary:
        "Conversational discovery with explicit routing, predictable AI unit economics, and latency targets suitable for high-volume production traffic.",
      stack: ["NestJS", "PostGIS", "pgvector", "Redis"],
      screenshot: "/projects/case-fnb-smart-search.png",
      screenshotAlt:
        "Case study visual for AI-assisted restaurant search and discovery product",
      href: "/work/restaurant-search",
      state: "published",
      metricIds: ["search-response", "cost-per-query", "haiku-routing"],
      template: "summary",
      body: null,
    },
  ],
  "projects.ts",
);
