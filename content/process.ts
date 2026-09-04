import { parseContent } from "./schema";
import { z } from "zod";

/** COPY.md §6. Genuinely a sequence, so numbering is allowed (CLAUDE.md §Banned). */
const stepSchema = z.object({ id: z.string().min(1), title: z.string().min(1), body: z.string().min(1) });
export type ProcessStep = z.infer<typeof stepSchema>;

export const processSteps: ProcessStep[] = parseContent(
  z.array(stepSchema),
  [
    { id: "discovery", title: "Discovery and plan", body: "We agree on users, success metrics, constraints and risks, then produce a technical approach and milestone plan so everyone knows what “done” means and when." },
    { id: "iterate", title: "Build in iterations", body: "Working software every cycle, with demos, an open backlog, and early integration of auth, data and deployments — so problems surface when they are cheap to fix." },
    { id: "launch", title: "Launch and operate", body: "Release with monitoring, runbooks and a sensible cutover. We support stabilisation after go-live and hand the system over properly." },
  ],
  "process.ts",
);

/** COPY.md §8. */
const doorSchema = z.object({ id: z.string().min(1), audience: z.string().min(1), leadsTo: z.string().min(1), href: z.string().min(1) });
export type Door = z.infer<typeof doorSchema>;

export const doors: Door[] = parseContent(
  z.array(doorSchema),
  [
    { id: "engineers", audience: "For engineers", leadsTo: "the full architecture write-up", href: "#architecture" },
    { id: "finance", audience: "For finance", leadsTo: "pricing, engagement models and pilot terms", href: "#how-we-work" },
    { id: "procurement", audience: "For procurement", leadsTo: "IP assignment, NDA, security practices and handover", href: "#objections" },
  ],
  "process.ts",
);
