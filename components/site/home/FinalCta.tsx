import type { SiteContent } from "@/content/site-schema";

import Cta, { ctaKind } from "../Cta";

/**
 * The final call to action (SPEC §5): "Have a complex problem?", the line, and
 * both buttons — Schedule a Call, and Tell Us About Your Project (/contact).
 * `id="contact"` keeps the old homepage anchor landing somewhere that leads
 * to the contact page.
 */
export default function FinalCta({ cta }: { cta: SiteContent["finalCta"] }) {
  return (
    <section id="contact" className="bf-section bf-final" aria-labelledby="final-title">
      <div className="bf-wrap bf-final__inner" data-bf-reveal>
        <h2 id="final-title" className="bf-final__title">
          {cta.title}
        </h2>
        <p className="bf-final__line">{cta.line}</p>
        <p className="bf-actions">
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
