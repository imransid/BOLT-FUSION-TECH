"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/require-admin";
import { normalizeSectionOrder } from "@/lib/load-site-content";
import { siteContentSchema } from "@/lib/site-content-schema";
import {
  readSiteContentHistory,
  writeSiteContent,
} from "@/lib/site-content-file";
import { defaultSiteContent } from "@/lib/default-site-content";
import { deepMerge } from "@/lib/deep-merge";

export type SaveState =
  | { ok: true; version: number; savedAt: string }
  | { ok: false; error: string; details?: unknown; conflict?: boolean }
  | null;

export type SavePayload = { content: unknown; version: number | null };

/**
 * Persist the whole content document with optimistic concurrency, then make
 * the change visible immediately (revalidate). Auth + same-origin are
 * re-checked here — Server Actions are POSTs and must not trust the proxy.
 */
export async function saveSiteContent(
  _prev: SaveState,
  payload: SavePayload,
): Promise<SaveState> {
  await requireAdminAction();

  const parsed = siteContentSchema.safeParse(payload?.content);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", details: parsed.error.flatten() };
  }
  parsed.data.site.sectionOrder = normalizeSectionOrder(parsed.data.site.sectionOrder);

  const result = await writeSiteContent(parsed.data, payload.version ?? null);
  if (!result.ok) {
    return {
      ok: false,
      conflict: true,
      error: "A newer version was saved elsewhere. Reload to get the latest, then reapply your edits.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, version: result.version, savedAt: new Date().toISOString() };
}

export type HistoryItem = { version: number; updatedAt: string; content: unknown };

/** Version history (most recent first) for the restore UI. */
export async function listHistory(): Promise<HistoryItem[]> {
  await requireAdminAction();
  return readSiteContentHistory();
}

/**
 * Restore a snapshot: merge it onto current defaults, re-validate, and write it
 * as the new published version (CAS against `expectedVersion`).
 */
export async function restoreVersion(
  _prev: SaveState,
  payload: { content: unknown; expectedVersion: number | null },
): Promise<SaveState> {
  await requireAdminAction();

  const merged = deepMerge(defaultSiteContent, payload.content);
  const parsed = siteContentSchema.safeParse(merged);
  if (!parsed.success) {
    return { ok: false, error: "Snapshot is no longer valid against the schema." };
  }
  parsed.data.site.sectionOrder = normalizeSectionOrder(parsed.data.site.sectionOrder);

  const result = await writeSiteContent(parsed.data, payload.expectedVersion ?? null);
  if (!result.ok) {
    return { ok: false, conflict: true, error: "Version changed. Reload and try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, version: result.version, savedAt: new Date().toISOString() };
}
