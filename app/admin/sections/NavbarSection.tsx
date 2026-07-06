"use client";

import { ArrayEditor, TextField } from "../fields";

export function NavbarSection() {
  return (
    <div className="space-y-5">
      <TextField name="navbar.scheduleCtaLabel" label="Schedule CTA label" />
      <ArrayEditor
        name="navbar.links"
        label="Nav links"
        addLabel="+ Add link"
        itemTitle={(i) => `Link ${i + 1}`}
        defaultItem={() => ({ label: "", href: "" })}
        renderItem={(i) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name={`navbar.links.${i}.label`} label="Label" />
            <TextField name={`navbar.links.${i}.href`} label="Href" mono />
          </div>
        )}
      />
    </div>
  );
}
