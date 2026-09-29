import { parseContent } from "./schema";
import { engineeringSchema, type EngineeringContent, type EngineeringInput } from "./engineering-schema";

/**
 * The engineering company's content — the owner's redesign of 2026-09-16
 * ("Software. Intelligence. Automation. Machines."; SPEC §§4–5, with the
 * BINDING evidence corrections of SPEC §8b, which override §5 wherever they
 * differ). Parsed when the module loads (content/engineering-schema.ts), so a
 * malformed entry, an unlabelled figure, linked work that is not published
 * Bolt Fusion work, or a Lab capability without its honesty line fails
 * `next build` naming the path.
 *
 * ONE SOURCE: the homepage shows summaries of these entries; /capabilities,
 * /industries and /engineering (the next wave) render the same entries in
 * depth. Nothing here is server-only: the system map's client component takes
 * its slice as props.
 *
 * Honesty (SPEC §0 and §8b; CLAUDE.md, "Evidence tiers"):
 *  · Proven — shipped, with a case study or project. Core — repeated work.
 *    Capable — we can engineer it; no delivery yet. Lab — research or prototype.
 *  · Robotics is Lab and says so, verbatim: nothing there is a shipped system,
 *    and no robotics, drone or computer-vision delivery is claimed anywhere.
 *  · POS names no internal repository and claims no live merchant: restaurants
 *    are built; retail and pharmacy are in development; inventory, multi-branch
 *    and reporting are in the back-office plans. No payments, no commerce
 *    integrations.
 *  · The stack is only what the evidence shows (§8b.2): no Expo, Expo EAS,
 *    Supabase or Whisper (the owner's Jumatechs work and SaraAI, not Bolt
 *    Fusion evidence), and no FastAPI, AWS, Render or Sentry (weak evidence).
 *  · No figure appears here without its entry in content/figure-labels.ts; the
 *    AI capability's figures are the metrics in content/metrics.ts.
 *  · Industries link evidence only where delivered work exists; the rest are
 *    "what we'd build", with no claim of past work.
 */
const raw: EngineeringInput = {
  headings: {
    whatWeEngineer: {
      eyebrow: "What we engineer",
      title: "Technology is more than software.",
      lead: "We design and engineer systems that connect software, intelligence, automation, data, and the physical world.",
    },
    systemMap: {
      eyebrow: "The system map",
      title: "Different technologies. One engineering discipline.",
      lead: "The six capabilities are one system in practice. Hover or focus any part of the map to see what each connection does.",
    },
    industries: {
      eyebrow: "Industries",
      title: "Technology we can build for…",
      lead: "Where we have already built, the work is linked. Everywhere else, this is what we would build — not a claim of past work.",
    },
    howWeBuild: {
      eyebrow: "How we build",
      title: "A sequence, not a slogan.",
      lead: "Six stages, in order. Each one ends with something you can hold us to.",
    },
    depth: {
      eyebrow: "Technical depth",
      title: "The stack, by layer.",
      lead: "Only what our repositories and shipped work show.",
    },
  },

  capabilities: [
    {
      id: "software",
      name: "Software engineering",
      job: "Web platforms, mobile apps and the backends behind them.",
      title: "Software that becomes infrastructure for your business.",
      body: "Web platforms, mobile apps and the backends behind them — built to be depended on, not demoed. We design the data model before the screens and the failure modes before the features.",
      buildHeading: "What we build",
      whatWeBuild: [
        { label: "Web platforms" },
        { label: "Mobile applications (React Native)" },
        { label: "Backend systems (NestJS, Django)" },
        { label: "APIs and integrations (REST, GraphQL, gRPC)" },
        { label: "Real-time platforms" },
        { label: "Multi-tenant SaaS (Postgres row-level security)" },
      ],
      approach: ["The data model is designed before the screens.", "The failure modes are named before the features."],
      evidence: [{ tier: "proven" }],
      evidenceNote:
        "Shipped: Go Style Business, Balanzify, FanLock, Delivery Lens BD and Sudarshini, and feature work for Bazzile and GodConnect.",
      workSlugs: ["go-style-business", "balanzify", "fanlock", "delivery-lens-bd", "sudarshini", "bazzile", "godconnect-online"],
      diagram: {
        id: "layered-stack",
        title: "Software engineering: a layered stack",
        description:
          "Four layers — interface, API, services and data. A request flows down from the interface to the data, and the response flows back up.",
      },
      cta: { label: "Software engineering in depth", href: "/capabilities#software" },
    },
    {
      id: "ai",
      name: "AI & automation",
      job: "Agents, retrieval and workflows that act on a model's output.",
      title: "Turn intelligence into action.",
      body: "Models are the easy part. The work is deciding when a model should run at all, what it costs when it does, and what happens when it is wrong.",
      buildHeading: "What we build",
      whatWeBuild: [
        { label: "AI agents with a human hand-off" },
        { label: "LLM applications" },
        { label: "Retrieval and search" },
        { label: "Intelligent workflows" },
        { label: "AI services built to plug into a larger product" },
        { label: "Document intelligence", tier: "capable" },
      ],
      approach: [
        "Classify before paying for inference: a model runs only when the request needs one.",
        "Know what a call costs before it ships, and route to the smallest model that does the job.",
        "Plan for the model being wrong: guardrails, a log of every decision, and a hand-off to a person.",
      ],
      evidence: [{ tier: "proven" }],
      evidenceNote: "Shipped: WarmChats, and the restaurant search. Its figures are below, each labelled.",
      workSlugs: ["warmchats", "restaurant-search"],
      metricIds: ["search-response", "haiku-routing", "cost-per-query"],
      diagram: {
        id: "ai-router",
        title: "AI & automation: a router in front of the model",
        description:
          "A request reaches a router, which sends it down one of three lanes — keyword search, the model, or the cache — and the result becomes an action.",
      },
      cta: { label: "AI & automation in depth", href: "/capabilities#ai" },
    },
    {
      id: "erp",
      name: "ERP & enterprise systems",
      job: "One model of the business, with each department as a module.",
      title: "One system for complex operations.",
      body: "When HR, finance, inventory and sales live in separate tools, every report is a reconciliation. We design them as modular platforms, where each department is a module over one shared model of the business.",
      buildHeading: "Modules, drawn connected",
      whatWeBuild: [
        { label: "HR" },
        { label: "Finance" },
        { label: "Inventory" },
        { label: "Procurement" },
        { label: "Operations" },
        { label: "Sales" },
        { label: "Reporting" },
        { label: "Workflows" },
        { label: "Multi-branch" },
      ],
      approach: [
        "One shared model of the business under every module, so a report is a query, not a reconciliation.",
        "Each department is a module with its own boundary.",
        "Branches are part of the model from the first schema.",
      ],
      /* 2026-09-29: the Proven scope widens to the modules TTouch Clothing's
         systems delivered — HR records and a wholesale back office. They were
         delivered as separate systems; one shared model across them was not,
         which is why Full ERP stays Capable. The Capable line below is
         byte-identical on purpose: the gate's RUN 3 case d anchors on it. */
      evidence: [
        { tier: "proven", scope: "HR, payroll and a wholesale back office" },
        { tier: "capable", scope: "Full ERP" },
      ],
      evidenceNote:
        "Proven for HR and payroll (Balanzify's microservices), HR records (TTouch Clothing's employee verification) and a wholesale back office (TTouch Wholesale's quotations, sales memos, supplier stock and accounts). Full ERP is Capable — designed in our point-of-sale back-office plans, not yet delivered.",
      workSlugs: ["balanzify", "ttouch-wholesale", "ttouch-employee-verification"],
      diagram: {
        id: "module-ring",
        title: "ERP: modules around one data core",
        description:
          "HR, finance, inventory, procurement, operations, sales, reporting, workflows and multi-branch sit on a ring, each connected to one shared data core.",
      },
      cta: { label: "ERP & enterprise systems in depth", href: "/capabilities#erp" },
    },
    {
      id: "pos",
      name: "POS & commerce",
      job: "Point of sale that keeps selling when the network drops.",
      title: "Commerce systems built around real operations.",
      body: "A point of sale isn't a billing screen. It's the front end of stock, staff, kitchen, payments and reporting — and it has to keep selling when the internet drops.",
      buildHeading: "What we build",
      /* SPEC §8b.6, verbatim: what is built and what is planned. */
      buildNote:
        "Restaurants today, with retail and pharmacy in development — ordering, billing, receipts and offline sync built; inventory, multi-branch and reporting in our back-office plans.",
      whatWeBuild: [
        { label: "Restaurant point of sale" },
        { label: "Ordering" },
        { label: "Billing" },
        { label: "Receipts" },
        { label: "Offline sync" },
        { label: "Retail and pharmacy point of sale", tier: "capable" },
        { label: "Inventory", tier: "capable" },
        { label: "Multi-branch", tier: "capable" },
        { label: "Reporting", tier: "capable" },
        { label: "Online stores", tier: "proven" },
        { label: "Wholesale ordering portals", tier: "proven" },
      ],
      approach: [
        "Offline first: the till keeps selling when the network drops, and syncs when it returns.",
        "The hardware at the counter is part of the system, receipt printers included.",
        "A sale is the start of the work, not the end of it: the back office reads from it.",
      ],
      /* 2026-09-29: online and wholesale commerce are shipped (Sudarshini and
         TTouch Wholesale), so they are Proven; point of sale stays Core and
         first — it is the headline, and nothing new touches it. SPEC §8b still
         holds: no payments and no commerce integrations are claimed
         (Sudarshini takes cash on delivery). */
      evidence: [
        { tier: "core", scope: "Point of sale" },
        { tier: "proven", scope: "Online and wholesale commerce" },
      ],
      evidenceNote:
        "We've built point-of-sale systems for restaurants, including offline sync and receipt-printer integration, and we're building a multi-tenant platform for retail and other verticals. Online commerce is shipped: the Sudarshini store and TTouch Clothing's wholesale portal.",
      workSlugs: ["sudarshini", "ttouch-wholesale"],
      /* The linked work is the Proven tier's, not the till's: "Linked work
         (online and wholesale commerce)" (2026-09-29, the honesty review). */
      workScope: "Online and wholesale commerce",
      diagram: {
        id: "till-hub",
        title: "POS & commerce: the till at the centre",
        description:
          "The till sits at the centre, connected to stock, kitchen, receipts and reports. An offline queue holds sales while the network is down and syncs them when it returns.",
      },
      cta: { label: "POS & commerce in depth", href: "/capabilities#pos" },
    },
    {
      id: "robotics",
      name: "Robotics & intelligent systems",
      job: "The software side of machines: vision, control and telemetry.",
      title: "Bringing intelligence beyond the screen.",
      body: "The same engineering that runs a business can run a machine: sensors in, decisions made, actions out. The software side is where we'd start — computer vision, control interfaces, telemetry, and the systems that connect machines to the rest of the business.",
      buildHeading: "What we'd build",
      whatWeBuild: [
        { label: "Robotics software" },
        { label: "Computer vision" },
        { label: "Machine intelligence" },
        { label: "Connected and sensor-driven systems" },
        { label: "Software-to-machine integration" },
      ],
      approach: [
        "We'd start with the software side: vision, control interfaces and telemetry.",
        "A machine's events would reach the systems that act on them.",
        "Before anything is scoped, we tell you exactly what exists today.",
      ],
      evidence: [{ tier: "lab" }],
      evidenceNote: "No robotics, drone or computer-vision system has been delivered yet.",
      /* SPEC §8b.7, verbatim. */
      honesty:
        "We engineer software for machines; we don't manufacture hardware. We haven't delivered robotics work yet, and nothing here is a shipped system — ask us and we'll tell you exactly what exists today.",
      workSlugs: [],
      diagram: {
        id: "machine-loop",
        title: "Robotics: from sensor to machine",
        description:
          "A sensor feeds a vision model, which informs a decision, which a controller turns into an action on the machine. A concept, not a shipped system.",
        caption: "Concept — not a shipped system",
      },
      cta: { label: "Robotics & intelligent systems in depth", href: "/capabilities#robotics" },
    },
    {
      id: "cloud",
      name: "Cloud, data & infrastructure",
      job: "Databases, APIs, containers, CI/CD and observability.",
      title: "The systems behind the systems.",
      body: "Every product above runs on something. We design databases, APIs, containers, CI/CD and observability so the system can be released on a Tuesday afternoon without anyone holding their breath.",
      buildHeading: "What we build",
      /* SPEC §8b.8, exactly. */
      whatWeBuild: [
        { label: "Cloud deployment (Vercel)" },
        { label: "Databases (PostgreSQL, Redis)" },
        { label: "Containers (Docker, Docker Swarm)" },
        { label: "CI/CD (GitHub Actions)" },
        { label: "Observability (metrics and structured logging)" },
        { label: "Security-conscious architecture (row-level security, JWT)" },
      ],
      approach: [
        "Every change takes the same path: commit, build, test, deploy, observe.",
        "Tenancy and access are enforced in the database, not only in the application.",
        "Metrics and structured logs ship with the first release, not after the first incident.",
      ],
      evidence: [{ tier: "core" }],
      evidenceNote:
        "It runs under the work above: Go Style Business deploys on Docker Swarm, and the restaurant search runs on PostgreSQL with row-level security and Redis.",
      workSlugs: ["go-style-business", "restaurant-search"],
      diagram: {
        id: "release-pipeline",
        title: "Cloud, data & infrastructure: the release pipeline",
        description: "A change moves from commit to build, test, deploy and observe; what observation finds feeds the next commit.",
      },
      cta: { label: "Cloud, data & infrastructure in depth", href: "/capabilities#cloud" },
    },
  ],

  /* SPEC §8b.10: evidence only where delivered work exists. */
  industries: [
    {
      id: "restaurants",
      name: "Restaurants & hospitality",
      problems: ["Search that understands how guests describe what they want", "Tills that must keep selling when the network drops"],
      wouldBuild: ["Conversational search and discovery", "Point of sale with ordering and offline sync", "Multi-branch reporting"],
      capabilityIds: ["ai", "pos", "erp"],
      evidence: [
        { label: "Intelligent restaurant search", href: "/work/restaurant-search", workSlug: "restaurant-search" },
        { label: "Our point-of-sale work", href: "#pos" },
      ],
    },
    {
      id: "retail",
      name: "Retail & commerce",
      /* The first problem and the first two builds are what the evidence
         does (2026-09-29, the honesty review, as Logistics'): TTouch
         Wholesale shows trade prices to approved shops only, and Sudarshini is
         an online store. The rest are still what we'd build — no stock-count
         or multi-branch system is claimed. */
      problems: ["Trade prices that only approved shops should see", "Stock that is wrong by the time it is counted", "Several branches and one set of books"],
      wouldBuild: ["E-commerce stores", "Wholesale ordering portals", "Point of sale and inventory"],
      capabilityIds: ["software", "pos", "erp"],
      /* Client work first (2026-09-29): TTouch Clothing's store and wholesale
         portal. Each evidence link lands on the project's own card. */
      evidence: [
        { label: "Sudarshini", href: "/work#sudarshini", workSlug: "sudarshini" },
        { label: "TTouch Wholesale", href: "/work#ttouch-wholesale", workSlug: "ttouch-wholesale" },
        { label: "OPAL, our own e-commerce store", href: "/work#opal", workSlug: "opal" },
      ],
      note: "Retail point of sale in development.",
    },
    {
      id: "real-estate",
      name: "Real estate",
      problems: ["Leads that go cold before an agent replies", "Listings and bookings spread across tools"],
      wouldBuild: ["AI lead qualification and booking", "Marketplace and listing apps"],
      capabilityIds: ["ai", "software"],
      evidence: [
        { label: "WarmChats", href: "/work/warmchats", workSlug: "warmchats" },
        { label: "Feature work for Bazzile", href: "/work#bazzile", workSlug: "bazzile" },
      ],
    },
    {
      id: "hr",
      name: "HR & professional services",
      problems: ["Payroll, leave and attendance in separate tools", "Onboarding run from an inbox"],
      wouldBuild: ["HR and payroll platforms", "Employee records and verification", "Client and workflow portals"],
      capabilityIds: ["erp", "software"],
      evidence: [
        { label: "Balanzify", href: "/work#balanzify", workSlug: "balanzify" },
        { label: "TTouch Employee Verification", href: "/work#ttouch-employee-verification", workSlug: "ttouch-employee-verification" },
      ],
    },
    {
      id: "salons",
      name: "Salons & beauty",
      problems: ["Bookings, staff and client records in separate apps", "Several locations run from one spreadsheet"],
      wouldBuild: ["Salon and studio management platforms", "Booking and staff scheduling"],
      capabilityIds: ["software", "cloud"],
      evidence: [{ label: "Go Style Business", href: "/work#go-style-business", workSlug: "go-style-business" }],
    },
    {
      id: "healthcare",
      name: "Healthcare",
      problems: ["Scheduling, records and billing that do not share a model", "Paperwork that should be a workflow"],
      wouldBuild: ["Scheduling and patient-facing apps", "Intake workflows and document intelligence", "Pharmacy point of sale and stock"],
      capabilityIds: ["software", "ai", "pos"],
    },
    {
      id: "education",
      name: "Education",
      problems: ["Enrolment, timetables and fees kept in spreadsheets", "Course material nobody can search"],
      wouldBuild: ["School and course management platforms", "Mobile learning apps", "Search and assistants over course material"],
      capabilityIds: ["software", "ai", "erp"],
    },
    {
      /* Delivered work since 2026-09-29: Delivery Lens BD. Its first problem
         and its first build are what that product does — so the evidence is
         exactly as strong as the claim; the rest are still what we'd build,
         and linking the product beside them claims none of them. */
      id: "logistics",
      name: "Logistics",
      problems: ["Orders shipped to customers who refuse them at the door", "Shipments tracked by phone call", "Warehouse stock that two systems count differently"],
      wouldBuild: ["Courier data and delivery-risk checks", "Tracking and dispatch platforms", "Warehouse inventory systems", "Driver and field apps"],
      capabilityIds: ["software", "erp", "cloud"],
      evidence: [{ label: "Delivery Lens BD", href: "/work#delivery-lens-bd", workSlug: "delivery-lens-bd" }],
    },
    {
      id: "enterprise-operations",
      name: "Enterprise operations",
      problems: ["Departments on separate tools, reconciled by hand", "Approvals that live in inboxes"],
      wouldBuild: ["Modular ERP over one data model", "Workflow automation", "Reporting and dashboards"],
      capabilityIds: ["erp", "ai", "cloud"],
    },
    {
      id: "startups",
      name: "Startups & technology companies",
      problems: ["A product that has to demo next month and hold up next year", "An AI feature whose running cost nobody has worked out"],
      wouldBuild: ["A first version on production architecture", "AI features with cost and latency budgets", "Multi-tenant SaaS"],
      capabilityIds: ["software", "ai", "cloud"],
    },
  ],

  /* SPEC §5 with §8b.11: a demo every cycle; containerised deployments. */
  stages: [
    { id: "discover", title: "Discover", gets: "The business, users, constraints and goals, written down and signed off." },
    { id: "architect", title: "Architect", gets: "The architecture, the system boundaries, and the latency and cost budgets." },
    { id: "engineer", title: "Engineer", gets: "Reliable software and infrastructure, with a demo every cycle." },
    { id: "integrate", title: "Integrate", gets: "Systems, services, data and automation connected and documented." },
    { id: "deploy", title: "Deploy", gets: "CI/CD, containerised deployments and a runbook." },
    { id: "scale", title: "Scale", gets: "Performance, reliability and capability improved against the success measures." },
  ],

  /* SPEC §8b.2, exactly: only these. The schema refuses Kubernetes, Kafka and
     RabbitMQ; the evidence check dropped Expo, Expo EAS, Supabase, Whisper,
     FastAPI, AWS, Render and Sentry. */
  depth: [
    { id: "product", name: "Product", items: ["React", "Next.js", "React Native"] },
    { id: "backend", name: "Backend", items: ["Node.js", "NestJS", "Django", "GraphQL", "REST", "gRPC", "Socket.IO"] },
    { id: "data", name: "Data", items: ["PostgreSQL", "Redis", "pgvector", "WatermelonDB", "SQLite"] },
    { id: "ai", name: "AI", items: ["Claude", "GPT-4.1", "Embeddings and retrieval", "Agents"] },
    { id: "infrastructure", name: "Infrastructure", items: ["Docker", "Docker Swarm", "GitHub Actions", "Vercel"] },
  ],

  systemMap: {
    nodes: [
      { id: "software", label: "Software", short: "Web platforms, mobile apps and their backends.", x: 190, y: 120, capabilityIds: ["software"] },
      { id: "ai", label: "AI", short: "Models, agents and retrieval.", x: 500, y: 80, capabilityIds: ["ai"] },
      { id: "automation", label: "Automation", short: "Workflows that act on a decision.", x: 810, y: 120, capabilityIds: ["ai"] },
      { id: "data", label: "Data", short: "One model of the business on a central server: PostgreSQL, Redis and vectors.", x: 500, y: 285, capabilityIds: ["cloud"] },
      {
        id: "business",
        label: "Business systems",
        short: "ERP and POS: the operations of the business.",
        x: 190,
        y: 450,
        capabilityIds: ["erp", "pos"],
      },
      {
        id: "robotics",
        label: "Robotics",
        short: "Vision, control and telemetry — nothing delivered yet.",
        x: 810,
        y: 450,
        capabilityIds: ["robotics"],
        concept: true,
      },
      { id: "cloud", label: "Cloud", short: "Deployment, release pipelines and observability.", x: 500, y: 490, capabilityIds: ["cloud"] },
    ],
    links: [
      { id: "software-ai", from: "software", to: "ai", does: "Products call models through their APIs; AI features ship inside the software." },
      { id: "software-data", from: "software", to: "data", does: "Every product reads and writes one data model; reports read from it." },
      { id: "ai-data", from: "ai", to: "data", does: "Retrieval and embeddings run over the business's own data." },
      { id: "ai-automation", from: "ai", to: "automation", does: "A model's decision starts a workflow, instead of a person copying it across." },
      { id: "automation-software", from: "automation", to: "software", does: "Workflows write results back into the product: a message sent, a booking made." },
      { id: "business-data", from: "business", to: "data", does: "A sale or a payslip syncs to the central server, into one shared model." },
      { id: "ai-business", from: "ai", to: "business", does: "A model's output becomes a record in the business system." },
      { id: "robotics-ai", from: "robotics", to: "ai", does: "A vision model would turn camera frames into decisions. Concept.", concept: true },
      { id: "data-cloud", from: "data", to: "cloud", does: "Databases and caches run on deployed, observed infrastructure." },
      { id: "software-cloud", from: "software", to: "cloud", does: "Every product is built, deployed and observed through the same pipeline." },
    ],
    flows: [
      {
        /* SPEC §8b.9: POS → Data → Software. This is real. */
        id: "sale",
        title: "A sale at the till",
        steps: [
          { node: "business", text: "POS: the sale is recorded at the till." },
          { node: "data", text: "Data: it syncs to the central server." },
          { node: "software", text: "Software: the reports read it." },
        ],
        links: ["business-data", "software-data"],
      },
      {
        id: "lead",
        title: "A lead arrives",
        steps: [
          { node: "ai", text: "AI: an agent qualifies the lead." },
          { node: "automation", text: "Automation: a workflow offers open slots." },
          { node: "software", text: "Software: the booking lands in the calendar." },
        ],
        links: ["ai-automation", "automation-software"],
      },
      {
        id: "defect",
        title: "A camera sees a defect",
        steps: [
          { node: "robotics", text: "Robotics: a camera sees a defect." },
          { node: "ai", text: "AI: a vision model flags it." },
          { node: "business", text: "ERP: a work order opens." },
        ],
        links: ["robotics-ai", "ai-business"],
        concept: true,
      },
    ],
  },
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

export const engineering: EngineeringContent = deepFreeze(parseContent(engineeringSchema, raw, "engineering.ts"));

export const capabilities = engineering.capabilities;
export const industries = engineering.industries;
export const stages = engineering.stages;
export const depthLayers = engineering.depth;
export const systemMap = engineering.systemMap;
