import type { SiteContent } from "@/content/site-schema";

import Cta, { ctaKind } from "../Cta";

/**
 * The final call to action (SPEC §5): "Have a complex problem?", the line, and
 * both buttons — Schedule a Call, and Tell Us About Your Project (/contact).
 * `id="contact"` keeps the old homepage anchor landing somewhere that leads
 * to the contact page.
 *
 * The buttons' row is the Signal system's `cta` hook (`data-bf-trace="cta"`,
 * CLAUDE.md "Motion, as built"), the last trace on the page. At >=1025px a
 * hairline runs above the two buttons — the row is as wide as they are — from
 * the second's far edge to Schedule a Call's first edge, and turns down into
 * it: the button itself is the station, where working together starts. It is
 * drawn complete in the server HTML; where gsap runs, a brand-blue trace runs
 * along it once, right to left and down, and Schedule a Call's top edge lights
 * brand blue and stays lit, with the line. The buttons never move.
 *
 * Until 2026-09-29 the line ran the column's full width into an 8px square
 * above the button, and settled back: the trace crossed 1,100px of empty
 * space at 1440, pointed away from the button for most of its travel, and its
 * one station was lit for 267ms (the design review).
 */
export default function FinalCta({ cta }: { cta: SiteContent["finalCta"] }) {
  return (
    <section id="contact" className="bf-section bf-final" aria-labelledby="final-title">
      <div className="bf-wrap bf-final__inner" data-bf-reveal>
        <h2 id="final-title" className="bf-final__title">
          {cta.title}
        </h2>
        <p className="bf-final__line">{cta.line}</p>
        <p className="bf-actions" data-bf-trace="cta">
          <svg className="bf-trace bf-final__wire" aria-hidden="true" focusable="false">
            <line className="bf-trace__path" x1="100%" y1="0.5" x2="0.5" y2="0.5" />
            <line className="bf-trace__path" x1="0.5" y1="0.5" x2="0.5" y2="18" />
          </svg>
          <Cta href={cta.primary.href} cta="schedule" traceStop>
            {cta.primary.label}
          </Cta>
          <Cta href={cta.secondary.href} variant="ghost" cta={ctaKind(cta.secondary.href)}>
            {cta.secondary.label}
          </Cta>
        </p>
      </div>
    </section>
  );
}
