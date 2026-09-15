import "server-only";

import { CANONICAL_DESCRIPTION, COMPANY_LINE } from "./canonical";
import { parseContent } from "./schema";
import { SCHEDULE_HREF, SCHEDULE_LABEL, siteContentSchema, type SiteContent, type SiteContentInput } from "./site-schema";

/**
 * The site's content — the navigation and footer every page shares, the
 * homepage's hero, stories, team, FAQ and final call to action, /contact, and
 * the restaurant case study — as one typed object. The engineering content
 * (capabilities, industries, stages, depth, the system map) is
 * content/engineering.ts. It was the CMS's code
 * defaults; the CMS was removed on 2026-09-11 and this is simply the content.
 * Parsed when the module loads, like every other /content file, so a malformed
 * entry fails `next build` with the file named, instead of reaching a page.
 *
 * Server-only: server components read it and pass each client component only
 * its slice as props. Never re-export it from the /content barrel — client
 * components import that barrel.
 */

const raw: SiteContentInput = {
  /* The canonical description opens both descriptions, word for word
     (content/canonical.ts; verify-site check 12). Owner's redesign, 2026-09-16. */
  meta: {
    title: "Bolt Fusion Tech — Software. Intelligence. Automation. Machines.",
    description: `${CANONICAL_DESCRIPTION} ${COMPANY_LINE}`,
    ogTitle: "Bolt Fusion Tech — Build what's next.",
    ogDescription: `${CANONICAL_DESCRIPTION} ${COMPANY_LINE}`,
  },
  site: {
    sectionOrder: [
      "hero",
      "what_we_engineer",
      "capabilities",
      "system_map",
      "industries",
      "how_we_build",
      "technical_depth",
      "stories",
      "team",
      "faq",
      "final_cta",
    ],
    sectionVisibility: {},
  },
  /* SPEC §4, in its order. Routes, not homepage anchors, on every page.
     /capabilities, /industries, /engineering, /about and /insights are built by
     the next wave from content/engineering.ts. */
  navigation: {
    links: [
      { label: "Work", href: "/work" },
      { label: "Capabilities", href: "/capabilities" },
      { label: "Industries", href: "/industries" },
      { label: "Engineering", href: "/engineering" },
      { label: "About", href: "/about" },
      { label: "Insights", href: "/insights" },
    ],
    cta: { label: SCHEDULE_LABEL, href: SCHEDULE_HREF },
  },
  /* SPEC §5. Registered entity details go here when the owner supplies them;
     until then there is no slot for them. */
  footer: {
    tagline: "Engineering intelligent systems for the real world.",
    navHeading: "Company",
    nav: [
      { label: "Capabilities", href: "/capabilities" },
      { label: "Work", href: "/work" },
      { label: "Industries", href: "/industries" },
      { label: "Engineering", href: "/engineering" },
      { label: "Insights", href: "/insights" },
      { label: "About", href: "/about" },
    ],
    socialHeading: "Follow",
    socialLinks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/company/bolt-fusion-tech/",
      },
      { name: "Facebook", url: "https://web.facebook.com/boltfusiontech" },
      { name: "X (Twitter)", url: "https://x.com/boltfusiontech" },
    ],
    contactHeading: "Contact",
    email: { label: "hello@boltfusiontech.com", href: "mailto:hello@boltfusiontech.com" },
    cta: { label: SCHEDULE_LABEL, href: SCHEDULE_HREF },
    copyrightName: "© 2026 Bolt Fusion Tech",
    rightsLine: "All rights reserved.",
    legal: [{ label: "Privacy Policy", href: "/privacy-policy" }],
    backToTopLabel: "Back to top",
  },
  /* SPEC §5, the copy deck. One h1, the support line, the body and both calls
     to action — all server HTML (verify-site check 28). */
  hero: {
    title: "Build what's next.",
    support: "Software. Intelligence. Automation. Machines.",
    body: "We engineer digital systems — from web and mobile platforms to AI automation, ERP, POS, robotics, and the infrastructure that makes them work.",
    primaryCta: { label: SCHEDULE_LABEL, href: SCHEDULE_HREF },
    secondaryCta: { label: "Explore Our Capabilities", href: "/capabilities" },
  },
  team: {
    benchLabel: "Your bench",
    codeComment: "// who builds with you",
    headlineLine1: "Senior engineers.",
    headlineLine2: "One delivery standard.",
    subtext:
      "Each verified card opens the engineer's LinkedIn profile in a new tab—so you can see who you would work with before you commit scope or budget.",
    // Both numbers are counted from the roster — never written here.
    statLabel: "engineers",
    verifiedLabel: "verified profiles",
    pendingLabel: "Profile coming soon",
    // ── HOW TO FILL IN A TEAM MEMBER ─────────────────────────────────────────
    // The build validates every field: `yarn build` fails, naming the member and
    // the field, if anything below is wrong. Leave a field OUT until you have
    // its real value — never an example, a plausible title or a round number.
    //
    // status      "verified" or "pending".
    //   pending   A named member with no verified LinkedIn yet. The card shows
    //             the name, initials and "Profile coming soon" — no link, no
    //             handle, no photo — and there is no Person structured data.
    //             The build refuses a profileUrl, handle or photo here.
    //   verified  Needs both:
    //             profileUrl  "https://www.linkedin.com/in/<their-profile>/" —
    //                         only a linkedin.com/in/ URL is accepted.
    //             handle      the card's bottom line, e.g. "@nadim".
    // PENDING -> VERIFIED: change status to "verified" and add profileUrl and
    // handle. The card becomes a link, both counts above the cards update, and
    // a Person node is emitted. Nothing else to edit.
    //
    // Optional, shown only when present (a verified member's role and stack go
    // into their Person markup too):
    //   role      a job title, plain text: "Backend engineer".
    //   years     years of experience, a whole number 1–60: 8, shown "8 years".
    //             That is a figure, so it also needs one line in
    //             content/figure-labels.ts —
    //             { text: "8 years", exempt: "<why it is not a performance claim>" }
    //             — the build names the line if it is missing.
    //   stack     technology names: ["TypeScript", "PostgreSQL"].
    //   photo     VERIFIED MEMBERS ONLY. A real photograph of that person —
    //             never an avatar, an illustration, a stock or a generated face
    //             (CLAUDE.md, "No fake faces"). Put the file in public/team/
    //             and give its path: "/team/nadim.jpg" — lowercase letters,
    //             digits and hyphens; .jpg, .jpeg, .png, .webp or .avif. It shows
    //             above the name. A file named "avatar", "face", "placeholder"
    //             and the like is refused.
    //
    // Then `yarn build`, `yarn start`, and
    // `yarn verify:site --base http://localhost:3000 --repo .`
    //
    // The four pending members were on the original roster and came off on
    // 2026-09-11, because their cards used template faces and GitHub handles
    // that belonged to strangers. On 2026-09-15 the owner restored the team to
    // ten: their NAMES only — never those handles, never those images.
    roster: [
      { id: "rafa", status: "verified", name: "Rafa", handle: "@rafa", profileUrl: "https://www.linkedin.com/in/imran1993/" },
      {
        id: "shourab",
        status: "verified",
        name: "Shourab",
        handle: "@shourab",
        profileUrl: "https://www.linkedin.com/in/ashraful-abedin-shourab-a50697122/",
      },
      { id: "nazirul", status: "verified", name: "Nazirul", handle: "@nazirul", profileUrl: "https://www.linkedin.com/in/imnazirul/" },
      { id: "talha", status: "verified", name: "Talha", handle: "@talha", profileUrl: "https://www.linkedin.com/in/talhajubair100/" },
      { id: "nihal", status: "verified", name: "Nihal", handle: "@nihal", profileUrl: "https://www.linkedin.com/in/asif-nihal" },
      { id: "sabbir", status: "verified", name: "Sabbir", handle: "@sabbir", profileUrl: "https://www.linkedin.com/in/sabbir-ahmed-4a500321b/" },
      { id: "nadim", status: "pending", name: "Nadim" },
      { id: "joinal", status: "pending", name: "Joinal" },
      { id: "arifur-rahman", status: "pending", name: "Arifur Rahman" },
      { id: "tareq", status: "pending", name: "Tareq" },
    ],
  },
  recentWorks: {
    // The engineering stories (owner's redesign, 2026-09-16; SPEC §5): the two
    // write-ups in the problem / system / engineering / result shape, then the
    // proof strip. The title, subtitle, cards' words and alt texts are COPY.md
    // §4's, unchanged; the story lines are the write-ups' and llms-full.txt's
    // own words. No result that is not real, and every figure labelled.
    eyebrow: "Engineering stories",
    title: "Two products, two write-ups.",
    subtitle: "Each one has a full technical write-up, not a screenshot and a sentence.",
    items: [
      {
        src: "/projects/warmchats-ai-booking.png",
        title: "WarmChats — AI booking for real estate",
        outcome:
          "Always-first AI follow-up for agents: Claude qualifies and routes every new lead—buyer or seller—while GPT-4.1 replies instantly on email and SMS and books showings 24/7, with every message tracked.",
        stack: "Real estate, AI automation, microservices",
        alt: "WarmChats landing page: 'Turn new real estate leads into booked appointments automatically', trusted by agents using Zillow, open houses, and Facebook leads",
        imgClass: "object-[center_top]",
        state: "published",
        href: "/work/warmchats",
        ctaLabel: "Read the case study",
        story: {
          problem:
            "Real estate leads go cold fast. An agent who replies first usually wins the appointment, but leads arrive at all hours across email, SMS, Zillow, open houses and Facebook, and a human cannot be first every time.",
          system:
            "An always-on follow-up system that is first to every inbound lead: Claude reads each new lead and routes it by intent, GPT-4.1 replies across email and SMS in the agent's voice, and confirmed showings write straight to the calendar.",
          engineering:
            "Event-driven microservices: Next.js front end, NestJS and Django services, PostgreSQL. Each inbound message is an event; qualification, reply generation and calendar writes are separate consumers, so a failure in one does not silently drop a lead.",
          result: "Live in production at warmchats.com, built by Bolt Fusion for WarmChats, Inc., which owns the product.",
        },
      },
      {
        // Copy below is lifted verbatim from the approved `caseStudy` block —
        // nothing here is newly written. The write-up is /work/restaurant-search.
        src: "/projects/case-fnb-smart-search.png",
        title: "Intelligent restaurant search",
        outcome:
          "Conversational discovery with explicit routing, predictable AI unit economics, and latency targets suitable for high-volume production traffic.",
        stack: "Multi-tenant microservice, tiered search, observable by design",
        alt: "Case study visual for AI-assisted restaurant search and discovery product",
        imgClass: "object-left",
        state: "published",
        href: "/work/restaurant-search",
        ctaLabel: "Read the case study",
        story: {
          // The architecture section's intro (COPY.md §3), now this story's
          // problem and system; its three lanes render under the system line.
          problem:
            "Most AI products die after launch — too slow, too expensive, too unstable. Conversational discovery is easy to demo and expensive to run: send every query to a frontier model and cost scales with traffic.",
          system:
            "This is the routing we built so one didn't. Every query is classified before any paid inference runs, so most traffic never reaches a model.",
          lanes: true,
          engineering:
            "A multi-tenant NestJS microservice on PostgreSQL with PostGIS and pgvector, Redis for the cache, and row-level security for tenancy. Routing is deterministic and happens before spend, which keeps the unit economics predictable as volume grows.",
          result:
            "Most traffic resolves on a sub-100ms path. The measurements below say which figures are shipped and which are targets.",
        },
      },
    ],
    // SPEC §8b.1 (binding): "From systems we shipped. Each figure says whether
    // it was measured (shipped) or is a target." Never "Measured on…": ~$0.001
    // is a target.
    proofTitle: "From systems we shipped.",
    proofNote:
      "Each figure says whether it was measured (shipped) or is a target. Ask on the call and we’ll walk you through the architecture.",
  },
  caseStudy: {
    badge: "Case study: systems architecture",
    title: "Intelligent restaurant search",
    titleAccentLine:
      "Multi-tenant microservice, tiered search, observable by design",
    subtitle:
      "Conversational discovery with explicit routing, predictable AI unit economics, and latency targets suitable for high-volume production traffic.",
    executiveSummary:
      "We delivered a multi-tenant restaurant discovery microservice that resolves natural-language queries (for example, “cozy Italian place for date night”) while keeping the majority of requests on a sub-100ms path. The architecture caps model spend at roughly $0.001 per AI-assisted query on average, combines Redis caching with deterministic lane selection, and ships with the metrics, logging, and guardrails operators expect in production.",
    imageSrc: "/projects/case-fnb-smart-search.png",
    imageAlt:
      "Case study visual for AI-assisted restaurant search and discovery product",
    // Every FIGURE carries a status. <100ms is content/metrics.ts
    // `search-response`, shipped. ~$0.001 is a budget, not a measurement — the
    // card's own hint says "Budgeted hybrid retrieval" — so it is a target
    // (owner, 2026-09-12; CLAUDE.md, "A figure labelled shipped with nothing
    // behind it"). Multi-tenant and Observable are capabilities, not metrics,
    // and carry no status: the schema refuses one.
    kpis: [
      {
        value: "<100ms",
        label: "Search SLA",
        hint: "~80% of queries hit the fast lane",
        status: "shipped",
      },
      {
        value: "~$0.001",
        label: "Avg. cost / AI search",
        hint: "Budgeted hybrid retrieval",
        status: "target",
      },
      {
        value: "Multi-tenant",
        label: "Postgres RLS",
        hint: "Isolated rows per tenant",
      },
      {
        value: "Observable",
        label: "Production-ready",
        hint: "Metrics, logs, safe limits",
      },
    ],
    kpiSectionEyebrow: "Service commitments",
    kpiBlockTitle: "Latency, cost, isolation, and operations",
    lanesSectionTitle: "Three-lane search architecture",
    lanesIntro:
      "Each query is classified before any paid inference: deterministic paths carry the bulk of volume; models run only when phrasing requires interpretation; a short-TTL cache reduces repeat load on the database and providers.",
    lanes: [
      {
        lane: 1,
        title: "Keyword search",
        summary: "Simple intents, zero AI spend.",
        traffic: "~80% of traffic",
        // The status is the chip after the figure (content/figure-labels.ts), so
        // the word "target" is not repeated: the page still reads "<80ms target".
        latency: "<80ms",
        bullets: [
          "Queries like “Italian”, “sushi”, “pizza”.",
          "PostgreSQL ILIKE plus PostGIS geo filters.",
          "Predictable path—no model calls.",
        ],
        costLine: "$0 marginal cost per query",
      },
      {
        lane: 2,
        title: "Natural language AI search",
        summary: "Complex intent → structured retrieval.",
        traffic: "~20% of traffic",
        latency: "<1200ms",
        bullets: [
          "Examples: “romantic spot with live music near me”.",
          "Claude Haiku parses intent to structured JSON.",
          "OpenAI embeddings + pgvector cosine similarity in Postgres.",
        ],
        costLine: "~$0.001 per search (budgeted)",
      },
      {
        lane: 3,
        title: "Result cache",
        summary: "Repeat demand disappears at the edge.",
        traffic: "Hot paths",
        latency: "<15ms",
        bullets: [
          "Redis with 30s TTL on hashed keys.",
          "Key = tenant + query + geo + filters + classification.",
          "Hit-rate goal 30–40% to protect DB and models.",
        ],
      },
    ],
    stackSectionTitle: "Technical stack",
    stackBlockTitle: "Implementation stack",
    stackGroups: [
      {
        title: "Backend",
        items: ["NestJS 10", "TypeScript (strict)", "DDD + Hexagonal + CQRS"],
      },
      {
        title: "Data",
        items: [
          "PostgreSQL 17",
          "PostGIS",
          "pgvector",
          "Row-level security (tenancy)",
        ],
      },
      {
        title: "Cache & realtime",
        items: [
          "Redis 7 — result cache (30s)",
          "Semantic intent cache (60s)",
          "LLM rate limits (100/min/tenant)",
          "Pulse: WebSocket + Redis pub/sub",
        ],
      },
      {
        title: "AI services",
        items: [
          "Claude Haiku 4.5 — intent parsing (~90% of AI calls)",
          "Claude Sonnet 4.6 — menu Q&A only",
          "OpenAI text-embedding-3-small (1536-d)",
        ],
      },
    ],
    patternsSectionTitle: "Engineering patterns",
    patterns: [
      "Domain-Driven Design",
      "Hexagonal architecture",
      "CQRS",
      "Event-driven architecture",
    ],
    architectureSectionTitle: "Bounded contexts",
    architectureBlockTitle: "Partitioning for maintainable evolution",
    architectureLead:
      "Five bounded contexts share a small kernel so search behavior can evolve without coupling unrelated concerns or destabilizing shared infrastructure.",
    contexts: [
      {
        name: "Tenancy",
        tagline: "Configuration per brand",
        bullets: [
          "Valid vibes, cuisines, ranker weights, embedding templates.",
          "In-memory registry with Redis warmup.",
        ],
      },
      {
        name: "Discovery",
        tagline: "The search core",
        featured: true,
        bullets: [
          "Query classifier picks the lane.",
          "Intent parser (Claude) for NL queries.",
          "Search index in Postgres + hybrid ranker.",
        ],
      },
      {
        name: "Indexing",
        tagline: "Fresh vectors & listings",
        bullets: [
          "Venue CRUD on the search index.",
          "Embedding saga on EntityIndexedEvent.",
        ],
      },
      {
        name: "GoldenKeys",
        tagline: "Smart filter chips",
        bullets: [
          "Auto-generated chips like “Rooftop”, “Live music”.",
          "Cron every 6h from search analytics.",
        ],
      },
      {
        name: "Pulse",
        tagline: "Live venue status",
        bullets: [
          "Open/busy/wait signals.",
          "Gateway on /pulse with WebSocket fan-out.",
        ],
      },
    ],
    sharedKernelTitle: "Shared kernel",
    sharedKernelItems: [
      "TenantId & Geo value objects",
      "Result<T, E> for explicit failures",
      "Prisma + Redis services",
      "TenantContext via AsyncLocalStorage",
      "Pino logging",
      "Claude & OpenAI adapters",
    ],
    diagramBadgeLeft: "System overview",
    diagramBadgeRight: "Production posture",
    ctaSupportingText:
      "If you are evaluating search, ranking, or multi-tenant isolation under cost and latency constraints, we can walk through a comparable architecture and delivery approach on a short call.",
    // The case study renders on /work/restaurant-search. Both targets live on
    // /contact since 2026-09-16: the project panel and the booking calendar.
    // The labels are the write-up's approved copy (the inner-pages wave owns it).
    primaryCtaLabel: "Discuss a similar engagement",
    primaryCtaHref: "/contact#project",
    secondaryCtaLabel: "Book a technical call",
    secondaryCtaHref: "/contact#schedule",
  },
  faq: {
    badge: "FAQ",
    title: "Questions? Answers.",
    items: [
      {
        q: "What kinds of projects do you take on?",
        // Reworded 2026-09-16 (owner's redesign): "we focus on custom web and
        // mobile products" contradicted the six capabilities. No new claim:
        // robotics is said to be undelivered, as SPEC §8b.7 says it.
        a: "Software, AI and automation, ERP and point-of-sale systems, and the cloud infrastructure under them — new builds, integrations, and hardening existing systems for scale. We haven't delivered robotics work yet. If you have a clear user or business outcome, we can usually map a sensible technical path.",
      },
      {
        q: "How do you estimate timeline and cost?",
        a: "After a short discovery, we break work into milestones with acceptance criteria. You get ranges tied to scope—not a single opaque number—plus options to phase features if budget or deadlines are tight.",
      },
      {
        q: "What does your delivery process look like?",
        a: "Discovery and plan first, then iterative builds with demos and a transparent backlog, then launch with monitoring and handoff materials. You are never guessing what we are doing week to week.",
      },
      {
        q: "Can you work with our existing codebase?",
        a: "Yes. We routinely join live products: code review, refactors, test coverage, performance work, and incremental feature delivery. We start with a short technical assessment so risks are explicit up front.",
      },
      {
        q: "How do we get started?",
        // Reworded 2026-09-16: the contact section moved to /contact, and
        // "book a call" is "schedule a call" everywhere.
        a: "Use the contact page to schedule a call or email us with goals, timeline, and any constraints. We respond with fit, suggested next steps, and what we would need from your side to begin.",
      },
    ],
  },
  finalCta: {
    title: "Have a complex problem?",
    line: "Let's turn it into an engineered system.",
    primary: { label: SCHEDULE_LABEL, href: SCHEDULE_HREF },
    secondary: { label: "Tell Us About Your Project", href: "/contact#project" },
  },
  /* /contact. The panel's words (status, title, body, email) and the
     calendar's (its heading, blurb and frame title) are the old homepage's,
     unchanged, moved here on 2026-09-16. The project form is new: three fields
     that open the visitor's email app, addressed to the team — the site's
     existing mechanism (mailto), with no backend and nothing stored. */
  contact: {
    meta: {
      title: "Contact",
      description:
        "Schedule a call with the engineers who would build your system, or tell us about your project by email.",
    },
    eyebrow: "Contact",
    statusLabel: "Taking new engagements",
    title: "Tell us what you need to ship",
    body: "Share goals, timeline, and constraints—we'll reply with honest fit, a suggested approach, and next steps. No pressure, no jargon wall.",
    primaryCta: { label: SCHEDULE_LABEL, href: "#schedule" },
    emailLabel: "Email the team",
    emailHref: "mailto:hello@boltfusiontech.com",
    emailAddress: "hello@boltfusiontech.com",
    schedule: {
      title: "Pick a time (30 min)",
      blurb: "Or grab an open slot below — same 30‑minute intro call.",
      frameTitle: "Schedule a 30-minute call — Bolt Fusion Tech",
    },
    project: {
      title: "Tell us about your project",
      lead: "Three short fields. Sending opens your email app with them filled in, addressed to the team — nothing is stored on this site.",
      nameLabel: "Your name",
      subjectLabel: "What are you building?",
      bodyLabel: "Goals, timeline and constraints",
      bodyHint: "A few lines is enough to start.",
      submitLabel: "Open in your email app",
      fallback: "Or write to us directly:",
    },
  },
};

/* One object now serves every page and every render, where each request used to
   get a freshly parsed copy — so it is frozen: a mutation throws instead of
   silently changing another page. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

export const siteContent: SiteContent = deepFreeze(parseContent(siteContentSchema, raw, "site.ts"));
