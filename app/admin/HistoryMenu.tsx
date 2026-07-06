"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import type { SiteContent } from "@/lib/site-content-schema";
import { listHistory, restoreVersion, type HistoryItem } from "./actions";

/** Compact version-history dropdown: list recent snapshots and restore one. */
export function HistoryMenu({ version }: { version: number }) {
  const { reset, getValues } = useFormContext<SiteContent>();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !items) {
      setBusy(true);
      setError(null);
      try {
        setItems(await listHistory());
      } catch {
        setError("Could not load history.");
      } finally {
        setBusy(false);
      }
    }
  }

  async function restore(item: HistoryItem) {
    if (
      !window.confirm(
        `Restore version ${item.version}? This replaces the live content and discards any unsaved edits.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await restoreVersion(null, {
      content: item.content,
      expectedVersion: version,
    });
    setBusy(false);
    if (result?.ok) {
      // Clear dirty state so the reload doesn't trigger a second "unsaved
      // changes" browser prompt (the restore already confirmed intent).
      reset(getValues());
      window.location.reload();
    } else {
      setError(result?.error ?? "Restore failed.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        className="rounded-lg border border-white/12 px-3 py-2 text-sm text-white/75 hover:border-white/25"
      >
        History
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-white/12 bg-[#0c0c0f] p-3 shadow-2xl">
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/40">
            Recent versions
          </p>
          {busy && <p className="px-1 py-2 text-sm text-white/50">Working…</p>}
          {error && (
            <p className="rounded-lg border border-red-300/30 bg-red-500/10 px-2 py-1.5 text-[13px] text-red-100/90">
              {error}
            </p>
          )}
          {items && items.length === 0 && (
            <p className="px-1 py-2 text-[13px] text-white/40">No previous versions yet.</p>
          )}
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {items?.map((item) => (
              <li
                key={item.version}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/40 px-2.5 py-2"
              >
                <span className="min-w-0 truncate text-[13px] text-white/70">
                  v{item.version}
                  <span className="ml-2 text-white/35">
                    {new Date(item.updatedAt).toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void restore(item)}
                  disabled={busy}
                  className="shrink-0 rounded border border-cyan-200/25 px-2 py-1 text-xs text-cyan-100/80 hover:border-cyan-100/50 disabled:opacity-40"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
