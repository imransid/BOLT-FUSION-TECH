"use client";

import { ArrayEditor, ImageField, TextField, TextareaField } from "../fields";

export function RecentWorksSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="recentWorks.title" label="Title" />
        <TextField name="recentWorks.subtitle" label="Subtitle" />
        <TextField name="recentWorks.mobileSwipeHint" label="Mobile swipe hint" />
      </div>
      <ArrayEditor
        name="recentWorks.items"
        label="Featured works"
        addLabel="+ Add work"
        itemTitle={(i) => `Work ${i + 1}`}
        defaultItem={() => ({ src: "", title: "", outcome: "", stack: "", alt: "" })}
        renderItem={(i) => (
          <>
            <ImageField name={`recentWorks.items.${i}.src`} label="Image" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`recentWorks.items.${i}.title`} label="Title" />
              <TextField name={`recentWorks.items.${i}.alt`} label="Alt text" />
            </div>
            <TextareaField name={`recentWorks.items.${i}.outcome`} label="Outcome" rows={2} />
            <TextField name={`recentWorks.items.${i}.stack`} label="Stack" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`recentWorks.items.${i}.href`} label="Link (optional)" mono />
              <TextField name={`recentWorks.items.${i}.ctaLabel`} label="CTA label (optional)" />
            </div>
            <TextField name={`recentWorks.items.${i}.imgClass`} label="Image class (optional)" mono />
          </>
        )}
      />
    </div>
  );
}
