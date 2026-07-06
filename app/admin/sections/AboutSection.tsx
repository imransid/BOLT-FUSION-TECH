"use client";

import { ArrayEditor, StringListEditor, TextField, TextareaField } from "../fields";

export function AboutSection() {
  return (
    <div className="space-y-5">
      <TextField name="about.title" label="Title" />
      <TextareaField name="about.bio" label="Bio" rows={5} />
      <StringListEditor name="about.skills" label="Skills" placeholder="Skill" />
      <ArrayEditor
        name="about.experience"
        label="Experience"
        addLabel="+ Add role"
        itemTitle={(i) => `Role ${i + 1}`}
        defaultItem={() => ({ role: "", company: "", period: "" })}
        renderItem={(i) => (
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField name={`about.experience.${i}.role`} label="Role" />
            <TextField name={`about.experience.${i}.company`} label="Company" />
            <TextField name={`about.experience.${i}.period`} label="Period" />
          </div>
        )}
      />
    </div>
  );
}
