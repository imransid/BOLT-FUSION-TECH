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
      cost: "30–40% hit rate target",
      tone: "fast",
    },
  ],
  "architecture.ts",
);
