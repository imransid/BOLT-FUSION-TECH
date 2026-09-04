"use client";

import { ArrayEditor, StringListEditor, TextField, TextareaField } from "../fields";

export function AiExcellenceSection() {
  return (
    <div className="space-y-5">
      <TextField name="aiExcellence.heading" label="Heading" />
      <TextareaField name="aiExcellence.subline" label="Sub-line" rows={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="aiExcellence.ctaLabel" label="CTA label" />
        <TextField name="aiExcellence.ctaHref" label="CTA href" mono />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="aiExcellence.diagramTitle" label="Diagram title" />
        <TextField name="aiExcellence.diagramInLabel" label="Diagram — input node" />
        <TextField name="aiExcellence.diagramOutLabel" label="Diagram — output node" />
      </div>
      <ArrayEditor
        name="aiExcellence.lanes"
        label="Retrieval lanes"
        addLabel="+ Add lane"
        itemTitle={(i) => `Lane ${i + 1}`}
        defaultItem={() => ({ name: "", detail: "" })}
        renderItem={(i) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name={`aiExcellence.lanes.${i}.name`} label="Lane name" />
            <TextField name={`aiExcellence.lanes.${i}.detail`} label="Stack / detail" />
          </div>
        )}
      />

      <ArrayEditor
        name="aiExcellence.proofPoints"
        label="Proof points"
        addLabel="+ Add proof point"
        itemTitle={(i) => `Proof point ${i + 1}`}
        defaultItem={() => ({ stat: "", label: "", body: "", sourceLabel: "", sourceHref: "" })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField name={`aiExcellence.proofPoints.${i}.stat`} label="Stat" />
              <TextField name={`aiExcellence.proofPoints.${i}.label`} label="Label" />
            </div>
            <TextareaField name={`aiExcellence.proofPoints.${i}.body`} label="Explanation" rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                name={`aiExcellence.proofPoints.${i}.sourceLabel`}
                label="Source tag"
                placeholder="Source: the system this figure came from"
              />
              <TextField
                name={`aiExcellence.proofPoints.${i}.sourceHref`}
                label="Source link (optional)"
                placeholder="https://…"
                mono
              />
            </div>
          </>
        )}
      />

      <TextareaField name="aiExcellence.proofNote" label="Note under the proof points" rows={2} />
      <StringListEditor
        name="aiExcellence.assurances"
        label="Bottom bar"
        placeholder="e.g. 8–16 weeks to a production MVP"
      />
    </div>
  );
}
