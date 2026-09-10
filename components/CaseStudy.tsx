"use client";

import Image from "next/image";
import { reveal } from "@/lib/reveal";

import { useSiteContent } from "@/context/SiteContentContext";

const linkFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-amber-200/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/* Visible in the server HTML; motion is CSS (see lib/reveal.ts). */
function revealProps(delay: number) {
  return reveal({ y: 14, duration: 0.48, delay });
}

function SectionHeading({
  eyebrow,
  title,
  titleId,
  delay = 0,
  description,
  descriptionId,
}: {
  eyebrow?: string;
  title: string;
  titleId?: string;
  delay?: number;
  description?: string;
  descriptionId?: string;
}) {
  return (
    <div {...revealProps(delay)} className="max-w-[68ch]">
      {eyebrow ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">{eyebrow}</p>
      ) : null}
      <h2
        id={titleId}
        className={`font-medium leading-snug tracking-[-0.02em] text-white ${eyebrow ? "mt-2.5" : ""} text-[clamp(1.2rem,2.4vw,1.65rem)]`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>
      {description ? (
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-[1.65] text-white/58 md:text-[15px]"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function CaseStudy() {
  const { caseStudy: cs } = useSiteContent();

  const featuredContext = cs.contexts.find((c) => c.featured);
  const otherContexts = cs.contexts.filter((c) => !c.featured);

  return (
    <section
      id="case-study"
      className="scroll-mt-24 px-5 py-20 md:scroll-mt-28 md:px-20 md:py-28"
      aria-labelledby="case-study-heading"
      aria-describedby="case-study-lead case-study-summary"
    >
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.012] p-6 shadow-[0_28px_72px_-36px_rgba(0,0,0,0.88)] ring-1 ring-inset ring-white/[0.035] backdrop-blur-sm md:p-11 lg:p-12">
        <header className="grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-12">
          <div className="flex min-w-0 flex-col gap-8">
            <div
              {...revealProps(0)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0d0d0d] px-4 py-1.5"
              style={{
                boxShadow:
                  "16px 24px 20px 8px rgba(0,0,0,0.4), inset 0 2px 0 0 rgba(184,180,180,0.08)",
              }}
            >
              <span className="flex h-[11px] w-[11px] items-center justify-center rounded-[10px] bg-white">
                <span className="flex h-[8px] w-[9px] items-center justify-center rounded-[10px] bg-[#0d0d0d]">
                  <span className="h-[5px] w-[5px] rounded-[10px] bg-white" />
                </span>
              </span>
              <span className="text-[13px] text-white/88">{cs.badge}</span>
            </div>

            <div className="space-y-5">
              <h1
                id="case-study-heading"
                {...revealProps(0.04)}
                className="text-balance text-[clamp(1.85rem,4vw,3.1rem)] font-normal leading-[1.06] tracking-[-0.032em] text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {cs.title}
              </h1>
              <p
                id="case-study-lead"
                {...revealProps(0.07)}
                className="max-w-[60ch] text-[15px] leading-[1.65] text-white/62 md:text-base md:leading-relaxed"
              >
                {cs.subtitle}
              </p>
              <p
                {...revealProps(0.09)}
                className="font-mono text-[11px] leading-relaxed tracking-[0.06em] text-white/48 md:text-[12px]"
              >
                {cs.titleAccentLine}
              </p>
            </div>

            <div
              {...revealProps(0.11)}
              className="rounded-2xl border border-white/[0.07] bg-black/25 py-6 pl-6 pr-5 md:py-7 md:pl-7 md:pr-6"
            >
              <div className="border-l-2 border-white/20 pl-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Executive summary
                </p>
                <p
                  id="case-study-summary"
                  className="mt-3 max-w-[62ch] text-pretty text-sm leading-[1.7] text-white/78 md:text-[15px]"
                >
                  {cs.executiveSummary}
                </p>
              </div>
            </div>
          </div>

          <figure
            {...revealProps(0.06)}
            className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-black"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={cs.imageSrc}
                alt={cs.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover object-center"
              />
            </div>
            <figcaption className="sr-only">{cs.imageAlt}</figcaption>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/75 px-4 py-3 backdrop-blur-md">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/42">
                {cs.diagramBadgeLeft}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
                {cs.diagramBadgeRight}
              </span>
            </div>
          </figure>
        </header>

        <div className="my-11 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent md:my-12" />

        <SectionHeading
          eyebrow={cs.kpiSectionEyebrow}
          title={cs.kpiBlockTitle}
          titleId="case-study-kpi-heading"
          delay={0}
        />

        <div
          role="region"
          aria-labelledby="case-study-kpi-heading"
          {...revealProps(0.06)}
          className="mt-7 grid grid-cols-1 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-black/28 sm:mt-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
        >
          {cs.kpis.map((k) => {
            /* Same encoding as the homepage metric band: cyan = shipped,
               amber = target, and the label is always shown. */
            const shipped = k.status === "shipped";
            return (
              <article key={k.label} className="flex flex-col px-5 py-6 sm:px-6 sm:py-6 lg:px-7">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span
                    className={`text-[1.75rem] font-light tabular-nums leading-none md:text-[1.95rem] ${shipped ? "text-cyan-200/95" : "text-amber-300"}`}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {k.value}
                  </span>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-[0.16em] ${shipped ? "text-cyan-100/60" : "text-amber-100/60"}`}
                  >
                    {k.label}
                  </span>
                </div>
                {k.hint ? <p className="mt-3 text-[13px] leading-relaxed text-white/50">{k.hint}</p> : null}
                <p className="mt-auto pt-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      shipped ? "border-cyan-200/45 text-cyan-200" : "border-amber-300/50 text-amber-300"
                    }`}
                    style={{ fontFamily: "var(--font-machine)" }}
                  >
                    {k.status}
                  </span>
                </p>
              </article>
            );
          })}
        </div>

        <div className="my-11 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent md:my-12" />

        <SectionHeading
          titleId="case-study-lanes-heading"
          title={cs.lanesSectionTitle}
          description={cs.lanesIntro}
          descriptionId="case-study-lanes-intro"
          delay={0}
        />

        <div
          className="mt-7 grid gap-5 sm:mt-8 md:grid-cols-3 md:items-stretch md:gap-5"
          role="list"
          aria-labelledby="case-study-lanes-heading"
          aria-describedby="case-study-lanes-intro"
        >
          {cs.lanes.map((lane, i) => (
            <article
              key={lane.lane}
              role="listitem"
              {...revealProps(0.05 + i * 0.04)}
              className="flex h-full min-h-0 flex-col rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-6 md:p-7"
              style={{ boxShadow: "12px 20px 28px -16px rgba(0,0,0,0.5)" }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.03] text-[13px] font-semibold tabular-nums text-white/90">
                  {lane.lane}
                </span>
                <span className="text-right text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-white/36">
                  {lane.traffic}
                  <span className="text-white/22"> · </span>
                  {lane.latency}
                </span>
              </div>
              <h3
                className="mt-5 text-base font-medium leading-snug text-white md:text-lg"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {lane.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/52">{lane.summary}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2 text-[13px] leading-relaxed text-white/66">
                {lane.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {lane.costLine ? (
                <p className="mt-6 border-t border-white/[0.07] pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
                  {lane.costLine}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="my-11 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent md:my-12" />

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-14 lg:items-start">
          <div>
            <SectionHeading
              eyebrow={cs.stackSectionTitle}
              title={cs.stackBlockTitle}
              titleId="case-study-stack-heading"
              delay={0}
            />
            <div
              className="mt-7 flex flex-col gap-4 sm:mt-8"
              role="region"
              aria-labelledby="case-study-stack-heading"
            >
              {cs.stackGroups.map((g, gi) => (
                <div
                  key={g.title}
                  {...revealProps(0.04 + gi * 0.03)}
                  className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d]/90 p-5 md:p-6"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">{g.title}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {g.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-white/[0.08] bg-black/35 px-3 py-1.5 text-[12px] leading-snug text-white/78 md:text-[13px]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow={cs.architectureSectionTitle}
              title={cs.architectureBlockTitle}
              titleId="case-study-arch-heading"
              delay={0}
              description={cs.architectureLead}
              descriptionId="case-study-arch-lead"
            />

            {featuredContext ? (
              <article
                {...revealProps(0.06)}
                className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-6 md:mt-8 md:p-7"
                style={{ boxShadow: "12px 20px 28px -16px rgba(0,0,0,0.5)" }}
                aria-label={`${featuredContext.name} bounded context`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
                  Primary bounded context
                </p>
                <h3
                  className="mt-2 text-lg font-medium text-white md:text-xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {featuredContext.name}
                </h3>
                <p className="mt-1.5 text-[13px] text-white/52 md:text-sm">{featuredContext.tagline}</p>
                <ul className="mt-5 space-y-2.5 text-[13px] leading-relaxed text-white/70 md:text-[15px]">
                  {featuredContext.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/28" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            <div {...revealProps(0.08)} className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38">
                {cs.patternsSectionTitle}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={cs.patternsSectionTitle}>
                {cs.patterns.map((p) => (
                  <li
                    key={p}
                    className="rounded-md border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium leading-snug text-white/76"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {otherContexts.map((ctx, ci) => (
                <div
                  key={ctx.name}
                  {...revealProps(0.04 + ci * 0.03)}
                  className="rounded-2xl border border-white/[0.07] bg-black/28 p-5 md:p-6"
                >
                  <h3 className="text-[15px] font-medium text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    {ctx.name}
                  </h3>
                  <p className="mt-1 text-[12px] text-white/48 md:text-[13px]">{ctx.tagline}</p>
                  <ul className="mt-3.5 space-y-2 text-[12px] leading-relaxed text-white/60 md:text-[13px]">
                    {ctx.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/22" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              {...revealProps(0.1)}
              className="mt-8 rounded-2xl border border-white/[0.07] bg-black/30 p-5 md:p-6"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{cs.sharedKernelTitle}</p>
              <ul className="mt-4 grid gap-x-6 gap-y-2 font-mono text-[11px] leading-relaxed text-white/62 sm:grid-cols-2 md:text-[12px]">
                {cs.sharedKernelItems.map((item) => (
                  <li key={item} className="border-l border-white/[0.08] pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <footer className="mt-11 rounded-2xl border border-white/[0.06] bg-black/22 px-5 py-8 md:mt-12 md:px-8 md:py-9">
          <div
            {...revealProps(0)}
            className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between md:gap-10"
          >
            <p className="max-w-[58ch] text-[13px] leading-[1.65] text-white/55 md:text-[15px] md:leading-relaxed">
              {cs.ctaSupportingText}
            </p>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={cs.primaryCtaHref}
                className={`beam-button corner-glow inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/12 bg-black px-6 py-3 text-[13px] font-medium text-white transition-all duration-500 hover:border-white/22 ${linkFocus}`}
              >
                {cs.primaryCtaLabel}
              </a>
              <a
                href={cs.secondaryCtaHref}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-amber-200/40 bg-amber-300 px-6 py-3 text-[13px] font-semibold text-[#1a1d22] transition-all duration-300 hover:bg-amber-200/95 ${linkFocus}`}
              >
                {cs.secondaryCtaLabel}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
