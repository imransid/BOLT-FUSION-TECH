import { projects } from "@/content/projects";

/**
 * Where a linked project is shown, by its id in content/projects.ts: a case
 * study's write-up, or its section on /work. Feature work says so in its name —
 * it is features in another company's app, never the app (CLAUDE.md, "Projects
 * and attribution"). An unknown id throws, which fails the build.
 */
export function workLink(slug: string): { id: string; name: string; href: string } {
  const p = projects.find((x) => x.id === slug);
  if (!p) throw new Error(`"${slug}" is linked as work, and is not a project in content/projects.ts`);
  if (p.state !== "published") throw new Error(`"${slug}" is linked as work, and is ${p.state} in content/projects.ts`);
  const href = p.kind === "case-study" && p.href ? p.href : `/work#${p.kind === "in-house" ? "in-house" : "projects"}`;
  return { id: p.id, name: p.scope === "features" ? `${p.name} (feature work)` : p.name, href };
}
