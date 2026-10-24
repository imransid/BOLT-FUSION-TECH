import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";
import StageRail from "../StageRail";

/**
 * How we build (SPEC §5): six stages that really are a sequence, so they are
 * an ordered list and numbered. Each says what the client gets. At >=1025px
 * they run along one rail, left to right; below that they stack down it. The
 * zero-padded marker is decoration (aria-hidden) — the list is the order.
 *
 * The rail at >=1025px is the Signal system's `rail` hook
 * (`data-bf-trace="rail"`, CLAUDE.md "Motion, as built"): one hairline drawn
 * complete in the server HTML, and the six stages are its stations
 * (`data-bf-trace-stop`) — each stage's own square marker, where its column
 * starts, so the stations follow the grid whatever it does and snap to whole
 * pixels. Without script it is a finished drawing, the one the stages' top
 * borders drew before. Where gsap runs, a brand-blue trace runs along it once,
 * left to right, lighting each station as it passes, and settles lit: the six
 * markers filled and the line brand blue (2026-09-29; it went back to the
 * hollow drawing until then, 0.3s after the last station lit).
 * The rail holds still: each stage's text reveals (`.bf-stage__body`), and its
 * border and marker stay where they are at every width. Below 1025 the rail is
 * the stages' own borders and markers.
 *
 * Since 2026-10-24 the rail is rendered by `StageRail` (the owner's brief,
 * §6), its markup unchanged: with JavaScript, from 1025px, one stage is
 * selected at a time and a panel under the rail shows what happens in it and
 * what the client gets.
 */
export default function HowWeBuild() {
  const h = engineering.headings.howWeBuild;
  return (
    <section id="how-we-build" className="bf-section" aria-labelledby="build-title">
      <div className="bf-wrap">
        <SectionHead id="build-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <StageRail stages={engineering.stages} />
      </div>
    </section>
  );
}
