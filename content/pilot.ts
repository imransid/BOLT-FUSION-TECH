import { parseContent } from "./schema";
import { z } from "zod";

/**
 * COPY.md §7 — the pilot, rendered on /about (moved off the homepage on
 * 2026-09-16; $SP/engineering/MOVES.md). `title` and `body` are §7's approved
 * H2 and body, word for word.
 *
 * `price` is null. COPY.md's own header: "Placeholders in {{ }} need a decision
 * before build. Do not invent values for them." §7 still reads {{ pilot price }},
 * and PLAN.md §12 lists the pilot price as the one number that must come from the
 * owner. /about renders every other part and no price, rather than inventing a
 * figure the business would then be held to.
 */
const pilotSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  weeks: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), body: z.string().min(1) })),
  deliverable: z.string().min(1),
  price: z.string().nullable(),
});

export const pilot = parseContent(
  pilotSchema,
  {
    title: "Two weeks. Fixed price. Full IP. No obligation.",
    body: "A scoped slice of your real product, not a demo. You keep everything whether you continue or not.",
    weeks: [
      { id: "w1", label: "Week 1", body: "architecture and a working vertical slice" },
      { id: "w2", label: "Week 2", body: "iterate, harden, and write the handover document" },
    ],
    deliverable: "Running code in your repository, on your infrastructure, with a handover doc.",
    price: null,
  },
  "pilot.ts",
);
