"use client";

import { TextareaField } from "../fields";

export function ScheduleEmbedSection() {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-white/45">
        Intro text shown above the Calendly scheduling embed.
      </p>
      <TextareaField name="scheduleEmbed.blurb" label="Blurb" rows={3} />
    </div>
  );
}
