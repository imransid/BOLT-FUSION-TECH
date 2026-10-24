import { parseContent } from "./schema";
import { z } from "zod";

/** COPY.md §3 lanes, verbatim. `cost` is machine output — rendered in mono. */
const laneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  premise: z.string().min(1),
  detail: z.string().min(1),
  cost: z.string().min(1),
  /** Which accent the lane carries. CLAUDE.md: --fast = free/fast path,
   *  --paid = the path that pays for inference. Never decorative. */
  tone: z.enum(["fast", "paid"]),
});
export type Lane = z.infer<typeof laneSchema>;

export const lanes: Lane[] = parseContent(
  z.array(laneSchema),
  [
    {
      id: "keyword",
      name: "Keyword lane",
      premise: "simple intents, no model call.",
      detail:
        "PostgreSQL ILIKE with PostGIS geo filters. Roughly 80% of traffic, under 80ms.",
      cost: "$0 marginal cost",
      tone: "fast",
    },
    {
      id: "ai",
      name: "AI lane",
      premise: "complex intent becomes structured retrieval.",
      detail:
        "Claude Haiku parses intent to JSON, then OpenAI embeddings and pgvector cosine similarity in Postgres. Roughly 20% of traffic, under 1200ms.",
      cost: "~$0.001 per search",
      tone: "paid",
    },
    {
      id: "cache",
      name: "Cache lane",
      premise: "repeat demand disappears at the edge.",
      detail:
        "Redis, 30-second TTL, key is tenant plus query plus geo plus filters plus classification. Under 15ms.",
      // The status is the chip after the figure (content/figure-labels.ts), so
      // the word "target" is not repeated: the page still reads "30–40% hit rate target".
      cost: "30–40% hit rate",
      tone: "fast",
    },
  ],
  "architecture.ts",
);

/**
 * The engineering flow playground (owner's brief, 2026-10-24, §4): the lanes
 * above, each followed by one sample request through the router. The order of
 * operations is the write-up's (content/insights.ts, "Classify first, pay
 * second"): the router classifies with deterministic rules, the lane becomes
 * part of the cache key, the cache is checked, and only on a miss does a lane
 * run — so every request passes the router and the cache, the repeat one too.
 * The sample queries are the case study's own examples. No figure appears in
 * these words: the lanes' figures, with their chips, stay in the lanes.
 */
const playgroundNodeIds = ["request", "router", "cache", "keyword", "intent", "retrieval", "response"] as const;
/* The edges the diagram draws. A scenario's steps must walk along them, in
   order, from the request to the response. */
export const playgroundEdges = [
  ["request", "router"],
  ["router", "cache"],
  ["cache", "response"],
  ["cache", "keyword"],
  ["keyword", "response"],
  ["cache", "intent"],
  ["intent", "retrieval"],
  ["retrieval", "response"],
] as const;

const playgroundSchema = z
  .object({
    title: z.string().min(1),
    lead: z.string().min(1),
    hint: z.string().min(1),
    queryLabel: z.string().min(1),
    nodes: z.array(z.object({ id: z.enum(playgroundNodeIds), label: z.string().min(1), sub: z.string().min(1) })),
    scenarios: z.array(
      z.object({
        lane: z.enum(["keyword", "ai", "cache"]),
        label: z.string().min(1),
        query: z.string().min(1),
        steps: z.array(z.object({ node: z.enum(playgroundNodeIds), text: z.string().min(1) })).min(3),
      }),
    ),
  })
  .superRefine((p, ctx) => {
    const ids = new Set(p.nodes.map((n) => n.id));
    for (const id of playgroundNodeIds) if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `the diagram has no "${id}" node` });
    if (p.nodes.length !== playgroundNodeIds.length) ctx.addIssue({ code: "custom", message: "every diagram node is named exactly once" });
    const edge = new Set(playgroundEdges.map(([a, b]) => `${a}>${b}`));
    for (const lane of lanes) if (p.scenarios.filter((s) => s.lane === lane.id).length !== 1) ctx.addIssue({ code: "custom", message: `the ${lane.name} has no scenario, or more than one` });
    for (const s of p.scenarios) {
      const path = s.steps.map((x) => x.node);
      if (path[0] !== "request" || path.at(-1) !== "response") ctx.addIssue({ code: "custom", message: `${s.label}: a request starts at the request and ends at the response` });
      /* the write-up's order: rules first, then the cache, for every request */
      if (path[1] !== "router" || path[2] !== "cache") ctx.addIssue({ code: "custom", message: `${s.label}: every request is classified, then checked against the cache, before any lane runs` });
      for (let i = 1; i < path.length; i++)
        if (!edge.has(`${path[i - 1]}>${path[i]}`)) ctx.addIssue({ code: "custom", message: `${s.label}: no edge from ${path[i - 1]} to ${path[i]}` });
      const lanePart = s.lane === "cache" ? "response" : s.lane === "keyword" ? "keyword" : "intent";
      if (path[3] !== lanePart) ctx.addIssue({ code: "custom", message: `${s.label}: after the cache, the ${s.lane} request goes to ${lanePart}` });
    }
  });
export type Playground = z.infer<typeof playgroundSchema>;

export const playground: Playground = parseContent(
  playgroundSchema,
  {
    title: "Good engineering makes complexity feel simple.",
    lead: "Follow a request through the system and see how routing, retrieval, and caching work together.",
    hint: "Each lane below follows one sample request through the router. Every request is classified before anything is spent.",
    queryLabel: "Sample query, illustrative",
    nodes: [
      { id: "request", label: "Request", sub: "the visitor's query" },
      { id: "router", label: "Router", sub: "rules, no model" },
      { id: "cache", label: "Cache", sub: "Redis" },
      { id: "keyword", label: "Keyword lane", sub: "ILIKE and PostGIS" },
      { id: "intent", label: "Intent parsing", sub: "Claude Haiku" },
      { id: "retrieval", label: "Retrieval", sub: "pgvector in Postgres" },
      { id: "response", label: "Response", sub: "ranked venues" },
    ],
    scenarios: [
      {
        lane: "keyword",
        label: "A simple search",
        query: "sushi",
        steps: [
          { node: "request", text: "The query arrives with the visitor's location." },
          { node: "router", text: "Deterministic rules read a cuisine: a simple intent. No model is asked." },
          { node: "cache", text: "Redis is checked under the tenant, the query, the location, the filters and the lane. A miss." },
          { node: "keyword", text: "PostgreSQL matches the cuisine and PostGIS keeps the venues nearby." },
          { node: "response", text: "Ranked venues go back, and the result is cached for the next request." },
        ],
      },
      {
        lane: "ai",
        label: "A descriptive search",
        query: "cozy Italian place for date night",
        steps: [
          { node: "request", text: "The query arrives with the visitor's location." },
          { node: "router", text: "The rules find a mood and an occasion that keywords cannot match." },
          { node: "cache", text: "Nothing is stored under this key yet. A miss." },
          { node: "intent", text: "Claude Haiku turns the words into structured intent, as JSON. It never sees the venues." },
          { node: "retrieval", text: "OpenAI embeddings and pgvector cosine similarity rank the venues inside Postgres." },
          { node: "response", text: "Ranked venues go back, and the result is cached." },
        ],
      },
      {
        lane: "cache",
        label: "The same search again",
        query: "sushi",
        steps: [
          { node: "request", text: "The same query, from the same place, while its result is still cached." },
          { node: "router", text: "The same rules give the same lane, and the lane is part of the key." },
          { node: "cache", text: "A hit: the key matches a stored result." },
          { node: "response", text: "The stored result goes back. No database query and no model call." },
        ],
      },
    ],
  },
  "architecture.ts",
);
