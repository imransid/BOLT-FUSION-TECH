import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";

/**
 * How we build (SPEC §5): six stages that really are a sequence, so they are
 * an ordered list and numbered. Each says what the client gets. At >=1025px
 * they run along one rail, left to right; below that they stack down it. The
 * zero-padded marker is decoration (aria-hidden) — the list is the order.
 *
 * The rail at >=1025px is the Signal system's `rail` hook
 * (`data-bf-trace="rail"`, CLAUDE.md "Motion, as built"): one hairline and six
 * stations — one per stage, at the start of its column — drawn complete in the
 * server HTML, so without script it is a finished drawing, the one the stages'
 * own borders and markers drew before. Where gsap runs, a brand-blue trace runs
 * along it once, left to right, lighting each station as it passes, then
 * settles back to this drawing. The stations sit at i/6 of the rail because
 * the six columns are equal and have no gap (app/site.css, "How we build").
 * Below 1025 the rail is the stages' own borders and markers, as it always was.
 */
export default function HowWeBuild() {
  const h = engineering.headings.howWeBuild;
  const n = engineering.stages.length;
  return (
    <section id="how-we-build" className="bf-section" aria-labelledby="build-title">
      <div className="bf-wrap">
        <SectionHead id="build-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <div className="bf-rail" data-bf-trace="rail">
          <svg className="bf-trace bf-rail__line" aria-hidden="true" focusable="false">
            <line className="bf-trace__path" x1="0" y1="0.5" x2="100%" y2="0.5" />
            {engineering.stages.map((s, i) => (
              <svg key={s.id} x={`${((100 * i) / n).toFixed(4)}%`} overflow="visible">
                <rect className="bf-trace__stop" data-bf-trace-stop="" x="0.5" y="-3.5" width="8" height="8" />
              </svg>
            ))}
          </svg>
          <ol className="bf-stages">
            {engineering.stages.map((s, i) => (
              <li key={s.id} className="bf-stage" data-bf-reveal>
                <span className="bf-stage__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="bf-stage__title">{s.title}</h3>
                <p className="bf-stage__gets">{s.gets}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
