import { engineering } from "@/content/engineering";
import { pages } from "@/content/pages";

import Cta from "../Cta";
import SectionHead from "../SectionHead";

/**
 * Industries on the homepage — since 2026-09-28 only those with delivered work
 * (DECISIONS 2026-09-28, item 1): one ruled row of cells, each industry and
 * where we have built for it, the links only where content/engineering.ts
 * records delivered work (SPEC §8b.10), and "All industries" to /industries,
 * which keeps the honest split — the industries with delivered work and those
 * with none yet. Saying "No delivered work yet" five times on the sales page
 * read as a list of what the company has not done.
 *
 * The heading is /industries' own for this group (content/pages.ts). A
 * capability's evidence written as "#pos" lands on its ledger row on this
 * page (components/site/home/WhatWeEngineer).
 */
export default function Industries() {
  const h = engineering.headings.industries;
  const built = pages.industries.built;
  const delivered = engineering.industries.filter((ind) => ind.evidence.length > 0);
  return (
    <section id="industries" className="bf-section bf-inds-sec" aria-labelledby="industries-title">
      <div className="bf-wrap">
        <div className="bf-inds__head">
          <SectionHead id="industries-title" eyebrow={h.eyebrow} title={built.title} lead={built.lead} />
          <Cta href="/industries" variant="quiet" className="bf-inds__all">
            All industries
          </Cta>
        </div>
        <ul className="bf-inds">
          {delivered.map((ind) => (
            <li key={ind.id} className="bf-inds__cell" data-bf-reveal>
              <h3 className="bf-inds__name">{ind.name}</h3>
              <p className="bf-inds__label">Where we&rsquo;ve built it</p>
              <ul className="bf-inds__links">
                {ind.evidence.map((e) => (
                  <li key={e.href + e.label}>
                    <a href={e.href}>{e.label}</a>
                  </li>
                ))}
              </ul>
              {ind.note ? <p className="bf-inds__note">{ind.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
