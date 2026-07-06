"use client";

import { ArrayEditor, NumberField, TextField, TextareaField } from "../fields";

export function TestimonialsSection() {
  return (
    <div className="space-y-5">
      <TextField name="testimonials.badge" label="Badge" />
      <TextField name="testimonials.title" label="Title" />
      <TextareaField name="testimonials.intro" label="Intro" rows={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="testimonials.startConversationLabel" label="Start-conversation label" />
        <TextField name="testimonials.startConversationHref" label="Start-conversation href" mono />
        <TextField name="testimonials.recentWorkLabel" label="Recent-work label" />
        <TextField name="testimonials.recentWorkHref" label="Recent-work href" mono />
      </div>
      <ArrayEditor
        name="testimonials.items"
        label="Testimonials"
        addLabel="+ Add testimonial"
        itemTitle={(i) => `Testimonial ${i + 1}`}
        defaultItem={() => ({ name: "", role: "", text: "", stars: 5 })}
        renderItem={(i) => (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <TextField name={`testimonials.items.${i}.name`} label="Name" />
              <TextField name={`testimonials.items.${i}.role`} label="Role" />
              <NumberField name={`testimonials.items.${i}.stars`} label="Stars" min={1} max={5} />
            </div>
            <TextareaField name={`testimonials.items.${i}.text`} label="Quote" rows={3} />
          </>
        )}
      />
    </div>
  );
}
