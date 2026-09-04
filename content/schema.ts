import { z } from "zod";

/**
 * Typed content schemas — PLAN.md §8.
 *
 * "Build every section reading from typed files in /content during the sprint.
 *  Those files become Payload collections in Phase 2."
 *
 * Every schema below is shaped to migrate 1:1 onto a Payload collection:
 *  · a stable `id` is the slug / document key
 *  · media is a path string, which becomes a media-collection relation
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

/* ── team ───────────────────────────────────────────────────────────────────
 * COPY.md §5 requires photo, name, role, stack, years, LinkedIn on every card.
 * Four of those are nullable here because they are genuinely not supplied yet
 * (PLAN.md §9 lists "10 real team photos" as an open prerequisite). Nullable is
 * the honest type: the card renders without them rather than with a fabricated
 * role or a stock face.
 */
export const teamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: pending(z.string().min(1)),
  years: pending(z.string().min(1)),
  stack: z.array(z.string().min(1)),
  /** Path to a REAL photograph. null until one exists — never a template avatar. */
  photo: pending(z.string().min(1)),
  photoAlt: pending(z.string().min(1)),
  /** Public profile used for verification. null when unverified — never guessed. */
  linkedin: pending(z.string().url()),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

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

export const projectSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1)),
    screenshot: pending(z.string().min(1)),
    screenshotAlt: pending(z.string().min(1)),
    /** The technical write-up. COPY.md §4: "Each one has a full technical
     *  write-up, not a screenshot and a sentence." */
    href: pending(z.string().min(1)),
    state: projectStateSchema,
    /** Metric ids shown on the /work row. Relations, not copies. */
    metricIds: z.array(z.string().min(1)),
    /** "summary" = index card only. "nine-part" = a full write-up, and then
     *  every field in caseStudyBodySchema is mandatory. */
    template: z.enum(["summary", "nine-part"]),
    body: caseStudyBodySchema.nullable(),
  })
  .refine((p) => p.template !== "nine-part" || p.body !== null, {
    message:
      "A nine-part case study must supply the full body: problem, constraints, decisions (each with a tradeoff), metricIds, retrospective, shippedAt. Use template 'summary' until it is written.",
    path: ["body"],
  })
  .refine((p) => p.state !== "published" || (p.screenshot !== null && p.href !== null), {
    message:
      "A published project needs both a screenshot and a write-up link. Set state to 'awaiting-asset' instead of shipping an unsubstantiated card.",
    path: ["state"],
  });
export type Project = z.infer<typeof projectSchema>;

/* ── services ───────────────────────────────────────────────────────────── */
export const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shape: z.string().min(1),
  timeline: z.string().min(1),
});
export type Service = z.infer<typeof serviceSchema>;

/* ── faqs ───────────────────────────────────────────────────────────────────
 * Rendered server-side and emitted as FAQPage JSON-LD (PLAN.md §7).
 */
export const faqSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});
export type Faq = z.infer<typeof faqSchema>;

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
