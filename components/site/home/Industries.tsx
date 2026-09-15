import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";

/**
 * "Technology we can build for…" (SPEC §5): a ledger, one ruled row per
 * industry — what we'd build, and where we've built it. Evidence links appear
 * ONLY where delivered work exists (content/engineering.ts); every other row
 * says plainly that there is none yet, rather than leaving a gap a reader
 * might fill with a claim.
 */
export default function Industries() {
  const h = engineering.headings.industries;
  return (
    <section id="industries" className="bf-section" aria-labelledby="industries-title">
      <div className="bf-wrap">
        <SectionHead id="industries-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <ul className="bf-ledger">
          {engineering.industries.map((ind) => (
            <li key={ind.id} className="bf-ledger__row" data-bf-reveal>
              <h3 className="bf-ledger__name">{ind.name}</h3>
              <div className="bf-ledger__cell">
                <p className="bf-ledger__label">What we&rsquo;d build</p>
                <ul className="bf-ledger__list">
                  {ind.wouldBuild.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="bf-ledger__cell">
                <p className="bf-ledger__label">Where we&rsquo;ve built it</p>
                {ind.evidence.length ? (
                  <ul className="bf-ledger__list">
                    {ind.evidence.map((e) => (
                      <li key={e.href + e.label}>
                        <a href={e.href}>{e.label}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="bf-ledger__none">No delivered work yet</p>
                )}
                {ind.note ? <p className="bf-ledger__note">{ind.note}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
