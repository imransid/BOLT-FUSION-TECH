import { insights } from "@/content/insights";
import { pages } from "@/content/pages";

import Cta from "../Cta";
import SectionHead from "../SectionHead";

/**
 * The homepage's Insights teaser (redesign SPEC §6), before the FAQ: each
 * article's title, linking to it, and its dek, from content/insights.ts —
 * the same entries /insights lists. A ruled row, not a row of cards. No
 * figure: titles and deks carry none (scripts/verify-insights.mjs).
 */
export default function InsightsTeaser() {
  const t = pages.insights.teaser;
  return (
    <section id="insights" className="bf-section" aria-labelledby="insights-title">
      <div className="bf-wrap">
        <div className="bf-teaser__head">
          <SectionHead id="insights-title" eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
          <Cta href={t.cta.href} variant="quiet" className="bf-teaser__all">
            {t.cta.label}
          </Cta>
        </div>
        <ul className="bf-teaser">
          {insights.map((a) => (
            <li key={a.slug} className="bf-teaser__item" data-bf-reveal>
              <h3 className="bf-teaser__title">
                <a href={`/insights/${a.slug}`}>{a.title}</a>
              </h3>
              <p className="bf-teaser__dek">{a.dek}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
