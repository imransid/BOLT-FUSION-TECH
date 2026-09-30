import { clientStorySchema, parseContent, projectSchema, projectSectionsSchema, type ClientStory, type Project, type ProjectSection } from "./schema";
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
 * - TTouch Clothing's four systems (owner, 2026-09-29): Delivery Lens BD, TTouch
 *   Wholesale, Sudarshini (a TTouch brand) and TTouch Employee Verification —
 *   full builds for one client, shown together as its client story
 *   (`clientStories`, below). Their provenance is in the note above them.
 * - Bolt Fusion feature work (`scope: "features"`, owner, 2026-09-16): Bazzile
 *   (Bazzile Technology SA) and GodConnect Online (GodConnect LTD), delivered
 *   through Bolt Fusion as features inside those companies' apps. We did not
 *   build the apps, so the label is "features built by Bolt Fusion for …",
 *   never "built by Bolt Fusion". The apps' UI is the clients', so a card
 *   never shows a generic screenshot of the app. Since 2026-09-30 (the owner,
 *   with Bazzile's permission) Bazzile's card shows its feature screens — two
 *   of its App Store screenshots, only the screens where our features live,
 *   each captioned with its feature — and Google Play's public install band,
 *   linked to the listing. GodConnect's role says only "feature work": the
 *   portfolio does not say which features were ours, so it has no screens and
 *   stays a text card. Bazzile's "70,000 downloads" and "15,000 active users"
 *   are the client's growth, not ours, and are never shown (check 30 fails
 *   them on / and /work).
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
 * - NIdle Finishing (track record) is `awaiting-asset` since 2026-09-28: its
 *   only proof link, "Intellier's case study" (intellier.com/nidle/), 301s to
 *   a bare PNG. A proof link that opens an image hurts trust, so it went
 *   (DECISIONS 2026-09-28, item 8), and a track-record text card without a
 *   proof link is not published (the schema). It returns with a working link.
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

    /* ── TTouch Clothing: four systems for one client (owner, 2026-09-29) ────
     * Provenance. The owner, 2026-09-29 (research/projects/OWNER-ANSWERS.md):
     * all four are full builds — design, the website or app, the backend and
     * the database — by Bolt Fusion as an outside vendor to TTouch Clothing, so
     * each reads "built by Bolt Fusion for TTouch Clothing"; Sudarshini is a
     * TTouch brand, credited the same way. His word is the only source: there is
     * no repository, commit or document on record for any of them (searched
     * 2026-09-29), so no date, duration, team size or database is stated.
     * Every summary and role says only what the public sites show (their pages,
     * titles and shipped bundles, seen 2026-09-28/29) and what the owner said.
     *
     * THE CREDIT. The four sites' footers credit "TTouch Clothing (IT
     * Department)" — none mentions Bolt Fusion. Never say that a Bolt Fusion
     * credit exists on them; the owner is asking TTouch to add one.
     *
     * No figures: the sites' own counters, catalogue sizes, speed and accuracy
     * claims are the client's marketing, not our metrics. The stack tags are
     * the public fingerprints in the site's evidenced stack words (React,
     * Next.js, Node.js, Django, REST) and name no database.
     *
     * Screenshots (captured 2026-09-29): public pages only, Playwright at
     * 1440x900 with every non-GET request, the Meta Pixel and the Cloudflare
     * beacon blocked, never a login or a typed field, never a face, no personal
     * data. Each note says which view. A recapture follows the same rules. */
    {
      id: "delivery-lens-bd",
      name: "Delivery Lens BD",
      kind: "project",
      summary:
        "A subscription web app for online sellers in Bangladesh: enter a customer's mobile number, and it checks their delivery record across several couriers and rates the risk before the order ships. It also runs bulk checks and has a developer API.",
      role: "The whole build: design, the web app, subscriptions, the developer API, the admin console and the database",
      client: "TTouch Clothing",
      status: "live",
      stack: ["Next.js", "Node.js"],
      tagline: "Courier-risk checks for online sellers",
      image: {
        // The homepage hero with its demo card settled on TTouch's own published
        // contact number — never a frame showing the demo's other two numbers,
        // whose owners are unknown. The couriers' logos are the product's UI:
        // they are never named as our partners.
        src: "/projects/delivery-lens-bd.webp",
        alt: "Delivery Lens BD's homepage: “Know Your Customer Before You Ship.”, beside the product's demo card showing a delivery score and a courier-by-courier breakdown",
        width: 1440,
        height: 900,
      },
      links: [{ label: "deliverylensbd.com", href: "https://deliverylensbd.com/" }],
      state: "published",
    },
    {
      id: "ttouch-wholesale",
      name: "TTouch Wholesale",
      kind: "project",
      summary:
        "A wholesale portal for TTouch Clothing: shops register, and once approved they browse the catalogue and see trade prices, while the back office runs quotations, sales memos, supplier stock and accounts, and the pricing rules.",
      role: "The whole build: design, the customer portal, the admin back office, the API and the database",
      client: "TTouch Clothing",
      status: "live",
      stack: ["React", "Django", "REST"],
      tagline: "An approval-based wholesale portal",
      image: {
        // The public catalogue's first screen: no product images and no prices
        // (they sit behind "See Price" and an approved login).
        src: "/projects/ttouch-wholesale.webp",
        alt: "TTouch Wholesale's public catalogue: “Wholesale products with approval-based access.”, the product search, and catalogue cards that show a See Price button instead of a price",
        width: 1440,
        height: 900,
      },
      links: [{ label: "wholesale.ttouch.clothing", href: "https://wholesale.ttouch.clothing/" }],
      state: "published",
    },
    {
      id: "sudarshini",
      name: "Sudarshini",
      kind: "project",
      // "TTouch Clothing's saree brand": the owner's answer — neither site says so.
      summary:
        "The online store of Sudarshini, TTouch Clothing's saree brand: shoppable product videos, shopping by design code or by fabric, cash-on-delivery checkout, and an admin for products, orders, delivery charges and seasonal themes.",
      role: "The whole build: design, the storefront, the admin, the API and the database",
      client: "TTouch Clothing",
      status: "live",
      stack: ["React", "Node.js"],
      tagline: "The Sudarshini saree store",
      image: {
        // The store's admin sign-in page, as it loads: a 1440x900 capture at
        // DPR 1, the scale of the other three (recaptured 2026-09-29). Every
        // storefront view shows the brand's model or a painted goddess behind
        // the grid, and its prices and SKUs (the owner: "a view with no face";
        // no prices — answer 3), so no storefront view qualifies; answer 3
        // allows a sign-in page, as Go Style Business's card shows. The first
        // capture, a product page's details panel cropped from DPR 3, was
        // about 2.5 times the others' scale and showed a price and a SKU (the
        // design and honesty reviews).
        src: "/projects/sudarshini-signin.webp",
        alt: "The Sudarshini store's admin sign-in page: “Welcome back”, “Sign in to manage products, banners, menus, orders, and admins.”, the email and password fields and the Login button",
        width: 1440,
        height: 900,
      },
      links: [{ label: "sudarshini.com", href: "https://sudarshini.com/" }],
      state: "published",
    },
    {
      id: "ttouch-employee-verification",
      name: "TTouch Employee Verification",
      kind: "project",
      // Deliberately does not say which details the check takes.
      summary:
        "A public page where anyone can check that a person really works at TTouch Clothing, and a back office where HR keeps staff records and departments, with an audit log of every check.",
      role: "The whole build: design, the verification page, the HR back office, the API and the database",
      client: "TTouch Clothing",
      status: "live",
      stack: ["React", "Node.js"],
      tagline: "Employee verification and HR records",
      image: {
        // The public verify page with nothing entered: never a result, never
        // anything behind the admin sign-in. The field placeholders are dummies.
        src: "/projects/ttouch-employee-verification.webp",
        alt: "TTouch Clothing's employee verification page with nothing entered: the employee ID and date-of-birth form, an empty result panel and the privacy note",
        width: 1440,
        height: 900,
      },
      // Linked by the owner's choice (2026-09-29, answer 9: "It already has a
      // rate limit / protection") — his statement, not verified by us.
      links: [{ label: "employee.ttouch.clothing", href: "https://employee.ttouch.clothing/" }],
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
      /* The owner, 2026-09-30: "Yes, show our feature screens" — Bazzile's own
         App Store (FR) screenshots, only the two where our features live (the
         listing-detail and favourites screens are not features we claim, and
         the fifth shows a face). Each is cropped to the phone's screen: the
         store image's pink ground, French headline and drawn phone are
         Bazzile's marketing around it. */
      featureScreens: [
        {
          feature: "swipe-based browsing",
          caption: "Swipe-based browsing",
          image: {
            src: "/projects/bazzile-swipe-browsing.webp",
            alt: "Bazzile's swipe browsing, from its App Store screenshots: a listing card over the map, with dismiss and like buttons beneath it — a feature Bolt Fusion built",
            width: 880,
            height: 1760,
          },
        },
        {
          feature: "Google Maps location matching",
          caption: "Google Maps location matching",
          image: {
            src: "/projects/bazzile-map-matching.webp",
            alt: "Bazzile's map, from its App Store screenshots: listings pinned by price across Paris, with the matched listing's card below — the Google Maps location matching Bolt Fusion built",
            width: 880,
            height: 1760,
          },
        },
      ],
      /* The owner, 2026-09-30: "Google Play's public count" — the install band
         the Play listing shows (read that day: "100K+ Downloads"), the app's
         reach and not a claim about our work. The owner's own 70,000 and
         15,000 stay off the site. */
      publicStat: {
        text: "100K+ downloads on Google Play",
        href: "https://play.google.com/store/apps/details?id=com.bazzile.app",
        source: "The whole app’s install count on its Google Play listing — its reach, not a measure of our features",
        read: "2026-09-30",
      },
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
      // Held back 2026-09-28 — see the note at the top of this file. Its only
      // link, intellier.com/nidle/, 301s to a bare PNG.
      links: [],
      state: "awaiting-asset",
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

/** Feature work's own words (2026-09-30): /work's section — straight after
 *  the client stories, Bazzile first and featured with its screens — and the
 *  homepage's tile in the proof. The title is the sub-group heading /work
 *  has carried since 2026-09-16. Never "built by": the apps are the clients'. */
export const featureWork = {
  id: "feature-work",
  eyebrow: "Feature work",
  title: "Features we shipped into other companies’ apps",
  intro: "Features we built inside apps other companies own. The apps are theirs: each card names the company and only the features that were ours.",
} as const;

/* ── client stories (2026-09-29) ─────────────────────────────────────────── */

/** A story's members: every published product project whose client is the
 *  story's, byte for byte, in `projects` order. Computed, never stored. Read
 *  from the raw data too (the suite loads this file unparsed), so a scope left
 *  out is "product". */
export function clientStoryMembers(story: Pick<ClientStory, "client">): Project[] {
  return projects.filter((p) => p.state === "published" && p.kind === "project" && (p.scope ?? "product") === "product" && p.client === story.client);
}

const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** A count as the site writes it in a sentence: "four". */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** What the build refuses, in this file's own voice: a story that is not a set
 *  (under two members), a count in its words that is not its member count
 *  ("Four systems" cannot outlive a fifth card, or a card taken down), and
 *  "live" said of a set whose members are not all live. */
function checkedStories(list: ClientStory[]): ClientStory[] {
  const ids = new Set<string>();
  for (const story of list) {
    const where = `content/projects.ts (client stories), "${story.id}"`;
    if (ids.has(story.id)) throw new Error(`${where}: listed twice`);
    ids.add(story.id);
    const members = clientStoryMembers(story);
    if (members.length < 2)
      throw new Error(
        `${where}: a client story is a set — it needs at least two published product projects for "${story.client}", and has ${members.length}. Show a lone project as its own card.`,
      );
    for (const [field, text] of [["title", story.title], ["intro", story.intro]] as const) {
      const counts = [...text.matchAll(new RegExp(`\\b(${COUNT_WORDS.join("|")}|\\d+)\\b`, "gi"))].map((m) => m[1].toLowerCase());
      for (const c of counts) {
        const n = /^\d+$/.test(c) ? Number(c) : COUNT_WORDS.indexOf(c);
        if (n !== members.length)
          throw new Error(`${where}: its ${field} says "${c}", and "${story.client}" has ${countWord(members.length)} published product projects — the count is the data's`);
      }
      if (/\blive\b/i.test(text) && members.some((p) => p.status !== "live"))
        throw new Error(`${where}: its ${field} says the set is live, and ${members.filter((p) => p.status !== "live").map((p) => p.name).join(", ")} is not`);
    }
  }
  return list;
}

/** The client stories, in page order. */
export const clientStories: ClientStory[] = checkedStories(
  parseContent(
    z.array(clientStorySchema),
    [
      {
        id: "ttouch-clothing",
        client: "TTouch Clothing",
        // Not "came back for four": that would claim four separate engagements,
        // which the owner has not said (PROPOSAL §7, question 5).
        title: "Four systems for TTouch Clothing",
        // "A fashion brand from Bangladesh" is TTouch's own description of
        // itself (ttouch.clothing). "End to end" is the owner's answer: design,
        // app, backend and database, for all four.
        intro:
          "TTouch Clothing is a fashion brand from Bangladesh. We built four of its systems end to end — design, apps, backends and databases: a courier-risk web app for online sellers, a wholesale portal, the Sudarshini saree store, and employee verification with its HR back office. All four are live.",
      },
    ],
    "projects.ts (client stories)",
  ),
);
