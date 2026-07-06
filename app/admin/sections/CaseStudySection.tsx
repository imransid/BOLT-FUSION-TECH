"use client";

import {
  ArrayEditor,
  ImageField,
  NumberField,
  StringListEditor,
  TextField,
  TextareaField,
  ToggleField,
} from "../fields";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
      <h3 className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/55">{title}</h3>
      {children}
    </section>
  );
}

export function CaseStudySection() {
  return (
    <div className="space-y-5">
      <Group title="Header">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.badge" label="Badge" />
          <TextField name="caseStudy.title" label="Title" />
          <TextField name="caseStudy.titleAccentLine" label="Title accent line" />
          <TextField name="caseStudy.subtitle" label="Subtitle" />
        </div>
        <TextareaField name="caseStudy.executiveSummary" label="Executive summary" rows={4} />
        <ImageField name="caseStudy.imageSrc" label="Image" />
        <TextField name="caseStudy.imageAlt" label="Image alt" />
      </Group>

      <Group title="KPIs">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.kpiSectionEyebrow" label="KPI section eyebrow" />
          <TextField name="caseStudy.kpiBlockTitle" label="KPI block title" />
        </div>
        <ArrayEditor
          name="caseStudy.kpis"
          label="KPIs"
          addLabel="+ Add KPI"
          itemTitle={(i) => `KPI ${i + 1}`}
          defaultItem={() => ({ value: "", label: "" })}
          renderItem={(i) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField name={`caseStudy.kpis.${i}.value`} label="Value" />
              <TextField name={`caseStudy.kpis.${i}.label`} label="Label" />
              <TextField name={`caseStudy.kpis.${i}.hint`} label="Hint (optional)" />
            </div>
          )}
        />
      </Group>

      <Group title="Lanes">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.lanesSectionTitle" label="Lanes section title" />
          <TextField name="caseStudy.lanesIntro" label="Lanes intro" />
        </div>
        <ArrayEditor
          name="caseStudy.lanes"
          label="Lanes"
          addLabel="+ Add lane"
          itemTitle={(i) => `Lane ${i + 1}`}
          defaultItem={() => ({
            lane: 0,
            title: "",
            summary: "",
            traffic: "",
            latency: "",
            bullets: [],
          })}
          renderItem={(i) => (
            <>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <NumberField name={`caseStudy.lanes.${i}.lane`} label="Lane #" />
                <TextField name={`caseStudy.lanes.${i}.title`} label="Title" />
              </div>
              <TextareaField name={`caseStudy.lanes.${i}.summary`} label="Summary" rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField name={`caseStudy.lanes.${i}.traffic`} label="Traffic" />
                <TextField name={`caseStudy.lanes.${i}.latency`} label="Latency" />
              </div>
              <StringListEditor name={`caseStudy.lanes.${i}.bullets`} label="Bullets" />
              <TextField name={`caseStudy.lanes.${i}.costLine`} label="Cost line (optional)" />
            </>
          )}
        />
      </Group>

      <Group title="Stack">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.stackSectionTitle" label="Stack section title" />
          <TextField name="caseStudy.stackBlockTitle" label="Stack block title" />
        </div>
        <ArrayEditor
          name="caseStudy.stackGroups"
          label="Stack groups"
          addLabel="+ Add group"
          itemTitle={(i) => `Group ${i + 1}`}
          defaultItem={() => ({ title: "", items: [] })}
          renderItem={(i) => (
            <>
              <TextField name={`caseStudy.stackGroups.${i}.title`} label="Group title" />
              <StringListEditor name={`caseStudy.stackGroups.${i}.items`} label="Items" />
            </>
          )}
        />
      </Group>

      <Group title="Patterns & architecture">
        <TextField name="caseStudy.patternsSectionTitle" label="Patterns section title" />
        <StringListEditor name="caseStudy.patterns" label="Patterns" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.architectureSectionTitle" label="Architecture section title" />
          <TextField name="caseStudy.architectureBlockTitle" label="Architecture block title" />
        </div>
        <TextareaField name="caseStudy.architectureLead" label="Architecture lead" rows={2} />
        <ArrayEditor
          name="caseStudy.contexts"
          label="Contexts"
          addLabel="+ Add context"
          itemTitle={(i) => `Context ${i + 1}`}
          defaultItem={() => ({ name: "", tagline: "", bullets: [] })}
          renderItem={(i) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField name={`caseStudy.contexts.${i}.name`} label="Name" />
                <TextField name={`caseStudy.contexts.${i}.tagline`} label="Tagline" />
              </div>
              <StringListEditor name={`caseStudy.contexts.${i}.bullets`} label="Bullets" />
              <ToggleField name={`caseStudy.contexts.${i}.featured`} label="Featured" />
            </>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.sharedKernelTitle" label="Shared kernel title" />
        </div>
        <StringListEditor name="caseStudy.sharedKernelItems" label="Shared kernel items" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.diagramBadgeLeft" label="Diagram badge (left)" />
          <TextField name="caseStudy.diagramBadgeRight" label="Diagram badge (right)" />
        </div>
      </Group>

      <Group title="Call to action">
        <TextareaField name="caseStudy.ctaSupportingText" label="Supporting text" rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="caseStudy.primaryCtaLabel" label="Primary CTA label" />
          <TextField name="caseStudy.primaryCtaHref" label="Primary CTA href" mono />
          <TextField name="caseStudy.secondaryCtaLabel" label="Secondary CTA label" />
          <TextField name="caseStudy.secondaryCtaHref" label="Secondary CTA href" mono />
        </div>
      </Group>
    </div>
  );
}
