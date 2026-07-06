"use client";

import { ArrayEditor, TextField, TextareaField } from "../fields";

export function FaqSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="faq.badge" label="Badge" />
        <TextField name="faq.title" label="Title" />
      </div>
      <ArrayEditor
        name="faq.items"
        label="Questions"
        addLabel="+ Add question"
        itemTitle={(i) => `Q${i + 1}`}
        defaultItem={() => ({ q: "", a: "" })}
        renderItem={(i) => (
          <>
            <TextField name={`faq.items.${i}.q`} label="Question" />
            <TextareaField name={`faq.items.${i}.a`} label="Answer" rows={3} />
          </>
        )}
      />
    </div>
  );
}
