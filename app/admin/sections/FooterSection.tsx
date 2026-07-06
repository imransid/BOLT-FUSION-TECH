"use client";

import { ArrayEditor, TextField } from "../fields";

export function FooterSection() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="footer.copyrightName" label="Copyright name" />
        <TextField name="footer.rightsLine" label="Rights line" />
      </div>
      <TextField name="footer.backToTopLabel" label="Back-to-top label" />
      <ArrayEditor
        name="footer.socialLinks"
        label="Social links"
        addLabel="+ Add social link"
        itemTitle={(i) => `Link ${i + 1}`}
        defaultItem={() => ({ name: "", url: "" })}
        renderItem={(i) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name={`footer.socialLinks.${i}.name`} label="Name" />
            <TextField name={`footer.socialLinks.${i}.url`} label="URL" mono />
          </div>
        )}
      />
    </div>
  );
}
