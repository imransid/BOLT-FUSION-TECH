import { z } from "zod";

import { CANONICAL_DESCRIPTION, COMPANY_LINE } from "./canonical";
import { checkFigures } from "./engineering-schema";
import { parseContent } from "./schema";

/**
 * The inner pages' own words — the second wave of the owner's redesign of
 * 2026-09-16: each page's head and metadata; /engineering's phases,
 * architecture principles and verify-before-release list; /about's who we are,
 * where our engineers work, how we work with clients and what we won't do; and
 * the /insights index with the homepage's teaser.
 *
 * ONE SOURCE, still: the capabilities, industries, stages and stack are
 * content/engineering.ts; the engagement models and the pilot are
 * content/services.ts and content/pilot.ts; the team is content/site.ts; the
 * articles are content/insights.ts. This file holds only what those do not.
 *
 * Honesty (SPEC §0 and §8b; CLAUDE.md, Hard rules). Nothing here is a new
 * claim:
 *  · the principles are the case studies', content/architecture.ts's and the
 *    articles' own, and each links to where it is written up;
 *  · the verify list names what scripts/verify-site.mjs really checks, and no
 *    number;
 *  · /about's terms are the ones the Organization description and COPY.md
 *    already make ("named engineers assigned before you sign, 4–8 hours of
 *    overlap with US and EU working days, IP assigned on payment, and an NDA
 *    before scoping"), the tagline, the line under the table and the operating
 *    detail are the old homepage's, word for word ($SP/engineering/MOVES.md);
 *  · "where our engineers work" is COMPANY_LINE's three countries — never
 *    "offices", never an address (SPEC §8b.12);
 *  · "what we won't do" lists only commitments the site keeps and checks.
 * The schema refuses an unlabelled figure anywhere in it, as
 * content/engineering.ts does, and a meta description check 26 would fail.
 */

const text = z
  .string()
  .min(1)
  .refine((s) => s === s.trim(), "no leading or trailing whitespace");

/** An internal link: a route, a route with an anchor, or an anchor. */
const internalHref = z.string().regex(/^\/(?!\/)|^#/, "an internal link: a route or an anchor");
const linkSchema = z.strictObject({ label: text, href: internalHref });

/** Verify-site check 26: every page has a description of 50–160 characters. */
const metaSchema = z.strictObject({
  title: text,
  description: text.refine((s) => s.length >= 50 && s.length <= 160, "a meta description of 50 to 160 characters (verify-site check 26)"),
});

/** A page's head: the eyebrow, the one h1, the lead paragraphs, and its metadata. */
const pageHeadSchema = z.strictObject({ eyebrow: text, title: text, lead: z.array(text).min(1), meta: metaSchema });

/** A section's head: the eyebrow, the h2 and an optional lead. */
const sectionHeadSchema = z.strictObject({ eyebrow: text, title: text, lead: text.optional() });

const stageIdSchema = z.enum(["discover", "architect", "engineer", "integrate", "deploy", "scale"]);

const pagesSchema = z
  .strictObject({
    capabilities: z.strictObject({ head: pageHeadSchema }),
    industries: z.strictObject({
      head: pageHeadSchema,
      /** The industries with delivered work, and those with none yet. */
      built: sectionHeadSchema,
      wouldBuild: sectionHeadSchema,
    }),
    engineering: z.strictObject({
      head: pageHeadSchema,
      /** The six stages as the three phases content/process.ts describes. */
      inPractice: z.strictObject({
        head: sectionHeadSchema,
        phases: z.array(z.strictObject({ stepId: z.enum(["discovery", "iterate", "launch"]), stageIds: z.array(stageIdSchema).min(1) })).length(3),
      }),
      principles: z.strictObject({
        head: sectionHeadSchema,
        items: z
          .array(
            z.strictObject({
              id: z.string().regex(/^[a-z][a-z-]*$/),
              title: text,
              body: text,
              /** Where the principle is written up: a write-up, an article, /work. */
              evidence: z.array(linkSchema).min(1),
            }),
          )
          .min(1),
      }),
      verify: z.strictObject({ head: sectionHeadSchema, items: z.array(text).min(1), note: text }),
    }),
    about: z.strictObject({
      head: pageHeadSchema,
      who: z.strictObject({ head: sectionHeadSchema, body: z.array(text).min(1), links: z.array(linkSchema).min(1) }),
      where: z.strictObject({ head: sectionHeadSchema, places: z.array(text).min(1) }),
      howWeWork: z.strictObject({
        head: sectionHeadSchema,
        terms: z.array(z.strictObject({ term: text, detail: text })).min(1),
        modelsTitle: text,
        lineUnderTable: text,
        operatingDetail: text,
        pilotCta: linkSchema,
      }),
      refuse: z.strictObject({
        head: sectionHeadSchema,
        items: z.array(z.strictObject({ title: text, body: text, link: linkSchema.optional() })).min(1),
      }),
    }),
    insights: z.strictObject({
      head: pageHeadSchema,
      teaser: z.strictObject({ eyebrow: text, title: text, lead: text, cta: linkSchema }),
    }),
  })
  .superRefine((p, ctx) => checkFigures(p, ctx));

export type PagesContent = z.infer<typeof pagesSchema>;

const INSIGHT_ROUTING = "/insights/routing-ai-so-most-queries-never-reach-a-model";
const INSIGHT_POS = "/insights/offline-first-point-of-sale";
const INSIGHT_RLS = "/insights/multi-tenant-saas-on-postgres-row-level-security";

const raw: z.input<typeof pagesSchema> = {
  capabilities: {
    head: {
      eyebrow: "Capabilities",
      title: "Six capabilities, each with its evidence.",
      lead: [
        "What we build in each, how we approach it, and what we have actually delivered. Every capability carries its evidence tier and links to the work behind it — and robotics says plainly that it is Lab.",
      ],
      meta: {
        title: "Capabilities",
        description:
          "Software, AI and automation, ERP, point of sale, robotics and cloud: what we build in each, how we approach it, and the evidence behind it.",
      },
    },
  },

  industries: {
    head: {
      eyebrow: "Industries",
      title: "Technology we can build for…",
      lead: [
        "Each industry's problems, what we would build for it, and where we have already built it. Delivered work is linked; everywhere else, this is what we would build — not a claim of past work.",
      ],
      meta: {
        title: "Industries",
        description:
          "The industries we build for: the problems each one brings, what we would build, and where we have already built it, linked only where the work exists.",
      },
    },
    built: {
      eyebrow: "Where we have built",
      title: "Industries with delivered work.",
      lead: "Each links to what we built there: a write-up, a project on our work page, or the capability it comes from.",
    },
    wouldBuild: {
      eyebrow: "Where we would start",
      title: "No delivered work here yet.",
      lead: "What we would build for each, and the capabilities it would draw on — not a claim of past work.",
    },
  },

  engineering: {
    head: {
      eyebrow: "Engineering",
      title: "How we build, and what we build with.",
      lead: [
        "The sequence an engagement follows, the stack by layer, the architecture principles behind the systems we have built, and the checks this site passes before every release.",
      ],
      meta: {
        title: "Engineering",
        description:
          "How we build: six stages in order, the stack by layer, architecture principles from the systems we built, and the checks run before every release.",
      },
    },
    inPractice: {
      head: {
        eyebrow: "In practice",
        title: "How a project actually runs.",
        lead: "The same six stages, as the three phases a project runs in.",
      },
      phases: [
        { stepId: "discovery", stageIds: ["discover", "architect"] },
        { stepId: "iterate", stageIds: ["engineer", "integrate"] },
        { stepId: "launch", stageIds: ["deploy", "scale"] },
      ],
    },
    principles: {
      head: {
        eyebrow: "Architecture principles",
        title: "Principles we can point to.",
        lead: "Each comes from a system we have built, and links to where it is written up.",
      },
      items: [
        {
          id: "route-first",
          title: "Route before you pay for a model",
          body: "The restaurant search classifies every query with ordinary code before any paid inference runs. Only the lane that needs a model calls one, so most traffic never reaches a model.",
          evidence: [
            { label: "The restaurant search write-up", href: "/work/restaurant-search" },
            { label: "Routing AI so most queries never reach a model", href: INSIGHT_ROUTING },
          ],
        },
        {
          id: "narrow-model",
          title: "Give the model the narrowest job",
          body: "In the AI lane the model reads a sentence and returns structured intent, nothing more. Claude Haiku does that job, not a frontier model; retrieval and ranking stay in Postgres and in our code.",
          evidence: [{ label: "Routing AI so most queries never reach a model", href: INSIGHT_ROUTING }],
        },
        {
          id: "cache",
          title: "Cache repeat demand",
          body: "Search results live in Redis under a key built from the tenant, the query, the location, the filters and the lane, so a popular query is computed once and two tenants never share a result.",
          evidence: [{ label: "The restaurant search write-up", href: "/work/restaurant-search" }],
        },
        {
          id: "tenancy",
          title: "Enforce tenancy in the database",
          body: "Tenant isolation is a Postgres row-level security policy, not a WHERE clause someone can forget. It fails closed: a query with no tenant set returns no rows.",
          evidence: [
            { label: "Multi-tenant SaaS on Postgres row-level security", href: INSIGHT_RLS },
            { label: "The restaurant search write-up", href: "/work/restaurant-search" },
          ],
        },
        {
          id: "events",
          title: "Let one failure stay one failure",
          body: "In WarmChats each inbound message is an event, and qualification, reply generation and calendar writes are separate consumers, so a failure in one does not silently drop a lead.",
          evidence: [{ label: "The WarmChats write-up", href: "/work/warmchats" }],
        },
        {
          id: "offline",
          title: "Keep the till selling offline",
          body: "In the restaurant point of sale we built, every order is written locally together with its outbox row in one transaction, and a background worker syncs it when the network allows.",
          evidence: [{ label: "Offline-first point of sale", href: INSIGHT_POS }],
        },
        {
          id: "retries",
          title: "Make retries harmless",
          body: "The server upserts each synced order on its terminal and the id the till generated, so a batch sent twice still records one order.",
          evidence: [{ label: "Offline-first point of sale", href: INSIGHT_POS }],
        },
        {
          id: "labels",
          title: "Label every figure",
          body: "Every number we publish says whether it was measured on a running system (shipped) or is a target, and a budget is never rounded up into a result.",
          evidence: [{ label: "The figures on our case studies", href: "/work#case-studies" }],
        },
      ],
    },
    verify: {
      head: {
        eyebrow: "Verify before release",
        title: "Checked before every push.",
        lead: "This site is held to the same discipline. Before every push it runs through a black-box test suite that loads each public page in a real browser, at phone, tablet and desktop widths, and fails the release on any of these:",
      },
      items: [
        "A figure without its shipped or target label — in the text, in the page's metadata or in its structured data.",
        "A page without exactly one h1, or with a heading level skipped.",
        "A keyboard stop with no visible focus, or one hidden under the sticky header.",
        "Text below AA contrast against what is actually behind it.",
        "Content that is invisible with JavaScript off, or still hidden after a reading-speed scroll.",
        "Sideways scrolling or cut-off content at any width it tests.",
        "A template, placeholder or generated face, or any picture on a team card without a verified profile.",
        "A project card that does not say who built it, or a screenshot that does not load.",
        "Structured data that disagrees with the page it describes.",
        "Anything still moving when reduced motion is requested.",
        "A piece of inventoried content missing from its page.",
      ],
      note: "Some of it is refused earlier, by the build: content that fails its schema — an unlabelled figure, a team member marked verified without a LinkedIn profile, a Lab capability without its honesty line — stops the build and names the file.",
    },
  },

  about: {
    head: {
      eyebrow: "About",
      title: "Who we are, and how we work.",
      lead: [COMPANY_LINE, CANONICAL_DESCRIPTION],
      meta: {
        title: "About",
        description:
          "Who we are: the engineers, where they work, how we work with clients — engagement models, the pilot, IP and NDA — and what we won't do.",
      },
    },
    who: {
      head: { eyebrow: "Who we are", title: "What we build, and what we have delivered." },
      body: [
        "We build web and mobile platforms, AI and automation, HR and point-of-sale systems, and the infrastructure under them; full ERP is designed but not yet delivered, and we haven't delivered robotics work yet.",
        "Every project we show says who built it, and every capability says how much of it we have delivered.",
      ],
      links: [
        { label: "Our capabilities, with their evidence", href: "/capabilities" },
        { label: "Our work, labelled by who built it", href: "/work" },
      ],
    },
    where: {
      head: {
        eyebrow: "Locations",
        title: "Where our engineers work.",
        lead: "Our engineers work across the UK, Malaysia and Bangladesh.",
      },
      places: ["United Kingdom", "Malaysia", "Bangladesh"],
    },
    howWeWork: {
      head: {
        eyebrow: "How we work with clients",
        title: "Named engineers, a pilot first, and IP you own.",
        /* The old homepage hero's supporting line, word for word (MOVES.md). */
        lead: "Senior-only teams, named engineers up front, 4–8 hours of overlap with US and EU, and you own the IP.",
      },
      /* The Organization description's "How we work" (lib/structured-data.ts;
         COPY.md, "Company description — canonical"), as terms. */
      terms: [
        { term: "Named engineers", detail: "Assigned before you sign. Your first call is with the engineer who writes the code." },
        { term: "Overlap hours", detail: "4–8 hours of overlap with US and EU working days." },
        { term: "Intellectual property", detail: "Assigned to you on payment." },
        { term: "NDA", detail: "Signed before scoping." },
      ],
      modelsTitle: "Engagement models",
      /* COPY.md §6, word for word — the line under the table, and the
         operating detail (MOVES.md). */
      lineUnderTable:
        "Most engagements start with the two-week pilot below. We’ll give you a full quote for the wider build at the end of it, once we’ve seen the real codebase.",
      operatingDetail:
        "Two-week sprints, a demo at the end of each, a named escalation contact, and a written weekly report. Ask for a sample report and we’ll send a real one.",
      pilotCta: { label: "Start a 2-week pilot", href: "/contact#project" },
    },
    refuse: {
      head: {
        eyebrow: "What we won't do",
        title: "Commitments this site already keeps.",
        lead: "Each is a rule the site already follows, and most are checked before every release.",
      },
      items: [
        {
          title: "Publish a figure without its label",
          body: "Every number on this site says whether it was measured on a running system (shipped) or is a target. A budget is never presented as a result.",
        },
        {
          title: "Use stock photography or stock faces",
          body: "Screenshots are real captures of live products. An engineer is shown with their own photograph or, until one exists, their initials — and is linked only once their profile is verified.",
        },
        {
          title: "Take credit for work we didn't do",
          body: "Every project says who built it. Work our engineers shipped at previous employers is credited to those employers, and features we built inside another company's app are called features, not the app.",
          link: { label: "How each project is labelled", href: "/work" },
        },
        {
          title: "Claim delivery we haven't done",
          body: "Every capability carries its evidence tier. We engineer software for machines; we don't manufacture hardware, and we haven't delivered robotics work yet.",
          link: { label: "The evidence behind each capability", href: "/capabilities" },
        },
      ],
    },
  },

  insights: {
    head: {
      eyebrow: "Insights",
      title: "Notes from the systems we build.",
      lead: [
        "Technical articles written from real work: the decisions, the code and the tradeoffs. Every figure is labelled, and where a system is still in development, the article says so.",
      ],
      meta: {
        title: "Insights",
        description:
          "Technical articles from real work: routing AI before inference, offline-first point of sale, and multi-tenant SaaS on Postgres row-level security.",
      },
    },
    teaser: {
      eyebrow: "Insights",
      title: "Notes from the systems we build.",
      lead: "Technical articles written from real work, every figure labelled.",
      cta: { label: "All insights", href: "/insights" },
    },
  },
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

export const pages: PagesContent = deepFreeze(parseContent(pagesSchema, raw, "pages.ts"));
