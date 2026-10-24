"use client";

import { useEffect } from "react";

/* The graphite screens a light can fall on: the things a machine draws. */
const LIT_SCREENS = ".bf-flowpg, .bf-proof, .bf-map__canvas, .bf-cap__plate, .bf-code__box";
/* A mouse on a desktop that allows motion. Never a touch screen, where
   there is no pointer to follow, and never under reduced motion. */
const GATE = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * The screens catch the light (2026-10-24, the owner: "more creative and
 * beautiful and powerful motion"; the brief's §5, "a faint light responds to
 * pointer position in a contained visual area"). Over a graphite screen a
 * soft cobalt light follows the mouse, as light falls on a screen's glass;
 * it fades in on entry and out on leave. The light is the screen's own
 * `::before`, under its content (app/site.css), so it never covers a word,
 * and it is never there at rest — every reading of the page, contrast
 * included, sees the screen as the server drew it.
 *
 * One passive pointermove listener for the page, at most one write a frame:
 * two custom properties and an attribute on the screen under the pointer.
 * Touch input is ignored by type as well as by the media gate, and the gate
 * is watched live — reduced motion switched on puts every light out. Renders
 * nothing; with no script there is no light, and nothing is missing.
 */
export default function ScreenLight() {
  useEffect(() => {
    const mq = window.matchMedia(GATE);
    let lit: HTMLElement | null = null;
    let frame = 0;
    let last: PointerEvent | null = null;

    const out = () => {
      lit?.removeAttribute("data-light");
      lit = null;
    };
    const paint = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const screen = e.target instanceof Element ? e.target.closest<HTMLElement>(LIT_SCREENS) : null;
      if (screen !== lit) out();
      if (!screen) return;
      const r = screen.getBoundingClientRect();
      screen.style.setProperty("--bf-lx", `${Math.round(e.clientX - r.left)}px`);
      screen.style.setProperty("--bf-ly", `${Math.round(e.clientY - r.top)}px`);
      if (!lit) {
        screen.setAttribute("data-light", "");
        lit = screen;
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => out();

    const start = () => {
      document.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
    };
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      out();
    };
    const sync = () => (mq.matches ? start() : stop());

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
