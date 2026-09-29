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
 * hairline runs the width of the column above the buttons and ends in one
 * station over Schedule a Call's first edge — the rail's first stop again,
 * where working together starts. It is drawn complete in the server HTML;
 * where gsap runs, a brand-blue trace runs along it once, right to left, into
 * that station, then settles back to the drawing. The buttons never move.
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
            <line className="bf-trace__path" x1="100%" y1="0.5" x2="0" y2="0.5" />
            <rect className="bf-trace__stop" data-bf-trace-stop="" x="0.5" y="-3.5" width="8" height="8" />
          </svg>
          <Cta href={cta.primary.href} cta="schedule">
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
