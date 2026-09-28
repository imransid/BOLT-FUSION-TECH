import { z } from "zod";

import { CANONICAL_DESCRIPTION } from "./canonical";
import { figureLabels } from "./figure-labels";

/* The homepage's sections, in the owner's redesign of 2026-09-16 (SPEC §5):
   the hero; what we engineer; the six capabilities; the system map;
   industries; how we build; technical depth; engineering stories (the two
   write-ups and the proof strip); the team; the FAQ; the final call to action.
   The booking calendar and the contact panel moved to /contact. The
   architecture section, How we work and the engagement models left the
   homepage: $SP/engineering/MOVES.md records where each item went. */
export const sectionIds = [
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
] as const;

export type SectionId = (typeof sectionIds)[number];

/** Reject links whose scheme could execute script when rendered as href/src. */
const DANGEROUS_SCHEME = /^\s*(?:javascript|vbscript|data|file):/i;
const safeUrl = z
  .string()
  .min(1)
  .refine((v) => !DANGEROUS_SCHEME.test(v), { message: "Unsafe URL scheme" });
/** Like safeUrl but allows empty/relative/anchor hrefs (only blocks dangerous schemes). */
const safeHref = z
  .string()
  .refine((v) => !DANGEROUS_SCHEME.test(v), { message: "Unsafe URL scheme" });

const linkSchema = z.strictObject({
  label: z.string().min(1),
  href: safeHref.pipe(z.string().min(1)),
});

/* "Schedule a Call" — the owner's words for every primary call to action,
   title case (SPEC §1, 2026-09-16). It replaced "Book a call"; the whole
   content file is refused if that phrase comes back anywhere in it. */
export const SCHEDULE_LABEL = "Schedule a Call";
export const SCHEDULE_HREF = "/contact#schedule";
const scheduleCtaSchema = linkSchema.refine((l) => l.label === SCHEDULE_LABEL, {
  message: `a primary call to action says "${SCHEDULE_LABEL}", exactly`,
});

const socialLinkSchema = z.object({
  name: z.string(),
  url: safeUrl,
});

const faqItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

/* A featured work is a claim about something we shipped, so it has to be
   backed — the same gate content/schema.ts puts on /work. "published" means
   there is a write-up, and its link is REQUIRED: there is no fallback. The old
   `href ?? "#contact"` quietly turned any project without a write-up into a
   contact link. "awaiting-asset" renders as a plain card with no link and no
   call to action. */
export const featuredWorkStateSchema = z.enum(["published", "awaiting-asset"]);

/* The engineering-story shape (SPEC §5): the problem, the system, the
   engineering, the result. Results are only real ones, and a figure in any of
   them is shown through <FigureText> with its label. */
const storySchema = z.strictObject({
  problem: z.string().min(1),
  system: z.string().min(1),
  /** Show the restaurant search's three lanes (content/architecture.ts) under the system line. */
  lanes: z.boolean().default(false),
  engineering: z.string().min(1),
  result: z.string().min(1),
});

const featuredWorkSchema = z
  .object({
    src: z.string(),
    title: z.string(),
    outcome: z.string(),
    stack: z.string(),
    alt: z.string(),
    imgClass: z.string().optional(),
    state: featuredWorkStateSchema,
    /** The write-up this card links to. Required when published, absent otherwise. */
    href: safeHref.optional(),
    /** Label on the card's link. Defaults to "Read the case study". */
    ctaLabel: z.string().optional(),
    story: storySchema,
  })
  .superRefine((work, ctx) => {
    const hasHref = Boolean(work.href?.trim());
    if (work.state === "published" && !hasHref) {
      ctx.addIssue({ code: "custom", path: ["href"], message: "A published project needs a write-up link." });
    }
    if (work.state === "awaiting-asset" && hasHref) {
      ctx.addIssue({
        code: "custom",
        path: ["href"],
        message: "Only a published project links anywhere. Set the state to published, or clear the link.",
      });
    }
  });

/* ── The team (`team` in content/site.ts). The owner, 2026-09-24: "we just
   show we have 15+ developer team, no details". The section states the team's
   size and nothing about any one person — no names, no profiles, no photographs,
   no Person structured data. The roster, its verified/pending states and their
   rules (decided 2026-09-15) are retired with it; the team object is STRICT, so
   a `roster` put back fails the build instead of rendering nowhere. `size` is a
   figure ("15+"): it renders inside the exemption content/figure-labels.ts holds
   for that exact text, and a size without one fails here, not on the page
   (verify-site check 8). ── */
const teamSizeSchema = z.string().superRefine((v, ctx) => {
  if (!figureLabels.some((l) => l.text === v && "exempt" in l))
    ctx.addIssue({
      code: "custom",
      message: `team.size "${v}" is a figure: add { text: "${v}", exempt: "<why it is not a performance claim>" } to content/figure-labels.ts`,
    });
});

/* Every figure carries a shipped or target label (CLAUDE.md hard rule).
   Required here as well as in content/metrics.ts, so no KPI can reach a page
   without one. */
export const kpiStatusSchema = z.enum(["shipped", "target"]);

/* A KPI whose value holds a digit is a figure and needs its status. One whose
   value is a word ("Multi-tenant", "Observable") is a capability, not a metric,
   and carries NO status: a chip on a capability dilutes what the chip means
   (owner, 2026-09-12). Both directions fail validation, so the build fails. */
const isFigure = (value: string) => /\d/.test(value);

const caseStudyKpiSchema = z
  .object({
    value: z.string(),
    label: z.string(),
    hint: z.string().optional(),
    status: kpiStatusSchema.optional(),
  })
  .refine((k) => !isFigure(k.value) || k.status !== undefined, {
    message: "A KPI whose value is a figure needs a status: shipped or target",
    path: ["status"],
  })
  .refine((k) => isFigure(k.value) || k.status === undefined, {
    message: "A capability is not a metric: a KPI whose value is not a figure carries no status",
    path: ["status"],
  });

const caseStudyLaneSchema = z.object({
  lane: z.number(),
  title: z.string(),
  summary: z.string(),
  traffic: z.string(),
  latency: z.string(),
  bullets: z.array(z.string()),
  costLine: z.string().optional(),
});

const caseStudyStackGroupSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});

const caseStudyContextSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  bullets: z.array(z.string()),
  featured: z.boolean().optional(),
});

/** Every string in the content, with its path — for the rules that read all of it. */
function* strings(value: unknown, path: (string | number)[] = []): Generator<[string, (string | number)[]]> {
  if (typeof value === "string") yield [value, path];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, [...path, i]);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* strings(v, [...path, k]);
}

export const siteContentSchema = z
  .object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
      ogTitle: z.string(),
      ogDescription: z.string(),
    }),
    site: z.object({
      /* Every section exactly once. The old loader repaired a bad order by
         appending whatever was missing; now a bad order fails the build. To hide
         a section, set sectionVisibility[id] to false. */
      sectionOrder: z
        .array(z.enum(sectionIds))
        .refine((order) => order.length === sectionIds.length && sectionIds.every((id) => order.includes(id)), {
          message: "site.sectionOrder must list every section exactly once",
        }),
      sectionVisibility: z.record(z.string(), z.boolean()).default({}),
    }),
    /* The header, the drawer and every page's shell (components/site). Routes,
       not homepage anchors: every page shares one navigation. */
    navigation: z.strictObject({
      links: z.array(linkSchema).min(1),
      cta: scheduleCtaSchema,
    }),
    footer: z.strictObject({
      /** The line under the name (SPEC §5). */
      tagline: z.string().min(1),
      navHeading: z.string().min(1),
      nav: z.array(linkSchema).min(1),
      socialHeading: z.string().min(1),
      socialLinks: z.array(socialLinkSchema),
      contactHeading: z.string().min(1),
      email: linkSchema,
      cta: scheduleCtaSchema,
      copyrightName: z.string(),
      rightsLine: z.string(),
      legal: z.array(linkSchema),
      backToTopLabel: z.string(),
    }),
    hero: z.strictObject({
      /** The page's one h1. */
      title: z.string().min(1),
      support: z.string().min(1),
      body: z.string().min(1),
      primaryCta: scheduleCtaSchema,
      secondaryCta: linkSchema,
    }),
    team: z.strictObject({
      benchLabel: z.string(),
      codeComment: z.string(),
      headlineLine1: z.string(),
      headlineLine2: z.string(),
      subtext: z.string(),
      /** The team's size, as the owner states it: "15+". A figure, exempted in
       *  content/figure-labels.ts. */
      size: teamSizeSchema,
      /** Beside the size: "developers". */
      sizeLabel: z.string().min(1),
    }),
    recentWorks: z.object({
      eyebrow: z.string().min(1),
      title: z.string(),
      subtitle: z.string(),
      items: z.array(featuredWorkSchema),
      /* The proof strip (content/metrics.ts), moved here from the hero on
         2026-09-16, unchanged in structure. */
      proofTitle: z.string().min(1),
      proofNote: z.string().min(1),
    }),
    caseStudy: z.object({
      badge: z.string(),
      title: z.string(),
      titleAccentLine: z.string(),
      subtitle: z.string(),
      executiveSummary: z.string(),
      imageSrc: z.string(),
      imageAlt: z.string(),
      kpis: z.array(caseStudyKpiSchema),
      kpiSectionEyebrow: z.string(),
      kpiBlockTitle: z.string(),
      lanesSectionTitle: z.string(),
      lanesIntro: z.string(),
      lanes: z.array(caseStudyLaneSchema),
      stackSectionTitle: z.string(),
      stackBlockTitle: z.string(),
      stackGroups: z.array(caseStudyStackGroupSchema),
      patternsSectionTitle: z.string(),
      patterns: z.array(z.string()),
      architectureSectionTitle: z.string(),
      architectureBlockTitle: z.string(),
      architectureLead: z.string(),
      contexts: z.array(caseStudyContextSchema),
      sharedKernelTitle: z.string(),
      sharedKernelItems: z.array(z.string()),
      diagramBadgeLeft: z.string(),
      diagramBadgeRight: z.string(),
      ctaSupportingText: z.string(),
      primaryCtaLabel: z.string(),
      primaryCtaHref: safeHref,
      secondaryCtaLabel: z.string(),
      secondaryCtaHref: safeHref,
    }),
    faq: z.object({
      badge: z.string(),
      title: z.string(),
      items: z.array(faqItemSchema),
    }),
    finalCta: z.strictObject({
      title: z.string().min(1),
      line: z.string().min(1),
      primary: scheduleCtaSchema,
      secondary: linkSchema,
    }),
    /* /contact (2026-09-16): the contact panel and the booking calendar that
       closed the old homepage, and a short project form that opens the
       visitor's email app — the site's existing mechanism, mailto, and no
       backend. Since 2026-09-28 the calendar sits beside the h1 (after it on a
       phone), so the panel's own Schedule a Call — a jump to that calendar —
       went: the header's is on every page. */
    contact: z.strictObject({
      meta: z.strictObject({ title: z.string().min(1), description: z.string().min(1) }),
      eyebrow: z.string().min(1),
      statusLabel: z.string(),
      title: z.string(),
      body: z.string(),
      emailLabel: z.string(),
      emailHref: safeHref,
      emailAddress: z.string().email(),
      schedule: z.strictObject({
        title: z.string().min(1),
        blurb: z.string().min(1),
        frameTitle: z.string().min(1),
        /** Whose calendar this is and who hosts it, on the panel itself. */
        caption: z.string().min(1),
        /** Inside the reserved frame, behind the iframe: what should appear there. */
        placeholder: z.string().min(1),
        /** The same place, raised above the frame when the calendar never loads. */
        stalled: z.string().min(1),
        /** Always visible under the panel, for a browser that blocks Calendly. */
        fallbackNote: z.string().min(1),
      }),
      project: z.strictObject({
        title: z.string().min(1),
        lead: z.string().min(1),
        nameLabel: z.string().min(1),
        subjectLabel: z.string().min(1),
        bodyLabel: z.string().min(1),
        bodyHint: z.string().min(1),
        submitLabel: z.string().min(1),
        fallback: z.string().min(1),
      }),
    }),
  })
  .superRefine((c, ctx) => {
    /* The homepage's description opens with the canonical line, word for word
       (verify-site check 12). */
    for (const key of ["description", "ogDescription"] as const)
      if (!c.meta[key].startsWith(CANONICAL_DESCRIPTION))
        ctx.addIssue({ code: "custom", path: ["meta", key], message: "starts with the canonical description (content/canonical.ts), word for word" });
    /* ...and every description is a description: 50–160 characters
       (verify-site check 26). The homepage's was 211 — the canonical line plus
       the company line — until 2026-09-16. */
    const descriptions: [string[], string][] = [
      [["meta", "description"], c.meta.description],
      [["meta", "ogDescription"], c.meta.ogDescription],
      [["contact", "meta", "description"], c.contact.meta.description],
    ];
    for (const [path, text] of descriptions)
      if (text.length < 50 || text.length > 160)
        ctx.addIssue({ code: "custom", path, message: `a meta description is 50–160 characters (verify-site check 26); this is ${text.length}` });
    /* "Book a call" is retired everywhere (SPEC §1): every primary call to
       action says "Schedule a Call". */
    for (const [s, path] of strings(c))
      if (/\bbook a call\b/i.test(s))
        ctx.addIssue({ code: "custom", path, message: `"Book a call" is retired (owner, 2026-09-16): the words are "${SCHEDULE_LABEL}"` });
  });

export type SiteContent = z.infer<typeof siteContentSchema>;
/** What content/site.ts writes: defaults (sectionVisibility, a story's lanes) may be left out. */
export type SiteContentInput = z.input<typeof siteContentSchema>;
export type SiteLink = z.infer<typeof linkSchema>;
