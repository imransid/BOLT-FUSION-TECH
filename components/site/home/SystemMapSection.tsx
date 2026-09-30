import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";
import SystemMap from "../SystemMap";

/** The system map's section: the heading, then the map and its lists
 *  (components/site/SystemMap), on the faint engineering grid — the only
 *  place besides the hero that carries it (SPEC §3). On /capabilities, after
 *  the six, since 2026-09-28; it was the homepage's until then. */
export default function SystemMapSection() {
  const h = engineering.headings.systemMap;
  return (
    <section id="system-map" className="bf-section bf-section--grid" aria-labelledby="map-title">
      <div className="bf-wrap">
        <SectionHead id="map-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <SystemMap map={engineering.systemMap} />
      </div>
    </section>
  );
}
