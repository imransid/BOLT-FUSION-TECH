import { z } from "zod";

/**
 * /insights — technical articles written from real work only (redesign SPEC §6).
 *
 * Every schema here is strict: a stray or misspelt key fails the build with the
 * file named (`parseContent`), the same as `site-schema.ts`.
 *
 * What is deliberately NOT here:
 * - `readingMinutes`. "6 min read" is a figure (verify-site check 8 reads a digit
 *   with a unit as one), so every article would need its own exemption in
 *   `content/figure-labels.ts`, and a value computed at render would be a figure
 *   no entry covers. Left out; the strict schema refuses it. Add it back only
 *   together with a per-article exemption.
 * - Any figure outside the prose. Titles, deks and headings feed the Article
 *   JSON-LD and the meta tags, where there is no chip; code blocks and diagrams
 *   do not render through <FigureText>. `scripts/verify-insights.mjs` fails a
 *   figure anywhere but a paragraph or a bullet, and one there without its own
 *   entry in `content/figure-labels.ts`.
 */

/** Text a reader sees: never empty, never padded. */
const text = z
  .string()
  .min(1)
  .refine((s) => s === s.trim(), "no leading or trailing whitespace");

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "a lowercase, hyphenated slug");

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "an ISO date, YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "a real calendar date");

const unique = <T>(list: readonly T[]) => new Set(list).size === list.length;

/** The six capabilities, by the ids the redesign uses (SPEC §5, "What we engineer"). */
export const capabilityIdSchema = z.enum(["software", "ai", "erp", "pos", "robotics", "cloud"]);
export type CapabilityId = z.infer<typeof capabilityIdSchema>;

/** A short config, query or pseudo-code snippet. Rendered as-is, not through
 *  <FigureText>, so it carries no figure (scripts/verify-insights.mjs). */
export const insightCodeSchema = z.strictObject({
  language: z.enum(["sql", "typescript", "python", "text"]),
  /** Says what the snippet is and where it comes from — pseudo-code says so. */
  caption: text,
  source: z.string().min(1),
});
export type InsightCode = z.infer<typeof insightCodeSchema>;

const diagramNodeSchema = z.strictObject({
  label: text,
  detail: text.optional(),
});

/** One step of a diagram, drawn in order. `branches` are alternatives taken at
 *  that step and drawn side by side — a router's lanes, say. */
export const insightDiagramStepSchema = z.strictObject({
  label: text,
  detail: text.optional(),
  branches: z.array(diagramNodeSchema).min(2).optional(),
});

/** A diagram as data, for the renderer to draw. No coordinates: layout is the
 *  renderer's job, and nothing derived is stored (content/schema.ts). */
export const insightDiagramSchema = z.strictObject({
  caption: text,
  steps: z.array(insightDiagramStepSchema).min(2),
});
export type InsightDiagram = z.infer<typeof insightDiagramSchema>;

/** Where a section's list, code block or diagram sits in its reading order:
 *  after this many paragraphs ("The cases it asserts:" is followed by the
 *  cases). Left out, each follows all the paragraphs, in that order. Reading
 *  order is content; nothing here is a coordinate. */
const insightPlaceSchema = z.strictObject({
  bullets: z.number().int().min(1).optional(),
  code: z.number().int().min(1).optional(),
  diagram: z.number().int().min(1).optional(),
});

/** One h2 section. Paragraphs and bullets render through <FigureText>. */
export const insightSectionSchema = z
  .strictObject({
    heading: text,
    paragraphs: z.array(text).min(1),
    bullets: z.array(text).min(1).optional(),
    code: insightCodeSchema.optional(),
    diagram: insightDiagramSchema.optional(),
    place: insightPlaceSchema.optional(),
  })
  .superRefine((s, ctx) => {
    for (const k of ["bullets", "code", "diagram"] as const) {
      const after = s.place?.[k];
      if (after === undefined) continue;
      if (!s[k]) ctx.addIssue({ code: "custom", path: ["place", k], message: `"${s.heading}": places ${k} the section does not have` });
      if (after > s.paragraphs.length)
        ctx.addIssue({ code: "custom", path: ["place", k], message: `"${s.heading}": ${k} after paragraph ${after}, but the section has ${s.paragraphs.length}` });
    }
  });
export type InsightSection = z.infer<typeof insightSectionSchema>;

export const insightSchema = z
  .strictObject({
    slug: slugSchema,
    /** The page's h1 and the Article headline. */
    title: text,
    /** One sentence: the summary under the title, the meta description and the
     *  Article description. */
    dek: text.refine((s) => /[.?]$/.test(s) && !/[.?!]\s+\p{Lu}/u.test(s), "one sentence, ending in a full stop"),
    /** The meta description, when the dek is longer than verify-site check 26
     *  allows (50 to 160 characters). Left out, the dek is the description. The
     *  Article JSON-LD keeps the dek. */
    description: text.refine((s) => /[.?]$/.test(s) && !/[.?!]\s+\p{Lu}/u.test(s), "one sentence, ending in a full stop").optional(),
    datePublished: isoDateSchema,
    /** SPEC §6: an engineer's name only if the owner assigns one. Until then,
     *  the team. Widen this deliberately, to a verified member, when he does. */
    author: z.literal("Bolt Fusion Tech engineering"),
    capabilities: z.array(capabilityIdSchema).min(1).refine(unique, "each capability once"),
    /** Ids of published projects in content/projects.ts (checked in
     *  content/insights.ts). A case study's write-up is /work/<id>. */
    relatedWork: z.array(slugSchema).refine(unique, "each project once"),
    sections: z.array(insightSectionSchema).min(3),
  })
  .superRefine((a, ctx) => {
    const headings = a.sections.map((s) => s.heading.toLowerCase());
    if (!unique(headings)) ctx.addIssue({ code: "custom", path: ["sections"], message: `"${a.slug}": two sections share a heading` });
    const meta = a.description ?? a.dek;
    if (meta.length < 50 || meta.length > 160)
      ctx.addIssue({
        code: "custom",
        path: [a.description ? "description" : "dek"],
        message: `"${a.slug}": the meta description is ${meta.length} characters; verify-site check 26 wants 50 to 160 — give the article a shorter description`,
      });
  });
export type Insight = z.infer<typeof insightSchema>;

export const insightsSchema = z.array(insightSchema).superRefine((list, ctx) => {
  if (!unique(list.map((a) => a.slug))) ctx.addIssue({ code: "custom", message: "two articles share a slug" });
});
