import { parseContent, projectSchema, projectSectionsSchema, type Project, type ProjectSection } from "./schema";
import { z } from "zod";

/**
 * Every project the site shows, each labelled with who built it — decided by
 * the owner on 2026-09-15 (CLAUDE.md, "Projects and attribution"). The words
 * and facts are the owner's portfolio's (imran-khan-chi.vercel.app) — nothing
 * is invented: no metric, client, role or date that it does not state.
 *
 * - Case studies: WarmChats and restaurant search, each with its write-up.
 * - Bolt Fusion projects: FanLock, Balanzify, Go Style Business — confirmed by
 *   the owner as Bolt Fusion deliveries. Balanzify belongs to Balanzify Inc.,
 *   WarmChats to WarmChats, Inc.: "built by Bolt Fusion for …", never ours.
 * - Bolt Fusion feature work (`scope: "features"`, owner, 2026-09-16): Bazzile
 *   (Bazzile Technology SA) and GodConnect Online (GodConnect LTD), delivered
 *   through Bolt Fusion as features inside those companies' apps. We did not
 *   build the apps, so the label is "features built by Bolt Fusion for …",
 *   never "built by Bolt Fusion". Text cards with their store links: the apps'
 *   UI is the clients', so no screenshot without their permission. GodConnect's
 *   role says only "feature work": the portfolio does not say which features
 *   were ours. Bazzile's "70,000 downloads" is the client's growth, not ours,
 *   and is not shown (check 30 fails it on /work).
 * - In-house: OPAL. The card uses a real screenshot of the live store. Its old
 *   asset, an AI-generated mockup banned by PLAN.md, was deleted on 2026-09-16
 *   so nothing can reuse it.
 * - Our engineers' track record: work shipped at previous employers, credited
 *   to them — employer and role on the card, never called our client, no
 *   screenshot and no confidential detail.
 *
 * Held back, and why:
 * - Playzone (in-house) is `awaiting-asset`: on 2026-09-16 its only link,
 *   playzone-update.vercel.app, redirected to a sign-in page for "Playerzone"
 *   ("a platform for players to connect with coaches and other players"), not
 *   the multiplayer classic-games platform with no signups the portfolio
 *   describes. A card would show one product under another's name.
 *
 * Excluded for good (owner, 2026-09-15) — never add them: the Jumatechs apps
 * (Myrep, IQ Test, Cleva, Bidesh App; Jumatechs is the owner's current
 * employer); Bangladesh RAB (built by Intellier; RAB has been under US Treasury
 * sanctions since December 2021); Team Pharma and JTI Sheikh.
 *
 * Only `published` projects render. The schema refines who-built-it into the
 * data: a track-record project without its employer fails the build.
 */
export const projects: Project[] = parseContent(
  z.array(projectSchema),
  [
    /* ── case studies ─────────────────────────────────────────────────────── */
    {
      id: "warmchats",
      name: "WarmChats",
      kind: "case-study",
      summary:
        "Always-first AI follow-up for real estate agents: Claude qualifies and routes every new lead, GPT-4.1 replies on email and SMS, and bookings write straight to the calendar.",
      role: "Backend lead: the Django CRM core, NestJS and Flask services, Telnyx voice and SMS, and Claude for the messaging",
      client: "WarmChats, Inc.",
      status: "live",
      stack: ["Claude", "GPT-4.1", "Microservices"],
      image: {
        src: "/projects/warmchats-ai-booking.png",
        alt: "WarmChats landing page: turn new real estate leads into booked appointments automatically",
        width: 1024,
        height: 585,
      },
      href: "/work/warmchats",
      links: [{ label: "warmchats.com", href: "https://www.warmchats.com/" }],
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
      kind: "case-study",
      summary:
        "Conversational discovery with explicit routing, predictable AI unit economics, and latency targets suitable for high-volume production traffic.",
      // The write-up's own words: "We delivered a multi-tenant restaurant
      // discovery microservice". It names no client and no live URL.
      role: "The multi-tenant restaurant discovery microservice",
      stack: ["NestJS", "PostGIS", "pgvector", "Redis"],
      image: {
        src: "/projects/case-fnb-smart-search.png",
        alt: "Case study visual for AI-assisted restaurant search and discovery product",
        width: 1024,
        height: 640,
      },
      href: "/work/restaurant-search",
      state: "published",
      metricIds: ["search-response", "cost-per-query", "haiku-routing"],
      template: "summary",
      body: null,
    },

    /* ── Bolt Fusion projects ─────────────────────────────────────────────── */
    {
      id: "fanlock",
      name: "FanLock",
      kind: "project",
      summary:
        "A content-protection platform for online creators that scans Telegram, Google and social media for leaked content and automates takedowns.",
      role: "Backend lead",
      status: "live",
      stack: ["Next.js", "Django"],
      image: {
        src: "/projects/fanlock.webp",
        alt: "FanLock's live homepage: the “Everything You Need to Fight Leaks” section and the first of its feature cards",
        width: 1440,
        height: 900,
      },
      links: [{ label: "fanlock-pi.vercel.app", href: "https://fanlock-pi.vercel.app/" }],
      state: "published",
    },
    {
      id: "balanzify",
      name: "Balanzify",
      kind: "project",
      summary: "An HR and payroll platform, built as NestJS microservices that all speak GraphQL.",
      role: "The platform's microservices: onboarding, payslips, attendance, tax logic and leave management",
      client: "Balanzify Inc.",
      status: "in-production",
      period: "Jul 2025 – ongoing",
      stack: ["NestJS", "PostgreSQL", "GraphQL", "Microservices"],
      image: {
        src: "/projects/balanzify.webp",
        alt: "Balanzify's live migration page: “Your data. Fully migrated. In one afternoon.”, with Balanzify's own marketing figures below it",
        width: 1440,
        height: 900,
      },
      links: [{ label: "balanzify.com", href: "https://balanzify.com/" }],
      state: "published",
    },
    {
      id: "go-style-business",
      name: "Go Style Business",
      kind: "project",
      summary: "A salon business management platform, in production serving real salons.",
      role: "Backend lead: a multi-tenant NestJS and Prisma backend on PostgreSQL, deployed on Docker Swarm",
      status: "in-production",
      stack: ["NestJS", "Prisma", "PostgreSQL", "Docker Swarm"],
      image: {
        // The product's only public page: everything else is behind the sign-in.
        src: "/projects/go-style-business.webp",
        alt: "The Go Style Business sign-in page at business.gostyle.uk, the product's only public page",
        width: 1440,
        height: 900,
      },
      links: [{ label: "business.gostyle.uk", href: "https://business.gostyle.uk/" }],
      state: "published",
    },

    /* ── Bolt Fusion feature work, inside other companies' apps ───────────── */
    {
      id: "bazzile",
      name: "Bazzile",
      kind: "project",
      scope: "features",
      summary:
        "A Swiss real-estate marketplace app based in Geneva: listings come only from professional agencies, are ranked by an AI matching model, and sync with most agency CRMs.",
      role: "Features in the React Native app: swipe-based browsing, Google Maps location matching and Firebase real-time sync",
      client: "Bazzile Technology SA",
      status: "live",
      period: "Jan 2025 – Jul 2025",
      stack: ["React Native", "Firebase", "Redux-Saga", "Reanimated", "NestJS"],
      links: [
        { label: "App Store", href: "https://apps.apple.com/fr/app/bazzile/id1622224603" },
        { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.bazzile.app" },
      ],
      state: "published",
    },
    {
      id: "godconnect-online",
      name: "GodConnect Online",
      kind: "project",
      scope: "features",
      summary: "A community app with groups, live broadcasts, messaging, media uploads and a GPS-based church finder.",
      // The portfolio says "Shipped features for GodConnect Online" and no more:
      // which features were ours is not on record, so none is named.
      role: "Feature work in the React Native app",
      client: "GodConnect LTD",
      status: "live",
      period: "2023 – 2024",
      stack: ["React Native", "Redux-Saga", "WatermelonDB", "Firebase"],
      links: [
        { label: "App Store", href: "https://apps.apple.com/us/app/godconnect-online/id1518393186" },
        { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.godconnect.online" },
      ],
      state: "published",
    },

    /* ── in-house products ────────────────────────────────────────────────── */
    {
      id: "opal",
      name: "OPAL",
      kind: "in-house",
      summary: "A curated fashion and tech e-commerce store.",
      role: "Co-founded and built it: catalogue, cart, secure checkout and order tracking",
      status: "live",
      stack: ["Next.js", "Firebase", "Firestore"],
      image: {
        src: "/projects/opal.webp",
        alt: "OPAL's live shop page: “The collection”, its category list and the first products in the catalogue",
        width: 1440,
        height: 900,
      },
      links: [{ label: "opal-sooty.vercel.app", href: "https://opal-sooty.vercel.app/" }],
      state: "published",
    },
    {
      // Held back — see the note at the top of this file. No status: the live
      // URL does not show this product, so "live" cannot be substantiated.
      id: "playzone",
      name: "Playzone",
      kind: "in-house",
      summary: "A real-time multiplayer platform for classic games with friends, no signups required.",
      role: "Full stack: NestJS microservices for game logic and matchmaking, PostgreSQL, Socket.IO and a Next.js frontend, in Docker",
      period: "2024 – present",
      stack: ["Next.js", "TypeScript", "NestJS", "Socket.IO", "PostgreSQL", "Docker"],
      state: "awaiting-asset",
    },

    /* ── our engineers' track record ──────────────────────────────────────── */
    {
      id: "go-smart",
      name: "Go Smart",
      kind: "track-record",
      summary: "Modhumoti Bank's digital banking app, a production system still serving live customers.",
      role: "Software Engineer: secure backend services",
      builtAt: "Brain Station 23",
      status: "in-production",
      period: "2020–2022",
      stack: ["NestJS", "Django", "Node.js", "REST APIs", "PostgreSQL"],
      links: [
        {
          label: "The Daily Star",
          href: "https://www.thedailystar.net/business/news/brain-station-23-the-homegrown-fintech-firm-enabling-local-banks-go-digital-1952185",
        },
        { label: "Google Play", href: "https://play.google.com/store/apps/details?id=modhumotibankltd.com" },
      ],
      state: "published",
    },
    {
      id: "nidle-finishing",
      name: "NIdle Finishing",
      kind: "track-record",
      summary: "Finishing-stage digitisation for a ready-made-garments factory floor.",
      role: "Senior Software Engineer: a React Native app over GraphQL and NestJS",
      builtAt: "Intellier",
      period: "Nov 2023 – Feb 2024",
      stack: ["React Native", "GraphQL", "NestJS"],
      links: [{ label: "Intellier's case study", href: "https://intellier.com/nidle/" }],
      state: "published",
    },
  ],
  "projects.ts",
);

/** /work's sections, in page order: one per kind. */
export const projectSections: ProjectSection[] = parseContent(
  projectSectionsSchema,
  [
    { kind: "case-study", id: "case-studies", title: "Case studies", intro: null },
    { kind: "project", id: "projects", title: "Bolt Fusion projects", intro: null },
    { kind: "in-house", id: "in-house", title: "In-house products", intro: null },
    {
      kind: "track-record",
      id: "track-record",
      title: "Our engineers’ track record",
      intro: "Work our engineers shipped at previous employers — credited to them, not claimed as ours.",
    },
  ],
  "projects.ts (sections)",
);
