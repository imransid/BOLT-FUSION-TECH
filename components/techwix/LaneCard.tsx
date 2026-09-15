import type { ReactNode } from "react";

import { Bullets } from "./Tags";

/**
 * One step of a write-up's sequence — a search lane, a pipeline stage — as the
 * homepage's lane card: a marker row (the lane or step number, then its traffic
 * and latency or its tag), the h3, a summary, the bullets and a footer line.
 * Bullets go through <FigureText>, so a figure in one carries its chip.
 * Render inside <ul className="tw-lanes">.
 */
export default function LaneCard({
  marker,
  meta,
  tag,
  title,
  summary,
  bullets,
  foot,
}: {
  marker: ReactNode;
  meta?: ReactNode;
  tag?: string;
  title: string;
  summary: ReactNode;
  bullets: readonly string[];
  foot?: ReactNode;
}) {
  return (
    <li className="tw-lane" data-tw-reveal>
      <div className="tw-lane__head">
        {/* The number in its own box, inside the circle: the text's box is then
            wholly on the blue, not a square whose corners are the card's white */}
        <span className="tw-step__num">
          <span>{marker}</span>
        </span>
        {meta ? <span className="tw-lane__meta">{meta}</span> : null}
        {tag ? <span className="tw-pill">{tag}</span> : null}
      </div>
      <h3 className="tw-title-wrapper">
        <span className="title-small">{title}</span>
      </h3>
      <p>{summary}</p>
      <Bullets items={bullets} />
      {foot ? <p className="tw-lane__foot">{foot}</p> : null}
    </li>
  );
}
