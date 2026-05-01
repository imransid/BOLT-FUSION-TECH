import { siteContentSchema, type SiteContent } from "@/lib/site-content-schema";

const raw: SiteContent = {
  meta: {
    title: "Bolt Fusion Tech",
    description:
      "We design, build, and ship reliable web and mobile products—clear roadmaps, senior engineers, and delivery you can plan around.",
    ogTitle: "Bolt Fusion Tech – Custom Software & Product Engineering",
    ogDescription:
      "Partner with a product-minded engineering team to launch faster, reduce risk, and scale with confidence.",
  },
  site: {
    sectionOrder: [
      "hero",
      "ai_excellence",
      "projects",
      "about",
      "team",
      "recent_works",
      "case_study",
      "process",
      "services",
      "industries",
      "testimonials",
      "faq",
      "cta",
      "schedule_embed",
    ],
    sectionVisibility: {},
  },
  navbar: {
    links: [
      { label: "Services", href: "#services" },
      { label: "Industry", href: "#industries" },
      { label: "Process", href: "#process" },
      { label: "Work", href: "#projects" },
      { label: "Case study", href: "#case-study" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Clients", href: "#testimonials" },
      { label: "Contact", href: "#contact" },
    ],
    scheduleCtaLabel: "Book a call",
  },
  footer: {
    copyrightName: "© 2026 Bolt Fusion Tech",
    rightsLine: "All rights reserved.",
    socialLinks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/company/bolt-fusion-tech/",
      },
      { name: "Facebook", url: "https://web.facebook.com/boltfusiontech" },
      { name: "X (Twitter)", url: "https://x.com/boltfusiontech" },
    ],
    backToTopLabel: "Back to top",
  },
  hero: {
    badge: "Custom software & product engineering",
    headlineLine1: "Elite engineers.",
    headlineLine2: "Lower hiring cost.",
    subtext:
      "Build with a dedicated remote team of top-tier Bangladeshi engineers trusted to deliver speed, quality, and reliability across web, AI, and IoT products.",
    trustPoints: [
      "Senior-only team",
      "Timezone overlap",
      "Quality-first delivery",
    ],
    logos: ["SaaS", "Fintech", "Healthtech", "E-commerce", "AI & IoT products"],
    tagline: "Senior execution, transparent process, enterprise-grade quality",
    primaryCtaLabel: "Plan your build",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "See recent work",
    secondaryCtaHref: "#projects",
    scrollHintLeft: "Scroll down",
    scrollHintRight: "to explore delivery",
  },
  aiExcellence: {
    headlineLine1: "AI-Driven",
    headlineLine2: "Development",
    headlineLine3: "Excellence",
    intro:
      "We combine senior engineering with practical AI workflows to ship faster, test deeper, and scale products without compromising reliability.",
    scheduleCtaLabel: "Schedule a Call",
    scheduleCtaHref: "#schedule",
    imageSrc: "/section-services.png",
    imageAlt: "AI-assisted product engineering team in a modern delivery setup",
    metrics: [
      {
        value: "70%",
        label: "Faster Development",
        title: "Intelligent Coding",
        desc: "AI-powered workflows reduce manual effort while maintaining enterprise-level code quality.",
      },
      {
        value: "99.9%",
        label: "Defect-Free Releases",
        title: "Bulletproof QA",
        desc: "Automation-assisted QA catches regressions early and keeps releases stable and predictable.",
      },
      {
        value: "40%",
        label: "Higher Efficiency",
        title: "Peak Performance",
        desc: "Smart optimization improves response time and system throughput under production load.",
      },
      {
        value: "90%",
        label: "Faster Deployments",
        title: "Zero-Downtime DevOps",
        desc: "AI-guided pipelines enable safer releases with lower operational risk.",
      },
    ],
    footerTitle: "10X Faster Delivery",
    footerSubtitle:
      "Senior teams leveraging AI-assisted engineering to accelerate output while keeping quality high.",
    trustPoints: ["100% IP Protection", "Top 1% Talent"],
  },
  projects: {
    introStart:
      "Selected visuals from shipped work and how we operate—scroll to ",
    introLinkText: "featured case cards",
    introLinkHref: "#recent-work",
    introEnd: " for full context on our six featured launches.",
    tiles: [
      {
        src: "/projects/hospitality-ops-admin.png",
        alt: "Hospitality staff admin: kitchen, POS, orders, procurement",
        caption: "Hospitality ops — mobile",
        imgMobileClass: "object-[center_top]",
      },
      {
        src: "/projects/opal-fashion-tech.png",
        alt: "OPAL Fashion × Tech storefront hero and navigation",
        caption: "OPAL — commerce",
        imgMobileClass: "object-[52%_28%] min-[380px]:object-[center_22%]",
      },
      {
        src: "/projects/immidox-immigration.png",
        alt: "Immidox immigration services marketing site hero",
        caption: "Immidox — services web",
        imgMobileClass: "object-[center_18%]",
      },
      {
        src: "/projects/expert-marketplace-mobile.png",
        alt: "Expert search, profiles, booking, and trust metrics on mobile",
        caption: "Expert marketplace",
        imgMobileClass: "object-[center_top]",
      },
      {
        src: "/projects/godconnect-community.png",
        alt: "GodConnect onboarding and community app screens",
        caption: "GodConnect — community",
        imgMobileClass: "object-[center_20%]",
      },
      {
        src: "/projects/rebellion-brand-agency.png",
        alt: "REBELLION agency hero and interactive brand showcase",
        caption: "REBELLION — agency web",
        imgMobileClass: "object-[center_25%]",
      },
      {
        src: "/about-engineering.png",
        alt: "Bolt Fusion Tech — product engineering partnership",
        caption: "How we work with your team",
        isProfile: true,
      },
      {
        src: "/section-services.png",
        alt: "Engineers shipping product with clear UI on monitors",
        caption: "Delivery & architecture",
        imgMobileClass: "object-[center_35%]",
      },
      {
        src: "/section-process.png",
        alt: "Sprint planning and stakeholder alignment",
        caption: "Discovery to launch",
        imgMobileClass: "object-[center_30%]",
      },
      {
        src: "/section-testimonials.png",
        alt: "Client trust and advisory conversations",
        caption: "Stakeholder partnership",
        imgMobileClass: "object-[center_30%]",
      },
      {
        src: "/gallery-engineering-desk.png",
        alt: "Engineering workspace with code and systems design",
        caption: "Build quality",
        imgMobileClass: "object-[center_40%]",
      },
      {
        src: "/gallery-product-analytics.png",
        alt: "Product analytics across mobile and web surfaces",
        caption: "Insights & scale",
        imgMobileClass: "object-[center_35%]",
      },
    ],
    featuredDetailLabel: "Featured launches (detail)",
    discussLabel: "Discuss your build",
    mobileStripHint: "Swipe sideways — shorter cards, less scrolling",
  },
  about: {
    title: "Why Bolt Fusion Tech",
    bio: "Clients come to us when delivery has to be predictable: clear requirements, honest estimates, and engineering judgment applied early—so you spend less time firefighting and more time growing the product. We work as an extension of your team, focused on outcomes users feel and metrics you can read.",
    skills: [
      "Web & mobile apps",
      "APIs & integrations",
      "Cloud & DevOps",
      "Product discovery",
      "UI/UX engineering",
      "Quality & launch readiness",
    ],
    experience: [
      {
        role: "MVP & greenfield builds",
        company: "Scope, architecture, and a shippable first version",
        period: "Typical 8–16 weeks",
      },
      {
        role: "Embedded product teams",
        company: "Roadmap delivery with your PMs and stakeholders",
        period: "Ongoing",
      },
      {
        role: "Stabilize & scale",
        company:
          "Performance, reliability, and maintainability for live systems",
        period: "As needed",
      },
    ],
  },
  team: {
    benchLabel: "Your bench",
    codeComment: "// who builds with you",
    headlineLine1: "Senior engineers.",
    headlineLine2: "One delivery standard.",
    subtext:
      "Each card opens in a new tab—so you can see who you would work with before you commit scope or budget.",
    statLabel: "specialists",
    members: [
      { name: "Rafa", handle: "@rafa", image: "/team/marc-face.svg" },
      { name: "Nadim", handle: "@nadim", image: "/team/szymon-face.svg" },
      { name: "Joinal", handle: "@joinal", image: "/team/thomas-face.svg" },
      {
        name: "Arifur Rahman",
        handle: "@arifur",
        image: "/team/christoph-face.svg",
      },
      { name: "Tareq", handle: "@tareq", image: "/team/janic-face.svg" },
      { name: "Nazirul", handle: "@nazirul", image: "/team/mo-face.svg" },
      { name: "Talha", handle: "@talha", image: "/team/mo-face.svg" },
      { name: "Nihal", handle: "@nihal", image: "/team/eric-face.svg" },
      { name: "Musfique", handle: "@musfique", image: "/team/matei-face.svg" },
      { name: "Sabbir", handle: "@sabbir", image: "/team/mo-face.svg" },
    ],
  },
  recentWorks: {
    title: "Featured client work",
    subtitle:
      "Six shipped experiences—operations, commerce, regulated services, marketplaces, community, and agency brands—each tuned to real users and conversion.",
    mobileSwipeHint: "Swipe sideways for more — tap dots to jump",
    items: [
      {
        src: "/projects/hospitality-ops-admin.png",
        title: "Hospitality operations suite",
        outcome:
          "Staff admin for dashboard, kitchen, procurement, POS, and orders—built for fast floor decisions.",
        stack: "Mobile · React Native",
        alt: "Mobile admin app for restaurant operations: kitchen, POS, orders, and procurement",
      },
      {
        src: "/projects/opal-fashion-tech.png",
        title: "OPAL — Fashion × Tech",
        outcome:
          "Luxury commerce experience with a cinematic hero, trust strip, and conversion-focused layout.",
        stack: "Web · Next.js · Commerce",
        alt: "OPAL Fashion × Tech e-commerce hero: craft meets circuitry, shop and brand story",
        imgClass:
          "object-[50%_24%] min-[380px]:object-[center_20%] sm:object-[center_top]",
      },
      {
        src: "/projects/immidox-immigration.png",
        title: "Immidox immigration services",
        outcome:
          "High-trust services site with clear journeys, proof points, and strong primary calls to action.",
        stack: "Web · CMS-ready",
        alt: "Immidox immigration services website hero with confident messaging and CTAs",
      },
      {
        src: "/projects/expert-marketplace-mobile.png",
        title: "Expert marketplace & booking",
        outcome:
          "Search, rich profiles, availability, and booking in one flow—trust signals like ratings and status built in.",
        stack: "Mobile · Marketplace",
        alt: "Mobile app to find skilled experts, view profiles, and book services with ratings and availability",
      },
      {
        src: "/projects/godconnect-community.png",
        title: "GodConnect — faith community",
        outcome:
          "Welcome journey, daily encouragement, and community connection—clear onboarding and a focused first-run experience.",
        stack: "Mobile · Community",
        alt: "GodConnect app splash and welcome screen for a Christian community platform",
      },
      {
        src: "/projects/rebellion-brand-agency.png",
        title: "REBELLION — brand agency",
        outcome:
          "Statement hero, brutalist energy, and interactive work showcase—built to win bold creative briefs.",
        stack: "Web · Agency / brand",
        alt: "REBELLION agency website hero with bold typography and project carousel on orange background",
        imgClass: "object-[center_22%] sm:object-[center_top]",
      },
    ],
  },
  caseStudy: {
    badge: "Case study · Systems architecture",
    title: "Intelligent restaurant search",
    titleAccentLine: "Multi-tenant microservice · Tiered search · Observable by design",
    subtitle:
      "Conversational discovery with explicit routing, predictable AI unit economics, and latency targets suitable for high-volume production traffic.",
    executiveSummary:
      "We delivered a multi-tenant restaurant discovery microservice that resolves natural-language queries (for example, “cozy Italian place for date night”) while keeping the majority of requests on a sub-100ms path. The architecture caps model spend at roughly $0.001 per AI-assisted query on average, combines Redis caching with deterministic lane selection, and ships with the metrics, logging, and guardrails operators expect in production.",
    imageSrc: "/projects/case-fnb-smart-search.png",
    imageAlt:
      "Case study visual for AI-assisted restaurant search and discovery product",
    kpis: [
      {
        value: "<100ms",
        label: "Search SLA",
        hint: "~80% of queries hit the fast lane",
      },
      {
        value: "~$0.001",
        label: "Avg. cost / AI search",
        hint: "Budgeted hybrid retrieval",
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
        latency: "<80ms target",
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
        latency: "<1200ms target",
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
        latency: "<15ms target",
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
    primaryCtaLabel: "Discuss a similar engagement",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "Book a technical call",
    secondaryCtaHref: "#schedule",
  },
  process: {
    badge: "How we work",
    title: "Process",
    intro:
      "A straightforward process designed for busy product leaders: fewer surprises, clearer tradeoffs, and decisions you can explain to your board or budget owner.",
    imageSrc: "/section-process.png",
    imageAlt:
      "Product and engineering collaboration during discovery and sprint planning",
    discussLabel: "Discuss your roadmap",
    workLabel: "See recent work",
    steps: [
      {
        num: 1,
        title: "Discovery & plan",
        desc: "We align on users, success metrics, constraints, and risks—then produce a concise technical approach and milestone plan so stakeholders know what “done” looks like and when to expect it.",
      },
      {
        num: 2,
        title: "Build in iterations",
        desc: "Working software every cycle: demos, backlog transparency, and early integration (auth, data, deployments) so issues surface when they are cheap to fix—not the week before launch.",
      },
      {
        num: 3,
        title: "Launch, measure, improve",
        desc: "Release with monitoring, runbooks, and a sensible cutover. After go-live we support stabilization, iterate on feedback, and help your team operate the product with confidence.",
      },
    ],
  },
  services: {
    badge: "What we deliver",
    title: "Services",
    intro:
      "Practical engineering aligned to your roadmap: you get transparent communication, measurable milestones, and software ready for real users—not a black box.",
    skills: [
      "TypeScript & React",
      "Next.js & Node",
      "Mobile (iOS / Android)",
      "AWS & cloud-native",
      "API design",
      "Automated testing",
    ],
    discussLabel: "Discuss your project",
    workLabel: "See recent work",
    cards: [
      {
        title: "Custom product development",
        desc: "End-to-end web and mobile builds: discovery workshops, technical design, implementation, and handoff documentation—so your team owns the system with confidence after launch.",
      },
      {
        title: "Platforms & integrations",
        desc: "Connect products to payments, CRMs, data pipelines, and internal tools with APIs and event-driven workflows that are observable, secure, and easy to extend.",
      },
      {
        title: "Reliability & scale",
        desc: "Hardening for real traffic: performance tuning, monitoring and alerts, CI/CD, and operational runbooks—reducing downtime and making releases boring in the best way.",
      },
      {
        title: "UX & frontend craft",
        desc: "Interfaces that match your brand and usability goals: accessible components, responsive layouts, and design-system thinking so new features stay consistent.",
      },
    ],
    marquee: [
      "Technical discovery",
      "Sprint delivery",
      "Code review",
      "Security-minded defaults",
      "Documentation",
      "Post-launch support",
    ],
    imageSrc: "/section-services.png",
    imageAlt:
      "Engineering team building software products with clear UI and architecture on screen",
  },
  industries: {
    badge: "Industry Focus",
    titleLine1: "Industries We Power",
    titleLine2: "with Innovation",
    subtitle:
      "We build focused digital products for teams that need reliable outcomes, measurable velocity, and software that scales after launch.",
    items: [
      {
        title: "EdTech",
        description:
          "LMS products, live class platforms, and assessment workflows built for scale and compliance.",
        iconKey: "edtech",
      },
      {
        title: "Fintech",
        description:
          "Secure payment, lending, and risk systems with auditability and operational resilience.",
        iconKey: "fintech",
      },
      {
        title: "E-Commerce",
        description:
          "Fast storefronts, theme customization, checkout integrations, and CRO-focused UX.",
        iconKey: "ecommerce",
      },
      {
        title: "Pharma",
        description:
          "Regulatory-aligned healthcare software, portals, analytics, and clinical operations tools.",
        iconKey: "pharma",
      },
      {
        title: "Telecom",
        description:
          "Enterprise-grade telecom dashboards and APIs engineered for high reliability.",
        iconKey: "telecom",
      },
      {
        title: "Retail",
        description:
          "Omnichannel retail systems that connect inventory, customer journeys, and fulfillment.",
        iconKey: "retail",
      },
      {
        title: "Software/ITES",
        description:
          "Custom business software and IT-enabled solutions for long-term product growth.",
        iconKey: "software",
      },
      {
        title: "Start-Ups",
        description:
          "Lean MVPs, scale-ready architecture, and product iterations designed for speed.",
        iconKey: "startup",
      },
    ],
    ctaCardTitle: "Is your industry here?",
    ctaCardBody:
      "If not, we can still help you design and ship quickly with the same senior delivery standard.",
    ctaCardButton: "Let's Talk",
    learnMoreLabel: "Learn More",
  },
  testimonials: {
    badge: "Client outcomes",
    title: "Testimonials",
    intro:
      "Feedback from leaders who needed delivery they could defend—to users, investors, and their own engineering teams.",
    startConversationLabel: "Start a conversation",
    startConversationHref: "#contact",
    recentWorkLabel: "See recent work",
    recentWorkHref: "#projects",
    items: [
      {
        name: "Sarah K.",
        role: "CEO, B2B SaaS",
        text: "They turned a vague brief into a shipped MVP with sane tradeoffs explained along the way. Our team finally had a release cadence we could plan around.",
        stars: 5,
      },
      {
        name: "David Chen",
        role: "Head of Product, Fintech",
        text: "Strong engineering judgment on integrations and compliance-sensitive flows. We cut rework because they asked the right questions early.",
        stars: 5,
      },
      {
        name: "Emily Torres",
        role: "CTO, Healthtech",
        text: "Clear documentation and handoff after launch. Internal developers picked up the codebase without a weeks-long archaeology project.",
        stars: 5,
      },
    ],
  },
  faq: {
    badge: "FAQ",
    title: "Questions? Answers.",
    items: [
      {
        q: "What kinds of projects do you take on?",
        a: "We focus on custom web and mobile products, internal tools, integrations, and hardening existing systems for scale. If you have a clear user or business outcome, we can usually map a sensible technical path.",
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
        a: "Use the contact section to book a call or email us with goals, timeline, and any constraints. We respond with fit, suggested next steps, and what we would need from your side to begin.",
      },
    ],
  },
  cta: {
    statusLabel: "Taking new engagements",
    title: "Tell us what you need to ship",
    body: "Share goals, timeline, and constraints—we'll reply with honest fit, a suggested approach, and next steps. No pressure, no jargon wall.",
    scheduleLabel: "Pick a time (30 min)",
    scheduleHref: "#schedule",
    emailLabel: "Email the team",
    emailHref: "mailto:hello@boltfusiontech.com",
  },
  scheduleEmbed: {
    blurb: "Or grab an open slot below — same 30‑minute intro call.",
  },
};

export const defaultSiteContent: SiteContent = siteContentSchema.parse(raw);
