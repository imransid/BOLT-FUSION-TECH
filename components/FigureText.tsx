import { Fragment, type ReactNode } from "react";

import { figureLabels, type FigureLabel } from "@/content/figure-labels";

/**
 * A sentence with its figures labelled — or exempted — where they sit.
 * CLAUDE.md: "a figure counts wherever it sits, inside a sentence too".
 *
 * Every entry in content/figure-labels.ts whose text occurs in `text` is wrapped
 * in a span of its own:
 * - a label carries `data-status`, with the visible shipped/target chip straight
 *   after the figure INSIDE that wrapper: the chip belongs to that figure, never
 *   to the sentence or the section around it;
 * - an exemption carries `data-figure-exempt` with its reason, and no chip.
 * The words are never changed. Where two entries start at the same place the
 * longer wins, so "~$0.001 per search (budgeted)" is one figure, not "~$0.001
 * per search" followed by loose text.
 *
 * No hooks and no "use client": it renders inside server and client components
 * alike. The chip, .tw-figchip, is styled in app/techwix.css with the encoding
 * of the metric chips: teal = shipped, amber = target, following the band.
 */
export default function FigureText({ text }: { text: string }) {
  const hits: { at: number; label: FigureLabel }[] = [];
  for (const label of figureLabels) {
    for (let at = text.indexOf(label.text); at >= 0; at = text.indexOf(label.text, at + label.text.length))
      hits.push({ at, label });
  }
  if (!hits.length) return <>{text}</>;
  hits.sort((a, b) => a.at - b.at || b.label.text.length - a.label.text.length);

  const out: ReactNode[] = [];
  let pos = 0;
  for (const { at, label } of hits) {
    if (at < pos) continue; /* inside a figure already marked */
    if (at > pos) out.push(<Fragment key={`t${pos}`}>{text.slice(pos, at)}</Fragment>);
    if ("exempt" in label) {
      out.push(
        <span key={`f${at}`} data-figure-exempt={label.exempt}>
          {label.text}
        </span>,
      );
    } else {
      out.push(
        <span key={`f${at}`} data-status={label.status}>
          {label.text}
          <span className="tw-figchip">{label.status}</span>
        </span>,
      );
    }
    pos = at + label.text.length;
  }
  if (pos < text.length) out.push(<Fragment key={`t${pos}`}>{text.slice(pos)}</Fragment>);
  return <>{out}</>;
}
