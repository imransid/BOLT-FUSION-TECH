import type { CSSProperties } from "react";

/**
 * An element that animates in — rendered VISIBLE by the server.
 *
 * framer's `initial={{ opacity: 0 }}` wrote `opacity:0` into the server HTML,
 * so without JavaScript most of both case studies was invisible, and with it
 * the text above the fold stayed unreadable until hydration (2.2s on the
 * homepage). Here the server sends the element as it should look; the motion
 * lives in app/globals.css (REVEAL) and components/RevealController.tsx:
 *
 * - on first paint every reveal element plays a CSS entrance — the ones in the
 *   first viewport are the ones anyone sees, and it needs no script;
 * - after hydration the controller hides only what is still BELOW the viewport
 *   (off-screen, so nobody sees it disappear) and reveals it when it scrolls in,
 *   or at once if a flick or a jump carried it past;
 * - under prefers-reduced-motion nothing hides and nothing moves.
 *
 * `x` / `y` are the offset the element travels from, in px; `duration` and
 * `delay` are in seconds and may be expressions (`i * 0.15`).
 */
export type RevealOptions = { x?: number; y?: number; duration?: number; delay?: number };

export function reveal(
  { x = 0, y = 0, duration = 0.5, delay = 0 }: RevealOptions = {},
  style?: CSSProperties,
) {
  return {
    "data-reveal": "",
    style: {
      ...style,
      "--reveal-x": `${x}px`,
      "--reveal-y": `${y}px`,
      "--reveal-duration": `${duration}s`,
      "--reveal-delay": `${delay}s`,
    } as CSSProperties,
  };
}
