"use client";

import { StringListEditor, TextField, TextareaField } from "../fields";

export function HeroSection() {
  return (
    <div className="space-y-5">
      <TextField name="hero.badge" label="Badge" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="hero.headlineLine1" label="Headline line 1" />
        <TextField name="hero.headlineLine2" label="Headline line 2" />
      </div>
      <TextareaField name="hero.subtext" label="Subtext" />
      <StringListEditor name="hero.trustPoints" label="Trust points" placeholder="e.g. SOC2-ready" />
      <StringListEditor name="hero.logos" label="Logo marquee (text)" placeholder="Client name" />
      <TextField name="hero.tagline" label="Tagline" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="hero.primaryCtaLabel" label="Primary CTA label" />
        <TextField name="hero.primaryCtaHref" label="Primary CTA href" mono />
        <TextField name="hero.secondaryCtaLabel" label="Secondary CTA label" />
        <TextField name="hero.secondaryCtaHref" label="Secondary CTA href" mono />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="hero.scrollHintLeft" label="Scroll hint (left)" />
        <TextField name="hero.scrollHintRight" label="Scroll hint (right)" />
      </div>
    </div>
  );
}
