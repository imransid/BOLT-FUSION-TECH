import { z } from "zod";

import { figureLabels } from "./figure-labels";
import { metrics } from "./metrics";
import { projects } from "./projects";

/**
 * The schema for content/engineering.ts — the engineering company's content
 * (owner's redesign, 2026-09-16; SPEC §§4–5): the six capabilities, the
 * industries, the How We Build stages, the technical-depth layers and the
 * system map, with each section's heading.
 *
 * ONE SOURCE for every page that shows them: the homepage renders summaries;
 * /capabilities, /industries and /engineering (the next wave) render the SAME
 * entries in depth. So each capability carries its depth fields — body, what
 * we build, how we approach it, its evidence tier with a note, the work it
 * links to and its diagram — even where the homepage shows only part.
 *
 * What the build refuses, so no page can say it:
 *  · a figure (a number with a unit, %, a currency, ~ < > or ×) anywhere in this
 *    content that content/figure-labels.ts does not label or exempt;
 *  · linked work that is not a published project in content/projects.ts, or a
 *    track-record project (an engineer's work at another employer is never our
 *    evidence), and a metric that is not in content/metrics.ts;
 *  · a Lab capability without its honesty line, or a Lab diagram whose caption
 *    does not say "Concept";
 *  · a system-map link or flow that touches robotics without being marked a
 *    concept, and any link, flow step or capability id that does not exist.
 */

/* ── the evidence tiers (CLAUDE.md, "Evidence tiers"; SPEC §0.1) ────────────
   A THIRD visual family on the page: never the shipped/target chips of a
   figure, never their colours, and never `data-status` (check 8 reads that as
   a figure's label). */
export const evidenceTiers = ["proven", "core", "capable", "lab"] as const;
export const evidenceTierSchema = z.enum(evidenceTiers);
export type EvidenceTier = z.infer<typeof evidenceTierSchema>;

export const TIER_LABEL: Record<EvidenceTier, string> = {
  proven: "Proven",
  core: "Core",
  capable: "Capable",
  lab: "Lab",
};

/** What each tier means, in the words the site uses wherever a tier is explained. */
export const TIER_MEANING: Record<EvidenceTier, string> = {
  proven: "Shipped, with a case study or project",
  core: "Repeated work",
  capable: "We can engineer it; no delivery yet",
  lab: "Research or prototype only",
};

/** How full the tier chip's meter is: four steps, from Lab to Proven. */
export const TIER_LEVEL: Record<EvidenceTier, 1 | 2 | 3 | 4> = { proven: 4, core: 3, capable: 2, lab: 1 };

export const capabilityIds = ["software", "ai", "erp", "pos", "robotics", "cloud"] as const;
export const capabilityIdSchema = z.enum(capabilityIds);
export type CapabilityId = z.infer<typeof capabilityIdSchema>;

/** Each capability's own diagram (components/site/diagrams). */
export const diagramIds = ["layered-stack", "ai-router", "module-ring", "till-hub", "machine-loop", "release-pipeline"] as const;
export const diagramIdSchema = z.enum(diagramIds);
export type DiagramId = z.infer<typeof diagramIdSchema>;

const DANGEROUS_SCHEME = /^\s*(?:javascript|vbscript|data|file):/i;
const text = (what: string) => z.string().refine((v) => v.trim().length > 0, { message: `${what} is empty` });
const href = z
  .string()
  .min(1)
  .refine((v) => !DANGEROUS_SCHEME.test(v), { message: "Unsafe URL scheme" });

/* ── figures ────────────────────────────────────────────────────────────────
   The same idea as verify-site check 8, at build time: a number carrying a unit,
   %, a currency, an approximation or bound, or a multiplier is a figure, and a
   figure is shown only inside an entry of content/figure-labels.ts (which
   <FigureText> renders with its chip or its exemption). Names with digits
   (GPT-4.1) and bare ordinals are not figures. */
const FIGURE =
  /(?:[~≈<>≤≥]\s?)?[$£€]?\d+(?:[.,]\d+)*(?:\s?[-–]\s?\d+(?:[.,]\d+)*)?(?:\s?(?:%|×)|\s?(?:ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)\b|[xX]\b)|[~≈<>≤≥]\s?[$£€]?\d|[$£€]\s?\d/g;

function unlabelledFigures(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(FIGURE)) {
    const at = m.index ?? 0;
    const end = at + m[0].length;
    const covered = figureLabels.some((l) => {
      for (let i = s.indexOf(l.text); i >= 0; i = s.indexOf(l.text, i + 1)) if (i <= at && i + l.text.length >= end) return true;
      return false;
    });
    /* a digit glued to a letter is part of a name (GPT-4.1, S3) */
    const named = /\p{L}[-‐‑]?$/u.test(s.slice(Math.max(0, at - 2), at));
    if (!covered && !named) out.push(m[0]);
  }
  return out;
}

/** Walks every string in the parsed content and reports each unlabelled figure with its path. */
export function checkFigures(value: unknown, ctx: z.RefinementCtx, path: (string | number)[] = []) {
  if (typeof value === "string") {
    for (const f of unlabelledFigures(value))
      ctx.addIssue({
        code: "custom",
        path,
        message: `"${f}" is a figure with no label: add its shipped/target label (with a source) or a per-instance exemption to content/figure-labels.ts, or take the figure out`,
      });
  } else if (Array.isArray(value)) value.forEach((v, i) => checkFigures(v, ctx, [...path, i]));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) checkFigures(v, ctx, [...path, k]);
}

/* ── capabilities ─────────────────────────────────────────────────────────── */

const buildItemSchema = z.strictObject({
  label: text("a build item"),
  /** Set only where this item's evidence differs from the capability's own
   *  (AI's document intelligence is Capable inside a Proven capability). */
  tier: evidenceTierSchema.optional(),
});

const evidenceSchema = z.strictObject({
  tier: evidenceTierSchema,
  /** What this tier covers when a capability carries more than one ("HR and payroll"). */
  scope: text("scope").optional(),
});

const ctaSchema = z.strictObject({ label: text("a call to action"), href });

export const capabilitySchema = z
  .strictObject({
    id: capabilityIdSchema,
    /** The domain's name, as the index and the navigation of /capabilities give it. */
    name: text("name"),
    /** One line on the domain's job, for the "What we engineer" index. */
    job: text("job"),
    /** The section's H2. */
    title: text("title"),
    body: text("body"),
    /** The heading over `whatWeBuild`: "What we build", or the SPEC's own words where it gives some. */
    buildHeading: text("buildHeading"),
    /** One line under the heading, where what is built and what is planned needs saying in words (POS, SPEC §8b.6). */
    buildNote: text("buildNote").optional(),
    whatWeBuild: z.array(buildItemSchema).min(1),
    /** How we approach it: the working principles for this domain (for /capabilities). */
    approach: z.array(text("an approach line")).min(1),
    /** The tiers, headline first. A capability evidenced only in part says which part. */
    evidence: z.array(evidenceSchema).min(1),
    /** The evidence in words — exactly as strong as the tier, no stronger. */
    evidenceNote: text("evidenceNote"),
    /** Published projects in content/projects.ts that back the evidence (by id). */
    workSlugs: z.array(text("a work slug")),
    /** The scope of the tier the linked work evidences, when it is not the
     *  first tier's (2026-09-29, the honesty review): POS's linked work is its
     *  online and wholesale commerce, beside a till tagline and a till
     *  diagram, and read as the delivered point of sale. The "Linked work"
     *  label then names it. One of the capability's other tiers' scopes. */
    workScope: text("workScope").optional(),
    /** Figures that back it, from content/metrics.ts (by id), each shown with its own chip. */
    metricIds: z.array(text("a metric id")).default([]),
    /** Required, verbatim in spirit, on a Lab capability. */
    honesty: text("honesty").optional(),
    diagram: z.strictObject({
      id: diagramIdSchema,
      /** The diagram's accessible name (its <title>). */
      title: text("diagram title"),
      /** What the diagram shows, in one sentence (its <desc>). */
      description: text("diagram description"),
      /** A visible caption. Required on a Lab capability, and it must say "Concept". */
      caption: text("caption").optional(),
    }),
    cta: ctaSchema,
  })
  .superRefine((c, ctx) => {
    const lab = c.evidence.some((e) => e.tier === "lab");
    if (lab && !c.honesty)
      ctx.addIssue({ code: "custom", path: ["honesty"], message: `"${c.name}" is Lab: it carries its honesty line — what it is today, in plain words` });
    if (lab && !/concept/i.test(c.diagram.caption ?? ""))
      ctx.addIssue({ code: "custom", path: ["diagram", "caption"], message: `"${c.name}" is Lab: its diagram is captioned as a concept ("Concept — not a shipped system")` });
    if (c.evidence.length > 1 && c.evidence.some((e) => !e.scope))
      ctx.addIssue({ code: "custom", path: ["evidence"], message: `"${c.name}" carries more than one tier: each says what it covers (scope)` });
    c.workSlugs.forEach((slug, i) => {
      const p = projects.find((x) => x.id === slug);
      if (!p) ctx.addIssue({ code: "custom", path: ["workSlugs", i], message: `"${slug}" is not a project in content/projects.ts` });
      else if (p.state !== "published") ctx.addIssue({ code: "custom", path: ["workSlugs", i], message: `"${slug}" is not published: unpublished work is not evidence` });
      else if (p.kind === "track-record")
        ctx.addIssue({ code: "custom", path: ["workSlugs", i], message: `"${slug}" is an engineer's track record at another employer — never Bolt Fusion's evidence` });
    });
    c.metricIds.forEach((id, i) => {
      if (!metrics.some((m) => m.id === id)) ctx.addIssue({ code: "custom", path: ["metricIds", i], message: `"${id}" is not a metric in content/metrics.ts` });
    });
    if (c.workScope !== undefined && !c.evidence.slice(1).some((e) => e.scope === c.workScope))
      ctx.addIssue({
        code: "custom",
        path: ["workScope"],
        message: `"${c.name}": workScope "${c.workScope}" is not the scope of one of its later tiers (${c.evidence.slice(1).map((e) => `"${e.scope}"`).join(", ") || "it has none"}) — the first tier's work needs no scope`,
      });
    if (c.evidence[0].tier === "lab" && c.workSlugs.length)
      ctx.addIssue({ code: "custom", path: ["workSlugs"], message: `"${c.name}" is Lab: there is no delivered work to link` });
  });
export type Capability = z.infer<typeof capabilitySchema>;

/* ── industries ───────────────────────────────────────────────────────────── */

const industryEvidenceSchema = z.strictObject({
  label: text("an evidence label"),
  /** An internal link to where it is shown: a write-up, /work, or a capability. */
  href: href.refine((v) => v.startsWith("/") || v.startsWith("#"), { message: "evidence links point inside the site" }),
  /** The project it is, when it is one (content/projects.ts id). */
  workSlug: text("workSlug").optional(),
});

export const industrySchema = z
  .strictObject({
    id: z.string().regex(/^[a-z][a-z-]*$/),
    name: text("name"),
    /** The problems a business in this industry brings (for /industries). */
    problems: z.array(text("a problem")).min(1),
    /** What we'd build for it. */
    wouldBuild: z.array(text("a build")).min(1),
    /** The capabilities this industry draws on. */
    capabilityIds: z.array(capabilityIdSchema).min(1),
    /** Where we've built it — ONLY where delivered evidence exists (SPEC §5). Empty means "what we'd build" only. */
    evidence: z.array(industryEvidenceSchema).default([]),
    /** A plain line beside the evidence: work in progress, never a delivery ("Retail point of sale in development."). */
    note: text("note").optional(),
  })
  .superRefine((ind, ctx) => {
    ind.evidence.forEach((e, i) => {
      if (!e.workSlug) return;
      const p = projects.find((x) => x.id === e.workSlug);
      if (!p || p.state !== "published" || p.kind === "track-record")
        ctx.addIssue({ code: "custom", path: ["evidence", i, "workSlug"], message: `"${e.workSlug}" is not published Bolt Fusion work in content/projects.ts` });
    });
  });
export type Industry = z.infer<typeof industrySchema>;

/* ── how we build: a real sequence, so it is numbered ─────────────────────── */

export const stageSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  title: text("title"),
  /** What happens in the stage, in a sentence: the selected stage's detail
   *  in how we build (2026-10-24). */
  does: text("does"),
  /** What the client gets from the stage — the deliverable. */
  gets: text("gets"),
});
export type Stage = z.infer<typeof stageSchema>;

/* ── technical depth, by layer: only what the repos and portfolio show ────── */

/** SPEC §5: no Kubernetes, Kafka or RabbitMQ unless the owner confirms them. */
const UNCONFIRMED = /\b(kubernetes|k8s|kafka|rabbitmq)\b/i;

export const depthLayerSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  name: text("name"),
  items: z
    .array(text("an item"))
    .min(1)
    .refine((items) => !items.some((i) => UNCONFIRMED.test(i)), { message: "Kubernetes, Kafka and RabbitMQ are not on the list until the owner confirms them (SPEC §5)" }),
});
export type DepthLayer = z.infer<typeof depthLayerSchema>;

/* ── the system map ───────────────────────────────────────────────────────── */

export const mapNodeSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  label: text("label"),
  /** One line on the node, shown in the list and in the readout. */
  short: text("short"),
  /** Position on the map's 1000 x 560 grid (the node's centre). */
  x: z.number().min(60).max(940),
  y: z.number().min(50).max(510),
  /** Where this node's work is described on the page. */
  capabilityIds: z.array(capabilityIdSchema).default([]),
  /** A node whose work is research and prototype only (robotics). */
  concept: z.boolean().default(false),
});

export const mapLinkSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  from: text("from"),
  to: text("to"),
  /** One line on what the connection does. */
  does: text("does"),
  concept: z.boolean().default(false),
});

export const mapFlowSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z-]*$/),
  title: text("title"),
  steps: z.array(z.strictObject({ node: text("node"), text: text("step") })).min(2),
  /** The links the flow travels, in order. */
  links: z.array(text("a link id")).min(1),
  concept: z.boolean().default(false),
});

export const systemMapSchema = z
  .strictObject({
    nodes: z.array(mapNodeSchema).min(2),
    links: z.array(mapLinkSchema).min(1),
    flows: z.array(mapFlowSchema).default([]),
  })
  .superRefine((m, ctx) => {
    const node = new Map(m.nodes.map((n) => [n.id, n]));
    const link = new Map(m.links.map((l) => [l.id, l]));
    if (node.size !== m.nodes.length) ctx.addIssue({ code: "custom", path: ["nodes"], message: "node ids repeat" });
    if (link.size !== m.links.length) ctx.addIssue({ code: "custom", path: ["links"], message: "link ids repeat" });
    m.links.forEach((l, i) => {
      for (const end of ["from", "to"] as const)
        if (!node.has(l[end])) ctx.addIssue({ code: "custom", path: ["links", i, end], message: `no node "${l[end]}"` });
      const touchesConcept = node.get(l.from)?.concept || node.get(l.to)?.concept;
      if (touchesConcept && !l.concept)
        ctx.addIssue({ code: "custom", path: ["links", i, "concept"], message: `"${l.id}" touches a concept node (robotics): mark it concept` });
    });
    m.flows.forEach((f, i) => {
      f.steps.forEach((s, j) => {
        if (!node.has(s.node)) ctx.addIssue({ code: "custom", path: ["flows", i, "steps", j, "node"], message: `no node "${s.node}"` });
      });
      f.links.forEach((id, j) => {
        if (!link.has(id)) ctx.addIssue({ code: "custom", path: ["flows", i, "links", j], message: `no link "${id}"` });
      });
      const concept = f.steps.some((s) => node.get(s.node)?.concept) || f.links.some((id) => link.get(id)?.concept);
      if (concept && !f.concept)
        ctx.addIssue({ code: "custom", path: ["flows", i, "concept"], message: `"${f.title}" runs through a concept: label it "Concept"` });
    });
  });
export type SystemMap = z.infer<typeof systemMapSchema>;
export type MapNode = SystemMap["nodes"][number];
export type MapLink = SystemMap["links"][number];
export type MapFlow = SystemMap["flows"][number];

/* ── the sections' headings ───────────────────────────────────────────────── */

const headingSchema = z.strictObject({
  /** A short line above the H2 naming the section. */
  eyebrow: text("eyebrow"),
  title: text("title"),
  lead: text("lead").optional(),
});
export type SectionHeading = z.infer<typeof headingSchema>;

export const engineeringSchema = z
  .strictObject({
    /* No heading for the capabilities as a group: each capability is its own
       section with its own H2 (SPEC §5), and the index above them introduces
       the six. */
    headings: z.strictObject({
      whatWeEngineer: headingSchema,
      systemMap: headingSchema,
      /** The compact map on the homepage, in what we engineer (2026-10-24). */
      systemMapHome: headingSchema,
      industries: headingSchema,
      howWeBuild: headingSchema,
      depth: headingSchema,
    }),
    capabilities: z.array(capabilitySchema),
    industries: z.array(industrySchema).min(1),
    stages: z.array(stageSchema).min(1),
    depth: z.array(depthLayerSchema).min(1),
    systemMap: systemMapSchema,
  })
  .superRefine((e, ctx) => {
    /* the six, in SPEC order, once each */
    const ids = e.capabilities.map((c) => c.id);
    if (ids.length !== capabilityIds.length || ids.some((id, i) => id !== capabilityIds[i]))
      ctx.addIssue({ code: "custom", path: ["capabilities"], message: `the capabilities are the six, in order: ${capabilityIds.join(", ")}` });
    const nodeCaps = new Set(e.systemMap.nodes.flatMap((n) => n.capabilityIds));
    for (const id of capabilityIds)
      if (!nodeCaps.has(id)) ctx.addIssue({ code: "custom", path: ["systemMap", "nodes"], message: `no node on the system map covers the "${id}" capability` });
    const industryIds = new Set<string>();
    e.industries.forEach((ind, i) => {
      if (industryIds.has(ind.id)) ctx.addIssue({ code: "custom", path: ["industries", i, "id"], message: `industry "${ind.id}" is listed twice` });
      industryIds.add(ind.id);
    });
    checkFigures(e, ctx);
  });
export type EngineeringContent = z.infer<typeof engineeringSchema>;
/** What content/engineering.ts writes: defaults (metricIds, evidence, concept) may be left out. */
export type EngineeringInput = z.input<typeof engineeringSchema>;
