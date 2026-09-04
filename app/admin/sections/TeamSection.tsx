"use client";

import {
  ArrayEditor,
  ImageField,
  StringListEditor,
  TextField,
  TextareaField,
} from "../fields";

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
        name="team.roster"
        label="Team members"
        addLabel="+ Add member"
        itemTitle={(i) => `Member ${i + 1}`}
        defaultItem={() => ({
          id: "",
          name: "",
          handle: "",
          image: "",
          role: "",
          experience: "",
          stack: [],
          profileUrl: "",
        })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField name={`team.roster.${i}.name`} label="Name" />
              <TextField name={`team.roster.${i}.handle`} label="Handle" />
              <TextField
                name={`team.roster.${i}.id`}
                label="ID (stable key)"
                placeholder="e.g. rafa"
                mono
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                name={`team.roster.${i}.role`}
                label="Role"
                placeholder="e.g. Lead Backend Engineer"
              />
              <TextField
                name={`team.roster.${i}.experience`}
                label="Experience (optional)"
                placeholder="e.g. 8 yrs"
              />
            </div>
            <StringListEditor
              name={`team.roster.${i}.stack`}
              label="Stack (optional, 2–4 tags)"
              placeholder="e.g. NestJS"
            />
            <ImageField name={`team.roster.${i}.image`} label="Avatar" />
            <TextField
              name={`team.roster.${i}.profileUrl`}
              label="Profile URL (optional — leave blank if unverified)"
              placeholder="Only a confirmed profile for THIS person"
              mono
            />
          </>
        )}
      />
    </div>
  );
}
