import { engineering } from "@/content/engineering";
import type { Capability } from "@/content/engineering-schema";
import { SCHEDULE_HREF, SCHEDULE_LABEL } from "@/content/site-schema";
import { workLabel, workLink } from "@/lib/work-links";

import Cta from "../Cta";
import CapabilityDiagram from "../diagrams";
import DomainGlyph from "../DomainGlyph";
import SectionHead from "../SectionHead";
import TierChip, { TierLegend } from "../TierChip";

/** One capability, one ruled row: its name, its one-line job, every evidence
 *  tier it carries (with its scope where it has one), the work it links, "in
 *  depth" to its section on /capabilities, and its own diagram at a compact
 *  size. Robotics is Lab: its honesty line is a visible element marked
 *  `data-honesty`, in SPEC §8b.7's words, and "Concept — not a shipped system"
 *  is visible at every width — the diagram's figcaption from 768px, and below
 *  that, where the ledger shows no diagram, a concept tag beside the Lab chip
 *  (one of the two is shown at any width; app/site.css). The row carries the
 *  capability's id, so `#software` … `#cloud` land on the homepage as they
 *  always have. */
function Row({ c, n }: { c: Capability; n: number }) {
  const titleId = `cap-${c.id}-title`;
  const workId = `cap-${c.id}-work`;
  const work = c.workSlugs.map(workLink);
  return (
    <li id={c.id} data-capability={c.id} className="bf-cap6">
      <span className="bf-cap6__num" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <div className="bf-cap6__text" data-bf-reveal>
        <h3 id={titleId} className="bf-cap6__name">
          <DomainGlyph id={c.id} className="bf-cap6__glyph" />
          {c.name}
        </h3>
        <p className="bf-cap6__job">{c.job}</p>
        <div className="bf-cap6__tiers">
          {c.evidence.map((e) => (
            <TierChip key={e.tier} tier={e.tier} scope={e.scope} />
          ))}
          {c.diagram.caption ? <span className="bf-concept bf-cap6__concept">{c.diagram.caption}</span> : null}
        </div>
        {c.honesty ? (
          <p className="bf-honesty bf-cap6__honesty" data-honesty>
            {c.honesty}
          </p>
        ) : null}
        {work.length ? (
          <div className="bf-cap6__work">
            <p id={workId} className="bf-cap6__label">
              {workLabel(c)}
            </p>
            <ul aria-labelledby={workId}>
              {work.map((w) => (
                <li key={w.id}>
                  <a href={w.href}>{w.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Cta href={c.cta.href} variant="quiet" className="bf-cap6__more">
          {c.cta.label}
        </Cta>
      </div>
      <figure className="bf-cap6__figure" data-bf-flow>
        <div className="bf-cap__plate bf-cap6__plate">
          <CapabilityDiagram capability={c} />
        </div>
        {c.diagram.caption ? <figcaption className="bf-cap__caption">{c.diagram.caption}</figcaption> : null}
      </figure>
    </li>
  );
}

/**
 * "What we engineer" (SPEC §5), since 2026-09-28 a ledger that absorbed the
 * six capability deep dives (DECISIONS 2026-09-28, item 1): one ruled row per
 * capability, each with everything a buyer scans for — the job, the evidence
 * tier, the linked work — its own diagram, and "in depth" to the same
 * capability on /capabilities, where the deep dive is. Never tabs and never a
 * track: every row, its tier chip and robotics' honesty line are always shown
 * (verify-site check 33). The tier legend sits under the heading, where the
 * tiers are first used.
 *
 * The diagrams sit beside their row from 1025px — 440px wide from 1280
 * (labels 12.3–15.8px), 420px below that (11.7–15.1px) — and under it at
 * 768–1024 (up to 440px, 12.1–15.5px); below 768px the ledger shows none — at
 * a phone's width their labels would fall under 13px — and each row links to
 * its diagram on /capabilities. Robotics' caption stays, beside its Lab chip.
 *
 * The Service JSON-LD is tied to this section (app/page.tsx): one node per
 * capability, emitted when the ledger renders.
 *
 * The ledger ends in a Schedule a Call (on a phone since the merge,
 * 2026-09-29; at every width since fix pass B): having read what we
 * engineer, the next step is one tap away. On a phone how we work's and the
 * final call's were about 7,500px apart; at 1440 six viewports in a row
 * showed none on the way down (verify-site check 36).
 */
export default function WhatWeEngineer() {
  const h = engineering.headings.whatWeEngineer;
  return (
    <section id="what-we-engineer" className="bf-section bf-ledger6-sec" aria-labelledby="what-title">
      <div className="bf-wrap">
        <div className="bf-ledger6__head">
          <SectionHead id="what-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} className="bf-head--chapter" />
          <TierLegend />
        </div>
        <ol className="bf-ledger6">
          {engineering.capabilities.map((c, i) => (
            <Row key={c.id} c={c} n={i + 1} />
          ))}
        </ol>
        <p className="bf-actions bf-ledger6__cta">
          <Cta href={SCHEDULE_HREF} cta="schedule">
            {SCHEDULE_LABEL}
          </Cta>
        </p>
      </div>
    </section>
  );
}
