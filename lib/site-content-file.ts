import "server-only";

import {
  getContentStore,
  type HistoryEntry,
  type StoredEnvelope,
  type WriteResult,
} from "@/lib/site-content-store";

/**
 * Thin content-persistence facade over the durable store (Neon in production,
 * a local JSON file in dev). Keeps the historical `readSiteContentOverrides`
 * signature so `load-site-content.ts` is unchanged.
 */

/** The stored override object (deep-merged onto defaults at read time). */
export async function readSiteContentOverrides(): Promise<unknown> {
  const { content } = await getContentStore().read();
  return content ?? {};
}

/** Full envelope (version + content) for the admin editor to bootstrap from. */
export async function readSiteContentEnvelope(): Promise<StoredEnvelope> {
  return getContentStore().read();
}

/** Optimistic-concurrency write. Pass the version the editor loaded; null forces. */
export function writeSiteContent(
  content: unknown,
  expectedVersion: number | null,
): Promise<WriteResult> {
  return getContentStore().write(content, expectedVersion);
}

/** Force-write (no version check) — used for seeding/imports. */
export async function writeSiteContentOverrides(data: unknown): Promise<void> {
  await getContentStore().write(data, null);
}

export function readSiteContentHistory(): Promise<HistoryEntry[]> {
  return getContentStore().history();
}
