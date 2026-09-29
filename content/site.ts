import "server-only";

import { CANONICAL_DESCRIPTION } from "./canonical";
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
  /* The canonical description IS both descriptions, word for word
     (content/canonical.ts; verify-site check 12) — and nothing more: a meta
     description is 50–160 characters (check 26) and the line is 117 of them.
     The company line went with it; it is still in the Organization node.
     Owner's redesign, 2026-09-16. */
  meta: {
    title: "Bolt Fusion Tech — Software. Intelligence. Automation. Machines.",
    description: CANONICAL_DESCRIPTION,
    ogTitle: "Bolt Fusion Tech — Build what's next.",
    ogDescription: CANONICAL_DESCRIPTION,
  },
  site: {
    /* The owner, 2026-09-28: "make it easy for clients to hire" — proof
       second, then how to start, then the range (DECISIONS 2026-09-28, item 1;
       CLAUDE.md, "Decided 2026-09-28"). */
    sectionOrder: ["hero", "stories", "how_we_work", "what_we_engineer", "how_we_build", "industries", "faq", "final_cta"],
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
    /* 2026-09-28 (DECISIONS item 2): under the calls to action. The approved
       /about term, word for word (content/pages.ts; the schema refuses any
       other words), and the proof line: shipped work, read from
       content/projects.ts with its own attribution. */
    microcopy: "Your first call is with the engineer who writes the code.",
    proof: {
      label: "Built by Bolt Fusion and in production",
      projects: ["warmchats", "balanzify", "go-style-business"],
    },
  },
  team: {
    benchLabel: "Your bench",
    codeComment: "// who builds with you",
    headlineLine1: "Senior engineers.",
    headlineLine2: "One delivery standard.",
    subtext: "Named engineers are assigned before you sign. Ask on the call who would work on your project.",
    // The owner, 2026-09-24: "we just show we have 15+ developer team, no
    // details". The size is the owner's own figure; no one is named, linked or
    // pictured, and there is no Person structured data. "15+" is a figure, so
    // it renders inside its exemption in content/figure-labels.ts — change the
    // two together, or the build refuses it.
    size: "15+",
    sizeLabel: "developers",
  },
  recentWorks: {
    // The engineering stories (owner's redesign, 2026-09-16; SPEC §5): the two
    // write-ups in the problem / system / engineering / result shape, then the
    // client story and the proof strip. The cards' words and alt texts are
    // COPY.md §4's, unchanged; the story lines are the write-ups' and
    // llms-full.txt's own words. No result that is not real, and every figure
    // labelled.
    //
    // The title and subtitle were COPY.md §4's — "Two products, two
    // write-ups." and "Each one has a full technical write-up, not a
    // screenshot and a sentence." — until 2026-09-29, when TTouch Clothing's
    // four systems moved up beside the pair (the design and honesty reviews):
    // the section holds six systems, and four have no write-up. The title is
    // true of every one of them — built by us, and shipped (the proof strip's
    // "From systems we shipped."; "running" would claim more than the
    // restaurant search's write-up says) — and the subtitle keeps COPY.md's
    // words for the two it describes. For the owner to confirm.
    eyebrow: "Engineering stories",
    title: "Built and shipped.",
    subtitle: "Two full technical write-ups, not a screenshot and a sentence — and the systems we built end to end for TTouch Clothing.",
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
      /* The four buyer objections (2026-09-28, DECISIONS item 6), first. Every
         answer is words the site already publishes: /about's terms, the line
         under its models table and its operating detail (content/pages.ts),
         the team's subtext above, and the pilot (content/pilot.ts). No
         figure, no new promise. "Can we start small?" ends at the pilot's
         terms: /about's interim quote line ("a full quote for the wider build
         at the end of it") would give this page a second answer to the cost
         question beside "How do you estimate timeline and cost?" (ranges after
         a short discovery) — which of the two holds is the owner's. "4–8 hours of overlap with US and EU working days. Two-week"
         has its own exemption for this instance (the FAQPage
         JSON-LD carries it too, and check 8 reads that). */
      {
        q: "Who writes the code?",
        a: "Named engineers are assigned before you sign. Your first call is with the engineer who writes the code.",
      },
      {
        q: "How much do our working hours overlap?",
        a: "4–8 hours of overlap with US and EU working days. Two-week sprints, a demo at the end of each, a named escalation contact, and a written weekly report.",
      },
      {
        q: "Who owns the IP?",
        a: "You own the IP: it is assigned to you on payment. An NDA is signed before scoping.",
      },
      {
        q: "Can we start small?",
        a: "Yes. Most engagements start with the two-week pilot: a scoped slice of your real product, not a demo. Two weeks. Fixed price. Full IP. No obligation.",
      },
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
     calendar's (its heading and frame title) are the old homepage's,
     unchanged, moved here on 2026-09-16; the calendar's blurb, "Or grab an
     open slot below…", was cut on 2026-09-28 (its "Or" answered the panel's
     Schedule a Call, removed that day). The project form is new: three fields
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
    emailLabel: "Email the team",
    emailHref: "mailto:hello@boltfusiontech.com",
    emailAddress: "hello@boltfusiontech.com",
    schedule: {
      title: "Pick a time (30 min)",
      frameTitle: "Schedule a 30-minute call — Bolt Fusion Tech",
      // Calendly paints its own white interface and ignores the colour
      // parameters, so the panel is placed as a light card and says whose
      // calendar it is. The note below it survives a browser that blocks the
      // third party altogether.
      caption: "Bolt Fusion Tech’s booking calendar, hosted by Calendly.",
      placeholder: "The booking calendar loads here.",
      stalled: "The booking calendar didn’t load.",
      fallbackNote:
        "Calendar not loading? Your browser may be blocking Calendly — email us at hello@boltfusiontech.com, or use the project form below.",
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
