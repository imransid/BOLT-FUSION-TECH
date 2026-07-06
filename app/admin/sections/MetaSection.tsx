"use client";

import { TextField, TextareaField } from "../fields";

export function MetaSection() {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-white/45">SEO / social metadata for the homepage.</p>
      <TextField name="meta.title" label="Page title" />
      <TextareaField name="meta.description" label="Meta description" rows={2} />
      <TextField name="meta.ogTitle" label="Open Graph title" />
      <TextareaField name="meta.ogDescription" label="Open Graph description" rows={2} />
    </div>
  );
}
