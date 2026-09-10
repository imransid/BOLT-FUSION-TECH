"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Drives [data-reveal] elements (lib/reveal.ts). Renders nothing.
 *
 * Runs after hydration. Anything in or above the viewport by then has already
 * played its CSS entrance and is left alone. Anything still below the viewport
 * is marked `pending` — hidden while nobody can see it — and revealed when it
 * enters, with the same -40px bottom margin framer used. A flick or a jump
 * (End, an anchor link) can carry an element past the viewport without it ever
 * intersecting, so every scroll also reveals pending elements that are no
 * longer below the fold. Under prefers-reduced-motion it does nothing.
 */
export default function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    const pending = new Set<HTMLElement>();
    const show = (el: HTMLElement) => {
      pending.delete(el);
      io.unobserve(el);
      el.dataset.reveal = "in";
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting || e.boundingClientRect.bottom < 0) show(e.target as HTMLElement);
      },
      { rootMargin: "0px 0px -40px 0px" },
    );

    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.dataset.reveal) continue; /* already pending / in / done */
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.dataset.reveal = "pending";
        pending.add(el);
        io.observe(el);
      }
    }

    let frame = 0;
    const sweep = () => {
      frame = 0;
      for (const el of pending) if (el.getBoundingClientRect().top < window.innerHeight) show(el);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sweep);
    };
    /* Once an entrance or a reveal has finished, drop the reveal styles so the
       element's own transitions (hover and the like) apply again. */
    const settle = (ev: Event) => {
      const el = ev.target as HTMLElement;
      if (el.dataset?.reveal === "" || el.dataset?.reveal === "in") el.dataset.reveal = "done";
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("animationend", settle);
    document.addEventListener("transitionend", settle);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("animationend", settle);
      document.removeEventListener("transitionend", settle);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
