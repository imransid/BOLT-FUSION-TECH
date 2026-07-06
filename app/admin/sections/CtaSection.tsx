"use client";

import { TextField, TextareaField } from "../fields";

export function CtaSection() {
  return (
    <div className="space-y-5">
      <TextField name="cta.statusLabel" label="Status label" />
      <TextField name="cta.title" label="Title" />
      <TextareaField name="cta.body" label="Body" rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="cta.scheduleLabel" label="Schedule label" />
        <TextField name="cta.scheduleHref" label="Schedule href" mono />
        <TextField name="cta.emailLabel" label="Email label" />
        <TextField name="cta.emailHref" label="Email href" mono />
      </div>
    </div>
  );
}
