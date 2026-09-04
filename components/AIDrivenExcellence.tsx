"use client";

import { useSiteContent } from "@/context/SiteContentContext";

/**
 * The production-AI proof section.
 *
 * Every figure rendered here traces to a shipped system; the component has no
 * hard-coded copy at all, so a claim can only ever enter through the CMS.
 *
 * NO COUNT-UP. The stats are strings ("<100ms", "~$0.001"), rendered directly,
 * so the server-rendered HTML already contains the final value. Team.tsx used to
 * seed a count-up from `useState(0)` gated on `useReducedMotion()` — which is
 * `null` during SSR — and shipped "0 specialists" in the initial HTML as a
 * result. That has since been removed; nothing here may reintroduce the pattern.
 *
 * Entrances are CSS-only (`.ai-rise` in globals.css) and defined entirely inside
 * a `prefers-reduced-motion: no-preference` block, so the element's *base* style
 * is its final style: reduced-motion users and no-JS crawlers get the finished
 * layout, and nothing ever ships as `opacity: 0`.
 */

/** Shared pill geometry for the credibility tags under each stat. */
const SOURCE_TAG =
  "mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/12 " +
  "bg-white/[0.04] px-2.5 py-1 text-[11px] leading-snug text-white/60";

function SourceTag({ label, href }: { label: string; href?: string }) {
  const dot = (
    <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-200/70" aria-hidden />
  );

  if (!href) {
    return (
      <p className={SOURCE_TAG}>
        {dot}
        {label}
      </p>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${SOURCE_TAG} transition-colors duration-300 hover:border-white/25 hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300`}
    >
      {dot}
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Small flow node — the box at each end of the lane diagram. */
function FlowNode({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex rounded-md border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-white/70">
      {children}
    </p>
  );
}

export default function AIDrivenExcellence() {
  const { aiExcellence: a } = useSiteContent();

  return (
    <section
      id="ai-excellence"
      aria-labelledby="ai-excellence-heading"
      className="px-5 py-20 md:px-20 md:py-24"
    >
      <div className="mx-auto max-w-[1200px] rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* ── Left: the claim, the action, and the architecture behind it ── */}
          <div className="ai-rise space-y-5">
            <h2
              id="ai-excellence-heading"
              className="max-w-[14ch] text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {a.heading}
            </h2>

            <p className="max-w-[54ch] text-sm leading-relaxed text-white/70 md:text-base">
              {a.subline}
            </p>

            <a
              href={a.ctaHref}
              className="inline-flex items-center justify-center rounded-full border border-amber-200/35 bg-amber-300 px-5 py-2 text-sm font-semibold text-[#1f2329] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
            >
              {a.ctaLabel}
            </a>

            {/* Replaces the old stock photo. Real DOM text, so it is legible to
                screen readers and search engines without an alt description. */}
            <figure className="!mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <figcaption className="mb-4 text-[12px] uppercase tracking-[0.14em] text-cyan-100/75">
                {a.diagramTitle}
              </figcaption>

              <FlowNode>{a.diagramInLabel}</FlowNode>

              <ul
                role="list"
                className="my-3 ml-[9px] space-y-3 border-l border-white/15 pl-5"
              >
                {a.lanes.map((lane) => (
                  <li key={lane.name} className="relative">
                    <span
                      className="absolute -left-5 top-[0.62rem] h-px w-4 bg-white/15"
                      aria-hidden
                    />
                    <span className="block text-sm leading-snug text-white/85">
                      {lane.name}
                    </span>
                    <span className="block text-[11px] leading-snug text-white/55">
                      {lane.detail}
                    </span>
                  </li>
                ))}
              </ul>

              <FlowNode>{a.diagramOutLabel}</FlowNode>
            </figure>
          </div>

          {/* ── Right: the numbers ── */}
          <div>
            <ul role="list" className="space-y-4 md:space-y-5">
              {a.proofPoints.map((point, index) => (
                <li
                  key={point.label}
                  className="ai-rise border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {/* The stat and its label are one heading: a screen reader
                      announces "under 100ms, search response" as a unit. */}
                  <h3 className="flex flex-col gap-1.5">
                    <span
                      className="text-[clamp(2.5rem,4.6vw,3.9rem)] font-light leading-[0.92] tracking-[-0.02em] text-cyan-200"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {point.stat}
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.14em] text-cyan-100/75">
                      {point.label}
                    </span>
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {point.body}
                  </p>

                  <SourceTag label={point.sourceLabel} href={point.sourceHref} />
                </li>
              ))}
            </ul>

            {/* Quieter than the cards by design — it qualifies them, it does not
                compete with them. */}
            <p className="mt-6 text-[13px] leading-relaxed text-white/55">
              {a.proofNote}
            </p>
          </div>
        </div>

        <ul
          role="list"
          className="ai-rise mt-9 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-6"
        >
          {a.assurances.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-white/70"
            >
              <span
                className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/80"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
