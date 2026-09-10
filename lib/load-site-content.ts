import "server-only";

import { cache } from "react";

import { defaultSiteContent } from "@/lib/default-site-content";
import { deepMerge } from "@/lib/deep-merge";
import { readSiteContentEnvelope, readSiteContentOverrides } from "@/lib/site-content-file";
import {
  siteContentSchema,
  type SectionId,
  type SiteContent,
  sectionIds,
} from "@/lib/site-content-schema";

const validSectionIds = new Set<string>(sectionIds);

function isSectionId(id: string): id is SectionId {
  return validSectionIds.has(id);
}

export function normalizeSectionOrder(order: SectionId[]): SectionId[] {
  const seen = new Set<SectionId>();
  const out: SectionId[] = [];
  for (const id of order) {
    if (isSectionId(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of sectionIds) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

/**
 * Shape migrations for a STORED document written before a field became
 * required. Each derives the new field from what the document already says and
 * never invents content. Without them, a stored document missing a newly
 * required field fails validation and safeBuild serves the code defaults for
 * the whole site, hiding every admin edit without a word.
 */
function migrateStored(merged: Record<string, unknown>): void {
  // recentWorks.items[].state — added with the published-project gate. A card
  // with a link was presented as published; a card without one was quietly
  // linked to #contact, which is what the gate now refuses.
  const rw = merged.recentWorks as { items?: unknown } | undefined;
  if (rw && Array.isArray(rw.items)) {
    merged.recentWorks = {
      ...rw,
      items: rw.items.map((it) =>
        it && typeof it === "object" && !("state" in it)
          ? { ...it, state: (it as { href?: unknown }).href ? "published" : "awaiting-asset" }
          : it,
      ),
    };
  }
}

function buildContent(overrides: unknown): SiteContent {
  const merged = deepMerge(defaultSiteContent, overrides) as Record<string, unknown>;
  migrateStored(merged);
  // Sanitize sectionOrder BEFORE parse: a removed/renamed section id (no longer
  // in the enum) would otherwise throw at parse instead of being dropped.
  const site = merged.site as { sectionOrder?: unknown } | undefined;
  if (site && Array.isArray(site.sectionOrder)) {
    site.sectionOrder = normalizeSectionOrder(site.sectionOrder as SectionId[]);
  }
  const parsed = siteContentSchema.parse(merged);
  parsed.site.sectionOrder = normalizeSectionOrder(parsed.site.sectionOrder);
  return parsed;
}

/**
 * Resilient build: if a stored document fails validation (e.g. a required field
 * was later added to an array-element schema), fall back to defaults instead of
 * 500-ing both the public page AND the admin that would repair it.
 */
function safeBuild(overrides: unknown): SiteContent {
  try {
    return buildContent(overrides);
  } catch (err) {
    console.error("[site-content] stored document failed validation; serving defaults.", err);
    return buildContent({});
  }
}

/** Fresh read (store → merge → validate). Use in the admin so edits are never stale. */
export async function loadSiteContent(): Promise<SiteContent> {
  return safeBuild(await readSiteContentOverrides());
}

/**
 * Single-read admin bootstrap: content AND version from ONE envelope read, so
 * the optimistic-concurrency baseline always matches the content shown (avoids
 * a lost update if a save commits between two separate reads).
 */
export async function loadAdminContent(): Promise<{ content: SiteContent; version: number }> {
  const env = await readSiteContentEnvelope();
  return { content: safeBuild(env.content), version: env.version };
}

/**
 * Cached public getter for the page. React.cache dedupes the two call sites
 * (generateMetadata + Home) into one datastore read per render; ISR
 * (`revalidate = 60`) caches the render itself, and the admin save calls
 * `revalidatePath('/')` for an immediate refresh.
 */
export const getSiteContent = cache(loadSiteContent);

export type LoadedSiteContent = Awaited<ReturnType<typeof loadSiteContent>>;
