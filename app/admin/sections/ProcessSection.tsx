"use client";

import { ArrayEditor, ImageField, NumberField, TextField, TextareaField } from "../fields";

export function ProcessSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="process.badge" label="Badge" />
        <TextField name="process.title" label="Title" />
      </div>
      <TextareaField name="process.intro" label="Intro" rows={3} />
      <ImageField name="process.imageSrc" label="Image" />
      <TextField name="process.imageAlt" label="Image alt" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="process.discussLabel" label="Discuss label" />
        <TextField name="process.workLabel" label="Work label" />
      </div>
      <ArrayEditor
        name="process.steps"
        label="Process steps"
        addLabel="+ Add step"
        itemTitle={(i) => `Step ${i + 1}`}
        defaultItem={() => ({ num: 0, title: "", desc: "" })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <NumberField name={`process.steps.${i}.num`} label="Number" />
              <TextField name={`process.steps.${i}.title`} label="Title" />
            </div>
            <TextareaField name={`process.steps.${i}.desc`} label="Description" rows={2} />
          </>
        )}
      />
    </div>
  );
}
