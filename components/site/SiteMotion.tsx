"use client";

import { useEffect } from "react";

/**
 * The site's quiet motion outside the hero (SPEC §3). Renders nothing.
 *
 *  · Reveal: an element marked `data-bf-reveal` that is still BELOW the fold
 *    after hydration gets `.bf-revealed` when it enters the viewport — a short
 *    rise and fade (app/site.css), `fill-mode: none`. It is in the server HTML,
 *    visible and in place; nothing is ever hidden at rest, so the page reads
 *    fully without script. Anything already on screen, or above it, is left
 *    alone. Which is which is the observer's own FIRST report, not a
 *    measurement taken when this effect runs: after a client-side navigation
 *    the effect runs as the new page mounts, and a position read then can be
 *    the old page's (2026-09-29: 0 of 39 reveals ran after the logo was
 *    followed from the bottom of /capabilities, while the new page
 *    smooth-scrolled up from 10201 — app/layout.tsx's data-scroll-behavior
 *    ended the scroll; this ends the dependence on when it ends).
 *  · Flow: a diagram marked `data-bf-flow` gets `.bf-flowing` once it is well
 *    into the viewport, and its cyan flow lines run three passes along their
 *    paths — under five seconds in all, so nothing moves long enough to need a
 *    pause control (WCAG 2.2.2) — and then rest.
 *    One owner per diagram: where the Signal system runs (components/motion —
 *    a desktop that allows motion, once gsap has arrived) it claims the
 *    diagrams still ahead with `data-bf-motion="gsap"`, traces them and starts
 *    the flow itself, with two passes. A claimed diagram is skipped here and
 *    stays watched, so one the engine gives back (its gate stopped holding)
 *    flows here when it is next seen. Until gsap arrives, and wherever it never
 *    does, this is the whole flow. A concept drawing (the Lab tier) has no
 *    flow lines at all (components/site/diagrams.tsx): the class lands on it
 *    here and nothing moves, on every profile.
 *  · Focus ends a reveal: tabbing into a block below the fold never watches it
 *    fade in around the focused control.
 *
 * Under reduced motion nothing is watched and nothing moves. Transform and
 * opacity only.
 */
export default function SiteMotion() {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    /* the elements whose first report has come: on screen or above it then,
       they are left alone; below the fold, they are watched */
    const reported = new WeakSet<Element>();
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!reported.has(e.target)) {
            reported.add(e.target);
            const below = !e.isIntersecting && e.boundingClientRect.top >= (e.rootBounds?.height ?? window.innerHeight);
            if (!below) reveal.unobserve(e.target);
            continue;
          }
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
          if (!e.isIntersecting || e.target.getAttribute("data-bf-motion") === "gsap") continue;
          e.target.classList.add("bf-flowing");
          flow.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );

    for (const el of document.querySelectorAll<HTMLElement>("[data-bf-reveal]")) reveal.observe(el);
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
