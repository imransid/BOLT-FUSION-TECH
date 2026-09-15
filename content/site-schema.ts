import { z } from "zod";

import { figureLabels } from "./figure-labels";

/* The homepage's sections (decided 2026-09-11): the hero, the proof straight
   after it, how the numbers are produced, how an engagement runs, who builds
   it, then questions and the routes to a conversation — the FAQ, the contact
   panel and the booking calendar. About and Services were cut (COPY.md,
   "Removed from the homepage"), so they are not sections any more; their
   content blocks are rendered by nothing. */
export const sectionIds = [
  "hero",
  "recent_works",
  "architecture",
  "how_we_work",
  "team",
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

const LINKEDIN_PROFILE = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?$/;

/* ── The team roster (`team.roster` in content/site.ts; how to fill a member in
   is written above the roster). Two states, and the build refuses anything in
   between (CLAUDE.md: "A person is linked, and marked up as Person, only with a
   verified LinkedIn profile", decided 2026-09-15):
   · verified — a linkedin.com/in/ profile and a handle. The card links to the
     profile, and the homepage emits a Person node for it.
   · pending — a named team member with no verified profile yet. No link, no
     handle, no photo: the card shows the name, initials and the pending label,
     and there is no Person node. A pending link is unverified by definition,
     so the schema refuses one.
   Both are STRICT: a misspelt or retired key (`image`, `experience`) fails the
   build instead of being dropped without a word — which is also why the
   pending state names the three fields it refuses, with the reason. ── */

const filled = (what: string) =>
  z.string().refine((v) => v.trim().length > 0, { message: `${what} is empty — leave the field out until a real value exists` });

/* verify-site check 27's test for a file named as a stand-in, so the build
   refuses a photo the suite would fail */
const STAND_IN = /(^|[\/_.-])(avatars?|placeholders?|generated|fake|faces?|illustrations?|default-user|user-default)([-_.\d]|$)/i;
const TEAM_PHOTO = /^\/team\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp|avif)$/;

/** The words a `years` value renders as on its card. */
export const yearsText = (years: number) => `${years} ${years === 1 ? "year" : "years"}`;

/* Supplied later by the owner, and rendered only when present. Never an
   example, a plausible title or a round number. */
const laterFields = {
  role: filled("role").optional(),
  years: z.number().int().min(1).max(60).optional(),
  stack: z
    .array(filled("a stack item"))
    .min(1, { message: "stack is empty — leave the field out until real values exist" })
    .optional(),
};

const verifiedMemberSchema = z.strictObject({
  /** Stable list key. Names and handles can collide; an id cannot, so React
   *  reconciliation never mixes two people's cards up. */
  id: filled("id"),
  status: z.literal("verified"),
  name: filled("name"),
  handle: filled("handle"),
  /** A VERIFIED LinkedIn profile, required. Must be a linkedin.com/in/ URL, so
   *  a link is never constructed from a handle again. */
  profileUrl: z
    .string({ error: "A verified member needs profileUrl: their https://www.linkedin.com/in/… profile" })
    .refine((v) => !DANGEROUS_SCHEME.test(v), { message: "Unsafe URL scheme" })
    .refine((v) => LINKEDIN_PROFILE.test(v), { message: "profileUrl must be a verified linkedin.com/in/ profile URL" }),
  /** A real photograph of this person, in public/team/ — never an avatar, an
   *  illustration, a stock or a generated face (CLAUDE.md, "No fake faces"). */
  photo: z
    .string()
    .regex(TEAM_PHOTO, { message: 'photo must be a path under /team/ — e.g. "/team/nadim.jpg": lowercase letters, digits and hyphens, then .jpg, .jpeg, .png, .webp or .avif' })
    .refine((v) => !STAND_IN.test(v), { message: "photo is named as a stand-in (avatar, placeholder, face, illustration…) — only a real photograph of the person goes on a card" })
    .optional(),
  ...laterFields,
});

const pendingMemberSchema = z.strictObject({
  id: filled("id"),
  status: z.literal("pending"),
  name: filled("name"),
  profileUrl: z
    .never({ error: 'A pending member has no profileUrl: a pending link is unverified by definition. When the profile is verified, set status to "verified" and add profileUrl and handle together.' })
    .optional(),
  handle: z
    .never({ error: 'A pending member has no handle — never one borrowed from someone else. It comes with the verified profile: set status to "verified".' })
    .optional(),
  photo: z
    .never({ error: 'A pending member is shown with initials, never a photo. A photo comes with the verified profile: set status to "verified".' })
    .optional(),
  ...laterFields,
});

const teamMemberSchema = z.discriminatedUnion("status", [verifiedMemberSchema, pendingMemberSchema], {
  error: 'status must be "verified" (with profileUrl and handle) or "pending" (with neither)',
});

const rosterSchema = z.array(teamMemberSchema).superRefine((roster, ctx) => {
  const ids = new Set<string>();
  roster.forEach((m, i) => {
    if (ids.has(m.id)) ctx.addIssue({ code: "custom", path: [i, "id"], message: `id "${m.id}" is used twice — each member needs their own` });
    ids.add(m.id);
    /* "8 years" is a figure, and every figure on the site carries a label or an
       exemption (CLAUDE.md, Hard rules; verify-site check 8). The card renders
       it inside the exemption content/figure-labels.ts holds for that exact
       text, so a years value without one fails here, not on the live page. */
    if (m.years !== undefined) {
      const text = yearsText(m.years);
      if (!figureLabels.some((l) => l.text === text && "exempt" in l))
        ctx.addIssue({
          code: "custom",
          path: [i, "years"],
          message: `years ${m.years} renders "${text}", a figure: add { text: "${text}", exempt: "<why this figure is not a performance claim>" } to content/figure-labels.ts`,
        });
    }
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
    subtext: z.string(),
    tagline: z.string(),
    primaryCtaLabel: z.string(),
    primaryCtaHref: safeHref,
    secondaryCtaLabel: z.string(),
    secondaryCtaHref: safeHref,
  }),
  team: z.object({
    benchLabel: z.string(),
    codeComment: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    subtext: z.string(),
    /** Beside the roster's size: "10 engineers". The number is counted, never written. */
    statLabel: z.string(),
    /** Beside the verified count: "6 verified profiles". Counted, never written. */
    verifiedLabel: z.string(),
    /** A pending card's line where a verified card shows its handle. */
    pendingLabel: z.string(),
    roster: rosterSchema,
  }),
  recentWorks: z.object({
    title: z.string(),
    subtitle: z.string(),
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
