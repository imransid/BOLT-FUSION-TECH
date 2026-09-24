import type { ReactNode } from "react";

import { Bullets } from "./Lists";

/**
 * One step of a write-up's sequence — a search lane, a pipeline stage — as a
 * cell of a ruled row: a marker row (the lane or step number, then its traffic
 * and latency or its tag), the h3, a summary, the bullets and a footer line.
 * Bullets go through <FigureText>, so a figure in one carries its chip.
 * Render inside <ul className="bf-lanecards">.
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
    <li className="bf-lanecard" data-bf-reveal>
      <div className="bf-lanecard__head">
        <span className="bf-lanecard__num">{marker}</span>
        {meta ? <span className="bf-lanecard__meta">{meta}</span> : null}
        {tag ? <span className="bf-lanecard__tag">{tag}</span> : null}
      </div>
      <h3 className="bf-lanecard__title">{title}</h3>
      <p className="bf-lanecard__summary">{summary}</p>
      <Bullets items={bullets} />
      {foot ? <p className="bf-lanecard__foot">{foot}</p> : null}
    </li>
  );
}
