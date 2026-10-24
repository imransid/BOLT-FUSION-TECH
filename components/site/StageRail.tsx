"use client";

import { useId, useState, useSyncExternalStore } from "react";

import type { Stage } from "@/content/engineering-schema";

const subscribeNothing = () => () => {};

/**
 * The six stages on their rail (HowWeBuild), and — with JavaScript, from
 * 1025px — one of them selected at a time (the owner's brief, 2026-10-24,
 * §6): each stage's title is a button, and the panel under the rail shows
 * the selected stage prominently — what happens in it and what the client
 * gets — with a progress line that advances to it, and the stages before and
 * after it one press away. Discover is selected first.
 *
 * Complete without JavaScript, and on a phone at every moment: each stage
 * shows what happens in it and what you get, down the rail. With the picker
 * live at >=1025 the description moves into the panel (the column keeps the
 * deliverable), so nothing is said twice in one view. The panel exists only
 * once the picker does: a server-rendered panel would be a second copy of the
 * stages for a reader with no way to change it.
 *
 * The rail itself is the Signal's `rail` hook, untouched: the hairline, and
 * each stage as its station (`data-bf-trace-stop`, its square marker). The
 * selection never moves or lights a station — the trace owns those — and
 * text never moves: the selected stage changes colour only.
 */
export default function StageRail({ stages }: { stages: readonly Stage[] }) {
  const panelId = `stages${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [active, setActive] = useState(0);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const s = stages[active];
  const prev = stages[active - 1];
  const next = stages[active + 1];

  return (
    <div className="bf-stagepick" data-stage-picker={mounted ? "" : undefined}>
      <div className="bf-rail" data-bf-trace="rail">
        <svg className="bf-trace bf-rail__line" aria-hidden="true" focusable="false">
          <line className="bf-trace__path" x1="0" y1="0.5" x2="100%" y2="0.5" />
        </svg>
        <ol className="bf-stages">
          {stages.map((st, i) => (
            <li key={st.id} className={`bf-stage${mounted && i === active ? " is-active" : ""}`} data-bf-trace-stop="">
              <div className="bf-stage__body" data-bf-reveal>
                <span className="bf-stage__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="bf-stage__title">
                  {mounted ? (
                    <button type="button" className="bf-stage__pick" aria-pressed={i === active} aria-controls={panelId} onClick={() => setActive(i)}>
                      {st.title}
                    </button>
                  ) : (
                    st.title
                  )}
                </h3>
                <p className="bf-stage__does">{st.does}</p>
                <p className="bf-stage__gets">{st.gets}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {mounted ? (
        <div className="bf-stagepanel" id={panelId} aria-live="polite">
          <div className="bf-stagepanel__progress" aria-hidden="true">
            <span className="bf-stagepanel__fill" style={{ transform: `scaleX(${(active + 1) / stages.length})` }} />
          </div>
          <div className="bf-stagepanel__body">
            <p className="bf-stagepanel__title">{s.title}</p>
            <p className="bf-stagepanel__does">{s.does}</p>
            <div className="bf-stagepanel__gets">
              <p className="bf-stagepanel__label">What you get</p>
              <p>{s.gets}</p>
            </div>
          </div>
          <p className="bf-stagepanel__nav">
            {prev ? (
              <button type="button" className="bf-stagepanel__step" onClick={() => setActive(active - 1)}>
                <span aria-hidden="true">←</span> {prev.title}
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button type="button" className="bf-stagepanel__step" onClick={() => setActive(active + 1)}>
                {next.title} <span aria-hidden="true">→</span>
              </button>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
