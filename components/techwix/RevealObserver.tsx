"use client";

import { useEffect } from "react";

/**
 * The clone's reveal — the site's one reveal system, on every page (the
 * homepage renders it; so does components/techwix/PageShell). Renders nothing.
 *
 * Every [data-tw-reveal] element is in the server HTML, visible, in its final
 * position — the animation has `fill-mode: none`, so there is no hidden resting
 * state anywhere and the page reads fully without script. After hydration, only
 * elements still BELOW the viewport are watched; when one enters
 * (IntersectionObserver, threshold 0, fire once — the clone's measured trigger)
 * it gets `.animated` plus its animation name and slides up 3rem while fading
 * in over 1.25s. Anything already on screen is left alone: re-animating it
 * would flash text the reader is looking at. Under reduced motion nothing is
 * watched and nothing moves.
 */
export default function RevealObserver() {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("animated", el.dataset.twReveal || "techwix--slide-up");
          io.unobserve(el);
        }
      },
      { threshold: 0 },
    );
    for (const el of document.querySelectorAll<HTMLElement>("[data-tw-reveal]")) {
      if (el.getBoundingClientRect().top > window.innerHeight) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return null;
}
