import { engineering } from "@/content/engineering";

import SectionHead from "../SectionHead";

/**
 * Technical depth, by layer (SPEC §5), exactly the SPEC's list: a cross-section
 * of strata, product at the top and infrastructure at the bottom. Stack names
 * are machine values: Barlow 500 with tabular figures. No Kubernetes, Kafka or
 * RabbitMQ — the schema refuses them until the owner confirms them.
 */
export default function TechnicalDepth() {
  const h = engineering.headings.depth;
  return (
    <section id="technical-depth" className="bf-section" aria-labelledby="depth-title">
      <div className="bf-wrap">
        <SectionHead id="depth-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
        <dl className="bf-strata" data-bf-reveal>
          {engineering.depth.map((layer) => (
            <div key={layer.id} className="bf-strata__row">
              <dt className="bf-strata__name">{layer.name}</dt>
              <dd className="bf-strata__items">
                <ul>
                  {layer.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
