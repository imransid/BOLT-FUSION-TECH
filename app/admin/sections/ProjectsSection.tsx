"use client";

import { ArrayEditor, ImageField, TextField, TextareaField, ToggleField } from "../fields";

export function ProjectsSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="projects.introStart" label="Intro (start)" />
        <TextField name="projects.introEnd" label="Intro (end)" />
        <TextField name="projects.introLinkText" label="Intro link text" />
        <TextField name="projects.introLinkHref" label="Intro link href" mono />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="projects.featuredDetailLabel" label="Featured detail label" />
        <TextField name="projects.discussLabel" label="Discuss label" />
        <TextField name="projects.mobileStripHint" label="Mobile strip hint" />
      </div>
      <ArrayEditor
        name="projects.tiles"
        label="Project tiles"
        addLabel="+ Add tile"
        itemTitle={(i) => `Tile ${i + 1}`}
        defaultItem={() => ({ src: "", alt: "" })}
        renderItem={(i) => (
          <>
            <ImageField name={`projects.tiles.${i}.src`} label="Image" />
            <TextField name={`projects.tiles.${i}.alt`} label="Alt text" />
            <TextareaField name={`projects.tiles.${i}.caption`} label="Caption (optional)" rows={2} />
            <div className="flex flex-wrap gap-6">
              <ToggleField name={`projects.tiles.${i}.isProfile`} label="Is profile tile" />
            </div>
            <TextField
              name={`projects.tiles.${i}.imgMobileClass`}
              label="Mobile image class (optional)"
              mono
            />
          </>
        )}
      />
    </div>
  );
}
