/**
 * The canonical company description — word for word wherever the company is
 * described: the meta and og descriptions (content/site.ts and app/layout.tsx),
 * the share image and its alt text (app/opengraph-image.tsx), Organization
 * JSON-LD (lib/structured-data.ts), public/llms.txt and public/llms-full.txt,
 * and COPY.md, "Company description — canonical". verify-site check 12 takes
 * the first sentence of the Organization description and fails any of those
 * places that does not carry it.
 *
 * Changed by the owner on 2026-09-16 with the engineering redesign. It was
 * "We build AI systems that are still running in six months." (SPEC §1).
 *
 * A plain module — no schema, no "server-only" — so the share image, the
 * layout, the structured data and the content files can all import the one
 * string.
 */
export const CANONICAL_DESCRIPTION =
  "We engineer intelligent software, business systems, automation, and connected technologies — from idea to production.";

/** The sentence that follows it in the meta description and the Organization description. */
export const COMPANY_LINE = "Bolt Fusion Tech is a senior engineering team working across the UK, Malaysia and Bangladesh.";
