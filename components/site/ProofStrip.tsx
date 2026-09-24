import FigureText from "@/components/FigureText";
import { metrics } from "@/content";

import StatusChip from "./StatusChip";

/**
 * The proof strip: the four figures in content/metrics.ts, each with its label,
 * its shipped/target status and a link to the write-up it comes from — nothing
 * here is a bare number. Moved from the hero to the engineering stories on
 * 2026-09-16 (SPEC §5), unchanged in structure.
 *
 * The figure's chip sits BESIDE the figure, in the figure's own row, and that
 * row names the metric it shows (`data-metric`, the id in content/metrics.ts):
 * the chip's owner is explicit. A label can carry a figure of its own with its
 * own chip ("Search response, 80% of traffic" — the 80% is a target, the
 * <100ms is shipped), and a chip down in the label or beside the source would
 * read as the figure's. verify-site checks 8 and 28 attribute the figure's
 * status from this row only.
 */
export default function ProofStrip({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="bf-proof" data-bf-reveal>
      <h3 id={id} className="bf-proof__title">
        {title}
      </h3>
      <ul className="bf-proof__list" aria-labelledby={id}>
        {metrics.map((m) => (
          <li key={m.id} className="bf-proof__item">
            <p className="bf-proof__top" data-metric={m.id}>
              <span className="bf-proof__figure">{m.value}</span>
              <StatusChip status={m.status} />
            </p>
            <p className="bf-proof__label">
              <FigureText text={m.label} />
            </p>
            <p className="bf-proof__meta">
              {m.href ? (
                <a className="bf-proof__source" href={m.href}>
                  {m.source}
                </a>
              ) : (
                <span>{m.source}</span>
              )}
            </p>
          </li>
        ))}
      </ul>
      <p className="bf-proof__note">{note}</p>
    </div>
  );
}
