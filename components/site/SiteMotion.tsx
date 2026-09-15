"use client";

import { useEffect } from "react";

/**
 * The site's quiet motion outside the hero (SPEC §3). Renders nothing.
 *
 *  · Reveal: an element marked `data-bf-reveal` that is still BELOW the fold
 *    after hydration gets `.bf-revealed` when it enters the viewport — a short
 *    rise and fade (app/site.css), `fill-mode: none`. It is in the server HTML,
 *    visible and in place; nothing is ever hidden at rest, so the page reads
 *    fully without script. Anything already on screen is left alone.
 *  · Flow: a diagram marked `data-bf-flow` gets `.bf-flowing` once it is well
 *    into the viewport, and its cyan flow lines run three passes along their
 *    paths — under five seconds in all, so nothing moves long enough to need a
 *    pause control (WCAG 2.2.2) — and then rest.
 *  · Focus ends a reveal: tabbing into a block below the fold never watches it
 *    fade in around the focused control.
 *
 * Under reduced motion nothing is watched and nothing moves. Transform and
 * opacity only.
 */
export default function SiteMotion() {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("bf-revealed");
          reveal.unobserve(e.target);
        }
      },
      { threshold: 0 },
    );
    const flow = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("bf-flowing");
          flow.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );

    for (const el of document.querySelectorAll<HTMLElement>("[data-bf-reveal]"))
      if (el.getBoundingClientRect().top > window.innerHeight) reveal.observe(el);
    for (const el of document.querySelectorAll<HTMLElement>("[data-bf-flow]")) flow.observe(el);

    const onFocus = (e: FocusEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-bf-reveal]") : null;
      if (!el) return;
      reveal.unobserve(el);
      for (const a of el.getAnimations()) a.finish();
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      reveal.disconnect();
      flow.disconnect();
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
