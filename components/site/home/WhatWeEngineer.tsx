import { engineering } from "@/content/engineering";

import DomainGlyph from "../DomainGlyph";
import SectionHead from "../SectionHead";
import TierChip, { TierLegend } from "../TierChip";

/**
 * "What we engineer" (SPEC §5): the six domains as an index — each with its
 * one-line job, its evidence tier and a link to its section below. A ruled
 * grid, not a row of cards: the cells share hairlines, like a table of
 * contents. The tier legend sits under it, where the tiers are first used.
 */
export default function WhatWeEngineer() {
  const h = engineering.headings.whatWeEngineer;
  return (
    <section id="what-we-engineer" className="bf-section" aria-labelledby="what-title">
      <div className="bf-wrap">
        <SectionHead id="what-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <ul className="bf-index">
          {engineering.capabilities.map((c) => (
            <li key={c.id} className="bf-index__cell">
              <a href={`#${c.id}`} className="bf-index__link">
                <DomainGlyph id={c.id} className="bf-index__glyph" />
                <h3 className="bf-index__name">{c.name}</h3>
                <p className="bf-index__job">{c.job}</p>
                <span className="bf-index__tier">
                  <TierChip tier={c.evidence[0].tier} />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <TierLegend />
      </div>
    </section>
  );
}
