"use client";

import { ArrayEditor, ImageField, StringListEditor, TextField, TextareaField } from "../fields";

export function AiExcellenceSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="aiExcellence.headlineLine1" label="Headline line 1" />
        <TextField name="aiExcellence.headlineLine2" label="Headline line 2" />
        <TextField name="aiExcellence.headlineLine3" label="Headline line 3" />
      </div>
      <TextareaField name="aiExcellence.intro" label="Intro" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="aiExcellence.scheduleCtaLabel" label="Schedule CTA label" />
        <TextField name="aiExcellence.scheduleCtaHref" label="Schedule CTA href" mono />
      </div>
      <ImageField name="aiExcellence.imageSrc" label="Image" />
      <TextField name="aiExcellence.imageAlt" label="Image alt" />
      <ArrayEditor
        name="aiExcellence.metrics"
        label="Metrics"
        addLabel="+ Add metric"
        itemTitle={(i) => `Metric ${i + 1}`}
        defaultItem={() => ({ value: "", label: "", title: "", desc: "" })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`aiExcellence.metrics.${i}.value`} label="Value" />
              <TextField name={`aiExcellence.metrics.${i}.label`} label="Label" />
            </div>
            <TextField name={`aiExcellence.metrics.${i}.title`} label="Title" />
            <TextareaField name={`aiExcellence.metrics.${i}.desc`} label="Description" rows={2} />
          </>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="aiExcellence.footerTitle" label="Footer title" />
        <TextField name="aiExcellence.footerSubtitle" label="Footer subtitle" />
      </div>
      <StringListEditor name="aiExcellence.trustPoints" label="Trust points" />
    </div>
  );
}
