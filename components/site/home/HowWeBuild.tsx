import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";

/**
 * How we build (SPEC §5): six stages that really are a sequence, so they are
 * an ordered list and numbered. Each says what the client gets. At >=1025px
 * they run along one rail, left to right; below that they stack down it. The
 * zero-padded marker is decoration (aria-hidden) — the list is the order.
 */
export default function HowWeBuild() {
  const h = engineering.headings.howWeBuild;
  return (
    <section id="how-we-build" className="bf-section" aria-labelledby="build-title">
      <div className="bf-wrap">
        <SectionHead id="build-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
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
    </section>
  );
}
