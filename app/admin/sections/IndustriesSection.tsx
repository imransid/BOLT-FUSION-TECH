"use client";

import { industryIconKeySchema } from "@/lib/site-content-schema";
import { ArrayEditor, EnumSelect, TextField, TextareaField } from "../fields";

const ICON_KEYS = industryIconKeySchema.options;

export function IndustriesSection() {
  return (
    <div className="space-y-5">
      <TextField name="industries.badge" label="Badge" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="industries.titleLine1" label="Title line 1" />
        <TextField name="industries.titleLine2" label="Title line 2" />
      </div>
      <TextareaField name="industries.subtitle" label="Subtitle" rows={2} />
      <ArrayEditor
        name="industries.items"
        label="Industries"
        addLabel="+ Add industry"
        itemTitle={(i) => `Industry ${i + 1}`}
        defaultItem={() => ({ title: "", description: "", iconKey: ICON_KEYS[0] })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`industries.items.${i}.title`} label="Title" />
              <EnumSelect name={`industries.items.${i}.iconKey`} label="Icon" options={ICON_KEYS} />
            </div>
            <TextareaField
              name={`industries.items.${i}.description`}
              label="Description"
              rows={2}
            />
          </>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="industries.ctaCardTitle" label="CTA card title" />
        <TextField name="industries.ctaCardButton" label="CTA card button" />
      </div>
      <TextareaField name="industries.ctaCardBody" label="CTA card body" rows={2} />
      <TextField name="industries.learnMoreLabel" label="Learn more label" />
    </div>
  );
}
