import type { Capability } from "@/content/engineering-schema";
import { projects } from "@/content/projects";

/**
 * Where a linked project is shown, by its id in content/projects.ts: a case
 * study's write-up, or — since 2026-09-29, when every card on /work took its
 * project's id — its own card there (`/work#balanzify`); it was the card's
 * section (`/work#projects`). Feature work says so in its name — it is
 * features in another company's app, never the app (CLAUDE.md, "Projects and
 * attribution"). An unknown id throws, which fails the build.
 */
export function workLink(slug: string): { id: string; name: string; href: string } {
  const p = projects.find((x) => x.id === slug);
  if (!p) throw new Error(`"${slug}" is linked as work, and is not a project in content/projects.ts`);
  if (p.state !== "published") throw new Error(`"${slug}" is linked as work, and is ${p.state} in content/projects.ts`);
  const href = p.kind === "case-study" && p.href ? p.href : `/work#${p.id}`;
  return { id: p.id, name: p.scope === "features" ? `${p.name} (feature work)` : p.name, href };
}

/** The "Linked work" label over a capability's linked work: it names the tier
 *  the work evidences when that is not the first tier (`workScope`, 2026-09-29,
 *  the honesty review) — POS's reads "Linked work (online and wholesale
 *  commerce)", so a store and a wholesale portal beside a till diagram do not
 *  read as the delivered point of sale. */
export function workLabel(c: Pick<Capability, "workScope">): string {
  return c.workScope ? `Linked work (${c.workScope.charAt(0).toLowerCase()}${c.workScope.slice(1)})` : "Linked work";
}
