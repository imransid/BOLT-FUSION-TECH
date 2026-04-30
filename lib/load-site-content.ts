import "server-only";

import { defaultSiteContent } from "@/lib/default-site-content";
import { deepMerge } from "@/lib/deep-merge";
import { readSiteContentOverrides } from "@/lib/site-content-file";
import { siteContentSchema, type SectionId, sectionIds } from "@/lib/site-content-schema";

const validSectionIds = new Set<string>(sectionIds);

function isSectionId(id: string): id is SectionId {
  return validSectionIds.has(id);
}

function normalizeSectionOrder(order: SectionId[]): SectionId[] {
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

export async function loadSiteContent() {
  const overrides = await readSiteContentOverrides();
  const merged = deepMerge(defaultSiteContent, overrides);
  const parsed = siteContentSchema.parse(merged);
  parsed.site.sectionOrder = normalizeSectionOrder(parsed.site.sectionOrder);
  return parsed;
}

export type LoadedSiteContent = Awaited<ReturnType<typeof loadSiteContent>>;
