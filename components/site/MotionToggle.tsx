"use client";

import { useState, useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

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
 * In the server HTML it is `hidden`: without JavaScript it could do nothing.
 */
export default function MotionToggle() {
  const [paused, setPaused] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    const root = document.documentElement;
    if (next) root.dataset.motion = "paused";
    else delete root.dataset.motion;
    window.dispatchEvent(new CustomEvent("bf:motion", { detail: { paused: next } }));
  };

  return (
    <button type="button" className="bf-motion-toggle" aria-pressed={paused} onClick={toggle} hidden={!mounted}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
        {paused ? <path d="M4 2.5v11L13 8z" fill="currentColor" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />}
      </svg>
      {paused ? "Resume motion" : "Pause motion"}
    </button>
  );
}
