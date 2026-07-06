"use client";

import { useState } from "react";
import {
  useController,
  useFieldArray,
  useFormContext,
  type FieldPath,
} from "react-hook-form";

import type { SiteContent } from "@/lib/site-content-schema";
import { ArrayEditor } from "./array-editor";

/** Typed field path into the whole content document. */
export type ContentPath = FieldPath<SiteContent>;

/* ── shared styles ─────────────────────────────────────────────────────── */
const inputCls =
  "w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white/90 outline-none ring-cyan-200/30 transition focus:border-cyan-200/35 focus:ring-2 placeholder:text-white/25";
const labelCls = "mb-1.5 block text-[12px] font-medium uppercase tracking-[0.1em] text-white/45";
const errCls = "mt-1 text-[12px] text-red-300/90";

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={errCls}>{message}</p>;
}

/* ── primitives ────────────────────────────────────────────────────────── */

export function TextField({
  name,
  label,
  placeholder,
  mono,
}: {
  name: ContentPath;
  label: string;
  placeholder?: string;
  mono?: boolean;
}) {
  const { control } = useFormContext<SiteContent>();
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        {...field}
        value={(field.value as string) ?? ""}
        placeholder={placeholder}
        spellCheck={!mono}
        className={mono ? `${inputCls} font-mono text-[13px]` : inputCls}
      />
      <ErrorText message={fieldState.error?.message} />
    </div>
  );
}

export function TextareaField({
  name,
  label,
  placeholder,
  rows = 4,
}: {
  name: ContentPath;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const { control } = useFormContext<SiteContent>();
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea
        {...field}
        value={(field.value as string) ?? ""}
        placeholder={placeholder}
        rows={rows}
        className={`${inputCls} resize-y leading-relaxed`}
      />
      <ErrorText message={fieldState.error?.message} />
    </div>
  );
}

export function NumberField({
  name,
  label,
  min,
  max,
  step,
}: {
  name: ContentPath;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const { control } = useFormContext<SiteContent>();
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="number"
        {...field}
        value={field.value === undefined || field.value === null ? "" : (field.value as number)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
        className={`${inputCls} max-w-[160px]`}
      />
      <ErrorText message={fieldState.error?.message} />
    </div>
  );
}

export function ToggleField({
  name,
  label,
  hint,
}: {
  name: ContentPath;
  label: string;
  hint?: string;
}) {
  const { control } = useFormContext<SiteContent>();
  const { field } = useController({ name, control });
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1">
      <input
        type="checkbox"
        checked={Boolean(field.value)}
        onChange={(e) => field.onChange(e.target.checked)}
        className="h-4 w-4 accent-cyan-300"
      />
      <span className="text-sm text-white/80">{label}</span>
      {hint && <span className="text-[12px] text-white/35">{hint}</span>}
    </label>
  );
}

export function EnumSelect({
  name,
  label,
  options,
}: {
  name: ContentPath;
  label: string;
  options: readonly string[];
}) {
  const { control } = useFormContext<SiteContent>();
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select
        {...field}
        value={(field.value as string) ?? ""}
        className={`${inputCls} max-w-[260px]`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0d0d10]">
            {o}
          </option>
        ))}
      </select>
      <ErrorText message={fieldState.error?.message} />
    </div>
  );
}

/**
 * Editor for a `string[]` field (e.g. bullets, skills, logos). Add / edit /
 * remove / reorder with up-down; strings are short so drag isn't needed.
 */
export function StringListEditor({
  name,
  label,
  placeholder,
}: {
  name: ContentPath;
  label: string;
  placeholder?: string;
}) {
  const { control, register } = useFormContext<SiteContent>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    // RHF supports primitive string arrays; the name is a string[] path.
    name: name as never,
  });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-1.5">
            <input
              {...register(`${name}.${i}` as ContentPath)}
              placeholder={placeholder}
              className={inputCls}
            />
            <button
              type="button"
              aria-label="Move up"
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
              className="rounded border border-white/10 px-1.5 py-1 text-xs text-white/55 hover:border-white/25 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={i === fields.length - 1}
              onClick={() => move(i, i + 1)}
              className="rounded border border-white/10 px-1.5 py-1 text-xs text-white/55 hover:border-white/25 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Remove"
              onClick={() => remove(i)}
              className="rounded border border-red-300/20 px-1.5 py-1 text-xs text-red-200/70 hover:border-red-300/40"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => append("" as never)}
        className="mt-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white/70 hover:border-white/25"
      >
        + Add
      </button>
    </div>
  );
}

/**
 * Image field: paste a URL or upload to Vercel Blob (when configured). Stores
 * the resulting URL string into the content field, so it drops into any
 * existing `imageSrc`/`src`/`image` string.
 */
export function ImageField({
  name,
  label,
}: {
  name: ContentPath;
  label: string;
}) {
  const { control } = useFormContext<SiteContent>();
  const { field, fieldState } = useController({ name, control });
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const value = (field.value as string) ?? "";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const { upload } = await import("@vercel/blob/client");
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      field.onChange(result.url);
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "Upload failed — paste an image URL instead.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-16 w-16 rounded-lg border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/12 text-[10px] text-white/30">
            none
          </div>
        )}
        <div className="min-w-[220px] flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder="/image.png or https://…"
            className={inputCls}
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white/70 hover:border-white/25">
            {busy ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <ErrorText message={fieldState.error?.message ?? uploadError ?? undefined} />
    </div>
  );
}

export { ArrayEditor };
