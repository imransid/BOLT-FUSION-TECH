import { Fragment, type ReactNode } from "react";

import { figureLabels, type FigureLabel } from "@/content/figure-labels";

/**
 * A sentence with its figures labelled where they sit — CLAUDE.md: "a figure
 * counts wherever it sits, inside a sentence too".
 *
 * Every entry in content/figure-labels.ts whose text occurs in `text` is wrapped
 * in a span carrying `data-status`, with the visible shipped/target chip straight
 * after the figure INSIDE that wrapper: the chip belongs to that figure, never to
 * the sentence or the section around it. The words are never changed. Where two
 * entries start at the same place the longer wins, so "~$0.001 per search
 * (budgeted)" is one figure, not "~$0.001 per search" followed by loose text.
 *
 * No hooks and no "use client": it renders inside server and client components
 * alike. `variant` picks the chip's look and nothing else — the wrapper, the
 * words and the label are the same either way:
 *  · "site" (the default): the other pages' encoding, as the KPI cards there —
 *    cyan = shipped, amber = target, machine face;
 *  · "clone": the homepage's chip (`.tw-chip`, app/(home)/techwix.css), in the
 *    homepage's faces, since the machine face is not loaded there.
 */
export default function FigureText({ text, variant = "site" }: { text: string; variant?: "site" | "clone" }) {
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
    const shipped = label.status === "shipped";
    out.push(
      <span key={`f${at}`} data-status={label.status}>
        {label.text}
        {variant === "clone" ? (
          <span className={`tw-chip tw-chip--${label.status} tw-chip--inline`}>{label.status}</span>
        ) : (
          <span
            className={`ml-1.5 inline-block rounded-full border px-2 py-px align-[0.08em] text-[10px] leading-[1.5] ${
              shipped ? "border-cyan-200/45 text-cyan-200" : "border-amber-300/50 text-amber-300"
            }`}
            style={{ fontFamily: "var(--font-machine)" }}
          >
            {label.status}
          </span>
        )}
      </span>,
    );
    pos = at + label.text.length;
  }
  if (pos < text.length) out.push(<Fragment key={`t${pos}`}>{text.slice(pos)}</Fragment>);
  return <>{out}</>;
}
