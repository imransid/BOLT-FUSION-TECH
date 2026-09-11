/** Single import surface for the typed /content files. Client components import
 *  this barrel, so it re-exports the site content's TYPES only — never ./site,
 *  which is server-only. */
export * from "./schema";
export type { SiteContent, SectionId } from "./site-schema";
export { projects } from "./projects";
export { metrics } from "./metrics";
export { services } from "./services";
export { lanes, type Lane } from "./architecture";
export { processSteps, doors, type ProcessStep, type Door } from "./process";
export { pilot } from "./pilot";
