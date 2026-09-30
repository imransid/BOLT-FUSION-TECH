"use client";

import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

/* The paused state has ONE home: <html data-motion="paused">, which survives
   a client-side navigation. The button reads it, and re-reads it whenever it
   changes, so a button that remounts — Back and Forward after the header's
   logo — can never disagree with it. Until 2026-09-29 it kept its own copy in
   React state, which reset to "not paused" on remount: the page was paused,
   the button said "Pause motion", and its first press only changed the label
   (the engineering review). */
const subscribeMotion = (onChange: () => void) => {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => mo.disconnect();
};
const isPaused = () => document.documentElement.dataset.motion === "paused";

/**
 * The hero's pause control (SPEC §3: "a pause control appears on anything that
 * moves for more than five seconds"; WCAG 2.2.2).
 *
 * What moves in the hero: the poster's slow drift below 1025px or on a coarse
 * pointer, and — from the 3D wave — the scene at >=1025px with a fine pointer.
 * The button shows only where one of them runs: app/site.css reveals it under
 * no-preference motion at those widths, and wherever the hero carries
 * `data-scene="live"` (the 3D scene sets it while its loop runs). Under reduced
 * motion nothing moves and the button never shows.
 *
 * The contract, for the 3D scene: pausing sets `data-motion="paused"` on
 * <html> and dispatches `bf:motion` on window with `detail: { paused }`. The
 * scene stops its loop on `paused: true` and resumes on `false`; the CSS drift
 * reads the attribute.
 *
 * Its state is said once, by its label — "Pause motion" or "Resume motion" —
 * and not also by `aria-pressed`, which made a screen reader announce
 * "Resume motion, toggle button, pressed" (2026-09-29).
 *
 * In the server HTML it is invisible: without JavaScript it could do nothing.
 * It is `visibility: hidden` (so neither focusable nor read) until it carries
 * `data-ready` after mount, and app/site.css shows it only where something
 * moves. It keeps its space the whole time, so appearing never shifts the page.
 * As `hidden` it moved the hero text 42px when it appeared: CLS 0.0085 at 1440
 * when the scene went live, and 0.0245 at 390 at hydration (2026-09-16).
 */
export default function MotionToggle() {
  const paused = useSyncExternalStore(subscribeMotion, isPaused, () => false);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const toggle = () => {
    const next = !isPaused();
    const root = document.documentElement;
    if (next) root.dataset.motion = "paused";
    else delete root.dataset.motion;
    window.dispatchEvent(new CustomEvent("bf:motion", { detail: { paused: next } }));
  };

  return (
    <button type="button" className="bf-motion-toggle" onClick={toggle} data-ready={mounted ? "" : undefined}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
        {paused ? <path d="M4 2.5v11L13 8z" fill="currentColor" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />}
      </svg>
      {paused ? "Resume motion" : "Pause motion"}
    </button>
  );
}
