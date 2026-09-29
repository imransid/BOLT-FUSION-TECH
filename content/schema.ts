import { z } from "zod";

/**
 * Typed content schemas.
 *
 * The site's content lives in these typed files, parsed at load. There is no
 * CMS: it was removed on 2026-09-11, and PLAN.md §8's Payload plan is
 * superseded. The shape rules below still hold — they keep the files easy to
 * read, diff and check:
 *  · a stable `id` is the slug / document key
 *  · media is a path string under /public
 *  · relations are id strings, not nested objects
 *  · no nested arrays-of-objects deeper than one level
 *  · nothing derived — anything computable is computed at render, not stored
 *
 * Content is PARSED, not just typed. A type is erased at build time; a parse is
 * not. CLAUDE.md's hard rule — "every metric carries a shipped or target label,
 * no unlabelled numbers" — is only enforceable if an unlabelled metric fails the
 * build, which is what `parseContent` below does.
 */

/** Blank means "not supplied yet". Never invent a value to fill one. */
const pending = <T extends z.ZodTypeAny>(inner: T) => inner.nullable();

/* ── metrics ─────────────────────────────────────────────────────────────────
 * The `status` discriminator is the whole point of this collection. It is
 * required and has no default: a metric cannot exist without saying whether it
 * was measured or is a target.
 */
export const metricStatusSchema = z.enum(["shipped", "target"]);
export type MetricStatus = z.infer<typeof metricStatusSchema>;

export const metricSchema = z.object({
  id: z.string().min(1),
  /** The figure exactly as written. A string, because "<100ms" and "~$0.001"
   *  are not numbers and must never be reformatted by a locale helper. */
  value: z.string().min(1),
  label: z.string().min(1),
  status: metricStatusSchema,
  /** Which shipped system the figure came from. */
  source: z.string().min(1),
  /** Optional deep link to the write-up that substantiates it. */
  href: z.string().nullable(),
});
export type Metric = z.infer<typeof metricSchema>;

/* ── projects ───────────────────────────────────────────────────────────────
 * `state` gates rendering. "published" needs a real screenshot and a write-up;
 * "awaiting-asset" renders as a declared empty slot instead of a claim we
 * cannot substantiate. COPY.md: "Never write a claim about a project we can't
 * link to."
 */
export const projectStateSchema = z.enum(["published", "awaiting-asset"]);
export type ProjectState = z.infer<typeof projectStateSchema>;

/* ── the nine-part case-study template (spec §3/§4) ──────────────────────────
 * A project is EITHER a summary card (`template: "summary"`) or a full nine-part
 * write-up (`template: "nine-part"`). The fields below are required for the
 * latter and absent for the former, which is what lets /work ship today while
 * still refusing a nine-part study that skips the sections carrying the
 * credibility.
 *
 * `tradeoff` and `retrospective` are REQUIRED BY DESIGN. Spec §4: "a decision
 * with no cost is not a decision", and §7 is the differentiator — "only a team
 * confident in its work will say what it got wrong". Making them mandatory here
 * means no future study can quietly omit them.
 */
export const decisionSchema = z.object({
  id: z.string().min(1),
  /** e.g. "Claude Haiku over a frontier model for intent parsing" */
  choice: z.string().min(1),
  reasoning: z.string().min(1),
  /** Required. A decision with no cost is not a decision. */
  tradeoff: z.string().min(1),
});
export type Decision = z.infer<typeof decisionSchema>;

export const caseStudyBodySchema = z.object({
  problem: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(1),
  decisions: z.array(decisionSchema).min(1),
  /** Relations into content/metrics.ts, by id. */
  metricIds: z.array(z.string().min(1)),
  /** Section 7. Required — this is the proof, not an optional extra. */
  retrospective: z.string().min(1),
  shippedAt: z.string().min(1),
  liveUrl: z.string().url().nullable(),
});
export type CaseStudyBody = z.infer<typeof caseStudyBodySchema>;

/* ── who built it — decided by the owner, 2026-09-15 ─────────────────────────
 * CLAUDE.md, "Projects and attribution". Every project says who built it, and
 * the kind decides what its card shows:
 *  · case-study   a Bolt Fusion project with a write-up on this site
 *  · project      a Bolt Fusion delivery; the product may belong to the company
 *                 named in `client` — "built by Bolt Fusion for …", never ours
 *  · in-house     a product we built for ourselves
 *  · track-record work one of our engineers shipped at a previous employer —
 *                 credited to them, never presented as ours: it names the
 *                 employer (`builtAt`) and the engineer's role, has no client
 *                 and no screenshot (the product belongs to someone else)
 */
export const projectKindSchema = z.enum(["case-study", "project", "in-house", "track-record"]);
export type ProjectKind = z.infer<typeof projectKindSchema>;

/* ── what a Bolt Fusion delivery was — decided by the owner, 2026-09-16 ──────
 *  · product   we built the product: FanLock, Balanzify, Go Style Business,
 *              TTouch Clothing's four systems (2026-09-29)
 *  · features  we built features inside an app another company owns: Bazzile,
 *              GodConnect Online. The label reads "features built by Bolt
 *              Fusion for ‹client›" — never "built by Bolt Fusion" — so it names
 *              the client. The card never shows a generic screenshot of the
 *              app (`image`): the app's UI is the client's, and a view of the
 *              whole app claims all of it. Since 2026-09-30 (the owner, with
 *              Bazzile's permission) it may show `featureScreens`: only the
 *              screens where OUR features live, each tied to one feature its
 *              role names and captioned with it.
 * Set only on kind "project"; left out, it is "product".
 */
export const projectScopeSchema = z.enum(["product", "features"]);
export type ProjectScope = z.infer<typeof projectScopeSchema>;

/** Where the product stands, as the owner's portfolio records it. Not the
 *  shipped/target vocabulary: that belongs to figures, and so do its colours. */
export const projectStatusSchema = z.enum(["live", "in-production"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

/** A real screenshot under /public/projects, with its alt text and its pixel
 *  size (the card draws it at that size; no layout shift). Never a mockup. */
export const projectImageSchema = z.object({
  src: z.string().regex(/^\/projects\/[\w.-]+\.(png|webp|jpe?g|avif)$/, "a file under /public/projects"),
  alt: z.string().min(12, "alt text says what the screenshot shows"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type ProjectImage = z.infer<typeof projectImageSchema>;

/** The features a role names: the list after its colon. "Features in the
 *  React Native app: swipe-based browsing, Google Maps location matching and
 *  Firebase real-time sync" names three; "Feature work in the React Native
 *  app" (GodConnect Online: the portfolio does not say which features were
 *  ours) names none. Read by the schema below, and by verify-site check 9 in
 *  words of its own. */
export function roleFeatures(role: string): string[] {
  const colon = role.indexOf(":");
  if (colon < 0) return [];
  return role
    .slice(colon + 1)
    .split(/,\s*|\s+and\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/** A feature screen (the owner, 2026-09-30): one screen of another company's
 *  app where a feature WE built lives — the client's own published screenshot
 *  (Bazzile's App Store listing), shown with their permission. `feature` is
 *  one of the features its project's role names, word for word; `caption` is
 *  what the page prints under the screen, and names that feature. Both are
 *  required: the refinement below refuses a screen tied to no feature of the
 *  role, or captioned without its feature — an empty or missing one included
 *  (the defaults make a missing field that refusal, in its words). */
export const featureScreenSchema = z.object({
  feature: z.string().default(""),
  caption: z.string().default(""),
  image: projectImageSchema,
});
export type FeatureScreen = z.infer<typeof featureScreenSchema>;

/** A public figure about a client's app (the owner, 2026-09-30): read off one
 *  of the project's own public listings — Google Play's install band for
 *  Bazzile — and shown with that listing linked, never as our metric. Its
 *  `text` is a per-instance exemption in content/figure-labels.ts (verify-site
 *  check 8), and names the listing it links to. `read` is the day it was read. */
export const publicStatSchema = z.object({
  text: z.string().min(1),
  href: z.string().url().startsWith("https://", "an outbound link is https"),
  /** What the figure is, in words, for the line under it. */
  source: z.string().min(12, "say what the figure counts"),
  read: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "the day it was read, as 2026-09-30"),
});
export type PublicStat = z.infer<typeof publicStatSchema>;

/** A link out: the live product, a store listing, a public proof. */
export const projectLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url().startsWith("https://", "an outbound link is https"),
});
export type ProjectLink = z.infer<typeof projectLinkSchema>;

export const projectSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: projectKindSchema,
    /** kind "project" only: the product, or features in another company's app.
     *  Optional here so a scope set on another kind can be refused; the parse
     *  fills in "product" (the transform below). */
    scope: projectScopeSchema.optional(),
    /** The one-line description. */
    summary: z.string().min(1),
    /** What we built — on a track-record card, what our engineer did there. */
    role: z.string().min(1),
    /** The company that owns the product, when it is named: "built by Bolt
     *  Fusion for …". Never set on in-house or track-record work. */
    client: z.string().min(1).nullable().default(null),
    /** track-record only: the employer the engineer built it at. */
    builtAt: z.string().min(1).nullable().default(null),
    status: projectStatusSchema.nullable().default(null),
    /** When, as the portfolio gives it ("Jul 2025 – ongoing"). */
    period: z.string().min(1).nullable().default(null),
    stack: z.array(z.string().min(1)),
    image: projectImageSchema.nullable().default(null),
    /** Feature work only (2026-09-30): the screens where our features live. */
    featureScreens: z.array(featureScreenSchema).default([]),
    /** A public figure about the app, with its source (2026-09-30). */
    publicStat: publicStatSchema.nullable().default(null),
    /** The technical write-up — case studies only. COPY.md §4: "Each one has a
     *  full technical write-up, not a screenshot and a sentence." */
    href: pending(z.string().min(1)).default(null),
    /** Links out: the live product, store listings, public proof. */
    links: z.array(projectLinkSchema).default([]),
    /** What it is in a few words, for the homepage's client-story band only
     *  (2026-09-29), where a name sits over it instead of a card's summary. */
    tagline: z.string().min(1).max(60).optional(),
    state: projectStateSchema,
    /** Metric ids shown on the /work row. Relations, not copies. */
    metricIds: z.array(z.string().min(1)).default([]),
    /** "summary" = index card only. "nine-part" = a full write-up, and then
     *  every field in caseStudyBodySchema is mandatory. */
    template: z.enum(["summary", "nine-part"]).default("summary"),
    body: caseStudyBodySchema.nullable().default(null),
  })
  .superRefine((p, ctx) => {
    const refuse = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (p.template === "nine-part" && p.body === null)
      refuse(
        "body",
        "A nine-part case study must supply the full body: problem, constraints, decisions (each with a tradeoff), metricIds, retrospective, shippedAt. Use template 'summary' until it is written.",
      );

    /* who built it */
    if (p.kind === "track-record") {
      if (p.builtAt === null)
        refuse(
          "builtAt",
          `"${p.name}" is an engineer's track record: it names the employer it was built at (builtAt), with the engineer's role. Never present an employer's product as ours.`,
        );
      if (p.client !== null) refuse("client", `"${p.name}" was built at another employer: its owner is not our client. Leave client null.`);
      if (p.image !== null) refuse("image", `"${p.name}" belongs to someone else: a track-record card is text, with its store and proof links — no screenshot.`);
      if (p.metricIds.length) refuse("metricIds", `"${p.name}" is not our system: its figures are not our metrics.`);
    } else if (p.builtAt !== null) {
      refuse("builtAt", `builtAt is for an engineer's track record. "${p.name}" is ${p.kind === "in-house" ? "our own product" : "a Bolt Fusion project"}, not something built at another employer.`);
    }
    if (p.kind === "in-house" && p.client !== null) refuse("client", `"${p.name}" is in-house: we built it for ourselves, so it has no client.`);

    /* what we delivered: the product, or features inside someone else's app */
    if (p.scope !== undefined && p.kind !== "project")
      refuse("scope", `scope is for a Bolt Fusion delivery (kind "project"): the product, or features in another company's app. "${p.name}" is ${p.kind}: leave scope out.`);
    if (p.scope === "features") {
      if (p.client === null)
        refuse("client", `"${p.name}" is feature work inside another company's app: name that company (client). Its label reads "features built by Bolt Fusion for ‹client›" — never "built by Bolt Fusion".`);
      if (p.image !== null)
        refuse(
          "image",
          `"${p.name}" is feature work inside ${p.client ?? "another company"}'s app: a generic screenshot of the app claims all of it, and its UI is the client's. It shows only the screens where our features live, each tied to a feature its role names and captioned with it (featureScreens), and only with the client's permission.`,
        );
    }

    /* the screens where our features live (2026-09-30) */
    if (p.featureScreens.length) {
      const named = roleFeatures(p.role);
      if (p.scope !== "features" || !named.length)
        refuse(
          "featureScreens",
          `"${p.name}" carries feature screens, and ${p.scope !== "features" ? `is not feature work (scope "features"): a screenshot of a product we built is its image` : `its role names no features ("${p.role}"), so no screen can be tied to one`}. A feature screen shows one of the features a feature-work role names.`,
        );
      else
        p.featureScreens.forEach((s, i) => {
          const at = (field: string, message: string) => ctx.addIssue({ code: "custom", path: ["featureScreens", i, field], message });
          if (!named.some((f) => f.toLowerCase() === s.feature.trim().toLowerCase()))
            at(
              "feature",
              `"${p.name}": the screen ${s.image.src} is for "${s.feature}", which is not one of the features its role names (${named.map((f) => `"${f}"`).join(", ")}). Show only the screens where our features live.`,
            );
          else if (!s.caption.toLowerCase().includes(s.feature.trim().toLowerCase()))
            at("caption", `"${p.name}": the screen ${s.image.src} is captioned "${s.caption}", which does not name its feature, "${s.feature}" — a feature screen is captioned with the feature it shows`);
          if (p.featureScreens.findIndex((o) => o.image.src === s.image.src) !== i) at("image", `"${p.name}": ${s.image.src} is shown twice`);
        });
    }

    /* a public figure about the app, read off one of its own listings */
    if (p.publicStat) {
      const link = p.links.find((l) => l.href === p.publicStat!.href);
      if (!link || !p.publicStat.text.includes(link.label))
        refuse(
          "publicStat",
          `"${p.name}": its public figure "${p.publicStat.text}" links to ${p.publicStat.href}${link ? `, its "${link.label}" listing, which the figure does not name` : ", which is not one of its links"}. A public figure is read off one of the project's own listings, and says which.`,
        );
    }

    /* where it links */
    if (p.kind === "case-study") {
      if (p.href !== null && !p.href.startsWith("/work/")) refuse("href", `A case study's write-up is a page under /work/.`);
    } else if (p.href !== null) {
      refuse("href", `Only a case study has a write-up. "${p.name}" links out to its live product (links), or shows no link at all.`);
    }

    /* what a published card needs */
    if (p.state === "published") {
      if (p.kind === "case-study" && (p.image === null || p.href === null))
        refuse(
          "state",
          "A published case study needs both a screenshot and a write-up link. Set state to 'awaiting-asset' instead of shipping an unsubstantiated card.",
        );
      /* feature work in a client's app is published without one (above) */
      if ((p.kind === "project" || p.kind === "in-house") && p.scope !== "features" && p.image === null)
        refuse("image", `A published ${p.kind} shows a real screenshot of its live site. Set state to 'awaiting-asset' until one exists.`);
      if (p.kind === "track-record" && p.links.length === 0)
        refuse("links", `"${p.name}" is a text card: it carries its store and proof links. Set state to 'awaiting-asset' until they exist.`);
    }
  })
  .transform((p) => ({ ...p, scope: p.scope ?? ("product" as const) }));
export type Project = z.infer<typeof projectSchema>;

/** /work's sections, one per kind, in page order. */
export const projectSectionSchema = z.object({
  kind: projectKindSchema,
  id: z.string().regex(/^[a-z][a-z-]*$/),
  title: z.string().min(1),
  intro: z.string().min(1).nullable(),
});
export const projectSectionsSchema = z
  .array(projectSectionSchema)
  .refine((s) => projectKindSchema.options.every((k) => s.filter((x) => x.kind === k).length === 1), {
    message: "Every project kind has exactly one section on /work.",
  });
export type ProjectSection = z.infer<typeof projectSectionSchema>;

/** A client story (2026-09-29): one client's product projects shown together —
 *  on /work as a sub-group of Bolt Fusion projects under its own h3, and on the
 *  homepage as a band in the proof. Which projects belong to it is not stored:
 *  it is every published product project whose `client` is exactly this one
 *  (content/projects.ts, `clientStoryMembers`), because nothing derived is. */
export const clientStorySchema = z.object({
  /** The anchor on /work: /work#ttouch-clothing. */
  id: z.string().regex(/^[a-z][a-z-]*$/),
  /** Equals Project.client, byte for byte. */
  client: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
});
export type ClientStory = z.infer<typeof clientStorySchema>;

/* ── services ───────────────────────────────────────────────────────────── */
export const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shape: z.string().min(1),
  timeline: z.string().min(1),
});
export type Service = z.infer<typeof serviceSchema>;

/**
 * Parse at module load. A malformed content file fails `next build` with the
 * offending path, rather than rendering a broken section in production.
 */
export function parseContent<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  file: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `content/${file} failed validation:\n${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }
  return result.data;
}
