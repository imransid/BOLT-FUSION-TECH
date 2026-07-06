"use client";

import { ArrayEditor, ImageField, TextField, TextareaField } from "../fields";

export function TeamSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="team.headlineLine1" label="Headline line 1" />
        <TextField name="team.headlineLine2" label="Headline line 2" />
      </div>
      <TextareaField name="team.subtext" label="Subtext" rows={3} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="team.benchLabel" label="Bench label" />
        <TextField name="team.codeComment" label="Code comment" />
        <TextField name="team.statLabel" label="Stat label" />
      </div>
      <ArrayEditor
        name="team.members"
        label="Team members"
        addLabel="+ Add member"
        itemTitle={(i) => `Member ${i + 1}`}
        defaultItem={() => ({ name: "", handle: "", image: "", profileUrl: "" })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`team.members.${i}.name`} label="Name" />
              <TextField name={`team.members.${i}.handle`} label="Handle" />
            </div>
            <ImageField name={`team.members.${i}.image`} label="Avatar" />
            <TextField name={`team.members.${i}.profileUrl`} label="Profile URL (optional)" mono />
          </>
        )}
      />
    </div>
  );
}
