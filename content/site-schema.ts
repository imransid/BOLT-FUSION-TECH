import { z } from "zod";

export const sectionIds = [
  "hero",
  "architecture",
  "about",
  "team",
  "recent_works",
  "how_we_work",
  "services",
  "faq",
  "cta",
  "schedule_embed",
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

const navLinkSchema = z.object({
  label: z.string(),
  href: safeHref,
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
    /** Label on the card's pill. Defaults to "Read the case study". */
    ctaLabel: z.string().optional(),
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

const processStepSchema = z.object({
  num: z.number(),
  title: z.string(),
  desc: z.string(),
});

const serviceCardSchema = z.object({
  title: z.string(),
  desc: z.string(),
});

const LINKEDIN_PROFILE = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?$/;

/** role, experience and stack are deliberately blank for every member until
 *  real data exists — see the note on `team.roster` in content/site.ts. */
const teamMemberSchema = z.object({
  /** Stable list key. Names and handles can collide; an id cannot, so React
   *  reconciliation never mixes two people's cards up. */
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  /** null until a real photo exists — template avatars were deleted in triage. */
  image: z.string().nullable(),
  /** Required key — a card must always carry the field, so nobody can be added
   *  without one. The value ships blank until real data exists; the card
   *  omits the line entirely while it is empty rather than reserving a gap. */
  role: z.string(),
  experience: z.string().optional(),
  stack: z.array(z.string()).optional(),
  /** A VERIFIED LinkedIn profile. Required: COPY.md §5 (amended 2026-09-11)
   *  lists only people with one, so nobody can be added without it. Must be a
   *  linkedin.com/in/ URL, so a link is never constructed from a handle again. */
  profileUrl: safeUrl.refine((v) => LINKEDIN_PROFILE.test(v), {
    message: "profileUrl must be a verified linkedin.com/in/ profile URL",
  }),
});

/** One defensible figure from a system we shipped. `sourceLabel` is the
 *  credibility signal and is required — a stat with no named source must not
 *  be renderable. */
const proofPointSchema = z.object({
  stat: z.string(),
  label: z.string(),
  body: z.string(),
  sourceLabel: z.string(),
  sourceHref: safeHref.optional(),
});

/** One row of the three-lane retrieval diagram that replaced the stock photo. */
const retrievalLaneSchema = z.object({
  name: z.string(),
  detail: z.string(),
});

/* Every figure carries a shipped or target label (CLAUDE.md hard rule).
   Required here as well as in content/metrics.ts, so no KPI can reach a page
   without one. */
export const kpiStatusSchema = z.enum(["shipped", "target"]);

const caseStudyKpiSchema = z.object({
  value: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  status: kpiStatusSchema,
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

const experienceRowSchema = z.object({
  role: z.string(),
  company: z.string(),
  period: z.string(),
});

export const siteContentSchema = z.object({
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
  navbar: z.object({
    links: z.array(navLinkSchema),
    scheduleCtaLabel: z.string(),
  }),
  footer: z.object({
    copyrightName: z.string(),
    rightsLine: z.string(),
    socialLinks: z.array(socialLinkSchema),
    backToTopLabel: z.string(),
  }),
  hero: z.object({
    badge: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    /** Substring of `headlineLine2` rendered in amber — the hero's one accent.
     *  Matched on first occurrence; when it is not found in `headlineLine2`,
     *  line 2 renders plain rather than breaking. Empty string = no accent. */
    headlineLine2Accent: z.string(),
    subtext: z.string(),
    trustPoints: z.array(z.string()),
    tagline: z.string(),
    primaryCtaLabel: z.string(),
    primaryCtaHref: safeHref,
    secondaryCtaLabel: z.string(),
    secondaryCtaHref: safeHref,
    scrollHintLeft: z.string(),
    scrollHintRight: z.string(),
  }),
  /* Every key here is NEW. The old shape (headlineLine1-3, intro, metrics,
     footerTitle, trustPoints, imageSrc...) carried invented figures — "10X
     Faster Delivery", "99.9% Defect-Free" — and was replaced, not renamed. */
  aiExcellence: z.object({
    heading: z.string(),
    subline: z.string(),
    ctaLabel: z.string(),
    ctaHref: safeHref,
    diagramTitle: z.string(),
    diagramInLabel: z.string(),
    diagramOutLabel: z.string(),
    lanes: z.array(retrievalLaneSchema),
    proofPoints: z.array(proofPointSchema),
    proofNote: z.string(),
    assurances: z.array(z.string()),
  }),
  about: z.object({
    title: z.string(),
    bio: z.string(),
    skills: z.array(z.string()),
    experience: z.array(experienceRowSchema),
  }),
  team: z.object({
    benchLabel: z.string(),
    codeComment: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    subtext: z.string(),
    statLabel: z.string(),
    roster: z.array(teamMemberSchema),
  }),
  recentWorks: z.object({
    title: z.string(),
    subtitle: z.string(),
    mobileSwipeHint: z.string(),
    items: z.array(featuredWorkSchema),
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
  process: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    discussLabel: z.string(),
    workLabel: z.string(),
    steps: z.array(processStepSchema),
  }),
  services: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    skills: z.array(z.string()),
    discussLabel: z.string(),
    workLabel: z.string(),
    cards: z.array(serviceCardSchema),
  }),
  faq: z.object({
    badge: z.string(),
    title: z.string(),
    items: z.array(faqItemSchema),
  }),
  cta: z.object({
    statusLabel: z.string(),
    title: z.string(),
    body: z.string(),
    scheduleLabel: z.string(),
    scheduleHref: safeHref,
    emailLabel: z.string(),
    emailHref: safeHref,
  }),
  scheduleEmbed: z.object({
    blurb: z.string(),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
