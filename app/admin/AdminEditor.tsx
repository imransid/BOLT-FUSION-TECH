"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  type DefaultValues,
  type FieldErrors,
} from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";

import {
  siteContentSchema,
  type SectionId,
  type SiteContent,
} from "@/lib/site-content-schema";
import { saveSiteContent, type SaveState } from "./actions";
import { HistoryMenu } from "./HistoryMenu";
import { SECTION_TABS } from "./sections";

function humanizeSection(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Reorder + show/hide the public page sections (drives site.sectionOrder/Visibility). */
function LayoutPanel() {
  const { watch, setValue } = useFormContext<SiteContent>();
  const order = (watch("site.sectionOrder") ?? []) as SectionId[];
  const visibility = (watch("site.sectionVisibility") ?? {}) as Record<string, boolean>;

  function moveSection(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setValue("site.sectionOrder", next, { shouldDirty: true });
  }

  function toggle(id: SectionId, on: boolean) {
    const next = { ...visibility };
    if (on) delete next[id];
    else next[id] = false;
    setValue("site.sectionVisibility", next, { shouldDirty: true });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/40">Order & visibility</p>
      <p className="mb-3 text-[11px] leading-relaxed text-white/40">
        Reorder and show/hide sections on the public homepage.
      </p>
      <ul className="max-h-[46vh] space-y-1 overflow-y-auto pr-1">
        {order.map((id, i) => {
          const hidden = visibility[id] === false;
          return (
            <li
              key={id}
              className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/40 px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/70">
                {humanizeSection(id)}
              </span>
              <button
                type="button"
                aria-label="Move up"
                onClick={() => moveSection(i, -1)}
                disabled={i === 0}
                className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-white/55 hover:border-white/25 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                onClick={() => moveSection(i, 1)}
                disabled={i === order.length - 1}
                className="rounded border border-white/10 px-1.5 py-0.5 text-xs text-white/55 hover:border-white/25 disabled:opacity-30"
              >
                ↓
              </button>
              <label className="ml-1 flex items-center gap-1 text-[11px] text-white/45">
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={(e) => toggle(id, e.target.checked)}
                  className="accent-cyan-300"
                />
                on
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminEditor({
  initial,
  version: initialVersion,
  durable,
}: {
  initial: SiteContent;
  version: number;
  durable: boolean;
}) {
  const methods = useForm<SiteContent>({
    defaultValues: initial as DefaultValues<SiteContent>,
    resolver: standardSchemaResolver(siteContentSchema),
    mode: "onBlur",
  });

  const [activeKey, setActiveKey] = useState<string>(SECTION_TABS[0]!.key);
  const [saveState, save, saving] = useActionState<SaveState, { content: SiteContent; version: number }>(
    (prev, payload) => saveSiteContent(prev, payload),
    null,
  );
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);

  // CAS baseline for the next save: last successful version, kept in a ref so a
  // failed save (e.g. a 409) never reverts it to the stale page-load version.
  const versionRef = useRef(initialVersion);
  // Cosmetic label only.
  const version = saveState?.ok ? saveState.version : initialVersion;
  const isDirty = methods.formState.isDirty;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (methods.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [methods]);

  // On successful save: advance the CAS version and clear the dirty baseline.
  // (Fields are disabled while saving, so getValues() equals what was sent.)
  useEffect(() => {
    if (saveState?.ok) {
      versionRef.current = saveState.version;
      methods.reset(methods.getValues());
    }
  }, [saveState, methods]);

  function onInvalid(errors: FieldErrors<SiteContent>) {
    const branches = Object.keys(errors).map(humanizeSection);
    setInvalidMsg(
      branches.length
        ? `Some fields are invalid — check: ${branches.join(", ")}`
        : "Some fields are invalid.",
    );
  }
  // handleSubmit is invoked here (event time), so the ref is read on submit only.
  function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void methods.handleSubmit((values) => {
      setInvalidMsg(null);
      save({ content: values, version: versionRef.current });
    }, onInvalid)();
  }

  const Active = SECTION_TABS.find((t) => t.key === activeKey)?.Component ?? SECTION_TABS[0]!.Component;

  return (
    <FormProvider {...methods}>
      <form onSubmit={submitForm} className="min-h-dvh bg-[#070708] text-white">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-8">
            <div>
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                Admin · v{version}
                <span
                  title={
                    durable
                      ? "Content is stored in Neon Postgres (durable)."
                      : "Content is stored in a local file (dev only — set DATABASE_URL for production)."
                  }
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] tracking-[0.1em] ${
                    durable
                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200/90"
                      : "border-amber-300/30 bg-amber-400/10 text-amber-200/90"
                  }`}
                >
                  {durable ? "NEON" : "LOCAL FILE"}
                </span>
              </p>
              <h1 className="text-lg font-medium">Site content</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-white/45">
                {saving
                  ? "Saving…"
                  : isDirty
                    ? "Unsaved changes"
                    : saveState?.ok
                      ? "Saved"
                      : "Up to date"}
              </span>
              <button
                type="button"
                onClick={() => methods.reset(initial as DefaultValues<SiteContent>)}
                disabled={!isDirty || saving}
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:border-white/25 disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="rounded-lg border border-cyan-200/35 bg-cyan-200/15 px-4 py-2 text-sm font-medium text-cyan-50 hover:border-cyan-100/50 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save & publish"}
              </button>
              <HistoryMenu version={version} />
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/12 px-3 py-2 text-sm text-white/75 hover:border-white/25"
              >
                View site
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  window.location.href = "/admin/login";
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/55 hover:text-white/85"
              >
                Log out
              </button>
            </div>
          </div>
          {(saveState || invalidMsg) && (
            <div className="mx-auto max-w-[1400px] px-5 pb-3 md:px-8">
              {invalidMsg && (
                <p className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-100/90">
                  {invalidMsg}
                </p>
              )}
              {saveState && !saveState.ok && (
                <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90 whitespace-pre-wrap">
                  {saveState.error}
                  {saveState.details ? `\n${JSON.stringify(saveState.details, null, 2)}` : ""}
                </p>
              )}
              {saveState?.ok && !isDirty && !invalidMsg && (
                <p className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100/90">
                  Saved — the homepage now reflects your changes.
                </p>
              )}
            </div>
          )}
        </header>

        {/* Disable all inputs while saving so edits typed mid-request can't be
            silently dropped when the dirty baseline is reset on success. */}
        <fieldset
          disabled={saving}
          className="mx-auto grid min-w-0 max-w-[1400px] gap-6 border-0 px-5 py-8 md:grid-cols-[240px_1fr] md:px-8"
        >
          <aside className="space-y-5 md:sticky md:top-24 md:self-start">
            <nav className="flex flex-col gap-1">
              {SECTION_TABS.map((tab) => {
                const errored = Boolean(
                  (methods.formState.errors as Record<string, unknown>)[tab.key],
                );
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveKey(tab.key)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeKey === tab.key
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white/90"
                    }`}
                  >
                    {tab.label}
                    {errored && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
                  </button>
                );
              })}
            </nav>
            <LayoutPanel />
          </aside>

          <main className="min-w-0">
            <Active />
          </main>
        </fieldset>
      </form>
    </FormProvider>
  );
}
