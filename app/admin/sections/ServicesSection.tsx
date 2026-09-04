"use client";

import { ArrayEditor, StringListEditor, TextField, TextareaField } from "../fields";

export function ServicesSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="services.badge" label="Badge" />
        <TextField name="services.title" label="Title" />
      </div>
      <TextareaField name="services.intro" label="Intro" rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="services.discussLabel" label="Discuss label" />
        <TextField name="services.workLabel" label="Work label" />
      </div>
      <StringListEditor name="services.skills" label="Skills" placeholder="Skill" />
      <ArrayEditor
        name="services.cards"
        label="Service cards"
        addLabel="+ Add card"
        itemTitle={(i) => `Card ${i + 1}`}
        defaultItem={() => ({ title: "", desc: "" })}
        renderItem={(i) => (
          <>
            <TextField name={`services.cards.${i}.title`} label="Title" />
            <TextareaField name={`services.cards.${i}.desc`} label="Description" rows={2} />
          </>
        )}
      />
    </div>
  );
}
