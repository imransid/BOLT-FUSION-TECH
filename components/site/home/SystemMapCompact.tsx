import { countWord } from "@/content";
import { engineering } from "@/content/engineering";
import { workLink } from "@/lib/work-links";

import SystemMap, { type MapCompact } from "../SystemMap";

/**
 * The compact system map (the owner's brief, 2026-10-24, §5), at the top of
 * what we engineer on the homepage: how the six capabilities fit together,
 * before the ledger takes them one at a time. The same map and the same data
 * as /capabilities (content/engineering.ts) — its seven parts, robotics among
 * them as a dashed Concept — with the parts listed as the no-JS view, and
 * the connections and worked flows one link away on /capabilities.
 *
 * What a selected part links to is worked out here, from the capabilities
 * the part belongs to: their published work (lib/work-links, the ledger's
 * own links, so a feature-work project says so) and each one "in depth".
 * Nothing new is claimed: a part whose capabilities have no linked work, as
 * robotics has none, says "nothing delivered yet".
 */
export default function SystemMapCompact() {
  const h = engineering.headings.systemMapHome;
  const caps = new Map(engineering.capabilities.map((c) => [c.id, c]));
  const related: MapCompact["related"] = {};
  for (const n of engineering.systemMap.nodes) {
    const of = n.capabilityIds.map((id) => {
      const c = caps.get(id);
      if (!c) throw new Error(`the map's part "${n.id}" names the capability "${id}", which content/engineering.ts does not have`);
      return c;
    });
    const work = [...new Map(of.flatMap((c) => c.workSlugs).map((slug) => [slug, workLink(slug)])).values()];
    related[n.id] = { work, depth: of.map((c) => c.cta) };
  }
  return (
    <div className="bf-mapsec">
      <div className="bf-mapsec__head" data-bf-reveal>
        <p className="bf-eyebrow">{h.eyebrow}</p>
        <h3 className="bf-mapsec__title">{h.title}</h3>
        {h.lead ? <p className="bf-mapsec__lead">{h.lead}</p> : null}
      </div>
      <SystemMap
        map={engineering.systemMap}
        compact={{
          related,
          more: {
            label: `Every connection, and ${countWord(engineering.systemMap.flows.length)} worked flows, on the capabilities page`,
            href: "/capabilities#system-map",
          },
        }}
      />
    </div>
  );
}
