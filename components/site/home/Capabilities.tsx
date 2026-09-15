import FigureText from "@/components/FigureText";
import { projects } from "@/content";
import { engineering } from "@/content/engineering";
import type { Capability } from "@/content/engineering-schema";

import Cta from "../Cta";
import CapabilityDiagram from "../diagrams";
import DomainGlyph from "../DomainGlyph";
import TierChip from "../TierChip";

/** Where a linked project is shown: its write-up, or its card on /work. Feature
 *  work says so — it is features in another company's app, never the app. */
function workLink(slug: string) {
  const p = projects.find((x) => x.id === slug);
  if (!p) throw new Error(`content/engineering.ts links "${slug}", which is not in content/projects.ts`);
  const href = p.kind === "case-study" && p.href ? p.href : `/work#${p.kind === "in-house" ? "in-house" : "projects"}`;
  return { id: p.id, name: p.scope === "features" ? `${p.name} (feature work)` : p.name, href };
}

/**
 * The six capabilities (SPEC §5), each its own full-bleed section divided from
 * the next by a hairline — text on one side, its OWN diagram on the other,
 * alternating. Each carries `id` and `data-capability` (software, ai, erp, pos,
 * robotics, cloud), its evidence tier chip (`data-tier`) with the linked work,
 * and a link to the same capability in depth on /capabilities.
 *
 * Robotics is Lab: its honesty line is a visible element marked `data-honesty`,
 * and its diagram is captioned "Concept — not a shipped system".
 */
function CapabilitySection({ c, flip }: { c: Capability; flip: boolean }) {
  const titleId = `cap-${c.id}-title`;
  const workId = `cap-${c.id}-work`;
  const work = c.workSlugs.map(workLink);
  return (
    <section id={c.id} data-capability={c.id} className={`bf-section bf-cap${flip ? " bf-cap--flip" : ""}`} aria-labelledby={titleId}>
      <div className="bf-wrap bf-cap__inner">
        <div className="bf-cap__text" data-bf-reveal>
          <p className="bf-eyebrow bf-eyebrow--glyph">
            <DomainGlyph id={c.id} className="bf-eyebrow__glyph" />
            {c.name}
          </p>
          <h2 id={titleId} className="bf-h2">
            {c.title}
          </h2>
          <p className="bf-lead">
            <FigureText text={c.body} />
          </p>
          {c.honesty ? (
            <p className="bf-honesty" data-honesty>
              {c.honesty}
            </p>
          ) : null}

          <h3 className="bf-h4">{c.buildHeading}</h3>
          {c.buildNote ? (
            <p className="bf-build__note">
              <FigureText text={c.buildNote} />
            </p>
          ) : null}
          {/* Three columns only for a long list of short, chip-free names (ERP's
              modules); a list whose items carry a tier chip keeps two, so a
              chip sits beside its label instead of under it. */}
          <ul className={`bf-build${c.whatWeBuild.length > 6 && c.whatWeBuild.every((b) => !b.tier) ? " bf-build--modules" : ""}`}>
            {c.whatWeBuild.map((b) => (
              <li key={b.label}>
                <span className="bf-build__label">
                  <FigureText text={b.label} />
                  {b.tier ? <TierChip tier={b.tier} /> : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="bf-evidence">
            <div className="bf-evidence__tiers">
              {c.evidence.map((e) => (
                <TierChip key={e.tier} tier={e.tier} scope={e.scope} />
              ))}
            </div>
            <p className="bf-evidence__note">
              <FigureText text={c.evidenceNote} />
            </p>
            {work.length ? (
              <div className="bf-evidence__work">
                <p id={workId} className="bf-evidence__label">
                  Linked work
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
          </div>

          <Cta href={c.cta.href} variant="quiet">
            {c.cta.label}
          </Cta>
        </div>

        <figure className="bf-cap__figure" data-bf-flow>
          <div className="bf-cap__plate">
            <CapabilityDiagram capability={c} />
          </div>
          {c.diagram.caption ? <figcaption className="bf-cap__caption">{c.diagram.caption}</figcaption> : null}
        </figure>
      </div>
    </section>
  );
}

export default function Capabilities() {
  return (
    <>
      {engineering.capabilities.map((c, i) => (
        <CapabilitySection key={c.id} c={c} flip={i % 2 === 1} />
      ))}
    </>
  );
}
