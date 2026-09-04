import { z } from "zod";

export const sectionIds = [
  "hero",
  "ai_excellence",
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
] as const;

export type SectionId = (typeof sectionIds)[number];

export const industryIconKeySchema = z.enum([
  "edtech",
  "fintech",
  "ecommerce",
  "pharma",
  "telecom",
  "retail",
  "software",
  "startup",
  "factory",
]);

export type IndustryIconKey = z.infer<typeof industryIconKeySchema>;

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

const testimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  text: z.string(),
  stars: z.number().min(1).max(5).default(5),
});

const featuredWorkSchema = z.object({
  src: z.string(),
  title: z.string(),
  outcome: z.string(),
  stack: z.string(),
  alt: z.string(),
  imgClass: z.string().optional(),
  /** Optional deep-dive link (e.g. a case study page). Falls back to the contact anchor. */
  href: safeHref.optional(),
  /** Short label shown on the card's hover/footer pill when href points to a case study. */
  ctaLabel: z.string().optional(),
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

const industryItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconKey: industryIconKeySchema,
});

const teamMemberSchema = z.object({
  /** Stable list key. Names and handles can collide; an id cannot, so React
   *  reconciliation never mixes two people's cards up. */
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  image: z.string(),
  /** Required key — a card must always carry the field, so nobody can be added
   *  without one. The value ships blank and is filled in via /admin; the card
   *  omits the line entirely while it is empty rather than reserving a gap. */
  role: z.string(),
  experience: z.string().optional(),
  stack: z.array(z.string()).optional(),
  /** Omitted entirely unless we hold a VERIFIED profile for this person. There
   *  is no fallback URL construction anywhere — a missing value renders a card
   *  with no link, never a dead anchor and never "#". */
  profileUrl: safeHref.optional(),
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

const caseStudyKpiSchema = z.object({
  value: z.string(),
  label: z.string(),
  hint: z.string().optional(),
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
    sectionOrder: z.array(z.enum(sectionIds)),
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
    logos: z.array(z.string()),
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
     Faster Delivery", "99.9% Defect-Free". Reusing any of those key names would
     let a stored CMS document keep serving them straight past this rewrite,
     because deepMerge lets stored values win. Renaming instead means zod strips
     the stale keys as unknown and every field below falls back to defaults. */
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
    imageSrc: z.string(),
    imageAlt: z.string(),
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
    marquee: z.array(z.string()),
    imageSrc: z.string(),
    imageAlt: z.string(),
  }),
  industries: z.object({
    badge: z.string(),
    titleLine1: z.string(),
    titleLine2: z.string(),
    subtitle: z.string(),
    items: z.array(industryItemSchema),
    ctaCardTitle: z.string(),
    ctaCardBody: z.string(),
    ctaCardButton: z.string(),
    learnMoreLabel: z.string(),
  }),
  testimonials: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    startConversationLabel: z.string(),
    startConversationHref: safeHref,
    recentWorkLabel: z.string(),
    recentWorkHref: safeHref,
    items: z.array(testimonialSchema),
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
